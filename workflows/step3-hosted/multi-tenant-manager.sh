#!/usr/bin/env bash
# multi-tenant-manager.sh — Manage all hosted customers
# Bash 3.2 compatible
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="${AFREX_DATA_DIR:-$SCRIPT_DIR/data}"
CUSTOMERS_DIR="$DATA_DIR/customers"

# --- Helpers ---
read_json_field() {
    # Minimal JSON field reader (no jq dependency). Handles simple string/number fields.
    local file="$1" field="$2"
    sed -n "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^,\"}]*\)\"\{0,1\}.*/\1/p" "$file" | head -1
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
            [ -f "$cdir/config/manifest.json" ] || continue
            local m="$cdir/config/manifest.json"
            if [ "$first" -eq 0 ]; then echo ","; fi
            first=0
            cat "$m"
        done
        echo "]"
        return
    fi

    printf "%-30s %-12s %-10s %-6s %-10s %-8s\n" "CUSTOMER ID" "COMPANY" "TIER" "AGENTS" "MRR" "STATUS"
    printf "%-30s %-12s %-10s %-6s %-10s %-8s\n" "------------------------------" "------------" "----------" "------" "----------" "--------"

    local total_customers=0 total_agents=0 total_mrr=0
    for cdir in "$CUSTOMERS_DIR"/*/; do
        [ -f "$cdir/config/manifest.json" ] || continue
        local m="$cdir/config/manifest.json"
        local cid company tier agents price status
        cid="$(read_json_field "$m" "customer_id")"
        company="$(read_json_field "$m" "company_name")"
        tier="$(read_json_field "$m" "tier")"
        agents="$(read_json_field "$m" "agent_count")"
        price="$(read_json_field "$m" "monthly_price")"
        status="$(read_json_field "$m" "status")"
        printf "%-30s %-12s %-10s %-6s \$%-9s %-8s\n" "$cid" "${company:0:12}" "$tier" "$agents" "$price" "$status"
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
        local hf="$cdir/monitoring/health.json"
        [ -f "$hf" ] || continue
        total=$((total + 1))
        local s
        s="$(read_json_field "$hf" "overall_status")"
        case "$s" in
            healthy)  healthy=$((healthy + 1)) ;;
            degraded) degraded=$((degraded + 1)) ;;
            down)     down=$((down + 1)) ;;
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
    printf "%-30s %-8s %-10s %-10s %-10s\n" "CUSTOMER ID" "AGENTS" "DISK (KB)" "LOG FILES" "MEM FILES"
    printf "%-30s %-8s %-10s %-10s %-10s\n" "------------------------------" "--------" "----------" "----------" "----------"

    for cdir in "$CUSTOMERS_DIR"/*/; do
        [ -f "$cdir/config/manifest.json" ] || continue
        local m="$cdir/config/manifest.json"
        local cid agents disk logs mems
        cid="$(read_json_field "$m" "customer_id")"
        agents="$(read_json_field "$m" "agent_count")"
        disk="$(dir_size_kb "$cdir")"
        logs="$(count_files "$cdir" "*.log")"
        mems="$(count_files "$cdir" "*.json")"
        printf "%-30s %-8s %-10s %-10s %-10s\n" "$cid" "$agents" "$disk" "$logs" "$mems"
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
        [ -f "$cdir/config/manifest.json" ] || continue
        local m="$cdir/config/manifest.json"
        local cid status
        cid="$(read_json_field "$m" "customer_id")"
        status="$(read_json_field "$m" "status")"

        # Check customer status
        if [ "$status" != "active" ]; then
            echo "  ❌ $cid — status: $status (not active)"
            found=$((found + 1))
        fi

        # Check agent health
        if [ -f "$cdir/monitoring/health.json" ]; then
            local hf="$cdir/monitoring/health.json"
            local agents_down error_rate
            agents_down="$(read_json_field "$hf" "agents_down")"
            error_rate="$(read_json_field "$hf" "error_rate_24h")"

            if [ "${agents_down:-0}" -gt 0 ]; then
                echo "  ❌ $cid — $agents_down agent(s) DOWN"
                found=$((found + 1))
            fi

            # Check error rate > 5%
            local err_int
            err_int="$(echo "$error_rate" | cut -d. -f1)"
            if [ "${err_int:-0}" -ge 5 ]; then
                echo "  ⚠️  $cid — error rate ${error_rate}% (threshold: 5%)"
                found=$((found + 1))
            fi
        fi

        # Check SLA breaches
        if [ -f "$cdir/monitoring/sla.json" ]; then
            local breaches
            breaches="$(read_json_field "$cdir/monitoring/sla.json" "breaches_this_month")"
            if [ "${breaches:-0}" -gt 0 ]; then
                echo "  ⚠️  $cid — $breaches SLA breach(es) this month"
                found=$((found + 1))
            fi
        fi

        # Check disk usage > 1GB (1048576 KB)
        local disk
        disk="$(dir_size_kb "$cdir")"
        if [ "$disk" -gt 1048576 ]; then
            echo "  ⚠️  $cid — disk usage ${disk}KB (approaching limit)"
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
    local cid="$1"
    local cdir="$CUSTOMERS_DIR/$cid"
    if [ ! -d "$cdir" ]; then
        echo "Error: Customer '$cid' not found." >&2
        exit 1
    fi
    local m="$cdir/config/manifest.json"
    echo "=============================================="
    echo "  Customer Detail: $cid"
    echo "=============================================="
    echo ""
    echo "  Company:     $(read_json_field "$m" "company_name")"
    echo "  Email:       $(read_json_field "$m" "email")"
    echo "  Tier:        $(read_json_field "$m" "tier")"
    echo "  Vertical:    $(read_json_field "$m" "vertical")"
    echo "  Agents:      $(read_json_field "$m" "agent_count")"
    echo "  MRR:         \$$(read_json_field "$m" "monthly_price")"
    echo "  Status:      $(read_json_field "$m" "status")"
    echo "  Provisioned: $(read_json_field "$m" "provisioned_at")"
    echo ""
    echo "  Agents:"
    if [ -d "$cdir/agents" ]; then
        for adir in "$cdir/agents"/*/; do
            local aname
            aname="$(basename "$adir")"
            local astatus="unknown"
            if [ -f "$adir/config/agent.json" ]; then
                astatus="$(read_json_field "$adir/config/agent.json" "status")"
            fi
            echo "    • $aname ($astatus)"
        done
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
