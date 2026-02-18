---
name: afrexai-report-builder
description: Generate structured business reports from raw data, metrics, or notes. Use when creating weekly reports, monthly reviews, project status updates, board decks, or any recurring business report.
---

# Report Builder

Transform raw data and notes into polished business reports.

## Usage

```
Build a weekly client report for:
- Client: Acme Corp
- Period: Feb 10-14, 2026
- Data: [paste metrics, notes, or file path]
- Format: executive summary + detailed sections
```

## Report Types

### Weekly Status Report
```markdown
# Weekly Report: [Project/Client]
**Period:** YYYY-MM-DD to YYYY-MM-DD

## Executive Summary
[3-5 sentences: what happened, what's next, any blockers]

## Metrics
| Metric | This Week | Last Week | Change |
|---|---|---|---|
| [KPI] | X | Y | +/-Z% |

## Completed
- [Task with outcome]

## In Progress
- [Task] — [% complete, ETA]

## Blockers
- [Issue] — [Impact] — [Proposed resolution]

## Next Week
- [Planned items]
```

### Monthly Business Review
Includes: executive summary, KPI dashboard, highlights, lowlights, recommendations.

### Project Post-Mortem
Includes: objectives vs outcomes, timeline analysis, lessons learned, recommendations.

## Rules

- Always lead with executive summary (busy readers read only this)
- Show trends with change indicators (↑↓→)
- Quantify everything possible — avoid vague language
- Flag risks and blockers prominently
- Keep to 1-2 pages unless more detail requested

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
