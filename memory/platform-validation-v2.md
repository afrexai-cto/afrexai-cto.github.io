# AfrexAI Platform Validation Report v2
**Date:** 2026-02-16 | **Tester:** Subagent (automated QA)

## Test Customers
1. **Hartwell & Associates** — growth tier, legal vertical
2. **BuildRight Construction** — starter tier, construction vertical

---

## Step-by-Step Results

### 1. Autopilot (Hartwell & Associates) — ⚠️ PARTIAL PASS
- ✅ profile.json created with correct pricing ($4950 with $450 legal premium, USD)
- ✅ 3 agents generated (legal-researcher, contract-reviewer, compliance-monitor)
- ⚠️ Billing record created at **wrong path**: `customers/hartwell--associates/billing.json` (double-dash slug bug)
- ⚠️ Billing record shows **$4500** not $4950 (vertical premium missing in billing-tracker)
- ✅ Welcome email generated with correct $4950 pricing
- ✅ CRM log entry created

### 2. Generate Agents (manual) — ❌ FAIL
- **Agent name mismatch**: Autopilot creates `legal-researcher, contract-reviewer, compliance-monitor` but generate-agents.sh creates `legal-ea, document-analyst, client-followup` — TWO DIFFERENT SETS
- ❌ **{{COMPANY}} NOT replaced** — SOUL.md contains `Hartwell {{COMPANY}} Associates LLP` (templates have hardcoded partial company name around the placeholder — fundamentally broken)
- Templates assume "Hartwell ... Associates LLP" structure — not dynamic at all

### 3. Multi-Tenant Manager (list) — ❌ FAIL
- Script crashes: `line 138: 0\n0: syntax error in expression`
- Shows **3 entries** instead of 2 (ghost `hartwell--associates` from billing bug)
- Company names truncated in display
- `hartwell--associates` shows vertical as "general" instead of "legal"
- BuildRight appears correctly

### 4. SLA Monitor — ✅ PASS
- Runs with correct syntax: `check --customer hartwell-associates`
- Shows 100% uptime, 0 breaches (expected for fresh customer)
- Note: task instructions had wrong invocation syntax

### 5. Customer Portal Data — ⚠️ PARTIAL PASS
- ✅ Generates dashboard.json
- ❌ Shows **$4500** not $4950 (premium missing)
- ❌ Company name shows "Hartwell & Associates LLP" — phantom "LLP" suffix added from nowhere
- Shows 0 agents (they exist in filesystem but aren't counted)
- ROI shows -100% (expected for new customer but looks bad in demo)

### 6. Pricing Engine (quote) — ❌ FAIL
- Crashes: `line 81: ${1^^}_PRICE: bad substitution`
- Uses bash 4+ syntax (`${var^^}` uppercase) but macOS ships bash 3.2
- **Completely non-functional on macOS**

### 7. Billing Tracker (invoice) — ⚠️ PARTIAL PASS
- ✅ Generates invoice markdown
- ❌ Invoice shows **$4500** — vertical premium ($450) missing
- Shows 0/3 agents deployed (should show 3 or 6 after generate-agents ran twice)

### 8. Backup — ⚠️ PARTIAL PASS
- ✅ Backup runs and creates archive
- ❌ Company name shows "Hartwell & Associates LLP" — phantom "LLP" suffix

### 9. Health Dashboard — ❌ FAIL
- Crashes: `line 119: local: can only be used in a function`
- `local` keyword used outside function scope — basic bash error

### 10. Autopilot (BuildRight Construction) — ✅ PASS
- ✅ Profile, agents, billing, welcome email all created correctly
- ✅ SOUL.md properly populated (no unreplaced placeholders)
- ✅ $1500/mo starter pricing correct (no vertical premium for construction)
- ✅ 1 agent (site-reporter) with clean, professional SOUL.md

### 11. Multi-Tenant Manager (list, 2 customers) — ❌ FAIL
- Same crash as step 3
- Both real customers visible before crash, but ghost entry persists

---

## Pricing Consistency Audit

| Source | Hartwell Price | Notes |
|--------|---------------|-------|
| autopilot.sh banner | $4950 | ✅ Correct (base $4500 + $450 premium) |
| profile.json | $4950 | ✅ Correct |
| welcome email | $4950 | ✅ Correct |
| billing-tracker billing.json | $4500 | ❌ Missing $450 premium |
| billing-tracker invoice | $4500 | ❌ Missing $450 premium |
| portal dashboard.json | $4500 | ❌ Missing $450 premium |
| multi-tenant-manager | $4500 | ❌ Missing $450 premium |

**Verdict**: Autopilot correctly calculates the premium but **no downstream script reads it**. They all use the base tier price.

---

## Critical Bugs (Must Fix)

1. **Pricing engine crashes on macOS** — `${var^^}` bash 4+ syntax. Use `tr '[:lower:]' '[:upper:]'` instead.
2. **Health dashboard crashes** — `local` outside function.
3. **Multi-tenant manager crashes** — expression syntax error (likely agent count parsing).
4. **Billing slug double-dash** — `& ` in company name creates `--` in slug somewhere in billing-tracker.
5. **Vertical premium ignored by all downstream scripts** — billing, invoicing, portal all show base price only.
6. **{{COMPANY}} not replaced in legal templates** — templates have hardcoded partial names baked around the placeholder.
7. **Agent name mismatch** — autopilot generates different agents than generate-agents.sh for the same vertical/tier.

## Medium Bugs

8. **Phantom "LLP" suffix** — appears in backup and portal data but not in profile.json.
9. **Agent count shows 0** — portal and invoicing don't count agents from filesystem.
10. **Company name truncation** in multi-tenant list display.

## Minor Issues

11. Task instructions used wrong CLI syntax for several scripts (positional args vs `--flag` style).
12. ROI shows -100% for new customers — should show "N/A" or "Pending" instead.

---

## Overall Verdict: ❌ NOT SELLABLE

**3 out of 9 scripts crash outright.** The pricing is inconsistent across the platform — the flagship feature (vertical premium pricing) only works in autopilot and is ignored everywhere else. Template substitution is broken for legal vertical. The billing system creates ghost customer records with wrong slugs.

### What Works Well
- Autopilot flow is impressive and professional-looking
- Welcome email is polished and correct
- Profile.json structure is solid
- BuildRight Construction (non-legal) works nearly end-to-end
- SLA monitor works correctly
- The overall architecture and vision is sound

### To Make This Sellable
1. Fix the 3 crashing scripts (30 min each — bash compat issues)
2. Propagate vertical premium to ALL downstream price calculations
3. Fix template {{COMPANY}} substitution (rewrite templates to be fully dynamic)
4. Reconcile autopilot agent generation with generate-agents.sh (should use same source)
5. Fix billing slug generation (handle `&` in names)
6. Add integration tests that run this exact validation automatically

**Estimated fix time: 1-2 days of focused work.**
The bones are good. The integration between components needs tightening.
