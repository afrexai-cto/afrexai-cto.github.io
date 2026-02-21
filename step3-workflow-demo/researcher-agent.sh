#!/bin/bash
# ============================================================================
# RESEARCH AGENT: Conflict Check, Company Background, Client Brief
# ============================================================================
set -e
DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$DEMO_DIR/demo-output"
TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%S")

if ! grep -q "HANDOFF TO: Research Agent" "$DEMO_DIR/HANDOFF.md" 2>/dev/null; then
  echo "❌ Research Agent: Not my turn"; exit 1
fi

# --- Conflict check ---
cat > "$OUTPUT_DIR/conflict-check.md" << 'EOF'
# Conflict of Interest Check — HA-2026-0347
**Prepared by:** Research Agent (automated)
**Date:** 21 February 2026
**Status:** ✅ CLEARED — No conflicts identified

## Parties Checked

### Client Side
| Entity | Companies House | Result |
|--------|----------------|--------|
| Meridian Supply Chain Solutions Ltd | 14829361 | ✅ No prior instructions |
| Sarah Chen (COO) | N/A | ✅ No prior instructions |
| James Whitfield (Finance Director) | N/A | ✅ No prior instructions |

### Opposing Side
| Entity | Companies House | Result |
|--------|----------------|--------|
| GlobalFreight PLC | 08412953 | ✅ No current or recent instructions |
| GlobalFreight directors (cross-ref) | N/A | ✅ No matches in client database |

### Related Parties
| Entity | Relationship | Result |
|--------|-------------|--------|
| Marcus Webb (Deloitte) | Referrer | ✅ Known referral contact — no conflict |
| Deloitte LLP | Referrer's firm | ✅ No active adverse matters |

## Sanctions & PEP Screening
- **Meridian SCS:** No sanctions matches. No PEP associations.
- **GlobalFreight PLC:** No sanctions matches. Listed on AIM (LON:GFT).
- **Sarah Chen:** No PEP match. No adverse media.
- **James Whitfield:** No PEP match. No adverse media.

## Recommendation
Cleared to proceed. No waivers required.
EOF

# --- Company background & client brief ---
cat > "$OUTPUT_DIR/client-brief.md" << 'EOF'
# Client Intelligence Brief — Meridian Supply Chain Solutions Ltd
**Prepared for:** Victoria Hartwell, David Osei
**Date:** 21 February 2026
**Classification:** Confidential — Attorney Work Product

---

## 1. Company Overview

**Meridian Supply Chain Solutions Ltd** is a mid-market logistics management company headquartered in Canary Wharf, London. Founded in 2019, the company provides end-to-end supply chain consulting, freight management, and warehouse optimisation services to UK and European clients.

| Metric | Detail |
|--------|--------|
| Incorporated | 12 March 2019 |
| Company No. | 14829361 |
| Annual Revenue | £12.4M (FY2025) |
| Employees | 86 |
| Sector | Logistics & Supply Chain |
| Key Clients | Retail and FMCG sectors |

**Growth trajectory:** Revenue has grown approximately 40% year-on-year since 2022, driven by post-Brexit supply chain complexity and nearshoring trends. The company raised £3.2M in Series A funding in 2023 from Velocity Capital Partners.

## 2. Key Personnel

- **Sarah Chen, COO** — Co-founder. Previously Head of Operations at Kuehne+Nagel UK (2014–2019). University of Warwick, MSc Supply Chain Management. Primary decision-maker on operational matters.
- **James Whitfield, Finance Director** — Joined 2021. Previously at PwC (audit). ACA qualified. Manages all financial and legal vendor relationships.
- **Tom Reeves, CEO** — Co-founder. Commercial background. Frequent speaker at logistics industry events. Not directly involved in this matter per intake.

## 3. Opposing Party — GlobalFreight PLC

**GlobalFreight PLC** is a publicly listed (AIM: GFT) freight forwarding company with revenues of approximately £180M. Headquartered in Manchester with 14 UK depots and European operations.

- **Market position:** Top-10 UK freight forwarder. Known for aggressive commercial practices.
- **Legal history:** Involved in 3 reported commercial disputes in the past 5 years (all settled). Instructed Clyde & Co and DLA Piper in previous matters.
- **Likely solicitors:** Based on prior matters, expect Clyde & Co (Manchester office) or in-house counsel led by Rachel Foster, General Counsel.
- **Financial position:** Share price down 18% over 12 months. Two profit warnings in 2025. This may indicate financial pressure motivating aggressive stance on the Meridian contract.

## 4. The Dispute — Preliminary Analysis

### Background
Meridian entered into a Master Services Agreement (MSA) with GlobalFreight in June 2023 for exclusive freight forwarding services across Meridian's client portfolio. The MSA has an estimated annual value of £2.8M and runs to June 2028.

### Key Issues
1. **Exclusivity clause** — GlobalFreight alleges Meridian breached exclusivity by engaging alternative carriers for two client accounts. Meridian's position (per intake) is that these accounts fell outside the MSA scope.
2. **Service failures** — Meridian reports persistent service failures by GlobalFreight including late deliveries, damaged goods, and failure to meet KPIs defined in Schedule 3 of the MSA.
3. **Threatened termination** — GlobalFreight has threatened to terminate the MSA and claim £1.2M in damages for alleged breach.
4. **Meridian's counterclaim** — Potential counterclaim for service failures, estimated at £800K–£1.5M based on client compensation paid and lost business.

### Preliminary Risk Assessment
| Factor | Assessment |
|--------|-----------|
| Strength of exclusivity defence | **Medium-High** — Scope carve-outs likely exist; need to review MSA |
| Service failure counterclaim | **Strong** — If KPI data supports, very credible |
| Litigation risk | **Medium** — GlobalFreight's financial pressure may favour settlement |
| Estimated exposure | £1.2M (claim) vs £800K–£1.5M (counterclaim) |
| Recommended strategy | Robust defence + strong counterclaim → negotiate from strength |

## 5. Comparable Matters

- **LogiTrans v Carrier Express [2024] EWHC 1892 (Comm)** — Similar exclusivity dispute in logistics. Court held that exclusivity clauses must be construed strictly and ambiguities resolved against the party seeking to enforce. Helpful precedent.
- **Nexus Freight v Atlantic Shipping [2023] EWCA Civ 445** — Court of Appeal confirmed that persistent KPI failures can constitute repudiatory breach. Relevant to counterclaim.

## 6. Recommendations for Welcome Call
1. Obtain and review the MSA immediately — the exclusivity clause wording is critical
2. Request KPI performance data for the past 12 months
3. Identify the two accounts GlobalFreight claims breach the exclusivity
4. Confirm whether any without-prejudice discussions have taken place
5. Discuss early engagement strategy — consider pre-action protocol letter
EOF

# --- Update HANDOFF.md ---
cat >> "$DEMO_DIR/HANDOFF.md" << EOF

---

## Stage 2: Research Agent
- **Agent:** Research Agent
- **Status:** ✅ Complete
- **Timestamp:** $TIMESTAMP
- **Actions performed:**
  - Ran conflict check against all parties (client, opposing, referrer) — **CLEARED**
  - Sanctions and PEP screening — no matches
  - Compiled company intelligence brief on Meridian SCS and GlobalFreight PLC
  - Identified comparable case law (LogiTrans, Nexus Freight)
  - Preliminary risk assessment: Medium-High defence strength, Strong counterclaim
- **Outputs:**
  - \`demo-output/conflict-check.md\` — Full conflict check report
  - \`demo-output/client-brief.md\` — Intelligence brief with risk assessment
- **Key findings:**
  - No conflicts. Clear to proceed.
  - GlobalFreight under financial pressure (2 profit warnings) — may favour settlement
  - Likely opposing solicitors: Clyde & Co
  - Strong counterclaim potential if KPI data supports

**→ HANDOFF TO: PM Agent (Project Manager)**
EOF

cat >> "$OUTPUT_DIR/timeline.log" << EOF
[$TIMESTAMP] RESEARCH   | Reading HANDOFF.md — confirmed routing
[$TIMESTAMP] RESEARCH   | Running conflict check — 6 entities screened
[$TIMESTAMP] RESEARCH   | Conflict check CLEARED — no conflicts found
[$TIMESTAMP] RESEARCH   | Sanctions/PEP screening complete — no matches
[$TIMESTAMP] RESEARCH   | Compiling company intelligence: Meridian SCS
[$TIMESTAMP] RESEARCH   | Compiling opposing party intelligence: GlobalFreight PLC
[$TIMESTAMP] RESEARCH   | Identified 2 comparable authorities
[$TIMESTAMP] RESEARCH   | Risk assessment complete — Medium-High defence, Strong counterclaim
[$TIMESTAMP] RESEARCH   | Updated HANDOFF.md
[$TIMESTAMP] RESEARCH   | HANDOFF → PM Agent
EOF

echo "✅ Research Agent complete — conflict cleared, client brief ready"
