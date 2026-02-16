# Skill: afrexai-onboarding-orchestrator

Runs the full AfrexAI customer onboarding autonomously — zero human touch from payment to first agent heartbeat.

## Trigger
Called after Stripe `checkout.session.completed` webhook, or manually for testing.

## What It Does (7 Steps)
1. **Provision workspace** — Runs `autopilot.sh` (profile, agents, billing, health check, configs, welcome email draft)
2. **Portal auth token** — Generates SHA-256 token, stores in `portal-auth.json`, updates `portal/auth-index.json`
3. **Welcome email** — Renders `templates/emails/welcome.md` with customer data, sends via Gmail SMTP (falls back to outbox/)
4. **Portal data** — Generates `data/portal/dashboard.json` for the customer portal
5. **Auth index** — Adds customer to `portal/auth-index.json` for portal login
6. **Email drip** — Schedules Day 3 (check-in), Day 7 (weekly report), Day 30 (ROI report) via `drip-queue.jsonl`
7. **Slack alert** — Posts new customer notification to #ceo-dashboard (C0AF3MKPYG1)

## Usage

```bash
# Full onboarding
bash aaas-platform/onboard.sh "Company Name" "email@co.com" "growth" "legal"

# Dry run (no emails, no Slack, no cron)
DRY_RUN=true bash aaas-platform/onboard.sh "Test Co" "test@test.com" "starter" "legal"
```

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `aaas-platform/onboard.sh` | Convenience wrapper → orchestrator.sh |
| `aaas-platform/onboarding/orchestrator.sh` | Master onboarding script |
| `aaas-platform/onboarding/send-email.sh` | SMTP email sender (Gmail + 1Password) |
| `aaas-platform/onboarding/portal-token.sh` | Auth token generator |
| `aaas-platform/onboarding/slack-notify.sh` | CEO Slack alert |
| `aaas-platform/onboarding/schedule-followups.sh` | Email drip scheduler + daily runner |
| `aaas-platform/autopilot.sh` | Workspace provisioning + agent generation |

## Error Handling
- **Critical failures** (autopilot): halt + Slack alert + log
- **Medium failures** (email, token): retry 3x, continue if failed
- **Low failures** (Slack, drip schedule): log warning, proceed
- All steps logged to `onboarding/onboarding-log.jsonl`

## Email Templates
All in `aaas-platform/templates/emails/`:
- `welcome.md` — Immediate on onboarding
- `day3-checkin.md` — Day 3 check-in
- `day7-weekly-report.md` — First week report
- `day30-roi-report.md` — Month 1 ROI analysis

Placeholders: `{{COMPANY}}`, `{{TIER}}`, `{{VERTICAL}}`, `{{AGENT_COUNT}}`, `{{AGENTS}}`, `{{MRR}}`, `{{PORTAL_URL}}`

## Daily Cron
Run `schedule-followups.sh run` daily at 09:00 to process the drip queue:
```cron
0 9 * * *  bash /path/to/aaas-platform/onboarding/schedule-followups.sh run
```

## 1Password References
- `op://AfrexAI/Gmail-SMTP/username` — Gmail sender
- `op://AfrexAI/Gmail-SMTP/app_password` — Gmail app password
- `op://AfrexAI/Slack-Webhook/url` — Slack webhook URL
