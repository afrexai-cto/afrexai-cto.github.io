#!/usr/bin/env bash
# pricing-engine.sh — Calculate costs, discounts, and invoices for AfrexAI Hosted Agents
# Bash 3.2 compatible
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="${AFREX_DATA_DIR:-$SCRIPT_DIR/data}"
CUSTOMERS_DIR="$DATA_DIR/customers"
INVOICES_DIR="$DATA_DIR/invoices"

# --- Tier pricing ---
# Starter: $1,500/mo — 1 agent
# Growth:  $4,500/mo — 3 agents
# Enterprise: $12,000/mo — 9 agents
# Per-agent overage: $1,800/mo (capped at tier upgrade cost)

STARTER_PRICE=1500
STARTER_AGENTS=1
GROWTH_PRICE=4500
GROWTH_AGENTS=3
ENTERPRISE_PRICE=12000
ENTERPRISE_AGENTS=9
OVERAGE_PER_AGENT=1800

# Annual discount: 15%
ANNUAL_DISCOUNT=15
# Vertical premium (specialized agents cost more)
VERTICAL_PREMIUM_LEGAL=10
VERTICAL_PREMIUM_HEALTHCARE=10
VERTICAL_PREMIUM_FINANCE=5
VERTICAL_PREMIUM_REALESTATE=0
VERTICAL_PREMIUM_GENERAL=0

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
  --tier <tier>           Tier: starter, growth, enterprise
  --agents <n>            Number of agents needed
  --vertical <v>          Industry vertical
  --annual                Annual billing (15% discount)
  --customer <id>         Customer ID (for invoice)
  --month <YYYY-MM>       Invoice month (default: current)
  --extra-tasks <n>       Extra task volume above base (usage-based)
  --support <level>       Support: standard, priority, dedicated
  -h, --help              Show this help

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
    case "$1" in
        starter)    echo "$STARTER_PRICE" ;;
        growth)     echo "$GROWTH_PRICE" ;;
        enterprise) echo "$ENTERPRISE_PRICE" ;;
        *)          echo 0 ;;
    esac
}

tier_included_agents() {
    case "$1" in
        starter)    echo "$STARTER_AGENTS" ;;
        growth)     echo "$GROWTH_AGENTS" ;;
        enterprise) echo "$ENTERPRISE_AGENTS" ;;
        *)          echo 0 ;;
    esac
}

best_tier_for_agents() {
    local n="$1"
    if [ "$n" -le 1 ]; then echo "starter"
    elif [ "$n" -le 3 ]; then echo "growth"
    elif [ "$n" -le 9 ]; then echo "enterprise"
    else echo "enterprise"  # custom pricing above 9
    fi
}

vertical_premium_pct() {
    case "$1" in
        legal)       echo "$VERTICAL_PREMIUM_LEGAL" ;;
        healthcare)  echo "$VERTICAL_PREMIUM_HEALTHCARE" ;;
        finance)     echo "$VERTICAL_PREMIUM_FINANCE" ;;
        realestate)  echo "$VERTICAL_PREMIUM_REALESTATE" ;;
        *)           echo "$VERTICAL_PREMIUM_GENERAL" ;;
    esac
}

support_addon() {
    case "$1" in
        standard)  echo 0 ;;
        priority)  echo 500 ;;
        dedicated) echo 2000 ;;
        *)         echo 0 ;;
    esac
}

# --- Quote ---
cmd_quote() {
    local tier="$1" agents="$2" vertical="$3" annual="$4" support="$5" extra_tasks="$6"

    # Auto-select tier if agents specified but no tier
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

    # Overage agents
    local overage_agents=0 overage_cost=0
    if [ "$agents" -gt "$included" ]; then
        overage_agents=$((agents - included))
        overage_cost=$((overage_agents * OVERAGE_PER_AGENT))
    fi

    # Vertical premium
    local vpct
    vpct="$(vertical_premium_pct "$vertical")"
    local vpremium=$(( (base + overage_cost) * vpct / 100 ))

    # Support addon
    local support_cost
    support_cost="$(support_addon "$support")"

    # Extra task volume (usage-based: $0.50 per task above 500/agent/month base)
    local task_overage_cost=0
    if [ "$extra_tasks" -gt 0 ]; then
        task_overage_cost=$((extra_tasks / 2))  # $0.50 each, integer math
    fi

    # Subtotal
    local monthly_subtotal=$((base + overage_cost + vpremium + support_cost + task_overage_cost))

    # Annual discount
    local discount=0 monthly_total="$monthly_subtotal" billing="monthly"
    if [ "$annual" -eq 1 ]; then
        discount=$((monthly_subtotal * ANNUAL_DISCOUNT / 100))
        monthly_total=$((monthly_subtotal - discount))
        billing="annual"
    fi

    local annual_total=$((monthly_total * 12))

    echo "=============================================="
    echo "  AfrexAI Hosted Agents — Price Quote"
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

    # Vertical premium
    local vpct
    vpct="$(vertical_premium_pct "$vertical")"
    local vpremium=$((price * vpct / 100))
    local total=$((price + vpremium))

    local invoice_id="INV-${cid}-${month}"
    local ts
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    # Write invoice JSON
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

    echo "  ✓ $invoice_id  $company  \$$total  → $INVOICES_DIR/$month/${cid}.json"
}

cmd_invoice_all() {
    local month="$1"
    if [ -z "$month" ]; then month="$(date -u +%Y-%m)"; fi

    echo "=============================================="
    echo "  AfrexAI — Invoice Generation: $month"
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
    echo "  ✅ $count invoice(s) generated. Total billed: \$$total_billed"
}

# --- Compare ---
cmd_compare() {
    local agents="$1"
    if [ "$agents" -eq 0 ]; then agents=1; fi

    echo "=============================================="
    echo "  AfrexAI — Tier Comparison for $agents agent(s)"
    echo "=============================================="
    echo ""
    printf "  %-14s %-10s %-12s %-12s %-10s\n" "TIER" "INCLUDED" "BASE" "OVERAGE" "TOTAL"
    printf "  %-14s %-10s %-12s %-12s %-10s\n" "--------------" "----------" "------------" "------------" "----------"

    for tier in starter growth enterprise; do
        local base included overage total
        base="$(tier_base_price "$tier")"
        included="$(tier_included_agents "$tier")"
        overage=0
        if [ "$agents" -gt "$included" ]; then
            overage=$(( (agents - included) * OVERAGE_PER_AGENT ))
        fi
        total=$((base + overage))
        local rec=""
        if [ "$tier" = "$(best_tier_for_agents "$agents")" ]; then rec=" ← best value"; fi
        printf "  %-14s %-10s \$%-11s \$%-11s \$%-9s%s\n" "$tier" "$included" "$base" "$overage" "$total" "$rec"
    done
    echo ""
    printf "  Recommended tier: %s\n" "$(best_tier_for_agents "$agents")"
}

# --- Revenue ---
cmd_revenue() {
    echo "=============================================="
    echo "  AfrexAI — Revenue Report"
    echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "=============================================="
    echo ""

    local total_customers=0 total_agents=0 total_mrr=0
    local starter_count=0 growth_count=0 enterprise_count=0

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

        case "$tier" in
            starter)    starter_count=$((starter_count + 1)) ;;
            growth)     growth_count=$((growth_count + 1)) ;;
            enterprise) enterprise_count=$((enterprise_count + 1)) ;;
        esac
    done

    local arr=$((total_mrr * 12))
    local avg_mrr=0
    if [ "$total_customers" -gt 0 ]; then
        avg_mrr=$((total_mrr / total_customers))
    fi

    echo "  Active Customers:   $total_customers"
    echo "    Starter:          $starter_count"
    echo "    Growth:           $growth_count"
    echo "    Enterprise:       $enterprise_count"
    echo ""
    echo "  Total Agents:       $total_agents"
    echo "  MRR:                \$$total_mrr"
    echo "  ARR:                \$$arr"
    echo "  Avg MRR/customer:   \$$avg_mrr"
    echo ""

    # Target progress
    local target=11000000
    if [ "$arr" -gt 0 ]; then
        local pct=$((arr * 100 / target))
        echo "  🎯 \$11M ARR Target: ${pct}% (\$$arr / \$$target)"
        echo ""

        # What's needed
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
