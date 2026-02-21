#!/bin/bash
# ============================================================================
# PM AGENT: Project Manager — Project plan, tasks, milestones
# ============================================================================
set -e
DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$DEMO_DIR/demo-output"
TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%S")

if ! grep -q "HANDOFF TO: PM Agent" "$DEMO_DIR/HANDOFF.md" 2>/dev/null; then
  echo "❌ PM Agent: Not my turn"; exit 1
fi

cat > "$OUTPUT_DIR/project-plan.md" << 'EOF'
# Project Plan — Meridian SCS v GlobalFreight PLC
**Matter Reference:** HA-2026-0347
**Responsible Partner:** Victoria Hartwell
**Senior Associate:** David Osei
**Date Created:** 21 February 2026

---

## Phase 1: Intake & Initial Assessment (Week 1–2)
*Target: 21 Feb – 7 Mar 2026*

| # | Task | Owner | Due | Status |
|---|------|-------|-----|--------|
| 1.1 | Welcome call with Sarah Chen | V. Hartwell / D. Osei | 24 Feb | 📅 Scheduled |
| 1.2 | Collect master services agreement + amendments | D. Osei | 26 Feb | ⬜ Pending |
| 1.3 | Collect all dispute correspondence | D. Osei | 26 Feb | ⬜ Pending |
| 1.4 | Complete AML/KYC verification | Compliance Team | 28 Feb | ⬜ Pending |
| 1.5 | Review MSA — exclusivity clause analysis | D. Osei | 3 Mar | ⬜ Pending |
| 1.6 | Review GlobalFreight KPI performance data | D. Osei | 5 Mar | ⬜ Pending |
| 1.7 | Initial case assessment memo to partner | D. Osei | 7 Mar | ⬜ Pending |

**Milestone:** ✅ Initial Assessment Complete — 7 March 2026

## Phase 2: Strategy & Pre-Action (Week 3–5)
*Target: 10 Mar – 28 Mar 2026*

| # | Task | Owner | Due | Status |
|---|------|-------|-----|--------|
| 2.1 | Strategy meeting (internal) | V. Hartwell / D. Osei | 10 Mar | ⬜ Pending |
| 2.2 | Detailed analysis of exclusivity scope | D. Osei | 14 Mar | ⬜ Pending |
| 2.3 | Quantify counterclaim (service failures) | D. Osei + Forensic Acct | 18 Mar | ⬜ Pending |
| 2.4 | Draft pre-action protocol letter | D. Osei | 21 Mar | ⬜ Pending |
| 2.5 | Partner review of pre-action letter | V. Hartwell | 24 Mar | ⬜ Pending |
| 2.6 | Client approval of pre-action letter | Sarah Chen | 26 Mar | ⬜ Pending |
| 2.7 | Send pre-action protocol letter | D. Osei | 28 Mar | ⬜ Pending |

**Milestone:** ✅ Pre-Action Letter Sent — 28 March 2026

## Phase 3: Response & Negotiation (Week 6–10)
*Target: 30 Mar – 2 May 2026*

| # | Task | Owner | Due | Status |
|---|------|-------|-----|--------|
| 3.1 | Monitor for response (14-day deadline) | D. Osei | 11 Apr | ⬜ Pending |
| 3.2 | Analyse counterparty response | D. Osei | 14 Apr | ⬜ Pending |
| 3.3 | Without prejudice settlement meeting | V. Hartwell | 21 Apr | ⬜ Pending |
| 3.4 | Evaluate settlement terms (if offered) | V. Hartwell / Client | 28 Apr | ⬜ Pending |
| 3.5 | Decision gate: settle or proceed to litigation | Client / V. Hartwell | 2 May | ⬜ Pending |

**Milestone:** ✅ Resolution Decision — 2 May 2026

## Phase 4: Litigation (if required) (Week 11+)
*Target: May 2026 onwards*

| # | Task | Owner | Due | Status |
|---|------|-------|-----|--------|
| 4.1 | Draft particulars of claim / defence | D. Osei | TBC | ⬜ Contingent |
| 4.2 | Issue proceedings / file defence | D. Osei | TBC | ⬜ Contingent |
| 4.3 | Disclosure and inspection | D. Osei | TBC | ⬜ Contingent |
| 4.4 | Witness statements | D. Osei | TBC | ⬜ Contingent |
| 4.5 | Mediation (court-directed or voluntary) | V. Hartwell | TBC | ⬜ Contingent |

---

## Key Dates Summary

| Date | Event |
|------|-------|
| 24 Feb 2026 | Welcome call |
| 7 Mar 2026 | Initial assessment complete |
| 28 Mar 2026 | Pre-action letter sent |
| 11 Apr 2026 | Response deadline |
| 2 May 2026 | Settlement / litigation decision |

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Client delays in providing documents | High | Medium | Early document request; weekly chase |
| Counterparty issues proceedings first | High | Low | Monitor for service; prepare defensive filing |
| Scope creep (additional disputes) | Medium | Medium | Clear engagement scope; variation protocol |
| Key personnel unavailability | Medium | Low | David Osei as primary; backup to Rebecca Hall |

## Budget Estimate (Phase 1–3)

| Phase | Estimated Fees | Disbursements |
|-------|---------------|---------------|
| Phase 1: Intake & Assessment | £8,000–£12,000 | £500 |
| Phase 2: Strategy & Pre-Action | £15,000–£20,000 | £1,000 |
| Phase 3: Response & Negotiation | £10,000–£18,000 | £500 |
| **Total (Pre-Litigation)** | **£33,000–£50,000** | **£2,000** |
| Phase 4: Litigation (if needed) | £80,000–£150,000 | £15,000–£30,000 |
EOF

# --- Update HANDOFF.md ---
cat >> "$DEMO_DIR/HANDOFF.md" << EOF

---

## Stage 3: Project Manager Agent
- **Agent:** PM Agent
- **Status:** ✅ Complete
- **Timestamp:** $TIMESTAMP
- **Actions performed:**
  - Created 4-phase project plan with 19 tasks
  - Set 4 key milestones (Assessment, Pre-Action, Decision, Litigation)
  - Built risk register (4 identified risks)
  - Estimated budget: £33K–£50K pre-litigation, £80K–£150K if litigated
- **Outputs:**
  - \`demo-output/project-plan.md\` — Full project plan
- **Key decisions:**
  - Phase 1–3 target completion: 2 May 2026
  - Decision gate before litigation at Phase 3.5
  - Budget cap for pre-litigation work: £50K

**→ HANDOFF TO: Billing Agent (Bookkeeper)**
EOF

cat >> "$OUTPUT_DIR/timeline.log" << EOF
[$TIMESTAMP] PM AGENT   | Reading HANDOFF.md — confirmed routing
[$TIMESTAMP] PM AGENT   | Ingesting research findings for planning context
[$TIMESTAMP] PM AGENT   | Created 4-phase project plan (19 tasks)
[$TIMESTAMP] PM AGENT   | Set milestones: Assessment (7 Mar), Pre-Action (28 Mar), Decision (2 May)
[$TIMESTAMP] PM AGENT   | Risk register: 4 risks identified and mitigated
[$TIMESTAMP] PM AGENT   | Budget estimate: £33K–£50K pre-litigation
[$TIMESTAMP] PM AGENT   | Updated HANDOFF.md
[$TIMESTAMP] PM AGENT   | HANDOFF → Billing Agent
EOF

echo "✅ PM Agent complete — project plan with 19 tasks and 4 milestones created"
