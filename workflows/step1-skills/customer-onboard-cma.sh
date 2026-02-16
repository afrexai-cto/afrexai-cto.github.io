#!/bin/bash
# DEPRECATED — CRM + email now handled by aaas-platform/autopilot.sh
# customer-onboard-cma.sh — Onboard a CMA (Customer Managed Agent) customer
# Bash 3.2 compatible
#
# Usage: ./customer-onboard-cma.sh --name "John Doe" --email "john@co.com" --company "Acme" --vertical <vertical>

set -euo pipefail

echo "⚠️  DEPRECATED: This script is deprecated. Use aaas-platform/autopilot.sh for new customers."
echo "   CRM records, welcome emails, and follow-up scheduling are now handled by autopilot."

# ── Defaults ──
CUSTOMER_NAME=""
CUSTOMER_EMAIL=""
COMPANY=""
VERTICAL=""
CRM_DIR="${CRM_LOG_DIR:-$(dirname "$0")/../../data/crm}"
TEMPLATES_DIR="$(dirname "$0")/templates"
DRY_RUN=false

# Verticals → recommended skill sets
# Using parallel arrays (bash 3.2 compatible)
VERTICALS="ecommerce saas finance healthcare marketing devops legal education other"

# ── Colours ──
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

log()  { printf "${GREEN}[✓]${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}[!]${NC} %s\n" "$1"; }
err()  { printf "${RED}[✗]${NC} %s\n" "$1" >&2; }
info() { printf "${BLUE}[i]${NC} %s\n" "$1"; }

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Required:
  --name "Full Name"     Customer name
  --email "email@co.com" Customer email
  --company "Company"    Company name
  --vertical <vertical>  Business vertical ($VERTICALS)

Optional:
  --dry-run              Preview actions without executing
  -h, --help             Show this help
EOF
    exit 0
}

# ── Parse args ──
while [ $# -gt 0 ]; do
    case "$1" in
        --name)      CUSTOMER_NAME="$2"; shift 2 ;;
        --email)     CUSTOMER_EMAIL="$2"; shift 2 ;;
        --company)   COMPANY="$2"; shift 2 ;;
        --vertical)  VERTICAL="$2"; shift 2 ;;
        --dry-run)   DRY_RUN=true; shift ;;
        -h|--help)   usage ;;
        *)           err "Unknown option: $1"; usage ;;
    esac
done

# ── Validate ──
if [ -z "$CUSTOMER_NAME" ] || [ -z "$CUSTOMER_EMAIL" ] || [ -z "$COMPANY" ] || [ -z "$VERTICAL" ]; then
    err "Missing required parameters"
    usage
fi

VALID=false
for v in $VERTICALS; do
    if [ "$v" = "$VERTICAL" ]; then VALID=true; break; fi
done
if [ "$VALID" = false ]; then
    err "Invalid vertical: $VERTICAL (valid: $VERTICALS)"
    exit 1
fi

# Validate email format
if ! echo "$CUSTOMER_EMAIL" | grep -qE '^[^@]+@[^@]+\.[^@]+$'; then
    err "Invalid email: $CUSTOMER_EMAIL"
    exit 1
fi

# ── Get recommended skills for vertical ──
get_recommended_skills() {
    local vert="$1"
    case "$vert" in
        ecommerce)  echo "inventory-tracker order-notifier customer-chat analytics-dashboard" ;;
        saas)       echo "usage-metrics onboarding-flow api-monitor churn-predictor" ;;
        finance)    echo "transaction-monitor compliance-checker report-generator risk-scorer" ;;
        healthcare) echo "appointment-scheduler patient-notifier compliance-hipaa record-manager" ;;
        marketing)  echo "social-scheduler content-analyzer seo-tracker campaign-monitor" ;;
        devops)     echo "deploy-notifier incident-responder log-analyzer uptime-checker" ;;
        legal)      echo "document-reviewer contract-tracker deadline-monitor billing-tracker" ;;
        education)  echo "student-notifier grade-tracker content-curator schedule-manager" ;;
        other)      echo "task-automator notification-hub data-connector report-builder" ;;
    esac
}

# ── Generate customer ID ──
CUSTOMER_ID=$(echo "${COMPANY}-$(date +%s)" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')

info "Onboarding CMA customer: $CUSTOMER_NAME ($COMPANY)"
echo ""

# ── Step 1: Create CRM record ──
info "Step 1: Creating CRM record..."

mkdir -p "$CRM_DIR/customers"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SIGNUP_DATE=$(date -u +"%Y-%m-%d")

CRM_FILE="$CRM_DIR/customers/${CUSTOMER_ID}.json"

cat > "$CRM_FILE" <<CRMEOF
{
  "id": "$CUSTOMER_ID",
  "name": "$CUSTOMER_NAME",
  "email": "$CUSTOMER_EMAIL",
  "company": "$COMPANY",
  "vertical": "$VERTICAL",
  "plan": "cma",
  "status": "onboarding",
  "signup_date": "$SIGNUP_DATE",
  "created_at": "$TIMESTAMP",
  "recommended_skills": "$(get_recommended_skills "$VERTICAL")",
  "lifecycle": {
    "welcome_email": "pending",
    "7day_followup": "scheduled",
    "30day_checkin": "scheduled"
  },
  "notes": []
}
CRMEOF

log "CRM record created: $CRM_FILE"

# Append to master log
echo "{\"event\":\"customer_signup\",\"id\":\"$CUSTOMER_ID\",\"email\":\"$CUSTOMER_EMAIL\",\"company\":\"$COMPANY\",\"vertical\":\"$VERTICAL\",\"timestamp\":\"$TIMESTAMP\"}" >> "$CRM_DIR/events.jsonl"

# ── Step 2: Send welcome email ──
info "Step 2: Sending welcome email..."

RECOMMENDED=$(get_recommended_skills "$VERTICAL")

# Build skills list for email
SKILLS_LIST=""
for skill in $RECOMMENDED; do
    SKILLS_LIST="$SKILLS_LIST
  - $skill: clawhub install $skill"
done

WELCOME_SUBJECT="Welcome to OpenClaw + ClawHub — Let's get you set up!"
WELCOME_BODY="Hi $CUSTOMER_NAME,

Welcome to OpenClaw! You're now part of the CMA (Customer Managed Agents) program.

Here's how to get started with ClawHub:

1. Install OpenClaw (if you haven't already):
   npm i -g openclaw

2. Install the ClawHub CLI:
   npm i -g clawhub

3. Browse skills:
   clawhub search \"$VERTICAL\"

4. Based on your vertical ($VERTICAL), we recommend these skills:
$SKILLS_LIST

5. Install a skill:
   clawhub install <skill-name>

Need help? Reply to this email or visit https://clawhub.com/docs

— The AfrexAI Team"

if [ "$DRY_RUN" = true ]; then
    info "[DRY RUN] Would send welcome email to: $CUSTOMER_EMAIL"
    echo "  Subject: $WELCOME_SUBJECT"
else
    # Use openclaw email or sendgrid if available
    if command -v openclaw >/dev/null 2>&1; then
        echo "$WELCOME_BODY" | openclaw email send \
            --to "$CUSTOMER_EMAIL" \
            --subject "$WELCOME_SUBJECT" \
            --from "hello@afrexai.com" 2>/dev/null && log "Welcome email sent" || warn "Email send failed — logging for manual follow-up"
    elif command -v sendmail >/dev/null 2>&1; then
        printf "To: %s\nSubject: %s\nFrom: hello@afrexai.com\n\n%s" "$CUSTOMER_EMAIL" "$WELCOME_SUBJECT" "$WELCOME_BODY" | sendmail -t 2>/dev/null && log "Welcome email sent" || warn "Email send failed — logging for manual follow-up"
    else
        warn "No email tool available. Saving email to file for manual send."
        mkdir -p "$CRM_DIR/pending-emails"
        cat > "$CRM_DIR/pending-emails/${CUSTOMER_ID}-welcome.txt" <<EMAILEOF
To: $CUSTOMER_EMAIL
Subject: $WELCOME_SUBJECT
From: hello@afrexai.com

$WELCOME_BODY
EMAILEOF
        log "Email saved: $CRM_DIR/pending-emails/${CUSTOMER_ID}-welcome.txt"
    fi
fi

# ── Step 3: Provision recommended skills list ──
info "Step 3: Provisioning recommended skills..."

RECOMMENDED=$(get_recommended_skills "$VERTICAL")
log "Recommended skills for $VERTICAL vertical:"
for skill in $RECOMMENDED; do
    echo "  → $skill"
done

# Save recommendations to customer file
mkdir -p "$CRM_DIR/recommendations"
echo "# Recommended Skills for $COMPANY ($VERTICAL)" > "$CRM_DIR/recommendations/${CUSTOMER_ID}.md"
echo "" >> "$CRM_DIR/recommendations/${CUSTOMER_ID}.md"
echo "Generated: $TIMESTAMP" >> "$CRM_DIR/recommendations/${CUSTOMER_ID}.md"
echo "" >> "$CRM_DIR/recommendations/${CUSTOMER_ID}.md"
for skill in $RECOMMENDED; do
    echo "- [ ] \`clawhub install $skill\`" >> "$CRM_DIR/recommendations/${CUSTOMER_ID}.md"
done

# ── Step 4: Schedule 7-day follow-up ──
info "Step 4: Scheduling 7-day follow-up..."

FOLLOWUP_7D=$(date -u -v+7d +"%Y-%m-%d" 2>/dev/null || date -u -d "+7 days" +"%Y-%m-%d" 2>/dev/null || echo "$(date -u +%Y-%m-%d)+7d")

FOLLOWUP_BODY="Hi $CUSTOMER_NAME,

It's been a week since you joined OpenClaw! How's it going?

Quick check:
- Have you installed any ClawHub skills yet?
- Any questions about setting up your agents?
- Need help with your $VERTICAL workflow?

We're here to help. Just reply to this email.

— The AfrexAI Team"

mkdir -p "$CRM_DIR/scheduled"
cat > "$CRM_DIR/scheduled/${CUSTOMER_ID}-7day.json" <<SCHEDEOF
{
  "type": "followup_email",
  "customer_id": "$CUSTOMER_ID",
  "email": "$CUSTOMER_EMAIL",
  "scheduled_date": "$FOLLOWUP_7D",
  "subject": "How's OpenClaw going? — 7-day check-in",
  "body_file": "${CUSTOMER_ID}-7day-body.txt",
  "status": "pending"
}
SCHEDEOF

cat > "$CRM_DIR/scheduled/${CUSTOMER_ID}-7day-body.txt" <<BODYEOF
$FOLLOWUP_BODY
BODYEOF

log "7-day follow-up scheduled for: $FOLLOWUP_7D"

# ── Step 5: Schedule 30-day check-in ──
info "Step 5: Scheduling 30-day check-in..."

FOLLOWUP_30D=$(date -u -v+30d +"%Y-%m-%d" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%d" 2>/dev/null || echo "$(date -u +%Y-%m-%d)+30d")

CHECKIN_BODY="Hi $CUSTOMER_NAME,

You've been with OpenClaw for a month now! Let's chat about how things are going.

We'd love to:
- Review your agent setup and suggest optimizations
- Recommend new skills based on your usage
- Hear your feedback on ClawHub
- Discuss any custom skill needs

Would you like to schedule a quick 15-minute call?
Book here: https://calendly.com/afrexai/cma-checkin

— The AfrexAI Team"

cat > "$CRM_DIR/scheduled/${CUSTOMER_ID}-30day.json" <<SCHEDEOF
{
  "type": "checkin_email",
  "customer_id": "$CUSTOMER_ID",
  "email": "$CUSTOMER_EMAIL",
  "scheduled_date": "$FOLLOWUP_30D",
  "subject": "30-day check-in — Let's optimize your setup",
  "body_file": "${CUSTOMER_ID}-30day-body.txt",
  "status": "pending"
}
SCHEDEOF

cat > "$CRM_DIR/scheduled/${CUSTOMER_ID}-30day-body.txt" <<BODYEOF
$CHECKIN_BODY
BODYEOF

log "30-day check-in scheduled for: $FOLLOWUP_30D"

# ── Schedule processor hint ──
# To process scheduled emails, run a cron or heartbeat that checks:
#   $CRM_DIR/scheduled/*.json where scheduled_date <= today and status == pending

# ── Summary ──
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Onboarding complete for $CUSTOMER_NAME ($COMPANY)"
echo ""
echo "  Customer ID:    $CUSTOMER_ID"
echo "  Vertical:       $VERTICAL"
echo "  CRM Record:     $CRM_FILE"
echo "  Skills:         $(get_recommended_skills "$VERTICAL" | wc -w | tr -d ' ') recommended"
echo "  7-day followup: $FOLLOWUP_7D"
echo "  30-day checkin: $FOLLOWUP_30D"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
