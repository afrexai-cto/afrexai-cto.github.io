#!/usr/bin/env bash
# pricing-engine.sh — Calculate costs, discounts, and invoices for AfrexAI Hosted Agents
# Reads ALL pricing from aaas-platform/pricing.json — no hardcoded values.
# Bash 3.2 compatible
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="${AFREX_DATA_DIR:-$SCRIPT_DIR/data}"
CUSTOMERS_DIR="$DATA_DIR/customers"
INVOICES_DIR="$DATA_DIR/invoices"

# --- Load pricing from pricing.json ---
PRICING_FILE="$(cd "$SCRIPT_DIR/../../aaas-platform" && pwd)/pricing.json"

if [ ! -f "$PRICING_FILE" ]; then
    echo "ERROR: pricing.json not found at $PRICING_FILE" >&2
    exit 1
fi

load_pricing() {
    eval "$(python3 -c "
import json
p = json.load(open('${PRICING_FILE}'))
for t, v in p['tiers'].items():
    safe = t.upper().replace('-','_')
    print(f'{safe}_PRICE={v[\"price\"]}')
    print(f'{safe}_AGENTS={v[\"agents\"]}')
print(f'OVERAGE_PER_AGENT={p[\"overage_per_agent\"]}')
print(f'ANNUAL_DISCOUNT={p[\"annual_discount_pct\"]}')
for v, pct in p['vertical_premiums'].items():
    safe = v.upper().replace('-','_')
    print(f'VERTICAL_PREMIUM_{safe}={pct}')
for s, cost in p['support_addons'].items():
    safe = s.upper().replace('-','_')
    print(f'SUPPORT_{safe}={cost}')
")"
}
load_pricing

read_json_field() {
    local file="$1" field="$2"
    sed -n "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^,\"}]*\)\"\{0,1\}.*/\1/p" "$file" | head -1
}

usage() {
    cat <<EOF
Usage: $0 <command> [options]

Commands:
  quote           Generate a price quote for a prospect
  invoice         Generate monthly invoice for a customer
  invoice-all     Generate invoices for all active customers
  compare         Compare tier pricing for a given need
  revenue         Revenue report across all customers

Options:
  --tier <tier>           Tier: starter, growth, scale, enterprise
  --agents <n>            Number of agents needed
  --vertical <v>          Industry vertical
  --annual                Annual billing (${ANNUAL_DISCOUNT}% discount)
  --customer <id>         Customer ID (for invoice)
  --month <YYYY-MM>       Invoice month (default: current)
  --extra-tasks <n>       Extra task volume above base (usage-based)
  --support <level>       Support: standard, priority, dedicated
  -h, --help              Show this help

All prices in USD. Pricing loaded from: $PRICING_FILE

Examples:
  $0 quote --tier growth --vertical legal
  $0 quote --agents 5 --vertical finance --annual
  $0 invoice --customer cust-acme-123
  $0 invoice-all --month 2026-02
  $0 compare --agents 4
  $0 revenue
EOF
    exit "${1:-0}"
}

tier_base_price() {
    local var="${1^^}_PRICE"
    var="${var//-/_}"
    echo "${!var:-0}"
}

tier_included_agents() {
    local var="${1^^}_AGENTS"
    var="${var//-/_}"
    echo "${!var:-0}"
}

best_tier_for_agents() {
    local n="$1"
    # Find cheapest tier that includes enough agents
    python3 -c "
import json
p = json.load(open('${PRICING_FILE}'))
n = $n
best = None
for t, v in sorted(p['tiers'].items(), key=lambda x: x[1]['price']):
    if v['agents'] >= n:
        best = t
        break
if best:
    print(best)
else:
    # Largest tier
    print(sorted(p['tiers'].items(), key=lambda x: x[1]['price'])[-1][0])
"
}

vertical_premium_pct() {
    local var="VERTICAL_PREMIUM_${1^^}"
    var="${var//-/_}"
    echo "${!var:-0}"
}

support_addon() {
    local var="SUPPORT_${1^^}"
    var="${var//-/_}"
    echo "${!var:-0}"
}

# --- Quote ---
cmd_quote() {
    local tier="$1" agents="$2" vertical="$3" annual="$4" support="$5" extra_tasks="$6"

    if [ -z "$tier" ] && [ "$agents" -gt 0 ]; then
        tier="$(best_tier_for_agents "$agents")"
    fi
    if [ -z "$tier" ]; then
        echo "Error: --tier or --agents required." >&2; exit 1
    fi

    local base included
    base="$(tier_base_price "$tier")"
    included="$(tier_included_agents "$tier")"
    if [ "$agents" -eq 0 ]; then agents="$included"; fi

    local overage_agents=0 overage_cost=0
    if [ "$agents" -gt "$included" ]; then
        overage_agents=$((agents - included))
        overage_cost=$((overage_agents * OVERAGE_PER_AGENT))
    fi

    local vpct
    vpct="$(vertical_premium_pct "$vertical")"
    local vpremium=$(( (base + overage_cost) * vpct / 100 ))

    local support_cost
    support_cost="$(support_addon "$support")"

    local task_overage_cost=0
    if [ "$extra_tasks" -gt 0 ]; then
        task_overage_cost=$((extra_tasks / 2))
    fi

    local monthly_subtotal=$((base + overage_cost + vpremium + support_cost + task_overage_cost))

    local discount=0 monthly_total="$monthly_subtotal" billing="monthly"
    if [ "$annual" -eq 1 ]; then
        discount=$((monthly_subtotal * ANNUAL_DISCOUNT / 100))
        monthly_total=$((monthly_subtotal - discount))
        billing="annual"
    fi

    local annual_total=$((monthly_total * 12))

    echo "=============================================="
    echo "  AfrexAI Hosted Agents — Price Quote (USD)"
    echo "=============================================="
    echo ""
    echo "  Tier:              $(echo "$tier" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')"
    echo "  Agents:            $agents (${included} included)"
    echo "  Vertical:          $vertical"
    echo "  Billing:           $billing"
    echo "  Support:           ${support:-standard}"
    echo ""
    echo "  ─── Pricing Breakdown ───"
    echo ""
    printf "  Base plan (%s):     \$%s/mo\n" "$tier" "$base"
    if [ "$overage_agents" -gt 0 ]; then
        printf "  Extra agents (%d × \$%s): \$%s/mo\n" "$overage_agents" "$OVERAGE_PER_AGENT" "$overage_cost"
    fi
    if [ "$vpremium" -gt 0 ]; then
        printf "  Vertical premium (%s, %d%%): \$%s/mo\n" "$vertical" "$vpct" "$vpremium"
    fi
    if [ "$support_cost" -gt 0 ]; then
        printf "  %s support:       \$%s/mo\n" "$support" "$support_cost"
    fi
    if [ "$task_overage_cost" -gt 0 ]; then
        printf "  Task overage (%d tasks): \$%s/mo\n" "$extra_tasks" "$task_overage_cost"
    fi
    echo "                          ─────────"
    printf "  Subtotal:               \$%s/mo\n" "$monthly_subtotal"
    if [ "$discount" -gt 0 ]; then
        printf "  Annual discount (%d%%):  -\$%s/mo\n" "$ANNUAL_DISCOUNT" "$discount"
    fi
    echo "                          ─────────"
    printf "  Monthly total:          \$%s/mo\n" "$monthly_total"
    printf "  Annual total:           \$%s/yr\n" "$annual_total"
    echo ""
    printf "  Per-agent cost:         \$%s/mo/agent\n" "$((monthly_total / agents))"
    echo ""
    echo "  Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

# --- Invoice ---
cmd_invoice() {
    local cid="$1" month="$2"
    local cdir="$CUSTOMERS_DIR/$cid"

    [ -d "$cdir" ] || { echo "Error: Customer $cid not found." >&2; exit 1; }

    if [ -z "$month" ]; then month="$(date -u +%Y-%m)"; fi

    local m="$cdir/config/manifest.json"
    local company tier price vertical agent_count email
    company="$(read_json_field "$m" "company_name")"
    tier="$(read_json_field "$m" "tier")"
    price="$(read_json_field "$m" "monthly_price")"
    vertical="$(read_json_field "$m" "vertical")"
    agent_count="$(read_json_field "$m" "agent_count")"
    email="$(read_json_field "$m" "email")"

    local vpct
    vpct="$(vertical_premium_pct "$vertical")"
    local vpremium=$((price * vpct / 100))
    local total=$((price + vpremium))

    local invoice_id="INV-${cid}-${month}"
    local ts
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    mkdir -p "$INVOICES_DIR/$month"
    cat > "$INVOICES_DIR/$month/${cid}.json" <<INVOICE
{
  "invoice_id": "$invoice_id",
  "customer_id": "$cid",
  "company": "$company",
  "email": "$email",
  "period": "$month",
  "tier": "$tier",
  "vertical": "$vertical",
  "agents": $agent_count,
  "line_items": [
    {"description": "$(echo "$tier" | awk '{print toupper(substr($0,1,1)) substr($0,2)}') plan — $agent_count agent(s)", "amount": $price},
    {"description": "Vertical premium ($vertical, ${vpct}%)", "amount": $vpremium}
  ],
  "subtotal": $total,
  "tax": 0,
  "total": $total,
  "currency": "USD",
  "status": "pending",
  "issued_at": "$ts",
  "due_date": "${month}-28"
}
INVOICE

    echo "  ✓ $invoice_id  $company  \$$total USD  → $INVOICES_DIR/$month/${cid}.json"
}

cmd_invoice_all() {
    local month="$1"
    if [ -z "$month" ]; then month="$(date -u +%Y-%m)"; fi

    echo "=============================================="
    echo "  AfrexAI — Invoice Generation: $month (USD)"
    echo "=============================================="
    echo ""

    local count=0 total_billed=0
    for cdir in "$CUSTOMERS_DIR"/*/; do
        [ -f "$cdir/config/manifest.json" ] || continue
        local cid status
        cid="$(basename "$cdir")"
        status="$(read_json_field "$cdir/config/manifest.json" "status")"
        if [ "$status" != "active" ]; then
            echo "  ⏭  $cid (status: $status, skipped)"
            continue
        fi
        cmd_invoice "$cid" "$month"
        local inv_total
        inv_total="$(read_json_field "$INVOICES_DIR/$month/${cid}.json" "total")"
        total_billed=$((total_billed + inv_total))
        count=$((count + 1))
    done

    echo ""
    echo "  ✅ $count invoice(s) generated. Total billed: \$$total_billed USD"
}

# --- Compare ---
cmd_compare() {
    local agents="$1"
    if [ "$agents" -eq 0 ]; then agents=1; fi

    echo "=============================================="
    echo "  AfrexAI — Tier Comparison for $agents agent(s) (USD)"
    echo "=============================================="
    echo ""
    printf "  %-14s %-10s %-12s %-12s %-10s\n" "TIER" "INCLUDED" "BASE" "OVERAGE" "TOTAL"
    printf "  %-14s %-10s %-12s %-12s %-10s\n" "--------------" "----------" "------------" "------------" "----------"

    python3 -c "
import json
p = json.load(open('${PRICING_FILE}'))
n = $agents
best = None
best_total = float('inf')
rows = []
for t in sorted(p['tiers'], key=lambda x: p['tiers'][x]['price']):
    v = p['tiers'][t]
    base = v['price']
    included = v['agents']
    overage = max(0, n - included) * p['overage_per_agent']
    total = base + overage
    if total < best_total:
        best_total = total
        best = t
    rows.append((t, included, base, overage, total))
for t, inc, base, ovg, total in rows:
    rec = ' ← best value' if t == best else ''
    print(f'  {t:14s} {inc:<10d} \${base:<11d} \${ovg:<11d} \${total:<9d}{rec}')
print()
print(f'  Recommended tier: {best}')
"
}

# --- Revenue ---
cmd_revenue() {
    echo "=============================================="
    echo "  AfrexAI — Revenue Report (USD)"
    echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "=============================================="
    echo ""

    local total_customers=0 total_agents=0 total_mrr=0

    for cdir in "$CUSTOMERS_DIR"/*/; do
        [ -f "$cdir/config/manifest.json" ] || continue
        local m="$cdir/config/manifest.json"
        local status tier agents price
        status="$(read_json_field "$m" "status")"
        [ "$status" = "active" ] || continue

        tier="$(read_json_field "$m" "tier")"
        agents="$(read_json_field "$m" "agent_count")"
        price="$(read_json_field "$m" "monthly_price")"

        total_customers=$((total_customers + 1))
        total_agents=$((total_agents + agents))
        total_mrr=$((total_mrr + price))
    done

    local arr=$((total_mrr * 12))
    local avg_mrr=0
    if [ "$total_customers" -gt 0 ]; then
        avg_mrr=$((total_mrr / total_customers))
    fi

    echo "  Active Customers:   $total_customers"
    echo "  Total Agents:       $total_agents"
    echo "  MRR:                \$$total_mrr"
    echo "  ARR:                \$$arr"
    echo "  Avg MRR/customer:   \$$avg_mrr"
    echo ""

    local target=11000000
    if [ "$arr" -gt 0 ]; then
        local pct=$((arr * 100 / target))
        echo "  🎯 \$11M ARR Target: ${pct}% (\$$arr / \$$target)"
        echo ""
        local gap=$((target - arr))
        local gap_monthly=$((gap / 12))
        echo "  Gap: \$$gap ARR (\$$gap_monthly MRR needed)"
        echo "  ≈ $((gap_monthly / ENTERPRISE_PRICE)) enterprise customers"
        echo "  ≈ $((gap_monthly / GROWTH_PRICE)) growth customers"
        echo "  ≈ $((gap_monthly / STARTER_PRICE)) starter customers"
    fi
}

# --- Parse args ---
COMMAND="" TIER="" AGENTS=0 VERTICAL="general" ANNUAL=0 CUSTOMER="" MONTH="" SUPPORT="standard" EXTRA_TASKS=0

while [ $# -gt 0 ]; do
    case "$1" in
        quote|invoice|invoice-all|compare|revenue) COMMAND="$1"; shift ;;
        --tier)         TIER="$2"; shift 2 ;;
        --agents)       AGENTS="$2"; shift 2 ;;
        --vertical)     VERTICAL="$2"; shift 2 ;;
        --annual)       ANNUAL=1; shift ;;
        --customer)     CUSTOMER="$2"; shift 2 ;;
        --month)        MONTH="$2"; shift 2 ;;
        --support)      SUPPORT="$2"; shift 2 ;;
        --extra-tasks)  EXTRA_TASKS="$2"; shift 2 ;;
        -h|--help)      usage 0 ;;
        *)              echo "Unknown: $1" >&2; usage 1 ;;
    esac
done

[ -n "$COMMAND" ] || usage 1

case "$COMMAND" in
    quote)       cmd_quote "$TIER" "$AGENTS" "$VERTICAL" "$ANNUAL" "$SUPPORT" "$EXTRA_TASKS" ;;
    invoice)     [ -n "$CUSTOMER" ] || { echo "Error: --customer required." >&2; exit 1; }
                 cmd_invoice "$CUSTOMER" "$MONTH" ;;
    invoice-all) cmd_invoice_all "$MONTH" ;;
    compare)     cmd_compare "$AGENTS" ;;
    revenue)     cmd_revenue ;;
esac
