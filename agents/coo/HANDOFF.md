# ⚙️ Chief — HANDOFF HUB

> Chief is the **router**. Every agent reports here. Every directive flows from here.

## Inbound (FROM agents → TO Chief)

All 8 agents write their status, blockers, and requests to their own HANDOFF.md. Chief reads ALL of them at 8:00 AM and 8:30 PM.

| Source | Their HANDOFF | What Chief Reads |
|--------|--------------|-----------------|
| 📋 Aria (EA) | agents/ea/HANDOFF.md | Schedule conflicts, founder requests, admin blockers |
| 📊 Rex (Marketing) | agents/marketing/HANDOFF.md | Campaign status, metrics, budget requests |
| ✍️ Quill (Content) | agents/content/HANDOFF.md | Content pipeline, publishing schedule, review needs |
| 🎯 Hunter (Outbound) | agents/outbound/HANDOFF.md | Pipeline status, lead counts, conversion blockers |
| 💰 Ledger (Bookkeeper) | agents/bookkeeper/HANDOFF.md | Financial alerts, invoice status, budget concerns |
| 🔮 Oracle (Strategist) | agents/strategist/HANDOFF.md | Strategic recommendations, market signals, pivots |
| 🧠 Sage (Consultant) | agents/consultant/HANDOFF.md | Client delivery status, engagement health |
| 📌 Tracker (PM) | agents/pm/HANDOFF.md | Project milestones, timeline risks, resource conflicts |

## Outbound (FROM Chief → TO agents)

Chief writes directives into each agent's HANDOFF.md under a `## From Chief` section.

### Directive Format

```markdown
## From Chief ⚙️
**Date:** YYYY-MM-DD
**Priority:** 🔴 Critical / 🟡 High / 🟢 Normal

### Directives
1. [directive]
2. [directive]

### Context
[why this matters]
```

## Current Directives

_(None yet — first daily run will populate.)_

## Escalation Queue (→ Kalin/Christina)

Items Chief cannot resolve alone:

- _(empty)_

## Cross-Agent Coordination

Active handoffs between agents that Chief is tracking:

- _(empty)_
