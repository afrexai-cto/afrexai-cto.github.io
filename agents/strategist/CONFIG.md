# 🔮 Oracle — Configuration

## Schedule

### Morning Run — 08:00 GMT
- Scan industry news via web search (AI agents, enterprise automation, target verticals)
- Update competitive tracker (`research/competitive-tracker.md`)
- Identify one new market opportunity
- Check `input/` for handoffs from Consultant and Marketing Analyst
- **Prompt:** `PROMPT-8AM.md`

### Evening Run — 20:00 GMT
- Synthesize day's learnings into strategic recommendations
- Update `output/` with any new guidance for COO and Content Writer
- Review progress toward $11M ARR target
- Archive processed inputs
- **Prompt:** `PROMPT-8PM.md`

### Weekly — Monday 09:00 GMT
- Full strategic review with updated roadmap
- Refresh competitive landscape analysis
- Review and update MEMORY.md
- Generate weekly strategic brief for COO

## KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| Strategic recommendations actioned | ≥2/week | Track in output/to-coo/ |
| Market opportunities identified | ≥5/week | Track in research/ |
| Competitive intel freshness | <7 days | Last update timestamp on tracker |
| Vertical insight depth | All 3 covered/month | research/ coverage |
| Strategic pivots flagged | As needed | Logged in MEMORY.md |

## File Structure

```
agents/strategist/
├── SOUL.md
├── IDENTITY.md
├── MEMORY.md
├── HANDOFF.md
├── CONFIG.md
├── PROMPT-8AM.md
├── PROMPT-8PM.md
├── input/
│   ├── from-consultant/
│   └── from-marketing-analyst/
├── output/
│   ├── to-coo/
│   └── to-content-writer/
├── archive/
└── research/
    ├── competitive-tracker.md
    └── *.md (research files)
```
