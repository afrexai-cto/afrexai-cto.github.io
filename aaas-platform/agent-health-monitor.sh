#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# AfrexAI Agent Health Monitor
# Usage: ./agent-health-monitor.sh [customer_slug]
# ============================================================================

PLATFORM_DIR="$(cd "$(dirname "$0")" && pwd)"
CUSTOMERS_DIR="${PLATFORM_DIR}/customers"
REPORTS_DIR="${PLATFORM_DIR}/reports"
REPORT_FILE="${REPORTS_DIR}/health-$(date -u +%Y-%m-%d).md"

mkdir -p "$REPORTS_DIR"

TARGET_CUSTOMER="${1:-}"
TOTAL=0; HEALTHY=0; WARNING=0; CRITICAL=0
NOW_EPOCH=$(date +%s)

file_age_hours() {
  if [ -f "$1" ]; then
    local mod; mod=$(stat -f %m "$1" 2>/dev/null || stat -c %Y "$1" 2>/dev/null || echo 0)
    echo $(( (NOW_EPOCH - mod) / 3600 ))
  else echo "-1"; fi
}

file_size_kb() {
  if [ -f "$1" ]; then
    local b; b=$(stat -f %z "$1" 2>/dev/null || stat -c %s "$1" 2>/dev/null || echo 0)
    echo $(( b / 1024 ))
  else echo "0"; fi
}

{
  echo "# 🏥 Agent Health Report"
  echo "**Generated:** $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo ""
} > "$REPORT_FILE"

if [ -n "$TARGET_CUSTOMER" ]; then
  SCAN_DIRS="${CUSTOMERS_DIR}/${TARGET_CUSTOMER}"
else
  SCAN_DIRS="${CUSTOMERS_DIR}/*"
fi

for CUST_DIR in $SCAN_DIRS; do
  [ -d "$CUST_DIR" ] || continue
  CUST_NAME=$(basename "$CUST_DIR")
  [ -d "${CUST_DIR}/agents" ] || continue

  echo "## 🏢 ${CUST_NAME}" >> "$REPORT_FILE"
  echo "| Agent | Status | Memory KB | Last Output | Queue |" >> "$REPORT_FILE"
  echo "|-------|--------|-----------|-------------|-------|" >> "$REPORT_FILE"

  for AGENT_DIR in "${CUST_DIR}/agents"/*/; do
    [ -d "$AGENT_DIR" ] || continue
    TOTAL=$((TOTAL + 1))
    SLUG=$(basename "$AGENT_DIR")
    MEM_KB=$(file_size_kb "${AGENT_DIR}/MEMORY.md")

    LAST_OUT=$(ls -t "${AGENT_DIR}/output/"* 2>/dev/null | head -1 || true)
    if [ -n "$LAST_OUT" ]; then
      AGE=$(file_age_hours "$LAST_OUT")
    else
      AGE=-1
    fi

    QUEUE=$(find "${AGENT_DIR}/input" -type f 2>/dev/null | wc -l | tr -d ' ')

    if [ "$AGE" = "-1" ]; then
      ST="🔵 New"; HEALTHY=$((HEALTHY+1)); AGE_DISP="never"
    elif [ "$AGE" -gt 48 ]; then
      ST="🔴 Critical"; CRITICAL=$((CRITICAL+1)); AGE_DISP="${AGE}h"
    elif [ "$AGE" -gt 24 ]; then
      ST="🟡 Warning"; WARNING=$((WARNING+1)); AGE_DISP="${AGE}h"
    else
      ST="🟢 Healthy"; HEALTHY=$((HEALTHY+1)); AGE_DISP="${AGE}h"
    fi

    echo "| ${SLUG} | ${ST} | ${MEM_KB} | ${AGE_DISP} | ${QUEUE} |" >> "$REPORT_FILE"
  done
  echo "" >> "$REPORT_FILE"
done

{
  echo "## Summary"
  echo "Total: ${TOTAL} | 🟢 ${HEALTHY} | 🟡 ${WARNING} | 🔴 ${CRITICAL}"
} >> "$REPORT_FILE"

echo "🏥 Health: ${TOTAL} agents | 🟢 ${HEALTHY} | 🟡 ${WARNING} | 🔴 ${CRITICAL}"
echo "Report: ${REPORT_FILE}"
