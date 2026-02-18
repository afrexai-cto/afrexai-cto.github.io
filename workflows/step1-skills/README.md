# Step 1: Skills — CMA Automation Workflows

End-to-end automation for the AfrexAI ClawHub skills marketplace (Customer Managed Agents).

## Overview

**Step 1 (CMA):** Customer buys OpenClaw, manages their own agents, purchases skills from ClawHub. These workflows automate the entire pipeline from skill creation to customer onboarding.

## Workflows

### 1. `skill-publish-pipeline.sh` — Skill Creation → Publishing

Automates the full lifecycle: scaffold → validate → publish → log.

```bash
# Create and publish a new skill
./skill-publish-pipeline.sh \
  --name "deploy-notifier" \
  --display-name "Deploy Notifier" \
  --description "Get notified on successful deployments" \
  --category devops

# Scaffold only (no publish)
./skill-publish-pipeline.sh \
  --name "my-skill" \
  --display-name "My Skill" \
  --description "Does things" \
  --category productivity \
  --dry-run
```

**What it does:**
1. Scaffolds `SKILL.md`, `scripts/`, `assets/`, `README.md`
2. Validates frontmatter, slug format, semver version
3. Publishes via `clawhub publish`
4. Logs event to CRM (`data/crm/skill-publish-log.jsonl`)

**Categories:** productivity, automation, integration, analytics, communication, devops, finance, marketing, other

---

### 2. `skill-analytics.sh` — Install & Revenue Tracking

Fetches stats from ClawHub, generates reports, flags trending skills.

```bash
# Weekly report (all skills)
./skill-analytics.sh

# Daily report for one skill
./skill-analytics.sh --report daily --skill deploy-notifier

# Show only trending skills (>20% growth)
./skill-analytics.sh --trending

# Custom threshold
./skill-analytics.sh --trending --threshold 50
```

**What it does:**
1. Queries ClawHub API / CLI for install counts and ratings
2. Tracks historical data in `data/analytics/`
3. Calculates growth percentages
4. Generates markdown reports in `data/reports/`
5. Flags skills with >N% growth as 🔥 trending

---

### 3. `customer-onboard-cma.sh` — Customer Onboarding

Full onboarding flow when a CMA customer signs up.

```bash
./customer-onboard-cma.sh \
  --name "Jane Smith" \
  --email "jane@acme.com" \
  --company "Acme Corp" \
  --vertical saas

# Preview without executing
./customer-onboard-cma.sh \
  --name "Test" --email "test@test.com" \
  --company "Test Co" --vertical other \
  --dry-run
```

**What it does:**
1. Creates CRM record (`data/crm/customers/`)
2. Sends welcome email with ClawHub setup guide + vertical-specific skill recommendations
3. Provisions recommended skills list based on vertical
4. Schedules 7-day follow-up email
5. Schedules 30-day check-in email

**Verticals:** ecommerce, saas, finance, healthcare, marketing, devops, legal, education, other

Each vertical has curated skill recommendations (4 skills per vertical).

**Scheduled emails** are saved to `data/crm/scheduled/`. Process them with a cron job or heartbeat that checks `scheduled_date <= today && status == pending`.

---

### 4. `content-to-skill.sh` — Research → Packaged Skill

Converts markdown documents or research into publishable ClawHub skills.

```bash
# Convert a research doc into a skill
./content-to-skill.sh \
  --input ./research/kubernetes-security.md \
  --name "k8s-security" \
  --category devops

# Convert and auto-publish
./content-to-skill.sh \
  --input ./docs/api-guide.md \
  --name "api-best-practices" \
  --category integration \
  --publish
```

**What it does:**
1. Extracts title, description, sections from markdown
2. Pulls out code blocks into `scripts/`
3. Extracts bullet points as key reference
4. Generates proper `SKILL.md` with frontmatter
5. Adds to publish queue (`data/publish-queue/`)
6. Optionally auto-publishes via the pipeline

---

## Directory Structure

```
workflows/step1-skills/
├── README.md                    ← This file
├── skill-publish-pipeline.sh    ← Scaffold → validate → publish
├── skill-analytics.sh           ← Track installs, revenue, ratings
├── customer-onboard-cma.sh      ← Customer onboarding flow
└── content-to-skill.sh          ← Convert content → skill

data/                            ← Created at runtime
├── crm/
│   ├── skill-publish-log.jsonl  ← All publish events
│   ├── events.jsonl             ← All CRM events
│   ├── customers/               ← Customer JSON records
│   ├── recommendations/         ← Per-customer skill recommendations
│   ├── scheduled/               ← Scheduled emails (7-day, 30-day)
│   └── pending-emails/          ← Emails waiting for manual send
├── analytics/                   ← Historical skill stats (per-skill JSONL)
├── reports/                     ← Generated analytics reports
└── publish-queue/               ← Skills queued for publishing
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAWHUB_WORKDIR` | `./skills` | Skills workspace directory |
| `CLAWHUB_REGISTRY` | `https://clawhub.com` | ClawHub registry URL |
| `CRM_LOG_DIR` | `../../data/crm` | CRM data directory |
| `ANALYTICS_DATA_DIR` | `../../data/analytics` | Analytics data |
| `ANALYTICS_REPORT_DIR` | `../../data/reports` | Report output |
| `PUBLISH_QUEUE_DIR` | `../../data/publish-queue` | Publish queue |

## Prerequisites

- **clawhub CLI**: `npm i -g clawhub` (required for publish/analytics)
- **openclaw**: `npm i -g openclaw` (optional, for email sending)
- **bash 3.2+**: All scripts are compatible with macOS default bash

## Typical Workflow

```
1. Research/create content
   ↓
2. content-to-skill.sh → converts to skill package
   ↓
3. skill-publish-pipeline.sh → validates & publishes to ClawHub
   ↓
4. Customer signs up → customer-onboard-cma.sh
   ↓
5. skill-analytics.sh → track performance (run weekly via cron/heartbeat)
   ↓
6. Trending skills → promote in marketing
```
