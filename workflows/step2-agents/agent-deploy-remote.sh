#!/bin/bash
# agent-deploy-remote.sh — Deploy an AI agent to a customer's system
# Usage: ./agent-deploy-remote.sh <customer> <agent_type> <ssh_host> [op_uri]
# Bash 3.2 compatible

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$SCRIPT_DIR/deployments"
TEMPLATE_DIR="$SCRIPT_DIR/templates"
VERSION_DIR="$SCRIPT_DIR/versions"
LOG_FILE="$SCRIPT_DIR/deploy.log"

usage() {
    echo "Usage: $0 <customer_name> <agent_type> <ssh_host> [op_credentials_uri]"
    echo ""
    echo "Arguments:"
    echo "  customer_name     Customer identifier (lowercase, no spaces)"
    echo "  agent_type        Agent type: assistant | support | sales | ops | custom"
    echo "  ssh_host          SSH host (user@host or alias)"
    echo "  op_credentials_uri  1Password URI for SSH key (default: op://AfrexAI/SSH-<customer>/private_key)"
    echo ""
    echo "Examples:"
    echo "  $0 acme assistant deploy@acme.example.com"
    echo "  $0 globex support admin@10.0.1.50 op://AfrexAI/Globex-SSH/private_key"
    exit 1
}

log() {
    local ts
    ts="$(date '+%Y-%m-%d %H:%M:%S')"
    echo "[$ts] $*" | tee -a "$LOG_FILE"
}

die() { log "ERROR: $*"; exit 1; }

# --- Validation ---
if [ $# -lt 3 ]; then
    usage
fi

CUSTOMER="$1"
AGENT_TYPE="$2"
SSH_HOST="$3"
OP_URI="${4:-op://AfrexAI/SSH-${CUSTOMER}/private_key}"

# Validate customer name
echo "$CUSTOMER" | grep -qE '^[a-z0-9_-]+$' || die "Customer name must be lowercase alphanumeric with hyphens/underscores"

# Validate agent type
case "$AGENT_TYPE" in
    assistant|support|sales|ops|custom) ;;
    *) die "Invalid agent type: $AGENT_TYPE. Must be: assistant, support, sales, ops, custom" ;;
esac

log "=== Deploying $AGENT_TYPE agent for $CUSTOMER to $SSH_HOST ==="

# --- Create deployment bundle directory ---
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
BUNDLE_NAME="${CUSTOMER}-${AGENT_TYPE}-${TIMESTAMP}"
BUNDLE_DIR="$DEPLOY_DIR/$BUNDLE_NAME"
mkdir -p "$BUNDLE_DIR"

log "Bundle directory: $BUNDLE_DIR"

# --- Generate agent files ---

# SOUL.md — Agent personality and behavior
cat > "$BUNDLE_DIR/SOUL.md" << 'SOULEOF'
# SOUL.md — Agent Core Identity

## Who You Are
You are an AI agent deployed by AfrexAI. You serve your assigned organization with competence, clarity, and reliability.

## Core Principles
- **Helpful first** — Your primary purpose is to make your human counterparts more effective
- **Honest always** — Never fabricate information; say "I don't know" when you don't
- **Secure by default** — Never expose credentials, PII, or internal data
- **Proactive but bounded** — Suggest improvements but don't overstep your role

## Behavioral Guidelines
- Respond in clear, professional language appropriate to context
- Adapt tone to the situation (formal for external, casual for internal)
- Escalate to humans when confidence is low or stakes are high
- Log actions for auditability
SOULEOF

# Customize SOUL based on agent type
case "$AGENT_TYPE" in
    support)
        cat >> "$BUNDLE_DIR/SOUL.md" << 'EOF'

## Support Agent Specifics
- Prioritize empathy and resolution speed
- Follow escalation matrix: L1 (self) → L2 (team lead) → L3 (engineering)
- Track ticket resolution metrics
- Always confirm resolution with the requester
EOF
        ;;
    sales)
        cat >> "$BUNDLE_DIR/SOUL.md" << 'EOF'

## Sales Agent Specifics
- Focus on understanding customer needs before recommending solutions
- Track pipeline stages and follow up consistently
- Qualify leads using BANT framework (Budget, Authority, Need, Timeline)
- Never pressure; advise and inform
EOF
        ;;
    assistant)
        cat >> "$BUNDLE_DIR/SOUL.md" << 'EOF'

## Assistant Agent Specifics
- Manage calendar, communications, and task tracking
- Proactively surface upcoming deadlines and conflicts
- Draft communications for human review before sending
- Maintain organized filing and documentation
EOF
        ;;
    ops)
        cat >> "$BUNDLE_DIR/SOUL.md" << 'EOF'

## Operations Agent Specifics
- Monitor systems and processes continuously
- Alert on anomalies with context, not just alarms
- Maintain runbooks and update them after incidents
- Automate repetitive operational tasks
EOF
        ;;
    custom)
        cat >> "$BUNDLE_DIR/SOUL.md" << 'EOF'

## Custom Agent
- Configure behavior via CONFIG.yaml
- This is a blank-slate agent — customize SOUL.md for your use case
EOF
        ;;
esac

log "Generated SOUL.md"

# IDENTITY.yaml — Agent metadata
cat > "$BUNDLE_DIR/IDENTITY.yaml" << EOF
# IDENTITY.yaml — Agent Identity Card
agent:
  name: "${CUSTOMER}-${AGENT_TYPE}"
  type: "${AGENT_TYPE}"
  version: "1.0.0"
  deployed_at: "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  deployed_by: "afrexai-deploy"
  customer: "${CUSTOMER}"
  managed_by: "AfrexAI"

contact:
  support_email: "support@afrexai.com"
  escalation: "ops@afrexai.com"

runtime:
  heartbeat_interval: 300
  health_endpoint: "/health"
  log_level: "info"
  max_memory_mb: 512
EOF

log "Generated IDENTITY.yaml"

# CONFIG.yaml — Runtime configuration
cat > "$BUNDLE_DIR/CONFIG.yaml" << EOF
# CONFIG.yaml — Agent Runtime Configuration
config:
  customer: "${CUSTOMER}"
  agent_type: "${AGENT_TYPE}"

  # Communication channels
  channels:
    enabled: []
    # Add integrations via integration-connector.sh

  # Feature flags
  features:
    auto_respond: true
    proactive_outreach: false
    data_collection: true
    external_api_calls: false

  # Rate limits
  limits:
    max_requests_per_minute: 60
    max_concurrent_tasks: 5
    max_response_length: 4096

  # Security
  security:
    require_auth: true
    allowed_origins: []
    audit_log: true
    pii_redaction: true

  # Paths (relative to install dir)
  paths:
    memory: "./memory"
    logs: "./logs"
    prompts: "./prompts"
    handoff: "./handoff"
EOF

log "Generated CONFIG.yaml"

# MEMORY.md — Initial memory state
cat > "$BUNDLE_DIR/MEMORY.md" << EOF
# MEMORY.md — Agent Long-Term Memory

## Deployment
- Customer: ${CUSTOMER}
- Agent Type: ${AGENT_TYPE}
- Deployed: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
- Version: 1.0.0

## Notes
- Initial deployment. No prior context.

## Learned Preferences
(Will be populated as the agent learns from interactions)

## Important Context
(Add customer-specific context here)
EOF

log "Generated MEMORY.md"

# HANDOFF.md — Escalation and handoff procedures
cat > "$BUNDLE_DIR/HANDOFF.md" << EOF
# HANDOFF.md — Escalation & Handoff Protocol

## When to Escalate
- Confidence below 70% on critical decisions
- Customer explicitly requests a human
- Financial transactions above threshold
- Legal or compliance questions
- System errors or outages

## Escalation Matrix
| Level | Handler | Response Time | Trigger |
|-------|---------|--------------|---------|
| L1 | Agent (self) | Immediate | Standard requests |
| L2 | Team Lead | 15 min | Complex issues, complaints |
| L3 | Engineering | 1 hour | System failures, bugs |
| L4 | Management | 4 hours | Critical incidents, legal |

## Handoff Format
When escalating, provide:
1. **Summary** — One-line description
2. **Context** — Relevant conversation history
3. **Actions Taken** — What the agent already tried
4. **Recommendation** — Suggested next step
5. **Urgency** — Low / Medium / High / Critical

## Contact Channels
- Internal: (configure per customer)
- AfrexAI Support: support@afrexai.com
EOF

log "Generated HANDOFF.md"

# prompts/ — Prompt templates
mkdir -p "$BUNDLE_DIR/prompts"

cat > "$BUNDLE_DIR/prompts/system.md" << EOF
You are an AI ${AGENT_TYPE} agent deployed for ${CUSTOMER} by AfrexAI.
Read SOUL.md for your core identity and behavioral guidelines.
Read CONFIG.yaml for your runtime configuration.
Read MEMORY.md for context from prior interactions.
Follow HANDOFF.md procedures when escalation is needed.
EOF

cat > "$BUNDLE_DIR/prompts/greeting.md" << EOF
Hello! I'm your ${AGENT_TYPE} agent, here to help. How can I assist you today?
EOF

cat > "$BUNDLE_DIR/prompts/error.md" << EOF
I apologize, but I encountered an issue processing your request. I've logged this for review. Would you like me to try a different approach, or would you prefer to speak with a human team member?
EOF

log "Generated prompts/"

# Create install script for remote system
cat > "$BUNDLE_DIR/install.sh" << 'INSTALLEOF'
#!/bin/bash
# install.sh — Run on the customer's system to set up the agent
set -euo pipefail

INSTALL_DIR="${AGENT_INSTALL_DIR:-/opt/afrexai-agent}"
SERVICE_USER="${AGENT_USER:-afrexai}"

echo "=== AfrexAI Agent Installer ==="
echo "Install directory: $INSTALL_DIR"

# Create directories
mkdir -p "$INSTALL_DIR"/{memory,logs,prompts,handoff,backups}

# Copy agent files
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$SCRIPT_DIR/SOUL.md" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/IDENTITY.yaml" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/CONFIG.yaml" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/MEMORY.md" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/HANDOFF.md" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/prompts/"* "$INSTALL_DIR/prompts/"

# Health check script
cat > "$INSTALL_DIR/health-check.sh" << 'HEALTHEOF'
#!/bin/bash
# Quick health check — returns JSON
INSTALL_DIR="${AGENT_INSTALL_DIR:-/opt/afrexai-agent}"
STATUS="healthy"
ERRORS=""

# Check required files
for f in SOUL.md IDENTITY.yaml CONFIG.yaml; do
    if [ ! -f "$INSTALL_DIR/$f" ]; then
        STATUS="unhealthy"
        ERRORS="${ERRORS}missing:$f "
    fi
done

# Check disk space (warn if <10% free)
DISK_PCT=$(df "$INSTALL_DIR" 2>/dev/null | tail -1 | awk '{gsub(/%/,""); print $5}')
if [ -n "$DISK_PCT" ] && [ "$DISK_PCT" -gt 90 ] 2>/dev/null; then
    STATUS="degraded"
    ERRORS="${ERRORS}disk:${DISK_PCT}% "
fi

# Check logs directory writable
if [ ! -w "$INSTALL_DIR/logs" ]; then
    STATUS="degraded"
    ERRORS="${ERRORS}logs_not_writable "
fi

# Get version
VERSION="unknown"
if [ -f "$INSTALL_DIR/IDENTITY.yaml" ]; then
    VERSION=$(grep 'version:' "$INSTALL_DIR/IDENTITY.yaml" | head -1 | awk '{print $2}' | tr -d '"')
fi

echo "{\"status\":\"$STATUS\",\"version\":\"$VERSION\",\"errors\":\"${ERRORS}\",\"checked\":\"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\"}"
HEALTHEOF
chmod +x "$INSTALL_DIR/health-check.sh"

echo "=== Installation complete ==="
echo "Agent installed at: $INSTALL_DIR"
echo "Run health check: $INSTALL_DIR/health-check.sh"
INSTALLEOF
chmod +x "$BUNDLE_DIR/install.sh"

log "Generated install.sh"

# --- Package bundle ---
TARBALL="$DEPLOY_DIR/${BUNDLE_NAME}.tar.gz"
(cd "$DEPLOY_DIR" && tar czf "${BUNDLE_NAME}.tar.gz" "$BUNDLE_NAME")
log "Packaged bundle: $TARBALL"

# --- Version tracking ---
mkdir -p "$VERSION_DIR"
VERSION_FILE="$VERSION_DIR/${CUSTOMER}-${AGENT_TYPE}.json"

# Create or update version file
cat > "$VERSION_FILE" << EOF
{
  "customer": "${CUSTOMER}",
  "agent_type": "${AGENT_TYPE}",
  "current_version": "1.0.0",
  "deployed_at": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "ssh_host": "${SSH_HOST}",
  "bundle": "${BUNDLE_NAME}.tar.gz",
  "history": [
    {
      "version": "1.0.0",
      "deployed_at": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
      "bundle": "${BUNDLE_NAME}.tar.gz",
      "action": "initial_deploy"
    }
  ]
}
EOF

log "Version tracked: $VERSION_FILE"

# --- Deploy to remote (if SSH accessible) ---
echo ""
echo "============================================"
echo "  DEPLOYMENT BUNDLE READY"
echo "============================================"
echo ""
echo "Bundle: $TARBALL"
echo "Customer: $CUSTOMER"
echo "Agent: $AGENT_TYPE"
echo "Target: $SSH_HOST"
echo ""
echo "--- Deployment Commands ---"
echo ""

# Check if op CLI is available for credential injection
if command -v op >/dev/null 2>&1; then
    echo "# With 1Password credential injection:"
    echo "SSH_KEY_FILE=\$(mktemp)"
    echo "op read \"$OP_URI\" > \"\$SSH_KEY_FILE\""
    echo "chmod 600 \"\$SSH_KEY_FILE\""
    echo "scp -i \"\$SSH_KEY_FILE\" \"$TARBALL\" \"${SSH_HOST}:/tmp/\""
    echo "ssh -i \"\$SSH_KEY_FILE\" \"${SSH_HOST}\" 'cd /tmp && tar xzf ${BUNDLE_NAME}.tar.gz && cd ${BUNDLE_NAME} && sudo bash install.sh'"
    echo "rm -f \"\$SSH_KEY_FILE\""
    echo ""
    echo "# Auto-deploy (will use 1Password):"
    echo ""

    # Attempt auto-deploy
    if [ "${AUTO_DEPLOY:-false}" = "true" ]; then
        log "Auto-deploying to $SSH_HOST..."
        SSH_KEY_FILE="$(mktemp)"
        trap 'rm -f "$SSH_KEY_FILE"' EXIT
        if op read "$OP_URI" > "$SSH_KEY_FILE" 2>/dev/null; then
            chmod 600 "$SSH_KEY_FILE"
            scp -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=accept-new "$TARBALL" "${SSH_HOST}:/tmp/" && \
            ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=accept-new "${SSH_HOST}" \
                "cd /tmp && tar xzf ${BUNDLE_NAME}.tar.gz && cd ${BUNDLE_NAME} && sudo bash install.sh" && \
            log "Auto-deploy successful" || \
            log "Auto-deploy failed — use manual commands above"
        else
            log "Could not read SSH key from 1Password — use manual commands above"
        fi
    fi
else
    echo "# Manual deployment (1Password CLI not available):"
    echo "scp \"$TARBALL\" \"${SSH_HOST}:/tmp/\""
    echo "ssh \"${SSH_HOST}\" 'cd /tmp && tar xzf ${BUNDLE_NAME}.tar.gz && cd ${BUNDLE_NAME} && sudo bash install.sh'"
fi

echo ""
echo "--- Post-Deploy Verification ---"
echo "ssh \"${SSH_HOST}\" '/opt/afrexai-agent/health-check.sh'"
echo ""

# --- Log to CRM ---
CRM_LOG="$SCRIPT_DIR/crm-deployments.log"
echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ')|DEPLOY|${CUSTOMER}|${AGENT_TYPE}|${SSH_HOST}|1.0.0|${BUNDLE_NAME}" >> "$CRM_LOG"
log "Logged to CRM: $CRM_LOG"

log "=== Deployment preparation complete ==="
