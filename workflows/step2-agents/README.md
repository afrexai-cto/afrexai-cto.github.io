# AfrexAI Step 2: Agent Deployment & Management Workflows

End-to-end automation for deploying, updating, integrating, monitoring, and billing AI agents on customer infrastructure.

## Overview

```
Customer signs up → deploy agent → wire integrations → monitor health → bill monthly
                         ↕
                   update / rollback
```

## Scripts

### 1. `agent-deploy-remote.sh` — Deploy Agent

Generates a complete agent bundle (SOUL, IDENTITY, CONFIG, MEMORY, HANDOFF, prompts) and prepares it for deployment to a customer's system via SSH.

```bash
./agent-deploy-remote.sh <customer> <agent_type> <ssh_host> [op_uri]

# Examples
./agent-deploy-remote.sh acme assistant deploy@acme.com
./agent-deploy-remote.sh globex support admin@10.0.1.50 op://AfrexAI/Globex-SSH/private_key

# Auto-deploy (requires 1Password CLI + SSH access)
AUTO_DEPLOY=true ./agent-deploy-remote.sh acme assistant deploy@acme.com
```

**Agent types:** `assistant` | `support` | `sales` | `ops` | `custom`

**Generated files:**
- `SOUL.md` — Personality and behavioral guidelines (type-specific)
- `IDENTITY.yaml` — Agent metadata, version, runtime config
- `CONFIG.yaml` — Runtime settings, feature flags, security
- `MEMORY.md` — Initial memory state
- `HANDOFF.md` — Escalation procedures
- `prompts/` — System, greeting, and error prompts
- `install.sh` — Remote installer
- `health-check.sh` — Health endpoint (installed on customer system)

### 2. `agent-update-pipeline.sh` — Update Agents

Push config, soul, prompt, or full updates to deployed agents with automatic backup and rollback.

```bash
./agent-update-pipeline.sh <customer> <agent_type> <update_type> [version]

# Examples
./agent-update-pipeline.sh acme assistant config         # Config patch
./agent-update-pipeline.sh acme assistant full 2.0.0     # Full upgrade
./agent-update-pipeline.sh acme assistant rollback       # Revert to backup
```

**Update types:** `config` | `soul` | `prompts` | `full` | `rollback`

- Creates backup before every update
- Tracks version history in `versions/`
- Auto-increments version (patch for config/soul/prompts, minor for full)
- Shows diff for config updates

### 3. `integration-connector.sh` — Wire Integrations

Generate integration configs and setup guides for connecting agents to customer tools.

```bash
./integration-connector.sh <customer> <agent_type> <integration> [op_uri]

# Examples
./integration-connector.sh acme assistant slack op://AfrexAI/Acme-Slack/bot_token
./integration-connector.sh acme support email
./integration-connector.sh globex sales crm op://AfrexAI/Globex-HubSpot/api_key
```

**Integration types:** `slack` | `email` | `crm` | `calendar` | `webhook` | `api`

Each generates:
- `<integration>.yaml` — Config file
- `<integration>.env` — 1Password op:// references for runtime
- `<integration>-setup.md` — Step-by-step setup guide
- Tests 1Password credential access

### 4. `customer-health-dashboard.sh` — Monitor Agents

Poll all deployed agents via SSH and generate a health report.

```bash
./customer-health-dashboard.sh                    # Markdown report
./customer-health-dashboard.sh --json             # JSON report
./customer-health-dashboard.sh --customer acme    # Single customer
```

**Checks:**
- Required files present (SOUL, IDENTITY, CONFIG)
- Disk space
- Log directory writable
- Version match (deployed vs running)

**Reports** saved to `reports/health-<timestamp>.md`

### 5. `billing-tracker.sh` — Billing & Invoices

Track customers, generate invoices, flag overdue accounts.

```bash
./billing-tracker.sh add acme growth 2025-01-15       # Add customer
./billing-tracker.sh list                              # List all
./billing-tracker.sh invoice acme 2025-02              # Generate invoice
./billing-tracker.sh invoice-all 2025-02               # All invoices
./billing-tracker.sh overdue                           # Flag overdue
./billing-tracker.sh pay acme 2025-02                  # Record payment
./billing-tracker.sh summary                           # Revenue summary
```

**Pricing tiers:**

| Tier | Agents | Monthly |
|------|--------|---------|
| Starter | 1 | £499 |
| Growth | 3 | £999 |
| Scale | 10 | £2,499 |
| Enterprise | Unlimited | £4,999 |
| Custom | Custom | Custom |

Overage: £99/agent/month above tier limit (non-enterprise).

## Directory Structure

```
workflows/step2-agents/
├── agent-deploy-remote.sh      # Deploy new agents
├── agent-update-pipeline.sh    # Update existing agents
├── integration-connector.sh    # Wire integrations
├── customer-health-dashboard.sh # Health monitoring
├── billing-tracker.sh          # Billing & invoices
├── README.md
├── deploy.log                  # Deployment activity log
├── crm-deployments.log         # CRM event log
├── deployments/                # Deployment bundles
│   └── backups/                # Pre-update backups
├── versions/                   # Version tracking per agent
├── integrations/               # Integration configs per customer
├── reports/                    # Health dashboard reports
├── billing/                    # Customer DB & invoices
│   ├── customers.tsv           # Customer billing database
│   └── invoice-*.md            # Generated invoices
└── templates/                  # (reserved for custom templates)
```

## Security

- **No secrets in files** — All credentials use 1Password `op://` URIs
- **Runtime injection** — `op run --env-file=<file>.env -- <command>`
- **SSH keys** — Fetched from 1Password, used ephemerally, deleted after
- **Audit log** — All deployments logged to `crm-deployments.log`

## Typical Workflow

```bash
# 1. New customer onboarding
./agent-deploy-remote.sh acme assistant deploy@acme.com
./billing-tracker.sh add acme growth 2025-02-15
./integration-connector.sh acme assistant slack

# 2. Regular operations
./customer-health-dashboard.sh              # Daily check
./billing-tracker.sh invoice-all 2025-02    # Monthly invoices

# 3. Updates
./agent-update-pipeline.sh acme assistant config
# If something breaks:
./agent-update-pipeline.sh acme assistant rollback
```

## Requirements

- Bash 3.2+ (macOS compatible)
- SSH access to customer systems
- 1Password CLI (`op`) for credential management
- Standard POSIX tools (grep, sed, awk, tar, ssh, scp)
