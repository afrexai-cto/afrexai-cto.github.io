#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Portal Auth Token Generator
# Usage: ./portal-token.sh <slug> <email>
# Generates token, stores in customer dir, outputs token to stdout
# ============================================================================

PLATFORM_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SLUG="$1"; EMAIL="$2"
CUSTOMER_DIR="${PLATFORM_DIR}/customers/${SLUG}"
TOKEN_FILE="${CUSTOMER_DIR}/portal-auth.json"
TS="$(date -u +%FT%TZ)"

# Generate 64-char hex token (SHA-256 of slug+random for uniqueness)
RANDOM_SEED="$(openssl rand -hex 16)"
TOKEN="$(echo -n "${SLUG}:${RANDOM_SEED}" | openssl dgst -sha256 | awk '{print $NF}')"

# Calculate expiry (90 days)
if [[ "$(uname)" == "Darwin" ]]; then
  EXPIRES="$(date -u -v+90d +%FT%TZ)"
else
  EXPIRES="$(date -u -d '+90 days' +%FT%TZ)"
fi

PORTAL_URL="https://portal.afrexai.com/login?token=${TOKEN}"

mkdir -p "$CUSTOMER_DIR"
cat > "$TOKEN_FILE" <<EOF
{
  "token": "${TOKEN}",
  "email": "${EMAIL}",
  "portal_url": "${PORTAL_URL}",
  "created": "${TS}",
  "expires": "${EXPIRES}"
}
EOF

echo "$TOKEN"
