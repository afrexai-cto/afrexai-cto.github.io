#!/usr/bin/env bash
# multi-tenant-manager.sh — Manage all hosted customers
# Reads from aaas-platform/customers/*/profile.json as single source of truth
# Bash 3.2 compatible
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLATFORM_DIR="$(cd "$SCRIPT_DIR/../../aaas-platform" && pwd)"
CUSTOMERS_DIR="$PLATFORM_DIR/customers"
PRICING_FILE="$PLATFORM_DIR/pricing.json"

# --- Helpers ---
read_json_field() {
    local file="$1" field="$2"
    sed -n "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^,\"}]*\)\"\{0,1\}.*/\1/p" "$file" | head -1
}

count_agents() {
    local cdir="$1"
    if [ -f "$cdir/agent-manifest.json" ]; then
        grep -c '"slug"' "$cdir/agent-manifest.json" 2>/dev/null || echo 0
    else
        echo 0
    fi
}

count_files() {
    local dir="$1" pattern="${2:-*}"
    if [ -d "$dir" ]; then
        find "$dir" -name "$pattern" -type f 2>/dev/null | wc -l | tr -d ' '
    else
        echo 0
    fi
}

dir_size_kb() {
    if [ -d "$1" ]; then
        du -sk "$1" 2>/dev/null | awk '{print $1}'
    else
        echo 0
    fi
}

# Read monthly price: prefer billing.json, fall back to pricing.json tier lookup
get_monthly_price() {
    local cdir="$1" tier="$2"
    if [ -f "$cdir/billing.json" ]; then
        local price
        price="$(read_json_field "$cdir/billing.json" "monthly_price_usd")"
        if [ -n "$price" ] && [ "$price" != "0" ]; then
            echo "$price"
            return
        fi
    fi
    # Fall back to pricing.json
    if [ -f "$PRICING_FILE" ]; then
        python3 -c "
import json, sys
p = json.load(open('$PRICING_FILE'))
t = p.get('tiers', {}).get('$tier', {})
print(t.get('price', 0))
" 2>/dev/null || echo 0
    else
        echo 0
    fi
}

# Read vertical from profile.json (may not exist in older profiles)
get_vertical() {
    local file="$1"
    local v
    v="$(read_json_field "$file" "vertical")"
    echo "${v:-general}"
}

usage() {
    cat <<EOF
Usage: $0 <command> [options]

Commands:
  list              List all customers and their agents
  status            Aggregate health status across all customers
  usage             Show resource usage per customer
  issues            Flag issues (down agents, high errors, limits)
  summary           Full summary report
  customer <id>     Detailed view of a single customer

Options:
  --format json     Output as JSON (default: table)
  -h, --help        Show this help
EOF
    exit "${1:-0}"
}

# --- Commands ---

cmd_list() {
    local format="$1"
    if [ ! -d "$CUSTOMERS_DIR" ] || [ -z "$(ls "$CUSTOMERS_DIR" 2>/dev/null)" ]; then
        echo "No customers found."
        return
    fi

    if [ "$format" = "json" ]; then
        echo "["
        local first=1
        for cdir in "$CUSTOMERS_DIR"/*/; do
            [ -f "$cdir/profile.json" ] || continue
            if [ "$first" -eq 0 ]; then echo ","; fi
            first=0
            cat "$cdir/profile.json"
        done
        echo "]"
        return
    fi

    printf "%-25s %-20s %-12s %-10s %-6s %-10s %-8s\n" "SLUG" "COMPANY" "VERTICAL" "TIER" "AGENTS" "MRR" "STATUS"
    printf "%-25s %-20s %-12s %-10s %-6s %-10s %-8s\n" "-------------------------" "--------------------" "------------" "----------" "------" "----------" "--------"

    local total_customers=0 total_agents=0 total_mrr=0
    for cdir in "$CUSTOMERS_DIR"/*/; do
        [ -f "$cdir/profile.json" ] || continue
        local p="$cdir/profile.json"
        local slug company tier vertical agents price status
        slug="$(read_json_field "$p" "slug")"
        company="$(read_json_field "$p" "company")"
        # Try company_name if company is empty (spec format)
        [ -z "$company" ] && company="$(read_json_field "$p" "company_name")"
        tier="$(read_json_field "$p" "package")"
        # Try tier field if package is empty (spec format)
        [ -z "$tier" ] && tier="$(read_json_field "$p" "tier")"
        vertical="$(get_vertical "$p")"
        agents="$(count_agents "$cdir")"
        price="$(get_monthly_price "$cdir" "$tier")"
        status="$(read_json_field "$p" "status")"
        printf "%-25s %-20s %-12s %-10s %-6s \$%-9s %-8s\n" "$slug" "${company:0:20}" "${vertical:0:12}" "$tier" "$agents" "$price" "$status"
        total_customers=$((total_customers + 1))
        total_agents=$((total_agents + agents))
        total_mrr=$((total_mrr + price))
    done
    echo ""
    echo "Total: $total_customers customers, $total_agents agents, \$$total_mrr MRR"
}

cmd_status() {
    local format="$1"
    local total=0 healthy=0 degraded=0 down=0

    for cdir in "$CUSTOMERS_DIR"/*/; do
        [ -f "$cdir/profile.json" ] || continue
        local hf="$cdir/monitoring/health.json"
        total=$((total + 1))
        if [ ! -f "$hf" ]; then
            # No health data — assume healthy
            healthy=$((healthy + 1))
            continue
        fi
        local s
        s="$(read_json_field "$hf" "overall_status")"
        case "$s" in
            healthy)  healthy=$((healthy + 1)) ;;
            degraded) degraded=$((degraded + 1)) ;;
            down)     down=$((down + 1)) ;;
            *)        healthy=$((healthy + 1)) ;;
        esac
    done

    if [ "$format" = "json" ]; then
        cat <<JSON
{"total_customers":$total,"healthy":$healthy,"degraded":$degraded,"down":$down,"timestamp":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
JSON
        return
    fi

    echo "=============================================="
    echo "  AfrexAI Hosted Agents — Aggregate Health"
    echo "=============================================="
    echo ""
    echo "  Total Customers:  $total"
    echo "  Healthy:          $healthy ✅"
    echo "  Degraded:         $degraded ⚠️"
    echo "  Down:             $down ❌"
    echo ""
    if [ "$down" -gt 0 ]; then
        echo "  ⚠️  ALERT: $down customer(s) have down agents!"
    fi
    if [ "$degraded" -gt 0 ]; then
        echo "  ⚠️  WARNING: $degraded customer(s) in degraded state"
    fi
    if [ "$down" -eq 0 ] && [ "$degraded" -eq 0 ]; then
        echo "  All systems nominal. 🚀"
    fi
}

cmd_usage() {
    local format="$1"
    printf "%-25s %-8s %-10s %-10s %-10s\n" "SLUG" "AGENTS" "DISK (KB)" "LOG FILES" "JSON FILES"
    printf "%-25s %-8s %-10s %-10s %-10s\n" "-------------------------" "--------" "----------" "----------" "----------"

    for cdir in "$CUSTOMERS_DIR"/*/; do
        [ -f "$cdir/profile.json" ] || continue
        local slug agents disk logs jsons
        slug="$(read_json_field "$cdir/profile.json" "slug")"
        agents="$(count_agents "$cdir")"
        disk="$(dir_size_kb "$cdir")"
        logs="$(count_files "$cdir" "*.log")"
        jsons="$(count_files "$cdir" "*.json")"
        printf "%-25s %-8s %-10s %-10s %-10s\n" "$slug" "$agents" "$disk" "$logs" "$jsons"
    done
}

cmd_issues() {
    local format="$1"
    local found=0
    echo "=============================================="
    echo "  AfrexAI Hosted Agents — Issue Scanner"
    echo "=============================================="
    echo ""

    for cdir in "$CUSTOMERS_DIR"/*/; do
        [ -f "$cdir/profile.json" ] || continue
        local slug status
        slug="$(read_json_field "$cdir/profile.json" "slug")"
        status="$(read_json_field "$cdir/profile.json" "status")"

        if [ "$status" != "active" ]; then
            echo "  ❌ $slug — status: $status (not active)"
            found=$((found + 1))
        fi

        if [ -f "$cdir/monitoring/health.json" ]; then
            local hf="$cdir/monitoring/health.json"
            local agents_down error_rate
            agents_down="$(read_json_field "$hf" "agents_down")"
            error_rate="$(read_json_field "$hf" "error_rate_24h")"

            if [ "${agents_down:-0}" -gt 0 ]; then
                echo "  ❌ $slug — $agents_down agent(s) DOWN"
                found=$((found + 1))
            fi

            local err_int
            err_int="$(echo "${error_rate:-0}" | cut -d. -f1)"
            if [ "${err_int:-0}" -ge 5 ]; then
                echo "  ⚠️  $slug — error rate ${error_rate}% (threshold: 5%)"
                found=$((found + 1))
            fi
        fi

        if [ -f "$cdir/monitoring/sla.json" ]; then
            local breaches
            breaches="$(read_json_field "$cdir/monitoring/sla.json" "breaches_this_month")"
            if [ "${breaches:-0}" -gt 0 ]; then
                echo "  ⚠️  $slug — $breaches SLA breach(es) this month"
                found=$((found + 1))
            fi
        fi

        local disk
        disk="$(dir_size_kb "$cdir")"
        if [ "$disk" -gt 1048576 ]; then
            echo "  ⚠️  $slug — disk usage ${disk}KB (approaching limit)"
            found=$((found + 1))
        fi
    done

    if [ "$found" -eq 0 ]; then
        echo "  No issues found. All clear. ✅"
    else
        echo ""
        echo "  $found issue(s) found."
    fi
}

cmd_customer() {
    local slug="$1"
    local cdir="$CUSTOMERS_DIR/$slug"
    if [ ! -d "$cdir" ]; then
        echo "Error: Customer '$slug' not found." >&2
        exit 1
    fi
    if [ ! -f "$cdir/profile.json" ]; then
        echo "Error: profile.json missing for customer '$slug'." >&2
        exit 1
    fi
    local p="$cdir/profile.json"
    local company tier vertical
    company="$(read_json_field "$p" "company")"
    [ -z "$company" ] && company="$(read_json_field "$p" "company_name")"
    tier="$(read_json_field "$p" "package")"
    [ -z "$tier" ] && tier="$(read_json_field "$p" "tier")"
    vertical="$(get_vertical "$p")"
    local price
    price="$(get_monthly_price "$cdir" "$tier")"

    echo "=============================================="
    echo "  Customer Detail: $slug"
    echo "=============================================="
    echo ""
    echo "  Company:     $company"
    echo "  Email:       $(read_json_field "$p" "contact_email")"
    echo "  Tier:        $tier"
    echo "  Vertical:    $vertical"
    echo "  Agents:      $(count_agents "$cdir")"
    echo "  MRR:         \$$price"
    echo "  Status:      $(read_json_field "$p" "status")"
    echo "  Onboarded:   $(read_json_field "$p" "onboarded_at")"
    echo ""
    echo "  Agents:"
    if [ -f "$cdir/agent-manifest.json" ]; then
        python3 -c "
import json, sys
try:
    m = json.load(open('$cdir/agent-manifest.json'))
    for a in m.get('agents', []):
        print(f\"    • {a['name']} ({a.get('title','')}) — {a.get('status','unknown')}\")
except: pass
" 2>/dev/null
    else
        echo "    (no agent manifest)"
    fi
    echo ""
    echo "  Disk Usage:  $(dir_size_kb "$cdir") KB"
    if [ -f "$cdir/monitoring/health.json" ]; then
        echo "  Health:      $(read_json_field "$cdir/monitoring/health.json" "overall_status")"
        echo "  Uptime:      $(read_json_field "$cdir/monitoring/health.json" "uptime_percent")%"
    fi
}

# --- Main ---
FORMAT="table"
COMMAND=""
EXTRA=""

while [ $# -gt 0 ]; do
    case "$1" in
        --format)  FORMAT="$2"; shift 2 ;;
        -h|--help) usage 0 ;;
        list|status|usage|issues|summary)
            COMMAND="$1"; shift ;;
        customer)
            COMMAND="customer"; EXTRA="$2"; shift 2 ;;
        *)
            echo "Unknown: $1" >&2; usage 1 ;;
    esac
done

if [ -z "$COMMAND" ]; then
    usage 1
fi

case "$COMMAND" in
    list)     cmd_list "$FORMAT" ;;
    status)   cmd_status "$FORMAT" ;;
    usage)    cmd_usage "$FORMAT" ;;
    issues)   cmd_issues "$FORMAT" ;;
    summary)  cmd_list "$FORMAT"; echo ""; cmd_status "$FORMAT"; echo ""; cmd_issues "$FORMAT" ;;
    customer) cmd_customer "$EXTRA" ;;
esac
