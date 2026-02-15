# 💰 CONFIG — Hunter

## Schedule

| Routine  | Time  | Timezone       | Description              |
|----------|-------|----------------|--------------------------|
| Morning  | 08:00 | America/New_York | Morning shift & triage   |
| Evening  | 20:00 | America/New_York | EOD summary & handoff    |

## Morning Routine (8 AM)

1. Review CRM pipeline — new leads, stale deals, follow-ups due
2. Check email for prospect replies
3. Identify top 5 priority outreach targets
4. Draft personalized outreach messages
5. Update pipeline status in output/pipeline-YYYY-MM-DD.md
6. Process input/ queue
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
