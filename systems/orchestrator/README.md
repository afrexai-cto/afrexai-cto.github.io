# Orchestrator

Unified scheduling and data-flow layer for all 26 systems.

## Quick Start

```bash
node index.js              # Start the orchestrator (runs forever, checks every 60s)
node index.js --list       # List all jobs and their cron schedules
node index.js --dry-run    # Show which jobs would fire right now
node index.js --once <id>  # Run a single job immediately and exit
```

## Architecture

```
index.js          Master loop — cron matching, job execution, error handling
schedule.json     All 26 jobs with cron expressions and topic routing
wiring.js         Data pipes between systems (CRM→briefing, social→advisory, etc.)
```

## How It Works

1. **Every 60 seconds**, the orchestrator checks all jobs against the current time
2. **Matching jobs** fire concurrently (max 4 at a time)
3. **Data pipes** (wiring.js) pull context from upstream systems before execution
4. **Outputs** route to the correct Telegram topic via messaging-setup router
5. **Every run** is logged to model-cost-tracker's `runs` table
6. **Failures** automatically alert to the `cron-updates` topic

## Data Flow

```
personal-crm ──→ daily-briefing (attendee context)
personal-crm ──→ meeting-actions (attendee matching)
social-tracker ──→ daily-briefing (yesterday's performance)
social-tracker ──→ advisory-council (content data)
meeting-actions ──→ daily-briefing (action items)
newsletter-crm ──→ advisory-council (subscriber + deal data)
asana-integration ──→ advisory-council (task status)
knowledge-base ──→ video-pipeline (related content)
platform-health ──→ advisory-council (tech health)
all systems ──→ cost-tracker (run logging)
all systems ──→ messaging-setup (topic routing)
security-council + security-safety + health-monitoring ──→ security topic
```

## Schedule Overview

| Frequency | Systems |
|-----------|---------|
| Every 5min (biz hrs) | meeting-actions Fathom poll |
| Every 30min | urgent-email, git-auto-sync |
| Every 1hr | db-backups |
| 3:30am | security council nightly |
| 4am | security-safety, knowledge-base ingest |
| 5am | platform-health |
| 6am | google-workspace, newsletter-crm, personal-crm |
| 7am | daily briefing, asana sync |
| 8am/12pm/4pm | meeting-actions completion |
| 8am/1pm/7pm | health-tracker reminders |
| 9am Sunday | earnings preview |
| 10am Monday | advisory council |
| 11pm | social-tracker snapshot, cost summary |
| 1st of month | security memory scan |
