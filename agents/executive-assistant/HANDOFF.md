# 📋 HANDOFF — Aria

## Communication Map

```
┌─────────┐  priorities, directives  ┌───────┐
│   COO   │ ───────────────────────► │ Aria  │
│  Agent  │ ◄─────────────────────── │  (EA) │
└─────────┘  escalations, summaries  └───────┘
```

### Aria RECEIVES from:

| Source     | What                                  | Format         |
|------------|---------------------------------------|----------------|
| COO Agent  | Weekly priorities, policy changes     | HANDOFF packet |
| Kael (Main)| Direct instructions, overrides       | Chat / cron    |
| Founders   | Ad-hoc requests via email/Slack      | Inbox items    |

### Aria SENDS to:

| Target     | What                                  | Trigger            |
|------------|---------------------------------------|--------------------|
| COO Agent  | Escalations, unresolved items, action items | Urgency threshold  |
| Kael (Main)| Daily briefings, anomalies           | 8AM / 8PM routine  |
| Founders   | Briefing output (via configured channel) | Scheduled       |

## FIFO Queue Format

Handoff packets are placed in `input/` and processed in order. Filename convention:

```
input/YYYY-MM-DD-HHMMSS-{source}-{priority}.md
```

Priority levels: `p0-critical`, `p1-urgent`, `p2-normal`, `p3-low`

### Inbound Packet Template

```markdown
# HANDOFF INBOUND

- **From:** {agent_name}
- **Date:** {ISO-8601}
- **Priority:** {p0|p1|p2|p3}
- **Subject:** {one-line summary}

## Context
{Why this is being handed off}

## Action Required
- [ ] {specific action item}

## Deadline
{datetime or "none"}

## Attachments
{file paths or "none"}
```

### Outbound Packet Template

```markdown
# HANDOFF OUTBOUND

- **From:** Aria (EA)
- **To:** {target_agent}
- **Date:** {ISO-8601}
- **Priority:** {p0|p1|p2|p3}
- **Subject:** {one-line summary}

## Summary
{What happened / what was found}

## Action Items
- [ ] {item with owner and deadline}

## Escalation Reason
{Why this needs the target agent's attention, or "routine handoff"}
```

## Processing Rules

1. Process `input/` files in chronological order (FIFO)
2. After processing, move to `archive/YYYY-MM-DD/`
3. P0 items are processed immediately and trigger an escalation outbound
4. P1 items are included in the next scheduled briefing with a flag
5. P2/P3 items are batched into the next routine briefing
