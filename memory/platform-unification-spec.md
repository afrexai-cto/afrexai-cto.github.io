# AfrexAI Platform Unification Spec

**Date:** 2026-02-16  
**Status:** PLAN — Do not implement until approved  
**Problem:** 3 disconnected customer records, 3 pricing models, no vertical-aware agent generation

---

## 1. Architecture Overview

```
autopilot.sh (SOLE entry point)
  ├── 1. Create unified profile.json
  ├── 2. Read pricing from aaas-platform/pricing.json
  ├── 3. Generate agents from templates via generate-agents.sh
  ├── 4. Register billing via billing-tracker.sh (reads pricing.json)
  ├── 5. CRM + welcome email (inline, replaces customer-onboard-cma.sh call)
  ├── 6. Health check + monitoring setup
  └── 7. Summary

Single customer directory: aaas-platform/customers/<slug>/
```

---

## 2. New File: `aaas-platform/pricing.json`

Single source of truth. All prices USD. All scripts read this file.

```json
{
  "currency": "USD",
  "tiers": {
    "starter":    { "price": 1500, "agents": 1 },
    "growth":     { "price": 4500, "agents": 3 },
    "scale":      { "price": 7500, "agents": 10 },
    "enterprise": { "price": 12000, "agents": 9 }
  },
  "vertical_premiums": {
    "legal": 10,
    "healthcare": 10,
    "finance": 5,
    "construction": 0,
    "saas": 0,
    "professional-services": 0,
    "general": 0
  },
  "overage_per_agent": 1800,
  "annual_discount_pct": 15,
  "support_addons": {
    "standard": 0,
    "priority": 500,
    "dedicated": 2000
  }
}
```

---

## 3. Unified Customer Profile: `aaas-platform/customers/<slug>/profile.json`

```json
{
  "slug": "hartwell-associates",
  "company_name": "Hartwell & Associates LLP",
  "contact_name": "",
  "email": "contact@hartwell.com",
  "tier": "growth",
  "vertical": "legal",
  "agents": [
    {
      "id": "legal-researcher",
      "name": "Legal Researcher",
      "template": "legal/legal-researcher",
      "status": "active",
      "deployed_at": "2026-02-16T18:00:00Z"
    }
  ],
  "pricing": {
    "base_price": 4500,
    "vertical_premium_pct": 10,
    "vertical_premium_amount": 450,
    "monthly_total": 4950,
    "currency": "USD",
    "billing_cycle": "monthly"
  },
  "status": "active",
  "created_at": "2026-02-16T18:00:00Z",
  "api_key": "afxk_..."
}
```

---

## 4. Slug Fix

In `autopilot.sh`, change the slug generation line:

```bash
# OLD (line ~30):
CUSTOMER_SLUG="$(echo "$COMPANY_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')"

# NEW:
CUSTOMER_SLUG="$(echo "$COMPANY_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')"
```

---

## 5. Vertical-Aware Agent Templates

### Directory structure

```
aaas-platform/templates/
├── legal/
│   ├── legal-researcher/
│   │   ├── SOUL.md
│   │   ├── AGENTS.md
│   │   └── HEARTBEAT.md
│   ├── contract-reviewer/
│   │   ├── SOUL.md, AGENTS.md, HEARTBEAT.md
│   └── compliance-monitor/
│       ├── SOUL.md, AGENTS.md, HEARTBEAT.md
├── construction/
│   ├── project-tracker/
│   ├── safety-monitor/
│   └── bid-analyst/
├── healthcare/
│   ├── patient-scheduler/
│   ├── claims-processor/
│   └── compliance-auditor/
├── financial-services/
│   ├── bookkeeper/
│   ├── financial-analyst/
│   └── audit-monitor/
├── saas/
│   ├── usage-analyst/
│   ├── onboarding-assistant/
│   └── churn-predictor/
└── professional-services/
    ├── project-manager/
    ├── client-communicator/
    └── billing-assistant/
```

### Template variables (used in SOUL.md etc.)

Templates use `{{COMPANY_NAME}}`, `{{AGENT_NAME}}`, `{{VERTICAL}}`, `{{TIER}}`, `{{CUSTOMER_SLUG}}` placeholders. The generator does `sed` replacement.

### Default roster mapping file: `aaas-platform/templates/roster.json`

```json
{
  "legal": ["legal-researcher", "contract-reviewer", "compliance-monitor"],
  "construction": ["project-tracker", "safety-monitor", "bid-analyst"],
  "healthcare": ["patient-scheduler", "claims-processor", "compliance-auditor"],
  "financial-services": ["bookkeeper", "financial-analyst", "audit-monitor"],
  "saas": ["usage-analyst", "onboarding-assistant", "churn-predictor"],
  "professional-services": ["project-manager", "client-communicator", "billing-assistant"],
  "general": ["general-assistant", "researcher", "scheduler"]
}
```

The tier's agent count determines how many agents from the roster are deployed (first N).

---

## 6. New Script: `aaas-platform/generate-agents.sh`

**Usage:** `./generate-agents.sh <customer-slug> <vertical> <tier>`

**Logic:**
1. Read `pricing.json` → get agent count for tier
2. Read `templates/roster.json` → get agent list for vertical, take first N
3. For each agent:
   - Copy `templates/<vertical>/<agent>/` → `customers/<slug>/agents/<agent>/`
   - Replace template variables in all `.md` files
   - Write agent entry to `customers/<slug>/profile.json` agents array
4. Generate `customers/<slug>/agent-manifest.json`

**Does NOT** create the customer directory or profile — that's autopilot's job. This script only populates agents.

---

## 7. Script Modifications

### 7a. `aaas-platform/autopilot.sh` — Major rewrite

**Add `--vertical` parameter (4th positional or `--vertical` flag):**

```bash
# Usage line becomes:
# Usage: ./autopilot.sh "Company Name" "email" "tier" "vertical"
VERTICAL="${4:-general}"
```

**Remove all inline pricing.** Replace `pkg_price()` with:

```bash
# Read from pricing.json
PRICING_FILE="${PLATFORM_DIR}/pricing.json"
read_pricing() {
    python3 -c "
import json, sys
p = json.load(open('${PRICING_FILE}'))
tier = '${PACKAGE}'
vertical = '${VERTICAL}'
base = p['tiers'][tier]['price']
vpct = p['vertical_premiums'].get(vertical, 0)
premium = base * vpct // 100
print(f'{base} {vpct} {premium} {base + premium} {p[\"tiers\"][tier][\"agents\"]}')
"
}
read -r BASE_PRICE VPCT VPREMIUM TOTAL_PRICE AGENT_COUNT <<< "$(read_pricing)"
```

**Remove `pkg_agents()`, `pkg_roster()`, `pkg_tier_billing()`.** All derived from pricing.json + roster.json.

**Replace Step 1 (Provision Workspace):** Instead of calling `customer-onboarding.sh`, create profile.json directly:

```bash
mkdir -p "$CUSTOMER_DIR"/{agents,config,monitoring}
python3 -c "
import json, datetime
profile = {
    'slug': '${CUSTOMER_SLUG}',
    'company_name': '${COMPANY_NAME}',
    'contact_name': '',
    'email': '${CONTACT_EMAIL}',
    'tier': '${PACKAGE}',
    'vertical': '${VERTICAL}',
    'agents': [],
    'pricing': {
        'base_price': ${BASE_PRICE},
        'vertical_premium_pct': ${VPCT},
        'vertical_premium_amount': ${VPREMIUM},
        'monthly_total': ${TOTAL_PRICE},
        'currency': 'USD',
        'billing_cycle': 'monthly'
    },
    'status': 'active',
    'created_at': datetime.datetime.utcnow().isoformat() + 'Z',
    'api_key': ''
}
json.dump(profile, open('${CUSTOMER_DIR}/profile.json', 'w'), indent=2)
"
```

**Replace Step 2 (Agent creation):** Call `generate-agents.sh` instead of iterating roster inline:

```bash
bash "${PLATFORM_DIR}/generate-agents.sh" "$CUSTOMER_SLUG" "$VERTICAL" "$PACKAGE"
```

**Replace Step 3 (Billing):** Pass USD amount from profile, not a tier name:

```bash
bash "$STEP2_DIR/billing-tracker.sh" add "$CUSTOMER_SLUG" "$PACKAGE" "$START_DATE"
```

billing-tracker.sh will read pricing.json (see 7d below).

**Replace Step 6 (Welcome email):** Use `$TOTAL_PRICE` not `$PRICE`. Show vertical premium if applicable:

```
Your monthly investment: $${TOTAL_PRICE}/mo (includes $${VPREMIUM} ${VERTICAL} vertical premium)
```

**Remove Step 7 CRM logging to separate file.** Profile.json IS the customer record. Append event to `aaas-platform/crm-log.jsonl` as before but with unified slug.

**Do NOT call `provision-customer.sh` or `customer-onboard-cma.sh`.** Autopilot handles everything. Those scripts become legacy/deprecated.

### 7b. `workflows/step3-hosted/provision-customer.sh` — DEPRECATE

- Add a header comment: `# DEPRECATED — use aaas-platform/autopilot.sh instead`
- Optionally refactor as a thin wrapper that calls autopilot.sh
- Its vertical agent roster logic is replaced by `templates/roster.json`
- Its customer directory under `workflows/step3-hosted/data/customers/` is no longer used

### 7c. `workflows/step1-skills/customer-onboard-cma.sh` — DEPRECATE

- Add header: `# DEPRECATED — CRM + email now handled by autopilot.sh`
- The CRM record creation, email sending, and follow-up scheduling should be extracted into helper functions callable from autopilot.sh OR moved into a `aaas-platform/crm-helpers.sh` library that autopilot sources
- Key logic to preserve:
  - 7-day and 30-day follow-up scheduling → move to autopilot Step 7
  - Email queueing to pending-emails dir → move to autopilot Step 6

### 7d. `workflows/step2-agents/billing-tracker.sh` — Convert GBP → USD

**Remove all GBP pricing.** Replace `tier_price_pence()` with pricing.json reader:

```bash
# OLD: hardcoded pence values
# NEW: read from pricing.json in cents (USD)
PRICING_FILE="$(cd "$(dirname "$0")/../../aaas-platform" && pwd)/pricing.json"

tier_price_cents() {
    python3 -c "
import json
p = json.load(open('${PRICING_FILE}'))
print(int(p['tiers']['$1']['price'] * 100))
"
}
```

**Replace `format_price()`:**

```bash
# OLD: format_price outputs £
# NEW:
format_price() {
    local cents="$1"
    local dollars=$((cents / 100))
    local remainder=$((cents % 100))
    printf "\$%d.%02d" "\$dollars" "\$remainder"
}
```

**Replace `tier_agent_limit()`:** Read from pricing.json `tiers.<tier>.agents`.

**Update invoice template:** Change all `£` to `$`, reference "USD" explicitly.

**Update usage help text:** Replace all `£` prices with `$` equivalents from pricing.json tiers.

### 7e. `workflows/step3-hosted/pricing-engine.sh` — Read from pricing.json

**Remove hardcoded constants** (lines ~16-26: `STARTER_PRICE`, `GROWTH_PRICE`, etc.):

```bash
# OLD:
STARTER_PRICE=1500
# ...

# NEW: Load from pricing.json
PRICING_FILE="$(cd "$(dirname "$0")/../../aaas-platform" && pwd)/pricing.json"
load_pricing() {
    eval "$(python3 -c "
import json
p = json.load(open('${PRICING_FILE}'))
for t, v in p['tiers'].items():
    print(f\"{t.upper()}_PRICE={v['price']}\")
    print(f\"{t.upper()}_AGENTS={v['agents']}\")
print(f\"OVERAGE_PER_AGENT={p['overage_per_agent']}\")
print(f\"ANNUAL_DISCOUNT={p['annual_discount_pct']}\")
for v, pct in p['vertical_premiums'].items():
    safe = v.upper().replace('-','_')
    print(f\"VERTICAL_PREMIUM_{safe}={pct}\")
\")"
}
load_pricing
```

**Update `vertical_premium_pct()`:** Read dynamically from the loaded variables instead of hardcoded case statement.

---

## 8. Files to Monitor/Update for Consistency

| Script | Reads pricing.json | Reads profile.json | Writes profile.json |
|--------|---|---|---|
| autopilot.sh | ✅ | — (creates it) | ✅ |
| generate-agents.sh | ✅ (agent count) | ✅ (updates agents[]) | ✅ |
| billing-tracker.sh | ✅ | ✅ (reads total) | ❌ |
| pricing-engine.sh | ✅ | ❌ | ❌ |
| sla-monitor.sh | ❌ | ✅ (reads agents) | ❌ |
| multi-tenant-manager.sh | ❌ | ✅ | ❌ |
| customer-portal-data.sh | ❌ | ✅ | ❌ |
| backup-restore.sh | ❌ | ✅ | ❌ |

**multi-tenant-manager.sh, sla-monitor.sh, customer-portal-data.sh, backup-restore.sh** — Change their `CUSTOMERS_DIR` to point at `aaas-platform/customers/` and read `profile.json` instead of `config/manifest.json`.

---

## 9. Implementation Order

Execute in this exact sequence:

1. **Create `aaas-platform/pricing.json`** — zero dependencies, everything reads from it
2. **Create `aaas-platform/templates/roster.json`** — maps verticals to agent names
3. **Create agent template directories** — `aaas-platform/templates/<vertical>/<agent>/` with SOUL.md, AGENTS.md, HEARTBEAT.md for all 6 verticals × 3 agents = 18 agent templates
4. **Create `aaas-platform/generate-agents.sh`** — reads pricing.json + roster.json + templates
5. **Rewrite `aaas-platform/autopilot.sh`** — unified flow, reads pricing.json, calls generate-agents.sh, creates profile.json, handles CRM + email
6. **Rewrite `workflows/step2-agents/billing-tracker.sh`** — GBP→USD, reads pricing.json
7. **Rewrite `workflows/step3-hosted/pricing-engine.sh`** — reads pricing.json instead of hardcoded constants
8. **Update `multi-tenant-manager.sh`, `sla-monitor.sh`, `customer-portal-data.sh`, `backup-restore.sh`** — point at `aaas-platform/customers/`, read profile.json
9. **Deprecate `provision-customer.sh` and `customer-onboard-cma.sh`** — add deprecation headers, leave functional for rollback
10. **Write integration test** — runs autopilot for a test customer, asserts single profile.json, correct USD pricing, vertical-appropriate agents

---

## 10. Migration for Existing Customers

For any customers already created under the old structure:

```bash
# Script: aaas-platform/migrate-customer.sh <old-customer-dir>
# 1. Read old manifest.json or billing data
# 2. Create new profile.json at aaas-platform/customers/<slug>/
# 3. Copy agent dirs
# 4. Recalculate pricing from pricing.json
# 5. Archive old directory
```

Not urgent for MVP (only test data exists) but needed before any real customers.

---

## 11. Summary of All New Files

| File | Purpose |
|------|---------|
| `aaas-platform/pricing.json` | Single pricing source of truth |
| `aaas-platform/templates/roster.json` | Vertical → agent mapping |
| `aaas-platform/templates/<vertical>/<agent>/SOUL.md` | 18 agent templates (6 verticals × 3) |
| `aaas-platform/templates/<vertical>/<agent>/AGENTS.md` | 18 files |
| `aaas-platform/templates/<vertical>/<agent>/HEARTBEAT.md` | 18 files |
| `aaas-platform/generate-agents.sh` | Agent generator CLI |
| `aaas-platform/migrate-customer.sh` | One-time migration (optional) |

**Total: 57 new files** (3 config + 54 templates + 2 scripts)

## 12. What Gets Deleted (Eventually)

- `workflows/step3-hosted/data/customers/` — replaced by `aaas-platform/customers/`
- `data/crm/customers/` — replaced by profile.json
- Hardcoded pricing in all scripts
- `customer-onboarding.sh` call from autopilot (if it exists as a separate script)
