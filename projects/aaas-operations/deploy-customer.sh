#!/bin/bash
# deploy-customer.sh — Deploy an OpenClaw instance for an AaaS customer
# Usage: ./deploy-customer.sh <customer-name> <config-dir>
# Example: ./deploy-customer.sh sean-ford-skilled-real-estate ./customers/sean-ford-skilled-real-estate/
#
# Requirements:
#   - HETZNER_API_TOKEN env var (or set in 1Password: op://AfrexAI/Hetzner/api_token)
#   - SSH key registered with Hetzner (name: "aaas-deploy")
#   - Customer config directory with workspace files
#
# Bash 3.2 compatible (no associative arrays, no |& syntax)

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────

HETZNER_API="https://api.hetzner.cloud/v1"
SERVER_TYPE="cx31"          # 2 vCPU, 8GB RAM, 80GB SSD — ~€8.49/mo
IMAGE="ubuntu-24.04"
LOCATION="fsn1"             # Falkenstein, Germany (cheapest)
SSH_KEY_NAME="aaas-deploy"
NODE_VERSION="22"           # LTS
OPENCLAW_INSTALL_CMD="npm install -g @anthropic/openclaw"  # adjust if private registry
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=10

# ── Args ────────────────────────────────────────────────────────────────────

if [ $# -lt 2 ]; then
    echo "Usage: $0 <customer-name> <config-dir>"
    echo "Example: $0 sean-ford ./customers/sean-ford-skilled-real-estate/"
    exit 1
fi

CUSTOMER_NAME="$1"
CONFIG_DIR="$2"
SERVER_NAME="aaas-${CUSTOMER_NAME}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="deploy-${CUSTOMER_NAME}-${TIMESTAMP}.log"

# ── Helpers ─────────────────────────────────────────────────────────────────

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

fail() {
    log "FATAL: $1"
    exit 1
}

check_deps() {
    for cmd in curl jq ssh scp; do
        command -v "$cmd" >/dev/null 2>&1 || fail "Missing dependency: $cmd"
    done
}

get_hetzner_token() {
    if [ -n "${HETZNER_API_TOKEN:-}" ]; then
        echo "$HETZNER_API_TOKEN"
        return
    fi
    # Try 1Password
    if command -v op >/dev/null 2>&1; then
        TOKEN="$(op read 'op://AfrexAI/Hetzner/api_token' 2>/dev/null)" || true
        if [ -n "${TOKEN:-}" ]; then
            echo "$TOKEN"
            return
        fi
    fi
    fail "HETZNER_API_TOKEN not set and not found in 1Password"
}

hetzner_api() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"
    local token
    token="$(get_hetzner_token)"

    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${HETZNER_API}${endpoint}"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $token" \
            "${HETZNER_API}${endpoint}"
    fi
}

# ── Validation ──────────────────────────────────────────────────────────────

check_deps

if [ ! -d "$CONFIG_DIR" ]; then
    fail "Config directory not found: $CONFIG_DIR"
fi

log "Starting deployment for customer: $CUSTOMER_NAME"
log "Config directory: $CONFIG_DIR"
log "Server name: $SERVER_NAME"

# ── Step 1: Get SSH Key ID ──────────────────────────────────────────────────

log "Looking up SSH key: $SSH_KEY_NAME"
SSH_KEY_RESPONSE="$(hetzner_api GET /ssh_keys)"
SSH_KEY_ID="$(echo "$SSH_KEY_RESPONSE" | jq -r ".ssh_keys[] | select(.name==\"$SSH_KEY_NAME\") | .id")"

if [ -z "$SSH_KEY_ID" ] || [ "$SSH_KEY_ID" = "null" ]; then
    fail "SSH key '$SSH_KEY_NAME' not found in Hetzner. Register it first."
fi
log "Found SSH key ID: $SSH_KEY_ID"

# ── Step 2: Check for existing server ──────────────────────────────────────

log "Checking for existing server named $SERVER_NAME"
EXISTING="$(hetzner_api GET "/servers?name=$SERVER_NAME")"
EXISTING_ID="$(echo "$EXISTING" | jq -r '.servers[0].id // empty')"

if [ -n "$EXISTING_ID" ]; then
    fail "Server '$SERVER_NAME' already exists (ID: $EXISTING_ID). Delete it first or use a different name."
fi

# ── Step 3: Create server ──────────────────────────────────────────────────

log "Creating Hetzner server: $SERVER_NAME ($SERVER_TYPE in $LOCATION)"

CREATE_PAYLOAD="$(cat <<EOF
{
    "name": "$SERVER_NAME",
    "server_type": "$SERVER_TYPE",
    "image": "$IMAGE",
    "location": "$LOCATION",
    "ssh_keys": [$SSH_KEY_ID],
    "labels": {
        "service": "aaas",
        "customer": "$CUSTOMER_NAME"
    },
    "start_after_create": true
}
EOF
)"

CREATE_RESPONSE="$(hetzner_api POST /servers "$CREATE_PAYLOAD")"
SERVER_ID="$(echo "$CREATE_RESPONSE" | jq -r '.server.id // empty')"
SERVER_IP="$(echo "$CREATE_RESPONSE" | jq -r '.server.public_net.ipv4.ip // empty')"

if [ -z "$SERVER_ID" ] || [ "$SERVER_ID" = "null" ]; then
    ERROR="$(echo "$CREATE_RESPONSE" | jq -r '.error.message // "Unknown error"')"
    fail "Failed to create server: $ERROR"
fi

log "Server created — ID: $SERVER_ID, IP: $SERVER_IP"

# ── Step 4: Wait for server to be ready ─────────────────────────────────────

log "Waiting for server to become ready..."
for i in $(seq 1 60); do
    STATUS="$(hetzner_api GET "/servers/$SERVER_ID" | jq -r '.server.status')"
    if [ "$STATUS" = "running" ]; then
        log "Server is running"
        break
    fi
    if [ "$i" -eq 60 ]; then
        fail "Server did not become ready in 5 minutes"
    fi
    sleep 5
done

# Wait for SSH to be available
log "Waiting for SSH access..."
for i in $(seq 1 30); do
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes "root@$SERVER_IP" "echo ok" >/dev/null 2>&1; then
        log "SSH is available"
        break
    fi
    if [ "$i" -eq 30 ]; then
        fail "SSH not available after 150 seconds"
    fi
    sleep 5
done

# ── Step 5: Install Node.js + OpenClaw ──────────────────────────────────────

log "Installing Node.js $NODE_VERSION and OpenClaw on $SERVER_IP"

ssh -o StrictHostKeyChecking=no "root@$SERVER_IP" bash <<'REMOTE_SCRIPT'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# System updates
apt-get update -qq
apt-get upgrade -y -qq

# Install Node.js via NodeSource
curl -fsSL "https://deb.nodesource.com/setup_22.x" | bash -
apt-get install -y -qq nodejs

# Verify
node --version
npm --version

# Install OpenClaw globally
npm install -g @anthropic/openclaw || {
    echo "WARN: OpenClaw not on public npm. Will need manual install."
    echo "Manual install placeholder — copy binary or install from private registry"
}

# Create openclaw user
useradd -m -s /bin/bash openclaw || true

# Create workspace directory
mkdir -p /home/openclaw/.openclaw/workspace-main
chown -R openclaw:openclaw /home/openclaw

# Setup systemd service
cat > /etc/systemd/system/openclaw.service <<'SYSTEMD'
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
User=openclaw
WorkingDirectory=/home/openclaw/.openclaw/workspace-main
ExecStart=/usr/bin/openclaw gateway start --foreground
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
systemctl enable openclaw

# Install basic monitoring tools
apt-get install -y -qq htop curl jq

# Firewall — allow SSH + OpenClaw gateway port
ufw allow 22/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

echo "=== Server setup complete ==="
REMOTE_SCRIPT

log "Server provisioning complete"

# ── Step 6: Copy customer configs ────────────────────────────────────────────

log "Copying customer configs from $CONFIG_DIR"

scp -o StrictHostKeyChecking=no -r "$CONFIG_DIR"/* "root@$SERVER_IP:/home/openclaw/.openclaw/workspace-main/"
ssh -o StrictHostKeyChecking=no "root@$SERVER_IP" "chown -R openclaw:openclaw /home/openclaw/.openclaw"

log "Customer configs deployed"

# ── Step 7: Start OpenClaw ──────────────────────────────────────────────────

log "Starting OpenClaw service"
ssh -o StrictHostKeyChecking=no "root@$SERVER_IP" "systemctl start openclaw"
sleep 5

# Check service status
SVC_STATUS="$(ssh -o StrictHostKeyChecking=no "root@$SERVER_IP" "systemctl is-active openclaw 2>/dev/null || echo failed")"
if [ "$SVC_STATUS" != "active" ]; then
    log "WARNING: OpenClaw service not active (status: $SVC_STATUS)"
    log "Checking logs..."
    ssh -o StrictHostKeyChecking=no "root@$SERVER_IP" "journalctl -u openclaw --no-pager -n 20" | tee -a "$LOG_FILE"
fi

# ── Step 8: Health check ────────────────────────────────────────────────────

log "Running health checks..."
HEALTH_OK=false

for i in $(seq 1 "$HEALTH_CHECK_RETRIES"); do
    HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://$SERVER_IP:3000/health" 2>/dev/null || echo "000")"
    if [ "$HTTP_CODE" = "200" ]; then
        HEALTH_OK=true
        break
    fi
    log "Health check attempt $i/$HEALTH_CHECK_RETRIES — HTTP $HTTP_CODE"
    sleep "$HEALTH_CHECK_INTERVAL"
done

if [ "$HEALTH_OK" = true ]; then
    log "✅ Health check passed"
else
    log "⚠️  Health check did not return 200 after $HEALTH_CHECK_RETRIES attempts"
    log "Server is provisioned but may need manual verification"
    log "SSH: ssh root@$SERVER_IP"
    log "Logs: ssh root@$SERVER_IP journalctl -u openclaw -f"
fi

# ── Summary ─────────────────────────────────────────────────────────────────

cat <<EOF | tee -a "$LOG_FILE"

════════════════════════════════════════════════════════════════
  DEPLOYMENT SUMMARY
════════════════════════════════════════════════════════════════
  Customer:     $CUSTOMER_NAME
  Server:       $SERVER_NAME
  Server ID:    $SERVER_ID
  IP Address:   $SERVER_IP
  SSH:          ssh root@$SERVER_IP
  Health:       http://$SERVER_IP:3000/health
  Status:       $([ "$HEALTH_OK" = true ] && echo "✅ HEALTHY" || echo "⚠️  NEEDS VERIFICATION")
  Log:          $LOG_FILE
════════════════════════════════════════════════════════════════

  NEXT STEPS:
  1. Add UptimeRobot monitor for http://$SERVER_IP:3000/health
  2. Configure DNS: $CUSTOMER_NAME.aaas.afrexai.com → $SERVER_IP
  3. Setup SSL with Let's Encrypt
  4. Copy API keys to instance (use 1Password)
  5. Run 48-hour burn-in test

EOF
