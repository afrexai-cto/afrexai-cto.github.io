#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# AfrexAI AaaS Autopilot — End-to-end customer signup automation
# Usage: ./autopilot.sh "Company Name" "contact@email.com" "growth"
# ============================================================================

PLATFORM_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ $# -lt 3 ]; then
  echo "Usage: $0 \"Company Name\" \"contact@email.com\" \"starter|growth|enterprise\""
  exit 1
fi

COMPANY_NAME="$1"
CONTACT_EMAIL="$2"
PACKAGE="$(echo "$3" | tr '[:upper:]' '[:lower:]')"
TIMEZONE="${4:-GMT}"

# Generate slug from company name
CUSTOMER_SLUG="$(echo "$COMPANY_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')"

echo "╔══════════════════════════════════════════════════╗"
echo "║  🚀 AfrexAI AaaS Autopilot                      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Company:  ${COMPANY_NAME}"
echo "Email:    ${CONTACT_EMAIL}"
echo "Package:  ${PACKAGE}"
echo "Slug:     ${CUSTOMER_SLUG}"
echo ""

# --- Step 1: Onboard ---
echo "━━━ Step 1/5: Onboarding ━━━"
bash "${PLATFORM_DIR}/customer-onboarding.sh" "$CUSTOMER_SLUG" "$PACKAGE" "$CONTACT_EMAIL" "$COMPANY_NAME" "$TIMEZONE"
echo ""

# --- Step 2: Health check ---
echo "━━━ Step 2/5: Initial Health Check ━━━"
bash "${PLATFORM_DIR}/agent-health-monitor.sh" "$CUSTOMER_SLUG"
echo ""

# --- Step 3: Generate welcome email template ---
echo "━━━ Step 3/5: Welcome Email Template ━━━"
CUSTOMER_DIR="${PLATFORM_DIR}/customers/${CUSTOMER_SLUG}"

pkg_price() {
  case "$1" in starter) echo 1500;; growth) echo 4500;; enterprise) echo 12000;; esac
}
pkg_agents() {
  case "$1" in starter) echo 1;; growth) echo 3;; enterprise) echo 9;; esac
}

cat > "${CUSTOMER_DIR}/welcome-email.md" << EOF
**Subject:** Welcome to AfrexAI — Your AI Workforce is Live! 🚀

Hi ${COMPANY_NAME} team,

Welcome to AfrexAI Agent-as-a-Service!

Your ${PACKAGE} plan is now active with $(pkg_agents "$PACKAGE") AI agent(s) deployed and ready.

**What's next:**
1. Review your Welcome doc (attached)
2. Schedule your integration setup call: https://calendly.com/cbeckford-afrexai/30min
3. Your agents will begin their first shift once integrations are configured

**Your monthly investment:** \$$(pkg_price "$PACKAGE")/mo

Questions? Reply to this email or reach us at support@afrexai.com.

— The AfrexAI Team
EOF
echo "✅ Welcome email template → ${CUSTOMER_DIR}/welcome-email.md"
echo ""

# --- Step 4: Log to CRM ---
echo "━━━ Step 4/5: CRM Log ━━━"
CRM_LOG="${PLATFORM_DIR}/crm-log.jsonl"
CRM_ENTRY="{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"customer_onboarded\",\"customer\":\"${CUSTOMER_SLUG}\",\"company\":\"${COMPANY_NAME}\",\"email\":\"${CONTACT_EMAIL}\",\"package\":\"${PACKAGE}\",\"agents\":$(pkg_agents "$PACKAGE"),\"mrr\":$(pkg_price "$PACKAGE")}"
echo "$CRM_ENTRY" >> "$CRM_LOG"
echo "✅ Logged to CRM → ${CRM_LOG}"
echo ""

# --- Step 5: Summary ---
echo "━━━ Step 5/5: Complete ━━━"
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ Autopilot Complete                           ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Customer: ${COMPANY_NAME}"
echo "║  Package:  ${PACKAGE} ($(pkg_agents "$PACKAGE") agents, \$$(pkg_price "$PACKAGE")/mo)"
echo "║  Path:     ${CUSTOMER_DIR}"
echo "║  Email:    ${CUSTOMER_DIR}/welcome-email.md"
echo "║  CRM:      ${CRM_LOG}"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Manual steps remaining:                        ║"
echo "║  □ Send welcome email to ${CONTACT_EMAIL}"
echo "║  □ Schedule integration setup call              ║"
echo "║  □ Configure cron schedules in OpenClaw         ║"
echo "╚══════════════════════════════════════════════════╝"
