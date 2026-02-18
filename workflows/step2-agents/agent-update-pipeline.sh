#!/bin/bash
# agent-update-pipeline.sh — Push updates to deployed customer agents
# Works with aaas-platform/customers/ directory structure
# Usage: ./agent-update-pipeline.sh <customer_slug> <agent_slug> <update_type> [version]
# Bash 3.2 compatible

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLATFORM_DIR="$(cd "$SCRIPT_DIR/../../aaas-platform" && pwd)"
CUSTOMERS_DIR="$PLATFORM_DIR/customers"
DEPLOY_DIR="$SCRIPT_DIR/deployments"
VERSION_DIR="$SCRIPT_DIR/versions"
LOG_FILE="$SCRIPT_DIR/deploy.log"

usage() {
    echo "Usage: $0 <customer_slug> <agent_slug> <update_type> [new_version]"
    echo ""
    echo "Arguments:"
    echo "  customer_slug   Customer slug (in aaas-platform/customers/)"
    echo "  agent_slug      Agent slug (in customer's agent-manifest.json)"
    echo "  update_type     What to update: config | soul | prompts | full | rollback"
    echo "  new_version     Version string (default: auto-increment)"
    echo ""
    echo "Examples:"
    echo "  $0 acme-corp ea-aria config"
    echo "  $0 acme-corp ea-aria full 1.2.0"
    echo "  $0 acme-corp ea-aria rollback"
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
UPDATE_TYPE="$3"

# --- Validate customer ---
CUSTOMER_DIR="$CUSTOMERS_DIR/$CUSTOMER"
if [ ! -f "$CUSTOMER_DIR/profile.json" ]; then
    die "Customer '$CUSTOMER' not found or missing profile.json at $CUSTOMER_DIR/profile.json"
fi

# --- Read customer info from profile.json ---
read_json_field() {
    local file="$1" field="$2"
    sed -n "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^,\"}]*\)\"\{0,1\}.*/\1/p" "$file" | head -1
}

COMPANY="$(read_json_field "$CUSTOMER_DIR/profile.json" "company")"
[ -z "$COMPANY" ] && COMPANY="$(read_json_field "$CUSTOMER_DIR/profile.json" "company_name")"

# --- Validate agent directory exists ---
AGENT_DIR="$CUSTOMER_DIR/agents/$AGENT_SLUG"
if [ ! -d "$AGENT_DIR" ]; then
    die "Agent '$AGENT_SLUG' directory not found at $AGENT_DIR"
fi

# --- Load version info ---
# Try new naming first, fall back to legacy
VERSION_FILE="$VERSION_DIR/${CUSTOMER}-${AGENT_SLUG}.json"
if [ ! -f "$VERSION_FILE" ]; then
    # Try legacy naming patterns
    for pattern in "${CUSTOMER}-"*.json; do
        vf="$VERSION_DIR/$pattern"
        if [ -f "$vf" ]; then
            VERSION_FILE="$vf"
            break
        fi
    done
fi

if [ ! -f "$VERSION_FILE" ]; then
    die "No deployment found for ${CUSTOMER}/${AGENT_SLUG}. Deploy first with agent-deploy-remote.sh"
fi

get_json_val() {
    local key="$1" file="$2"
    grep "\"$key\"" "$file" | head -1 | sed 's/.*: *"\{0,1\}\([^",}]*\)"\{0,1\}.*/\1/'
}

CURRENT_VERSION="$(get_json_val 'current_version' "$VERSION_FILE")"
SSH_HOST="$(get_json_val 'ssh_host' "$VERSION_FILE")"
LAST_BUNDLE="$(get_json_val 'bundle' "$VERSION_FILE")"

log "=== Update Pipeline: ${CUSTOMER}/${AGENT_SLUG} ==="
log "Company: $COMPANY"
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
    log "Rolling back ${CUSTOMER}/${AGENT_SLUG}..."

    BACKUP_DIR="$DEPLOY_DIR/backups/${CUSTOMER}-${AGENT_SLUG}"
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        die "No backups found for rollback"
    fi

    LATEST_BACKUP="$(ls -t "$BACKUP_DIR" | head -1)"
    log "Rolling back to: $LATEST_BACKUP"

    echo ""
    echo "--- Rollback Commands ---"
    echo "scp \"$BACKUP_DIR/$LATEST_BACKUP\" \"${SSH_HOST}:/tmp/\""
    echo "ssh \"${SSH_HOST}\" 'cd /tmp && tar xzf $LATEST_BACKUP && cd */ && sudo bash install.sh'"
    echo ""

    CRM_LOG="$SCRIPT_DIR/crm-deployments.log"
    echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ')|ROLLBACK|${CUSTOMER}|${AGENT_SLUG}|${SSH_HOST}|${CURRENT_VERSION}→rollback|${LATEST_BACKUP}" >> "$CRM_LOG"
    log "Rollback prepared. Execute commands above to apply."
    exit 0
fi

# --- Create backup of current deployment ---
BACKUP_DIR="$DEPLOY_DIR/backups/${CUSTOMER}-${AGENT_SLUG}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
BACKUP_NAME="backup-${CURRENT_VERSION}-${TIMESTAMP}"

# --- Create update bundle from agent directory ---
UPDATE_BUNDLE="${CUSTOMER}-${AGENT_SLUG}-update-${TIMESTAMP}"
UPDATE_DIR="$DEPLOY_DIR/$UPDATE_BUNDLE"
mkdir -p "$UPDATE_DIR"

case "$UPDATE_TYPE" in
    config)
        log "Generating config update from agent directory..."
        if [ -f "$AGENT_DIR/CONFIG.yaml" ]; then
            cp "$AGENT_DIR/CONFIG.yaml" "$UPDATE_DIR/CONFIG.yaml"
        else
            die "No CONFIG.yaml found in $AGENT_DIR"
        fi
        ;;

    soul)
        log "Generating soul update from agent directory..."
        if [ -f "$AGENT_DIR/SOUL.md" ]; then
            cp "$AGENT_DIR/SOUL.md" "$UPDATE_DIR/SOUL.md"
        else
            die "No SOUL.md found in $AGENT_DIR"
        fi
        ;;

    prompts)
        log "Generating prompts update from agent directory..."
        if [ -d "$AGENT_DIR/prompts" ]; then
            cp -r "$AGENT_DIR/prompts" "$UPDATE_DIR/prompts"
        else
            die "No prompts/ directory found in $AGENT_DIR"
        fi
        ;;

    full)
        log "Generating full update from agent directory..."
        # Copy all files from the agent directory
        for f in "$AGENT_DIR"/*.md "$AGENT_DIR"/*.yaml; do
            [ -f "$f" ] && cp "$f" "$UPDATE_DIR/"
        done
        [ -d "$AGENT_DIR/prompts" ] && cp -r "$AGENT_DIR/prompts" "$UPDATE_DIR/prompts"

        # Update version in IDENTITY.yaml if present
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
UPDATEEOF
chmod +x "$UPDATE_DIR/update.sh"

# Package
UPDATE_TARBALL="$DEPLOY_DIR/${UPDATE_BUNDLE}.tar.gz"
(cd "$DEPLOY_DIR" && tar czf "${UPDATE_BUNDLE}.tar.gz" "$UPDATE_BUNDLE")
log "Update bundle: $UPDATE_TARBALL"

# --- Update version tracking ---
cat > "$VERSION_FILE" << EOF
{
  "customer": "${CUSTOMER}",
  "company": "${COMPANY}",
  "agent_slug": "${AGENT_SLUG}",
  "current_version": "${NEW_VERSION}",
  "previous_version": "${CURRENT_VERSION}",
  "deployed_at": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "ssh_host": "${SSH_HOST}",
  "bundle": "${UPDATE_BUNDLE}.tar.gz",
  "update_type": "${UPDATE_TYPE}"
}
EOF

# --- Deploy via SSH ---
DRY_RUN="${DRY_RUN:-false}"
REMOTE_DIR="/opt/afrexai-agent"

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
echo "  PUSHING UPDATE"
echo "============================================"
echo ""
echo "Bundle:   $UPDATE_TARBALL"
echo "Customer: $CUSTOMER ($COMPANY)"
echo "Agent:    $AGENT_SLUG"
echo "Version:  $CURRENT_VERSION → $NEW_VERSION"
echo "Type:     $UPDATE_TYPE"
echo "Target:   $SSH_HOST"
echo "Dry Run:  $DRY_RUN"
echo ""

if [ "$DRY_RUN" = "true" ]; then
    log "[DRY RUN] Would push $UPDATE_DIR/ → ${SSH_HOST}:${REMOTE_DIR}/"
else
    if ! ssh $SSH_OPTS "$SSH_HOST" 'echo ok' >/dev/null 2>&1; then
        log "ERROR: Cannot connect to $SSH_HOST"
        log "Bundle available at: $UPDATE_TARBALL"
    else
        log "Backing up remote agent state..."
        ssh $SSH_OPTS "$SSH_HOST" \
            "mkdir -p ${REMOTE_DIR}/backups && cp -r ${REMOTE_DIR}/*.md ${REMOTE_DIR}/*.yaml ${REMOTE_DIR}/backups/pre-update-$(date '+%Y%m%d%H%M%S')/ 2>/dev/null || true"

        if ssh $SSH_OPTS "$SSH_HOST" 'command -v rsync >/dev/null 2>&1'; then
            log "Pushing update via rsync..."
            rsync -avz --checksum --exclude='update.sh' -e "ssh $SSH_OPTS" "$UPDATE_DIR/" "${SSH_HOST}:${REMOTE_DIR}/" || log "WARN: rsync failed"
            log "✅ Rsync complete"
        else
            log "Using scp..."
            scp $SSH_OPTS "$UPDATE_TARBALL" "${SSH_HOST}:/tmp/"
            ssh $SSH_OPTS "$SSH_HOST" "cd /tmp && tar xzf ${UPDATE_BUNDLE}.tar.gz && cd ${UPDATE_BUNDLE} && bash update.sh"
            log "✅ SCP+update complete"
        fi

        log "Verifying update..."
        HEALTH="$(ssh $SSH_OPTS "$SSH_HOST" "${REMOTE_DIR}/health-check.sh" 2>/dev/null || echo '{"status":"unknown"}')"
        log "Health: $HEALTH"
    fi
fi

echo ""
echo "--- Rollback (if needed) ---"
echo "$0 ${CUSTOMER} ${AGENT_SLUG} rollback"
echo ""

CRM_LOG="$SCRIPT_DIR/crm-deployments.log"
echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ')|UPDATE|${CUSTOMER}|${AGENT_SLUG}|${SSH_HOST}|${CURRENT_VERSION}→${NEW_VERSION}|${UPDATE_BUNDLE}|${UPDATE_TYPE}" >> "$CRM_LOG"

log "=== Update pipeline complete ==="
