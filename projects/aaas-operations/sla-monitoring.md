# SLA & Monitoring Guide

**Version:** 1.0 | **Last Updated:** 2026-02-22

---

## SLA Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Uptime | 99.5% (allows ~3.6h downtime/mo) | UptimeRobot |
| Response to critical issues | < 4 hours | Slack/email timestamp |
| Agent task completion | > 90% success rate | Weekly log review |
| Config change requests | < 24 hours | Ticket tracking |

---

## UptimeRobot Setup (Free Tier)

**Free tier allows 50 monitors at 5-minute intervals** — enough for 50 customers.

### Per-Customer Monitor Setup

1. Go to [UptimeRobot Dashboard](https://dashboard.uptimerobot.com/)
2. Click "Add New Monitor"
3. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `AaaS — <Customer Name>`
   - **URL:** `http://<SERVER_IP>:3000/health`
   - **Monitoring Interval:** 5 minutes
4. Alert Contacts:
   - ops@afrexai.com (always)
   - Customer contact (optional, if they want visibility)

### Alert Escalation

```
Monitor DOWN detected (UptimeRobot)
    ↓
Email to ops@afrexai.com (immediate)
    ↓
If not resolved in 15 min → Slack #aaas-alerts
    ↓
If not resolved in 1 hour → SMS to on-call (Kalin)
    ↓
If not resolved in 2 hours → Customer notification
```

### UptimeRobot Webhook (Optional)

For Slack integration, add webhook alert contact:
- URL: Slack incoming webhook URL for #aaas-alerts
- POST payload: default UptimeRobot format

---

## Monthly Uptime Reporting

Generate monthly SLA reports for customers:

### Data Collection

```bash
# UptimeRobot API — get monitor stats
curl -X POST "https://api.uptimerobot.com/v2/getMonitors" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "<UPTIMEROBOT_API_KEY>",
    "monitors": "<MONITOR_ID>",
    "custom_uptime_ratios": "30",
    "logs": 1,
    "log_types": "1-2"
  }'
```

### Report Template

```markdown
# Monthly SLA Report — <Customer Name>
**Period:** <Month Year>

## Uptime
- **Target:** 99.5%
- **Actual:** XX.XX%
- **Total downtime:** X minutes
- **Incidents:** X

## Incidents
| Date | Duration | Cause | Resolution |
|------|----------|-------|------------|
| ... | ... | ... | ... |

## Agent Performance
- Tasks executed: XXX
- Success rate: XX%
- Notable outputs: ...

## Next Month Focus
- ...
```

---

## Server Health Checks (Manual)

Run periodically or when investigating issues:

```bash
# CPU & Memory
ssh root@<IP> "htop -bn1 | head -15"

# Disk usage
ssh root@<IP> "df -h /"

# OpenClaw service status
ssh root@<IP> "systemctl status openclaw"

# Recent logs (last 50 lines)
ssh root@<IP> "journalctl -u openclaw --no-pager -n 50"

# Check cron execution
ssh root@<IP> "journalctl -u openclaw --since '08:00' --until '08:30' --no-pager"
```

---

## Scaling Thresholds

When to upgrade from CX31:

| Metric | Upgrade Trigger | Action |
|--------|----------------|--------|
| CPU consistently > 80% | 3+ days | Upgrade to CX41 |
| RAM > 7GB | Persistent | Upgrade to CX41 |
| Disk > 70GB | Growing trend | Upgrade to CX41 or add volume |
| Customer adds > 5 agents | At deployment | Start with CX41 |

### Upgrade Process

```bash
# Via Hetzner API
curl -X POST "https://api.hetzner.cloud/v1/servers/<ID>/actions/change_type" \
  -H "Authorization: Bearer $HETZNER_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"server_type": "cx41", "upgrade_disk": true}'
```

Note: Server will reboot during type change. Schedule during customer's off-hours.
