# AfrexAI Stripe API

Lightweight Node.js service that creates Stripe Checkout sessions and handles webhooks for the AfrexAI pricing page.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/create-session` | Create a Stripe Checkout session |
| POST | `/webhook` | Stripe webhook handler |
| GET | `/prices` | Returns pricing data |
| GET | `/health` | Health check |

## Local Development

```bash
cp .env.example .env
# Fill in your Stripe test keys
npm install
npm run dev
```

## Deploy to Railway

1. Push this folder to a GitHub repo (or use Railway CLI)
2. Create a new Railway project → "Deploy from GitHub"
3. Set environment variables in Railway dashboard:
   - `STRIPE_SECRET_KEY` — from Stripe Dashboard → API Keys
   - `STRIPE_WEBHOOK_SECRET` — from Stripe Dashboard → Webhooks (create endpoint pointing to `https://your-railway-url.up.railway.app/webhook`)
   - `FRONTEND_URL` — `https://afrexai-cto.github.io`
4. Railway auto-detects `Procfile` and deploys

## Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-api-url/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.deleted`
4. Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET`

## Security

- Stripe secret key is never exposed to the frontend
- Webhook signatures are verified using `stripe.webhooks.constructEvent()`
- CORS restricted to `FRONTEND_URL` origin
- Rate limiting: 10 requests/minute per IP on `/create-session`
- All secrets should be stored in 1Password and injected via environment variables
