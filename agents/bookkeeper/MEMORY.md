# MEMORY.md — Ledger's Long-Term Memory

## Integrations

- **QuickBooks Online**: NOT USED — use PostgreSQL CRM + local CSVs
- **Stripe**: Connected with live keys

## Financial State

- **Current state**: PARTIAL — Stripe accessible, QBO not used — PostgreSQL CRM is the source of truth
- **Last reconciliation**: 2026-02-19 08:10 GMT (Stripe-only)
- **Stripe balance**: $76.65 available, $0.00 pending
- **Total paid out to bank (all-time)**: $111,227.91
- **Gross revenue (all-time, Stripe)**: $84,621.66
- **Trailing 6mo avg monthly revenue**: ~$13,900/mo
- **Implied ARR**: $166,803.32 (1.52% of $11M target)
- **Burn rate**: UNKNOWN (requires QBO)
- **Runway**: UNKNOWN (requires QBO)
- **Key client revenue**: ~$12,143/mo recurring (VADIS-style invoice payments)
- **Subscription**: $120/mo recurring — recovered on 2026-02-16 after 3 consecutive failures
- **Open invoices**: 8 totaling $26,073.00 (7 overdue totaling $16,073.00; oldest: 262 days, VADA $1,250)
- **Revenue concentration**: VADIS = ~87% of MRR — CRITICAL single-client risk

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
- **2026-02-14 20:10 GMT**: Evening reconciliation. **Stripe now accessible** via 1Password (UUID: cfpvk6eywbaoopfd5gqnbaglgu). Pulled full charge history (54 charges, 27 successful). QBO not used — PostgreSQL CRM is the source of truth. Flagged failing $120/mo subscription. Output: `output/daily-2026-02-14-pm.md`.
- **2026-02-16 20:10 GMT**: Evening reconciliation. $120 subscription recovered (cus_SPppGJ1w440VFC). Balance: -$36.93 avail / $114.42 pending. 7 open invoices, 5 overdue ($15,853). QBO not used — PostgreSQL CRM is the source of truth (Day 4). Output: `output/daily-2026-02-16-pm.md`.
- **2026-02-18 08:15 GMT**: Morning check. 1 overnight payment: $120 BuildGrid subscription (succeeded). Balance: -$37.77 avail / $114.42 pending. 8 open invoices ($26,193), 6 overdue ($16,073). VADIS $12,143 now 12 days overdue — flagged WARN. Revenue concentration risk flagged (87% single-client). Output: `output/daily-2026-02-18-am.md`.
- **2026-02-18 20:10 GMT**: Evening reconciliation. Zero revenue day — no charges or payment events. Balance unchanged: -$37.77 avail / $114.42 pending. 8 open invoices ($26,073), 6 overdue ($16,073). 3 invoices now CRITICAL (>90d): Jacob Johnson $2,200 @ 99d, BuildGrid $120 @ 128d, VADA $1,250 @ 261d. Recommended VADA write-off. Output: `output/daily-2026-02-18-pm.md`.
- **2026-02-19 08:10 GMT**: Morning check. Zero overnight revenue (3rd consecutive zero day). Balance: $76.65 avail / $0.00 pending (pending cleared). 8 open invoices ($26,073), 7 overdue ($16,073). VADIS $12,143 now 13 days overdue — approaching escalation threshold. 3 invoices CRITICAL (>90d). Output: `output/daily-2026-02-19-am.md`.
- **2026-02-20 08:10 GMT**: Morning check. 4th consecutive zero-revenue day. Balance unchanged: $76.65 avail / $0.00 pending. 8 open invoices ($26,073), 7 overdue ($16,073). VADIS $12,143 now 14d overdue — WARN escalation. Lisa Kingham $120 now 2d overdue. VADA 263d overdue. 3 invoices CRITICAL (>90d, $3,570). Output: `output/daily-2026-02-20-am.md`.

## Lessons Learned
- Vault at `scripts/vault.sh` must be initialized before any API access works. This is a blocker for all financial operations.
- QBO tokens file (`agents/bookkeeper/qbo-tokens.json`) does not exist — OAuth flow never completed.
- Input queue directory didn't exist — created `input/` on first run.
- Stripe item name has special chars — use UUID `cfpvk6eywbaoopfd5gqnbaglgu` not item name for `op read`.
- Stripe `created[gte]` with future timestamps returns empty (no error) — always verify timestamp is reasonable.
- All Stripe funds are paid out immediately (T+1 faster payouts enabled) — balance is typically $0.00.
