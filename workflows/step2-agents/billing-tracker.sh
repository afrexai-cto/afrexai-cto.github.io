#!/bin/bash
# billing-tracker.sh — Track usage and generate invoices
# Usage: ./billing-tracker.sh <command> [args]
# Bash 3.2 compatible

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BILLING_DIR="$SCRIPT_DIR/billing"
VERSION_DIR="$SCRIPT_DIR/versions"
REPORT_DIR="$SCRIPT_DIR/reports"
LOG_FILE="$SCRIPT_DIR/deploy.log"

BILLING_DB="$BILLING_DIR/customers.tsv"

mkdir -p "$BILLING_DIR" "$REPORT_DIR"

usage() {
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
    echo "Tiers:"
    echo "  starter    — 1 agent,  £499/mo"
    echo "  growth     — 3 agents, £999/mo"
    echo "  scale      — 10 agents, £2499/mo"
    echo "  enterprise — unlimited, £4999/mo"
    echo "  custom     — custom pricing (set via add)"
    exit 1
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

die() { echo "ERROR: $*" >&2; exit 1; }

# Tier pricing (in pence for integer arithmetic)
tier_price_pence() {
    case "$1" in
        starter)    echo 49900 ;;
        growth)     echo 99900 ;;
        scale)      echo 249900 ;;
        enterprise) echo 499900 ;;
        custom)     echo "${2:-0}" ;;
        *) echo 0 ;;
    esac
}

tier_agent_limit() {
    case "$1" in
        starter)    echo 1 ;;
        growth)     echo 3 ;;
        scale)      echo 10 ;;
        enterprise) echo 999 ;;
        custom)     echo "${2:-1}" ;;
        *) echo 0 ;;
    esac
}

format_price() {
    local pence="$1"
    local pounds=$((pence / 100))
    local remainder=$((pence % 100))
    printf "£%d.%02d" "$pounds" "$remainder"
}

# Initialize DB if needed
init_db() {
    if [ ! -f "$BILLING_DB" ]; then
        echo "customer	tier	price_pence	agent_limit	agent_count	start_date	status	last_paid" > "$BILLING_DB"
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
        [ $# -lt 3 ] && die "Usage: $0 add <customer> <tier> <start_date> [custom_price_pence] [agent_limit]"
        CUSTOMER="$1"
        TIER="$2"
        START_DATE="$3"
        CUSTOM_PRICE="${4:-0}"
        CUSTOM_LIMIT="${5:-0}"

        PRICE="$(tier_price_pence "$TIER" "$CUSTOM_PRICE")"
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
        echo "=== Customer Billing ==="
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
        PRICE_PENCE="$(get_field "$LINE" 3)"
        LIMIT="$(get_field "$LINE" 4)"
        START="$(get_field "$LINE" 6)"
        STATUS="$(get_field "$LINE" 7)"

        AGENTS="$(count_deployed_agents "$CUSTOMER")"
        PRICE_FMT="$(format_price "$PRICE_PENCE")"

        # Overage calculation (£99/agent/mo over limit for non-enterprise)
        OVERAGE=0
        OVERAGE_AGENTS=0
        if [ "$TIER" != "enterprise" ] && [ "$AGENTS" -gt "$LIMIT" ]; then
            OVERAGE_AGENTS=$((AGENTS - LIMIT))
            OVERAGE=$((OVERAGE_AGENTS * 9900))
        fi

        TOTAL_PENCE=$((PRICE_PENCE + OVERAGE))
        TOTAL_FMT="$(format_price "$TOTAL_PENCE")"

        INVOICE_FILE="$BILLING_DIR/invoice-${CUSTOMER}-${MONTH}.md"

        cat > "$INVOICE_FILE" << EOF
# Invoice

**AfrexAI Ltd**
AI Agent Management Services

---

**Bill To:** ${CUSTOMER}
**Invoice Date:** $(date '+%Y-%m-%d')
**Period:** ${MONTH}
**Invoice #:** INV-${CUSTOMER}-${MONTH}

---

## Services

| Description | Qty | Unit Price | Amount |
|-------------|-----|-----------|--------|
| ${TIER^} Plan — AI Agent Management | 1 | ${PRICE_FMT} | ${PRICE_FMT} |
EOF

        if [ "$OVERAGE" -gt 0 ]; then
            echo "| Additional Agents (over ${LIMIT} limit) | ${OVERAGE_AGENTS} | £99.00 | $(format_price "$OVERAGE") |" >> "$INVOICE_FILE"
        fi

        cat >> "$INVOICE_FILE" << EOF

---

| | **Total: ${TOTAL_FMT}** |
|---|---|

---

## Details

- **Plan:** ${TIER^}
- **Agents Deployed:** ${AGENTS} / ${LIMIT} included
- **Service Start:** ${START}
- **Status:** ${STATUS}

## Payment

Please remit payment within 30 days to:

**AfrexAI Ltd**
Bank: (configured per customer)
Reference: INV-${CUSTOMER}-${MONTH}

---
*Thank you for choosing AfrexAI*
EOF

        echo "Invoice generated: $INVOICE_FILE"
        echo "Amount: $TOTAL_FMT"
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
        echo "=== Revenue Summary: $MONTH ==="
        echo ""

        TOTAL_REV=0
        ACTIVE=0

        tail -n +2 "$BILLING_DB" | while IFS='	' read -r c t p l a s st lp; do
            if [ "$st" = "active" ]; then
                AGENTS="$(count_deployed_agents "$c")"
                OVERAGE=0
                if [ "$t" != "enterprise" ] && [ "$AGENTS" -gt "$l" ]; then
                    OVERAGE=$(( (AGENTS - l) * 9900 ))
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
