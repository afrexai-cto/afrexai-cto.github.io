---
name: afrexai-standup-bot
description: Automated daily standup summaries from git commits, task boards, and memory files. Posts a team update without the meeting.
---

# Standup Bot

Kill the daily standup meeting. Get the same information automatically from what people actually shipped.

## What It Does

1. Pulls git log from the last 24 hours
2. Reads today's and yesterday's memory/daily files
3. Checks task board or TODO files for status changes
4. Compiles a standup-format summary
5. Delivers via message or writes to `standups/YYYY-MM-DD.md`

## Usage

Tell your agent: "Run standup" or schedule it daily at 9am.

## How It Works

The agent will:
1. Run `git log --since="24 hours ago" --oneline --all` for shipped work
2. Read `memory/YYYY-MM-DD.md` for today and yesterday
3. Check for TODO.md, board files, or task trackers
4. Identify blockers mentioned in any of the above
5. Format and deliver

## Output Format

```markdown
# Standup — Feb 15, 2026

## Done (last 24h)
- Shipped competitor intel skill to ClawHub
- Fixed SSH deploy key rotation
- 3 cold emails sent to financial services prospects

## In Progress
- AaaS platform POC testing
- Building 5 more ClawHub skills

## Blocked
- GA4 setup (needs account creation)
- Custom domain (needs DNS config)

## Today's Focus
- Publish remaining skills
- Improve landing page conversion copy
```

## Configuration

Set these in your workspace to customize:

- **Git repos**: defaults to current workspace, or set `STANDUP_REPOS` in a config file
- **Delivery**: defaults to file output. Set up a cron with messaging to deliver to Slack/Telegram/Discord
- **Team mode**: if multiple people commit to the same repo, the standup groups by author

## Recommended Cron

Daily 9am:
```
Schedule: cron, expr: "0 9 * * 1-5"
Payload: "Run daily standup. Summarize git commits, memory files, and task status from last 24h."
```

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
