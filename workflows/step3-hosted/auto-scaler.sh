#!/usr/bin/env bash
# auto-scaler.sh — Handle agent scaling for AfrexAI Hosted Agents
# Bash 3.2 compatible
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="${AFREX_DATA_DIR:-$SCRIPT_DIR/data}"
CUSTOMERS_DIR="$DATA_DIR/customers"
CRM_LOG="$DATA_DIR/crm.log"
BILLING_LOG="$DATA_DIR/billing.log"

# --- Tier config ---
tier_max_agents() {
    case "$1" in
        starter)    echo 1 ;;
        growth)     echo 3 ;;
        enterprise) echo 9 ;;
        *)          echo 0 ;;
    esac
}

tier_price() {
    case "$1" in
        starter)    echo 1500 ;;
        growth)     echo 4500 ;;
        enterprise) echo 12000 ;;
        *)          echo 0 ;;
    esac
}

tier_for_count() {
    local count="$1"
    if [ "$count" -le 1 ]; then echo "starter"
    elif [ "$count" -le 3 ]; then echo "growth"
    elif [ "$count" -le 9 ]; then echo "enterprise"
    else echo "custom"
    fi
}

read_json_field() {
    local file="$1" field="$2"
    sed -n "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^,\"}]*\)\"\{0,1\}.*/\1/p" "$file" | head -1
}

update_json_field() {
    local file="$1" field="$2" value="$3" is_string="${4:-yes}"
    if [ "$is_string" = "yes" ]; then
        sed -i.bak "s/\"${field}\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"${field}\": \"${value}\"/" "$file" 2>/dev/null || \
            sed -i '' "s/\"${field}\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"${field}\": \"${value}\"/" "$file"
    else
        sed -i.bak "s/\"${field}\"[[:space:]]*:[[:space:]]*[0-9]*/\"${field}\": ${value}/" "$file" 2>/dev/null || \
            sed -i '' "s/\"${field}\"[[:space:]]*:[[:space:]]*[0-9]*/\"${field}\": ${value}/" "$file"
    fi
    rm -f "${file}.bak"
}

log_billing() {
    mkdir -p "$(dirname "$BILLING_LOG")"
    echo "{\"event\":\"$1\",\"customer_id\":\"$2\",\"old_tier\":\"$3\",\"new_tier\":\"$4\",\"old_mrr\":$5,\"new_mrr\":$6,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$BILLING_LOG"
}

log_crm() {
    mkdir -p "$(dirname "$CRM_LOG")"
    echo "$1" >> "$CRM_LOG"
}

usage() {
    cat <<EOF
Usage: $0 <command> --customer <id> [options]

Commands:
  scale-up      Add agents to customer (auto-upgrades tier if needed)
  scale-down    Remove agents (auto-downgrades tier, archives data)
  change-tier   Change tier directly

Options:
  --customer <id>       Customer ID (required)
  --add <n>             Number of agents to add (scale-up)
  --remove <n>          Number of agents to remove (scale-down)
  --agents <names>      Specific agent names to remove (comma-separated)
  --tier <tier>         Target tier (change-tier)
  --force               Skip confirmation
  -h, --help            Show this help

Examples:
  $0 scale-up --customer cust-acme-123 --add 2
  $0 scale-down --customer cust-acme-123 --remove 1
  $0 change-tier --customer cust-acme-123 --tier enterprise
EOF
    exit "${1:-0}"
}

# --- Scale Up ---
cmd_scale_up() {
    local cid="$1" add_count="$2"
    local cdir="$CUSTOMERS_DIR/$cid"
    local m="$cdir/config/manifest.json"

    [ -f "$m" ] || { echo "Error: Customer $cid not found." >&2; exit 1; }

    local current_agents current_tier
    current_agents="$(read_json_field "$m" "agent_count")"
    current_tier="$(read_json_field "$m" "tier")"
    local new_total=$((current_agents + add_count))
    local new_tier
    new_tier="$(tier_for_count "$new_total")"
    local max_allowed
    max_allowed="$(tier_max_agents "$new_tier")"

    if [ "$new_total" -gt 9 ]; then
        echo "Error: Maximum 9 agents (enterprise tier). Requested: $new_total" >&2
        exit 1
    fi

    local old_price new_price
    old_price="$(tier_price "$current_tier")"
    new_price="$(tier_price "$new_tier")"

    echo "=============================================="
    echo "  AfrexAI — Scale Up"
    echo "=============================================="
    echo ""
    echo "  Customer:      $cid"
    echo "  Current:       $current_agents agent(s) ($current_tier, \$$old_price/mo)"
    echo "  Adding:        $add_count agent(s)"
    echo "  New total:     $new_total agent(s) ($new_tier, \$$new_price/mo)"
    if [ "$current_tier" != "$new_tier" ]; then
        echo "  ⬆️  Tier upgrade: $current_tier → $new_tier"
    fi
    echo ""

    # Deploy new agents
    echo "▸ Deploying $add_count new agent(s)..."
    local ts
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    local i=0
    while [ "$i" -lt "$add_count" ]; do
        local agent_name="agent-$((current_agents + i + 1))"
        local agent_dir="$cdir/agents/$agent_name"
        mkdir -p "$agent_dir"/{memory,logs,config}
        cat > "$agent_dir/config/agent.json" <<ACFG
{
  "agent_id": "${cid}-${agent_name}",
  "agent_name": "$agent_name",
  "customer_id": "$cid",
  "status": "running",
  "deployed_at": "$ts",
  "vertical": "$(read_json_field "$m" "vertical")"
}
ACFG
        echo "[]" > "$agent_dir/memory/context.json"
        echo "$ts — Agent $agent_name deployed (scale-up)" > "$agent_dir/logs/activity.log"
        echo "  ✓ $agent_name deployed"
        i=$((i + 1))
    done

    # Update manifest
    update_json_field "$m" "agent_count" "$new_total" "no"
    update_json_field "$m" "tier" "$new_tier"
    update_json_field "$m" "monthly_price" "$new_price" "no"

    # Update monitoring
    if [ -f "$cdir/monitoring/health.json" ]; then
        update_json_field "$cdir/monitoring/health.json" "agents_healthy" "$new_total" "no"
    fi

    # Log billing
    log_billing "scale_up" "$cid" "$current_tier" "$new_tier" "$old_price" "$new_price"
    log_crm "{\"event\":\"scale_up\",\"customer_id\":\"$cid\",\"from\":$current_agents,\"to\":$new_total,\"tier_change\":\"$current_tier->$new_tier\",\"timestamp\":\"$ts\"}"

    echo ""
    echo "  ✅ Scale-up complete. $new_total agents running. Billing updated to \$$new_price/mo."
}

# --- Scale Down ---
cmd_scale_down() {
    local cid="$1" remove_count="$2" specific_agents="$3"
    local cdir="$CUSTOMERS_DIR/$cid"
    local m="$cdir/config/manifest.json"

    [ -f "$m" ] || { echo "Error: Customer $cid not found." >&2; exit 1; }

    local current_agents current_tier
    current_agents="$(read_json_field "$m" "agent_count")"
    current_tier="$(read_json_field "$m" "tier")"

    if [ "$remove_count" -ge "$current_agents" ]; then
        echo "Error: Cannot remove all agents. Use offboarding instead." >&2
        exit 1
    fi

    local new_total=$((current_agents - remove_count))
    local new_tier
    new_tier="$(tier_for_count "$new_total")"
    local old_price new_price
    old_price="$(tier_price "$current_tier")"
    new_price="$(tier_price "$new_tier")"
    local ts
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    echo "=============================================="
    echo "  AfrexAI — Scale Down"
    echo "=============================================="
    echo ""
    echo "  Customer:      $cid"
    echo "  Current:       $current_agents agent(s) ($current_tier, \$$old_price/mo)"
    echo "  Removing:      $remove_count agent(s)"
    echo "  New total:     $new_total agent(s) ($new_tier, \$$new_price/mo)"
    if [ "$current_tier" != "$new_tier" ]; then
        echo "  ⬇️  Tier downgrade: $current_tier → $new_tier"
    fi
    echo ""

    # Determine which agents to remove
    local agents_to_remove=""
    if [ -n "$specific_agents" ]; then
        agents_to_remove="$(echo "$specific_agents" | tr ',' ' ')"
    else
        # Remove most recently added (highest numbered) agents
        agents_to_remove="$(ls -1 "$cdir/agents/" 2>/dev/null | sort -r | head -n "$remove_count")"
    fi

    # Graceful shutdown + archive
    echo "▸ Graceful agent shutdown & archival..."
    mkdir -p "$cdir/backups/archived-agents"
    for agent_name in $agents_to_remove; do
        local agent_dir="$cdir/agents/$agent_name"
        if [ ! -d "$agent_dir" ]; then
            echo "  ⚠️  $agent_name not found, skipping"
            continue
        fi
        # Mark as shutting down
        if [ -f "$agent_dir/config/agent.json" ]; then
            update_json_field "$agent_dir/config/agent.json" "status" "archived"
        fi
        echo "$ts — Agent $agent_name archived (scale-down)" >> "$agent_dir/logs/activity.log"

        # Archive
        local archive_dir="$cdir/backups/archived-agents/${agent_name}-${ts}"
        cp -R "$agent_dir" "$archive_dir" 2>/dev/null || true
        rm -rf "$agent_dir"
        echo "  ✓ $agent_name archived → ${archive_dir##*/}"
    done

    # Update manifest
    update_json_field "$m" "agent_count" "$new_total" "no"
    update_json_field "$m" "tier" "$new_tier"
    update_json_field "$m" "monthly_price" "$new_price" "no"

    # Log
    log_billing "scale_down" "$cid" "$current_tier" "$new_tier" "$old_price" "$new_price"
    log_crm "{\"event\":\"scale_down\",\"customer_id\":\"$cid\",\"from\":$current_agents,\"to\":$new_total,\"tier_change\":\"$current_tier->$new_tier\",\"timestamp\":\"$ts\"}"

    echo ""
    echo "  ✅ Scale-down complete. $new_total agents running. Billing updated to \$$new_price/mo."
    echo "  📦 Archived agent data preserved in backups/"
}

# --- Change Tier ---
cmd_change_tier() {
    local cid="$1" new_tier="$2"
    local cdir="$CUSTOMERS_DIR/$cid"
    local m="$cdir/config/manifest.json"

    [ -f "$m" ] || { echo "Error: Customer $cid not found." >&2; exit 1; }

    local current_agents current_tier new_max
    current_agents="$(read_json_field "$m" "agent_count")"
    current_tier="$(read_json_field "$m" "tier")"
    new_max="$(tier_max_agents "$new_tier")"

    if [ "$new_max" -eq 0 ]; then
        echo "Error: Invalid tier '$new_tier'." >&2; exit 1
    fi

    if [ "$current_agents" -gt "$new_max" ]; then
        local excess=$((current_agents - new_max))
        echo "Current agent count ($current_agents) exceeds new tier max ($new_max)."
        echo "Run: $0 scale-down --customer $cid --remove $excess"
        echo "Then retry tier change."
        exit 1
    fi

    local old_price new_price
    old_price="$(tier_price "$current_tier")"
    new_price="$(tier_price "$new_tier")"

    update_json_field "$m" "tier" "$new_tier"
    update_json_field "$m" "monthly_price" "$new_price" "no"

    log_billing "tier_change" "$cid" "$current_tier" "$new_tier" "$old_price" "$new_price"

    echo "✅ Tier changed: $current_tier → $new_tier (\$$old_price → \$$new_price/mo)"
}

# --- Parse args ---
COMMAND="" CUSTOMER_ID="" ADD_COUNT=0 REMOVE_COUNT=0 SPECIFIC_AGENTS="" TARGET_TIER="" FORCE=0

while [ $# -gt 0 ]; do
    case "$1" in
        scale-up|scale-down|change-tier) COMMAND="$1"; shift ;;
        --customer) CUSTOMER_ID="$2"; shift 2 ;;
        --add)      ADD_COUNT="$2"; shift 2 ;;
        --remove)   REMOVE_COUNT="$2"; shift 2 ;;
        --agents)   SPECIFIC_AGENTS="$2"; shift 2 ;;
        --tier)     TARGET_TIER="$2"; shift 2 ;;
        --force)    FORCE=1; shift ;;
        -h|--help)  usage 0 ;;
        *)          echo "Unknown: $1" >&2; usage 1 ;;
    esac
done

[ -n "$COMMAND" ] || usage 1
[ -n "$CUSTOMER_ID" ] || { echo "Error: --customer required." >&2; exit 1; }

case "$COMMAND" in
    scale-up)
        [ "$ADD_COUNT" -gt 0 ] || { echo "Error: --add required." >&2; exit 1; }
        cmd_scale_up "$CUSTOMER_ID" "$ADD_COUNT" ;;
    scale-down)
        [ "$REMOVE_COUNT" -gt 0 ] || { echo "Error: --remove required." >&2; exit 1; }
        cmd_scale_down "$CUSTOMER_ID" "$REMOVE_COUNT" "$SPECIFIC_AGENTS" ;;
    change-tier)
        [ -n "$TARGET_TIER" ] || { echo "Error: --tier required." >&2; exit 1; }
        cmd_change_tier "$CUSTOMER_ID" "$TARGET_TIER" ;;
esac
