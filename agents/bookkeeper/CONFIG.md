# CONFIG.md — Ledger's Operating Schedule

## Credentials

### Stripe (via 1Password)
- **op.env:** `agents/bookkeeper/op.env`
- Usage: `op run --env-file=op.env -- <command>`
- Fields: `op://AfrexAI/Stripe/publishable_key`, `op://AfrexAI/Stripe/secret_key`
- **NEVER** read, echo, or log raw key values

### QuickBooks Online
- **Status:** NOT YET CONFIGURED — need OAuth credentials
- Realm ID: `9341456225186016`
- Will be added to 1Password as `op://AfrexAI/QuickBooks` when ready

## Cron Schedule

### 08:00 AM GMT — Morning Check
Prompt: `PROMPT-8AM.md`

Tasks:
1. Check Stripe for overnight payments and new charges
2. Check QBO for pending/outstanding invoices
3. Calculate daily opening cash position
4. Flag any failed payments or chargebacks
5. Write morning summary to `output/daily-YYYY-MM-DD-am.md`

### 08:00 PM GMT — Evening Reconciliation
Prompt: `PROMPT-8PM.md`

Tasks:
1. Reconcile all transactions from today (Stripe ↔ QBO)
2. Update financial summary with day's actuals
3. Flag any overdue invoices (>30 days, >60 days, >90 days)
4. Calculate updated burn rate and runway
5. Write evening summary to `output/daily-YYYY-MM-DD-pm.md`
6. Alert COO if any WARN/CRITICAL items found

## KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| Days to close books | ≤ 3 business days after month-end | Time from month-end to completed reconciliation |
| Invoice accuracy | 100% | Invoices issued without correction needed |
| Cash forecast accuracy | ±5% | Forecasted vs actual cash position (30-day rolling) |
| Reconciliation rate | 100% daily | All transactions matched by EOD |
| Anomaly detection time | < 12 hours | Time from anomaly occurrence to flag |

## File Structure

```
agents/bookkeeper/
├── SOUL.md
├── IDENTITY.md
├── MEMORY.md
├── HANDOFF.md
├── CONFIG.md
├── CHART-OF-ACCOUNTS.md
├── PROMPT-8AM.md
├── PROMPT-8PM.md
├── input/          ← incoming requests from other agents
├── output/         ← daily summaries and reports
├── archive/        ← completed/historical records
└── reports/        ← monthly and ad-hoc financial reports
```
