# AfrexAI Step 3: Hosted Agents — Workflow Automation

> The $11M ARR engine. Customer buys OpenClaw through AfrexAI. We host everything.

## Architecture

```
Customer signs up → provision-customer.sh creates isolated environment
                  → Agents deployed per tier
                  → Monitoring, SLA tracking, portal data — all automated
                  → 70-85% margins on per-customer Docker instances
```

## Pricing

| Tier       | Agents | Monthly | ARR Equiv |
|------------|--------|---------|-----------|
| Starter    | 1      | $1,500  | $18,000   |
| Growth     | 3      | $4,500  | $54,000   |
| Enterprise | 9      | $12,000 | $144,000  |

To hit $11M ARR: ~77 Enterprise customers, or ~204 Growth, or mix.

## Scripts

### 1. `provision-customer.sh` — Customer Onboarding

Provisions a complete isolated customer environment.

```bash
./provision-customer.sh --name "Acme Legal" --email ceo@acme.com --tier growth --vertical legal
./provision-customer.sh --name "QuickBooks Pro" --email admin@qbp.com --tier starter --dry-run
```

Creates: config, agent deployments, monitoring, welcome email, CRM log.

### 2. `multi-tenant-manager.sh` — Fleet Management

Manage all hosted customers from one view.

```bash
./multi-tenant-manager.sh list                    # All customers
./multi-tenant-manager.sh status                  # Aggregate health
./multi-tenant-manager.sh usage                   # Resource usage
./multi-tenant-manager.sh issues                  # Flag problems
./multi-tenant-manager.sh summary                 # Full report
./multi-tenant-manager.sh customer cust-acme-123  # Single customer detail
```

### 3. `auto-scaler.sh` — Agent Scaling

Scale agents up/down with automatic tier and billing adjustments.

```bash
./auto-scaler.sh scale-up --customer cust-acme-123 --add 2
./auto-scaler.sh scale-down --customer cust-acme-123 --remove 1
./auto-scaler.sh change-tier --customer cust-acme-123 --tier enterprise
```

Archives agent data on scale-down. Enforces tier limits.

### 4. `backup-restore.sh` — Data Management

Full backup, restore, export, and retention management.

```bash
./backup-restore.sh backup                                    # All customers
./backup-restore.sh backup --customer cust-acme-123           # Single customer
./backup-restore.sh restore --customer cust-acme-123 --backup-id 20260215-120000
./backup-restore.sh export --customer cust-acme-123 --output /tmp/export
./backup-restore.sh retention --dry-run                       # Preview cleanup
./backup-restore.sh retention                                 # Delete backups >90 days
./backup-restore.sh list                                      # Show all backups
```

### 5. `sla-monitor.sh` — SLA Tracking

Monitor uptime, response times, and SLA compliance.

```bash
./sla-monitor.sh check                         # Health check all customers
./sla-monitor.sh check --customer cust-acme-123
./sla-monitor.sh report                        # Monthly SLA report
./sla-monitor.sh report --month 2026-01
./sla-monitor.sh breaches                      # All SLA breaches
./sla-monitor.sh dashboard                     # Visual dashboard
```

SLA targets by tier: Starter 99.5%, Growth 99.9%, Enterprise 99.95%.

### 6. `customer-portal-data.sh` — Portal Data Generation

Generate JSON data for customer-facing dashboards.

```bash
./customer-portal-data.sh generate --customer cust-acme-123
./customer-portal-data.sh all                  # All customers
./customer-portal-data.sh all --output /tmp/portal
./customer-portal-data.sh summary              # Platform-wide summary with ARR tracking
```

Outputs: tasks completed, hours saved, cost savings, ROI metrics, agent activity.

## Data Structure

```
data/
├── customers/
│   └── cust-{slug}-{ts}/
│       ├── config/
│       │   └── manifest.json          # Customer config, tier, API key
│       ├── agents/
│       │   └── {agent-name}/
│       │       ├── config/agent.json   # Agent config
│       │       ├── memory/context.json # Agent memory
│       │       └── logs/activity.log   # Agent activity
│       ├── data/
│       │   └── portal/dashboard.json   # Portal data
│       ├── logs/
│       ├── backups/
│       │   ├── {timestamp}/            # Full backups
│       │   └── archived-agents/        # Scaled-down agent archives
│       └── monitoring/
│           ├── health.json             # Current health status
│           └── sla.json                # SLA tracking
├── crm.log                            # CRM event log (JSONL)
├── billing.log                        # Billing event log (JSONL)
├── emails.log                         # Email queue log
└── sla-alerts.log                     # SLA breach alerts
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AFREX_DATA_DIR` | `./data` | Root data directory |
| `AFREX_RETENTION_DAYS` | `90` | Backup retention period |

## Typical Workflow

```bash
# 1. Onboard a customer
./provision-customer.sh --name "BigLaw LLP" --email partner@biglaw.com --tier enterprise --vertical legal

# 2. Monitor fleet
./multi-tenant-manager.sh summary
./sla-monitor.sh check

# 3. Customer wants more agents
./auto-scaler.sh scale-up --customer cust-biglaw-llp-xxx --add 3

# 4. Generate portal data
./customer-portal-data.sh generate --customer cust-biglaw-llp-xxx

# 5. Nightly backup
./backup-restore.sh backup

# 6. Monthly SLA report
./sla-monitor.sh report --month 2026-02

# 7. Quarterly retention cleanup
./backup-restore.sh retention
```

## Compatibility

All scripts are bash 3.2+ compatible (macOS default). No external dependencies beyond coreutils.
