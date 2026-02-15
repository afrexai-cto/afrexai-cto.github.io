#!/usr/bin/env bash
set -euo pipefail

PLATFORM_DIR="$(cd "$(dirname "$0")" && pwd)"
CUSTOMERS_DIR="${PLATFORM_DIR}/customers"

agent_emoji() {
  case "$1" in
    ea) echo "📋";; sales) echo "💰";; marketing) echo "📣";; bookkeeper) echo "📒";;
    consultant) echo "🧠";; content-writer) echo "✍️";; coo) echo "🏢";; strategist) echo "🎯";;
    project-manager) echo "📊";; outbound) echo "📞";; support) echo "🛟";; analyst) echo "📈";;
    *) echo "🤖";;
  esac
}
agent_title() {
  case "$1" in
    ea) echo "Executive Assistant";; sales) echo "Sales Representative";; marketing) echo "Marketing Analyst";;
    bookkeeper) echo "Bookkeeper";; consultant) echo "Business Consultant";; content-writer) echo "Content Writer";;
    coo) echo "Chief of Staff";; strategist) echo "Strategist";; project-manager) echo "Project Manager";;
    outbound) echo "Outbound Sales";; support) echo "Customer Support";; analyst) echo "Data Analyst";;
    *) echo "";;
  esac
}
agent_names() {
  case "$1" in
    ea) echo "Aria Nova Sage";; sales) echo "Hunter Chase Blake";; marketing) echo "Mika Zara Quinn";;
    bookkeeper) echo "Finn Sage Reed";; consultant) echo "Atlas Orion Sage";; content-writer) echo "Lyra Noa Wren";;
    coo) echo "Reese Morgan Taylor";; strategist) echo "Kai Raven Slate";; project-manager) echo "Jordan Alex Riley";;
    outbound) echo "Blaze Echo Storm";; support) echo "Haven Cleo Sol";; analyst) echo "Neo Jax Pixel";;
    *) echo "Agent";;
  esac
}

if [ $# -lt 2 ]; then
  echo "Usage: $0 <customer_name> <agent_type> [agent_name] [schedule_tz]"
  exit 1
fi

CUSTOMER="$1"; AGENT_TYPE="$(echo "$2" | tr '[:upper:]' '[:lower:]')"
AGENT_NAME="${3:-}"; SCHEDULE_TZ="${4:-GMT}"
CUSTOMER_DIR="${CUSTOMERS_DIR}/${CUSTOMER}"

if [ ! -d "$CUSTOMER_DIR" ]; then echo "❌ Customer '${CUSTOMER}' not found."; exit 1; fi

TITLE="$(agent_title "$AGENT_TYPE")"; EMOJI="$(agent_emoji "$AGENT_TYPE")"
if [ -z "$TITLE" ]; then echo "❌ Unknown agent type: ${AGENT_TYPE}"; exit 1; fi

if [ -z "$AGENT_NAME" ]; then
  NAMES_STR="$(agent_names "$AGENT_TYPE")"
  set -- $NAMES_STR
  EXISTING=$(find "${CUSTOMER_DIR}/agents" -maxdepth 1 -name "${AGENT_TYPE}-*" 2>/dev/null | wc -l | tr -d ' ')
  IDX=$(( (EXISTING % $#) + 1 ))
  eval "AGENT_NAME=\${$IDX}"
fi

AGENT_SLUG="${AGENT_TYPE}-$(echo "$AGENT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')"
AGENT_DIR="${CUSTOMER_DIR}/agents/${AGENT_SLUG}"

if [ -d "$AGENT_DIR" ]; then echo "❌ Agent exists: ${AGENT_DIR}"; exit 1; fi

mkdir -p "${AGENT_DIR}/input" "${AGENT_DIR}/output" "${AGENT_DIR}/archive" "${AGENT_DIR}/memory"

cat > "${AGENT_DIR}/SOUL.md" << EOF
# ${EMOJI} SOUL — ${AGENT_NAME}, ${TITLE}
- **Name:** ${AGENT_NAME} | **Role:** ${TITLE} for ${CUSTOMER} | **Platform:** AfrexAI AaaS
EOF

cat > "${AGENT_DIR}/IDENTITY.md" << EOF
# ${EMOJI} ${AGENT_NAME} | ${TITLE} | ${CUSTOMER} | Deployed $(date -u +%Y-%m-%d)
EOF

cat > "${AGENT_DIR}/CONFIG.md" << EOF
# CONFIG — Schedule: 8AM/8PM ${SCHEDULE_TZ}
EOF

cat > "${AGENT_DIR}/MEMORY.md" << EOF
# ${EMOJI} MEMORY — ${AGENT_NAME}
*Deployed $(date -u +%Y-%m-%d). No memories yet.*
EOF

cat > "${AGENT_DIR}/HANDOFF.md" << EOF
# ${EMOJI} HANDOFF — ${AGENT_NAME}
Packets in input/ processed FIFO.
EOF

cat > "${AGENT_DIR}/PROMPT-8AM.md" << EOF
# ${EMOJI} Morning Shift — ${AGENT_NAME}
Read SOUL.md → MEMORY.md → CONFIG.md → Process input/ → Execute → output/ → Update MEMORY.md
EOF

cat > "${AGENT_DIR}/PROMPT-8PM.md" << EOF
# ${EMOJI} Evening Shift — ${AGENT_NAME}
Review day → Flag unresolved → Prep tomorrow → Update MEMORY.md
EOF

# Record in manifest
MANIFEST="${CUSTOMER_DIR}/agent-manifest.json"
DEPLOY_JSON="{\"slug\":\"${AGENT_SLUG}\",\"name\":\"${AGENT_NAME}\",\"type\":\"${AGENT_TYPE}\",\"title\":\"${TITLE}\",\"deployed\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"status\":\"active\"}"

if [ -f "$MANIFEST" ]; then
  python3 -c "
import json
with open('${MANIFEST}') as f: data=json.load(f)
data['agents'].append(json.loads('''${DEPLOY_JSON}'''))
with open('${MANIFEST}','w') as f: json.dump(data,f,indent=2)
"
else
  python3 -c "
import json
with open('${MANIFEST}','w') as f: json.dump({'agents':[json.loads('''${DEPLOY_JSON}''')]},f,indent=2)
"
fi

echo "✅ Deployed ${EMOJI} ${AGENT_NAME} (${TITLE}) for ${CUSTOMER} → ${AGENT_DIR}"
