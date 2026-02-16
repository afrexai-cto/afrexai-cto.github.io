#!/bin/bash
# billing-tracker.sh — Track usage and generate invoices (USD only)
# Reads all pricing from aaas-platform/pricing.json — no hardcoded prices.
# Usage: ./billing-tracker.sh <command> [args]
# Bash 3.2 compatible

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BILLING_DIR="$SCRIPT_DIR/billing"
VERSION_DIR="$SCRIPT_DIR/versions"
REPORT_DIR="$SCRIPT_DIR/reports"
LOG_FILE="$SCRIPT_DIR/deploy.log"

BILLING_DB="$BILLING_DIR/customers.tsv"

# Pricing source of truth
PRICING_FILE="$(cd "$SCRIPT_DIR/../../aaas-platform" && pwd)/pricing.json"

mkdir -p "$BILLING_DIR" "$REPORT_DIR"

# ── Read pricing from pricing.json ──
if [ ! -f "$PRICING_FILE" ]; then
    echo "ERROR: pricing.json not found at $PRICING_FILE" >&2
    exit 1
fi

CUSTOMERS_PROFILE_DIR="$(cd "$SCRIPT_DIR/../../aaas-platform/customers" 2>/dev/null && pwd || echo "")"

# Get price in cents for a customer, including vertical premium
# Usage: tier_price_cents <tier> [custom_price_cents] [customer_slug]
tier_price_cents() {
    python3 -c "
import json, os
p = json.load(open('${PRICING_FILE}'))
tier = '$1'
custom = ${2:-0}
customer = '${3:-}'
customers_dir = '${CUSTOMERS_PROFILE_DIR}'

# If customer slug given, try profile.json monthly_price first
if customer and customers_dir:
    profile = os.path.join(customers_dir, customer, 'profile.json')
    if os.path.exists(profile):
        prof = json.load(open(profile))
        mp = prof.get('monthly_price') or prof.get('pricing', {}).get('monthly_total')
        if mp and int(mp) > 0:
            print(int(mp) * 100)
            exit()

if tier == 'custom':
    print(custom)
elif tier in p['tiers']:
    base = p['tiers'][tier]['price']
    # Try to find vertical from profile
    vertical = 'general'
    if customer and customers_dir:
        profile = os.path.join(customers_dir, customer, 'profile.json')
        if os.path.exists(profile):
            prof = json.load(open(profile))
            vertical = prof.get('vertical', 'general')
    vpct = p.get('vertical_premiums', {}).get(vertical, 0)
    total = base + (base * vpct // 100)
    print(int(total * 100))
else:
    print(0)
"
}

tier_agent_limit() {
    python3 -c "
import json
p = json.load(open('${PRICING_FILE}'))
tier = '$1'
if tier == 'custom':
    print(${2:-1})
elif tier in p['tiers']:
    print(p['tiers'][tier]['agents'])
else:
    print(0)
"
}

overage_per_agent_cents() {
    python3 -c "
import json
p = json.load(open('${PRICING_FILE}'))
print(int(p['overage_per_agent'] * 100))
"
}

OVERAGE_CENTS="$(overage_per_agent_cents)"

usage() {
    # Read tier info dynamically
    TIER_INFO="$(python3 -c "
import json
p = json.load(open('${PRICING_FILE}'))
for t, v in p['tiers'].items():
    print(f'  {t:12s} — {v[\"agents\"]} agent(s), \${v[\"price\"]}/mo')
")"

    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Commands:"
    echo "  add <customer> <tier> <start_date> [agents]  Add/update customer billing"
    echo "  remove <customer>                            Remove customer"
    echo "  list                                         List all customers"
    echo "  invoice <customer> [month YYYY-MM]           Generate invoice"
    echo "  invoice-all [month YYYY-MM]                  Generate all invoices"
    echo "  overdue                                      Flag overdue accounts"
    echo "  summary [month YYYY-MM]                      Revenue summary"
    echo "  pay <customer> <month YYYY-MM> [amount]      Record payment"
    echo ""
    echo "Tiers (from pricing.json):"
    echo "$TIER_INFO"
    echo "  custom       — custom pricing (set via add)"
    exit 1
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

die() { echo "ERROR: $*" >&2; exit 1; }

format_price() {
    local cents="$1"
    local dollars=$((cents / 100))
    local remainder=$((cents % 100))
    printf "\$%d.%02d" "$dollars" "$remainder"
}

# Initialize DB if needed
init_db() {
    if [ ! -f "$BILLING_DB" ]; then
        echo "customer	tier	price_cents	agent_limit	agent_count	start_date	status	last_paid" > "$BILLING_DB"
    fi
}

get_customer_line() {
    local customer="$1"
    grep "^${customer}	" "$BILLING_DB" 2>/dev/null || echo ""
}

get_field() {
    local line="$1"
    local field="$2"
    echo "$line" | cut -f"$field"
}

count_deployed_agents() {
    local customer="$1"
    local count=0
    for f in "$VERSION_DIR/${customer}-"*.json; do
        [ -f "$f" ] && count=$((count + 1))
    done
    echo "$count"
}

# --- Commands ---
if [ $# -lt 1 ]; then usage; fi
COMMAND="$1"; shift

init_db

case "$COMMAND" in
    add)
        [ $# -lt 3 ] && die "Usage: $0 add <customer> <tier> <start_date> [custom_price_cents] [agent_limit]"
        CUSTOMER="$1"
        TIER="$2"
        START_DATE="$3"
        CUSTOM_PRICE="${4:-0}"
        CUSTOM_LIMIT="${5:-0}"

        PRICE="$(tier_price_cents "$TIER" "$CUSTOM_PRICE" "$CUSTOMER")"
        LIMIT="$(tier_agent_limit "$TIER" "$CUSTOM_LIMIT")"
        AGENTS="$(count_deployed_agents "$CUSTOMER")"

        # Remove existing entry if present
        if [ -n "$(get_customer_line "$CUSTOMER")" ]; then
            grep -v "^${CUSTOMER}	" "$BILLING_DB" > "${BILLING_DB}.tmp"
            mv "${BILLING_DB}.tmp" "$BILLING_DB"
        fi

        echo "${CUSTOMER}	${TIER}	${PRICE}	${LIMIT}	${AGENTS}	${START_DATE}	active	none" >> "$BILLING_DB"
        echo "Added: $CUSTOMER ($TIER, $(format_price "$PRICE")/mo, ${AGENTS}/${LIMIT} agents, start: $START_DATE)"
        log "Billing: added $CUSTOMER tier=$TIER"
        ;;

    remove)
        [ $# -lt 1 ] && die "Usage: $0 remove <customer>"
        CUSTOMER="$1"
        [ -z "$(get_customer_line "$CUSTOMER")" ] && die "Customer not found: $CUSTOMER"
        grep -v "^${CUSTOMER}	" "$BILLING_DB" > "${BILLING_DB}.tmp"
        mv "${BILLING_DB}.tmp" "$BILLING_DB"
        echo "Removed: $CUSTOMER"
        log "Billing: removed $CUSTOMER"
        ;;

    list)
        echo ""
        echo "=== Customer Billing (USD) ==="
        echo ""
        printf "%-20s %-12s %-12s %-10s %-12s %-10s %-12s\n" \
            "Customer" "Tier" "Monthly" "Agents" "Start" "Status" "Last Paid"
        printf "%-20s %-12s %-12s %-10s %-12s %-10s %-12s\n" \
            "--------" "----" "-------" "------" "-----" "------" "---------"

        tail -n +2 "$BILLING_DB" | while IFS='	' read -r c t p l a s st lp; do
            ACTUAL="$(count_deployed_agents "$c")"
            printf "%-20s %-12s %-12s %-10s %-12s %-10s %-12s\n" \
                "$c" "$t" "$(format_price "$p")" "${ACTUAL}/${l}" "$s" "$st" "$lp"
        done
        echo ""
        ;;

    invoice)
        [ $# -lt 1 ] && die "Usage: $0 invoice <customer> [YYYY-MM]"
        CUSTOMER="$1"
        MONTH="${2:-$(date '+%Y-%m')}"

        LINE="$(get_customer_line "$CUSTOMER")"
        [ -z "$LINE" ] && die "Customer not found: $CUSTOMER"

        TIER="$(get_field "$LINE" 2)"
        PRICE_CENTS="$(get_field "$LINE" 3)"
        LIMIT="$(get_field "$LINE" 4)"
        START="$(get_field "$LINE" 6)"
        STATUS="$(get_field "$LINE" 7)"

        AGENTS="$(count_deployed_agents "$CUSTOMER")"
        PRICE_FMT="$(format_price "$PRICE_CENTS")"

        # Overage calculation
        OVERAGE=0
        OVERAGE_AGENTS=0
        if [ "$TIER" != "enterprise" ] && [ "$AGENTS" -gt "$LIMIT" ]; then
            OVERAGE_AGENTS=$((AGENTS - LIMIT))
            OVERAGE=$((OVERAGE_AGENTS * OVERAGE_CENTS))
        fi

        TOTAL_CENTS=$((PRICE_CENTS + OVERAGE))
        TOTAL_FMT="$(format_price "$TOTAL_CENTS")"

        INVOICE_FILE="$BILLING_DIR/invoice-${CUSTOMER}-${MONTH}.md"

        cat > "$INVOICE_FILE" << EOF
# Invoice

**AfrexAI**
AI Agent Management Services

---

**Bill To:** ${CUSTOMER}
**Invoice Date:** $(date '+%Y-%m-%d')
**Period:** ${MONTH}
**Invoice #:** INV-${CUSTOMER}-${MONTH}
**Currency:** USD

---

## Services

| Description | Qty | Unit Price | Amount |
|-------------|-----|-----------|--------|
| $(echo "$TIER" | awk "{print toupper(substr(\$0,1,1)) substr(\$0,2)}") Plan — AI Agent Management | 1 | ${PRICE_FMT} | ${PRICE_FMT} |
EOF

        if [ "$OVERAGE" -gt 0 ]; then
            echo "| Additional Agents (over ${LIMIT} limit) | ${OVERAGE_AGENTS} | $(format_price "$OVERAGE_CENTS") | $(format_price "$OVERAGE") |" >> "$INVOICE_FILE"
        fi

        cat >> "$INVOICE_FILE" << EOF

---

| | **Total: ${TOTAL_FMT} USD** |
|---|---|

---

## Details

- **Plan:** $(echo "$TIER" | awk "{print toupper(substr(\$0,1,1)) substr(\$0,2)}")
- **Agents Deployed:** ${AGENTS} / ${LIMIT} included
- **Service Start:** ${START}
- **Status:** ${STATUS}

## Payment

Please remit payment within 30 days.

**AfrexAI**
Reference: INV-${CUSTOMER}-${MONTH}

---
*Thank you for choosing AfrexAI*
EOF

        echo "Invoice generated: $INVOICE_FILE"
        echo "Amount: $TOTAL_FMT USD"
        log "Billing: invoice $CUSTOMER $MONTH $TOTAL_FMT"
        ;;

    invoice-all)
        MONTH="${1:-$(date '+%Y-%m')}"
        echo "Generating invoices for $MONTH..."
        echo ""
        tail -n +2 "$BILLING_DB" | while IFS='	' read -r c t p l a s st lp; do
            if [ "$st" = "active" ]; then
                "$SCRIPT_DIR/billing-tracker.sh" invoice "$c" "$MONTH"
            else
                echo "Skipped $c (status: $st)"
            fi
        done
        echo ""
        echo "All invoices in: $BILLING_DIR/"
        ;;

    overdue)
        echo ""
        echo "=== Overdue Accounts ==="
        echo ""
        CURRENT_MONTH="$(date '+%Y-%m')"
        FOUND=0

        tail -n +2 "$BILLING_DB" | while IFS='	' read -r c t p l a s st lp; do
            if [ "$st" = "active" ]; then
                if [ "$lp" = "none" ] || [ "$lp" \< "$CURRENT_MONTH" ]; then
                    PRICE_FMT="$(format_price "$p")"
                    echo "⚠️  $c — $PRICE_FMT/mo — last paid: ${lp:-never}"
                    FOUND=1
                fi
            fi
        done

        if [ "$FOUND" = "0" ]; then
            echo "✅ No overdue accounts"
        fi
        echo ""
        ;;

    pay)
        [ $# -lt 2 ] && die "Usage: $0 pay <customer> <YYYY-MM>"
        CUSTOMER="$1"
        PAY_MONTH="$2"

        LINE="$(get_customer_line "$CUSTOMER")"
        [ -z "$LINE" ] && die "Customer not found: $CUSTOMER"

        # Update last_paid
        UPDATED="$(echo "$LINE" | awk -F'\t' -v m="$PAY_MONTH" 'BEGIN{OFS="\t"}{$8=m; print}')"
        grep -v "^${CUSTOMER}	" "$BILLING_DB" > "${BILLING_DB}.tmp"
        echo "$UPDATED" >> "${BILLING_DB}.tmp"
        mv "${BILLING_DB}.tmp" "$BILLING_DB"

        echo "Recorded payment: $CUSTOMER for $PAY_MONTH"
        log "Billing: payment $CUSTOMER $PAY_MONTH"
        ;;

    summary)
        MONTH="${1:-$(date '+%Y-%m')}"
        echo ""
        echo "=== Revenue Summary: $MONTH (USD) ==="
        echo ""

        TOTAL_REV=0
        ACTIVE=0

        tail -n +2 "$BILLING_DB" | while IFS='	' read -r c t p l a s st lp; do
            if [ "$st" = "active" ]; then
                AGENTS="$(count_deployed_agents "$c")"
                OVERAGE=0
                if [ "$t" != "enterprise" ] && [ "$AGENTS" -gt "$l" ]; then
                    OVERAGE=$(( (AGENTS - l) * OVERAGE_CENTS ))
                fi
                CUST_TOTAL=$((p + OVERAGE))
                echo "  $c: $(format_price "$CUST_TOTAL") ($t, ${AGENTS} agents)"
                TOTAL_REV=$((TOTAL_REV + CUST_TOTAL))
                ACTIVE=$((ACTIVE + 1))
            fi
        done

        echo ""
        echo "  Active customers: $ACTIVE"
        echo "  Total MRR: $(format_price "$TOTAL_REV")"
        echo ""
        ;;

    *)
        usage
        ;;
esac
