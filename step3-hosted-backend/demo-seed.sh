#!/usr/bin/env bash
set -euo pipefail
# demo-seed.sh — Seed 3 demo tenants with 3 months of historical data
# Tenants: Hartwell Associates (legal), Summit Financial (finance), Meridian Health (healthcare)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🌱 Seeding AfrexAI Step 3 demo tenants..."
echo ""

# Clean previous demo data
rm -rf "$SCRIPT_DIR/tenants"

# Provision the 3 demo tenants
echo "=== Provisioning tenants ==="
bash "$SCRIPT_DIR/provision-tenant.sh" "Hartwell Associates" "ops@hartwelllaw.com" "growth" "legal"
bash "$SCRIPT_DIR/provision-tenant.sh" "Summit Financial" "admin@summitfin.com" "enterprise" "finance"
bash "$SCRIPT_DIR/provision-tenant.sh" "Meridian Health" "tech@meridianhealth.org" "starter" "healthcare"
echo ""

# Start all agents
echo "=== Starting agents ==="
bash "$SCRIPT_DIR/agent-lifecycle.sh" "hartwell-associates" "start"
bash "$SCRIPT_DIR/agent-lifecycle.sh" "summit-financial" "start"
bash "$SCRIPT_DIR/agent-lifecycle.sh" "meridian-health" "start"
echo ""

# Generate 3 months of usage data (approx 90 days back from today)
echo "=== Generating 3 months of usage data ==="
TENANTS=("hartwell-associates" "summit-financial" "meridian-health")

for tenant in "${TENANTS[@]}"; do
  echo "  Generating data for ${tenant}..."
  # Reset usage counters for historical generation
  python3 -c "
import datetime, json

# Generate dates for last 3 months
today = datetime.date(2026, 2, 21)
start = today - datetime.timedelta(days=90)
current = start
dates = []
while current <= today:
    dates.append(current.isoformat())
    current += datetime.timedelta(days=1)

for d in dates:
    print(d)
" | while read -r date_str; do
    # Reset current.json each month boundary to avoid double-counting
    MONTH="$(echo "$date_str" | cut -c1-7)"
    PREV_MONTH=""
    CURRENT_FILE="$SCRIPT_DIR/tenants/${tenant}/usage/current.json"

    if [[ -f "$CURRENT_FILE" ]]; then
      PREV_MONTH="$(jq -r '.period' "$CURRENT_FILE")"
    fi

    if [[ "$MONTH" != "$PREV_MONTH" ]]; then
      # Archive previous month if exists and has data
      if [[ -n "$PREV_MONTH" && "$PREV_MONTH" != "null" ]]; then
        cp "$CURRENT_FILE" "$SCRIPT_DIR/tenants/${tenant}/usage/month-${PREV_MONTH}.json" 2>/dev/null || true
      fi
      # Reset for new month
      cat > "$CURRENT_FILE" <<RESET
{
  "tenant_id": "${tenant}",
  "period": "${MONTH}",
  "tasks_completed": 0,
  "tokens_used": 0,
  "emails_sent": 0,
  "documents_processed": 0,
  "api_calls": 0,
  "last_updated": "${date_str}T00:00:00Z"
}
RESET
    fi

    bash "$SCRIPT_DIR/usage-tracker.sh" "$tenant" "$date_str" 2>/dev/null
  done
  echo "    ✅ Done"
done
echo ""

# Generate billing for current month
echo "=== Billing summaries ==="
for tenant in "${TENANTS[@]}"; do
  echo "--- ${tenant} ---"
  bash "$SCRIPT_DIR/billing-calculator.sh" "$tenant" "2026-02" | jq '.invoice | {company, period, tier, total, currency}'
  echo ""
done

# SLA checks
echo "=== SLA Status ==="
for tenant in "${TENANTS[@]}"; do
  bash "$SCRIPT_DIR/sla-monitor.sh" "$tenant" | jq '.sla_report | {tenant_id, uptime_pct, sla_met, agents_healthy, agents_total}'
done
echo ""

# Dashboard overview
echo "=== Dashboard Overviews ==="
for tenant in "${TENANTS[@]}"; do
  echo "--- ${tenant} ---"
  bash "$SCRIPT_DIR/tenant-dashboard-api.sh" "$tenant" "overview" | jq .
  echo ""
done

echo "🎉 Demo seed complete! 3 tenants provisioned with 90 days of data."
echo "   Tenants directory: $SCRIPT_DIR/tenants/"
ls -la "$SCRIPT_DIR/tenants/"
