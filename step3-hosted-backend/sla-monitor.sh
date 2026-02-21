#!/usr/bin/env bash
set -euo pipefail
# sla-monitor.sh — Check agent health, uptime %, SLA breaches
# Usage: ./sla-monitor.sh <tenant_id>

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TENANTS_DIR="${SCRIPT_DIR}/tenants"

[[ $# -lt 1 ]] && echo "Usage: $0 <tenant_id>" && exit 1

TENANT_ID="$1"
TENANT_DIR="${TENANTS_DIR}/${TENANT_ID}"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

[[ ! -d "$TENANT_DIR" ]] && echo "Error: Tenant '$TENANT_ID' not found" >&2 && exit 1

TENANT_CONFIG="$TENANT_DIR/config/tenant.json"
TIER="$(jq -r '.tier' "$TENANT_CONFIG")"

# SLA targets by tier
case "$TIER" in
  starter)    SLA_TARGET=99.0 ;;
  growth)     SLA_TARGET=99.5 ;;
  enterprise) SLA_TARGET=99.9 ;;
  *) SLA_TARGET=99.0 ;;
esac

# Check each agent
AGENTS_JSON="[]"
TOTAL=0
HEALTHY=0

for agent_dir in "$TENANT_DIR"/agents/agent-*; do
  [[ ! -d "$agent_dir" ]] && continue
  config="$agent_dir/config.json"
  [[ ! -f "$config" ]] && continue

  TOTAL=$((TOTAL + 1))
  STATUS="$(jq -r '.status' "$config")"
  ROLE="$(jq -r '.role' "$config")"
  AID="$(jq -r '.agent_id' "$config")"

  # Agent is healthy if running or ready
  IS_HEALTHY="false"
  if [[ "$STATUS" == "running" || "$STATUS" == "ready" ]]; then
    IS_HEALTHY="true"
    HEALTHY=$((HEALTHY + 1))
  fi

  AGENTS_JSON="$(echo "$AGENTS_JSON" | jq --arg aid "$AID" --arg role "$ROLE" \
    --arg status "$STATUS" --argjson healthy "$IS_HEALTHY" \
    '. + [{"agent_id": $aid, "role": $role, "status": $status, "healthy": $healthy}]')"
done

# Calculate uptime
if [[ "$TOTAL" -gt 0 ]]; then
  UPTIME="$(python3 -c "print(round(${HEALTHY} / ${TOTAL} * 100, 2))")"
else
  UPTIME="0.0"
fi

# Check SLA breach
SLA_MET="$(python3 -c "print('true' if ${UPTIME} >= ${SLA_TARGET} else 'false')")"

# Recent usage activity as health signal
LOG_FILE="$TENANT_DIR/usage/log.json"
RECENT_DAYS="$(jq '[.[-7:][].tasks_completed] | add // 0' "$LOG_FILE" 2>/dev/null || echo 0)"

cat <<EOF
{
  "sla_report": {
    "tenant_id": "${TENANT_ID}",
    "tier": "${TIER}",
    "timestamp": "${NOW}",
    "agents_total": ${TOTAL},
    "agents_healthy": ${HEALTHY},
    "uptime_pct": ${UPTIME},
    "sla_target_pct": ${SLA_TARGET},
    "sla_met": ${SLA_MET},
    "recent_7d_tasks": ${RECENT_DAYS},
    "agents": $(echo "$AGENTS_JSON" | jq .),
    "alerts": $(python3 -c "
import json
sla_met = '${SLA_MET}' == 'true'
alerts = []
if not sla_met:
    alerts.append({'level': 'critical', 'message': 'SLA breach: uptime ${UPTIME}% < target ${SLA_TARGET}%'})
if ${HEALTHY} < ${TOTAL}:
    alerts.append({'level': 'warning', 'message': str(${TOTAL} - ${HEALTHY}) + ' agents unhealthy'})
if ${RECENT_DAYS} == 0:
    alerts.append({'level': 'info', 'message': 'No task activity in last 7 days'})
print(json.dumps(alerts))
")
  }
}
EOF
