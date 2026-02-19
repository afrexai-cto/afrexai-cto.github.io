# AfrexAI Systems Dashboard

Unified status dashboard for all 26 AfrexAI platform systems.

## Quick Start

```bash
# Update system status
node update-status.js

# Open dashboard
open index.html
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Dashboard UI (single-page, no dependencies) |
| `status.json` | System status data (auto-generated) |
| `update-status.js` | Scans system dirs and updates status.json |

## Status Codes

- ✅ **running** — Active within last 24h
- ⚠️ **needs_keys** — API keys not configured
- ❌ **error** — Failed or stale (>24h)

## Automation

Add to cron or heartbeat to keep status fresh:
```bash
*/30 * * * * cd /Users/openclaw/.openclaw/workspace-main/systems/dashboard && node update-status.js
```
