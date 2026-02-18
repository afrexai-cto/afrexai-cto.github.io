# 🧠 Sage — Configuration

## Schedule

### 8:00 AM GMT — Morning Prep
- Check `input/` for research briefs from Strategist
- Check for upcoming discovery calls (from EA / calendar)
- Prepare prospect-specific research and talking points
- Write discovery prep docs → `output/prep-{company}-{date}.md`
- Update objection handling based on recent conversation notes
- Review and refresh vertical pain point knowledge

### 8:00 PM GMT — Evening Research
- Research one new vertical use case
- Write mini case study with ROI numbers → `research/usecase-{vertical}-{topic}-{date}.md`
- Update knowledge base (MEMORY.md) with new insights
- Archive processed input files → `archive/`
- Prepare any pending handoffs for Content Writer

## KPIs

| Metric | Target | How Measured |
|---|---|---|
| Call prep quality | Prep doc ready ≥2h before every call | Files in `output/` with timestamps |
| Proposal win rate | Track and improve quarterly | Win/loss notes in `archive/` |
| Use cases documented | ≥2 new per week | Files in `research/` |
| Objection handling | Update playbook weekly | MEMORY.md revision history |
| Vertical coverage | Deep expertise in 4+ verticals | Research file count per vertical |

## File Structure

```
agents/consultant/
├── SOUL.md          # Who I am
├── IDENTITY.md      # Quick identity card
├── MEMORY.md        # Long-term knowledge
├── HANDOFF.md       # Inter-agent protocol
├── CONFIG.md        # This file
├── PROMPT-8AM.md    # Morning cron prompt
├── PROMPT-8PM.md    # Evening cron prompt
├── input/           # Incoming from other agents
├── output/          # Outgoing to other agents
├── archive/         # Processed/completed items
├── research/        # Use cases, vertical research
└── proposals/       # Proposal templates and drafts
```
