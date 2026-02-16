#!/usr/bin/env bash
# generate-agents.sh — Deploy vertical-aware agents from templates
# STUB: Template builder will flesh out template copying logic.
# For now, creates agent entries in profile.json from roster.json + pricing.json.
#
# Usage: ./generate-agents.sh <customer-slug> <vertical> <tier>
set -euo pipefail

PLATFORM_DIR="$(cd "$(dirname "$0")" && pwd)"
PRICING_FILE="${PLATFORM_DIR}/pricing.json"
ROSTER_FILE="${PLATFORM_DIR}/templates/roster.json"
CUSTOMERS_DIR="${PLATFORM_DIR}/customers"

if [ $# -lt 3 ]; then
    echo "Usage: $0 <customer-slug> <vertical> <tier>"
    exit 1
fi

CUSTOMER_SLUG="$1"
VERTICAL="$2"
TIER="$3"
CUSTOMER_DIR="${CUSTOMERS_DIR}/${CUSTOMER_SLUG}"

[ -f "$PRICING_FILE" ] || { echo "❌ pricing.json not found at ${PRICING_FILE}"; exit 1; }
[ -f "$ROSTER_FILE" ]  || { echo "❌ roster.json not found at ${ROSTER_FILE}"; exit 1; }
[ -f "${CUSTOMER_DIR}/profile.json" ] || { echo "❌ profile.json not found — run autopilot.sh first"; exit 1; }

# Read agent count for tier from pricing.json
AGENT_COUNT="$(python3 -c "
import json
p = json.load(open('${PRICING_FILE}'))
print(p['tiers']['${TIER}']['agents'])
")"

# Read roster for vertical from roster.json, take first N
AGENT_LIST="$(python3 -c "
import json
r = json.load(open('${ROSTER_FILE}'))
agents = r.get('${VERTICAL}', r.get('general', []))
for a in agents[:${AGENT_COUNT}]:
    print(a)
")"

DEPLOY_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "  Deploying ${AGENT_COUNT} agent(s) for ${VERTICAL}/${TIER}..."

# Build agents JSON array and create stub directories
AGENTS_JSON="["
FIRST=true
for AGENT_ID in $AGENT_LIST; do
    AGENT_NAME="$(echo "$AGENT_ID" | tr '-' ' ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')"
    TEMPLATE_PATH="${VERTICAL}/${AGENT_ID}"
    AGENT_DIR="${CUSTOMER_DIR}/agents/${AGENT_ID}"

    mkdir -p "$AGENT_DIR"

    # If template exists, copy it; otherwise create placeholder
    TEMPLATE_DIR="${PLATFORM_DIR}/templates/${TEMPLATE_PATH}"
    if [ -d "$TEMPLATE_DIR" ]; then
        for f in "$TEMPLATE_DIR"/*.md; do
            [ -f "$f" ] || continue
            sed -e "s/{{COMPANY_NAME}}/${COMPANY_NAME:-$CUSTOMER_SLUG}/g" \
                -e "s/{{AGENT_NAME}}/${AGENT_NAME}/g" \
                -e "s/{{VERTICAL}}/${VERTICAL}/g" \
                -e "s/{{TIER}}/${TIER}/g" \
                -e "s/{{CUSTOMER_SLUG}}/${CUSTOMER_SLUG}/g" \
                "$f" > "${AGENT_DIR}/$(basename "$f")"
        done
        echo "    ✓ ${AGENT_ID} (from template)"
    else
        cat > "${AGENT_DIR}/SOUL.md" <<EOF
# ${AGENT_NAME}

AI agent for ${CUSTOMER_SLUG} (${VERTICAL} vertical, ${TIER} tier).

Template: ${TEMPLATE_PATH}
Status: Awaiting template build
EOF
        echo "    ✓ ${AGENT_ID} (stub — template pending)"
    fi

    if [ "$FIRST" = true ]; then FIRST=false; else AGENTS_JSON="${AGENTS_JSON},"; fi
    AGENTS_JSON="${AGENTS_JSON}{\"id\":\"${AGENT_ID}\",\"name\":\"${AGENT_NAME}\",\"template\":\"${TEMPLATE_PATH}\",\"status\":\"active\",\"deployed_at\":\"${DEPLOY_TS}\"}"
done
AGENTS_JSON="${AGENTS_JSON}]"

# Update profile.json agents array
python3 -c "
import json
with open('${CUSTOMER_DIR}/profile.json', 'r') as f:
    profile = json.load(f)
profile['agents'] = json.loads('${AGENTS_JSON}')
with open('${CUSTOMER_DIR}/profile.json', 'w') as f:
    json.dump(profile, f, indent=2)
"

# Generate agent-manifest.json
python3 -c "
import json
agents = json.loads('${AGENTS_JSON}')
manifest = {'customer': '${CUSTOMER_SLUG}', 'vertical': '${VERTICAL}', 'tier': '${TIER}', 'agents': agents}
with open('${CUSTOMER_DIR}/agent-manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2)
"

echo "  ✅ ${AGENT_COUNT} agent(s) deployed"
