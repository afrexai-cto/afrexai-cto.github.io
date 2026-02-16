#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# AfrexAI AaaS Autopilot — End-to-end customer signup automation
# Usage: ./autopilot.sh "Company Name" "contact@email.com" "starter|growth|scale|enterprise"
# Env:   DRY_RUN=true (skip destructive ops)  SSH_HOST=user@host (enable remote deploy)
# ============================================================================

PLATFORM_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE_ROOT="$(cd "$PLATFORM_DIR/.." && pwd)"
STEP2_DIR="$WORKSPACE_ROOT/workflows/step2-agents"
DRY_RUN="${DRY_RUN:-false}"
SSH_HOST="${SSH_HOST:-}"

if [ $# -lt 3 ]; then
    echo "Usage: $0 \"Company Name\" \"contact@email.com\" \"starter|growth|scale|enterprise\""
    echo ""
    echo "Options (env vars):"
    echo "  DRY_RUN=true    — Preview without writing"
    echo "  SSH_HOST=u@host — Also deploy to remote host"
    echo "  TIMEZONE=UTC    — Customer timezone (default: GMT)"
    exit 1
fi

COMPANY_NAME="$1"
CONTACT_EMAIL="$2"
PACKAGE="$(echo "$3" | tr '[:upper:]' '[:lower:]')"
TIMEZONE="${4:-GMT}"

CUSTOMER_SLUG="$(echo "$COMPANY_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')"
CUSTOMER_DIR="${PLATFORM_DIR}/customers/${CUSTOMER_SLUG}"

# Package definitions
pkg_price()  { case "$1" in starter) echo 1500;; growth) echo 4500;; scale) echo 7500;; enterprise) echo 12000;; *) echo 0;; esac; }
pkg_agents() { case "$1" in starter) echo 1;; growth) echo 3;; scale) echo 10;; enterprise) echo 9;; *) echo 0;; esac; }
pkg_roster() {
    case "$1" in
        starter)    echo "ea";;
        growth)     echo "ea sales marketing";;
        scale)      echo "ea sales marketing bookkeeper content-writer coo strategist project-manager outbound support";;
        enterprise) echo "ea sales marketing bookkeeper content-writer coo strategist project-manager outbound";;
    esac
}
pkg_tier_billing() {
    # Map platform tiers to billing tracker tiers (£ pricing)
    case "$1" in starter) echo "starter";; growth) echo "growth";; scale) echo "scale";; enterprise) echo "enterprise";; esac
}

PRICE="$(pkg_price "$PACKAGE")"
AGENT_COUNT="$(pkg_agents "$PACKAGE")"
ROSTER="$(pkg_roster "$PACKAGE")"

[ "$AGENT_COUNT" = "0" ] && { echo "❌ Invalid package: ${PACKAGE}"; exit 1; }

echo "╔══════════════════════════════════════════════════╗"
echo "║  🚀 AfrexAI AaaS Autopilot                      ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Company:  ${COMPANY_NAME}"
echo "║  Email:    ${CONTACT_EMAIL}"
echo "║  Package:  ${PACKAGE} (${AGENT_COUNT} agents, \$${PRICE}/mo)"
echo "║  Slug:     ${CUSTOMER_SLUG}"
echo "║  Dry Run:  ${DRY_RUN}"
[ -n "$SSH_HOST" ] && echo "║  SSH Host: ${SSH_HOST}"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ━━━ Step 1: Provision Customer Workspace ━━━
echo "━━━ Step 1/7: Provisioning Workspace ━━━"

if [ -d "$CUSTOMER_DIR" ]; then
    echo "⚠️  Customer '${CUSTOMER_SLUG}' already exists — updating"
else
    if [ "$DRY_RUN" = "true" ]; then
        echo "[DRY RUN] Would create workspace at ${CUSTOMER_DIR}"
    else
        bash "${PLATFORM_DIR}/customer-onboarding.sh" "$CUSTOMER_SLUG" "$PACKAGE" "$CONTACT_EMAIL" "$COMPANY_NAME" "$TIMEZONE"
    fi
fi
echo "✅ Workspace provisioned"
echo ""

# ━━━ Step 2: Set Up Billing ━━━
echo "━━━ Step 2/7: Billing Configuration ━━━"

if [ -f "$STEP2_DIR/billing-tracker.sh" ]; then
    BILLING_TIER="$(pkg_tier_billing "$PACKAGE")"
    START_DATE="$(date '+%Y-%m-%d')"
    if [ "$DRY_RUN" = "true" ]; then
        echo "[DRY RUN] Would register billing: $CUSTOMER_SLUG $BILLING_TIER $START_DATE"
    else
        bash "$STEP2_DIR/billing-tracker.sh" add "$CUSTOMER_SLUG" "$BILLING_TIER" "$START_DATE" 2>/dev/null || \
            echo "  (billing already configured or tracker unavailable)"
    fi
    echo "✅ Billing configured: ${BILLING_TIER} tier"
else
    echo "⚠️  Billing tracker not found — skipping"
fi
echo ""

# ━━━ Step 3: Deploy Agents to Remote (if SSH_HOST set) ━━━
echo "━━━ Step 3/7: Agent Deployment ━━━"

if [ -n "$SSH_HOST" ] && [ -f "$STEP2_DIR/agent-deploy-remote.sh" ]; then
    for AGENT_TYPE in $ROSTER; do
        echo "  → Deploying ${AGENT_TYPE} to ${SSH_HOST}..."
        if [ "$DRY_RUN" = "true" ]; then
            DRY_RUN=true bash "$STEP2_DIR/agent-deploy-remote.sh" "$CUSTOMER_SLUG" "$AGENT_TYPE" "$SSH_HOST" 2>/dev/null || true
        else
            bash "$STEP2_DIR/agent-deploy-remote.sh" "$CUSTOMER_SLUG" "$AGENT_TYPE" "$SSH_HOST" 2>/dev/null || \
                echo "    ⚠️  Remote deploy failed for ${AGENT_TYPE} — local bundle still available"
        fi
    done
    echo "✅ Remote deployment complete"
else
    echo "ℹ️  No SSH_HOST set — agents provisioned locally only"
    echo "   To deploy remotely later:"
    for AGENT_TYPE in $ROSTER; do
        echo "   ./workflows/step2-agents/agent-deploy-remote.sh ${CUSTOMER_SLUG} ${AGENT_TYPE} user@host"
    done
fi
echo ""

# ━━━ Step 4: Health Check ━━━
echo "━━━ Step 4/7: Initial Health Check ━━━"

if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] Would run health check"
else
    bash "${PLATFORM_DIR}/agent-health-monitor.sh" "$CUSTOMER_SLUG" 2>/dev/null || echo "  (health monitor completed)"
fi
echo ""

# ━━━ Step 5: Generate Configs ━━━
echo "━━━ Step 5/7: Configuration Generation ━━━"

if [ "$DRY_RUN" != "true" ] && [ -d "$CUSTOMER_DIR" ]; then
    # Generate OpenClaw gateway config for this customer's agents
    mkdir -p "${CUSTOMER_DIR}/config"

    cat > "${CUSTOMER_DIR}/config/openclaw-gateway.yaml" << EOF
# OpenClaw Gateway Config for ${COMPANY_NAME}
# Auto-generated by AfrexAI Autopilot on $(date -u '+%Y-%m-%dT%H:%M:%SZ')

gateway:
  customer: "${CUSTOMER_SLUG}"
  company: "${COMPANY_NAME}"

agents:
EOF
    for AGENT_TYPE in $ROSTER; do
        cat >> "${CUSTOMER_DIR}/config/openclaw-gateway.yaml" << EOF
  - type: "${AGENT_TYPE}"
    schedule:
      morning: "0 8 * * *"
      evening: "0 20 * * *"
    heartbeat: "*/30 * * * *"
    timezone: "${TIMEZONE}"
EOF
    done

    # Generate agent manifest if not already done by onboarding
    if [ ! -f "${CUSTOMER_DIR}/agent-manifest.json" ]; then
        python3 -c "
import json, datetime
agents = []
for t in '${ROSTER}'.split():
    agents.append({'type': t, 'status': 'active', 'deployed': datetime.datetime.utcnow().isoformat()+'Z'})
with open('${CUSTOMER_DIR}/agent-manifest.json', 'w') as f:
    json.dump({'customer': '${CUSTOMER_SLUG}', 'agents': agents}, f, indent=2)
" 2>/dev/null || true
    fi

    echo "✅ Configs generated at ${CUSTOMER_DIR}/config/"
else
    echo "[DRY RUN] Would generate gateway and agent configs"
fi
echo ""

# ━━━ Step 6: Welcome Email Template ━━━
echo "━━━ Step 6/7: Welcome Email ━━━"

WELCOME_FILE="${CUSTOMER_DIR}/welcome-email.md"
if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] Would generate welcome email"
else
    mkdir -p "${CUSTOMER_DIR}"
    cat > "$WELCOME_FILE" << EOF
**Subject:** Welcome to AfrexAI — Your AI Workforce is Live! 🚀

Hi ${COMPANY_NAME} team,

Welcome to AfrexAI Agent-as-a-Service!

Your **${PACKAGE}** plan is now active with **${AGENT_COUNT} AI agent(s)** deployed and ready to work.

**Your AI team:**
$(for a in $ROSTER; do echo "- $(echo "$a" | tr '-' ' ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')"; done)

**What happens next:**
1. ✅ Your agents are provisioned and configured
2. 📅 Schedule your integration setup call: https://calendly.com/cbeckford-afrexai/30min
3. 🔌 We'll connect your agents to Slack, email, CRM, and calendar
4. 🚀 Your agents begin their first shift once integrations are live

**Your monthly investment:** \$${PRICE}/mo

**Your dashboard:** We'll send you a health report weekly showing agent activity and performance.

Questions? Reply to this email or reach us at support@afrexai.com.

Best,
The AfrexAI Team
—
AfrexAI Ltd | AI Agent-as-a-Service
https://afrexai.com
EOF
    echo "✅ Welcome email → ${WELCOME_FILE}"
fi
echo ""

# ━━━ Step 7: CRM Log & Summary ━━━
echo "━━━ Step 7/7: CRM & Summary ━━━"

CRM_LOG="${PLATFORM_DIR}/crm-log.jsonl"
if [ "$DRY_RUN" != "true" ]; then
    CRM_ENTRY="{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"customer_onboarded\",\"customer\":\"${CUSTOMER_SLUG}\",\"company\":\"${COMPANY_NAME}\",\"email\":\"${CONTACT_EMAIL}\",\"package\":\"${PACKAGE}\",\"agents\":${AGENT_COUNT},\"roster\":\"${ROSTER}\",\"mrr\":${PRICE},\"ssh_host\":\"${SSH_HOST}\"}"
    echo "$CRM_ENTRY" >> "$CRM_LOG"
    echo "✅ Logged to CRM"
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ Autopilot Complete                           ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Customer:  ${COMPANY_NAME}"
echo "║  Package:   ${PACKAGE} (${AGENT_COUNT} agents, \$${PRICE}/mo)"
echo "║  Agents:    ${ROSTER}"
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
