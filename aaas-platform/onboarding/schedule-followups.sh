#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Follow-up Email Scheduler
# Usage:
#   ./schedule-followups.sh schedule <slug> <email>   — queue day 3/7/30 emails
#   ./schedule-followups.sh run                        — send all due emails (daily cron)
# ============================================================================

PLATFORM_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ONBOARDING_DIR="$(cd "$(dirname "$0")" && pwd)"
DRIP_QUEUE="${ONBOARDING_DIR}/drip-queue.jsonl"
DRY_RUN="${DRY_RUN:-false}"

ACTION="${1:-}"
[[ -z "$ACTION" ]] && { echo "Usage: schedule-followups.sh <schedule|run> [args...]"; exit 1; }

calc_date() {
  local base="$1" days="$2"
  if [[ "$(uname)" == "Darwin" ]]; then
    date -j -v+"${days}d" -f "%Y-%m-%d" "$base" +%Y-%m-%d
  else
    date -d "${base} + ${days} days" +%Y-%m-%d
  fi
}

case "$ACTION" in
  schedule)
    SLUG="$2"; EMAIL="$3"
    PROFILE="${PLATFORM_DIR}/customers/${SLUG}/profile.json"
    if [[ -f "$PROFILE" ]]; then
      CREATED="$(python3 -c "import json; print(json.load(open('${PROFILE}'))['created_at'][:10])")"
    else
      CREATED="$(date +%Y-%m-%d)"
      echo "⚠️  Profile not found, using today as created_at"
    fi
    TS="$(date -u +%FT%TZ)"

    for spec in "3:day3-checkin:How's it going with your AI team?" "7:day7-weekly-report:Your First Week — Agent Activity Report" "30:day30-roi-report:Your First Month — ROI Report"; do
      IFS=':' read -r days template subject <<< "$spec"
      SEND_DATE="$(calc_date "$CREATED" "$days")"
      echo "{\"slug\":\"${SLUG}\",\"email\":\"${EMAIL}\",\"template\":\"${template}\",\"subject\":\"${subject}\",\"send_date\":\"${SEND_DATE}\",\"status\":\"pending\",\"scheduled_at\":\"${TS}\"}" >> "$DRIP_QUEUE"
    done
    echo "📅 Scheduled 3 follow-up emails for ${SLUG} (day 3/7/30)"
    ;;

  run)
    [[ -f "$DRIP_QUEUE" ]] || { echo "No drip queue found"; exit 0; }
    TODAY="$(date +%Y-%m-%d)"
    TEMP="$(mktemp)"

    while IFS= read -r line; do
      STATUS="$(echo "$line" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])")"
      SEND_DATE="$(echo "$line" | python3 -c "import json,sys; print(json.load(sys.stdin)['send_date'])")"

      if [[ "$STATUS" == "pending" ]] && [[ ! "$SEND_DATE" > "$TODAY" ]]; then
        SLUG="$(echo "$line" | python3 -c "import json,sys; print(json.load(sys.stdin)['slug'])")"
        EMAIL="$(echo "$line" | python3 -c "import json,sys; print(json.load(sys.stdin)['email'])")"
        TEMPLATE="$(echo "$line" | python3 -c "import json,sys; print(json.load(sys.stdin)['template'])")"
        SUBJECT="$(echo "$line" | python3 -c "import json,sys; print(json.load(sys.stdin)['subject'])")"
        TEMPLATE_FILE="${PLATFORM_DIR}/templates/emails/${TEMPLATE}.md"

        if [[ -f "$TEMPLATE_FILE" ]]; then
          # Render template with customer data
          PROFILE="${PLATFORM_DIR}/customers/${SLUG}/profile.json"
          RENDERED="$(mktemp)"
          COMPANY="$(python3 -c "import json; print(json.load(open('${PROFILE}'))['company_name'])")"
          TIER="$(python3 -c "import json; print(json.load(open('${PROFILE}'))['tier'])")"
          VERTICAL="$(python3 -c "import json; print(json.load(open('${PROFILE}'))['vertical'])")"
          AGENT_COUNT="$(python3 -c "import json; print(len(json.load(open('${PROFILE}'))['agents']))")"
          MRR="$(python3 -c "import json; print(json.load(open('${PROFILE}'))['monthly_price'])")"
          PORTAL_URL="https://portal.afrexai.com/login?customer=${SLUG}"
          [[ -f "${PLATFORM_DIR}/customers/${SLUG}/portal-auth.json" ]] && \
            PORTAL_URL="$(python3 -c "import json; print(json.load(open('${PLATFORM_DIR}/customers/${SLUG}/portal-auth.json'))['portal_url'])")"

          AGENTS_LIST="$(python3 -c "import json; [print(f'- {a[\"name\"]}') for a in json.load(open('${PROFILE}'))['agents']]")"

          sed -e "s|{{COMPANY}}|${COMPANY}|g" \
              -e "s|{{TIER}}|${TIER}|g" \
              -e "s|{{VERTICAL}}|${VERTICAL}|g" \
              -e "s|{{AGENT_COUNT}}|${AGENT_COUNT}|g" \
              -e "s|{{MRR}}|${MRR}|g" \
              -e "s|{{PORTAL_URL}}|${PORTAL_URL}|g" \
              "$TEMPLATE_FILE" > "$RENDERED"
          # Replace AGENTS placeholder (multi-line)
          python3 -c "
import sys
content = open('${RENDERED}').read()
content = content.replace('{{AGENTS}}', '''${AGENTS_LIST}''')
open('${RENDERED}','w').write(content)
"

          DRY_RUN="$DRY_RUN" bash "${ONBOARDING_DIR}/send-email.sh" \
            --to "$EMAIL" --subject "$SUBJECT" --body "$RENDERED"
          rm -f "$RENDERED"
          echo "📧 Sent ${TEMPLATE} to ${EMAIL}"
        fi

        # Mark as sent
        echo "$line" | python3 -c "import json,sys; d=json.load(sys.stdin); d['status']='sent'; d['sent_at']='$(date -u +%FT%TZ)'; print(json.dumps(d))" >> "$TEMP"
      else
        echo "$line" >> "$TEMP"
      fi
    done < "$DRIP_QUEUE"

    mv "$TEMP" "$DRIP_QUEUE"
    echo "✅ Drip queue processed"
    ;;

  *)
    echo "Unknown action: $ACTION"
    exit 1
    ;;
esac
