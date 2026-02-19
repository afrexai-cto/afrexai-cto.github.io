# Daily Briefing System

Generates a consolidated morning briefing with calendar events, CRM context, tasks, social performance, and email threads.

## Usage

```bash
node briefing.js                    # Today's briefing
node briefing.js --date=2026-02-19  # Specific date
```

## Architecture

```
briefing.js          ← Main generator, orchestrates all sources
config.json          ← Pluggable source configuration
sources/
  calendar.js        ← Calendar events (local JSON / Google Calendar stub)
  crm.js             ← Contact enrichment & lookup
  tasks.js           ← Action items, overdue, waiting-on
  social.js          ← Content performance metrics
  email.js           ← Email thread cross-referencing
sample-data/         ← Test data for all sources
```

## Configuration

Each source in `config.json` can be enabled/disabled independently and pointed to different providers:

```json
{
  "sources": {
    "calendar": { "enabled": true, "provider": "local", "path": "sample-data/calendar.json" },
    "crm": { "enabled": false }
  }
}
```

To add a new source: create `sources/mysource.js`, add config entry, import in `briefing.js`.

## Briefing Sections

1. **Schedule** — Today's events with times and locations
2. **CRM Context** — Per-attendee: name, title, company, deal stage, last interaction, notes
3. **Related Emails** — Threads cross-referenced to each meeting
4. **Action Items** — Overdue → Due Today → Waiting On → Coming Up
5. **Social Performance** — Yesterday's posts with metrics per platform
6. **Unread Emails** — Inbox highlights

## Scheduling

For 7am daily runs, add a cron job or use OpenClaw's cron system:
```
0 7 * * * cd /path/to/daily-briefing && node briefing.js
```
