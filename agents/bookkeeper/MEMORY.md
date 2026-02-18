# MEMORY.md — Ledger's Long-Term Memory

## Integrations

- **QuickBooks Online**: Sandbox connected — Realm ID `9341456225186016`
- **Stripe**: Connected with live keys

## Financial State

- **Current state**: PARTIAL — Stripe accessible, QBO still blocked
- **Last reconciliation**: 2026-02-16 20:10 GMT (Stripe-only)
- **Stripe balance**: -$36.93 available, $114.42 pending
- **Total paid out to bank (all-time)**: $111,227.91
- **Gross revenue (all-time, Stripe)**: $84,621.66
- **Trailing 6mo avg monthly revenue**: ~$13,900/mo
- **Implied ARR**: $166,803.32 (1.52% of $11M target)
- **Burn rate**: UNKNOWN (requires QBO)
- **Runway**: UNKNOWN (requires QBO)
- **Key client revenue**: ~$12,143/mo recurring (VADIS-style invoice payments)
- **Subscription**: $120/mo recurring — recovered on 2026-02-16 after 3 consecutive failures
- **Open overdue invoices**: 5 totaling $15,853.00 (oldest: 259 days, VADA $1,250)

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
- **2026-02-14 20:10 GMT**: Evening reconciliation. **Stripe now accessible** via 1Password (UUID: cfpvk6eywbaoopfd5gqnbaglgu). Pulled full charge history (54 charges, 27 successful). QBO still blocked. Flagged failing $120/mo subscription. Output: `output/daily-2026-02-14-pm.md`.
- **2026-02-16 20:10 GMT**: Evening reconciliation. $120 subscription recovered (cus_SPppGJ1w440VFC). Balance: -$36.93 avail / $114.42 pending. 7 open invoices, 5 overdue ($15,853). QBO still blocked (Day 4). Output: `output/daily-2026-02-16-pm.md`.

## Lessons Learned
- Vault at `scripts/vault.sh` must be initialized before any API access works. This is a blocker for all financial operations.
- QBO tokens file (`agents/bookkeeper/qbo-tokens.json`) does not exist — OAuth flow never completed.
- Input queue directory didn't exist — created `input/` on first run.
- Stripe item name has special chars — use UUID `cfpvk6eywbaoopfd5gqnbaglgu` not item name for `op read`.
- Stripe `created[gte]` with future timestamps returns empty (no error) — always verify timestamp is reasonable.
- All Stripe funds are paid out immediately (T+1 faster payouts enabled) — balance is typically $0.00.
