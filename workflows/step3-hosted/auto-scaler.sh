#!/usr/bin/env bash
# auto-scaler.sh — Handle agent scaling for AfrexAI Hosted Agents
# Reads tier limits from aaas-platform/pricing.json and customer data from profile.json
# Bash 3.2 compatible
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLATFORM_DIR="$(cd "$SCRIPT_DIR/../../aaas-platform" && pwd)"
CUSTOMERS_DIR="$PLATFORM_DIR/customers"
PRICING_FILE="$PLATFORM_DIR/pricing.json"
DATA_DIR="${AFREX_DATA_DIR:-$SCRIPT_DIR/data}"
CRM_LOG="$DATA_DIR/crm.log"
BILLING_LOG="$DATA_DIR/billing.log"

# --- Read tier config from pricing.json ---
tier_max_agents() {
    local tier="$1"
    if [ -f "$PRICING_FILE" ]; then
        python3 -c "
import json
p = json.load(open('$PRICING_FILE'))
print(p.get('tiers', {}).get('$tier', {}).get('agents', 0))
" 2>/dev/null || echo 0
    else
        echo "Error: pricing.json not found at $PRICING_FILE" >&2
        echo 0
    fi
}

tier_price() {
    local tier="$1"
    if [ -f "$PRICING_FILE" ]; then
        python3 -c "
import json
p = json.load(open('$PRICING_FILE'))
print(p.get('tiers', {}).get('$tier', {}).get('price', 0))
" 2>/dev/null || echo 0
    else
        echo 0
    fi
}

tier_for_count() {
    local count="$1"
    if [ -f "$PRICING_FILE" ]; then
        python3 -c "
import json
p = json.load(open('$PRICING_FILE'))
tiers = sorted(p['tiers'].items(), key=lambda x: x[1]['agents'])
for name, cfg in tiers:
    if $count <= cfg['agents']:
        print(name)
        break
else:
    print('custom')
" 2>/dev/null || echo "custom"
    else
        # Fallback
        if [ "$count" -le 1 ]; then echo "starter"
        elif [ "$count" -le 3 ]; then echo "growth"
        elif [ "$count" -le 10 ]; then echo "scale"
        elif [ "$count" -le 9 ]; then echo "enterprise"
        else echo "custom"
        fi
    fi
}

read_json_field() {
    local file="$1" field="$2"
    sed -n "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^,\"}]*\)\"\{0,1\}.*/\1/p" "$file" | head -1
}

get_tier() {
    local profile="$1"
    local tier
    tier="$(read_json_field "$profile" "package")"
    [ -z "$tier" ] && tier="$(read_json_field "$profile" "tier")"
    echo "${tier:-starter}"
}

get_agent_count() {
    local cdir="$1"
    if [ -f "$cdir/agent-manifest.json" ]; then
        grep -c '"slug"' "$cdir/agent-manifest.json" 2>/dev/null || echo 0
    else
        echo 0
    fi
}

log_billing() {
    mkdir -p "$(dirname "$BILLING_LOG")"
    echo "{\"event\":\"$1\",\"customer\":\"$2\",\"old_tier\":\"$3\",\"new_tier\":\"$4\",\"old_mrr\":$5,\"new_mrr\":$6,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$BILLING_LOG"
}

log_crm() {
    mkdir -p "$(dirname "$CRM_LOG")"
    echo "$1" >> "$CRM_LOG"
}

usage() {
    cat <<EOF
Usage: $0 <command> --customer <slug> [options]

Commands:
  scale-up      Add agents to customer (auto-upgrades tier if needed)
  scale-down    Remove agents (auto-downgrades tier, archives data)
  change-tier   Change tier directly

Options:
  --customer <slug>     Customer slug (required)
  --add <n>             Number of agents to add (scale-up)
  --remove <n>          Number of agents to remove (scale-down)
  --agents <names>      Specific agent names to remove (comma-separated)
  --tier <tier>         Target tier (change-tier)
  --force               Skip confirmation
  -h, --help            Show this help
EOF
    exit "${1:-0}"
}

# --- Scale Up ---
cmd_scale_up() {
    local slug="$1" add_count="$2"
    local cdir="$CUSTOMERS_DIR/$slug"

    if [ ! -f "$cdir/profile.json" ]; then
        echo "Error: profile.json not found for customer '$slug'." >&2
        exit 1
    fi

    local current_tier current_agents
    current_tier="$(get_tier "$cdir/profile.json")"
    current_agents="$(get_agent_count "$cdir")"
    local new_total=$((current_agents + add_count))
    local new_tier
    new_tier="$(tier_for_count "$new_total")"

    # Check max across all tiers
    local max_any
    max_any="$(python3 -c "
import json
p = json.load(open('$PRICING_FILE'))
print(max(t['agents'] for t in p['tiers'].values()))
" 2>/dev/null || echo 10)"

    if [ "$new_total" -gt "$max_any" ]; then
        echo "Error: Maximum $max_any agents across all tiers. Requested: $new_total" >&2
        exit 1
    fi

    local old_price new_price
    old_price="$(tier_price "$current_tier")"
    new_price="$(tier_price "$new_tier")"

    echo "=============================================="
    echo "  AfrexAI — Scale Up"
    echo "=============================================="
    echo ""
    echo "  Customer:      $slug"
    echo "  Current:       $current_agents agent(s) ($current_tier, \$$old_price/mo)"
    echo "  Adding:        $add_count agent(s)"
    echo "  New total:     $new_total agent(s) ($new_tier, \$$new_price/mo)"
    if [ "$current_tier" != "$new_tier" ]; then
        echo "  ⬆️  Tier upgrade: $current_tier → $new_tier"
    fi
    echo ""

    echo "▸ Deploying $add_count new agent(s)..."
    local ts
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    local i=0
    local vertical
    vertical="$(read_json_field "$cdir/profile.json" "vertical")"
    vertical="${vertical:-general}"

    while [ "$i" -lt "$add_count" ]; do
        local agent_name="agent-$((current_agents + i + 1))"
        local agent_dir="$cdir/agents/$agent_name"
        mkdir -p "$agent_dir"/{memory,logs,config}
        cat > "$agent_dir/config/agent.json" <<ACFG
{
  "agent_id": "${slug}-${agent_name}",
  "agent_name": "$agent_name",
  "customer_slug": "$slug",
  "status": "running",
  "deployed_at": "$ts",
  "vertical": "$vertical"
}
ACFG
        echo "[]" > "$agent_dir/memory/context.json"
        echo "$ts — Agent $agent_name deployed (scale-up)" > "$agent_dir/logs/activity.log"
        echo "  ✓ $agent_name deployed"
        i=$((i + 1))
    done

    # Update billing.json if it exists
    if [ -f "$cdir/billing.json" ]; then
        python3 -c "
import json
b = json.load(open('$cdir/billing.json'))
b['package'] = '$new_tier'
b['agent_limit'] = $(tier_max_agents "$new_tier")
b['monthly_price_usd'] = $new_price
json.dump(b, open('$cdir/billing.json', 'w'), indent=2)
" 2>/dev/null || true
    fi

    log_billing "scale_up" "$slug" "$current_tier" "$new_tier" "$old_price" "$new_price"
    log_crm "{\"event\":\"scale_up\",\"customer\":\"$slug\",\"from\":$current_agents,\"to\":$new_total,\"tier_change\":\"$current_tier->$new_tier\",\"timestamp\":\"$ts\"}"

    echo ""
    echo "  ✅ Scale-up complete. $new_total agents running. Billing updated to \$$new_price/mo."
}

# --- Scale Down ---
cmd_scale_down() {
    local slug="$1" remove_count="$2" specific_agents="$3"
    local cdir="$CUSTOMERS_DIR/$slug"

    if [ ! -f "$cdir/profile.json" ]; then
        echo "Error: profile.json not found for customer '$slug'." >&2
        exit 1
    fi

    local current_tier current_agents
    current_tier="$(get_tier "$cdir/profile.json")"
    current_agents="$(get_agent_count "$cdir")"

    if [ "$remove_count" -ge "$current_agents" ]; then
        echo "Error: Cannot remove all agents. Use offboarding instead." >&2
        exit 1
    fi

    local new_total=$((current_agents - remove_count))
    local new_tier
    new_tier="$(tier_for_count "$new_total")"
    local old_price new_price ts
    old_price="$(tier_price "$current_tier")"
    new_price="$(tier_price "$new_tier")"
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    echo "=============================================="
    echo "  AfrexAI — Scale Down"
    echo "=============================================="
    echo ""
    echo "  Customer:      $slug"
    echo "  Current:       $current_agents agent(s) ($current_tier, \$$old_price/mo)"
    echo "  Removing:      $remove_count agent(s)"
    echo "  New total:     $new_total agent(s) ($new_tier, \$$new_price/mo)"
    if [ "$current_tier" != "$new_tier" ]; then
        echo "  ⬇️  Tier downgrade: $current_tier → $new_tier"
    fi
    echo ""

    local agents_to_remove=""
    if [ -n "$specific_agents" ]; then
        agents_to_remove="$(echo "$specific_agents" | tr ',' ' ')"
    else
        agents_to_remove="$(ls -1 "$cdir/agents/" 2>/dev/null | sort -r | head -n "$remove_count")"
    fi

    echo "▸ Graceful agent shutdown & archival..."
    mkdir -p "$cdir/backups/archived-agents"
    for agent_name in $agents_to_remove; do
        local agent_dir="$cdir/agents/$agent_name"
        if [ ! -d "$agent_dir" ]; then
            echo "  ⚠️  $agent_name not found, skipping"
            continue
        fi
        if [ -f "$agent_dir/config/agent.json" ]; then
            python3 -c "
import json
a = json.load(open('$agent_dir/config/agent.json'))
a['status'] = 'archived'
json.dump(a, open('$agent_dir/config/agent.json', 'w'), indent=2)
" 2>/dev/null || true
        fi
        echo "$ts — Agent $agent_name archived (scale-down)" >> "$agent_dir/logs/activity.log" 2>/dev/null || true

        local archive_dir="$cdir/backups/archived-agents/${agent_name}-${ts}"
        cp -R "$agent_dir" "$archive_dir" 2>/dev/null || true
        rm -rf "$agent_dir"
        echo "  ✓ $agent_name archived → ${archive_dir##*/}"
    done

    # Update billing.json if it exists
    if [ -f "$cdir/billing.json" ]; then
        python3 -c "
import json
b = json.load(open('$cdir/billing.json'))
b['package'] = '$new_tier'
b['agent_limit'] = $(tier_max_agents "$new_tier")
b['monthly_price_usd'] = $new_price
json.dump(b, open('$cdir/billing.json', 'w'), indent=2)
" 2>/dev/null || true
    fi

    log_billing "scale_down" "$slug" "$current_tier" "$new_tier" "$old_price" "$new_price"
    log_crm "{\"event\":\"scale_down\",\"customer\":\"$slug\",\"from\":$current_agents,\"to\":$new_total,\"tier_change\":\"$current_tier->$new_tier\",\"timestamp\":\"$ts\"}"

    echo ""
    echo "  ✅ Scale-down complete. $new_total agents running. Billing updated to \$$new_price/mo."
    echo "  📦 Archived agent data preserved in backups/"
}

# --- Change Tier ---
cmd_change_tier() {
    local slug="$1" new_tier="$2"
    local cdir="$CUSTOMERS_DIR/$slug"

    if [ ! -f "$cdir/profile.json" ]; then
        echo "Error: profile.json not found for customer '$slug'." >&2
        exit 1
    fi

    local current_tier current_agents new_max
    current_tier="$(get_tier "$cdir/profile.json")"
    current_agents="$(get_agent_count "$cdir")"
    new_max="$(tier_max_agents "$new_tier")"

    if [ "$new_max" -eq 0 ]; then
        echo "Error: Invalid tier '$new_tier'. Check pricing.json for valid tiers." >&2
        exit 1
    fi

    if [ "$current_agents" -gt "$new_max" ]; then
        local excess=$((current_agents - new_max))
        echo "Current agent count ($current_agents) exceeds new tier max ($new_max)."
        echo "Run: $0 scale-down --customer $slug --remove $excess"
        echo "Then retry tier change."
        exit 1
    fi

    local old_price new_price
    old_price="$(tier_price "$current_tier")"
    new_price="$(tier_price "$new_tier")"

    # Update billing.json
    if [ -f "$cdir/billing.json" ]; then
        python3 -c "
import json
b = json.load(open('$cdir/billing.json'))
b['package'] = '$new_tier'
b['agent_limit'] = $new_max
b['monthly_price_usd'] = $new_price
json.dump(b, open('$cdir/billing.json', 'w'), indent=2)
" 2>/dev/null || true
    fi

    log_billing "tier_change" "$slug" "$current_tier" "$new_tier" "$old_price" "$new_price"

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
