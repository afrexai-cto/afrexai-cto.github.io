---
name: afrexai-client-health
description: Monitor client health signals — email response times, engagement frequency, sentiment shifts. Flag at-risk accounts before they churn.
---

# Client Health Monitor

Spot at-risk clients before they ghost you. Runs daily or weekly to track engagement signals.

## What It Does

1. Reads your CRM or client list from `clients.md` or CSV
2. Checks recent email/message history for each client
3. Scores health based on response time, frequency, and sentiment
4. Flags accounts that need attention
5. Outputs to `memory/client-health-YYYY-MM-DD.md`

## Setup

Create `clients.md` in your workspace:

```markdown
# Active Clients

- ClientName | contact@email.com | Monthly retainer | Started 2026-01
- AnotherClient | person@company.com | Project-based | Started 2025-11
```

Or point to a CSV with columns: name, email, type, start_date

## Health Scoring

Each client gets a score from 1-10:

| Signal | Weight | Green | Yellow | Red |
|--------|--------|-------|--------|-----|
| Last response | 30% | <3 days | 3-7 days | >7 days |
| Response rate | 25% | >80% | 50-80% | <50% |
| Meeting frequency | 20% | Monthly+ | Quarterly | None in 90d |
| Sentiment | 15% | Positive | Neutral | Negative |
| Payment status | 10% | Current | 1-15 late | >15 late |

## Report Format

```markdown
# Client Health — 2026-02-15

## 🔴 At Risk (Score < 4)
- **ClientName** (Score: 2.1) — No response in 14 days, last email negative tone
  → Action: Personal call from CEO this week

## 🟡 Watch (Score 4-6)
- **AnotherClient** (Score: 5.3) — Response time increasing, missed last check-in
  → Action: Send value-add content, schedule sync

## 🟢 Healthy (Score > 6)
- **GoodClient** (Score: 8.7) — Responsive, expanding scope discussion
```

## Usage

"Run client health check" or schedule daily via cron.

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
