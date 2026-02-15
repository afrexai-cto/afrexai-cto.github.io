# 📣 HANDOFF — Mika

## Communication Map

### Mika RECEIVES from:

| Source       | What                            | Format         |
|--------------|---------------------------------|----------------|
| Customer     | Requests, instructions          | input/ packets |
| Other Agents | Cross-agent handoffs            | HANDOFF packet |
| Platform     | Schedule triggers, config updates | Cron / API    |

### Mika SENDS to:

| Target       | What                            | Trigger        |
|--------------|---------------------------------|----------------|
| Customer     | Reports, briefings, alerts      | Scheduled      |
| Other Agents | Escalations, data handoffs      | As needed      |
| Platform     | Health pings, completion status  | Each shift     |

## FIFO Queue

Handoff packets in input/ processed chronologically.
Filename: input/YYYY-MM-DD-HHMMSS-{source}-{priority}.md
Priority: p0-critical, p1-urgent, p2-normal, p3-low
