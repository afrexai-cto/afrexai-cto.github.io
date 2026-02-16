#!/bin/bash
# agent-update-pipeline.sh — Push updates to deployed customer agents
# Usage: ./agent-update-pipeline.sh <customer> <agent_type> <update_type> [version]
# Bash 3.2 compatible

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$SCRIPT_DIR/deployments"
VERSION_DIR="$SCRIPT_DIR/versions"
LOG_FILE="$SCRIPT_DIR/deploy.log"

usage() {
    echo "Usage: $0 <customer> <agent_type> <update_type> [new_version]"
    echo ""
    echo "Arguments:"
    echo "  customer      Customer identifier"
    echo "  agent_type    Agent type: assistant | support | sales | ops | custom"
    echo "  update_type   What to update: config | soul | prompts | full | rollback"
    echo "  new_version   Version string (default: auto-increment)"
    echo ""
    echo "Examples:"
    echo "  $0 acme assistant config"
    echo "  $0 acme assistant full 1.2.0"
    echo "  $0 acme assistant rollback"
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
AGENT_TYPE="$2"
UPDATE_TYPE="$3"

# --- Load version info ---
VERSION_FILE="$VERSION_DIR/${CUSTOMER}-${AGENT_TYPE}.json"
[ -f "$VERSION_FILE" ] || die "No deployment found for ${CUSTOMER}/${AGENT_TYPE}. Deploy first."

# Parse version file (compatible with bash 3.2, no jq dependency assumed)
get_json_val() {
    local key="$1"
    local file="$2"
    grep "\"$key\"" "$file" | head -1 | sed 's/.*: *"\{0,1\}\([^",}]*\)"\{0,1\}.*/\1/'
}

CURRENT_VERSION="$(get_json_val 'current_version' "$VERSION_FILE")"
SSH_HOST="$(get_json_val 'ssh_host' "$VERSION_FILE")"
LAST_BUNDLE="$(get_json_val 'bundle' "$VERSION_FILE")"

log "=== Update Pipeline: ${CUSTOMER}/${AGENT_TYPE} ==="
log "Current version: $CURRENT_VERSION"
log "Target host: $SSH_HOST"

# --- Auto-increment version ---
increment_version() {
    local ver="$1"
    local major minor patch
    major="$(echo "$ver" | cut -d. -f1)"
    minor="$(echo "$ver" | cut -d. -f2)"
    patch="$(echo "$ver" | cut -d. -f3)"
    case "$UPDATE_TYPE" in
        full) minor=$((minor + 1)); patch=0 ;;
        *) patch=$((patch + 1)) ;;
    esac
    echo "${major}.${minor}.${patch}"
}

if [ "$UPDATE_TYPE" = "rollback" ]; then
    NEW_VERSION="rollback-$(date '+%Y%m%d%H%M%S')"
else
    NEW_VERSION="${4:-$(increment_version "$CURRENT_VERSION")}"
fi

# --- Handle rollback ---
if [ "$UPDATE_TYPE" = "rollback" ]; then
    log "Rolling back ${CUSTOMER}/${AGENT_TYPE}..."

    # Find previous bundle
    BACKUP_DIR="$DEPLOY_DIR/backups/${CUSTOMER}-${AGENT_TYPE}"
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        die "No backups found for rollback"
    fi

    LATEST_BACKUP="$(ls -t "$BACKUP_DIR" | head -1)"
    log "Rolling back to: $LATEST_BACKUP"

    echo ""
    echo "--- Rollback Commands ---"
    echo "scp \"$BACKUP_DIR/$LATEST_BACKUP\" \"${SSH_HOST}:/tmp/\""
    echo "ssh \"${SSH_HOST}\" 'cd /opt/afrexai-agent && cp -r . /tmp/afrexai-pre-rollback && cd /tmp && tar xzf $LATEST_BACKUP && cd */  && sudo bash install.sh'"
    echo ""

    # Update version tracking
    CRM_LOG="$SCRIPT_DIR/crm-deployments.log"
    echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ')|ROLLBACK|${CUSTOMER}|${AGENT_TYPE}|${SSH_HOST}|${CURRENT_VERSION}→rollback|${LATEST_BACKUP}" >> "$CRM_LOG"
    log "Rollback prepared. Execute commands above to apply."
    exit 0
fi

# --- Create backup of current deployment ---
BACKUP_DIR="$DEPLOY_DIR/backups/${CUSTOMER}-${AGENT_TYPE}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
BACKUP_NAME="backup-${CURRENT_VERSION}-${TIMESTAMP}"

# Find the most recent deployment bundle
LATEST_DEPLOY=""
for d in "$DEPLOY_DIR/${CUSTOMER}-${AGENT_TYPE}-"*; do
    if [ -d "$d" ]; then
        LATEST_DEPLOY="$d"
    fi
done

if [ -n "$LATEST_DEPLOY" ] && [ -d "$LATEST_DEPLOY" ]; then
    (cd "$DEPLOY_DIR" && tar czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" "$(basename "$LATEST_DEPLOY")")
    log "Backed up current version to: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
fi

# --- Create update bundle ---
UPDATE_BUNDLE="${CUSTOMER}-${AGENT_TYPE}-update-${TIMESTAMP}"
UPDATE_DIR="$DEPLOY_DIR/$UPDATE_BUNDLE"
mkdir -p "$UPDATE_DIR"

case "$UPDATE_TYPE" in
    config)
        log "Generating config update..."
        if [ -n "$LATEST_DEPLOY" ] && [ -f "$LATEST_DEPLOY/CONFIG.yaml" ]; then
            cp "$LATEST_DEPLOY/CONFIG.yaml" "$UPDATE_DIR/CONFIG.yaml.current"
        fi
        # Generate new config (reuse deploy script's template with updated version)
        cat > "$UPDATE_DIR/CONFIG.yaml" << EOF
# CONFIG.yaml — Agent Runtime Configuration (v${NEW_VERSION})
config:
  customer: "${CUSTOMER}"
  agent_type: "${AGENT_TYPE}"
  version: "${NEW_VERSION}"

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

        # Show diff if both exist
        if [ -f "$UPDATE_DIR/CONFIG.yaml.current" ]; then
            echo ""
            echo "--- Config Diff ---"
            diff "$UPDATE_DIR/CONFIG.yaml.current" "$UPDATE_DIR/CONFIG.yaml" || true
            echo "---"
            rm "$UPDATE_DIR/CONFIG.yaml.current"
        fi
        ;;

    soul)
        log "Generating soul update..."
        if [ -n "$LATEST_DEPLOY" ] && [ -f "$LATEST_DEPLOY/SOUL.md" ]; then
            cp "$LATEST_DEPLOY/SOUL.md" "$UPDATE_DIR/SOUL.md"
            echo ""
            echo "Current SOUL.md copied to update bundle."
            echo "Edit $UPDATE_DIR/SOUL.md then re-run with: UPDATE_EDITED=true $0 $*"
        else
            die "No existing SOUL.md found. Use full deploy instead."
        fi
        ;;

    prompts)
        log "Generating prompts update..."
        mkdir -p "$UPDATE_DIR/prompts"
        if [ -n "$LATEST_DEPLOY" ] && [ -d "$LATEST_DEPLOY/prompts" ]; then
            cp -r "$LATEST_DEPLOY/prompts/"* "$UPDATE_DIR/prompts/"
            echo "Current prompts copied to update bundle."
            echo "Edit files in $UPDATE_DIR/prompts/ then package."
        fi
        ;;

    full)
        log "Generating full update..."
        # Re-run deploy to generate fresh files, then package as update
        if [ -n "$LATEST_DEPLOY" ]; then
            cp -r "$LATEST_DEPLOY/"* "$UPDATE_DIR/"
        fi
        # Update version in IDENTITY
        if [ -f "$UPDATE_DIR/IDENTITY.yaml" ]; then
            sed -i.bak "s/version: .*/version: \"${NEW_VERSION}\"/" "$UPDATE_DIR/IDENTITY.yaml"
            sed -i.bak "s/deployed_at: .*/deployed_at: \"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\"/" "$UPDATE_DIR/IDENTITY.yaml"
            rm -f "$UPDATE_DIR/IDENTITY.yaml.bak"
        fi
        ;;

    *)
        die "Invalid update type: $UPDATE_TYPE"
        ;;
esac

# Create update installer
cat > "$UPDATE_DIR/update.sh" << 'UPDATEEOF'
#!/bin/bash
set -euo pipefail
INSTALL_DIR="${AGENT_INSTALL_DIR:-/opt/afrexai-agent}"
BACKUP_DIR="$INSTALL_DIR/backups/$(date '+%Y%m%d-%H%M%S')"

echo "=== AfrexAI Agent Update ==="
echo "Backing up current state to: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r "$INSTALL_DIR/"*.md "$INSTALL_DIR/"*.yaml "$BACKUP_DIR/" 2>/dev/null || true
[ -d "$INSTALL_DIR/prompts" ] && cp -r "$INSTALL_DIR/prompts" "$BACKUP_DIR/"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
for f in "$SCRIPT_DIR"/*.md "$SCRIPT_DIR"/*.yaml; do
    [ -f "$f" ] && cp "$f" "$INSTALL_DIR/"
done
[ -d "$SCRIPT_DIR/prompts" ] && cp -r "$SCRIPT_DIR/prompts/"* "$INSTALL_DIR/prompts/"

echo "Update applied. Backup at: $BACKUP_DIR"
echo "Health check: $INSTALL_DIR/health-check.sh"
UPDATEEOF
chmod +x "$UPDATE_DIR/update.sh"

# Package
UPDATE_TARBALL="$DEPLOY_DIR/${UPDATE_BUNDLE}.tar.gz"
(cd "$DEPLOY_DIR" && tar czf "${UPDATE_BUNDLE}.tar.gz" "$UPDATE_BUNDLE")
log "Update bundle: $UPDATE_TARBALL"

# --- Update version tracking ---
# Append to history in version file
cat > "$VERSION_FILE" << EOF
{
  "customer": "${CUSTOMER}",
  "agent_type": "${AGENT_TYPE}",
  "current_version": "${NEW_VERSION}",
  "previous_version": "${CURRENT_VERSION}",
  "deployed_at": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "ssh_host": "${SSH_HOST}",
  "bundle": "${UPDATE_BUNDLE}.tar.gz",
  "update_type": "${UPDATE_TYPE}"
}
EOF

# --- Deploy update via SSH+rsync ---
DRY_RUN="${DRY_RUN:-false}"
REMOTE_DIR="/opt/afrexai-agent"

# Resolve SSH key (same logic as deploy script)
SSH_KEY=""
for candidate in \
    "$HOME/.ssh/afrexai-deploy" \
    "$HOME/.ssh/${CUSTOMER}-deploy" \
    "$HOME/.ssh/id_ed25519" \
    "$HOME/.ssh/id_rsa"; do
    if [ -f "$candidate" ]; then
        SSH_KEY="$candidate"
        break
    fi
done

SSH_OPTS="-o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new -o BatchMode=yes"
[ -n "$SSH_KEY" ] && SSH_OPTS="$SSH_OPTS -i $SSH_KEY"

echo ""
echo "============================================"
echo "  PUSHING UPDATE VIA RSYNC"
echo "============================================"
echo ""
echo "Bundle:  $UPDATE_TARBALL"
echo "Version: $CURRENT_VERSION → $NEW_VERSION"
echo "Type:    $UPDATE_TYPE"
echo "Target:  $SSH_HOST"
echo "Dry Run: $DRY_RUN"
echo ""

if [ "$DRY_RUN" = "true" ]; then
    log "[DRY RUN] Would rsync $UPDATE_DIR/ → ${SSH_HOST}:${REMOTE_DIR}/"
    log "[DRY RUN] Files to sync:"
    find "$UPDATE_DIR" -type f | while read -r f; do
        log "  $(echo "$f" | sed "s|$UPDATE_DIR/||")"
    done
else
    # Verify connectivity
    if ! ssh $SSH_OPTS "$SSH_HOST" 'echo ok' >/dev/null 2>&1; then
        log "ERROR: Cannot connect to $SSH_HOST"
        log "Falling back to manual mode — bundle at: $UPDATE_TARBALL"
    else
        # Backup remote state first
        log "Backing up remote agent state..."
        ssh $SSH_OPTS "$SSH_HOST" \
            "mkdir -p ${REMOTE_DIR}/backups && cp -r ${REMOTE_DIR}/*.md ${REMOTE_DIR}/*.yaml ${REMOTE_DIR}/backups/pre-update-$(date '+%Y%m%d%H%M%S')/ 2>/dev/null || true"

        # Rsync the update (prefer rsync, fall back to scp+tar)
        if ssh $SSH_OPTS "$SSH_HOST" 'command -v rsync >/dev/null 2>&1'; then
            log "Pushing update via rsync..."
            RSYNC_OPTS="-avz --checksum --exclude='update.sh' --exclude='*.current'"
            [ -n "$SSH_KEY" ] && RSYNC_OPTS="$RSYNC_OPTS -e 'ssh $SSH_OPTS'"
            rsync $RSYNC_OPTS "$UPDATE_DIR/" "${SSH_HOST}:${REMOTE_DIR}/" || log "WARN: rsync failed"
            log "✅ Rsync complete"
        else
            log "rsync not available on remote, using scp..."
            scp $SSH_OPTS "$UPDATE_TARBALL" "${SSH_HOST}:/tmp/"
            ssh $SSH_OPTS "$SSH_HOST" "cd /tmp && tar xzf ${UPDATE_BUNDLE}.tar.gz && cd ${UPDATE_BUNDLE} && bash update.sh"
            log "✅ SCP+update complete"
        fi

        # Run health check
        log "Verifying update..."
        HEALTH="$(ssh $SSH_OPTS "$SSH_HOST" "${REMOTE_DIR}/health-check.sh" 2>/dev/null || echo '{"status":"unknown"}')"
        log "Health: $HEALTH"
    fi
fi

echo ""
echo "--- Rollback (if needed) ---"
echo "$0 ${CUSTOMER} ${AGENT_TYPE} rollback"
echo ""

# Log to CRM
CRM_LOG="$SCRIPT_DIR/crm-deployments.log"
echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ')|UPDATE|${CUSTOMER}|${AGENT_TYPE}|${SSH_HOST}|${CURRENT_VERSION}→${NEW_VERSION}|${UPDATE_BUNDLE}|${UPDATE_TYPE}" >> "$CRM_LOG"

log "=== Update pipeline complete ==="
