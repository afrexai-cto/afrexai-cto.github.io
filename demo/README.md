# AfrexAI Demo — Production Backend

## Architecture

```
demo/
├── server/                    # Express API server (port 3700)
│   ├── index.js               # Entry point
│   ├── db.js                  # JSON-file database (data/db.json)
│   ├── api/                   # REST API routes
│   │   ├── health.js          # GET /api/health
│   │   ├── companies.js       # CRUD /api/companies
│   │   ├── agents.js          # GET /api/agents
│   │   ├── tasks.js           # GET/POST /api/tasks (execute tasks)
│   │   ├── deliverables.js    # GET /api/deliverables (list/view/download)
│   │   ├── data-sources.js    # CRUD /api/data-sources (CSV upload, connectors)
│   │   ├── scheduler.js       # CRUD /api/scheduler (cron schedules)
│   │   ├── metrics.js         # GET /api/metrics (cost, ROI, hours)
│   │   └── output.js          # CRUD /api/output (email, slack, pdf configs)
│   ├── agents/
│   │   └── executor.js        # Real LLM task execution (Anthropic Claude)
│   ├── connectors/
│   │   ├── index.js           # Connector registry
│   │   └── csv.js             # CSV parser with query support
│   ├── output/
│   │   └── index.js           # Delivery pipeline (email, slack, pdf, file)
│   ├── scheduler/
│   │   └── index.js           # Cron-based task scheduler
│   ├── metrics/
│   │   └── index.js           # Cost/ROI tracking
│   └── uploads/               # Uploaded CSV files
├── agents/                    # Task definitions & legacy scripts
│   ├── tasks/*.json           # Task configs per company (5 companies)
│   └── real-agent-runner.js   # Legacy runner (still works, now wrapped by executor)
├── data/
│   ├── db.json                # Central database
│   ├── deliverables/          # Generated deliverables (markdown)
│   ├── exports/               # PDF/HTML exports
│   └── outbox/                # Queued emails (when nodemailer unavailable)
├── sample-data/               # Built-in CSV data per company
├── framework/                 # Legacy CLI framework
├── start.sh                   # Quick start script
└── *.html                     # Frontend demo pages
```

## Quick Start

```bash
cd demo
./start.sh          # Starts on port 3700
# or
cd server && npm install && npm start
```

## API Reference

### Health
- `GET /api/health` — server status, uptime, counts

### Companies
- `GET /api/companies` — list all 5 demo companies with metrics
- `GET /api/companies/:id` — full detail (agents, ROI, schedules, runs)
- `GET /api/companies/:id/activity?since=ISO&limit=50` — live activity feed

### Agents
- `GET /api/agents` — all agents across companies
- `GET /api/agents/:companyId/:agentId` — agent detail + recent activity

### Tasks
- `GET /api/tasks?company=buildright` — list task definitions
- `GET /api/tasks/:id` — single task definition
- `POST /api/tasks/:id/run` — **execute a task NOW** (calls LLM, saves deliverable)
  - Body: `{ "dryRun": true }` to preview prompt without calling LLM
- `GET /api/tasks/runs/list?company=X&status=completed` — task run history

### Deliverables
- `GET /api/deliverables?company=X&limit=100` — list deliverables
- `GET /api/deliverables/:company/:filename` — view content + metadata
- `GET /api/deliverables/:company/:filename?format=raw` — raw markdown
- `GET /api/deliverables/:company/:filename/download` — download file

### Data Sources
- `GET /api/data-sources/types` — available connector types
- `GET /api/data-sources/:companyId` — list sources (built-in + custom)
- `POST /api/data-sources/:companyId/upload` — upload CSV
  - Body: `{ "filename": "data.csv", "content": "...", "encoding": "base64" }`
- `POST /api/data-sources/:companyId/connect` — add API connector
  - Body: `{ "type": "salesforce", "name": "SF Prod", "config": {} }`
- `GET /api/data-sources/:companyId/:sourceId/query?limit=20&where={"name":"test"}`
- `DELETE /api/data-sources/:companyId/:sourceId`

### Scheduler
- `GET /api/scheduler?company=X` — list schedules
- `POST /api/scheduler` — add schedule
  - Body: `{ "companyId": "X", "taskId": "Y", "cron": "0 8 * * 1-5", "label": "..." }`
- `PATCH /api/scheduler/:id` — update (enable/disable, change cron)
- `DELETE /api/scheduler/:id`
- `POST /api/scheduler/seed` — seed default schedules for all companies

### Metrics
- `GET /api/metrics` — global metrics (cost, tokens, tasks, hours saved)
- `GET /api/metrics/:companyId` — per-company metrics
- `GET /api/metrics/:companyId/roi` — ROI calculation (labor saved vs agent cost)
- `GET /api/metrics/delivery/log` — delivery pipeline log

### Output Pipeline
- `GET /api/output/:companyId` — list output configs
- `POST /api/output/:companyId` — add output
  - Email: `{ "type": "email", "config": { "to": "x@y.com", "smtpHost": "..." } }`
  - Slack: `{ "type": "slack", "config": { "webhookUrl": "https://hooks.slack.com/..." } }`
  - PDF: `{ "type": "pdf", "config": {} }`
- `DELETE /api/output/:companyId/:configId`

## Demo Companies

| Company | Vertical | Agents | Tasks |
|---------|----------|--------|-------|
| BuildRight Construction | Construction | Site Reporter | daily-site-report |
| Pacific Legal Group | Legal | Document Analyst, Client Follow-up | contract-review, brief-summary, client-followup |
| Meridian Health Partners | Healthcare | Patient Coordinator, Compliance Officer, Records Analyst | schedule-patient, compliance-audit, records-request |
| Atlas Wealth Advisors | Financial | Compliance Monitor, Portfolio Reviewer, Filing Coordinator | portfolio-review, compliance-check, filing-status |
| NovaCRM | SaaS | Churn Analyst, Onboarding Specialist, Support Triage | churn-analysis, onboarding-update, ticket-triage |

## Environment

- `AFREX_PORT` — server port (default: 3700)
- `ANTHROPIC_API_KEY` — for LLM calls (also reads from 1Password or vault)

## Tech Stack

- Node.js, Express (only external dep)
- JSON-file database (no DB server needed)
- Anthropic Claude API for real deliverable generation
- Optional: nodemailer for email delivery
