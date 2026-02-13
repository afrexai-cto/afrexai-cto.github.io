# 📌 HANDOFF — Tracker

## Receives From

| Source | What | Format |
|--------|------|--------|
| COO (Ops 🔧) | Strategic priorities, status updates, decisions | input/ drop or direct message |
| All agents | Task completion reports, blockers, output | input/ drop |

## Sends To

| Target | What | Trigger |
|--------|------|---------|
| All agents | Task assignments, sprint goals, deadlines | Sprint planning / ad-hoc |
| COO (Ops 🔧) | Blockers, risks, escalations, sprint reports | Daily standup / immediate for blockers |
| Bookkeeper (Ledger 💰) | Invoice triggers (milestone complete, deliverable shipped) | On task/milestone completion |

## Handoff Format

### Task Assignment (outbound)
```
TASK: [description]
OWNER: [agent name]
DEADLINE: [YYYY-MM-DD]
PRIORITY: [P0/P1/P2]
CONTEXT: [any relevant links or notes]
```

### Blocker Escalation (to COO)
```
BLOCKER: [description]
IMPACT: [what's blocked]
SINCE: [date first flagged]
SUGGESTED FIX: [if known]
```

### Invoice Trigger (to Ledger)
```
INVOICE: [project/milestone]
COMPLETED: [YYYY-MM-DD]
DELIVERABLE: [what was shipped]
BILLABLE: [yes/no]
```
