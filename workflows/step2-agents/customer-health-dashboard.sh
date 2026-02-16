#!/bin/bash
# customer-health-dashboard.sh — Monitor all customer agents
# Usage: ./customer-health-dashboard.sh [--json] [--customer <name>]
# Bash 3.2 compatible

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION_DIR="$SCRIPT_DIR/versions"
REPORT_DIR="$SCRIPT_DIR/reports"
LOG_FILE="$SCRIPT_DIR/deploy.log"

OUTPUT_FORMAT="markdown"
FILTER_CUSTOMER=""
SSH_TIMEOUT=10

# Parse args
while [ $# -gt 0 ]; do
    case "$1" in
        --json) OUTPUT_FORMAT="json"; shift ;;
        --customer) FILTER_CUSTOMER="$2"; shift 2 ;;
        --help|-h)
            echo "Usage: $0 [--json] [--customer <name>]"
            echo ""
            echo "Polls all deployed customer agents and generates a health report."
            echo ""
            echo "Options:"
            echo "  --json           Output as JSON"
            echo "  --customer NAME  Check only one customer"
            exit 0
            ;;
        *) shift ;;
    esac
done

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

mkdir -p "$REPORT_DIR"

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
REPORT_FILE="$REPORT_DIR/health-${TIMESTAMP}"

# --- Collect agent data ---
TOTAL=0
HEALTHY=0
DEGRADED=0
UNHEALTHY=0
UNREACHABLE=0

# Arrays (bash 3.2 compatible — use temp files)
RESULTS_FILE="$(mktemp)"
trap 'rm -f "$RESULTS_FILE"' EXIT

get_json_val() {
    local key="$1"
    local data="$2"
    echo "$data" | tr ',' '\n' | tr '{' '\n' | tr '}' '\n' | grep "\"$key\"" | head -1 | sed 's/.*: *"\{0,1\}\([^",}]*\)"\{0,1\}.*/\1/' || echo ""
}

log "=== Health Dashboard Scan ==="

# Iterate version files (each = one deployed agent)
for vfile in "$VERSION_DIR"/*.json; do
    [ -f "$vfile" ] || continue

    CUSTOMER="$(get_json_val 'customer' "$(cat "$vfile")")"
    AGENT_TYPE="$(get_json_val 'agent_type' "$(cat "$vfile")")"
    SSH_HOST="$(get_json_val 'ssh_host' "$(cat "$vfile")")"
    VERSION="$(get_json_val 'current_version' "$(cat "$vfile")")"
    DEPLOYED="$(get_json_val 'deployed_at' "$(cat "$vfile")")"

    # Filter if specified
    if [ -n "$FILTER_CUSTOMER" ] && [ "$CUSTOMER" != "$FILTER_CUSTOMER" ]; then
        continue
    fi

    TOTAL=$((TOTAL + 1))

    # Poll health via SSH
    HEALTH_STATUS="unreachable"
    HEALTH_VERSION="unknown"
    HEALTH_ERRORS=""
    HEALTH_RAW=""

    if [ -n "$SSH_HOST" ]; then
        HEALTH_RAW="$(ssh -o ConnectTimeout=$SSH_TIMEOUT -o StrictHostKeyChecking=no -o BatchMode=yes \
            "$SSH_HOST" '/opt/afrexai-agent/health-check.sh' 2>/dev/null || echo '{"status":"unreachable","errors":"ssh_failed"}')"

        HEALTH_STATUS="$(get_json_val 'status' "$HEALTH_RAW")"
        HEALTH_VERSION="$(get_json_val 'version' "$HEALTH_RAW")"
        HEALTH_ERRORS="$(get_json_val 'errors' "$HEALTH_RAW")"
    fi

    case "$HEALTH_STATUS" in
        healthy) HEALTHY=$((HEALTHY + 1)) ;;
        degraded) DEGRADED=$((DEGRADED + 1)) ;;
        unhealthy) UNHEALTHY=$((UNHEALTHY + 1)) ;;
        *) UNREACHABLE=$((UNREACHABLE + 1)); HEALTH_STATUS="unreachable" ;;
    esac

    # Status emoji
    case "$HEALTH_STATUS" in
        healthy) EMOJI="✅" ;;
        degraded) EMOJI="⚠️" ;;
        unhealthy) EMOJI="❌" ;;
        *) EMOJI="🔌" ;;
    esac

    echo "${CUSTOMER}|${AGENT_TYPE}|${SSH_HOST}|${VERSION}|${HEALTH_VERSION}|${HEALTH_STATUS}|${HEALTH_ERRORS}|${EMOJI}|${DEPLOYED}" >> "$RESULTS_FILE"

    log "Checked ${CUSTOMER}/${AGENT_TYPE}: ${HEALTH_STATUS}"
done

# --- Generate report ---
SCAN_TIME="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"

if [ "$OUTPUT_FORMAT" = "json" ]; then
    # JSON output
    REPORT_FILE="${REPORT_FILE}.json"
    echo "{" > "$REPORT_FILE"
    echo "  \"scan_time\": \"$SCAN_TIME\"," >> "$REPORT_FILE"
    echo "  \"summary\": {" >> "$REPORT_FILE"
    echo "    \"total\": $TOTAL," >> "$REPORT_FILE"
    echo "    \"healthy\": $HEALTHY," >> "$REPORT_FILE"
    echo "    \"degraded\": $DEGRADED," >> "$REPORT_FILE"
    echo "    \"unhealthy\": $UNHEALTHY," >> "$REPORT_FILE"
    echo "    \"unreachable\": $UNREACHABLE" >> "$REPORT_FILE"
    echo "  }," >> "$REPORT_FILE"
    echo "  \"agents\": [" >> "$REPORT_FILE"

    FIRST=true
    while IFS='|' read -r c a h v hv s e em d; do
        if [ "$FIRST" = "true" ]; then FIRST=false; else echo "    ," >> "$REPORT_FILE"; fi
        echo "    {\"customer\":\"$c\",\"agent\":\"$a\",\"host\":\"$h\",\"deployed_version\":\"$v\",\"running_version\":\"$hv\",\"status\":\"$s\",\"errors\":\"$e\",\"deployed_at\":\"$d\"}" >> "$REPORT_FILE"
    done < "$RESULTS_FILE"

    echo "  ]" >> "$REPORT_FILE"
    echo "}" >> "$REPORT_FILE"

else
    # Markdown output
    REPORT_FILE="${REPORT_FILE}.md"

    cat > "$REPORT_FILE" << EOF
# 🏥 Customer Agent Health Dashboard

**Scan Time:** ${SCAN_TIME}

## Summary

| Metric | Count |
|--------|-------|
| Total Agents | ${TOTAL} |
| ✅ Healthy | ${HEALTHY} |
| ⚠️ Degraded | ${DEGRADED} |
| ❌ Unhealthy | ${UNHEALTHY} |
| 🔌 Unreachable | ${UNREACHABLE} |

## Agent Status

| Status | Customer | Agent | Host | Version (deployed) | Version (running) | Errors |
|--------|----------|-------|------|--------------------|--------------------|--------|
EOF

    while IFS='|' read -r c a h v hv s e em d; do
        echo "| ${em} ${s} | ${c} | ${a} | ${h} | ${v} | ${hv} | ${e:-—} |" >> "$REPORT_FILE"
    done < "$RESULTS_FILE"

    # Flag issues
    if [ $UNHEALTHY -gt 0 ] || [ $UNREACHABLE -gt 0 ]; then
        echo "" >> "$REPORT_FILE"
        echo "## ⚠️ Issues Requiring Attention" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        while IFS='|' read -r c a h v hv s e em d; do
            if [ "$s" = "unhealthy" ] || [ "$s" = "unreachable" ]; then
                echo "- **${c}/${a}** (${h}): ${s} — ${e:-no details}" >> "$REPORT_FILE"
            fi
        done < "$RESULTS_FILE"
    fi

    if [ $DEGRADED -gt 0 ]; then
        echo "" >> "$REPORT_FILE"
        echo "## ⚡ Degraded Agents" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        while IFS='|' read -r c a h v hv s e em d; do
            if [ "$s" = "degraded" ]; then
                echo "- **${c}/${a}** (${h}): ${e:-no details}" >> "$REPORT_FILE"
            fi
        done < "$RESULTS_FILE"
    fi

    # Version mismatch check
    MISMATCHES=""
    while IFS='|' read -r c a h v hv s e em d; do
        if [ "$v" != "$hv" ] && [ "$hv" != "unknown" ] && [ "$s" != "unreachable" ]; then
            MISMATCHES="${MISMATCHES}\n- **${c}/${a}**: deployed=${v}, running=${hv}"
        fi
    done < "$RESULTS_FILE"

    if [ -n "$MISMATCHES" ]; then
        echo "" >> "$REPORT_FILE"
        echo "## 🔄 Version Mismatches" >> "$REPORT_FILE"
        printf "%b\n" "$MISMATCHES" >> "$REPORT_FILE"
    fi

    echo "" >> "$REPORT_FILE"
    echo "---" >> "$REPORT_FILE"
    echo "*Generated by AfrexAI Health Dashboard*" >> "$REPORT_FILE"
fi

# --- Output ---
echo ""
echo "============================================"
echo "  HEALTH DASHBOARD"
echo "============================================"
echo ""
echo "Scanned: $TOTAL agents"
echo "✅ Healthy: $HEALTHY  ⚠️ Degraded: $DEGRADED  ❌ Unhealthy: $UNHEALTHY  🔌 Unreachable: $UNREACHABLE"
echo ""
echo "Report: $REPORT_FILE"

if [ "$OUTPUT_FORMAT" = "json" ]; then
    cat "$REPORT_FILE"
else
    echo ""
    cat "$REPORT_FILE"
fi

log "Dashboard report: $REPORT_FILE"
