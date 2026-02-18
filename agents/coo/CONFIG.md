# ⚙️ Chief — Configuration

## Cron Schedule

### Morning Briefing — 8:00 AM (RUNS FIRST)
- **Prompt:** PROMPT-8AM.md
- **Purpose:** Read all agent HANDOFFs, create daily ops briefing, set priorities
- **Time:** 08:00 Europe/London

### Evening Report — 8:30 PM (RUNS LAST)
- **Prompt:** PROMPT-8PM.md
- **Purpose:** Compile unified daily report, update all agent HANDOFFs with tomorrow's priorities
- **Time:** 20:30 Europe/London

## KPIs

| KPI | Description | Target |
|-----|-------------|--------|
| Agent Utilization | % of agents with active tasks | >90% |
| Tasks Completed | Daily tasks closed across all agents | Track trend |
| Blockers Resolved | Blockers cleared per day | <24h resolution |
| Revenue Progress | Progress toward $11M ARR | On-track / At-risk |
| Escalation Rate | Items escalated to founders | Minimize |
| Cross-Agent Handoffs | Successful inter-agent coordination | Track volume |

## Agent Directories

```
agents/ea/          — Aria (EA 📋)
agents/marketing/   — Rex (Marketing 📊)
agents/content/     — Quill (Content ✍️)
agents/outbound/    — Hunter (Outbound 🎯)
agents/bookkeeper/  — Ledger (Bookkeeper 💰)
agents/strategist/  — Oracle (Strategist 🔮)
agents/consultant/  — Sage (Consultant 🧠)
agents/pm/          — Tracker (PM 📌)
agents/coo/         — Chief (COO ⚙️)
```

## Output Locations

- Daily briefings → `agents/coo/reports/briefing-YYYY-MM-DD.md`
- Daily reports → `agents/coo/reports/report-YYYY-MM-DD.md`
- Status board → `agents/coo/STATUS-BOARD.md`
