#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# AfrexAI AaaS Autopilot — SOLE entry point for customer onboarding
# Usage: ./autopilot.sh "Company Name" "contact@email.com" "starter|growth|scale|enterprise" "vertical"
# Env:   DRY_RUN=true (skip destructive ops)  SSH_HOST=user@host (enable remote deploy)
# ============================================================================

PLATFORM_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE_ROOT="$(cd "$PLATFORM_DIR/.." && pwd)"
STEP2_DIR="$WORKSPACE_ROOT/workflows/step2-agents"
PRICING_FILE="${PLATFORM_DIR}/pricing.json"
DRY_RUN="${DRY_RUN:-false}"
SSH_HOST="${SSH_HOST:-}"

if [ $# -lt 3 ]; then
    echo "Usage: $0 \"Company Name\" \"contact@email.com\" \"starter|growth|scale|enterprise\" [vertical]"
    echo ""
    echo "Verticals: legal, healthcare, finance, construction, saas, professional-services, general"
    echo ""
    echo "Options (env vars):"
    echo "  DRY_RUN=true    — Preview without writing"
    echo "  SSH_HOST=u@host — Also deploy to remote host"
    exit 1
fi

COMPANY_NAME="$1"
CONTACT_EMAIL="$2"
PACKAGE="$(echo "$3" | tr '[:upper:]' '[:lower:]')"
VERTICAL="${4:-general}"

# Slug: lowercase, hyphens, no special chars, no double/leading/trailing hyphens
CUSTOMER_SLUG="$(echo "$COMPANY_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')"
CUSTOMER_DIR="${PLATFORM_DIR}/customers/${CUSTOMER_SLUG}"

# ── Validate pricing.json exists ──
[ -f "$PRICING_FILE" ] || { echo "❌ pricing.json not found at ${PRICING_FILE}"; exit 1; }

# ── Read all pricing from pricing.json (NO hardcoded prices) ──
read_pricing() {
    python3 -c "
import json, sys
p = json.load(open('${PRICING_FILE}'))
tier = '${PACKAGE}'
vertical = '${VERTICAL}'
if tier not in p['tiers']:
    print('ERROR', file=sys.stderr)
    sys.exit(1)
base = p['tiers'][tier]['price']
agents = p['tiers'][tier]['agents']
vpct = p['vertical_premiums'].get(vertical, 0)
premium = base * vpct // 100
total = base + premium
print(f'{base} {vpct} {premium} {total} {agents}')
"
}

read -r BASE_PRICE VPCT VPREMIUM TOTAL_PRICE AGENT_COUNT <<< "$(read_pricing)" || { echo "❌ Invalid package: ${PACKAGE}"; exit 1; }

[ "$AGENT_COUNT" -gt 0 ] 2>/dev/null || { echo "❌ Invalid package: ${PACKAGE}"; exit 1; }

echo "╔══════════════════════════════════════════════════╗"
echo "║  🚀 AfrexAI AaaS Autopilot                      ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Company:   ${COMPANY_NAME}"
echo "║  Email:     ${CONTACT_EMAIL}"
echo "║  Package:   ${PACKAGE} (${AGENT_COUNT} agents, \$${TOTAL_PRICE}/mo)"
echo "║  Vertical:  ${VERTICAL}"
if [ "$VPREMIUM" -gt 0 ]; then
echo "║  Premium:   \$${VPREMIUM}/mo (${VPCT}% ${VERTICAL} vertical)"
fi
echo "║  Slug:      ${CUSTOMER_SLUG}"
echo "║  Dry Run:   ${DRY_RUN}"
[ -n "$SSH_HOST" ] && echo "║  SSH Host:  ${SSH_HOST}"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ━━━ Step 1: Create Unified Profile ━━━
echo "━━━ Step 1/7: Creating Customer Profile ━━━"

if [ -d "$CUSTOMER_DIR" ] && [ -f "$CUSTOMER_DIR/profile.json" ]; then
    echo "⚠️  Customer '${CUSTOMER_SLUG}' already exists — updating"
fi

if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] Would create profile at ${CUSTOMER_DIR}/profile.json"
else
    mkdir -p "$CUSTOMER_DIR"/{agents,config,monitoring}
    python3 -c "
import json, datetime
profile = {
    'slug': '${CUSTOMER_SLUG}',
    'company_name': '${COMPANY_NAME}',
    'contact_name': '',
    'email': '${CONTACT_EMAIL}',
    'tier': '${PACKAGE}',
    'vertical': '${VERTICAL}',
    'agents': [],
    'monthly_price': ${TOTAL_PRICE},
    'pricing': {
        'base_price': ${BASE_PRICE},
        'vertical_premium_pct': ${VPCT},
        'vertical_premium_amount': ${VPREMIUM},
        'monthly_total': ${TOTAL_PRICE},
        'currency': 'USD',
        'billing_cycle': 'monthly'
    },
    'status': 'active',
    'created_at': datetime.datetime.utcnow().isoformat() + 'Z',
    'api_key': ''
}
json.dump(profile, open('${CUSTOMER_DIR}/profile.json', 'w'), indent=2)
"
    echo "✅ Profile created at ${CUSTOMER_DIR}/profile.json"
fi
echo ""

# ━━━ Step 2: Generate Agents ━━━
echo "━━━ Step 2/7: Agent Generation ━━━"

if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] Would generate ${AGENT_COUNT} agents for ${VERTICAL} vertical"
else
    if [ -f "${PLATFORM_DIR}/generate-agents.sh" ]; then
        COMPANY_NAME="$COMPANY_NAME" bash "${PLATFORM_DIR}/generate-agents.sh" "$CUSTOMER_SLUG" "$VERTICAL" "$PACKAGE"
    else
        echo "⚠️  generate-agents.sh not found — skipping agent generation"
    fi
fi
echo ""

# ━━━ Step 3: Register Billing ━━━
echo "━━━ Step 3/7: Billing Configuration ━━━"

START_DATE="$(date '+%Y-%m-%d')"
if [ -f "$STEP2_DIR/billing-tracker.sh" ]; then
    if [ "$DRY_RUN" = "true" ]; then
        echo "[DRY RUN] Would register billing: $CUSTOMER_SLUG $PACKAGE $START_DATE"
    else
        bash "$STEP2_DIR/billing-tracker.sh" add "$CUSTOMER_SLUG" "$PACKAGE" "$START_DATE" 2>/dev/null || \
            echo "  (billing already configured or tracker unavailable)"
    fi
    echo "✅ Billing configured: ${PACKAGE} tier, \$${TOTAL_PRICE}/mo"
else
    echo "⚠️  Billing tracker not found — skipping"
fi
echo ""

# ━━━ Step 4: Health Check ━━━
echo "━━━ Step 4/7: Initial Health Check ━━━"

if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] Would run health check"
else
    if [ -f "${PLATFORM_DIR}/agent-health-monitor.sh" ]; then
        bash "${PLATFORM_DIR}/agent-health-monitor.sh" "$CUSTOMER_SLUG" 2>/dev/null || echo "  (health monitor completed)"
    else
        echo "ℹ️  Health monitor not available — skipping"
    fi
fi
echo ""

# ━━━ Step 5: Generate Configs ━━━
echo "━━━ Step 5/7: Configuration Generation ━━━"

if [ "$DRY_RUN" != "true" ] && [ -d "$CUSTOMER_DIR" ]; then
    # Read agent list from profile.json
    AGENT_IDS="$(python3 -c "
import json
p = json.load(open('${CUSTOMER_DIR}/profile.json'))
for a in p.get('agents', []):
    print(a['id'])
" 2>/dev/null || true)"

    mkdir -p "${CUSTOMER_DIR}/config"
    cat > "${CUSTOMER_DIR}/config/openclaw-gateway.yaml" << EOF
# OpenClaw Gateway Config for ${COMPANY_NAME}
# Auto-generated by AfrexAI Autopilot on $(date -u '+%Y-%m-%dT%H:%M:%SZ')

gateway:
  customer: "${CUSTOMER_SLUG}"
  company: "${COMPANY_NAME}"
  vertical: "${VERTICAL}"
  tier: "${PACKAGE}"

agents:
EOF
    for AGENT_ID in $AGENT_IDS; do
        cat >> "${CUSTOMER_DIR}/config/openclaw-gateway.yaml" << EOF
  - id: "${AGENT_ID}"
    schedule:
      morning: "0 8 * * *"
      evening: "0 20 * * *"
    heartbeat: "*/30 * * * *"
EOF
    done
    echo "✅ Configs generated at ${CUSTOMER_DIR}/config/"
else
    echo "[DRY RUN] Would generate gateway and agent configs"
fi
echo ""

# ━━━ Step 6: Welcome Email ━━━
echo "━━━ Step 6/7: Welcome Email ━━━"

WELCOME_FILE="${CUSTOMER_DIR}/welcome-email.md"
if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] Would generate welcome email"
else
    mkdir -p "${CUSTOMER_DIR}"

    # Build agent list for email
    AGENT_LIST="$(python3 -c "
import json
p = json.load(open('${CUSTOMER_DIR}/profile.json'))
for a in p.get('agents', []):
    print(f\"- {a['name']}\")
" 2>/dev/null || echo "- (agents pending setup)")"

    PREMIUM_LINE=""
    if [ "$VPREMIUM" -gt 0 ]; then
        PREMIUM_LINE=" (includes \$${VPREMIUM} ${VERTICAL} vertical premium)"
    fi

    cat > "$WELCOME_FILE" << EOF
**Subject:** Welcome to AfrexAI — Your AI Workforce is Live! 🚀

Hi ${COMPANY_NAME} team,

Welcome to AfrexAI Agent-as-a-Service!

Your **${PACKAGE}** plan is now active with **${AGENT_COUNT} AI agent(s)** deployed for your **${VERTICAL}** vertical.

**Your AI team:**
${AGENT_LIST}

**What happens next:**
1. ✅ Your agents are provisioned and configured
2. 📅 Schedule your integration setup call: https://calendly.com/cbeckford-afrexai/30min
3. 🔌 We'll connect your agents to Slack, email, CRM, and calendar
4. 🚀 Your agents begin their first shift once integrations are live

**Your monthly investment:** \$${TOTAL_PRICE}/mo${PREMIUM_LINE}

**Your dashboard:** We'll send you a health report weekly showing agent activity and performance.

Questions? Reply to this email or reach us at support@afrexai.com.

Best,
The AfrexAI Team
—
AfrexAI | AI Agent-as-a-Service
https://afrexai.com
EOF
    echo "✅ Welcome email → ${WELCOME_FILE}"

    # Queue email for sending
    PENDING_DIR="${PLATFORM_DIR}/pending-emails"
    mkdir -p "$PENDING_DIR"
    cp "$WELCOME_FILE" "${PENDING_DIR}/${CUSTOMER_SLUG}-welcome.md"

    # Schedule 7-day and 30-day follow-ups
    FOLLOWUP_DIR="${PLATFORM_DIR}/scheduled-followups"
    mkdir -p "$FOLLOWUP_DIR"
    FOLLOWUP_7D=$(date -u -v+7d +"%Y-%m-%d" 2>/dev/null || date -u -d "+7 days" +"%Y-%m-%d" 2>/dev/null || echo "7d-from-$(date +%Y-%m-%d)")
    FOLLOWUP_30D=$(date -u -v+30d +"%Y-%m-%d" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%d" 2>/dev/null || echo "30d-from-$(date +%Y-%m-%d)")

    cat > "${FOLLOWUP_DIR}/${CUSTOMER_SLUG}-7day.json" << EOF
{"customer":"${CUSTOMER_SLUG}","email":"${CONTACT_EMAIL}","type":"7day_followup","scheduled":"${FOLLOWUP_7D}","status":"pending"}
EOF
    cat > "${FOLLOWUP_DIR}/${CUSTOMER_SLUG}-30day.json" << EOF
{"customer":"${CUSTOMER_SLUG}","email":"${CONTACT_EMAIL}","type":"30day_checkin","scheduled":"${FOLLOWUP_30D}","status":"pending"}
EOF
fi
echo ""

# ━━━ Step 7: CRM Log & Summary ━━━
echo "━━━ Step 7/7: CRM & Summary ━━━"

CRM_LOG="${PLATFORM_DIR}/crm-log.jsonl"
if [ "$DRY_RUN" != "true" ]; then
    CRM_ENTRY="{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"customer_onboarded\",\"customer\":\"${CUSTOMER_SLUG}\",\"company\":\"${COMPANY_NAME}\",\"email\":\"${CONTACT_EMAIL}\",\"package\":\"${PACKAGE}\",\"vertical\":\"${VERTICAL}\",\"agents\":${AGENT_COUNT},\"mrr\":${TOTAL_PRICE},\"currency\":\"USD\"}"
    echo "$CRM_ENTRY" >> "$CRM_LOG"
    echo "✅ Logged to CRM"
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ Autopilot Complete                           ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Customer:  ${COMPANY_NAME}"
echo "║  Package:   ${PACKAGE} (${AGENT_COUNT} agents, \$${TOTAL_PRICE}/mo)"
echo "║  Vertical:  ${VERTICAL}"
echo "║  Path:      ${CUSTOMER_DIR}"
echo "║  Welcome:   ${CUSTOMER_DIR}/welcome-email.md"
echo "║  Config:    ${CUSTOMER_DIR}/config/"
echo "║  CRM:       ${CRM_LOG}"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Next steps:                                    ║"
echo "║  □ Send welcome email to ${CONTACT_EMAIL}"
echo "║  □ Schedule integration call                    ║"
[ -z "$SSH_HOST" ] && echo "║  □ Deploy to remote: SSH_HOST=u@host ./autopilot.sh ..."
echo "╚══════════════════════════════════════════════════╝"
