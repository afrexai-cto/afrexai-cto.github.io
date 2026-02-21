#!/bin/bash
# ============================================================================
# BILLING AGENT: Bookkeeper — Engagement letter, fee schedule, billing setup
# ============================================================================
set -e
DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$DEMO_DIR/demo-output"
TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%S")

if ! grep -q "HANDOFF TO: Billing Agent" "$DEMO_DIR/HANDOFF.md" 2>/dev/null; then
  echo "❌ Billing Agent: Not my turn"; exit 1
fi

# --- Engagement Letter ---
cat > "$OUTPUT_DIR/engagement-letter.md" << 'EOF'
# HARTWELL ASSOCIATES LLP
## Solicitors & Commercial Dispute Resolution
25 Bedford Row, London WC1R 4HD

---

**PRIVATE & CONFIDENTIAL**

Ms Sarah Chen
Chief Operating Officer
Meridian Supply Chain Solutions Ltd
45 Canary Wharf Tower
London E14 5AB

21 February 2026

**Our Ref:** HA-2026-0347/VH/DO

---

Dear Ms Chen,

## Letter of Engagement — Commercial Contract Dispute with GlobalFreight PLC

Thank you for instructing Hartwell Associates LLP ("the Firm") in connection with the above matter. This letter sets out the basis on which we will act for Meridian Supply Chain Solutions Ltd ("the Client").

### 1. Scope of Work

We are instructed to:
- Advise on the Client's rights and obligations under the Master Services Agreement dated June 2023 with GlobalFreight PLC
- Defend any claim by GlobalFreight PLC for alleged breach of the exclusivity clause
- Pursue a counterclaim for service failures by GlobalFreight PLC
- Conduct pre-action correspondence in accordance with the Pre-Action Protocol for Commercial Disputes
- Negotiate a resolution where possible
- If necessary, conduct litigation in the Business and Property Courts of England and Wales

### 2. Personnel

| Role | Name | Hourly Rate (excl. VAT) |
|------|------|------------------------|
| Supervising Partner | Victoria Hartwell | £550 |
| Senior Associate | David Osei | £350 |
| Associate | (as required) | £250 |
| Paralegal | (as required) | £150 |
| Trainee Solicitor | (as required) | £125 |

These rates are reviewed annually on 1 May. We will give you 30 days' written notice of any increase.

### 3. Fee Estimate

Based on our initial assessment:

| Phase | Estimated Fees (excl. VAT) |
|-------|---------------------------|
| Initial assessment and strategy | £8,000 – £12,000 |
| Pre-action correspondence | £15,000 – £20,000 |
| Negotiation and settlement | £10,000 – £18,000 |
| **Sub-total (pre-litigation)** | **£33,000 – £50,000** |
| Litigation (if required) | £80,000 – £150,000 |

These are estimates only and not fixed fees. Actual costs will depend on the complexity of the issues, the volume of documentation, and the conduct of the opposing party. We will update you if costs are likely to exceed these estimates.

### 4. Billing Arrangements

- Invoices will be rendered **monthly** in arrears
- Payment terms: **30 days** from date of invoice
- We require a payment on account of **£10,000 + VAT** before commencing substantive work
- Interest on late payment: 4% above Bank of England base rate

### 5. Disbursements

In addition to our fees, you will be responsible for disbursements including:
- Court fees (if litigation proceeds)
- Counsel's fees (if barrister instructed)
- Expert fees (forensic accountant, if required)
- Search fees and Companies House filings
- Travel and accommodation (at cost)

### 6. VAT

All fees and disbursements are subject to VAT at the prevailing rate (currently 20%).

### 7. Regulatory Information

Hartwell Associates LLP is authorised and regulated by the Solicitors Regulation Authority (SRA No. 648291). Our professional indemnity insurance is provided by CNA Hardy with a limit of £10,000,000 per claim.

### 8. Complaints

If you are dissatisfied with our service, please contact our COLP, Rebecca Hall (r.hall@hartwellassociates.co.uk). Our complaints procedure is available on request. If we cannot resolve your complaint, you may refer it to the Legal Ombudsman.

### 9. Termination

Either party may terminate this engagement by giving 14 days' written notice. In the event of termination, you will be responsible for fees and disbursements incurred up to the date of termination.

### 10. Acceptance

Please confirm your acceptance of these terms by signing and returning a copy of this letter, or by email confirmation, within 14 days.

---

Yours sincerely,

**Victoria Hartwell**
Senior Partner
Hartwell Associates LLP

---

**ACCEPTED AND AGREED:**

Signed: ________________________________

Name: Sarah Chen

Position: Chief Operating Officer, Meridian Supply Chain Solutions Ltd

Date: ________________________________
EOF

# --- Fee Schedule ---
cat > "$OUTPUT_DIR/fee-schedule.json" << 'EOF'
{
  "matter_ref": "HA-2026-0347",
  "client": "Meridian Supply Chain Solutions Ltd",
  "billing_setup": {
    "billing_type": "hourly",
    "billing_frequency": "monthly",
    "payment_terms_days": 30,
    "currency": "GBP",
    "vat_rate": 0.20,
    "retainer_required": 10000,
    "retainer_status": "pending",
    "late_payment_interest": "base_rate_plus_4pct"
  },
  "rate_card": [
    {"grade": "Senior Partner", "name": "Victoria Hartwell", "rate_gbp": 550},
    {"grade": "Senior Associate", "name": "David Osei", "rate_gbp": 350},
    {"grade": "Associate", "name": "TBC", "rate_gbp": 250},
    {"grade": "Paralegal", "name": "TBC", "rate_gbp": 150},
    {"grade": "Trainee", "name": "TBC", "rate_gbp": 125}
  ],
  "budget": {
    "phase_1_assessment": {"low": 8000, "high": 12000},
    "phase_2_preaction": {"low": 15000, "high": 20000},
    "phase_3_negotiation": {"low": 10000, "high": 18000},
    "phase_4_litigation": {"low": 80000, "high": 150000},
    "total_prelitigation": {"low": 33000, "high": 50000}
  },
  "accounts_contact": {
    "name": "Finance Department",
    "email": "accounts@hartwellassociates.co.uk",
    "phone": "+44 20 7242 8905"
  },
  "client_billing_contact": {
    "name": "James Whitfield",
    "email": "j.whitfield@meridianscs.co.uk"
  }
}
EOF

# --- Update HANDOFF.md ---
cat >> "$DEMO_DIR/HANDOFF.md" << EOF

---

## Stage 4: Billing Agent
- **Agent:** Billing Agent
- **Status:** ✅ Complete
- **Timestamp:** $TIMESTAMP
- **Actions performed:**
  - Drafted engagement letter with full terms of business
  - Created fee schedule with rate card and budget breakdown
  - Set billing: monthly, 30-day terms, £10K retainer required
  - Configured billing contact: James Whitfield (Finance Director)
- **Outputs:**
  - \`demo-output/engagement-letter.md\` — Draft engagement letter for partner review
  - \`demo-output/fee-schedule.json\` — Structured billing setup
- **Action required:**
  - Partner to review and approve engagement letter before sending
  - £10,000 + VAT retainer to be collected before substantive work begins

**→ PIPELINE COMPLETE**
EOF

cat >> "$OUTPUT_DIR/timeline.log" << EOF
[$TIMESTAMP] BILLING    | Reading HANDOFF.md — confirmed routing
[$TIMESTAMP] BILLING    | Ingesting project plan budget estimates
[$TIMESTAMP] BILLING    | Drafted engagement letter (10 sections, SRA compliant)
[$TIMESTAMP] BILLING    | Created fee schedule: 5-tier rate card, monthly billing
[$TIMESTAMP] BILLING    | Retainer set: £10,000 + VAT (pending collection)
[$TIMESTAMP] BILLING    | Billing contact: James Whitfield, Finance Director
[$TIMESTAMP] BILLING    | Updated HANDOFF.md
[$TIMESTAMP] BILLING    | ════════════════════════════════════════════
[$TIMESTAMP] BILLING    | PIPELINE COMPLETE — All agents finished
[$TIMESTAMP] BILLING    | ════════════════════════════════════════════
EOF

echo "✅ Billing Agent complete — engagement letter drafted, billing configured"
