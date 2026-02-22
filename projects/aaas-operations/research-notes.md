# OpenClaw Hosting & Multi-Tenant Research

**Date:** 2026-02-22
**Purpose:** Determine how to deploy OpenClaw instances for AaaS customers

---

## Key Findings

### OpenClaw Architecture
- OpenClaw runs as a **local daemon** (gateway) on a host machine
- Controlled via CLI: `openclaw gateway start/stop/restart/status`
- Uses Node.js runtime (currently v25.6.0)
- Agents are configured via workspace files (SOUL.md, AGENTS.md, etc.)
- Cron scheduling built in: `openclaw cron exec --label <name>`
- File-based coordination between agents (workspace directories)
- Supports multiple channels: webchat, Discord, Slack, etc.

### Multi-Tenant Approach
OpenClaw does **not** have built-in multi-tenancy. Each customer needs:
- **Dedicated VPS** — one OpenClaw instance per customer
- **Isolated workspace** — customer-specific configs, agents, memory
- **Separate API keys** — each instance uses customer's or our API keys
- **Independent cron schedules** — per-customer automation timing

This is actually **ideal for AaaS** because:
1. Complete isolation — one customer's data never touches another's
2. Independent scaling — can upgrade individual VPS as needed
3. Simple billing — VPS cost maps directly to customer
4. Easy teardown — cancel = destroy VPS

### Deployment Model
```
Customer A: Hetzner VPS (CX31) → OpenClaw instance → Customer A workspace
Customer B: Hetzner VPS (CX31) → OpenClaw instance → Customer B workspace
Customer C: Hetzner VPS (CX31) → OpenClaw instance → Customer C workspace
```

### Cost Per Customer
| Component | Monthly Cost |
|-----------|-------------|
| Hetzner CX31 (2 vCPU, 8GB RAM, 80GB SSD) | ~€8.49 (~$9) |
| Anthropic API (Claude Sonnet, moderate use) | ~$50-150 |
| UptimeRobot monitor (free tier) | $0 |
| Domain/SSL (Let's Encrypt) | $0 |
| **Total infrastructure cost** | **~$60-160/mo** |

At $1,500/mo pricing → **90-96% gross margin on infrastructure**

### Integration Capabilities (from 9-agent plan)
OpenClaw agents can connect to:
- Gmail, Google Sheets, Google Calendar
- Slack, Discord
- QuickBooks
- Calendly
- Web browsing/scraping
- 1Password for secrets management

### Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| OpenClaw updates breaking customer instances | Pin versions, test before rolling updates |
| API key management across instances | 1Password vault per customer |
| Node.js compatibility | Use nvm, pin Node version per instance |
| Customer data isolation | Separate VPS = physical isolation |

---

## Recommendations

1. **Start with manual deployment** — deploy first 3 customers by hand to learn the process
2. **Automate with deploy-customer.sh** — script Hetzner API + config copy
3. **Build monitoring dashboard** — UptimeRobot + simple status page
4. **Consider Coolify/Dokku later** — once at 10+ customers, evaluate container orchestration
