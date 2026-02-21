#!/usr/bin/env bash
set -euo pipefail
# billing-calculator.sh — Calculate current month bill for a tenant
# Usage: ./billing-calculator.sh <tenant_id> [month YYYY-MM]
# Reads tier pricing from aaas-platform/pricing.json

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TENANTS_DIR="${SCRIPT_DIR}/tenants"
PRICING_FILE="${SCRIPT_DIR}/../aaas-platform/pricing.json"

[[ $# -lt 1 ]] && echo "Usage: $0 <tenant_id> [YYYY-MM]" && exit 1

TENANT_ID="$1"
MONTH="${2:-$(date -u +%Y-%m)}"
TENANT_DIR="${TENANTS_DIR}/${TENANT_ID}"

[[ ! -d "$TENANT_DIR" ]] && echo "Error: Tenant '$TENANT_ID' not found" >&2 && exit 1
[[ ! -f "$PRICING_FILE" ]] && echo "Error: Pricing file not found at $PRICING_FILE" >&2 && exit 1

TENANT_CONFIG="$TENANT_DIR/config/tenant.json"
TIER="$(jq -r '.tier' "$TENANT_CONFIG")"
VERTICAL="$(jq -r '.vertical' "$TENANT_CONFIG")"
COMPANY="$(jq -r '.company' "$TENANT_CONFIG")"

# Get base price and vertical premium
BASE_PRICE="$(jq -r --arg t "$TIER" '.tiers[$t].price // 0' "$PRICING_FILE")"
PREMIUM_PCT="$(jq -r --arg v "$VERTICAL" '.vertical_premiums[$v] // 0' "$PRICING_FILE")"

# Calculate premium
PREMIUM="$(python3 -c "print(round(${BASE_PRICE} * ${PREMIUM_PCT} / 100, 2))")"
SUBTOTAL="$(python3 -c "print(round(${BASE_PRICE} + ${PREMIUM}, 2))")"

# Get usage for the month
LOG_FILE="$TENANT_DIR/usage/log.json"
USAGE="$(jq --arg m "$MONTH" '[.[] | select(.date | startswith($m))] |
  { days: length,
    tasks: (map(.tasks_completed) | add // 0),
    tokens: (map(.tokens_used) | add // 0),
    emails: (map(.emails_sent) | add // 0),
    docs: (map(.documents_processed) | add // 0) }' "$LOG_FILE")"

# Token overage: charge per 100k tokens over tier allowance
TOKENS_USED="$(echo "$USAGE" | jq '.tokens')"
case "$TIER" in
  starter)    TOKEN_ALLOWANCE=1000000 ;;
  growth)     TOKEN_ALLOWANCE=3000000 ;;
  enterprise) TOKEN_ALLOWANCE=10000000 ;;
  *) TOKEN_ALLOWANCE=1000000 ;;
esac

OVERAGE_COST="$(python3 -c "
used = $TOKENS_USED
allowance = $TOKEN_ALLOWANCE
overage = max(0, used - allowance)
cost = (overage / 100000) * 50  # \$50 per 100k tokens over
print(round(cost, 2))
")"

TOTAL="$(python3 -c "print(round(${SUBTOTAL} + ${OVERAGE_COST}, 2))")"

# Output invoice JSON
cat <<EOF
{
  "invoice": {
    "tenant_id": "${TENANT_ID}",
    "company": "${COMPANY}",
    "period": "${MONTH}",
    "tier": "${TIER}",
    "vertical": "${VERTICAL}",
    "line_items": {
      "base_price": ${BASE_PRICE},
      "vertical_premium_pct": ${PREMIUM_PCT},
      "vertical_premium": ${PREMIUM},
      "subtotal": ${SUBTOTAL},
      "token_overage_cost": ${OVERAGE_COST},
      "tokens_used": ${TOKENS_USED},
      "token_allowance": ${TOKEN_ALLOWANCE}
    },
    "total": ${TOTAL},
    "currency": "USD",
    "usage_summary": $(echo "$USAGE" | jq .),
    "generated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "draft"
  }
}
EOF
