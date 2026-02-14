# 🎯 Hunter — Long-Term Memory

## Email Sequences

Built 6 vertical-specific sequences at `outbound/sequences/`:
1. `01-financial-services.md` — Compliance & reporting angle
2. `02-legal-law-firms.md` — Document automation angle
3. `03-healthcare.md` — Patient data & workflow angle
4. `04-real-estate.md` — Property management automation
5. `05-construction.md` — Project tracking & safety compliance
6. `06-recruitment-staffing.md` — Candidate pipeline automation

Each sequence: 4-touch (Day 1 intro → Day 3 value → Day 7 proof → Day 14 breakup).

## Prospect Status

- **100 prospects emailed** across verticals (batch 1 complete)
- **100 financial services targets** researched and ready for batch 2
- **20 new prospects** researched (IDs 001–020) across Legal, Financial Services, Construction, Real Estate, Recruitment, Healthcare
- All 20 at RESEARCHED stage — need contact details (names + emails) before outreach
- Prospect tracker: `prospects/outreach-tracker.csv`

## Vertical Intelligence (Feb 2026)

- **Construction:** AI adoption jumped 15%→75% in 2 years. Hot vertical. Willmott Dixon, Kier, Balfour Beatty all investing.
- **
- **Legal:** "AI paradox" — high adoption, low integration. Mid-market firms (Shoosmiths, Browne Jacobson) are sweet spot.
- **Recruitment:** Sector under cost pressure — AI automation = cost savings pitch. SThree and HeadFirst Global are top targets.
- **Real Estate:** $34B efficiency gains estimated by 2030 (Morgan Stanley). Savills/Knight Frank for enterprise, look for mid-market next.

## Infrastructure

- **Follow-up engine:** `outbound/follow-up-engine.js` — scans tracker CSV, identifies due follow-ups, drafts emails
- **Calendly link:** https://calendly.com/afrexai/demo (30-min demo slot)
- **Sender:** ksmolichki@afrexai.com

## ⚠️ DNS BLOCKED — CRITICAL

Email deliverability is **NOT READY**:
- SPF record: ❌ NOT SET
- DKIM record: ❌ NOT SET
- DMARC record: ❌ NOT SET

**ALL EMAILS MUST BE DRAFTED ONLY — DO NOT SEND** until DNS records are configured and verified. Sending now risks domain reputation and blacklisting.

## Dedup Rules

- Deduplicate by email address (primary key)
- Secondary dedup by company domain + role (catch job-hoppers with new emails)
- Never email the same person from two different sequences
- If prospect appears in inbound pipeline, pull from outbound sequence immediately

## Lessons Learned

- Financial services responds best to compliance/regulatory angles
- Legal firms care about billable hour recovery
- Keep subject lines under 6 words
- Personalize the first line with something specific (recent funding, job posting, LinkedIn post)

## TARGET MARKET
- **US ONLY** — AfrexAI is a US-based company
- Focus: US mid-market (50-500 employees)
- Top metros: NYC, Chicago, LA, Dallas, Atlanta, Miami, Boston
- Currency: USD ($)
- Verticals: Financial Services, Legal, Healthcare, Construction, Real Estate, Recruitment, Insurance
- DO NOT prospect UK/EU companies

## Geographic Correction (2026-02-14)
- IDs 001-008, 011-020 are UK-based — flagged for deprioritization
- IDs 021-030 are the first properly US-targeted batch
- All future prospecting must be US-only

## Email Draft Progress
- **10 Day 1 emails drafted** (Feb 14 evening) for US batch IDs 021-030
- Drafts at: `output/draft-cold-emails/2026-02-14-evening-batch.md`
- All personalized with company-specific hooks from research
- Strongest angles: compliance/regulatory (legal), volume-based ROI (financial services), safety compliance (construction)
- Subject lines kept under 6 words

## Infrastructure Issues
- Vault not accessible from isolated cron sessions — cannot check email replies
- Need fix: either pass credentials via env or init vault in agent workspace
- Sequence template directory (`outbound/sequences/`) is empty — drafting from tracker hooks instead
