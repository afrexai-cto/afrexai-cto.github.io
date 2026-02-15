#!/usr/bin/env bash
set -euo pipefail

PLATFORM_DIR="$(cd "$(dirname "$0")" && pwd)"
CUSTOMERS_DIR="${PLATFORM_DIR}/customers"
DEPLOYER="${PLATFORM_DIR}/agent-deployer.sh"

pkg_agents() { case "$1" in starter) echo 1;; growth) echo 3;; enterprise) echo 9;; *) echo 0;; esac; }
pkg_price() { case "$1" in starter) echo 1500;; growth) echo 4500;; enterprise) echo 12000;; *) echo 0;; esac; }
pkg_roster() {
  case "$1" in
    starter) echo "ea";;
    growth) echo "ea sales marketing";;
    enterprise) echo "ea sales marketing bookkeeper content-writer coo strategist project-manager outbound";;
  esac
}

if [ $# -lt 3 ]; then
  echo "Usage: $0 <customer_slug> <package> <contact_email> [company_name] [timezone]"
  echo "Packages: starter ($1,500/mo) | growth ($4,500/mo) | enterprise ($12,000/mo)"
  exit 1
fi

CUSTOMER_SLUG="$1"; PACKAGE="$(echo "$2" | tr '[:upper:]' '[:lower:]')"; CONTACT_EMAIL="$3"
COMPANY_NAME="${4:-$CUSTOMER_SLUG}"; TIMEZONE="${5:-GMT}"
AGENT_COUNT="$(pkg_agents "$PACKAGE")"; PRICE="$(pkg_price "$PACKAGE")"; ROSTER="$(pkg_roster "$PACKAGE")"

if [ "$AGENT_COUNT" = "0" ]; then echo "❌ Invalid package: ${PACKAGE}"; exit 1; fi

CUSTOMER_DIR="${CUSTOMERS_DIR}/${CUSTOMER_SLUG}"
if [ -d "$CUSTOMER_DIR" ]; then echo "❌ Customer '${CUSTOMER_SLUG}' already exists"; exit 1; fi

echo "🚀 Onboarding: ${COMPANY_NAME} (${PACKAGE}, ${AGENT_COUNT} agents, \$${PRICE}/mo)"
mkdir -p "${CUSTOMER_DIR}/agents" "${CUSTOMER_DIR}/reports" "${CUSTOMER_DIR}/config"

cat > "${CUSTOMER_DIR}/billing.json" << EOF
{"customer":"${CUSTOMER_SLUG}","company":"${COMPANY_NAME}","contact_email":"${CONTACT_EMAIL}","package":"${PACKAGE}","agent_limit":${AGENT_COUNT},"monthly_price_usd":${PRICE},"start_date":"$(date -u +%Y-%m-%d)","status":"active"}
EOF

cat > "${CUSTOMER_DIR}/integrations.json" << EOF
{"customer":"${CUSTOMER_SLUG}","email":{"enabled":false},"slack":{"enabled":false},"crm":{"enabled":false}}
EOF

cat > "${CUSTOMER_DIR}/profile.json" << EOF
{"slug":"${CUSTOMER_SLUG}","company":"${COMPANY_NAME}","contact_email":"${CONTACT_EMAIL}","timezone":"${TIMEZONE}","package":"${PACKAGE}","onboarded_at":"$(date -u +%Y-%m-%dT%H:%M:%SZ)","status":"active"}
EOF

for AGENT_TYPE in $ROSTER; do
  echo "  → Deploying ${AGENT_TYPE}..."
  bash "$DEPLOYER" "$CUSTOMER_SLUG" "$AGENT_TYPE" "" "$TIMEZONE"
done

cat > "${CUSTOMER_DIR}/WELCOME.md" << EOF
# 🎉 Welcome to AfrexAI Agent-as-a-Service
**Company:** ${COMPANY_NAME} | **Package:** ${PACKAGE} (${AGENT_COUNT} agents, \$${PRICE}/mo) | **Start:** $(date -u +%Y-%m-%d)
EOF

echo "✅ ${COMPANY_NAME} onboarded: ${AGENT_COUNT} agents deployed at ${CUSTOMER_DIR}"
