#!/bin/bash
# integration-connector.sh — Wire agent into customer tools
# Usage: ./integration-connector.sh <customer> <agent_type> <integration> [op_uri]
# Bash 3.2 compatible

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INTEGRATION_DIR="$SCRIPT_DIR/integrations"
VERSION_DIR="$SCRIPT_DIR/versions"
LOG_FILE="$SCRIPT_DIR/deploy.log"

usage() {
    echo "Usage: $0 <customer> <agent_type> <integration_type> [op_credentials_uri]"
    echo ""
    echo "Integration types: slack | email | crm | calendar | webhook | api"
    echo ""
    echo "Examples:"
    echo "  $0 acme assistant slack op://AfrexAI/Acme-Slack/bot_token"
    echo "  $0 acme support email op://AfrexAI/Acme-SMTP/password"
    echo "  $0 globex sales crm op://AfrexAI/Globex-HubSpot/api_key"
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
INTEGRATION="$3"
OP_URI="${4:-op://AfrexAI/${CUSTOMER}-${INTEGRATION}/credentials}"

# Validate integration type
case "$INTEGRATION" in
    slack|email|crm|calendar|webhook|api) ;;
    *) die "Invalid integration: $INTEGRATION. Must be: slack, email, crm, calendar, webhook, api" ;;
esac

# Check deployment exists
VERSION_FILE="$VERSION_DIR/${CUSTOMER}-${AGENT_TYPE}.json"
[ -f "$VERSION_FILE" ] || die "No deployment found for ${CUSTOMER}/${AGENT_TYPE}. Deploy first."

log "=== Configuring ${INTEGRATION} integration for ${CUSTOMER}/${AGENT_TYPE} ==="

# Create integration config directory
INT_DIR="$INTEGRATION_DIR/${CUSTOMER}-${AGENT_TYPE}"
mkdir -p "$INT_DIR"

# --- Generate integration config ---
case "$INTEGRATION" in
    slack)
        cat > "$INT_DIR/slack.yaml" << EOF
# Slack Integration for ${CUSTOMER}/${AGENT_TYPE}
integration:
  type: slack
  customer: "${CUSTOMER}"
  agent: "${AGENT_TYPE}"
  created: "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

credentials:
  bot_token: "${OP_URI}"
  # Resolved at runtime via: op read "${OP_URI}"

config:
  channels:
    - "#general"
    - "#support"
  bot_name: "AfrexAI ${AGENT_TYPE}"
  respond_to_mentions: true
  respond_to_dms: true
  thread_replies: true
  emoji_reactions: true

events:
  - message
  - app_mention
  - member_joined_channel

permissions:
  - chat:write
  - channels:read
  - channels:history
  - users:read
  - reactions:write
  - files:read
EOF

        # Generate setup instructions
        cat > "$INT_DIR/slack-setup.md" << EOF
# Slack Integration Setup — ${CUSTOMER}

## Prerequisites
1. Slack workspace admin access
2. Bot token stored in 1Password: \`${OP_URI}\`

## Steps

### 1. Create Slack App
- Go to https://api.slack.com/apps
- Click "Create New App" → "From scratch"
- Name: "AfrexAI ${AGENT_TYPE}"
- Workspace: ${CUSTOMER}'s workspace

### 2. Configure Bot
- Go to "OAuth & Permissions"
- Add scopes: chat:write, channels:read, channels:history, users:read, reactions:write, files:read
- Install to workspace
- Copy Bot User OAuth Token

### 3. Store Credentials
\`\`\`bash
op item create --vault AfrexAI --category login \\
  --title "${CUSTOMER}-slack" \\
  bot_token="xoxb-your-token-here"
\`\`\`

### 4. Deploy Config
\`\`\`bash
scp "$INT_DIR/slack.yaml" "<ssh_host>:/opt/afrexai-agent/integrations/"
\`\`\`

### 5. Enable in Agent Config
Add to CONFIG.yaml:
\`\`\`yaml
channels:
  enabled:
    - slack
\`\`\`

### 6. Verify
\`\`\`bash
# Test bot can post
op run --env-file="$INT_DIR/slack.env" -- \\
  curl -X POST https://slack.com/api/chat.postMessage \\
  -H "Authorization: Bearer \\\$SLACK_BOT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"channel":"#general","text":"AfrexAI agent online! 🤖"}'
\`\`\`
EOF
        # Generate op.env for runtime
        cat > "$INT_DIR/slack.env" << EOF
SLACK_BOT_TOKEN=${OP_URI}
EOF
        ;;

    email)
        cat > "$INT_DIR/email.yaml" << EOF
# Email Integration for ${CUSTOMER}/${AGENT_TYPE}
integration:
  type: email
  customer: "${CUSTOMER}"
  agent: "${AGENT_TYPE}"
  created: "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

credentials:
  smtp_password: "${OP_URI}"

config:
  smtp:
    host: "smtp.example.com"
    port: 587
    tls: true
    from: "agent@${CUSTOMER}.com"
  imap:
    host: "imap.example.com"
    port: 993
    tls: true
    folder: "INBOX"
    poll_interval: 60

  rules:
    auto_respond: true
    max_response_delay: 300
    signature: |
      --
      AfrexAI ${AGENT_TYPE} Agent
      Managed by AfrexAI | support@afrexai.com
EOF

        cat > "$INT_DIR/email-setup.md" << EOF
# Email Integration Setup — ${CUSTOMER}

## Prerequisites
1. Email account for the agent (e.g., agent@${CUSTOMER}.com)
2. SMTP/IMAP credentials in 1Password: \`${OP_URI}\`

## Steps

### 1. Create Agent Email Account
- Create dedicated email: agent@${CUSTOMER}.com
- Enable IMAP access
- Generate app-specific password if 2FA enabled

### 2. Store Credentials
\`\`\`bash
op item create --vault AfrexAI --category login \\
  --title "${CUSTOMER}-email" \\
  smtp_host="smtp.example.com" \\
  smtp_password="app-password-here" \\
  imap_host="imap.example.com"
\`\`\`

### 3. Update email.yaml
- Set correct SMTP/IMAP hosts and ports
- Configure from address
- Set poll interval

### 4. Deploy
\`\`\`bash
scp "$INT_DIR/email.yaml" "<ssh_host>:/opt/afrexai-agent/integrations/"
\`\`\`

### 5. Test
\`\`\`bash
# Send test email
echo "AfrexAI agent test" | mail -s "Test" admin@${CUSTOMER}.com
\`\`\`
EOF
        cat > "$INT_DIR/email.env" << EOF
SMTP_PASSWORD=${OP_URI}
EOF
        ;;

    crm)
        cat > "$INT_DIR/crm.yaml" << EOF
# CRM Integration for ${CUSTOMER}/${AGENT_TYPE}
integration:
  type: crm
  customer: "${CUSTOMER}"
  agent: "${AGENT_TYPE}"
  created: "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

credentials:
  api_key: "${OP_URI}"

config:
  provider: "hubspot"  # hubspot | salesforce | pipedrive | custom
  base_url: "https://api.hubapi.com"

  sync:
    contacts: true
    deals: true
    tickets: true
    notes: true
    poll_interval: 300

  actions:
    create_contacts: true
    update_deals: true
    log_activities: true
    create_tickets: true
EOF

        cat > "$INT_DIR/crm-setup.md" << EOF
# CRM Integration Setup — ${CUSTOMER}

## Steps

### 1. Generate API Key
- HubSpot: Settings → Integrations → API Key
- Salesforce: Setup → Apps → Connected Apps
- Pipedrive: Settings → Personal Preferences → API

### 2. Store in 1Password
\`\`\`bash
op item create --vault AfrexAI --category login \\
  --title "${CUSTOMER}-crm" \\
  api_key="your-api-key" \\
  provider="hubspot"
\`\`\`

### 3. Update crm.yaml
- Set correct provider
- Configure sync options
- Set allowed actions

### 4. Deploy & Test
\`\`\`bash
scp "$INT_DIR/crm.yaml" "<ssh_host>:/opt/afrexai-agent/integrations/"
# Test API connection
op run --env-file="$INT_DIR/crm.env" -- \\
  curl -H "Authorization: Bearer \\\$CRM_API_KEY" \\
  "https://api.hubapi.com/crm/v3/objects/contacts?limit=1"
\`\`\`
EOF
        cat > "$INT_DIR/crm.env" << EOF
CRM_API_KEY=${OP_URI}
EOF
        ;;

    calendar)
        cat > "$INT_DIR/calendar.yaml" << EOF
# Calendar Integration for ${CUSTOMER}/${AGENT_TYPE}
integration:
  type: calendar
  customer: "${CUSTOMER}"
  agent: "${AGENT_TYPE}"
  created: "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

credentials:
  service_account: "${OP_URI}"

config:
  provider: "google"  # google | outlook | caldav
  calendar_id: "primary"

  capabilities:
    read_events: true
    create_events: true
    update_events: true
    delete_events: false
    send_invites: true

  scheduling:
    working_hours: "09:00-17:00"
    timezone: "UTC"
    buffer_minutes: 15
    min_notice_hours: 2
EOF

        cat > "$INT_DIR/calendar-setup.md" << EOF
# Calendar Integration Setup — ${CUSTOMER}

## Steps

### 1. Create Service Account (Google)
- Google Cloud Console → IAM → Service Accounts
- Create account, download JSON key
- Share calendar with service account email

### 2. Store Credentials
\`\`\`bash
op document create --vault AfrexAI \\
  --title "${CUSTOMER}-calendar" \\
  service-account-key.json
\`\`\`

### 3. Deploy
\`\`\`bash
scp "$INT_DIR/calendar.yaml" "<ssh_host>:/opt/afrexai-agent/integrations/"
\`\`\`
EOF
        cat > "$INT_DIR/calendar.env" << EOF
CALENDAR_CREDENTIALS=${OP_URI}
EOF
        ;;

    webhook)
        cat > "$INT_DIR/webhook.yaml" << EOF
# Webhook Integration for ${CUSTOMER}/${AGENT_TYPE}
integration:
  type: webhook
  customer: "${CUSTOMER}"
  agent: "${AGENT_TYPE}"
  created: "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

config:
  inbound:
    endpoint: "/webhook/inbound"
    secret: "${OP_URI}"
    verify_signature: true

  outbound:
    url: "https://${CUSTOMER}.example.com/api/agent-events"
    secret: "${OP_URI}"
    events:
      - task_completed
      - escalation
      - error
    retry:
      max_attempts: 3
      backoff_seconds: 30
EOF
        cat > "$INT_DIR/webhook.env" << EOF
WEBHOOK_SECRET=${OP_URI}
EOF
        ;;

    api)
        cat > "$INT_DIR/api.yaml" << EOF
# API Integration for ${CUSTOMER}/${AGENT_TYPE}
integration:
  type: api
  customer: "${CUSTOMER}"
  agent: "${AGENT_TYPE}"
  created: "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

config:
  base_url: "https://api.${CUSTOMER}.com"
  auth_type: "bearer"  # bearer | api_key | basic | oauth2
  credentials: "${OP_URI}"

  endpoints: []
  # Define custom API endpoints the agent can call

  rate_limit:
    requests_per_minute: 30
    concurrent: 5
EOF
        cat > "$INT_DIR/api.env" << EOF
API_CREDENTIALS=${OP_URI}
EOF
        ;;
esac

log "Generated ${INTEGRATION} config at: $INT_DIR/"

# --- Test connection (dry run) ---
echo ""
echo "============================================"
echo "  INTEGRATION CONFIGURED: ${INTEGRATION}"
echo "============================================"
echo ""
echo "Config: $INT_DIR/${INTEGRATION}.yaml"
echo "Env:    $INT_DIR/${INTEGRATION}.env"

if [ -f "$INT_DIR/${INTEGRATION}-setup.md" ]; then
    echo "Guide:  $INT_DIR/${INTEGRATION}-setup.md"
fi

echo ""
echo "--- Connection Test ---"

if command -v op >/dev/null 2>&1; then
    echo "Testing 1Password credential access..."
    if op read "$OP_URI" >/dev/null 2>&1; then
        echo "✅ Credentials accessible in 1Password"
    else
        echo "⚠️  Could not read credentials from: $OP_URI"
        echo "   Store them first, then re-run."
    fi
else
    echo "⚠️  1Password CLI not found. Install with: brew install 1password-cli"
    echo "   Credentials URI: $OP_URI"
fi

echo ""
echo "--- Next Steps ---"
echo "1. Review and edit: $INT_DIR/${INTEGRATION}.yaml"
echo "2. Follow setup guide: $INT_DIR/${INTEGRATION}-setup.md"
echo "3. Deploy to customer: scp config to /opt/afrexai-agent/integrations/"
echo "4. Update agent CONFIG.yaml to enable ${INTEGRATION}"
echo ""

# Log
CRM_LOG="$SCRIPT_DIR/crm-deployments.log"
echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ')|INTEGRATION|${CUSTOMER}|${AGENT_TYPE}|${INTEGRATION}|configured" >> "$CRM_LOG"

log "=== Integration connector complete ==="
