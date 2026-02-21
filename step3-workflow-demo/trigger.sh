#!/bin/bash
# ============================================================================
# TRIGGER: New Client Intake Form Received
# Hartwell Associates LLP — Client Onboarding Pipeline
# ============================================================================
set -e
DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$DEMO_DIR/demo-output"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%S")
CLIENT_ID="HA-2026-$(printf '%04d' $((RANDOM % 9999)))"

# Create intake JSON
cat > "$OUTPUT_DIR/intake.json" << 'INTAKE_EOF'
{
  "client_id": "HA-2026-0347",
  "intake_timestamp": "2026-02-21T09:14:22Z",
  "source": "website_form",
  "status": "new",
  "contact": {
    "company_name": "Meridian Supply Chain Solutions Ltd",
    "trading_as": "Meridian SCS",
    "company_number": "14829361",
    "registered_address": "45 Canary Wharf Tower, London E14 5AB",
    "website": "https://meridianscs.co.uk",
    "industry": "Logistics & Supply Chain Management",
    "annual_revenue": "£12.4M",
    "employee_count": 86
  },
  "primary_contact": {
    "name": "Sarah Chen",
    "title": "Chief Operating Officer",
    "email": "s.chen@meridianscs.co.uk",
    "phone": "+44 20 7946 0958",
    "preferred_contact": "email"
  },
  "secondary_contact": {
    "name": "James Whitfield",
    "title": "Finance Director",
    "email": "j.whitfield@meridianscs.co.uk",
    "phone": "+44 20 7946 0960"
  },
  "matter": {
    "type": "Commercial Contract Dispute",
    "description": "Dispute with primary freight forwarding partner (GlobalFreight PLC) regarding alleged breach of exclusivity clause in master services agreement. Contract value approx £2.8M annually. Counterparty threatening to terminate and claim damages of £1.2M. Client seeks to enforce exclusivity provision and counterclaim for service failures.",
    "urgency": "high",
    "opposing_party": "GlobalFreight PLC",
    "estimated_value": "£4,000,000",
    "court_deadline": null,
    "referral_source": "Marcus Webb, Partner at Deloitte"
  },
  "compliance": {
    "sanctions_check_required": true,
    "pep_check_required": true,
    "aml_verification": "pending",
    "source_of_funds": "trading_revenue",
    "risk_rating": "standard"
  }
}
INTAKE_EOF

# Initialize HANDOFF.md
cat > "$DEMO_DIR/HANDOFF.md" << EOF
# Agent Handoff Log — Hartwell Associates Onboarding Pipeline
**Client:** Meridian Supply Chain Solutions Ltd
**Matter:** Commercial Contract Dispute
**Pipeline Started:** $TIMESTAMP

---

## Stage 0: Trigger
- **Agent:** System Trigger
- **Status:** ✅ Complete
- **Timestamp:** $TIMESTAMP
- **Action:** New client intake form received and validated
- **Output:** \`demo-output/intake.json\`
- **Notes:** High-urgency matter. Referral from Marcus Webb (Deloitte). Conflict check required against GlobalFreight PLC.

**→ HANDOFF TO: EA Agent (Executive Assistant)**
EOF

# Initialize timeline
cat > "$OUTPUT_DIR/timeline.log" << EOF
[$TIMESTAMP] PIPELINE STARTED — New Client Onboarding: Meridian Supply Chain Solutions Ltd
[$TIMESTAMP] TRIGGER    | Intake form received via website | Source: Marcus Webb referral
[$TIMESTAMP] TRIGGER    | Client ID assigned: HA-2026-0347
[$TIMESTAMP] TRIGGER    | Intake JSON written to demo-output/intake.json
[$TIMESTAMP] TRIGGER    | HANDOFF → EA Agent
EOF

echo "✅ Trigger complete — intake form processed"
