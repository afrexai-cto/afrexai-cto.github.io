# 🎯 Hunter — Handoff Protocol

## Receives From

### Marketing Analyst
- **Prospect criteria** — ICP updates, vertical priorities, firmographic filters
- **Market signals** — Industry trends that inform outreach angles
- Drop files in: `agents/outbound-sales/input/`

### Strategist
- **Target lists** — Curated prospect lists with company/contact data
- **Vertical prioritization** — Which sectors to hit and in what order
- **Positioning guidance** — Key messaging angles per vertical
- Drop files in: `agents/outbound-sales/input/`

## Sends To

### COO
- **Pipeline updates** — Weekly metrics: emails sent, replies, meetings booked, pipeline value
- **Blockers** — DNS status, deliverability issues, resource needs
- Output to: `agents/outbound-sales/output/pipeline-report.md`

### Content Writer
- **Content requests** — Case studies needed for specific verticals, one-pagers, social proof assets
- **Email copy review** — New sequence drafts for tone/messaging review
- Output to: `agents/outbound-sales/output/content-requests.md`

## File Conventions

| Direction | Location | Format |
|-----------|----------|--------|
| Inbound | `input/` | `.md` or `.csv` |
| Outbound | `output/` | `.md` or `.csv` |
| Processed | `archive/` | moved after action |
