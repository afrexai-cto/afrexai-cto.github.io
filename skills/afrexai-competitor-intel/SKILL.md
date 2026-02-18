---
name: afrexai-competitor-intel
description: Track competitor pricing, features, and positioning. Run weekly to stay ahead of market shifts. Outputs structured intel to a markdown file.
---

# Competitor Intel Tracker

Monitor competitors automatically. Run on a cron or manually when you need a market snapshot.

## What It Does

1. Takes a list of competitors (names or URLs) from `competitors.md` in your workspace
2. Searches the web for recent pricing, feature announcements, and positioning changes
3. Outputs a structured report to `memory/competitor-intel-YYYY-MM-DD.md`
4. Flags anything that changed since last run

## Setup

Create `competitors.md` in your workspace:

```markdown
# Competitors

- CompanyName | https://their-site.com | "their product category"
- AnotherCo | https://another.com | "what they sell"
```

## Usage

Tell your agent: "Run competitor intel scan" or schedule it weekly via cron.

## How It Works

The agent will:
1. Read `competitors.md` for target list
2. Use `web_search` to find recent news, pricing pages, product updates for each
3. Use `web_fetch` on pricing pages to extract current pricing
4. Compare against previous reports in `memory/competitor-intel-*.md`
5. Write a new dated report highlighting changes

## Report Format

```markdown
# Competitor Intel — 2026-02-15

## CompanyName
- **Pricing:** $X/mo starter, $Y/mo pro (unchanged / UP from $Z)
- **New Features:** [list any announced in last 7 days]
- **Positioning:** [how they describe themselves]
- **Risk Level:** Low/Medium/High (based on overlap with our offering)

## Summary
- [Key changes this week]
- [Opportunities spotted]
```

## Recommended Cron

Weekly Monday 9am:
```
Schedule: cron, expr: "0 9 * * 1"
Payload: "Run competitor intel scan from competitors.md. Compare against last report. Flag changes."
```

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
