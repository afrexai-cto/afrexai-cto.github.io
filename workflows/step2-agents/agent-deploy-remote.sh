#!/bin/bash
# agent-deploy-remote.sh — Deploy an AI agent to a customer's system
# Reads agent configs from the customer's generated agent directory in aaas-platform/customers/
# Usage: ./agent-deploy-remote.sh <customer_slug> <agent_slug> <ssh_host> [op_uri]
# Bash 3.2 compatible

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLATFORM_DIR="$(cd "$SCRIPT_DIR/../../aaas-platform" && pwd)"
CUSTOMERS_DIR="$PLATFORM_DIR/customers"
DEPLOY_DIR="$SCRIPT_DIR/deployments"
VERSION_DIR="$SCRIPT_DIR/versions"
LOG_FILE="$SCRIPT_DIR/deploy.log"

usage() {
    echo "Usage: $0 <customer_slug> <agent_slug> <ssh_host> [op_credentials_uri]"
    echo ""
    echo "Arguments:"
    echo "  customer_slug       Customer slug (must exist in aaas-platform/customers/)"
    echo "  agent_slug          Agent slug (must exist in customer's agent-manifest.json)"
    echo "  ssh_host            SSH host (user@host or alias)"
    echo "  op_credentials_uri  1Password URI for SSH key (default: op://AfrexAI/SSH-<customer>/private_key)"
    echo ""
    echo "The agent's SOUL.md, AGENTS.md, and other config files are read from"
    echo "aaas-platform/customers/<slug>/agents/<agent_slug>/"
    echo ""
    echo "Examples:"
    echo "  $0 acme-corp ea-aria deploy@acme.example.com"
    echo "  $0 hartwell-associates legal-researcher admin@10.0.1.50"
    exit 1
}

log() {
    local ts
    ts="$(date '+%Y-%m-%d %H:%M:%S')"
    echo "[$ts] $*" | tee -a "$LOG_FILE"
}

die() { log "ERROR: $*"; exit 1; }

if [ $# -lt 3 ]; then usage; fi

CUSTOMER="$1"
AGENT_SLUG="$2"
SSH_HOST="$3"
OP_URI="${4:-op://AfrexAI/SSH-${CUSTOMER}/private_key}"

# --- Validate customer exists with profile.json ---
CUSTOMER_DIR="$CUSTOMERS_DIR/$CUSTOMER"
if [ ! -f "$CUSTOMER_DIR/profile.json" ]; then
    die "Customer '$CUSTOMER' not found or missing profile.json at $CUSTOMER_DIR/profile.json"
fi

# --- Read customer data from profile.json ---
read_json_field() {
    local file="$1" field="$2"
    sed -n "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^,\"}]*\)\"\{0,1\}.*/\1/p" "$file" | head -1
}

COMPANY="$(read_json_field "$CUSTOMER_DIR/profile.json" "company")"
[ -z "$COMPANY" ] && COMPANY="$(read_json_field "$CUSTOMER_DIR/profile.json" "company_name")"
TIER="$(read_json_field "$CUSTOMER_DIR/profile.json" "package")"
[ -z "$TIER" ] && TIER="$(read_json_field "$CUSTOMER_DIR/profile.json" "tier")"
VERTICAL="$(read_json_field "$CUSTOMER_DIR/profile.json" "vertical")"
VERTICAL="${VERTICAL:-general}"

# --- Validate agent exists ---
AGENT_DIR="$CUSTOMER_DIR/agents/$AGENT_SLUG"
if [ ! -d "$AGENT_DIR" ]; then
    die "Agent '$AGENT_SLUG' not found at $AGENT_DIR. Check agent-manifest.json."
fi

# Read agent info from manifest
AGENT_NAME="$AGENT_SLUG"
AGENT_TYPE="custom"
if [ -f "$CUSTOMER_DIR/agent-manifest.json" ]; then
    AGENT_NAME="$(python3 -c "
import json
m = json.load(open('$CUSTOMER_DIR/agent-manifest.json'))
for a in m.get('agents', []):
    if a['slug'] == '$AGENT_SLUG':
        print(a.get('name', '$AGENT_SLUG'))
        break
" 2>/dev/null || echo "$AGENT_SLUG")"
    AGENT_TYPE="$(python3 -c "
import json
m = json.load(open('$CUSTOMER_DIR/agent-manifest.json'))
for a in m.get('agents', []):
    if a['slug'] == '$AGENT_SLUG':
        print(a.get('type', 'custom'))
        break
" 2>/dev/null || echo "custom")"
fi

log "=== Deploying $AGENT_SLUG ($AGENT_NAME) for $CUSTOMER ($COMPANY) to $SSH_HOST ==="

# --- Create deployment bundle ---
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
BUNDLE_NAME="${CUSTOMER}-${AGENT_SLUG}-${TIMESTAMP}"
BUNDLE_DIR="$DEPLOY_DIR/$BUNDLE_NAME"
mkdir -p "$BUNDLE_DIR"

log "Bundle directory: $BUNDLE_DIR"

# --- Copy agent files from customer's generated agent directory ---
# These are the vertical-aware, customer-customized files
for f in SOUL.md AGENTS.md HEARTBEAT.md MEMORY.md HANDOFF.md CONFIG.yaml IDENTITY.yaml; do
    if [ -f "$AGENT_DIR/$f" ]; then
        cp "$AGENT_DIR/$f" "$BUNDLE_DIR/$f"
        log "Copied $f from agent directory"
    fi
done

# Copy prompts if they exist
if [ -d "$AGENT_DIR/prompts" ]; then
    cp -R "$AGENT_DIR/prompts" "$BUNDLE_DIR/prompts"
    log "Copied prompts/"
fi

# --- Generate missing files if not in agent dir ---

# SOUL.md — generate default if not provided
if [ ! -f "$BUNDLE_DIR/SOUL.md" ]; then
    cat > "$BUNDLE_DIR/SOUL.md" << SOULEOF
# SOUL.md — Agent Core Identity

## Who You Are
You are $AGENT_NAME, an AI agent deployed by AfrexAI for $COMPANY.
Your vertical: $VERTICAL | Tier: $TIER

## Core Principles
- **Helpful first** — Your primary purpose is to make your human counterparts more effective
- **Honest always** — Never fabricate information; say "I don't know" when you don't
- **Secure by default** — Never expose credentials, PII, or internal data
- **Proactive but bounded** — Suggest improvements but don't overstep your role
SOULEOF
    log "Generated default SOUL.md"
fi

# IDENTITY.yaml
if [ ! -f "$BUNDLE_DIR/IDENTITY.yaml" ]; then
    cat > "$BUNDLE_DIR/IDENTITY.yaml" << EOF
agent:
  name: "${AGENT_SLUG}"
  display_name: "${AGENT_NAME}"
  type: "${AGENT_TYPE}"
  version: "1.0.0"
  deployed_at: "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  deployed_by: "afrexai-deploy"
  customer: "${CUSTOMER}"
  company: "${COMPANY}"
  vertical: "${VERTICAL}"
  tier: "${TIER}"
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
fi

# CONFIG.yaml
if [ ! -f "$BUNDLE_DIR/CONFIG.yaml" ]; then
    cat > "$BUNDLE_DIR/CONFIG.yaml" << EOF
config:
  customer: "${CUSTOMER}"
  agent_slug: "${AGENT_SLUG}"
  agent_type: "${AGENT_TYPE}"
  vertical: "${VERTICAL}"

  channels:
    enabled: []

  features:
    auto_respond: true
    proactive_outreach: false
    data_collection: true
    external_api_calls: false

  limits:
    max_requests_per_minute: 60
    max_concurrent_tasks: 5
    max_response_length: 4096

  security:
    require_auth: true
    allowed_origins: []
    audit_log: true
    pii_redaction: true

  paths:
    memory: "./memory"
    logs: "./logs"
    prompts: "./prompts"
    handoff: "./handoff"
EOF
    log "Generated CONFIG.yaml"
fi

# MEMORY.md
if [ ! -f "$BUNDLE_DIR/MEMORY.md" ]; then
    cat > "$BUNDLE_DIR/MEMORY.md" << EOF
# MEMORY.md — Agent Long-Term Memory

## Deployment
- Customer: ${CUSTOMER} (${COMPANY})
- Agent: ${AGENT_NAME} (${AGENT_SLUG})
- Type: ${AGENT_TYPE}
- Vertical: ${VERTICAL}
- Deployed: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
- Version: 1.0.0

## Notes
- Initial deployment. No prior context.
EOF
    log "Generated MEMORY.md"
fi

# Default prompts
if [ ! -d "$BUNDLE_DIR/prompts" ]; then
    mkdir -p "$BUNDLE_DIR/prompts"
    cat > "$BUNDLE_DIR/prompts/system.md" << EOF
You are ${AGENT_NAME}, an AI ${AGENT_TYPE} agent deployed for ${COMPANY} by AfrexAI.
Vertical: ${VERTICAL} | Tier: ${TIER}
Read SOUL.md for your core identity and behavioral guidelines.
EOF
    log "Generated prompts/"
fi

# Create install script
cat > "$BUNDLE_DIR/install.sh" << 'INSTALLEOF'
#!/bin/bash
set -euo pipefail
INSTALL_DIR="${AGENT_INSTALL_DIR:-/opt/afrexai-agent}"
echo "=== AfrexAI Agent Installer ==="
echo "Install directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"/{memory,logs,prompts,handoff,backups}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
for f in "$SCRIPT_DIR"/*.md "$SCRIPT_DIR"/*.yaml; do
    [ -f "$f" ] && cp "$f" "$INSTALL_DIR/"
done
[ -d "$SCRIPT_DIR/prompts" ] && cp "$SCRIPT_DIR/prompts/"* "$INSTALL_DIR/prompts/" 2>/dev/null || true

cat > "$INSTALL_DIR/health-check.sh" << 'HEALTHEOF'
#!/bin/bash
INSTALL_DIR="${AGENT_INSTALL_DIR:-/opt/afrexai-agent}"
STATUS="healthy"; ERRORS=""
for f in SOUL.md IDENTITY.yaml; do
    [ -f "$INSTALL_DIR/$f" ] || { STATUS="unhealthy"; ERRORS="${ERRORS}missing:$f "; }
done
DISK_PCT=$(df "$INSTALL_DIR" 2>/dev/null | tail -1 | awk '{gsub(/%/,""); print $5}')
[ -n "$DISK_PCT" ] && [ "$DISK_PCT" -gt 90 ] 2>/dev/null && { STATUS="degraded"; ERRORS="${ERRORS}disk:${DISK_PCT}% "; }
[ -w "$INSTALL_DIR/logs" ] || { STATUS="degraded"; ERRORS="${ERRORS}logs_not_writable "; }
VERSION="unknown"
[ -f "$INSTALL_DIR/IDENTITY.yaml" ] && VERSION=$(grep 'version:' "$INSTALL_DIR/IDENTITY.yaml" | head -1 | awk '{print $2}' | tr -d '"')
echo "{\"status\":\"$STATUS\",\"version\":\"$VERSION\",\"errors\":\"${ERRORS}\",\"checked\":\"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\"}"
HEALTHEOF
chmod +x "$INSTALL_DIR/health-check.sh"
echo "=== Installation complete ==="
INSTALLEOF
chmod +x "$BUNDLE_DIR/install.sh"

log "Generated install.sh"

# --- Package bundle ---
TARBALL="$DEPLOY_DIR/${BUNDLE_NAME}.tar.gz"
(cd "$DEPLOY_DIR" && tar czf "${BUNDLE_NAME}.tar.gz" "$BUNDLE_NAME")
log "Packaged bundle: $TARBALL"

# --- Version tracking ---
mkdir -p "$VERSION_DIR"
VERSION_FILE="$VERSION_DIR/${CUSTOMER}-${AGENT_SLUG}.json"
cat > "$VERSION_FILE" << EOF
{
  "customer": "${CUSTOMER}",
  "company": "${COMPANY}",
  "agent_slug": "${AGENT_SLUG}",
  "agent_name": "${AGENT_NAME}",
  "agent_type": "${AGENT_TYPE}",
  "vertical": "${VERTICAL}",
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

# --- Deploy to remote via SSH ---
resolve_ssh_key() {
    local key_file=""
    if command -v op >/dev/null 2>&1; then
        key_file="$(mktemp)"
        if op read "$OP_URI" > "$key_file" 2>/dev/null && [ -s "$key_file" ]; then
            chmod 600 "$key_file"
            echo "$key_file"
            return 0
        fi
        rm -f "$key_file"
    fi
    for candidate in \
        "$HOME/.ssh/afrexai-deploy" \
        "$HOME/.ssh/${CUSTOMER}-deploy" \
        "$HOME/.ssh/id_ed25519" \
        "$HOME/.ssh/id_rsa"; do
        if [ -f "$candidate" ]; then
            echo "$candidate"
            return 0
        fi
    done
    return 1
}

SSH_OPTS="-o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new -o BatchMode=yes"
TEMP_KEY=""

if SSH_KEY="$(resolve_ssh_key)"; then
    case "$SSH_KEY" in /tmp/*|/var/*) TEMP_KEY="$SSH_KEY" ;; esac
    SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
    log "Using SSH key: ${SSH_KEY}"
else
    log "WARN: No SSH key found — relying on ssh-agent or host keys"
fi

cleanup_ssh() {
    [ -n "$TEMP_KEY" ] && rm -f "$TEMP_KEY"
}
trap cleanup_ssh EXIT

DRY_RUN="${DRY_RUN:-false}"

echo ""
echo "============================================"
echo "  DEPLOYING TO REMOTE HOST"
echo "============================================"
echo ""
echo "Bundle:   $TARBALL"
echo "Customer: $CUSTOMER ($COMPANY)"
echo "Agent:    $AGENT_SLUG ($AGENT_NAME)"
echo "Type:     $AGENT_TYPE | Vertical: $VERTICAL"
echo "Target:   $SSH_HOST"
echo "Dry Run:  $DRY_RUN"
echo ""

if [ "$DRY_RUN" = "true" ]; then
    log "[DRY RUN] Would deploy $BUNDLE_NAME to $SSH_HOST"
else
    log "Checking remote host connectivity..."
    if ! ssh $SSH_OPTS "$SSH_HOST" 'echo "ok"' >/dev/null 2>&1; then
        die "Cannot connect to $SSH_HOST — check SSH access"
    fi
    log "✅ SSH connection verified"

    log "Transferring deployment bundle..."
    ssh $SSH_OPTS "$SSH_HOST" 'mkdir -p /tmp/afrexai-deploy'
    scp $SSH_OPTS "$TARBALL" "${SSH_HOST}:/tmp/afrexai-deploy/" || die "SCP transfer failed"
    log "✅ Bundle transferred"

    log "Installing agent on remote..."
    ssh $SSH_OPTS "$SSH_HOST" "cd /tmp/afrexai-deploy && tar xzf ${BUNDLE_NAME}.tar.gz && cd ${BUNDLE_NAME} && bash install.sh" || die "Remote install failed"
    log "✅ Agent installed"

    log "Running health check..."
    HEALTH_RESULT="$(ssh $SSH_OPTS "$SSH_HOST" '/opt/afrexai-agent/health-check.sh' 2>/dev/null || echo '{"status":"unknown"}')"
    log "Health: $HEALTH_RESULT"
    echo ""
    echo "--- Post-Deploy Verification ---"
    echo "$HEALTH_RESULT"
fi

echo ""

CRM_LOG="$SCRIPT_DIR/crm-deployments.log"
echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ')|DEPLOY|${CUSTOMER}|${AGENT_SLUG}|${SSH_HOST}|1.0.0|${BUNDLE_NAME}" >> "$CRM_LOG"
log "Logged to CRM: $CRM_LOG"

log "=== Deployment complete ==="
