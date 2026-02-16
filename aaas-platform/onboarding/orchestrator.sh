#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# AfrexAI Onboarding Orchestrator — Zero-touch post-payment flow
# Usage: ./orchestrator.sh "Company Name" "email@co.com" "growth" "legal"
# Env:   DRY_RUN=true — preview mode (no emails, no cron, no Slack)
# ============================================================================

ONBOARDING_DIR="$(cd "$(dirname "$0")" && pwd)"
PLATFORM_DIR="$(cd "$ONBOARDING_DIR/.." && pwd)"
WORKSPACE_ROOT="$(cd "$PLATFORM_DIR/.." && pwd)"
LOG="${ONBOARDING_DIR}/onboarding-log.jsonl"
DRY_RUN="${DRY_RUN:-false}"

if [[ $# -lt 4 ]]; then
  echo "Usage: $0 \"Company Name\" \"email@co.com\" \"tier\" \"vertical\""
  exit 1
fi

COMPANY="$1"; EMAIL="$2"; TIER="$3"; VERTICAL="$4"
SLUG="$(echo "$COMPANY" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')"
CUSTOMER_DIR="${PLATFORM_DIR}/customers/${SLUG}"
TS_START="$(date -u +%FT%TZ)"

log_step() {
  local step="$1" status="$2" detail="${3:-}"
  echo "{\"ts\":\"$(date -u +%FT%TZ)\",\"customer\":\"${SLUG}\",\"step\":\"${step}\",\"status\":\"${status}\",\"detail\":\"${detail}\"}" >> "$LOG"
}

fail_step() {
  local step="$1" error="$2"
  log_step "$step" "FAILED" "$error"
  echo "❌ Step failed: $step — $error"
  # Post failure alert to Slack (best effort)
  DRY_RUN="$DRY_RUN" bash "${ONBOARDING_DIR}/slack-notify.sh" \
    "$COMPANY" "$TIER" "$VERTICAL" "0" "0" 2>/dev/null || true
  exit 1
}

echo "╔══════════════════════════════════════════════════╗"
echo "║  🚀 AfrexAI Onboarding Orchestrator             ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Company:   ${COMPANY}"
echo "║  Email:     ${EMAIL}"
echo "║  Tier:      ${TIER}"
echo "║  Vertical:  ${VERTICAL}"
echo "║  Slug:      ${SLUG}"
echo "║  Dry Run:   ${DRY_RUN}"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ━━━ Step 1: Run autopilot.sh (CRITICAL) ━━━
echo "━━━ Step 1/7: Running autopilot.sh ━━━"
log_step "autopilot" "started"
if DRY_RUN="$DRY_RUN" bash "${PLATFORM_DIR}/autopilot.sh" "$COMPANY" "$EMAIL" "$TIER" "$VERTICAL"; then
  log_step "autopilot" "complete"
  echo "✅ Autopilot complete"
else
  fail_step "autopilot" "autopilot.sh exited non-zero"
fi

# ━━━ Step 2: Generate portal auth token ━━━
echo ""
echo "━━━ Step 2/7: Generating portal auth token ━━━"
log_step "portal_token" "started"
PORTAL_TOKEN=""
for attempt in 1 2 3; do
  if PORTAL_TOKEN="$(bash "${ONBOARDING_DIR}/portal-token.sh" "$SLUG" "$EMAIL" 2>&1)"; then
    break
  fi
  echo "⚠️  Token gen attempt $attempt failed, retrying..."
  sleep 1
done
if [[ -z "$PORTAL_TOKEN" ]]; then
  log_step "portal_token" "FAILED" "3 retries exhausted"
  echo "⚠️  Portal token generation failed (non-fatal, continuing)"
else
  log_step "portal_token" "complete"
  echo "✅ Portal token generated"
fi

PORTAL_URL="https://portal.afrexai.com/login?token=${PORTAL_TOKEN}"

# ━━━ Step 3: Send welcome email ━━━
echo ""
echo "━━━ Step 3/7: Sending welcome email ━━━"
log_step "welcome_email" "started"

# Read profile for template rendering
PROFILE="${CUSTOMER_DIR}/profile.json"
if [[ -f "$PROFILE" ]]; then
  AGENT_COUNT="$(python3 -c "import json; print(len(json.load(open('${PROFILE}'))['agents']))")"
  MRR="$(python3 -c "import json; print(json.load(open('${PROFILE}'))['monthly_price'])")"
  AGENT_LIST="$(python3 -c "import json; [print(f'- {a[\"name\"]}') for a in json.load(open('${PROFILE}'))['agents']]")"
else
  AGENT_COUNT="0"; MRR="0"; AGENT_LIST="(pending)"
fi

# Render welcome template
WELCOME_TEMPLATE="${PLATFORM_DIR}/templates/emails/welcome.md"
RENDERED_EMAIL="$(mktemp)"
sed -e "s|{{COMPANY}}|${COMPANY}|g" \
    -e "s|{{TIER}}|${TIER}|g" \
    -e "s|{{VERTICAL}}|${VERTICAL}|g" \
    -e "s|{{AGENT_COUNT}}|${AGENT_COUNT}|g" \
    -e "s|{{MRR}}|${MRR}|g" \
    -e "s|{{PORTAL_URL}}|${PORTAL_URL}|g" \
    "$WELCOME_TEMPLATE" > "$RENDERED_EMAIL"

# Replace multi-line AGENT_LIST
python3 -c "
content = open('${RENDERED_EMAIL}').read()
content = content.replace('{{AGENT_LIST}}', '''${AGENT_LIST}''')
open('${RENDERED_EMAIL}','w').write(content)
"

SUBJECT="Welcome to AfrexAI — Your AI Workforce is Live! 🚀"
if DRY_RUN="$DRY_RUN" bash "${ONBOARDING_DIR}/send-email.sh" \
    --to "$EMAIL" --subject "$SUBJECT" --body "$RENDERED_EMAIL"; then
  log_step "welcome_email" "complete"
  echo "✅ Welcome email sent/queued"
else
  log_step "welcome_email" "FAILED" "send-email.sh failed"
  echo "⚠️  Welcome email failed (non-fatal)"
fi
rm -f "$RENDERED_EMAIL"

# ━━━ Step 4: Generate portal data JSON ━━━
echo ""
echo "━━━ Step 4/7: Generating portal data ━━━"
PORTAL_DATA_DIR="${CUSTOMER_DIR}/data/portal"
mkdir -p "$PORTAL_DATA_DIR"
cat > "${PORTAL_DATA_DIR}/dashboard.json" <<EOF
{
  "customer": "${SLUG}",
  "company": "${COMPANY}",
  "tier": "${TIER}",
  "vertical": "${VERTICAL}",
  "agent_count": ${AGENT_COUNT},
  "mrr": ${MRR},
  "portal_url": "${PORTAL_URL}",
  "onboarded_at": "${TS_START}",
  "status": "active"
}
EOF
log_step "portal_data" "complete"
echo "✅ Portal data generated"

# ━━━ Step 5: Add to portal auth index ━━━
echo ""
echo "━━━ Step 5/7: Updating auth index ━━━"
AUTH_INDEX="${PLATFORM_DIR}/portal/auth-index.json"
mkdir -p "$(dirname "$AUTH_INDEX")"
if [[ ! -f "$AUTH_INDEX" ]]; then
  echo '[]' > "$AUTH_INDEX"
fi
python3 -c "
import json
idx = json.load(open('${AUTH_INDEX}'))
# Deduplicate by slug
idx = [e for e in idx if e.get('slug') != '${SLUG}']
idx.append({'slug':'${SLUG}','email':'${EMAIL}','token':'${PORTAL_TOKEN}','portal_url':'${PORTAL_URL}','created':'${TS_START}'})
json.dump(idx, open('${AUTH_INDEX}','w'), indent=2)
"
log_step "auth_index" "complete"
echo "✅ Auth index updated"

# ━━━ Step 6: Schedule follow-up emails (Day 3, 7, 30) ━━━
echo ""
echo "━━━ Step 6/7: Scheduling follow-up emails ━━━"
log_step "followup_schedule" "started"
if bash "${ONBOARDING_DIR}/schedule-followups.sh" schedule "$SLUG" "$EMAIL"; then
  log_step "followup_schedule" "complete"
  echo "✅ Follow-ups scheduled"
else
  log_step "followup_schedule" "FAILED" "schedule-followups.sh failed"
  echo "⚠️  Follow-up scheduling failed (non-fatal)"
fi

# ━━━ Step 7: Slack CEO alert ━━━
echo ""
echo "━━━ Step 7/7: Posting Slack alert ━━━"
log_step "slack_notify" "started"
if DRY_RUN="$DRY_RUN" bash "${ONBOARDING_DIR}/slack-notify.sh" \
    "$COMPANY" "$TIER" "$VERTICAL" "$AGENT_COUNT" "$MRR"; then
  log_step "slack_notify" "complete"
else
  log_step "slack_notify" "FAILED" "slack-notify.sh failed"
  echo "⚠️  Slack notification failed (non-fatal)"
fi

# ━━━ Final log entry ━━━
echo ""
echo "{\"ts\":\"$(date -u +%FT%TZ)\",\"customer\":\"${SLUG}\",\"company\":\"${COMPANY}\",\"tier\":\"${TIER}\",\"vertical\":\"${VERTICAL}\",\"email\":\"${EMAIL}\",\"agent_count\":${AGENT_COUNT},\"mrr\":${MRR},\"status\":\"complete\",\"started\":\"${TS_START}\"}" >> "$LOG"

echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ Onboarding Complete: ${COMPANY}"
echo "║  Slug:     ${SLUG}"
echo "║  Agents:   ${AGENT_COUNT}"
echo "║  MRR:      \$${MRR}/mo"
echo "║  Portal:   ${PORTAL_URL}"
echo "╚══════════════════════════════════════════════════╝"
