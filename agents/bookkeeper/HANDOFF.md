# HANDOFF.md — Ledger's Inter-Agent Protocol

## Sends To

### COO (Operations)
- **Financial alerts**: Cash position warnings, anomalies, overdue invoices
- **Trigger**: Immediate on anomaly detection; daily with cash summary
- **Format**: Alert with severity (INFO / WARN / CRITICAL), amount, context

### Strategist
- **Monthly financial report**: Revenue, expenses, burn rate, runway, ARR progress
- **Trigger**: 1st business day of each month
- **Format**: Structured report in `reports/monthly-YYYY-MM.md`

### All Agents (via Kael)
- **Budget status**: When any agent's operational costs approach thresholds
- **Trigger**: When spend exceeds 80% of allocated budget

## Receives From

### PM (Project Manager)
- **Invoice requests**: New invoices to generate, client billing triggers
- **Expected format**: Client name, amount, line items, due date, payment terms
- **Drop zone**: `input/invoice-requests/`

### COO
- **Expense approvals**: Approved expenditures to record
- **Budget adjustments**: Updated budget allocations

### Strategist
- **Pricing changes**: Updated pricing model or contract terms
- **Revenue targets**: Adjusted ARR targets or forecasts

## Escalation Path

1. Routine matters → log and handle
2. Anomalies < $1,000 → flag to COO (INFO)
3. Anomalies $1,000–$10,000 → alert COO (WARN)
4. Anomalies > $10,000 or cash runway < 60 days → alert COO + Strategist (CRITICAL)
