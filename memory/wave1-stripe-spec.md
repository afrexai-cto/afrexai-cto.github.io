# Wave 1: Make AfrexAI Buyable — Implementation Spec

**Date:** 2026-02-16  
**Phase:** PLAN (PIV Framework)  
**Goal:** Prospect visits site → picks tier → pays via Stripe → auto-onboarded. Zero manual intervention.

---

## Architecture Overview

```
┌─────────────────────────┐      ┌──────────────────────────┐
│  GitHub Pages (Static)  │      │  Stripe Checkout API     │
│                         │      │  (hosted checkout page)  │
│  /pricing.html          │─────▶│                          │
│  /checkout-success.html │◀─────│                          │
│  /checkout-cancel.html  │      └──────────────────────────┘
└─────────────────────────┘                │
                                           │ webhook
                                           ▼
                              ┌──────────────────────────┐
                              │  checkout-api (Node.js)   │
                              │  Railway / Fly.io         │
                              │                           │
                              │  POST /create-session     │
                              │  POST /webhook            │
                              │  GET  /prices             │
                              └───────────┬───────────────┘
                                          │
                                          ▼
                              ┌──────────────────────────┐
                              │  autopilot.sh (SSH/exec)  │
                              │  on Mac Mini / VPS        │
                              └──────────────────────────┘
```

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend hosting | GitHub Pages (existing) | Already deployed, free, fast CDN |
| Checkout UX | Stripe Checkout (hosted) | PCI compliant, handles cards/Apple Pay/Google Pay, mobile-optimized |
| API server | Node.js on Railway | Free tier available, easy deploy, native Stripe SDK, ~5 min setup |
| Webhook processing | Same Node.js service | Single service simplicity |
| Onboarding trigger | Webhook → SSH exec autopilot.sh | Proven flow per validation report |
| Pricing source of truth | `aaas-platform/pricing.json` | Already exists, API reads it at build/startup |
| Annual billing | 15% discount (from pricing.json) | Stripe handles recurring billing natively |

---

## Stripe Products & Prices to Create

Create via Stripe Dashboard or API. Use **metadata** to link to our tier/vertical system.

### Products (4)

| Product Name | Stripe Product ID (suggested) | Description |
|---|---|---|
| AfrexAI Starter | `prod_starter` | 1 AI Agent, full integration |
| AfrexAI Growth | `prod_growth` | 3 AI Agents, multi-system |
| AfrexAI Scale | `prod_scale` | 10 AI Agents, scaling teams |
| AfrexAI Enterprise | `prod_enterprise` | 9 AI Agents, full workforce |

### Prices (8 base + premium variants)

For each product, create monthly + annual prices. Annual = monthly × 12 × 0.85.

| Tier | Monthly | Annual (per year) | Monthly Price ID | Annual Price ID |
|------|---------|-------------------|-----------------|-----------------|
| Starter | $1,500 | $15,300 | `price_starter_mo` | `price_starter_yr` |
| Growth | $4,500 | $45,900 | `price_growth_mo` | `price_growth_yr` |
| Scale | $7,500 | $76,500 | `price_scale_mo` | `price_scale_yr` |
| Enterprise | $12,000 | $122,400 | `price_enterprise_mo` | `price_enterprise_yr` |

**Vertical premiums:** Applied as separate line items or calculated server-side before session creation. Legal/Healthcare = +10%, Finance = +5%. The checkout session will use the computed price.

**Implementation approach for premiums:** Use `unit_amount` in the Stripe session (dynamic pricing) rather than creating dozens of price objects per vertical. This keeps Stripe clean and lets pricing.json remain the source of truth.

---

## File List

### New Static Pages (GitHub Pages)

| File | Purpose |
|------|---------|
| `pricing.html` | Interactive pricing page with tier cards, vertical selector, billing toggle |
| `checkout-success.html` | Post-payment success page with next-steps messaging |
| `checkout-cancel.html` | Payment cancelled — retry CTA |

### New API Service (`checkout-api/`)

| File | Purpose |
|------|---------|
| `checkout-api/package.json` | Dependencies: stripe, express, dotenv |
| `checkout-api/server.js` | Express server with 3 endpoints |
| `checkout-api/pricing.js` | Pricing calculator (reads pricing.json, applies vertical premiums) |
| `checkout-api/webhook.js` | Stripe webhook handler → triggers onboarding |
| `checkout-api/onboard.js` | SSH/exec to run autopilot.sh with customer params |
| `checkout-api/op.env` | 1Password references (STRIPE_SK, STRIPE_WEBHOOK_SECRET, SSH_KEY) |
| `checkout-api/Dockerfile` | For Railway/Fly deployment |
| `checkout-api/railway.json` | Railway config (or `fly.toml`) |

### Modified Files

| File | Change |
|------|--------|
| `aaas/index.html` | Update pricing CTA links → `/pricing.html` instead of Calendly |
| `hosted/index.html` | Same — CTAs → `/pricing.html` |

---

## API Endpoints

### `POST /create-session`

Creates a Stripe Checkout session.

**Request:**
```json
{
  "tier": "growth",
  "vertical": "legal",
  "billing": "monthly",
  "company_name": "Hartwell & Associates",
  "company_email": "info@hartwell.com"
}
```

**Logic:**
1. Look up base price from pricing.json for tier
2. Apply vertical premium percentage
3. Create Stripe Checkout session with:
   - `mode: "subscription"`
   - `line_items`: one item with calculated `unit_amount`
   - `metadata`: { tier, vertical, company_name }
   - `customer_email`: from input
   - `success_url`: `https://afrexai-cto.github.io/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url`: `https://afrexai-cto.github.io/checkout-cancel.html`
4. Return `{ url: session.url }`

**Response:** `{ "url": "https://checkout.stripe.com/..." }`

### `POST /webhook`

Stripe webhook endpoint.

**Events handled:**
- `checkout.session.completed` → trigger onboarding
- `customer.subscription.deleted` → flag for offboarding (future)

**On `checkout.session.completed`:**
1. Verify webhook signature
2. Extract metadata: tier, vertical, company_name, email
3. Execute autopilot.sh: `./autopilot.sh --company "Hartwell & Associates" --tier growth --vertical legal --email info@hartwell.com`
4. Log to `crm-log.jsonl`
5. Return 200

### `GET /prices`

Returns current pricing (for the frontend to consume if we want dynamic pricing).

**Response:**
```json
{
  "tiers": { ... },
  "vertical_premiums": { ... },
  "annual_discount_pct": 15
}
```

---

## Page Wireframes

### pricing.html

```
┌──────────────────────────────────────────────────────┐
│  NAV: logo ─────────────── [Services] [Pricing] [Book]│
├──────────────────────────────────────────────────────┤
│                                                       │
│          Choose Your AI Workforce Plan                │
│     Select your industry for accurate pricing         │
│                                                       │
│  ┌─ VERTICAL SELECTOR ─────────────────────────────┐ │
│  │ [Legal] [Healthcare] [Finance] [Construction]    │ │
│  │ [SaaS] [Professional Services] [General]         │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│          [ Monthly ◉ ]  [ ○ Annual — Save 15% ]      │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ STARTER  │ │ GROWTH   │ │ SCALE    │ │ENTERPRISE││
│  │          │ │ ★ POPULAR│ │          │ │          ││
│  │ $1,500/mo│ │ $4,500/mo│ │ $7,500/mo│ │$12,000/mo││
│  │          │ │          │ │          │ │          ││
│  │ 1 agent  │ │ 3 agents │ │10 agents │ │ 9 agents ││
│  │          │ │          │ │          │ │          ││
│  │ ✓ feat1  │ │ ✓ feat1  │ │ ✓ feat1  │ │ ✓ feat1  ││
│  │ ✓ feat2  │ │ ✓ feat2  │ │ ✓ feat2  │ │ ✓ feat2  ││
│  │ ...      │ │ ...      │ │ ...      │ │ ...      ││
│  │          │ │          │ │          │ │          ││
│  │[Get      ]│ │[Get      ]│ │[Get      ]│ │[Contact ]││
│  │[Started  ]│ │[Started  ]│ │[Started  ]│ │[Sales   ]││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                       │
│  ┌─ COST CALCULATOR ───────────────────────────────┐ │
│  │ Need more agents? Extra agents: $1,800/mo each  │ │
│  │ [ Slider: 1 ──●────── 20 agents ]               │ │
│  │ Estimated total: $X,XXX/mo                       │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  FAQ section (reuse from aaas/index.html)             │
│                                                       │
│  FOOTER                                               │
└──────────────────────────────────────────────────────┘
```

**Behavior:**
- Vertical selector highlights selected pill; prices update with premium applied
- Monthly/Annual toggle recalculates all displayed prices
- "Get Started" opens a modal or navigates to a company-details form step
- Enterprise "Contact Sales" can still go to Calendly as fallback
- All pricing rendered client-side from `/prices` endpoint or embedded JSON

### Company Details Modal/Step (pre-checkout)

```
┌────────────────────────────────────┐
│  Almost there!                     │
│                                    │
│  Company Name: [_______________]   │
│  Your Email:   [_______________]   │
│  Your Name:    [_______________]   │
│                                    │
│  Selected: Growth · Legal · $4,950/mo │
│                                    │
│  [ Proceed to Payment → ]          │
│                                    │
│  🔒 Secure checkout by Stripe      │
└────────────────────────────────────┘
```

On submit → `POST /create-session` → redirect to Stripe Checkout.

### checkout-success.html

```
┌──────────────────────────────────────┐
│                                      │
│       🎉 Welcome to AfrexAI!        │
│                                      │
│  Your AI workforce is being deployed │
│  right now. Here's what happens next:│
│                                      │
│  ✅ 1. Agents deploying (< 5 min)   │
│  📧 2. Welcome email incoming       │
│  📊 3. Dashboard access within 1hr  │
│  📞 4. Onboarding call scheduled    │
│                                      │
│  Questions? hello@afrexai.com        │
│                                      │
│  [ Go to Dashboard → ]              │
│                                      │
└──────────────────────────────────────┘
```

### checkout-cancel.html

```
┌──────────────────────────────────────┐
│                                      │
│  Payment not completed               │
│                                      │
│  No worries — nothing was charged.   │
│                                      │
│  [ ← Back to Pricing ]              │
│  [ Book a call instead → ]          │
│                                      │
└──────────────────────────────────────┘
```

---

## Purchase Flow (Step by Step)

```
1. Prospect lands on pricing.html
2. Selects vertical (e.g., Legal)
3. Prices update with vertical premium (+10%)
4. Toggles Monthly/Annual
5. Clicks "Get Started" on Growth tier
6. Modal appears: company name, email, contact name
7. Clicks "Proceed to Payment"
8. Frontend POSTs to /create-session with {tier, vertical, billing, company_name, email}
9. API creates Stripe Checkout session → returns URL
10. Frontend redirects to Stripe Checkout (hosted page)
11. Customer enters card details, pays
12. Stripe redirects to checkout-success.html
13. Stripe fires checkout.session.completed webhook → our API
14. API extracts metadata, runs autopilot.sh
15. autopilot.sh creates customer dir, generates agents, sends welcome email
16. Customer receives welcome email with dashboard link
17. Done — fully onboarded, no human touched it
```

---

## Security Considerations

- **Stripe secret key:** Retrieved at runtime via `op read "op://AfrexAI/Stripe API/secret_key"` — never in code
- **Webhook signature:** Verify using `stripe.webhooks.constructEvent()` with webhook signing secret from 1Password
- **CORS:** API allows only `https://afrexai-cto.github.io` origin
- **Rate limiting:** Basic rate limiting on `/create-session` (10 req/min per IP)
- **SSH key for autopilot:** Stored in 1Password, injected at deploy time

---

## Deployment Plan

**API Service:** Railway (recommended) or Fly.io
- Free tier covers initial traffic
- Auto-deploy from GitHub repo
- Environment variables via Railway dashboard (sourced from 1Password)
- Custom domain: `api.afrexai.com` (or `checkout-api.afrexai.com`)

**Static Pages:** Push to existing GitHub Pages repo

---

## Implementation Order

| Step | Task | Depends On | Est. Time |
|------|------|-----------|-----------|
| 1 | Create Stripe products & prices (4 products, 8 prices) | Stripe account | 30 min |
| 2 | Set up `checkout-api/` Node.js project with Express + Stripe SDK | Step 1 | 1 hr |
| 3 | Implement `POST /create-session` with pricing calculator | Step 2 | 1 hr |
| 4 | Implement `POST /webhook` with signature verification | Step 2 | 1 hr |
| 5 | Implement `onboard.js` — trigger autopilot.sh from webhook | Step 4 | 1 hr |
| 6 | Deploy API to Railway, configure env vars from 1Password | Steps 2-5 | 30 min |
| 7 | Register webhook URL in Stripe Dashboard | Step 6 | 10 min |
| 8 | Build `pricing.html` — 4-tier cards, vertical selector, billing toggle | — | 2 hr |
| 9 | Build company details modal/form in pricing.html | Step 8 | 30 min |
| 10 | Wire "Get Started" → POST /create-session → Stripe redirect | Steps 6, 9 | 30 min |
| 11 | Build `checkout-success.html` and `checkout-cancel.html` | — | 30 min |
| 12 | Update CTAs in `aaas/index.html` and `hosted/index.html` | Step 8 | 15 min |
| 13 | End-to-end test with Stripe test mode | All above | 1 hr |
| 14 | Switch to Stripe live mode, verify webhook | Step 13 | 15 min |

**Total estimated: ~10 hours**

---

## Open Questions / Decisions Needed

1. **Scale tier (10 agents at $7,500):** Exists in pricing.json but NOT on current site pages (only Starter/Growth/Enterprise shown). Should we show all 4 tiers? **Recommendation: Yes — fills the gap between $4,500 and $12,000.**
2. **Enterprise self-serve vs. sales-led:** Allow Enterprise ($12K/mo) to self-checkout, or keep as "Contact Sales"? **Recommendation: Allow self-checkout but also keep Calendly link as alternative.**
3. **API hosting:** Railway vs Fly.io? **Recommendation: Railway — simpler for single-service deploy, generous free tier.**
4. **Custom domain for API:** Need `api.afrexai.com` DNS record. Is the domain on Cloudflare/other?
5. **autopilot.sh execution:** The API server (Railway) needs to trigger autopilot.sh which runs on the Mac Mini. Options: (a) SSH from Railway → Mac Mini, (b) Webhook relay (Mac Mini polls or listens), (c) Move autopilot.sh to Railway. **Recommendation: (b) Lightweight webhook relay — Mac Mini runs a tiny listener that receives signed payloads from the API and executes autopilot.sh locally.**

---

## Summary

This spec turns AfrexAI from "book a call" to "buy now" with:
- **Static pricing page** on GitHub Pages (fast, SEO-friendly, mobile-ready)
- **Lightweight Node.js API** (~200 lines) on Railway for Stripe session creation + webhooks
- **Stripe Checkout** for PCI-compliant payment (no card handling on our side)
- **Automated onboarding** via existing autopilot.sh (validated and working)
- **4 tiers × 7 verticals × 2 billing cycles** = full product matrix, dynamic pricing

The entire purchase flow is automated end-to-end. No humans required.
