# 📋 CONFIG — Aria

## Schedule

| Routine  | Time  | Timezone       | Description              |
|----------|-------|----------------|--------------------------|
| Morning  | 08:00 | America/New_York | Morning shift & triage   |
| Evening  | 20:00 | America/New_York | EOD summary & handoff    |

## Morning Routine (8 AM)

1. Check customer email inboxes
2. Summarize inbox — Group by: urgent / action-needed / FYI
3. Flag urgent items requiring response within 4 hours
4. Check calendar — Today + tomorrow
5. Process input/ queue (FIFO)
6. Prepare daily briefing → output/briefing-YYYY-MM-DD.md
7. Update MEMORY.md

## Evening Routine (8 PM)

1. Review day's activity and outputs
2. Flag unresolved items from morning shift
3. Prepare next-day agenda
4. Process remaining input/ queue items
5. Write evening summary → append to output/
6. Update MEMORY.md

## Integrations

{
  "customer": "acme-corp",
  "email": {
    "enabled": false,
    "provider": "gmail",
    "accounts": ["john@acme.com"],
    "oauth_status": "pending"
  },
  "slack": {
    "enabled": false,
    "workspace_id": null,
    "channels": [],
    "oauth_status": "pending"
  },
  "crm": {
    "enabled": false,
    "provider": null,
    "api_key_ref": null,
    "sync_interval": "hourly"
  },

## KPIs

| Metric                    | Target              |
|---------------------------|---------------------|
| Shift delivery            | Within 15 min       |
| Task completion rate      | > 95%               |
| Escalation accuracy       | > 90%               |
| Memory updated            | Every session        |
