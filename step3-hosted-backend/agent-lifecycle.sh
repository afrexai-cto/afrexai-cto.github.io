#!/usr/bin/env bash
set -euo pipefail
# agent-lifecycle.sh — Start/stop/restart/pause agents for a tenant
# Usage: ./agent-lifecycle.sh <tenant_id> <start|stop|restart|pause> [agent_id]
# If agent_id omitted, applies to all agents in tenant.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TENANTS_DIR="${SCRIPT_DIR}/tenants"

usage() {
  echo "Usage: $0 <tenant_id> <start|stop|restart|pause> [agent_id]"
  exit 1
}

[[ $# -lt 2 ]] && usage

TENANT_ID="$1"
ACTION="$2"
AGENT_ID="${3:-all}"
TENANT_DIR="${TENANTS_DIR}/${TENANT_ID}"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

[[ ! -d "$TENANT_DIR" ]] && echo "Error: Tenant '$TENANT_ID' not found" >&2 && exit 1

case "$ACTION" in
  start|stop|restart|pause) ;;
  *) echo "Error: Invalid action '$ACTION'" >&2; exit 1 ;;
esac

# Map action to status
action_to_status() {
  case "$1" in
    start)   echo "running" ;;
    stop)    echo "stopped" ;;
    restart) echo "running" ;;
    pause)   echo "paused" ;;
  esac
}

NEW_STATUS="$(action_to_status "$ACTION")"

update_agent() {
  local agent_dir="$1"
  local config="${agent_dir}/config.json"
  [[ ! -f "$config" ]] && return

  local aid
  aid="$(jq -r '.agent_id' "$config")"

  # Update status
  jq --arg s "$NEW_STATUS" --arg t "$NOW" \
    '.status = $s | .last_action_time = $t' "$config" > "${config}.tmp" && mv "${config}.tmp" "$config"

  # Log the action
  local log_file="${TENANT_DIR}/logs/lifecycle.log"
  echo "${NOW} | ${ACTION} | ${aid} | status=${NEW_STATUS}" >> "$log_file"

  echo "  ${aid}: ${ACTION} → ${NEW_STATUS}"
}

echo "Tenant: ${TENANT_ID} | Action: ${ACTION}"

if [[ "$AGENT_ID" == "all" ]]; then
  for agent_dir in "$TENANT_DIR"/agents/agent-*; do
    [[ -d "$agent_dir" ]] && update_agent "$agent_dir"
  done
else
  agent_dir="$TENANT_DIR/agents/${AGENT_ID}"
  [[ ! -d "$agent_dir" ]] && echo "Error: Agent '$AGENT_ID' not found" >&2 && exit 1
  update_agent "$agent_dir"
fi

echo "✅ Done"
