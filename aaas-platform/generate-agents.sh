#!/usr/bin/env bash
# generate-agents.sh — Generate vertical-aware agents for a customer
# Usage: ./generate-agents.sh <customer-slug> <vertical> <tier> [--force]
#
# Reads roster.json for the vertical, selects agents based on tier,
# copies templates to the customer directory, and replaces placeholders.
#
# Idempotent: skips existing agents unless --force is passed.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"
CUSTOMERS_DIR="$SCRIPT_DIR/customers"
PRICING_FILE="$SCRIPT_DIR/pricing.json"

# --- Argument Parsing ---
FORCE=false
SLUG=""
VERTICAL=""
TIER=""

for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    *)
      if [ -z "$SLUG" ]; then SLUG="$arg"
      elif [ -z "$VERTICAL" ]; then VERTICAL="$arg"
      elif [ -z "$TIER" ]; then TIER="$arg"
      fi
      ;;
  esac
done

if [ -z "$SLUG" ] || [ -z "$VERTICAL" ] || [ -z "$TIER" ]; then
  echo "Usage: $0 <customer-slug> <vertical> <tier> [--force]"
  echo ""
  echo "  customer-slug   e.g. hartwell-associates"
  echo "  vertical        legal|construction|healthcare|financial-services|saas|professional-services"
  echo "  tier            starter|growth|scale|enterprise"
  echo "  --force         Overwrite existing agent files"
  exit 1
fi

# --- Validate inputs ---
ROSTER_FILE="$TEMPLATES_DIR/$VERTICAL/roster.json"
if [ ! -f "$ROSTER_FILE" ]; then
  echo "❌ Unknown vertical: $VERTICAL"
  echo "   Available: $(ls -d "$TEMPLATES_DIR"/*/ 2>/dev/null | xargs -I{} basename {} | tr '\n' ' ')"
  exit 1
fi

CUSTOMER_DIR="$CUSTOMERS_DIR/$SLUG"

# --- Read agent count for tier ---
AGENT_COUNT=$(python3 -c "
import json, sys
try:
    pricing = json.load(open('$PRICING_FILE'))
    tier = pricing['tiers'].get('$TIER')
    if not tier:
        print('ERROR', file=sys.stderr)
        sys.exit(1)
    print(tier['agents'])
except Exception as e:
    # Fallback if pricing.json doesn't exist yet
    counts = {'starter': 1, 'growth': 3, 'scale': 10, 'enterprise': 9}
    c = counts.get('$TIER')
    if c is None:
        print(f'❌ Unknown tier: $TIER', file=sys.stderr)
        sys.exit(1)
    print(c)
")

# --- Read roster and select agents ---
AGENTS_JSON=$(python3 -c "
import json
roster = json.load(open('$ROSTER_FILE'))
agents = roster['agents']
count = min($AGENT_COUNT, len(agents))
selected = agents[:count]
for a in selected:
    print(a['id'])
")

# --- Read customer profile for placeholder values ---
COMPANY_NAME="$SLUG"
CONTACT_NAME=""
VERTICAL_LABEL="$VERTICAL"

PROFILE_FILE="$CUSTOMER_DIR/profile.json"
if [ -f "$PROFILE_FILE" ]; then
  COMPANY_NAME=$(python3 -c "import json; p=json.load(open('$PROFILE_FILE')); print(p.get('company_name', '$SLUG'))")
  CONTACT_NAME=$(python3 -c "import json; p=json.load(open('$PROFILE_FILE')); print(p.get('contact_name', '') or p.get('email', ''))")
fi

VERTICAL_LABEL=$(python3 -c "import json; r=json.load(open('$ROSTER_FILE')); print(r.get('vertical_label', '$VERTICAL'))")

# --- Create customer agents directory ---
mkdir -p "$CUSTOMER_DIR/agents"

# --- Generate agents ---
GENERATED=0
SKIPPED=0

while IFS= read -r AGENT_ID; do
  [ -z "$AGENT_ID" ] && continue
  
  TEMPLATE_DIR="$TEMPLATES_DIR/$VERTICAL/agents/$AGENT_ID"
  DEST_DIR="$CUSTOMER_DIR/agents/$AGENT_ID"
  
  if [ ! -d "$TEMPLATE_DIR" ]; then
    echo "⚠️  Template not found: $TEMPLATE_DIR — skipping"
    continue
  fi
  
  if [ -d "$DEST_DIR" ] && [ "$FORCE" = false ]; then
    echo "⏭️  $AGENT_ID already exists (use --force to overwrite)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi
  
  mkdir -p "$DEST_DIR"
  
  # Copy and replace placeholders
  for TEMPLATE_FILE in "$TEMPLATE_DIR"/*.md; do
    [ ! -f "$TEMPLATE_FILE" ] && continue
    FILENAME=$(basename "$TEMPLATE_FILE")
    
    # Escape sed special chars in replacement strings (& and \)
    SAFE_COMPANY=$(printf '%s' "$COMPANY_NAME" | sed 's/[&\\/]/\\&/g')
    SAFE_CONTACT=$(printf '%s' "$CONTACT_NAME" | sed 's/[&\\/]/\\&/g')
    SAFE_VLABEL=$(printf '%s' "$VERTICAL_LABEL" | sed 's/[&\\/]/\\&/g')
    
    sed \
      -e "s|{{COMPANY}}|${SAFE_COMPANY}|g" \
      -e "s|{{COMPANY_NAME}}|${SAFE_COMPANY}|g" \
      -e "s|{{CONTACT}}|${SAFE_CONTACT}|g" \
      -e "s|{{CONTACT_NAME}}|${SAFE_CONTACT}|g" \
      -e "s|{{VERTICAL}}|${SAFE_VLABEL}|g" \
      -e "s|{{TIER}}|${TIER}|g" \
      -e "s|{{CUSTOMER_SLUG}}|${SLUG}|g" \
      -e "s|{{AGENT_NAME}}|${AGENT_ID}|g" \
      "$TEMPLATE_FILE" > "$DEST_DIR/$FILENAME"
  done
  
  echo "✅ Generated: $AGENT_ID"
  GENERATED=$((GENERATED + 1))
  
done <<< "$AGENTS_JSON"

# --- Update profile.json agents array if profile exists ---
if [ -f "$PROFILE_FILE" ]; then
  python3 -c "
import json, datetime

profile = json.load(open('$PROFILE_FILE'))
existing_ids = {a['id'] for a in profile.get('agents', [])}
roster = json.load(open('$ROSTER_FILE'))
count = min($AGENT_COUNT, len(roster['agents']))
selected = roster['agents'][:count]

for agent in selected:
    if agent['id'] not in existing_ids:
        profile.setdefault('agents', []).append({
            'id': agent['id'],
            'name': agent['name'],
            'template': '$VERTICAL/' + agent['id'],
            'status': 'active',
            'deployed_at': datetime.datetime.utcnow().isoformat() + 'Z'
        })

json.dump(profile, open('$PROFILE_FILE', 'w'), indent=2)
print('📋 Updated profile.json with agent entries')
"
fi

# --- Summary ---
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Agent Generation Complete"
echo "  Customer:  $SLUG"
echo "  Vertical:  $VERTICAL_LABEL"
echo "  Tier:      $TIER (up to $AGENT_COUNT agents)"
echo "  Generated: $GENERATED"
echo "  Skipped:   $SKIPPED"
echo "  Location:  $CUSTOMER_DIR/agents/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
