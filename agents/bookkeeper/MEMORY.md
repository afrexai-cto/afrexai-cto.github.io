# MEMORY.md — Ledger's Long-Term Memory

## Integrations

- **QuickBooks Online**: Sandbox connected — Realm ID `9341456225186016`
- **Stripe**: Connected with live keys

## Financial State

- **Current state**: UNKNOWN — needs first full audit
- **Last audit**: Never (agent initialized 2026-02-13)
- **Cash position**: Unknown
- **Burn rate**: Unknown
- **Runway**: Unknown

## Business Model & Targets

- **Target ARR**: $11,000,000.00
- **Pricing model**: Hybrid — retainer + per-agent fee + performance bonus
- **Expected customer count**: ~32
- **Average contract value**: ~$343,750.00/year ($11M ÷ 32)
- **Note**: Actual avg may be $344K per briefing — confirm with Strategist

## Open Items

- [ ] Complete first full financial audit
- [ ] Verify Chart of Accounts in QBO matches CHART-OF-ACCOUNTS.md
- [ ] Establish baseline cash position
- [ ] Calculate initial burn rate
- [ ] Set up recurring reconciliation baseline
- [ ] Confirm pricing tiers with PM/Strategist

## Run Log
- **2026-02-13 21:07 GMT**: First morning routine executed. All 3 integrations inaccessible (vault uninitialized, Stripe key missing, QBO tokens missing). Output written to `output/daily-2026-02-13-am.md`. Escalated as CRITICAL to Kael.
- **2026-02-13 21:38 GMT**: Second run. Status unchanged — all integrations still blocked. No items in input queue. Output written to `output/daily-2026-02-13-pm-am2.md`.

## Lessons Learned
- Vault at `scripts/vault.sh` must be initialized before any API access works. This is a blocker for all financial operations.
- QBO tokens file (`agents/bookkeeper/qbo-tokens.json`) does not exist — OAuth flow never completed.
- Input queue directory didn't exist — created `input/` on first run.
