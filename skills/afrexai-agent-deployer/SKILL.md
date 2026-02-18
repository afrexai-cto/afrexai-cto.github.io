# 🚀 AfrexAI Agent Deployer Skill

Deploy, manage, update, and monitor customer AI agents across remote infrastructure.

## Overview

This skill provides the full lifecycle for managing customer agents in the AfrexAI Agent-as-a-Service (AaaS) platform:

1. **Provision** — Create customer workspace, generate agent configs
2. **Deploy** — Push agent to remote host via SSH
3. **Update** — Sync config/skill changes via rsync
4. **Monitor** — Health checks, dashboards, alerts
5. **Bill** — Usage tracking, invoice generation
6. **Integrate** — Connect agents to Slack, email, CRM, calendar

## Directory Layout

```
workflows/step2-agents/       # Core deployment scripts
├── agent-deploy-remote.sh    # Deploy agent to SSH host
├── agent-update-pipeline.sh  # Push updates via rsync
├── billing-tracker.sh        # Usage & invoicing
├── customer-health-dashboard.sh  # Health monitoring
├── integration-connector.sh  # Tool integrations
├── deployments/              # Generated bundles
├── versions/                 # Version tracking JSON
├── billing/                  # Invoice data
├── integrations/             # Integration configs
└── reports/                  # Health reports

aaas-platform/                # Customer management
├── autopilot.sh              # End-to-end onboarding
├── customer-onboarding.sh    # Workspace provisioning
├── agent-deployer.sh         # Local agent scaffold
├── agent-health-monitor.sh   # Platform health
└── customers/<slug>/         # Per-customer data
```

## Commands

### 1. Full Autopilot Onboarding

Provisions everything from company name to running agents:

```bash
cd aaas-platform
./autopilot.sh "Acme Corp" "ceo@acme.com" "growth"
```

This runs: workspace creation → agent deployment → billing setup → welcome email → CRM log.

For dry run:
```bash
DRY_RUN=true ./autopilot.sh "Acme Corp" "ceo@acme.com" "growth"
```

### 2. Deploy Agent to Remote Host

```bash
cd workflows/step2-agents

# Interactive (prints commands, you confirm)
./agent-deploy-remote.sh acme assistant deploy@acme.example.com

# Auto-deploy (executes SSH immediately)
./agent-deploy-remote.sh acme assistant deploy@acme.example.com

# Dry run (no SSH, just shows what would happen)
DRY_RUN=true ./agent-deploy-remote.sh acme assistant deploy@acme.example.com
```

Agent types: `assistant`, `support`, `sales`, `ops`, `custom`

### 3. Push Updates

```bash
# Update config only
./agent-update-pipeline.sh acme assistant config

# Update SOUL/personality
./agent-update-pipeline.sh acme assistant soul

# Update prompts
./agent-update-pipeline.sh acme assistant prompts

# Full update (all files, bumps minor version)
./agent-update-pipeline.sh acme assistant full

# Rollback to previous version
./agent-update-pipeline.sh acme assistant rollback

# Dry run
DRY_RUN=true ./agent-update-pipeline.sh acme assistant config
```

### 4. Billing & Invoicing

```bash
# Add customer to billing
./billing-tracker.sh add acme growth 2026-01-15

# Generate invoice
./billing-tracker.sh invoice acme 2026-02

# Generate all invoices
./billing-tracker.sh invoice-all 2026-02

# Revenue summary
./billing-tracker.sh summary

# Record payment
./billing-tracker.sh pay acme 2026-02

# List all customers
./billing-tracker.sh list

# Show overdue accounts
./billing-tracker.sh overdue
```

Tiers: starter (£499/mo, 1 agent), growth (£999/mo, 3), scale (£2499/mo, 10), enterprise (£4999/mo, unlimited)

### 5. Health Dashboard

```bash
# Full dashboard (markdown)
./customer-health-dashboard.sh

# JSON output
./customer-health-dashboard.sh --json

# Single customer
./customer-health-dashboard.sh --customer acme
```

### 6. Integration Setup

```bash
# Slack
./integration-connector.sh acme assistant slack op://AfrexAI/Acme-Slack/bot_token

# Email
./integration-connector.sh acme assistant email op://AfrexAI/Acme-SMTP/password

# CRM (HubSpot, Salesforce, etc.)
./integration-connector.sh acme sales crm op://AfrexAI/Acme-HubSpot/api_key

# Calendar (Google, Outlook)
./integration-connector.sh acme assistant calendar op://AfrexAI/Acme-Calendar/service_account

# Webhook
./integration-connector.sh acme ops webhook

# Custom API
./integration-connector.sh acme custom api
```

## SSH & Credentials

- SSH keys: Stored in 1Password at `op://AfrexAI/SSH-<customer>/private_key`
- Falls back to `~/.ssh/afrexai-deploy`, `~/.ssh/<customer>-deploy`, `~/.ssh/id_ed25519`
- All integration creds: 1Password vault "AfrexAI"
- Runtime injection: `op run --env-file=<integration>.env -- <command>`
- **Never** store secrets in plain files

## Remote Agent Structure

On the customer's host at `/opt/afrexai-agent/`:

```
/opt/afrexai-agent/
├── SOUL.md           # Agent personality
├── IDENTITY.yaml     # Metadata (customer, version, type)
├── CONFIG.yaml       # Runtime config
├── MEMORY.md         # Long-term memory
├── HANDOFF.md        # Escalation procedures
├── health-check.sh   # Returns JSON health status
├── prompts/          # System/greeting/error prompts
├── memory/           # Daily memory files
├── logs/             # Runtime logs
├── backups/          # Pre-update backups
└── integrations/     # Integration configs
```

## Typical Workflow

```
1. Customer signs up → autopilot.sh "Company" "email" "tier"
2. Need remote deploy? → agent-deploy-remote.sh customer type host
3. Config change? → agent-update-pipeline.sh customer type config
4. Monthly invoice → billing-tracker.sh invoice-all
5. Check health → customer-health-dashboard.sh
6. Add Slack? → integration-connector.sh customer type slack
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DRY_RUN` | Skip SSH/writes, show what would happen | `false` |
| `AUTO_DEPLOY` | Legacy: auto-execute SSH deploy | `false` |
| `AGENT_INSTALL_DIR` | Remote install path | `/opt/afrexai-agent` |
| `AGENT_USER` | Remote service user | `afrexai` |
| `SSH_TIMEOUT` | SSH connect timeout seconds | `15` |
