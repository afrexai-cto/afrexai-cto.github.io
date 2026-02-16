#!/bin/bash
# customer-health-dashboard.sh — Monitor all customer agents
# Iterates over aaas-platform/customers/ and reports health per customer
# Usage: ./customer-health-dashboard.sh [--json] [--customer <slug>]
# Bash 3.2 compatible

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLATFORM_DIR="$(cd "$SCRIPT_DIR/../../aaas-platform" && pwd)"
CUSTOMERS_DIR="$PLATFORM_DIR/customers"
REPORT_DIR="$SCRIPT_DIR/reports"
LOG_FILE="$SCRIPT_DIR/deploy.log"

# Also check legacy version dir for backwards compat
VERSION_DIR="$SCRIPT_DIR/versions"

OUTPUT_FORMAT="markdown"
FILTER_CUSTOMER=""
SSH_TIMEOUT=10

while [ $# -gt 0 ]; do
    case "$1" in
        --json) OUTPUT_FORMAT="json"; shift ;;
        --customer) FILTER_CUSTOMER="$2"; shift 2 ;;
        --help|-h)
            echo "Usage: $0 [--json] [--customer <slug>]"
            echo ""
            echo "Iterates over all customers in aaas-platform/customers/ and reports health."
            echo ""
            echo "Options:"
            echo "  --json              Output as JSON"
            echo "  --customer SLUG     Check only one customer"
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

# Counters
TOTAL=0
HEALTHY=0
DEGRADED=0
UNHEALTHY=0
UNREACHABLE=0

RESULTS_FILE="$(mktemp)"
trap 'rm -f "$RESULTS_FILE"' EXIT

read_json_field() {
    local file="$1" field="$2"
    sed -n "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^,\"}]*\)\"\{0,1\}.*/\1/p" "$file" | head -1
}

log "=== Health Dashboard Scan ==="

# Iterate over all customers in aaas-platform/customers/
for cdir in "$CUSTOMERS_DIR"/*/; do
    [ -d "$cdir" ] || continue

    CUSTOMER_SLUG="$(basename "$cdir")"

    # Skip if filtering and not matching
    if [ -n "$FILTER_CUSTOMER" ] && [ "$CUSTOMER_SLUG" != "$FILTER_CUSTOMER" ]; then
        continue
    fi

    # Must have profile.json
    if [ ! -f "$cdir/profile.json" ]; then
        log "WARN: $CUSTOMER_SLUG has no profile.json, skipping"
        continue
    fi

    local_profile="$cdir/profile.json"
    COMPANY="$(read_json_field "$local_profile" "company")"
    [ -z "$COMPANY" ] && COMPANY="$(read_json_field "$local_profile" "company_name")"
    TIER="$(read_json_field "$local_profile" "package")"
    [ -z "$TIER" ] && TIER="$(read_json_field "$local_profile" "tier")"
    STATUS="$(read_json_field "$local_profile" "status")"

    # Read agents from agent-manifest.json
    if [ -f "$cdir/agent-manifest.json" ]; then
        agent_data="$(python3 -c "
import json
m = json.load(open('$cdir/agent-manifest.json'))
for a in m.get('agents', []):
    print(f\"{a['slug']}|{a.get('name', a['slug'])}|{a.get('type','unknown')}|{a.get('status','unknown')}\")
" 2>/dev/null || true)"

        if [ -z "$agent_data" ]; then
            # No agents found
            TOTAL=$((TOTAL + 1))
            HEALTH_STATUS="healthy"
            HEALTHY=$((HEALTHY + 1))
            echo "${CUSTOMER_SLUG}|${COMPANY}|(no agents)||${TIER}|${HEALTH_STATUS}||✅|" >> "$RESULTS_FILE"
            log "Checked ${CUSTOMER_SLUG}: no agents"
            continue
        fi

        while IFS='|' read -r aslug aname atype astatus; do
            [ -z "$aslug" ] && continue
            TOTAL=$((TOTAL + 1))

            HEALTH_STATUS="healthy"
            HEALTH_ERRORS=""
            VERSION="—"
            SSH_HOST="—"

            # Check agent directory health
            local agent_dir="$cdir/agents/$aslug"
            if [ -d "$agent_dir" ]; then
                # Check for required files
                for required_file in SOUL.md; do
                    if [ ! -f "$agent_dir/$required_file" ]; then
                        HEALTH_STATUS="degraded"
                        HEALTH_ERRORS="${HEALTH_ERRORS}missing:$required_file "
                    fi
                done
            else
                HEALTH_STATUS="degraded"
                HEALTH_ERRORS="agent_dir_missing "
            fi

            # If agent status from manifest is not active, flag it
            if [ "$astatus" != "active" ] && [ "$astatus" != "running" ]; then
                HEALTH_STATUS="unhealthy"
                HEALTH_ERRORS="${HEALTH_ERRORS}status:$astatus "
            fi

            # Also check legacy version files for SSH-deployed agents
            local vfile="$VERSION_DIR/${CUSTOMER_SLUG}-${atype}.json"
            if [ -f "$vfile" ]; then
                SSH_HOST="$(read_json_field "$vfile" "ssh_host")"
                VERSION="$(read_json_field "$vfile" "current_version")"

                # If SSH host exists, try remote health check
                if [ -n "$SSH_HOST" ] && [ "$SSH_HOST" != "—" ]; then
                    REMOTE_HEALTH="$(ssh -o ConnectTimeout=$SSH_TIMEOUT -o StrictHostKeyChecking=no -o BatchMode=yes \
                        "$SSH_HOST" '/opt/afrexai-agent/health-check.sh' 2>/dev/null || echo '{"status":"unreachable","errors":"ssh_failed"}')"
                    REMOTE_STATUS="$(echo "$REMOTE_HEALTH" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')"
                    REMOTE_ERRORS="$(echo "$REMOTE_HEALTH" | sed -n 's/.*"errors":"\([^"]*\)".*/\1/p')"
                    if [ -n "$REMOTE_STATUS" ]; then
                        HEALTH_STATUS="$REMOTE_STATUS"
                        HEALTH_ERRORS="$REMOTE_ERRORS"
                    fi
                fi
            fi

            case "$HEALTH_STATUS" in
                healthy) HEALTHY=$((HEALTHY + 1)); EMOJI="✅" ;;
                degraded) DEGRADED=$((DEGRADED + 1)); EMOJI="⚠️" ;;
                unhealthy) UNHEALTHY=$((UNHEALTHY + 1)); EMOJI="❌" ;;
                *) UNREACHABLE=$((UNREACHABLE + 1)); HEALTH_STATUS="unreachable"; EMOJI="🔌" ;;
            esac

            echo "${CUSTOMER_SLUG}|${aname}|${atype}|${SSH_HOST}|${TIER}|${HEALTH_STATUS}|${HEALTH_ERRORS}|${EMOJI}|${VERSION}" >> "$RESULTS_FILE"
            log "Checked ${CUSTOMER_SLUG}/${aslug}: ${HEALTH_STATUS}"
        done <<< "$agent_data"
    else
        # No agent-manifest.json
        TOTAL=$((TOTAL + 1))
        HEALTHY=$((HEALTHY + 1))
        echo "${CUSTOMER_SLUG}|${COMPANY}|(no manifest)||${TIER}|healthy||✅|" >> "$RESULTS_FILE"
        log "Checked ${CUSTOMER_SLUG}: no agent-manifest.json"
    fi
done

# --- Generate report ---
SCAN_TIME="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"

if [ "$OUTPUT_FORMAT" = "json" ]; then
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
    while IFS='|' read -r c a t h tier s e em v; do
        if [ "$FIRST" = "true" ]; then FIRST=false; else echo "    ," >> "$REPORT_FILE"; fi
        echo "    {\"customer\":\"$c\",\"agent\":\"$a\",\"type\":\"$t\",\"host\":\"$h\",\"tier\":\"$tier\",\"status\":\"$s\",\"errors\":\"$e\",\"version\":\"$v\"}" >> "$REPORT_FILE"
    done < "$RESULTS_FILE"

    echo "  ]" >> "$REPORT_FILE"
    echo "}" >> "$REPORT_FILE"
else
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

| Status | Customer | Agent | Type | Tier | Host | Errors |
|--------|----------|-------|------|------|------|--------|
EOF

    while IFS='|' read -r c a t h tier s e em v; do
        echo "| ${em} ${s} | ${c} | ${a} | ${t} | ${tier} | ${h} | ${e:-—} |" >> "$REPORT_FILE"
    done < "$RESULTS_FILE"

    if [ $UNHEALTHY -gt 0 ] || [ $UNREACHABLE -gt 0 ]; then
        echo "" >> "$REPORT_FILE"
        echo "## ⚠️ Issues Requiring Attention" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        while IFS='|' read -r c a t h tier s e em v; do
            if [ "$s" = "unhealthy" ] || [ "$s" = "unreachable" ]; then
                echo "- **${c}/${a}** (${h}): ${s} — ${e:-no details}" >> "$REPORT_FILE"
            fi
        done < "$RESULTS_FILE"
    fi

    if [ $DEGRADED -gt 0 ]; then
        echo "" >> "$REPORT_FILE"
        echo "## ⚡ Degraded Agents" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        while IFS='|' read -r c a t h tier s e em v; do
            if [ "$s" = "degraded" ]; then
                echo "- **${c}/${a}** (${h}): ${e:-no details}" >> "$REPORT_FILE"
            fi
        done < "$RESULTS_FILE"
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
echo "Scanned: $TOTAL agents across $(ls -1d "$CUSTOMERS_DIR"/*/ 2>/dev/null | wc -l | tr -d ' ') customers"
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
