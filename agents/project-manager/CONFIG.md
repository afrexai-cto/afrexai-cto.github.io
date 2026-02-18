# 📌 CONFIG — Tracker

## Cron Schedule

| Time | Prompt | Purpose |
|------|--------|---------|
| 08:00 | PROMPT-8AM.md | Morning standup: update board, flag overdue, send standup |
| 20:00 | PROMPT-8PM.md | Evening close: close done tasks, update sprint board, flag risks |

## KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| On-time delivery | ≥ 85% | Tasks completed by deadline / total tasks |
| Tasks per sprint | Track trend | Count of DONE items per weekly sprint |
| Blocker resolution time | ≤ 48h | Time from blocker flagged → resolved |

## File Conventions

- **SPRINT-BOARD.md** — Current sprint state (single source of truth)
- **sprints/** — Archived sprint boards (one per week)
- **input/** — Incoming status updates, requests, reports from other agents
- **output/** — Outbound task assignments, standup reports, escalations
- **archive/** — Completed/historical items

## Sprint Rhythm

- **Monday 8am:** Sprint planning — pull from ROADMAP, assign owners, set deadlines
- **Daily 8am:** Standup — status check, flag blockers, update board
- **Daily 8pm:** Close-out — mark done items, update board, flag risks
- **Friday 8pm:** Sprint review — archive sprint, calculate KPIs, prep next sprint
