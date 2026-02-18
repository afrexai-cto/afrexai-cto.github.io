---
name: afrexai-weekly-report
description: Generate a structured weekly business report from your workspace files, git history, CRM data, and memory logs. Delivers a CEO-ready summary every Friday.
---

# Weekly Report Generator

Automatically compile what happened this week into a clean, actionable report.

## What It Does

1. Scans `memory/YYYY-MM-DD.md` files from the past 7 days
2. Pulls git log for commits and shipped work
3. Reads CRM/pipeline data if available
4. Checks email activity logs
5. Outputs a structured weekly report

## Usage

Tell your agent: "Generate weekly report" or schedule it Friday afternoon.

## How It Works

The agent will:
1. Read daily memory files for the past 7 days
2. Run `git log --oneline --since="7 days ago"` for shipped work
3. Check for CRM files (csv, json) for pipeline movement
4. Scan for any revenue/payment logs
5. Compile into `reports/weekly-YYYY-MM-DD.md`

## Report Format

```markdown
# Weekly Report — Week of Feb 10, 2026

## Shipped This Week
- [Feature/page/skill with link]
- [Bug fix or improvement]

## Pipeline
- New leads: X
- Emails sent: X
- Replies received: X
- Meetings booked: X

## Revenue
- New MRR: $X
- Total MRR: $X

## Blockers
- [What's stuck and why]

## Next Week Priorities
1. [Top priority]
2. [Second]
3. [Third]
```

## Recommended Cron

Friday 5pm:
```
Schedule: cron, expr: "0 17 * * 5"
Payload: "Generate weekly report from this week's memory files, git log, and CRM data."
```

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
