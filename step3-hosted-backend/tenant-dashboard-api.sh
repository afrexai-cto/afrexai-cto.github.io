#!/usr/bin/env bash
set -euo pipefail
# tenant-dashboard-api.sh — JSON API responses for tenant portal
# Usage: ./tenant-dashboard-api.sh <tenant_id> <agents|usage|billing|sla|overview>

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TENANTS_DIR="${SCRIPT_DIR}/tenants"

[[ $# -lt 2 ]] && echo "Usage: $0 <tenant_id> <agents|usage|billing|sla|overview>" && exit 1

TENANT_ID="$1"
ENDPOINT="$2"
TENANT_DIR="${TENANTS_DIR}/${TENANT_ID}"

[[ ! -d "$TENANT_DIR" ]] && echo '{"error":"tenant_not_found"}' && exit 1

case "$ENDPOINT" in
  agents)
    # List all agents with status
    AGENTS="[]"
    for agent_dir in "$TENANT_DIR"/agents/agent-*; do
      [[ -f "$agent_dir/config.json" ]] || continue
      AGENTS="$(echo "$AGENTS" | jq --slurpfile a "$agent_dir/config.json" '. + $a')"
    done
    echo "$AGENTS" | jq '{"agents": ., "count": length}'
    ;;

  usage)
    # Current usage + recent log
    CURRENT="$(cat "$TENANT_DIR/usage/current.json")"
    RECENT="$(jq '.[-30:]' "$TENANT_DIR/usage/log.json")"
    jq -n --argjson c "$CURRENT" --argjson r "$RECENT" \
      '{"current_period": $c, "recent_daily": $r}'
    ;;

  billing)
    # Run billing calculator
    bash "$SCRIPT_DIR/billing-calculator.sh" "$TENANT_ID"
    ;;

  sla)
    # Run SLA monitor
    bash "$SCRIPT_DIR/sla-monitor.sh" "$TENANT_ID"
    ;;

  overview)
    # Combined dashboard overview
    TENANT_CONFIG="$(cat "$TENANT_DIR/config/tenant.json")"
    USAGE="$(cat "$TENANT_DIR/usage/current.json")"
    AGENT_COUNT=0
    RUNNING=0
    for agent_dir in "$TENANT_DIR"/agents/agent-*; do
      [[ -f "$agent_dir/config.json" ]] || continue
      AGENT_COUNT=$((AGENT_COUNT + 1))
      S="$(jq -r '.status' "$agent_dir/config.json")"
      [[ "$S" == "running" || "$S" == "ready" ]] && RUNNING=$((RUNNING + 1))
    done
    jq -n \
      --argjson config "$TENANT_CONFIG" \
      --argjson usage "$USAGE" \
      --argjson agents "$AGENT_COUNT" \
      --argjson running "$RUNNING" \
      '{
        "tenant": ($config | {tenant_id, company, tier, vertical, status, created}),
        "agents": {"total": $agents, "active": $running},
        "usage_this_period": ($usage | {tasks_completed, tokens_used, emails_sent, documents_processed}),
        "health": (if $running == $agents then "healthy" elif $running > 0 then "degraded" else "down" end)
      }'
    ;;

  *)
    echo '{"error":"invalid_endpoint","valid":["agents","usage","billing","sla","overview"]}'
    exit 1
    ;;
esac
