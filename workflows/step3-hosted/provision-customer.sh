#!/usr/bin/env bash
# DEPRECATED — use aaas-platform/autopilot.sh instead
# provision-customer.sh — Full customer provisioning for AfrexAI Hosted Agents
# Bash 3.2 compatible
set -euo pipefail

# Check if customer already has a unified profile — redirect to autopilot
PLATFORM_CUSTOMERS="$(cd "$(dirname "$0")/../../aaas-platform/customers" 2>/dev/null && pwd)" || true
_check_existing() {
    local name="$1"
    local slug
    slug="$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')"
    if [ -n "$PLATFORM_CUSTOMERS" ] && [ -f "$PLATFORM_CUSTOMERS/$slug/profile.json" ]; then
        echo "⚠️  Customer '$slug' already exists in unified platform. Use aaas-platform/autopilot.sh instead."
        exit 0
    fi
}
echo "⚠️  DEPRECATED: This script is deprecated. Use aaas-platform/autopilot.sh for new customers."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="${AFREX_DATA_DIR:-$SCRIPT_DIR/data}"
CUSTOMERS_DIR="$DATA_DIR/customers"
CRM_LOG="$DATA_DIR/crm.log"
EMAIL_LOG="$DATA_DIR/emails.log"

# --- Pricing ---
tier_agents() {
    case "$1" in
        starter)    echo 1 ;;
        growth)     echo 3 ;;
        enterprise) echo 9 ;;
        *)          echo 0 ;;
    esac
}

tier_price() {
    case "$1" in
        starter)    echo 1500 ;;
        growth)     echo 4500 ;;
        enterprise) echo 12000 ;;
        *)          echo 0 ;;
    esac
}

# --- Default agent rosters by vertical ---
default_agents() {
    local tier="$1" vertical="$2" count
    count="$(tier_agents "$tier")"
    # Base roster — first N agents assigned based on vertical focus
    local all_agents=""
    case "$vertical" in
        legal)
            all_agents="legal-researcher contract-reviewer compliance-monitor doc-drafter case-analyst regulatory-tracker ip-monitor litigation-support records-manager" ;;
        finance)
            all_agents="bookkeeper tax-prep financial-analyst invoice-processor payroll-agent audit-monitor expense-tracker revenue-forecaster treasury-ops" ;;
        healthcare)
            all_agents="patient-scheduler claims-processor compliance-auditor records-manager referral-coordinator billing-agent quality-monitor credentialing-agent telehealth-coordinator" ;;
        realestate)
            all_agents="listing-manager lead-qualifier transaction-coordinator market-analyst property-researcher crm-updater showing-scheduler doc-preparer client-communicator" ;;
        *)
            all_agents="general-assistant researcher scheduler data-processor communicator report-generator monitor analyst coordinator" ;;
    esac
    local i=0
    for a in $all_agents; do
        if [ "$i" -ge "$count" ]; then break; fi
        if [ "$i" -gt 0 ]; then printf " "; fi
        printf "%s" "$a"
        i=$((i + 1))
    done
    echo ""
}

# --- Generate API key (deterministic simulation using date + customer) ---
generate_api_key() {
    local customer_id="$1"
    # Use openssl if available, else fallback
    if command -v openssl >/dev/null 2>&1; then
        echo "afxk_$(echo "${customer_id}_$(date +%s%N 2>/dev/null || date +%s)" | openssl dgst -sha256 2>/dev/null | awk '{print $NF}' | cut -c1-40)"
    else
        echo "afxk_$(echo "${customer_id}_$(date +%s)" | cksum | awk '{printf "%040d", $1}')"
    fi
}

generate_customer_id() {
    local name="$1"
    local slug
    slug="$(echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')"
    local ts
    ts="$(date +%s)"
    echo "cust-${slug}-${ts}"
}

# --- Usage ---
usage() {
    cat <<EOF
Usage: $0 --name <company> --email <email> --tier <starter|growth|enterprise> [--vertical <vertical>]

Options:
  --name       Company name (required)
  --email      Primary contact email (required)
  --tier       Subscription tier: starter, growth, enterprise (required)
  --vertical   Industry vertical: legal, finance, healthcare, realestate, general (default: general)
  --dry-run    Show what would be created without making changes
  -h, --help   Show this help

Examples:
  $0 --name "Acme Legal" --email ceo@acme.com --tier growth --vertical legal
  $0 --name "QuickBooks Pro" --email admin@qbp.com --tier starter --vertical finance
EOF
    exit "${1:-0}"
}

# --- Parse args ---
CUSTOMER_NAME="" CUSTOMER_EMAIL="" TIER="" VERTICAL="general" DRY_RUN=0

while [ $# -gt 0 ]; do
    case "$1" in
        --name)      CUSTOMER_NAME="$2"; shift 2 ;;
        --email)     CUSTOMER_EMAIL="$2"; shift 2 ;;
        --tier)      TIER="$2"; shift 2 ;;
        --vertical)  VERTICAL="$2"; shift 2 ;;
        --dry-run)   DRY_RUN=1; shift ;;
        -h|--help)   usage 0 ;;
        *)           echo "Unknown option: $1" >&2; usage 1 ;;
    esac
done

if [ -z "$CUSTOMER_NAME" ] || [ -z "$CUSTOMER_EMAIL" ] || [ -z "$TIER" ]; then
    echo "Error: --name, --email, and --tier are required." >&2
    usage 1
fi

AGENT_COUNT="$(tier_agents "$TIER")"
if [ "$AGENT_COUNT" -eq 0 ]; then
    echo "Error: Invalid tier '$TIER'. Use starter, growth, or enterprise." >&2
    exit 1
fi

PRICE="$(tier_price "$TIER")"
CUSTOMER_ID="$(generate_customer_id "$CUSTOMER_NAME")"
CUST_DIR="$CUSTOMERS_DIR/$CUSTOMER_ID"
AGENTS="$(default_agents "$TIER" "$VERTICAL")"
API_KEY="$(generate_api_key "$CUSTOMER_ID")"
PROVISION_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "=============================================="
echo "  AfrexAI Hosted Agents — Customer Provisioning"
echo "=============================================="
echo ""
echo "Customer:    $CUSTOMER_NAME"
echo "Email:       $CUSTOMER_EMAIL"
echo "Tier:        $TIER ($AGENT_COUNT agent(s), \$$PRICE/mo)"
echo "Vertical:    $VERTICAL"
echo "Customer ID: $CUSTOMER_ID"
echo ""

if [ "$DRY_RUN" -eq 1 ]; then
    echo "[DRY RUN] Would create environment at: $CUST_DIR"
    echo "[DRY RUN] Agents: $AGENTS"
    echo "[DRY RUN] API Key: $API_KEY"
    exit 0
fi

# --- 1. Create isolated customer environment ---
echo "▸ Creating isolated environment..."
mkdir -p "$CUST_DIR"/{config,agents,data,logs,backups,monitoring}

# Customer manifest
cat > "$CUST_DIR/config/manifest.json" <<MANIFEST
{
  "customer_id": "$CUSTOMER_ID",
  "company_name": "$CUSTOMER_NAME",
  "email": "$CUSTOMER_EMAIL",
  "tier": "$TIER",
  "vertical": "$VERTICAL",
  "agent_count": $AGENT_COUNT,
  "monthly_price": $PRICE,
  "api_key": "$API_KEY",
  "provisioned_at": "$PROVISION_DATE",
  "status": "active",
  "agents": []
}
MANIFEST

# --- 2. Deploy agents ---
echo "▸ Deploying $AGENT_COUNT agent(s)..."
AGENT_JSON_ARRAY=""
for agent_name in $AGENTS; do
    agent_id="${CUSTOMER_ID}-${agent_name}"
    agent_dir="$CUST_DIR/agents/$agent_name"
    mkdir -p "$agent_dir"/{memory,logs,config}

    cat > "$agent_dir/config/agent.json" <<AGENTCFG
{
  "agent_id": "$agent_id",
  "agent_name": "$agent_name",
  "customer_id": "$CUSTOMER_ID",
  "status": "running",
  "deployed_at": "$PROVISION_DATE",
  "vertical": "$VERTICAL",
  "memory_path": "memory/",
  "log_path": "logs/"
}
AGENTCFG

    # Init memory
    echo "[]" > "$agent_dir/memory/context.json"
    echo "$PROVISION_DATE — Agent $agent_name deployed for $CUSTOMER_NAME" > "$agent_dir/logs/activity.log"

    if [ -n "$AGENT_JSON_ARRAY" ]; then AGENT_JSON_ARRAY="${AGENT_JSON_ARRAY},"; fi
    AGENT_JSON_ARRAY="${AGENT_JSON_ARRAY}\"$agent_name\""
    echo "  ✓ $agent_name ($agent_id)"
done

# Update manifest with agent list
sed -i.bak "s/\"agents\": \[\]/\"agents\": [$AGENT_JSON_ARRAY]/" "$CUST_DIR/config/manifest.json" 2>/dev/null || \
    sed -i '' "s/\"agents\": \[\]/\"agents\": [$AGENT_JSON_ARRAY]/" "$CUST_DIR/config/manifest.json"
rm -f "$CUST_DIR/config/manifest.json.bak"

# --- 3. Set up monitoring ---
echo "▸ Setting up monitoring..."
cat > "$CUST_DIR/monitoring/health.json" <<HEALTH
{
  "customer_id": "$CUSTOMER_ID",
  "last_check": "$PROVISION_DATE",
  "overall_status": "healthy",
  "uptime_percent": 100.0,
  "agents_healthy": $AGENT_COUNT,
  "agents_degraded": 0,
  "agents_down": 0,
  "error_rate_24h": 0.0,
  "avg_response_ms": 0
}
HEALTH

cat > "$CUST_DIR/monitoring/sla.json" <<SLA
{
  "customer_id": "$CUSTOMER_ID",
  "tier": "$TIER",
  "sla_target_uptime": 99.9,
  "current_uptime": 100.0,
  "breaches_this_month": 0,
  "last_incident": null,
  "monitoring_since": "$PROVISION_DATE"
}
SLA

# --- 4. Send welcome email (logged) ---
echo "▸ Sending welcome email..."
mkdir -p "$(dirname "$EMAIL_LOG")"
cat >> "$EMAIL_LOG" <<EMAIL
---
to: $CUSTOMER_EMAIL
subject: Welcome to AfrexAI Hosted Agents — Your $TIER Plan is Live!
date: $PROVISION_DATE
body: |
  Hi $CUSTOMER_NAME,

  Your AfrexAI Hosted Agents environment is now live!

  Plan: $(echo "$TIER" | awk '{print toupper(substr($0,1,1)) substr($0,2)}') ($AGENT_COUNT agent(s))
  Monthly: \$$PRICE/mo
  Vertical: $VERTICAL
  Customer ID: $CUSTOMER_ID

  Your agents are deployed and ready:
$(for a in $AGENTS; do echo "    - $a"; done)

  API Key: ${API_KEY:0:12}...${API_KEY: -4}

  Dashboard: https://portal.afrexai.com/c/$CUSTOMER_ID
  Docs: https://docs.afrexai.com
  Support: support@afrexai.com

  Welcome aboard!
  — The AfrexAI Team
EMAIL
echo "  ✓ Welcome email queued to $CUSTOMER_EMAIL"

# --- 5. Log to CRM ---
echo "▸ Logging to CRM..."
mkdir -p "$(dirname "$CRM_LOG")"
cat >> "$CRM_LOG" <<CRM
{"event":"customer_provisioned","customer_id":"$CUSTOMER_ID","company":"$CUSTOMER_NAME","email":"$CUSTOMER_EMAIL","tier":"$TIER","vertical":"$VERTICAL","agents":$AGENT_COUNT,"mrr":$PRICE,"provisioned_at":"$PROVISION_DATE"}
CRM
echo "  ✓ CRM updated"

# --- 6. Onboarding summary ---
echo ""
echo "=============================================="
echo "  ✅ PROVISIONING COMPLETE"
echo "=============================================="
echo ""
echo "  Customer ID:  $CUSTOMER_ID"
echo "  Company:      $CUSTOMER_NAME"
echo "  Email:        $CUSTOMER_EMAIL"
echo "  Tier:         $TIER"
echo "  Vertical:     $VERTICAL"
echo "  Agents:       $AGENT_COUNT"
echo "  MRR:          \$$PRICE"
echo "  API Key:      ${API_KEY:0:12}...${API_KEY: -4}"
echo "  Environment:  $CUST_DIR"
echo "  Portal:       https://portal.afrexai.com/c/$CUSTOMER_ID"
echo ""
echo "  Agents deployed:"
for a in $AGENTS; do
    echo "    • $a (running)"
done
echo ""
echo "  Next steps:"
echo "    1. Customer receives welcome email"
echo "    2. Agent training begins (vertical: $VERTICAL)"
echo "    3. First health check in 5 minutes"
echo "    4. SLA monitoring active"
echo "=============================================="
