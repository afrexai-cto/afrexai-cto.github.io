#!/bin/bash
# ============================================================================
# EA AGENT: Executive Assistant
# Creates client folder, schedules welcome call, drafts welcome email
# ============================================================================
set -e
DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$DEMO_DIR/demo-output"
TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%S")

# --- Read HANDOFF.md to confirm we're the next agent ---
if ! grep -q "HANDOFF TO: EA Agent" "$DEMO_DIR/HANDOFF.md" 2>/dev/null; then
  echo "❌ EA Agent: Not my turn (HANDOFF.md doesn't route to me)"
  exit 1
fi

# --- Read intake data ---
INTAKE="$OUTPUT_DIR/intake.json"
if [ ! -f "$INTAKE" ]; then
  echo "❌ EA Agent: intake.json not found"
  exit 1
fi

# --- Create client folder structure ---
CLIENT_DIR="$OUTPUT_DIR/client-folder"
mkdir -p "$CLIENT_DIR"/{correspondence,contracts,court-filings,billing,notes,compliance}

cat > "$CLIENT_DIR/README.md" << 'EOF'
# Client Matter File: HA-2026-0347
## Meridian Supply Chain Solutions Ltd v GlobalFreight PLC

| Field | Detail |
|-------|--------|
| **Client** | Meridian Supply Chain Solutions Ltd |
| **Matter** | Commercial Contract Dispute — Exclusivity Clause |
| **Responsible Partner** | Victoria Hartwell |
| **Senior Associate** | David Osei |
| **Client Contact** | Sarah Chen, COO |
| **Opened** | 21 February 2026 |
| **Risk Rating** | Standard |
| **Fee Basis** | TBC — see engagement letter |

### Folder Structure
- `/correspondence` — Client emails, letters, file notes
- `/contracts` — Master services agreement, amendments, relevant contracts
- `/court-filings` — Pleadings, applications, orders (if litigation proceeds)
- `/billing` — Invoices, fee schedules, engagement letter
- `/notes` — Attendance notes, research memos
- `/compliance` — AML, KYC, conflict check records
EOF

# --- Draft welcome email ---
cat > "$OUTPUT_DIR/welcome-email.md" << 'EOF'
**From:** Victoria Hartwell <v.hartwell@hartwellassociates.co.uk>
**To:** Sarah Chen <s.chen@meridianscs.co.uk>
**Cc:** David Osei <d.osei@hartwellassociates.co.uk>
**Subject:** Hartwell Associates — Welcome & Next Steps | Meridian SCS

---

Dear Sarah,

Thank you for instructing Hartwell Associates in relation to the contract dispute with GlobalFreight PLC. We appreciate Marcus Webb's kind referral and are pleased to assist.

I have asked **David Osei**, Senior Associate in our Commercial Disputes team, to work alongside me on this matter. David has extensive experience with logistics sector disputes and exclusivity arrangements, and will be your day-to-day point of contact.

**Immediate next steps:**

1. **Welcome call** — We have scheduled an introductory call for **Monday 24 February at 10:00 AM GMT** (calendar invite to follow). David and I will both attend. Please have the master services agreement with GlobalFreight to hand if possible.

2. **Document collection** — We will need the following at your earliest convenience:
   - The master services agreement with GlobalFreight PLC (including all amendments and schedules)
   - Any correspondence relating to the dispute (emails, letters, without prejudice communications)
   - Board minutes or internal memos discussing the GlobalFreight relationship
   - Financial records showing the value of the arrangement

3. **Engagement letter** — Our formal engagement letter and fee schedule will follow separately. We will discuss fee arrangements during our call.

4. **Compliance** — As required by the Solicitors Regulation Authority, we will need to complete identity verification for Meridian SCS and its officers. Our compliance team will be in touch with specific requirements.

In the meantime, please do not respond to any correspondence from GlobalFreight or their solicitors without consulting us first. If you receive any further threats or communications, please forward them to David immediately.

We look forward to speaking on Monday.

With kind regards,

**Victoria Hartwell**
Senior Partner
Hartwell Associates LLP
25 Bedford Row, London WC1R 4HD
T: +44 20 7242 8900
E: v.hartwell@hartwellassociates.co.uk

*This email is confidential and may be privileged. If you are not the intended recipient, please notify us immediately and delete this email.*
EOF

# --- Schedule welcome call ---
cat > "$OUTPUT_DIR/calendar-event.json" << 'EOF'
{
  "event": {
    "title": "Welcome Call — Meridian SCS (HA-2026-0347)",
    "date": "2026-02-24",
    "time": "10:00",
    "timezone": "Europe/London",
    "duration_minutes": 45,
    "location": "Microsoft Teams — link to follow",
    "attendees": [
      {"name": "Victoria Hartwell", "role": "Senior Partner", "email": "v.hartwell@hartwellassociates.co.uk"},
      {"name": "David Osei", "role": "Senior Associate", "email": "d.osei@hartwellassociates.co.uk"},
      {"name": "Sarah Chen", "role": "Client — COO", "email": "s.chen@meridianscs.co.uk"}
    ],
    "agenda": [
      "Introductions and overview of Hartwell Associates' approach",
      "Detailed discussion of the GlobalFreight dispute",
      "Review of master services agreement and exclusivity clause",
      "Preliminary strategy discussion",
      "Fee arrangements and engagement terms",
      "Document collection requirements",
      "Compliance and AML verification process",
      "Next steps and timeline"
    ],
    "notes": "High-priority referral from Marcus Webb (Deloitte). Client reports urgency — counterparty threatening termination and £1.2M damages claim."
  }
}
EOF

# --- Update HANDOFF.md ---
cat >> "$DEMO_DIR/HANDOFF.md" << EOF

---

## Stage 1: Executive Assistant Agent
- **Agent:** EA Agent
- **Status:** ✅ Complete
- **Timestamp:** $TIMESTAMP
- **Actions performed:**
  - Created client matter folder structure (\`demo-output/client-folder/\`)
  - Drafted welcome email to Sarah Chen (\`demo-output/welcome-email.md\`)
  - Scheduled welcome call for 24 Feb 10:00 GMT (\`demo-output/calendar-event.json\`)
  - Assigned matter to Victoria Hartwell (Partner) + David Osei (Senior Associate)
- **Outputs:**
  - \`demo-output/client-folder/\` — Full matter folder with subdirectories
  - \`demo-output/welcome-email.md\` — Draft welcome email ready for review
  - \`demo-output/calendar-event.json\` — Calendar event with agenda
- **Notes:** Flagged high urgency. Instructed client not to respond to counterparty without consulting us.

**→ HANDOFF TO: Research Agent**
EOF

# --- Update timeline ---
cat >> "$OUTPUT_DIR/timeline.log" << EOF
[$TIMESTAMP] EA AGENT   | Reading HANDOFF.md — confirmed routing
[$TIMESTAMP] EA AGENT   | Parsed intake.json — client: Meridian SCS, matter: Commercial Dispute
[$TIMESTAMP] EA AGENT   | Created client folder structure (7 subdirectories)
[$TIMESTAMP] EA AGENT   | Assigned to Victoria Hartwell (Partner) + David Osei (Senior Associate)
[$TIMESTAMP] EA AGENT   | Drafted welcome email to Sarah Chen (COO)
[$TIMESTAMP] EA AGENT   | Scheduled welcome call: 24 Feb 2026, 10:00 GMT
[$TIMESTAMP] EA AGENT   | Updated HANDOFF.md
[$TIMESTAMP] EA AGENT   | HANDOFF → Research Agent
EOF

echo "✅ EA Agent complete — folder created, email drafted, call scheduled"
