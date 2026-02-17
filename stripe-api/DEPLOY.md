# AfrexAI Stripe API — Deployment Guide

## Environment Variables

| Variable | Description | Source |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key | `op://AfrexAI/Stripe/secret_key` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe Dashboard → Webhooks |
| `FRONTEND_URL` | Frontend origin for CORS | `https://afrexai-cto.github.io` |

## Option 1: Render.com (Recommended)

1. Push this repo to GitHub
2. Go to [render.com/new](https://render.com/new) → **Web Service**
3. Connect your repo, set root directory to `stripe-api/`
4. Render will auto-detect `render.yaml` — just add the secret env vars
5. Deploy

Or via CLI:
```bash
# render.yaml is already configured
# Just set secrets in the Render dashboard
```

## Option 2: Railway

```bash
npm install -g @railway/cli
railway login
cd stripe-api
railway init
railway up
railway variables set STRIPE_SECRET_KEY=$(op read "op://AfrexAI/Stripe/secret_key")
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
railway variables set FRONTEND_URL=https://afrexai-cto.github.io
```

## Option 3: Fly.io

```bash
brew install flyctl   # or curl -L https://fly.io/install.sh | sh
fly auth login
cd stripe-api
fly launch              # uses fly.toml + Dockerfile
fly secrets set STRIPE_SECRET_KEY=$(op read "op://AfrexAI/Stripe/secret_key")
fly secrets set STRIPE_WEBHOOK_SECRET=whsec_...
fly secrets set FRONTEND_URL=https://afrexai-cto.github.io
fly deploy
```

## Stripe Webhook Setup

After deploying, configure the webhook in [Stripe Dashboard](https://dashboard.stripe.com/webhooks):

1. **Endpoint URL:** `https://<your-deployed-url>/webhook`
2. **Events to listen for:**
   - `checkout.session.completed`
   - `customer.subscription.deleted`
3. Copy the **Signing Secret** → set as `STRIPE_WEBHOOK_SECRET`

## Webhook → Onboarding Flow

When `checkout.session.completed` fires, the server automatically runs:
```
aaas-platform/autopilot.sh "<company>" "<email>" "<tier>" "<vertical>"
```

This triggers the full onboarding pipeline (profile creation, agent deployment, welcome email, CRM logging).

**Note:** The autopilot script must be accessible from the deployed server. For cloud deployments, either:
- Include `aaas-platform/` in the deploy, or
- Replace `triggerOnboarding()` with an HTTP call to a separate onboarding service, or
- Use a queue (SQS, Redis) to decouple the webhook from onboarding

## Health Check

```bash
curl https://<your-deployed-url>/health
# {"status":"ok","timestamp":"..."}
```
