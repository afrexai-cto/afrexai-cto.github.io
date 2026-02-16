#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Slack New Customer Alert
# Usage: ./slack-notify.sh <company> <tier> <vertical> <agent_count> <mrr>
# Posts to #ceo-dashboard (C0AF3MKPYG1) via Slack webhook
# ============================================================================

COMPANY="$1"; TIER="$2"; VERTICAL="$3"; AGENT_COUNT="${4:-0}"; MRR="${5:-0}"
DRY_RUN="${DRY_RUN:-false}"

PAYLOAD=$(cat <<EOF
{
  "channel": "C0AF3MKPYG1",
  "text": "🎉 *New Customer Onboarded!*\n\n*Company:* ${COMPANY}\n*Tier:* ${TIER} (\$${MRR}/mo)\n*Vertical:* ${VERTICAL}\n*Agents:* ${AGENT_COUNT}\n*Status:* ✅ All systems go\n*Time:* $(date -u +%FT%TZ)"
}
EOF
)

if [[ "$DRY_RUN" == "true" ]]; then
  echo "📢 [DRY_RUN] Slack notify: ${COMPANY} (${TIER})"
  exit 0
fi

WEBHOOK_URL="$(op read 'op://AfrexAI/Slack-Webhook/url' 2>/dev/null)" || {
  echo "⚠️  Slack webhook unavailable, skipping notification"
  exit 0
}

HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d "$PAYLOAD" "$WEBHOOK_URL")"
if [[ "$HTTP_CODE" == "200" ]]; then
  echo "📢 Slack alert posted for ${COMPANY}"
else
  echo "⚠️  Slack returned HTTP ${HTTP_CODE} (non-fatal)"
fi
