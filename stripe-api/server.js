/**
 * AfrexAI Stripe Checkout API
 *
 * Endpoints:
 *   POST /create-session  — Create a Stripe Checkout session
 *   POST /webhook          — Handle Stripe webhook events
 *   GET  /prices           — Return current pricing data
 *   GET  /health           — Health check
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const { execFile } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Config ───────────────────────────────────────────
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://afrexai-cto.github.io';

if (!STRIPE_SECRET_KEY) {
  console.error('FATAL: STRIPE_SECRET_KEY not set');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

// ─── Pricing (source of truth) ───────────────────────
const PRICING = {
  currency: 'USD',
  tiers: {
    starter:    { price: 1500, agents: 1 },
    growth:     { price: 4500, agents: 3 },
    scale:      { price: 7500, agents: 10 },
    enterprise: { price: 12000, agents: 9 }
  },
  vertical_premiums: {
    'general': 0,
    'legal': 10,
    'healthcare': 10,
    'finance': 5,
    'construction': 0,
    'saas': 0,
    'professional-services': 0
  },
  annual_discount_pct: 15,
  overage_per_agent: 1800
};

// ─── Middleware ────────────────────────────────────────
// Webhook needs raw body for signature verification
app.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:8080'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// ─── Rate limiting (simple in-memory) ─────────────────
const rateLimits = new Map();
function rateLimit(ip, maxReqs = 10, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimits.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count++;
  rateLimits.set(ip, entry);
  return entry.count > maxReqs;
}

// ─── POST /create-session ─────────────────────────────
app.post('/create-session', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.ip;
    if (rateLimit(ip)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

    const { tier, vertical, billing, company_name, company_email, contact_name, company_size } = req.body;

    // Validate
    if (!tier || !PRICING.tiers[tier]) {
      return res.status(400).json({ error: 'Invalid tier' });
    }
    if (!vertical || !(vertical in PRICING.vertical_premiums)) {
      return res.status(400).json({ error: 'Invalid vertical' });
    }
    if (!['monthly', 'annual'].includes(billing)) {
      return res.status(400).json({ error: 'Invalid billing period' });
    }
    if (!company_name || !company_email) {
      return res.status(400).json({ error: 'Company name and email are required' });
    }

    // Calculate price
    const tierData = PRICING.tiers[tier];
    const premiumPct = PRICING.vertical_premiums[vertical];
    let monthlyPrice = tierData.price * (1 + premiumPct / 100);
    if (billing === 'annual') {
      monthlyPrice = monthlyPrice * (1 - PRICING.annual_discount_pct / 100);
    }
    const unitAmount = Math.round(monthlyPrice * 100); // cents

    // Build success URL with metadata for the success page
    const successParams = new URLSearchParams({
      tier,
      agents: tierData.agents,
      vertical,
      billing,
      session_id: '{CHECKOUT_SESSION_ID}'
    });
    const successUrl = `${FRONTEND_URL}/pricing/success.html?${successParams.toString()}`;
    const cancelUrl = `${FRONTEND_URL}/pricing/cancel.html`;

    // Create Stripe Checkout session
    const sessionParams = {
      mode: 'subscription',
      customer_email: company_email,
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          recurring: {
            interval: billing === 'annual' ? 'year' : 'month',
            interval_count: 1
          },
          product_data: {
            name: `AfrexAI ${tierData.agents === 1 ? '' : tierData.agents + ' '}AI Agent${tierData.agents > 1 ? 's' : ''} — ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
            description: `${vertical.charAt(0).toUpperCase() + vertical.slice(1)} vertical · ${billing} billing`
          }
        },
        quantity: 1
      }],
      metadata: {
        tier,
        vertical,
        billing,
        company_name,
        contact_name: contact_name || '',
        company_size: company_size || '',
        agents: String(tierData.agents)
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true
    };

    // For annual billing, set the unit_amount to the full yearly price
    if (billing === 'annual') {
      sessionParams.line_items[0].price_data.unit_amount = unitAmount * 12;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`[create-session] ${company_name} | ${tier}/${vertical}/${billing} | $${monthlyPrice}/mo`);
    res.json({ url: session.url });
  } catch (err) {
    console.error('[create-session] Error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ─── POST /webhook ────────────────────────────────────
async function handleWebhook(req, res) {
  let event;
  try {
    if (STRIPE_WEBHOOK_SECRET) {
      const sig = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body);
      console.warn('[webhook] No webhook secret configured — skipping signature verification');
    }
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).send('Webhook signature verification failed');
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const meta = session.metadata || {};
      console.log(`[webhook] ✅ checkout.session.completed`);
      console.log(`  Company: ${meta.company_name}`);
      console.log(`  Tier: ${meta.tier} | Vertical: ${meta.vertical} | Billing: ${meta.billing}`);
      console.log(`  Email: ${session.customer_email}`);
      console.log(`  Stripe Customer: ${session.customer}`);

      // Trigger autopilot onboarding flow
      triggerOnboarding(meta, session.customer_email, session.customer);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      console.log(`[webhook] ⚠️ subscription.deleted — customer: ${sub.customer}`);
      break;
    }
    default:
      console.log(`[webhook] Unhandled event: ${event.type}`);
  }

  res.json({ received: true });
}

// ─── Onboarding trigger ───────────────────────────────
function triggerOnboarding(meta, email, stripeCustomerId) {
  const autopilotPath = process.env.AUTOPILOT_SCRIPT
    || path.resolve(__dirname, '..', 'aaas-platform', 'autopilot.sh');

  const args = [
    meta.company_name || 'Unknown',
    email || '',
    meta.tier || 'starter',
    meta.vertical || 'general'
  ];

  console.log(`[onboarding] Triggering autopilot: ${args.join(' ')}`);

  execFile('bash', [autopilotPath, ...args], {
    env: { ...process.env, STRIPE_CUSTOMER_ID: stripeCustomerId || '' },
    timeout: 120000
  }, (err, stdout, stderr) => {
    if (err) {
      console.error(`[onboarding] ❌ Autopilot failed:`, err.message);
      if (stderr) console.error(`[onboarding] stderr:`, stderr);
      return;
    }
    console.log(`[onboarding] ✅ Autopilot completed for ${meta.company_name}`);
    if (stdout) console.log(stdout);
  });
}

// ─── GET /prices ──────────────────────────────────────
app.get('/prices', (req, res) => {
  res.json(PRICING);
});

// ─── GET /health ──────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`AfrexAI Stripe API running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
});
