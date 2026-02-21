#!/usr/bin/env bash
set -euo pipefail
# provision-tenant.sh — Provision a new AfrexAI hosted agent tenant
# Usage: ./provision-tenant.sh <company_name> <email> <tier> <vertical>
# Tiers: starter (3 agents), growth (5 agents), enterprise (9 agents)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TENANTS_DIR="${SCRIPT_DIR}/tenants"

usage() {
  echo "Usage: $0 <company_name> <email> <starter|growth|enterprise> <vertical>"
  echo "Verticals: legal, finance, healthcare, construction, saas, professional-services, general"
  exit 1
}

[[ $# -lt 4 ]] && usage

COMPANY="$1"
EMAIL="$2"
TIER="$3"
VERTICAL="$4"

# Validate tier
case "$TIER" in
  starter)   AGENT_COUNT=3 ;;
  growth)    AGENT_COUNT=5 ;;
  enterprise) AGENT_COUNT=9 ;;
  *) echo "Error: Invalid tier '$TIER'. Use starter/growth/enterprise." >&2; exit 1 ;;
esac

# Generate tenant ID from company name (lowercase, hyphens)
TENANT_ID="$(echo "$COMPANY" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')"
TENANT_DIR="${TENANTS_DIR}/${TENANT_ID}"

if [[ -d "$TENANT_DIR" ]]; then
  echo "Error: Tenant '$TENANT_ID' already exists at $TENANT_DIR" >&2
  exit 1
fi

# Generate UUIDs for API keys (portable)
gen_uuid() {
  python3 -c "import uuid; print(str(uuid.uuid4()))"
}

API_KEY="$(gen_uuid)"
API_SECRET="$(gen_uuid)"
CREATED="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Create tenant directory structure
mkdir -p "$TENANT_DIR"/{agents,logs,usage,billing,config}

# --- Tenant config ---
cat > "$TENANT_DIR/config/tenant.json" <<EOF
{
  "tenant_id": "${TENANT_ID}",
  "company": "${COMPANY}",
  "email": "${EMAIL}",
  "tier": "${TIER}",
  "vertical": "${VERTICAL}",
  "agent_count": ${AGENT_COUNT},
  "created": "${CREATED}",
  "status": "active",
  "api_key": "${API_KEY}",
  "api_secret": "${API_SECRET}"
}
EOF

# --- Agent role definitions per vertical ---
get_agent_roles() {
  local vertical="$1" count="$2"
  case "$vertical" in
    legal)
      echo "Legal Research Assistant|Contract Review Agent|Client Intake Coordinator|Document Drafter|Compliance Monitor|Case Manager|Billing Tracker|Discovery Assistant|Calendar Coordinator"
      ;;
    finance|financial-services)
      echo "Financial Analyst|Report Generator|Client Onboarding|Compliance Checker|Portfolio Monitor|Risk Assessor|Invoice Processor|Audit Assistant|Regulatory Tracker"
      ;;
    healthcare)
      echo "Patient Intake Coordinator|Appointment Scheduler|Medical Records Assistant|Insurance Verifier|Referral Coordinator|Billing Coder|Compliance Monitor|Patient Follow-up Agent|Report Generator"
      ;;
    *)
      echo "Executive Assistant|Research Analyst|Client Coordinator|Report Generator|Data Processor|Compliance Monitor|Scheduling Agent|Communication Handler|Project Tracker"
      ;;
  esac
}

ROLES_STR="$(get_agent_roles "$VERTICAL" "$AGENT_COUNT")"

# Create each agent
for i in $(seq 1 "$AGENT_COUNT"); do
  ROLE="$(echo "$ROLES_STR" | cut -d'|' -f"$i")"
  AGENT_ID="agent-$(printf '%02d' "$i")"
  AGENT_DIR="$TENANT_DIR/agents/${AGENT_ID}"
  mkdir -p "$AGENT_DIR"

  # Agent config
  cat > "$AGENT_DIR/config.json" <<EOF
{
  "agent_id": "${AGENT_ID}",
  "tenant_id": "${TENANT_ID}",
  "role": "${ROLE}",
  "status": "ready",
  "created": "${CREATED}",
  "schedule": "weekdays 09:00-18:00",
  "model": "claude-sonnet-4-20250514",
  "max_tokens_daily": 50000
}
EOF

  # SOUL.md for each agent
  cat > "$AGENT_DIR/SOUL.md" <<EOF
# ${ROLE}

You are the ${ROLE} for ${COMPANY}.

## Your Role
You handle $(echo "${ROLE}" | tr '[:upper:]' '[:lower:]') tasks for the ${VERTICAL} practice at ${COMPANY}.

## Guidelines
- Always maintain professional tone appropriate for ${VERTICAL}
- Follow ${COMPANY}'s processes and compliance requirements
- Escalate anything outside your scope to a human supervisor
- Log all significant actions for audit trail
- Respect data privacy and confidentiality at all times

## Tier: ${TIER}
EOF

  # OpenClaw gateway config template
  cat > "$AGENT_DIR/gateway.yaml" <<EOF
# OpenClaw Gateway Config — ${TENANT_ID}/${AGENT_ID}
agent:
  name: "${AGENT_ID}"
  label: "${ROLE}"
  tenant: "${TENANT_ID}"

model:
  provider: anthropic
  model: claude-sonnet-4-20250514
  max_tokens: 4096

schedule:
  active_hours: "09:00-18:00"
  timezone: "Europe/London"
  days: ["mon","tue","wed","thu","fri"]

channels: []

soul_path: "./SOUL.md"
EOF
done

# --- Usage tracking file ---
cat > "$TENANT_DIR/usage/current.json" <<EOF
{
  "tenant_id": "${TENANT_ID}",
  "period": "$(date -u +%Y-%m)",
  "tasks_completed": 0,
  "tokens_used": 0,
  "emails_sent": 0,
  "documents_processed": 0,
  "api_calls": 0,
  "last_updated": "${CREATED}"
}
EOF

# --- Initial usage log ---
echo '[]' > "$TENANT_DIR/usage/log.json"

echo "✅ Tenant provisioned: ${TENANT_ID}"
echo "   Directory: ${TENANT_DIR}"
echo "   Tier: ${TIER} (${AGENT_COUNT} agents)"
echo "   Vertical: ${VERTICAL}"
echo "   API Key: ${API_KEY}"
