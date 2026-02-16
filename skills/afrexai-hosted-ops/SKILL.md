# AfrexAI Hosted Ops — Skill

Manage the full lifecycle of AfrexAI Hosted Agents: provisioning, monitoring, scaling, backup, SLA tracking, billing, and portal data.

## Scripts

All scripts live in `workflows/step3-hosted/` relative to workspace root. Set `AFREX_DATA_DIR` to control where data is stored (defaults to `workflows/step3-hosted/data`).

### 1. Provision a Customer

```bash
workflows/step3-hosted/provision-customer.sh \
  --name "Acme Legal" --email ceo@acme.com \
  --tier growth --vertical legal
```

Tiers: `starter` (1 agent, $1.5K), `growth` (3 agents, $4.5K), `enterprise` (9 agents, $12K).
Verticals: `legal`, `finance`, `healthcare`, `realestate`, `general`.
Use `--dry-run` to preview.

### 2. Multi-Tenant Manager

```bash
# List all customers
workflows/step3-hosted/multi-tenant-manager.sh list

# Aggregate health status
workflows/step3-hosted/multi-tenant-manager.sh status

# Resource usage per customer
workflows/step3-hosted/multi-tenant-manager.sh usage

# Scan for issues (down agents, SLA breaches, high disk)
workflows/step3-hosted/multi-tenant-manager.sh issues

# Full summary
workflows/step3-hosted/multi-tenant-manager.sh summary

# Single customer detail
workflows/step3-hosted/multi-tenant-manager.sh customer <customer-id>

# JSON output
workflows/step3-hosted/multi-tenant-manager.sh list --format json
```

### 3. Auto-Scaler

```bash
# Scale up (adds agents, auto-upgrades tier if needed)
workflows/step3-hosted/auto-scaler.sh scale-up --customer <id> --add 2

# Scale down (archives agent data, auto-downgrades tier)
workflows/step3-hosted/auto-scaler.sh scale-down --customer <id> --remove 1

# Change tier directly
workflows/step3-hosted/auto-scaler.sh change-tier --customer <id> --tier enterprise
```

### 4. Backup & Restore

```bash
# Backup one customer
workflows/step3-hosted/backup-restore.sh backup --customer <id>

# Backup all customers
workflows/step3-hosted/backup-restore.sh backup

# List available backups
workflows/step3-hosted/backup-restore.sh list --customer <id>

# Restore from backup
workflows/step3-hosted/backup-restore.sh restore --customer <id> --backup-id 20260215-120000

# Export customer data (offboarding/compliance)
workflows/step3-hosted/backup-restore.sh export --customer <id>

# Enforce retention policy (delete backups > 90 days)
workflows/step3-hosted/backup-restore.sh retention --dry-run
```

### 5. SLA Monitor

```bash
# Run health check (all or one customer)
workflows/step3-hosted/sla-monitor.sh check
workflows/step3-hosted/sla-monitor.sh check --customer <id>

# Monthly SLA report
workflows/step3-hosted/sla-monitor.sh report --month 2026-02

# View SLA breaches
workflows/step3-hosted/sla-monitor.sh breaches

# Dashboard view with progress bars
workflows/step3-hosted/sla-monitor.sh dashboard
```

SLA targets: Starter 99.5%, Growth 99.9%, Enterprise 99.95%.

### 6. Customer Portal Data

```bash
# Generate portal JSON for one customer
workflows/step3-hosted/customer-portal-data.sh generate --customer <id>

# Generate for all customers
workflows/step3-hosted/customer-portal-data.sh all

# Platform-wide summary (MRR, ARR, agent impact)
workflows/step3-hosted/customer-portal-data.sh summary
```

Output includes: tasks completed, hours saved, cost savings, ROI, uptime, agent status.

### 7. Pricing Engine

```bash
# Price quote
workflows/step3-hosted/pricing-engine.sh quote --tier growth --vertical legal
workflows/step3-hosted/pricing-engine.sh quote --agents 5 --vertical finance --annual

# Compare tiers for a given agent count
workflows/step3-hosted/pricing-engine.sh compare --agents 4

# Generate invoice for a customer
workflows/step3-hosted/pricing-engine.sh invoice --customer <id>

# Generate all invoices for a month
workflows/step3-hosted/pricing-engine.sh invoice-all --month 2026-02

# Revenue report with $11M ARR progress
workflows/step3-hosted/pricing-engine.sh revenue
```

## Typical Workflows

**New customer onboarding:**
1. `pricing-engine.sh quote` → send to prospect
2. `provision-customer.sh` → create environment
3. `sla-monitor.sh check` → verify health
4. `customer-portal-data.sh generate` → portal ready

**Monthly operations:**
1. `sla-monitor.sh report` → SLA compliance
2. `pricing-engine.sh invoice-all` → billing
3. `backup-restore.sh backup` → data protection
4. `multi-tenant-manager.sh summary` → overview
5. `customer-portal-data.sh all` → refresh portal

**Scaling:**
1. `auto-scaler.sh scale-up --customer <id> --add N`
2. `sla-monitor.sh check --customer <id>` → verify
3. `pricing-engine.sh invoice --customer <id>` → updated billing

## Data Layout

```
workflows/step3-hosted/data/
├── customers/
│   └── cust-<slug>-<ts>/
│       ├── config/manifest.json
│       ├── agents/<name>/config/agent.json
│       ├── agents/<name>/memory/context.json
│       ├── agents/<name>/logs/activity.log
│       ├── monitoring/health.json
│       ├── monitoring/sla.json
│       ├── data/portal/dashboard.json
│       └── backups/<timestamp>/
├── invoices/<YYYY-MM>/<cid>.json
├── crm.log
├── billing.log
├── emails.log
└── sla-alerts.log
```

## Notes

- All scripts are Bash 3.2 compatible (macOS safe, no bashisms)
- No external dependencies (no jq, no python — pure bash + sed/awk)
- Add `--dry-run` where supported to preview changes
- Set `AFREX_DATA_DIR` env var to change data directory
- All scripts have `--help` / `-h`
