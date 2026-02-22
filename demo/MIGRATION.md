# Migration Guide: Demo v1 → v2 (Production Backend)

## What Changed

### Before (v1)
- `agents/lib/generate.js` picked random CSV rows, filled templates, wrote to `activity.json`
- `agents/real-agent-runner.js` could generate prompts and process completed files, but required manual LLM invocation via shell scripts
- `agents/run-real-agents.sh` orchestrated the bash pipeline
- `agents/process-prompt.sh` extracted prompts for manual processing
- `data/activity.json` was the only data store
- No API — dashboard used hardcoded data from SPEC.md
- No scheduler — tasks ran when scripts were manually triggered
- No output pipeline — deliverables saved as .md files only
- No cost tracking or ROI metrics
- Only 3 companies had task definitions (BuildRight, Pacific Legal, Meridian Health)

### After (v2)
- `server/` — Full Express API server on port 3700
- `server/agents/executor.js` — Calls Anthropic Claude API directly, produces real deliverables
- `server/connectors/` — Data source abstraction (CSV, uploaded files, Google/QuickBooks/Salesforce stubs)
- `server/output/` — Delivery pipeline: file (always) + email + Slack webhook + PDF/HTML export
- `server/scheduler/` — Cron-based task scheduler with per-company configuration
- `server/metrics/` — Real cost tracking (tokens, $, duration) and ROI calculation
- `server/api/` — 9 REST API route modules for live dashboard data
- `data/db.json` — Central database (migrated from activity.json)
- All 5 companies have task definitions: BuildRight, Pacific Legal, Meridian Health, **Atlas Wealth**, **NovaCRM**

## New Files

```
server/index.js                    Express server entry
server/db.js                       JSON-file database
server/package.json                Dependencies (express, optional nodemailer)
server/api/health.js               Health check endpoint
server/api/companies.js            Company CRUD + activity feed
server/api/agents.js               Agent listing + detail
server/api/tasks.js                Task definitions + execution
server/api/deliverables.js         Deliverable listing + download
server/api/data-sources.js         Data source management + CSV upload
server/api/scheduler.js            Cron schedule management
server/api/metrics.js              Cost/ROI metrics
server/api/output.js               Output pipeline configuration
server/agents/executor.js          LLM task executor
server/connectors/index.js         Connector registry
server/connectors/csv.js           CSV parser with query
server/output/index.js             Delivery pipeline
server/scheduler/index.js          Cron scheduler
server/metrics/index.js            Metrics tracking
server/uploads/                    Uploaded files directory
agents/tasks/atlas-wealth-tasks.json    NEW task definitions
agents/tasks/novacrm-tasks.json         NEW task definitions
start.sh                           Quick start script
README.md                          New architecture documentation
MIGRATION.md                       This file
```

## Unchanged Files

- `agents/real-agent-runner.js` — Still works standalone (legacy mode)
- `agents/lib/generate.js` — Still works for filler activity generation
- `agents/tasks/{buildright,meridian-health,pacific-legal}-tasks.json` — Unchanged
- `framework/` — CLI framework unchanged, still functional
- `sample-data/` — All CSV files unchanged
- `data/deliverables/` — Existing deliverables preserved
- `*.html` — Frontend files unchanged (but now served by Express at /demo/)

## Breaking Changes

None. The v1 scripts still work. The server is additive — it wraps the existing logic with an API layer and adds real execution capability.

## How to Migrate Dashboard to Live Data

Replace hardcoded `AAAS_DATA` in frontend HTML with API calls:

```js
// Before (hardcoded):
const data = AAAS_DATA.companies[0];

// After (live API):
const res = await fetch('/api/companies/meridian-health');
const data = await res.json();
```

Key API endpoints for the dashboard:
- `/api/companies` → company list with KPIs
- `/api/companies/:id/activity?since=...` → live activity feed (poll every 5s)
- `/api/metrics/:id/roi` → ROI data for the ROI view
- `/api/agents/:companyId/:agentId` → agent detail panel data

## Environment Setup

```bash
# 1. Install server dependencies
cd demo/server && npm install

# 2. Ensure API key is available (one of):
export ANTHROPIC_API_KEY=sk-...
# or: configure in 1Password at op://AfrexAI/Anthropic/api_key
# or: place in ~/.openclaw/vault/anthropic.env

# 3. Start server
./demo/start.sh

# 4. Seed default schedules (optional)
curl -X POST http://localhost:3700/api/scheduler/seed

# 5. Run a task manually
curl -X POST http://localhost:3700/api/tasks/daily-site-report/run

# 6. Configure email output (optional)
curl -X POST http://localhost:3700/api/output/buildright \
  -H 'Content-Type: application/json' \
  -d '{"type":"email","config":{"to":"pm@buildright.com"}}'

# 7. Configure Slack webhook (optional)
curl -X POST http://localhost:3700/api/output/buildright \
  -H 'Content-Type: application/json' \
  -d '{"type":"slack","config":{"webhookUrl":"https://hooks.slack.com/services/..."}}'
```
