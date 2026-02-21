#!/usr/bin/env bash
set -euo pipefail
# usage-tracker.sh — Simulate and log agent activity for a tenant
# Usage: ./usage-tracker.sh <tenant_id> [date_override YYYY-MM-DD]
# Generates realistic usage data and appends to usage log.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TENANTS_DIR="${SCRIPT_DIR}/tenants"

[[ $# -lt 1 ]] && echo "Usage: $0 <tenant_id> [date]" && exit 1

TENANT_ID="$1"
SIM_DATE="${2:-$(date -u +%Y-%m-%d)}"
TENANT_DIR="${TENANTS_DIR}/${TENANT_ID}"

[[ ! -d "$TENANT_DIR" ]] && echo "Error: Tenant '$TENANT_ID' not found" >&2 && exit 1

TENANT_CONFIG="$TENANT_DIR/config/tenant.json"
TIER="$(jq -r '.tier' "$TENANT_CONFIG")"
VERTICAL="$(jq -r '.vertical' "$TENANT_CONFIG")"
AGENT_COUNT="$(jq -r '.agent_count' "$TENANT_CONFIG")"

# Usage multipliers by tier
case "$TIER" in
  starter)    BASE_TASKS=8  BASE_TOKENS=12000 BASE_EMAILS=3  BASE_DOCS=2 ;;
  growth)     BASE_TASKS=15 BASE_TOKENS=25000 BASE_EMAILS=8  BASE_DOCS=5 ;;
  enterprise) BASE_TASKS=30 BASE_TOKENS=45000 BASE_EMAILS=15 BASE_DOCS=10 ;;
  *) BASE_TASKS=10 BASE_TOKENS=15000 BASE_EMAILS=5 BASE_DOCS=3 ;;
esac

# Deterministic-ish random using date+tenant as seed
rand_variance() {
  local base="$1" variance="$2"
  python3 -c "
import hashlib, struct
seed = hashlib.md5('${TENANT_ID}${SIM_DATE}${3:-x}'.encode()).digest()
r = struct.unpack('I', seed[:4])[0] % (2 * $variance + 1) - $variance
print(max(0, $base + r))
"
}

# Day of week check (skip weekends for lighter usage)
DOW="$(python3 -c "import datetime; print(datetime.date.fromisoformat('${SIM_DATE}').weekday())")"
if [[ "$DOW" -ge 5 ]]; then
  # Weekend: 20% of normal
  BASE_TASKS=$((BASE_TASKS / 5))
  BASE_TOKENS=$((BASE_TOKENS / 5))
  BASE_EMAILS=$((BASE_EMAILS / 5))
  BASE_DOCS=$((BASE_DOCS / 5))
fi

TASKS="$(rand_variance "$BASE_TASKS" 5 tasks)"
TOKENS="$(rand_variance "$BASE_TOKENS" 5000 tokens)"
EMAILS="$(rand_variance "$BASE_EMAILS" 3 emails)"
DOCS="$(rand_variance "$BASE_DOCS" 2 docs)"
API_CALLS="$(rand_variance $((TASKS * 3)) 10 api)"

# Build daily entry
ENTRY="$(cat <<EOF
{
  "date": "${SIM_DATE}",
  "tasks_completed": ${TASKS},
  "tokens_used": ${TOKENS},
  "emails_sent": ${EMAILS},
  "documents_processed": ${DOCS},
  "api_calls": ${API_CALLS}
}
EOF
)"

# Append to log
LOG_FILE="$TENANT_DIR/usage/log.json"
jq --argjson entry "$ENTRY" '. + [$entry]' "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"

# Update current month summary
MONTH="$(echo "$SIM_DATE" | cut -c1-7)"
CURRENT="$TENANT_DIR/usage/current.json"
jq --arg m "$MONTH" --arg t "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --argjson tasks "$TASKS" --argjson tokens "$TOKENS" \
  --argjson emails "$EMAILS" --argjson docs "$DOCS" --argjson api "$API_CALLS" \
  '.period = $m | .tasks_completed += $tasks | .tokens_used += $tokens |
   .emails_sent += $emails | .documents_processed += $docs |
   .api_calls += $api | .last_updated = $t' "$CURRENT" > "${CURRENT}.tmp" && mv "${CURRENT}.tmp" "$CURRENT"

echo "📊 Usage logged for ${TENANT_ID} on ${SIM_DATE}: ${TASKS} tasks, ${TOKENS} tokens, ${EMAILS} emails, ${DOCS} docs"
