#!/usr/bin/env bash
# sla-monitor.sh — SLA tracking for AfrexAI Hosted Agents
# Bash 3.2 compatible
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="${AFREX_DATA_DIR:-$SCRIPT_DIR/data}"
CUSTOMERS_DIR="$DATA_DIR/customers"
ALERTS_LOG="$DATA_DIR/sla-alerts.log"

# SLA targets by tier
sla_target() {
    case "$1" in
        starter)    echo "99.5" ;;
        growth)     echo "99.9" ;;
        enterprise) echo "99.95" ;;
        *)          echo "99.0" ;;
    esac
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
        sed -i.bak "s/\"${field}\"[[:space:]]*:[[:space:]]*[0-9.]*[0-9]/\"${field}\": ${value}/" "$file" 2>/dev/null || \
            sed -i '' "s/\"${field}\"[[:space:]]*:[[:space:]]*[0-9.]*[0-9]/\"${field}\": ${value}/" "$file"
    fi
    rm -f "${file}.bak"
}

usage() {
    cat <<EOF
Usage: $0 <command> [options]

Commands:
  check           Run health check on all (or one) customer
  report          Generate monthly SLA report
  breaches        Show all SLA breaches
  dashboard       Quick SLA dashboard view

Options:
  --customer <id>     Target specific customer
  --month <YYYY-MM>   Report month (default: current)
  --format json       Output as JSON
  -h, --help          Show this help
EOF
    exit "${1:-0}"
}

# --- Simulate a health check (in production, this would ping actual services) ---
simulate_agent_check() {
    local agent_dir="$1"
    local agent_name
    agent_name="$(basename "$agent_dir")"
    local status="running"
    local response_ms=0

    if [ -f "$agent_dir/config/agent.json" ]; then
        status="$(read_json_field "$agent_dir/config/agent.json" "status")"
    fi

    # Simulate response time (deterministic based on agent name hash)
    local hash_val
    hash_val="$(echo "$agent_name" | cksum | awk '{print $1}')"
    response_ms=$((hash_val % 200 + 50))  # 50-250ms

    echo "${status}:${response_ms}"
}

# --- Check ---
cmd_check() {
    local target_customer="$1"
    local ts
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    echo "=============================================="
    echo "  AfrexAI — SLA Health Check"
    echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "=============================================="
    echo ""

    local total_customers=0 total_healthy=0 total_breaches=0

    for cdir in "$CUSTOMERS_DIR"/*/; do
        [ -f "$cdir/config/manifest.json" ] || continue
        local cid
        cid="$(basename "$cdir")"
        if [ -n "$target_customer" ] && [ "$cid" != "$target_customer" ]; then continue; fi

        local m="$cdir/config/manifest.json"
        local tier
        tier="$(read_json_field "$m" "tier")"
        local target
        target="$(sla_target "$tier")"
        local sla_file="$cdir/monitoring/sla.json"
        local health_file="$cdir/monitoring/health.json"

        total_customers=$((total_customers + 1))

        # Check each agent
        local agents_total=0 agents_healthy=0 agents_down=0 total_response=0

        if [ -d "$cdir/agents" ]; then
            for adir in "$cdir/agents"/*/; do
                [ -d "$adir" ] || continue
                agents_total=$((agents_total + 1))
                local result
                result="$(simulate_agent_check "$adir")"
                local astatus="${result%%:*}"
                local ams="${result##*:}"
                total_response=$((total_response + ams))

                if [ "$astatus" = "running" ]; then
                    agents_healthy=$((agents_healthy + 1))
                else
                    agents_down=$((agents_down + 1))
                fi
            done
        fi

        # Calculate uptime (simulated — based on healthy/total ratio)
        local uptime="100.0"
        if [ "$agents_total" -gt 0 ]; then
            # Simple: if any agent down, reduce uptime proportionally
            if [ "$agents_down" -gt 0 ]; then
                local healthy_pct=$((agents_healthy * 100 / agents_total))
                uptime="${healthy_pct}.0"
            fi
        fi

        local avg_response=0
        if [ "$agents_total" -gt 0 ]; then
            avg_response=$((total_response / agents_total))
        fi

        # Determine overall status
        local overall="healthy"
        if [ "$agents_down" -gt 0 ] && [ "$agents_healthy" -gt 0 ]; then
            overall="degraded"
        elif [ "$agents_down" -gt 0 ] && [ "$agents_healthy" -eq 0 ]; then
            overall="down"
        fi

        # Check SLA breach
        local target_int
        target_int="$(echo "$target" | cut -d. -f1)"
        local uptime_int
        uptime_int="$(echo "$uptime" | cut -d. -f1)"
        local breached=0
        if [ "$uptime_int" -lt "$target_int" ]; then
            breached=1
            total_breaches=$((total_breaches + 1))
            mkdir -p "$(dirname "$ALERTS_LOG")"
            echo "{\"type\":\"sla_breach\",\"customer_id\":\"$cid\",\"tier\":\"$tier\",\"target\":$target,\"actual\":$uptime,\"timestamp\":\"$ts\"}" >> "$ALERTS_LOG"
        fi

        if [ "$overall" = "healthy" ]; then
            total_healthy=$((total_healthy + 1))
        fi

        # Update monitoring files
        if [ -f "$health_file" ]; then
            update_json_field "$health_file" "last_check" "$ts"
            update_json_field "$health_file" "overall_status" "$overall"
            update_json_field "$health_file" "uptime_percent" "$uptime" "no"
            update_json_field "$health_file" "agents_healthy" "$agents_healthy" "no"
            update_json_field "$health_file" "agents_down" "$agents_down" "no"
            update_json_field "$health_file" "avg_response_ms" "$avg_response" "no"
        fi

        if [ -f "$sla_file" ]; then
            update_json_field "$sla_file" "current_uptime" "$uptime" "no"
        fi

        # Output
        local status_icon="✅"
        if [ "$overall" = "degraded" ]; then status_icon="⚠️"; fi
        if [ "$overall" = "down" ]; then status_icon="❌"; fi
        if [ "$breached" -eq 1 ]; then status_icon="🚨"; fi

        printf "  %s %-28s %s  uptime: %s%% (target: %s%%)  agents: %d/%d  avg: %dms\n" \
            "$status_icon" "$cid" "$tier" "$uptime" "$target" "$agents_healthy" "$agents_total" "$avg_response"

        if [ "$breached" -eq 1 ]; then
            echo "     └─ 🚨 SLA BREACH: $uptime% < $target% target"
        fi
    done

    echo ""
    echo "  Summary: $total_customers customers, $total_healthy healthy, $total_breaches breaches"
}

# --- Report ---
cmd_report() {
    local target_customer="$1" month="$2" format="$3"

    if [ -z "$month" ]; then
        month="$(date -u +%Y-%m)"
    fi

    echo "=============================================="
    echo "  AfrexAI — Monthly SLA Report: $month"
    echo "=============================================="
    echo ""

    printf "  %-28s %-10s %-8s %-8s %-10s %-8s\n" "CUSTOMER" "TIER" "TARGET" "ACTUAL" "STATUS" "BREACHES"
    printf "  %-28s %-10s %-8s %-8s %-10s %-8s\n" "----------------------------" "----------" "--------" "--------" "----------" "--------"

    local total_customers=0 total_breaches=0

    for cdir in "$CUSTOMERS_DIR"/*/; do
        [ -f "$cdir/config/manifest.json" ] || continue
        local cid
        cid="$(basename "$cdir")"
        if [ -n "$target_customer" ] && [ "$cid" != "$target_customer" ]; then continue; fi

        local m="$cdir/config/manifest.json"
        local tier
        tier="$(read_json_field "$m" "tier")"
        local target
        target="$(sla_target "$tier")"

        local actual="100.0" breaches=0
        if [ -f "$cdir/monitoring/sla.json" ]; then
            actual="$(read_json_field "$cdir/monitoring/sla.json" "current_uptime")"
            breaches="$(read_json_field "$cdir/monitoring/sla.json" "breaches_this_month")"
        fi

        local status="✅ Met"
        local target_int actual_int
        target_int="$(echo "$target" | cut -d. -f1)"
        actual_int="$(echo "$actual" | cut -d. -f1)"
        if [ "$actual_int" -lt "$target_int" ]; then
            status="❌ Breach"
        fi

        printf "  %-28s %-10s %-8s %-8s %-10s %-8s\n" "$cid" "$tier" "${target}%" "${actual}%" "$status" "${breaches:-0}"

        total_customers=$((total_customers + 1))
        total_breaches=$((total_breaches + ${breaches:-0}))
    done

    echo ""
    echo "  Report period: $month"
    echo "  Customers: $total_customers"
    echo "  Total breaches: $total_breaches"
    echo ""
    echo "  Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

# --- Breaches ---
cmd_breaches() {
    echo "=============================================="
    echo "  AfrexAI — SLA Breaches"
    echo "=============================================="
    echo ""

    if [ -f "$ALERTS_LOG" ]; then
        local count
        count="$(wc -l < "$ALERTS_LOG" | tr -d ' ')"
        echo "  $count breach event(s) recorded:"
        echo ""
        while IFS= read -r line; do
            local cid ts
            cid="$(echo "$line" | sed -n 's/.*"customer_id":"\([^"]*\)".*/\1/p')"
            ts="$(echo "$line" | sed -n 's/.*"timestamp":"\([^"]*\)".*/\1/p')"
            local actual target
            actual="$(echo "$line" | sed -n 's/.*"actual":\([0-9.]*\).*/\1/p')"
            target="$(echo "$line" | sed -n 's/.*"target":\([0-9.]*\).*/\1/p')"
            echo "  🚨 $ts  $cid  actual: ${actual}% < target: ${target}%"
        done < "$ALERTS_LOG"
    else
        echo "  No breaches recorded. 🎉"
    fi
}

# --- Dashboard ---
cmd_dashboard() {
    echo "=============================================="
    echo "  AfrexAI — SLA Dashboard"
    echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "=============================================="
    echo ""

    local total=0 meeting=0 breaching=0

    for cdir in "$CUSTOMERS_DIR"/*/; do
        [ -f "$cdir/config/manifest.json" ] || continue
        local cid
        cid="$(basename "$cdir")"
        local m="$cdir/config/manifest.json"
        local tier
        tier="$(read_json_field "$m" "tier")"
        local target
        target="$(sla_target "$tier")"

        local actual="100.0"
        if [ -f "$cdir/monitoring/sla.json" ]; then
            actual="$(read_json_field "$cdir/monitoring/sla.json" "current_uptime")"
        fi

        total=$((total + 1))
        local target_int actual_int
        target_int="$(echo "$target" | cut -d. -f1)"
        actual_int="$(echo "$actual" | cut -d. -f1)"

        local bar="" i=0 fill
        fill="$(echo "$actual" | cut -d. -f1)"
        fill=$((fill / 5))  # 20 char bar
        while [ "$i" -lt 20 ]; do
            if [ "$i" -lt "$fill" ]; then bar="${bar}█"; else bar="${bar}░"; fi
            i=$((i + 1))
        done

        local icon="✅"
        if [ "$actual_int" -lt "$target_int" ]; then
            icon="🚨"
            breaching=$((breaching + 1))
        else
            meeting=$((meeting + 1))
        fi

        printf "  %s %-24s %s %s%%  (target: %s%%)\n" "$icon" "$cid" "$bar" "$actual" "$target"
    done

    echo ""
    echo "  Total: $total | Meeting SLA: $meeting | Breaching: $breaching"
}

# --- Parse args ---
COMMAND="" CUSTOMER="" MONTH="" FORMAT="table"

while [ $# -gt 0 ]; do
    case "$1" in
        check|report|breaches|dashboard) COMMAND="$1"; shift ;;
        --customer) CUSTOMER="$2"; shift 2 ;;
        --month)    MONTH="$2"; shift 2 ;;
        --format)   FORMAT="$2"; shift 2 ;;
        -h|--help)  usage 0 ;;
        *)          echo "Unknown: $1" >&2; usage 1 ;;
    esac
done

[ -n "$COMMAND" ] || usage 1

case "$COMMAND" in
    check)     cmd_check "$CUSTOMER" ;;
    report)    cmd_report "$CUSTOMER" "$MONTH" "$FORMAT" ;;
    breaches)  cmd_breaches ;;
    dashboard) cmd_dashboard ;;
esac
