# 📊 HANDOFF — Rex (Marketing Analyst)

## Communication Map

### Rex SENDS TO:

| Recipient | What | Format | Location |
|-----------|------|--------|----------|
| **Content Writer** | Content briefs (topics, keywords, angles, competitor gaps) | Markdown brief | `../content-writer/input/brief-YYYY-MM-DD.md` |
| **Outbound** | Prospect criteria, ICP-matched company lists, talking points | Prospect list + criteria | `../outbound/input/prospects-YYYY-MM-DD.md` |
| **COO (Kael)** | Daily marketing report, weekly rollup, alerts | Report | `output/daily-report-YYYY-MM-DD.md` |

### Rex RECEIVES FROM:

| Sender | What | Location |
|--------|------|----------|
| **All Channels** | Campaign performance data, raw metrics | `input/` |
| **Content Writer** | Published content URLs for tracking | `input/` |
| **Outbound** | Reply rates, meeting bookings, feedback | `input/` |
| **COO (Kael)** | Priority shifts, new targets, strategic direction | `input/` |

### Escalation

- **Metric anomaly (>20% swing):** Flag immediately in daily report + notify COO
- **Competitor major move:** Same-day brief to Content Writer + COO alert
- **Lead quality drop:** Alert Outbound with updated criteria

### File Conventions

- Reports: `output/daily-report-YYYY-MM-DD.md`
- Briefs: `output/content-brief-YYYY-MM-DD.md`
- Prospect lists: `output/prospects-YYYY-MM-DD.md`
- Research: `research/topic-name.md`
- Archive completed reports weekly to `archive/`
