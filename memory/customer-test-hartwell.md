# E2E Customer Onboarding Test: Hartwell & Associates LLP

**Date:** 2026-02-16  
**Tester:** Subagent (automated QA)  
**Customer:** Hartwell & Associates LLP (fictional)  
**Tier:** Growth ($4,500/mo, 3 agents)  
**Vertical:** Legal

---

## Summary

**11 pipeline steps tested. 10 passed, 1 partial failure.** The platform is functional for demo/MVP purposes but has gaps that would block a real customer deployment.

---

## Step-by-Step Results

### ✅ Step 1: autopilot.sh (DRY_RUN)
- **Status:** PASS
- **Notes:** DRY_RUN mode works correctly. Previews without creating files.
- **Issue:** Slug generates `hartwell--associates` (double dash from `&` removal). Cosmetic but ugly in paths/URLs.

### ✅ Step 1: autopilot.sh (Real Run)
- **Status:** PASS
- **Notes:** Created full workspace at `aaas-platform/customers/hartwell--associates/` with 3 agents (ea-aria, sales-hunter, marketing-mika), billing, configs, welcome email, CRM log.
- **Issue:** Agents deployed are generic (EA, Sales, Marketing) — not law-firm-specific. The autopilot has no vertical-awareness for agent selection. `provision-customer.sh` does have vertical support but these are separate systems.
- **Issue:** Billing shows £999.00/mo (GBP) while pricing shows $4,500/mo (USD). Currency mismatch between billing-tracker.sh and autopilot.sh.

### ✅ Step 2: Check Created Files
- **Status:** PASS
- **Notes:** 28 files created including SOUL.md, CONFIG.md, IDENTITY.md, MEMORY.md, PROMPT files per agent, plus billing.json, profile.json, integrations.json, agent-manifest.json.

### ✅ Step 3: provision-customer.sh
- **Status:** PASS
- **Notes:** Creates a *separate* customer environment under `workflows/step3-hosted/data/customers/` with vertical-aware agents (legal-researcher, contract-reviewer, compliance-monitor). Generates API key, monitoring, SLA config.
- **Issue:** This creates a SECOND customer record in a different directory than autopilot.sh. Two systems, two customer IDs, two agent sets. Not unified.

### ✅ Step 4: multi-tenant-manager.sh list
- **Status:** PASS
- **Notes:** Shows customer correctly. Only sees provision-customer.sh customers (not autopilot customers). Company name truncated in display.

### ✅ Step 5: Custom Agent Configs
- **Status:** PASS (manual creation)
- **Notes:** Created SOUL.md, AGENTS.md, HEARTBEAT.md for Aria (Executive Assistant), Lexis (Document Analyst), Relay (Client Follow-up). All tailored for law firm vertical with appropriate boundaries (no legal advice, attorney approval required, confidentiality rules).
- **Issue:** No automated way to create custom/vertical-specific agents. This was entirely manual. Need a template system or agent config wizard.

### ✅ Step 6: sla-monitor.sh
- **Status:** PASS
- **Notes:** Reports 100% uptime, all 3 agents healthy, avg 133ms response. Only monitors provision-customer.sh customers.

### ✅ Step 7: customer-portal-data.sh
- **Status:** PASS
- **Notes:** Generated dashboard.json for customer portal. Only works with provision-customer.sh data.

### ✅ Step 8: pricing-engine.sh
- **Status:** PASS
- **Notes:** Generates correct quote: $4,500 base + $450 legal vertical premium = $4,950/mo. Per-agent: $1,650/mo.
- **Issue:** The 10% legal vertical premium wasn't mentioned during autopilot signup. Customer sees $4,500 in autopilot but $4,950 from pricing engine. Price discrepancy.

### ✅ Step 9: billing-tracker.sh
- **Status:** PASS
- **Notes:** Generated invoice at `billing/invoice-hartwell--associates-2026-02.md` for £999.00.
- **Issue:** Amount is £999 GBP, not $4,500 USD. Different pricing model than both autopilot and pricing engine.

### ⚠️ Step 10: customer-onboard-cma.sh
- **Status:** PARTIAL PASS
- **Notes:** CRM record created, skills recommended (document-reviewer, contract-tracker, deadline-monitor, billing-tracker), follow-ups scheduled (7-day and 30-day).
- **Failure:** Email send failed ("Email send failed — logging for manual follow-up"). Expected in test environment but no fallback mechanism.
- **Issue:** Creates a THIRD customer ID (`hartwell--associates-llp-1771264961`). Three scripts, three different customer IDs.

### ✅ Step 11: backup-restore.sh
- **Status:** PASS
- **Notes:** Backup created (52KB, 3 agents). Backup ID: 20260216-180247. Only backs up provision-customer.sh data.

---

## Critical Issues for Production

### 🔴 P0: Three Disconnected Customer Records
The biggest problem. Running the full pipeline creates THREE separate customer records:
1. `aaas-platform/customers/hartwell--associates/` (autopilot.sh)
2. `workflows/step3-hosted/data/customers/cust-hartwell-associates-llp-*/` (provision-customer.sh)
3. `data/crm/customers/hartwell--associates-llp-*/` (customer-onboard-cma.sh)

Each has different IDs, different agent lists, different data. No script knows about the others. A real customer would be fragmented across three systems.

**Fix:** Unify into a single customer record/ID. Either make autopilot.sh the single entry point that calls the others, or create a shared customer registry.

### 🔴 P0: Price/Currency Inconsistency
- autopilot.sh: $4,500/mo USD
- pricing-engine.sh: $4,950/mo USD (with legal vertical premium)
- billing-tracker.sh: £999/mo GBP

Three different prices in three different currencies. Unacceptable for a real customer.

**Fix:** Single pricing source of truth. billing-tracker.sh should read from pricing-engine.sh output, not its own hardcoded tiers.

### 🟡 P1: No Vertical-Aware Agent Selection in Autopilot
autopilot.sh deploys generic agents (EA, Sales, Marketing) regardless of vertical. provision-customer.sh has vertical awareness (legal → legal-researcher, contract-reviewer, compliance-monitor) but it's a separate flow.

**Fix:** Add `--vertical` flag to autopilot.sh and use it for agent selection.

### 🟡 P1: No Custom Agent Template System
Creating the 3 custom agents (Aria, Lexis, Relay) was entirely manual. No CLI tool to generate vertical-specific SOUL.md/AGENTS.md/HEARTBEAT.md from templates.

**Fix:** Create `agent-template-generator.sh --vertical legal --role "executive-assistant" --name "Aria"` that produces tailored configs.

### 🟡 P1: Email Sending Doesn't Work
customer-onboard-cma.sh's email step fails. Welcome emails are only written to files, never sent.

**Fix:** Integrate with actual email provider (SendGrid, SES, etc.) or at minimum, queue for manual send with clear operator notification.

### 🟢 P2: Slug Double-Dash
`&` in company names produces `--` in slugs. Minor but affects URLs and paths.

**Fix:** Add `sed 's/--*/-/g'` to slug generation in autopilot.sh.

### 🟢 P2: Multi-Tenant Manager Only Sees provision-customer.sh Customers
The list/status/issues commands only scan `workflows/step3-hosted/data/customers/`. Autopilot customers are invisible.

**Fix:** Either consolidate storage or teach multi-tenant-manager to scan both directories.

---

## What's Production-Ready

| Component | Ready? | Notes |
|-----------|--------|-------|
| autopilot.sh | 🟡 MVP | Works end-to-end but needs vertical support, slug fix |
| provision-customer.sh | 🟡 MVP | Good vertical support, needs unification with autopilot |
| multi-tenant-manager.sh | ✅ Ready | Solid listing/status/issues. Just needs unified data source |
| sla-monitor.sh | ✅ Ready | Clean output, correct SLA tracking |
| customer-portal-data.sh | ✅ Ready | Generates proper JSON dashboard data |
| pricing-engine.sh | ✅ Ready | Good breakdown, vertical premiums, annual discounts |
| billing-tracker.sh | 🟡 MVP | Works but currency/pricing disconnected |
| customer-onboard-cma.sh | 🟡 MVP | CRM + scheduling works, email fails |
| backup-restore.sh | ✅ Ready | Clean backup with size tracking |
| Custom agent configs | ❌ Manual | No automation — needs template system |

---

## Recommended Next Steps

1. **Unify customer identity** — single customer ID, single directory, single source of truth
2. **Unify pricing** — pricing-engine.sh should be the canonical source; billing reads from it
3. **Add vertical to autopilot.sh** — merge provision-customer.sh's vertical logic
4. **Build agent template generator** — CLI for creating vertical-specific agent configs
5. **Fix slug generation** — collapse multiple dashes
6. **Add integration tests** — a script that runs this exact pipeline and asserts expected outcomes

---

## Files Created During Test

```
aaas-platform/customers/hartwell--associates/           (autopilot workspace)
├── agents/
│   ├── ea-aria/                                        (auto-generated, generic)
│   ├── sales-hunter/                                   (auto-generated, generic)
│   ├── marketing-mika/                                 (auto-generated, generic)
│   ├── aria-executive-assistant/                       (custom, law-firm tailored)
│   │   ├── SOUL.md, AGENTS.md, HEARTBEAT.md
│   ├── lexis-document-analyst/                         (custom, law-firm tailored)
│   │   ├── SOUL.md, AGENTS.md, HEARTBEAT.md
│   └── relay-client-followup/                          (custom, law-firm tailored)
│       ├── SOUL.md, AGENTS.md, HEARTBEAT.md
├── config/openclaw-gateway.yaml
├── welcome-email.md
├── billing.json, profile.json, integrations.json

workflows/step3-hosted/data/customers/cust-hartwell-*/  (provision workspace)
├── config/manifest.json
├── agents/{legal-researcher,contract-reviewer,compliance-monitor}/
├── monitoring/{health.json, sla.json}
├── data/portal/dashboard.json
├── backups/

data/crm/customers/hartwell-*.json                      (CRM record)
workflows/step2-agents/billing/invoice-hartwell--associates-2026-02.md
```
