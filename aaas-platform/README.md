# 🤖 AfrexAI Agent-as-a-Service (AaaS) Platform — POC

**Version:** 0.1.0 (POC)
**Date:** 2026-02-15

## Overview

AfrexAI runs 9 AI agents internally on OpenClaw. This platform productizes that capability — letting customers order, deploy, and manage their own AI agent fleets.

Each customer gets dedicated AI agents that run on AM/PM shifts, maintain persistent memory, communicate via structured handoffs, and integrate with the customer's existing tools (email, Slack, CRM, calendar).

## Packages & Pricing

| Package    | Agents | Monthly Price | Included Types |
|------------|--------|---------------|----------------|
| Starter    | 1      | $1,500        | EA |
| Growth     | 3      | $4,500        | EA, Sales, Marketing |
| Enterprise | 9      | $12,000       | EA, Sales, Marketing, Bookkeeper, Content Writer, COO, Strategist, Project Manager, Outbound |

## Architecture

```
aaas-platform/
├── agent-deployer.sh          # Deploy a single agent for a customer
├── customer-onboarding.sh     # Full customer provisioning
├── agent-health-monitor.sh    # Health checks across all agents
├── dashboard-api.json         # Mock API spec for customer dashboard
├── README.md
├── customers/                 # Customer data (one dir per customer)
│   └── <customer-slug>/
│       ├── profile.json       # Customer profile
│       ├── billing.json       # Billing & package info
│       ├── integrations.json  # Connected tools
│       ├── agent-manifest.json# Registry of deployed agents
│       ├── WELCOME.md         # Customer welcome doc
│       └── agents/            # Agent workspaces
│           └── <agent-slug>/
│               ├── SOUL.md        # Agent personality & principles
│               ├── IDENTITY.md    # Agent metadata
│               ├── CONFIG.md      # Routines, KPIs, integrations
│               ├── MEMORY.md      # Persistent memory
│               ├── HANDOFF.md     # Communication protocols
│               ├── PROMPT-8AM.md  # Morning shift instructions
│               ├── PROMPT-8PM.md  # Evening shift instructions
│               ├── input/         # Inbound task queue (FIFO)
│               ├── output/        # Generated reports & deliverables
│               ├── archive/       # Processed handoffs
│               └── memory/        # Daily memory logs
├── reports/                   # Health monitoring reports
└── templates/                 # (Future) Agent templates
```

## Quick Start

### 1. Onboard a Customer

```bash
chmod +x *.sh

# Starter package
./customer-onboarding.sh acme-corp starter john@acme.com "Acme Corporation"

# Growth package with timezone
./customer-onboarding.sh bigco growth ceo@bigco.io "BigCo Inc" "America/New_York"

# Enterprise
./customer-onboarding.sh megacorp enterprise ops@mega.co "MegaCorp" "Asia/Tokyo"
```

This creates the customer directory, billing config, integrations config, and deploys all agents for the package.

### 2. Deploy an Additional Agent

```bash
./agent-deployer.sh acme-corp sales "Sarah" "America/New_York"
```

### 3. Run Health Check

```bash
# All customers
./agent-health-monitor.sh

# Specific customer
./agent-health-monitor.sh acme-corp
```

## Agent Types

| Type | Emoji | Description |
|------|-------|-------------|
| ea | 📋 | Executive Assistant — inbox triage, calendar, briefings |
| sales | 💰 | Sales Rep — CRM pipeline, outreach, follow-ups |
| marketing | 📣 | Marketing Analyst — campaigns, social, competitor intel |
| bookkeeper | 📒 | Bookkeeper — transactions, reconciliation, P&L |
| content-writer | ✍️ | Content Writer — blog posts, copy, content calendar |
| coo | 🏢 | Chief of Staff — operations, coordination, priorities |
| strategist | 🎯 | Strategist — market analysis, planning, recommendations |
| project-manager | 📊 | Project Manager — task tracking, timelines, status |
| outbound | 📞 | Outbound Sales — cold outreach, lead gen, prospecting |
| support | 🛟 | Customer Support — tickets, FAQs, issue resolution |
| analyst | 📈 | Data Analyst — metrics, reports, dashboards |

## How Agents Work

1. **Two shifts daily** — 8 AM and 8 PM in the customer's timezone
2. **Persistent memory** — MEMORY.md carries context between sessions
3. **Structured handoffs** — Agents communicate via FIFO queues in `input/`
4. **Output-driven** — Every shift produces deliverables in `output/`
5. **Self-monitoring** — Health monitor tracks activity, errors, and queue depth

## Integration Points

Each customer has an `integrations.json` controlling:

- **Email** — Gmail/Outlook IMAP for inbox monitoring
- **Slack** — Workspace integration for briefing delivery and task intake
- **CRM** — HubSpot/Salesforce/Pipedrive for pipeline data
- **Calendar** — Google/Outlook for scheduling awareness
- **Webhooks** — Custom endpoints for alerts and reports

## Dashboard API

See `dashboard-api.json` for the full mock API spec. Key endpoints:

- `GET /api/v1/dashboard` — Full customer overview
- `GET /api/v1/agents` — Agent fleet status
- `POST /api/v1/agents/:slug/task` — Submit task to an agent
- `GET /api/v1/health` — Platform health

## Next Steps (Beyond POC)

- [ ] Web dashboard frontend
- [ ] Stripe billing integration
- [ ] OAuth flows for email/calendar/Slack
- [ ] OpenClaw cron auto-provisioning per agent
- [ ] Agent performance analytics & scoring
- [ ] Customer self-service agent customization
- [ ] Multi-tenant isolation & security audit
- [ ] SLA monitoring & uptime guarantees

---

*Built by AfrexAI — AI agents that actually work.*
