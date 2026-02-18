# Wave 3: Self-Serve Onboarding — Full Specification

**Status:** PLAN (PIV Phase 1)
**Date:** 2026-02-16
**Author:** Architect Agent

---

## 1. Overview

After a Stripe payment succeeds, the entire customer onboarding executes autonomously:
Stripe webhook → orchestrator → workspace provisioned → agents generated → cron jobs created → welcome email sent → portal token issued → first health check → Slack alert to CEO.

**Zero human touch.**

---

## 2. Sequence Diagram

```
Stripe                 Webhook Server          Orchestrator           autopilot.sh
  │                         │                       │                      │
  │── checkout.session      │                       │                      │
  │   .completed ──────────►│                       │                      │
  │                         │── validate signature  │                      │
  │                         │── extract metadata ───►│                     │
  │                         │   (company,email,      │                     │
  │                         │    tier,vertical)      │                     │
  │                         │                       │── 1. call autopilot.sh ──►│
  │                         │                       │                      │── create profile
  │                         │                       │                      │── generate agents
  │                         │                       │                      │── billing config
  │                         │                       │                      │── health check
  │                         │                       │                      │── gen configs
  │                         │                       │                      │── gen welcome email
  │                         │                       │◄── exit 0 ───────────│
  │                         │                       │                      │
  │                         │                       │── 2. generate portal auth token
  │                         │                       │── 3. send welcome email (SMTP)
  │                         │                       │── 4. install cron jobs
  │                         │                       │── 5. verify first heartbeat
  │                         │                       │── 6. schedule email drip (day 3,7,30)
  │                         │                       │── 7. post Slack alert
  │                         │                       │── 8. log to onboarding-log.jsonl
  │                         │◄── 200 OK ────────────│
  │◄── 200 ────────────────│                       │
```

---

## 3. Script List

| # | Script | Purpose | New/Existing |
|---|--------|---------|--------------|
| 1 | `aaas-platform/onboarding/webhook-server.js` | Express server receiving Stripe webhooks | **NEW** |
| 2 | `aaas-platform/onboarding/orchestrator.sh` | Master script coordinating all onboarding steps | **NEW** |
| 3 | `aaas-platform/autopilot.sh` | Workspace provisioning + agent generation | Existing |
| 4 | `aaas-platform/generate-agents.sh` | Template-based agent file generation | Existing |
| 5 | `aaas-platform/onboarding/send-email.sh` | SMTP email sender (uses 1Password for Gmail creds) | **NEW** |
| 6 | `aaas-platform/onboarding/email-drip.sh` | Scheduled email runner (called by cron daily) | **NEW** |
| 7 | `aaas-platform/onboarding/portal-token.sh` | Generate JWT or random auth token for portal | **NEW** |
| 8 | `aaas-platform/onboarding/deploy-agents.sh` | Install cron jobs for agent shifts | **NEW** |
| 9 | `aaas-platform/onboarding/verify-heartbeat.sh` | Confirm first agent heartbeat succeeded | **NEW** |
| 10 | `aaas-platform/onboarding/slack-notify.sh` | Post new-customer alert to Slack | **NEW** |

---

## 4. Onboarding Orchestrator (`orchestrator.sh`)

### Input
Receives 4 args from webhook server:
```bash
./orchestrator.sh "Company Name" "email@co.com" "growth" "legal"
```

### Steps (in order, fail-fast)

```bash
#!/usr/bin/env bash
set -euo pipefail

COMPANY="$1"; EMAIL="$2"; TIER="$3"; VERTICAL="$4"
SLUG=$(echo "$COMPANY" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')
LOG="aaas-platform/onboarding/onboarding-log.jsonl"

# Step 1: Provision workspace + generate agents
bash aaas-platform/autopilot.sh "$COMPANY" "$EMAIL" "$TIER" "$VERTICAL"

# Step 2: Generate portal auth token
TOKEN=$(bash aaas-platform/onboarding/portal-token.sh "$SLUG" "$EMAIL")

# Step 3: Send welcome email via SMTP
bash aaas-platform/onboarding/send-email.sh \
  --to "$EMAIL" \
  --template welcome \
  --vars "COMPANY=$COMPANY,TIER=$TIER,VERTICAL=$VERTICAL,PORTAL_TOKEN=$TOKEN"

# Step 4: Deploy agent cron jobs
bash aaas-platform/onboarding/deploy-agents.sh "$SLUG"

# Step 5: Verify first heartbeat (30s timeout)
bash aaas-platform/onboarding/verify-heartbeat.sh "$SLUG" --timeout 30

# Step 6: Schedule email drip sequence
bash aaas-platform/onboarding/email-drip.sh schedule "$SLUG" "$EMAIL"

# Step 7: Slack notification
bash aaas-platform/onboarding/slack-notify.sh "$COMPANY" "$TIER" "$VERTICAL"

# Step 8: Log
echo "{\"ts\":\"$(date -u +%FT%TZ)\",\"customer\":\"$SLUG\",\"tier\":\"$TIER\",\"status\":\"complete\"}" >> "$LOG"
```

---

## 5. Webhook Server (`webhook-server.js`)

Minimal Express server:

```
POST /webhook/stripe
- Verify signature using STRIPE_WEBHOOK_SECRET (from 1Password)
- Handle event: checkout.session.completed
- Extract metadata: company, email, tier, vertical (set during Stripe Checkout creation)
- Spawn: orchestrator.sh with extracted params
- Return 200 immediately (orchestrator runs async)
- On failure: retry queue (write to pending-onboarding.jsonl)
```

**1Password references:**
- `op://AfrexAI/Stripe/webhook_secret`
- `op://AfrexAI/Stripe/secret_key`

**Deployment:** Run as systemd service or `pm2` process on the server.

---

## 6. Email Automation

### 6.1 Email Templates

All templates live in `aaas-platform/templates/emails/`:

| Template | Trigger | Subject |
|----------|---------|---------|
| `welcome.html` | Immediate (onboarding) | Welcome to AfrexAI — Your AI Workforce is Live! 🚀 |
| `day3-checkin.html` | Day 3 cron | How's it going with your AI team? |
| `day7-report.html` | Day 7 cron | Your First Week — Agent Activity Report |
| `day30-roi.html` | Day 30 cron | Your First Month — ROI Report |

### 6.2 Template Placeholders

All templates use these variables:
```
{{COMPANY}}        — Company name
{{CONTACT_EMAIL}}  — Customer email  
{{TIER}}           — starter/growth/scale/enterprise
{{VERTICAL}}       — Vertical name
{{AGENT_COUNT}}    — Number of agents
{{AGENT_LIST}}     — Bullet list of agent names
{{PORTAL_URL}}     — Portal login URL with token
{{MRR}}            — Monthly price
{{REPORT_DATA}}    — (day7/day30 only) JSON agent activity summary
```

### 6.3 Welcome Email Template (`welcome.html`)

```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to AfrexAI</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <img src="https://afrexai.com/logo.png" alt="AfrexAI" style="height: 40px;">
  <h1>Welcome to AfrexAI! 🚀</h1>
  <p>Hi {{COMPANY}} team,</p>
  <p>Your <strong>{{TIER}}</strong> plan is now active with <strong>{{AGENT_COUNT}} AI agents</strong>
     deployed for your <strong>{{VERTICAL}}</strong> vertical.</p>
  <h3>Your AI Team:</h3>
  {{AGENT_LIST}}
  <h3>What Happens Next:</h3>
  <ol>
    <li>✅ Agents are provisioned and configured</li>
    <li>📊 <a href="{{PORTAL_URL}}">Access your dashboard</a></li>
    <li>📅 <a href="https://calendly.com/cbeckford-afrexai/30min">Schedule integration call</a></li>
    <li>🚀 Agents begin first shift once integrations are live</li>
  </ol>
  <p><strong>Monthly investment:</strong> ${{MRR}}/mo</p>
  <p>Questions? Reply to this email or reach us at support@afrexai.com</p>
  <p>— The AfrexAI Team</p>
</body>
</html>
```

### 6.4 Day 3 Check-in (`day3-checkin.html`)

```
Subject: How's it going with your AI team?

Hi {{COMPANY}} team,

It's been 3 days since your AI agents went live. We wanted to check in!

Quick questions:
- Have you had a chance to review your agents' output?
- Any integrations you'd like us to help connect?
- Feedback on agent quality?

Reply to this email or book a quick call: https://calendly.com/cbeckford-afrexai/15min

— The AfrexAI Team
```

### 6.5 Day 7 Report (`day7-report.html`)

```
Subject: Your First Week — Agent Activity Report

Hi {{COMPANY}} team,

Here's what your AI team accomplished in week 1:

{{REPORT_DATA}}
(Rendered as: tasks completed, emails drafted, documents reviewed, hours saved estimate)

Your dashboard: {{PORTAL_URL}}

What's next:
- We'll continue optimizing agent performance
- Week 2 focus: deeper integration into your workflows

— The AfrexAI Team
```

### 6.6 Day 30 ROI Report (`day30-roi.html`)

```
Subject: Your First Month — ROI Report

Hi {{COMPANY}} team,

One month in! Here's your AI workforce ROI summary:

{{REPORT_DATA}}
(Rendered as: total tasks, estimated hours saved, cost per task, comparison to human equivalent)

Investment: ${{MRR}}/mo
Estimated value delivered: $X,XXX (calculated from hours saved × avg hourly rate)

— The AfrexAI Team
```

### 6.6 `send-email.sh`

```bash
# Uses Gmail SMTP via msmtp or python smtplib
# Credentials: op://AfrexAI/Gmail-SMTP/username, op://AfrexAI/Gmail-SMTP/app_password
# Renders template with sed substitution of {{VAR}} placeholders
# Logs sent emails to aaas-platform/email-log.jsonl
```

### 6.7 `email-drip.sh`

```bash
# Modes:
#   schedule <slug> <email>  — creates entries in drip-queue.jsonl
#   run                      — called by daily cron, sends due emails
#
# drip-queue.jsonl format:
# {"slug":"acme","email":"a@b.com","template":"day3-checkin","send_date":"2026-02-19","status":"pending"}
#
# Daily cron runs: email-drip.sh run
# Checks send_date <= today && status == pending → sends, marks "sent"
```

---

## 7. Agent Activation & Deployment

### 7.1 `deploy-agents.sh`

Reads customer profile, creates cron jobs for each agent:

```bash
#!/usr/bin/env bash
# deploy-agents.sh <customer-slug>
# Reads: customers/<slug>/config/openclaw-gateway.yaml
# Creates crontab entries for morning/evening shifts + heartbeat

SLUG="$1"
CONFIG="aaas-platform/customers/$SLUG/config/openclaw-gateway.yaml"
CRON_FILE="/tmp/afrexai-cron-$SLUG"

# Parse YAML for agent schedules (already generated by autopilot.sh)
# For each agent: install 3 cron entries

# Morning shift: 0 8 * * * — full task execution
# Evening shift: 0 20 * * * — end-of-day summary
# Heartbeat: */30 * * * * — health check ping

# Cron command pattern (local deployment):
# openclaw cron run --session "agent:customer:$SLUG:$AGENT_ID" --task "morning-shift"

# Write to crontab
crontab -l 2>/dev/null | grep -v "afrexai-$SLUG" > "$CRON_FILE" || true
# ... append new entries ...
crontab "$CRON_FILE"
```

### 7.2 Cron Job Definitions

Per agent, per customer:

```cron
# AfrexAI Agent: acme-corp / client-followup
# afrexai-acme-corp-client-followup-morning
0 8 * * 1-5  openclaw cron run --label "afrexai-$SLUG-$AGENT-morning" --task "Execute morning shift tasks" --channel none 2>&1 >> /var/log/afrexai/$SLUG/$AGENT.log

# afrexai-acme-corp-client-followup-evening
0 20 * * 1-5  openclaw cron run --label "afrexai-$SLUG-$AGENT-evening" --task "Execute evening shift summary" --channel none 2>&1 >> /var/log/afrexai/$SLUG/$AGENT.log

# afrexai-acme-corp-client-followup-heartbeat
*/30 * * * *  openclaw cron run --label "afrexai-$SLUG-$AGENT-heartbeat" --task "HEARTBEAT" --channel none 2>&1 >> /var/log/afrexai/$SLUG/$AGENT.log
```

### 7.3 Platform Cron (system-level)

```cron
# Email drip processor — runs daily at 09:00
0 9 * * *  bash /path/to/aaas-platform/onboarding/email-drip.sh run

# Retry failed onboardings — runs every 15 min
*/15 * * * *  bash /path/to/aaas-platform/onboarding/retry-pending.sh

# Daily health roll-up — runs at 21:00
0 21 * * *  bash /path/to/aaas-platform/agent-health-monitor.sh --all
```

### 7.4 Deployment Modes

**Phase 1 (Now): Local**
- All agents run on the same Mac via OpenClaw cron
- Crontab managed directly
- Logs to `/var/log/afrexai/<slug>/`

**Phase 2 (Later): Remote SSH**
- `deploy-agents.sh` accepts `--ssh user@host`
- Copies agent files via `scp`
- Installs cron on remote via `ssh ... crontab`
- Health checks via SSH tunnel
- autopilot.sh already supports `SSH_HOST` env var

### 7.5 First Heartbeat Verification

```bash
# verify-heartbeat.sh <slug> --timeout <seconds>
# 1. Triggers one heartbeat for first agent: openclaw cron run --label test-heartbeat ...
# 2. Waits for log output confirming HEARTBEAT_OK or task completion
# 3. Returns 0 on success, 1 on timeout
# 4. On failure: logs warning but does NOT block onboarding
```

---

## 8. Portal Auth Token (`portal-token.sh`)

```bash
# portal-token.sh <slug> <email>
# Generates a random 64-char token
# Stores in customers/<slug>/portal-auth.json:
#   {"token": "abc...", "email": "x@y.com", "created": "...", "expires": "..."}
# Token valid for 90 days
# Portal URL: https://portal.afrexai.com/login?token=<token>
# (Portal is a future Wave 4 deliverable — token is pre-generated)
TOKEN=$(openssl rand -hex 32)
```

---

## 9. Slack Notification (`slack-notify.sh`)

```bash
# Posts to #ceo-dashboard channel via Slack webhook
# Webhook URL: op://AfrexAI/Slack-Webhook/url
#
# Message format:
# 🎉 New Customer Onboarded!
# Company: Acme Corp
# Tier: Growth ($4,500/mo)
# Vertical: Legal
# Agents: 3
# Status: ✅ All systems go
```

---

## 10. OpenClaw Skill: `afrexai-onboarding-orchestrator`

### SKILL.md

```markdown
# Skill: afrexai-onboarding-orchestrator

Runs the full AfrexAI customer onboarding autonomously.

## Trigger
Called by sub-agents or manually with:
- Company name, email, tier, vertical

## What It Does
1. Verifies Stripe payment (optional — can skip if manually triggered)
2. Runs autopilot.sh (provisioning + agent generation)
3. Generates portal auth token
4. Sends welcome email via SMTP
5. Deploys agent cron jobs
6. Verifies first heartbeat
7. Schedules email drip sequence (day 3, 7, 30)
8. Posts Slack alert

## Usage
```bash
openclaw skill run afrexai-onboarding-orchestrator \
  --param company="Acme Corp" \
  --param email="ceo@acme.com" \
  --param tier="growth" \
  --param vertical="legal"
```

## Error Handling
- Each step logs to onboarding-log.jsonl
- Failed steps retry up to 3 times
- Non-critical failures (email, Slack) don't block onboarding
- Critical failures (autopilot, agent gen) halt and alert via Slack
```

---

## 11. Error Handling Strategy

| Step | Criticality | On Failure |
|------|-------------|------------|
| autopilot.sh | **CRITICAL** | Halt, log error, Slack alert, write to retry queue |
| Portal token | Medium | Retry 3x, proceed without (manual fix later) |
| Welcome email | Medium | Retry 3x, queue for manual send |
| Cron deploy | **CRITICAL** | Halt, log error, Slack alert |
| First heartbeat | Low | Log warning, proceed (agents may still work) |
| Email drip schedule | Low | Log warning, manual schedule later |
| Slack notify | Low | Log warning, proceed |

### Retry Queue

Failed onboardings write to `aaas-platform/onboarding/pending-onboarding.jsonl`:
```json
{"ts":"...","company":"Acme","email":"a@b.com","tier":"growth","vertical":"legal","failed_step":"autopilot","error":"...","retries":0}
```

`retry-pending.sh` (cron every 15 min) picks up pending entries, retries from failed step.

---

## 12. Implementation Order

| Phase | Deliverable | Depends On | Est. Effort |
|-------|-------------|------------|-------------|
| **1** | Email templates (`templates/emails/`) | Nothing | 1 hour |
| **2** | `send-email.sh` (SMTP via Gmail + 1Password) | 1Password Gmail creds | 1 hour |
| **3** | `portal-token.sh` | Nothing | 30 min |
| **4** | `slack-notify.sh` | 1Password Slack webhook | 30 min |
| **5** | `deploy-agents.sh` (cron job installer) | Existing config YAML | 1 hour |
| **6** | `verify-heartbeat.sh` | deploy-agents.sh | 30 min |
| **7** | `email-drip.sh` (scheduler + runner) | send-email.sh, templates | 1 hour |
| **8** | `orchestrator.sh` (master script) | All above | 1 hour |
| **9** | `webhook-server.js` (Stripe listener) | orchestrator.sh, Stripe keys | 2 hours |
| **10** | OpenClaw skill wrapper | orchestrator.sh | 1 hour |
| **11** | System cron jobs (drip, retry, health) | email-drip.sh | 30 min |
| **12** | End-to-end test (dry run + live) | All above | 1 hour |

**Total estimated effort: ~11 hours**

---

## 13. File Structure (New Files)

```
aaas-platform/
├── onboarding/
│   ├── orchestrator.sh          # Master onboarding script
│   ├── webhook-server.js        # Stripe webhook listener
│   ├── send-email.sh            # SMTP email sender
│   ├── email-drip.sh            # Drip campaign scheduler/runner
│   ├── portal-token.sh          # Auth token generator
│   ├── deploy-agents.sh         # Cron job installer
│   ├── verify-heartbeat.sh      # First heartbeat checker
│   ├── slack-notify.sh          # CEO dashboard Slack alert
│   ├── retry-pending.sh         # Retry failed onboardings
│   ├── onboarding-log.jsonl     # Onboarding audit log
│   ├── pending-onboarding.jsonl # Retry queue
│   ├── drip-queue.jsonl         # Email drip schedule
│   └── op.env                   # 1Password secret references
├── templates/
│   └── emails/
│       ├── welcome.html
│       ├── day3-checkin.html
│       ├── day7-report.html
│       └── day30-roi.html
└── email-log.jsonl              # Sent email audit log
```

---

## 14. 1Password References Needed

| Item | Field | Used By |
|------|-------|---------|
| `op://AfrexAI/Stripe/secret_key` | Stripe SK | webhook-server.js |
| `op://AfrexAI/Stripe/webhook_secret` | Webhook signing | webhook-server.js |
| `op://AfrexAI/Gmail-SMTP/username` | Gmail address | send-email.sh |
| `op://AfrexAI/Gmail-SMTP/app_password` | Gmail app password | send-email.sh |
| `op://AfrexAI/Slack-Webhook/url` | Webhook URL | slack-notify.sh |

---

## 15. Acceptance Criteria

- [ ] `orchestrator.sh "Test Co" "test@test.com" "starter" "legal"` completes end-to-end
- [ ] Welcome email arrives within 60 seconds of payment
- [ ] Cron jobs appear in `crontab -l` after onboarding
- [ ] First heartbeat succeeds within 30 seconds
- [ ] Slack message posts to #ceo-dashboard
- [ ] Day 3/7/30 emails send on schedule
- [ ] Failed onboarding retries automatically within 15 minutes
- [ ] All secrets come from 1Password (zero plaintext credentials)
- [ ] Duplicate Stripe webhook is idempotent (no double onboarding)
