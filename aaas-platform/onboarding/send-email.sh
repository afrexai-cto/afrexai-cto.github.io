#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# AfrexAI Email Sender
# Usage: ./send-email.sh --to <email> --subject <subject> --body <file> [--from <alias>]
# Sends via Gmail SMTP (python3 smtplib). Falls back to outbox/ on failure.
# Credentials: op://AfrexAI/Gmail-SMTP/username, op://AfrexAI/Gmail-SMTP/app_password
# ============================================================================

PLATFORM_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTBOX_DIR="${PLATFORM_DIR}/outbox"
EMAIL_LOG="${PLATFORM_DIR}/email-log.jsonl"
DRY_RUN="${DRY_RUN:-false}"

TO="" SUBJECT="" BODY_FILE="" FROM_ALIAS="AfrexAI <noreply@afrexai.com>"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --to)      TO="$2"; shift 2;;
    --subject) SUBJECT="$2"; shift 2;;
    --body)    BODY_FILE="$2"; shift 2;;
    --from)    FROM_ALIAS="$2"; shift 2;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
done

[[ -z "$TO" || -z "$SUBJECT" || -z "$BODY_FILE" ]] && { echo "❌ Usage: send-email.sh --to <email> --subject <subject> --body <file>"; exit 1; }
[[ -f "$BODY_FILE" ]] || { echo "❌ Body file not found: $BODY_FILE"; exit 1; }

BODY="$(cat "$BODY_FILE")"
TS="$(date -u +%FT%TZ)"

log_email() {
  local status="$1" detail="${2:-}"
  echo "{\"ts\":\"${TS}\",\"to\":\"${TO}\",\"subject\":\"${SUBJECT}\",\"from\":\"${FROM_ALIAS}\",\"status\":\"${status}\",\"detail\":\"${detail}\"}" >> "$EMAIL_LOG"
}

# DRY_RUN: just log
if [[ "$DRY_RUN" == "true" ]]; then
  echo "📧 [DRY_RUN] Would send to: $TO | Subject: $SUBJECT"
  log_email "dry_run"
  exit 0
fi

# Try SMTP via python3
send_smtp() {
  local GMAIL_USER GMAIL_PASS
  GMAIL_USER="$(op read 'op://AfrexAI/Gmail-SMTP/username' 2>/dev/null)" || return 1
  GMAIL_PASS="$(op read 'op://AfrexAI/Gmail-SMTP/app_password' 2>/dev/null)" || return 1

  python3 -c "
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import sys, os

msg = MIMEMultipart('alternative')
msg['Subject'] = '''${SUBJECT}'''
msg['From'] = '''${FROM_ALIAS}'''
msg['To'] = '''${TO}'''
body = open('''${BODY_FILE}''').read()
msg.attach(MIMEText(body, 'plain', 'utf-8'))

try:
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as s:
        s.login(os.environ['GMAIL_USER'], os.environ['GMAIL_PASS'])
        s.send_message(msg)
    print('✅ Email sent')
except Exception as e:
    print(f'SMTP_ERROR:{e}', file=sys.stderr)
    sys.exit(1)
" 2>&1
}

export GMAIL_USER GMAIL_PASS
if RESULT="$(send_smtp 2>&1)"; then
  echo "📧 Sent to $TO: $SUBJECT"
  log_email "sent"
else
  echo "⚠️  SMTP failed, saving to outbox: $RESULT"
  mkdir -p "$OUTBOX_DIR"
  OUTBOX_FILE="${OUTBOX_DIR}/$(date +%s)-$(echo "$TO" | tr '@.' '_').json"
  cat > "$OUTBOX_FILE" <<EOF
{"to":"${TO}","subject":"${SUBJECT}","from":"${FROM_ALIAS}","body_file":"${BODY_FILE}","queued_at":"${TS}"}
EOF
  log_email "outbox" "$RESULT"
fi
