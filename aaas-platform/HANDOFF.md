# AfrexAI Agent-as-a-Service (AaaS) Platform — HANDOFF

## What's Built

| Component | Status | Path |
|-----------|--------|------|
| Landing page | ✅ Live | `aaas/index.html` |
| Demo page | ✅ Live | `aaas/demo.html` |
| Customer onboarding script | ✅ Tested | `aaas-platform/customer-onboarding.sh` |
| Agent deployer script | ✅ Tested | `aaas-platform/agent-deployer.sh` |
| Health monitor | ✅ Tested | `aaas-platform/agent-health-monitor.sh` |
| Autopilot (e2e) | ✅ Tested | `aaas-platform/autopilot.sh` |
| Market research | ✅ Complete | `research/aaas-market-research.md` |

## What's Automated

- **Full customer onboarding** via `autopilot.sh "Company" "email" "tier"`
  - Creates customer directory structure
  - Deploys all agents for the chosen package
  - Generates welcome email template
  - Logs to CRM (JSONL)
  - Runs initial health check

## What Needs Manual Steps

- **Sending welcome email** — template generated, needs manual send
- **Integration setup** — OAuth flows for email/Slack/CRM require customer interaction
- **Cron scheduling** — Configure OpenClaw cron for agent AM/PM shifts per customer
- **Billing** — Stripe/payment setup not yet automated
- **Agent soul customization** — Generic SOULs deployed; customize per customer needs

## How to Onboard a New Customer

```bash
cd aaas-platform
./autopilot.sh "Company Name" "contact@email.com" "growth"
```

This creates everything under `customers/<slug>/` with agents, billing, integrations config, and welcome email.

## How to Monitor Agent Health

```bash
./agent-health-monitor.sh              # All customers
./agent-health-monitor.sh customer-slug # Specific customer
```

Reports saved to `aaas-platform/reports/health-YYYY-MM-DD.md`.

## Pricing Tiers

| Tier | Agents | Price | Includes |
|------|--------|-------|----------|
| **Starter** | 1 (EA) | $1,500/mo | 1 agent, full integration, weekly reports, 30-day pilot |
| **Growth** | 3 (EA + Sales + Marketing) | $4,500/mo | 3 agents, multi-system integration, daily reports, priority support |
| **Enterprise** | 9 (full suite) | $12,000/mo | 9 agents, enterprise integrations, real-time dashboards, dedicated AM |

All tiers: 30-day pilot, no long-term contracts, cancel anytime.

## Architecture

```
aaas-platform/
├── autopilot.sh              # E2E signup automation
├── customer-onboarding.sh    # Provisions customer + deploys agents
├── agent-deployer.sh         # Deploys single agent with full file set
├── agent-health-monitor.sh   # Health checks all agents
├── health-check.sh           # Symlink → agent-health-monitor.sh
├── crm-log.jsonl             # CRM event log (append-only)
├── customers/
│   └── <slug>/
│       ├── billing.json
│       ├── profile.json
│       ├── integrations.json
│       ├── agent-manifest.json
│       ├── welcome-email.md
│       ├── WELCOME.md
│       └── agents/
│           └── <type>-<name>/
│               ├── SOUL.md, IDENTITY.md, CONFIG.md
│               ├── MEMORY.md, HANDOFF.md
│               ├── PROMPT-8AM.md, PROMPT-8PM.md
│               └── input/ output/ archive/ memory/
└── reports/
    └── health-YYYY-MM-DD.md
```
