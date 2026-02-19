# Messaging Setup

Telegram forum-based topic routing + Slack mention-only client.

## Setup

```bash
# 1. Store secrets in 1Password vault "AfrexAI":
#    - Telegram-Bot: token, forum_chat_id
#    - Slack-Bot: bot_token, signing_secret

# 2. Create Telegram supergroup with Topics enabled, add bot as admin

# 3. Create all 13 forum topics:
node setup-topics.js

# 4. Install deps (only needed for Slack @slack/web-api):
npm install
```

## CLI Usage

```bash
# Send text to a topic
node send.js --topic daily-brief "Morning summary: 3 meetings, 2 PRs pending"

# Send file (actual upload, not link)
node send.js --topic earnings --file report.pdf "Q4 earnings report"

# Locked topic requires --unlock
node send.js --topic financials --unlock "Portfolio rebalance complete"

# Cron updates (failures only)
node send.js --topic cron-updates --failure "Build #42 failed: timeout"

# List all topics
node send.js --list
```

## 13 Topics

| Topic | Content Types | Special |
|-------|--------------|---------|
| daily-brief | daily-brief, morning-summary, daily-report | |
| crm | crm, contact, lead, deal, pipeline | |
| email | email, inbox, mail | |
| knowledge-base | knowledge, kb, wiki, reference, doc | |
| meta-analysis | meta, analysis, insight, pattern | |
| video-ideas | video, youtube, content-idea, thumbnail | |
| earnings | earnings, revenue, income, payout | |
| cron-updates | cron, cron-failure, job-failure, scheduler | Failures only |
| financials | financial, bank, investment, portfolio, tax | Locked |
| health | health, workout, sleep, nutrition, medical | |
| security | security, alert, breach, auth, access | |
| advisory-council | advisory, council, strategy, decision | |
| action-items | action, todo, task, followup, reminder | |

## Architecture

- **telegram-client.js** — Low-level Telegram Bot API (sendMessage, sendDocument, createForumTopic via message_thread_id)
- **slack-client.js** — Slack Web API (mention-only, allowlist, 👀 auto-react, 2-message limit)
- **router.js** — Content-type → topic resolution with isolation enforcement
- **setup-topics.js** — One-time topic creation, saves threadIds to config.json
- **send.js** — CLI interface
- **config.json** — All config, 1Password refs for secrets

## Slack Behavior

- **Mention-only**: ignores messages unless bot is @mentioned
- **User allowlist**: configurable in config.json (empty = all allowed)
- **Auto-reaction**: 👀 on receipt
- **No intermediates**: one complete message per response, max 2 per task
