# CHART-OF-ACCOUNTS.md — AfrexAI Account Structure

Suggested QBO account structure for an AI services startup with hybrid pricing.

---

## 1000 — Assets

| Account | Name | Type |
|---------|------|------|
| 1000 | Checking — Primary Operating | Bank |
| 1010 | Checking — Payroll | Bank |
| 1020 | Savings — Reserve | Bank |
| 1100 | Accounts Receivable | Accounts Receivable |
| 1200 | Prepaid Expenses | Other Current Asset |
| 1300 | Security Deposits | Other Current Asset |
| 1500 | Computer Equipment | Fixed Asset |
| 1510 | Office Equipment | Fixed Asset |
| 1550 | Accumulated Depreciation | Fixed Asset |

## 2000 — Liabilities

| Account | Name | Type |
|---------|------|------|
| 2000 | Accounts Payable | Accounts Payable |
| 2100 | Credit Card — Corporate | Credit Card |
| 2200 | Accrued Expenses | Other Current Liability |
| 2300 | Payroll Liabilities | Other Current Liability |
| 2310 | Sales Tax Payable | Other Current Liability |
| 2400 | Deferred Revenue | Other Current Liability |
| 2500 | Line of Credit | Long Term Liability |

## 3000 — Equity

| Account | Name | Type |
|---------|------|------|
| 3000 | Owner's Equity | Equity |
| 3100 | Retained Earnings | Equity |
| 3200 | Owner's Distributions | Equity |
| 3300 | Common Stock | Equity |

## 4000 — Revenue

| Account | Name | Type | Notes |
|---------|------|------|-------|
| 4000 | Revenue — Retainer Fees | Income | Monthly retainer component |
| 4010 | Revenue — Per-Agent Fees | Income | Per-agent deployment fees |
| 4020 | Revenue — Performance Bonuses | Income | Performance-based component |
| 4030 | Revenue — Setup / Onboarding | Income | One-time implementation fees |
| 4040 | Revenue — Consulting / Advisory | Income | Ad-hoc consulting |
| 4050 | Revenue — Training | Income | Customer training sessions |
| 4900 | Other Income | Other Income | Interest, misc |

## 5000 — Cost of Goods Sold

| Account | Name | Type | Notes |
|---------|------|------|-------|
| 5000 | COGS — AI Compute (OpenAI/Anthropic) | COGS | LLM API costs |
| 5010 | COGS — Cloud Infrastructure | COGS | AWS/GCP/Azure hosting |
| 5020 | COGS — Third-Party APIs | COGS | Stripe fees, integrations |
| 5030 | COGS — Agent Operations | COGS | OpenClaw, monitoring, tooling |
| 5040 | COGS — Data & Storage | COGS | Databases, vector stores |
| 5050 | COGS — Customer Support (Direct) | COGS | Direct delivery labor |

## 6000 — Operating Expenses

| Account | Name | Type | Notes |
|---------|------|------|-------|
| 6000 | Salaries & Wages | Expense | Full-time employees |
| 6010 | Contractor Payments | Expense | Freelancers, consultants |
| 6020 | Payroll Taxes & Benefits | Expense | Employer taxes, health, etc. |
| 6100 | Rent & Office | Expense | Office space, coworking |
| 6110 | Utilities | Expense | Internet, phone, power |
| 6200 | Software Subscriptions | Expense | SaaS tools (non-COGS) |
| 6210 | Hardware & Equipment | Expense | Under capitalization threshold |
| 6300 | Marketing & Advertising | Expense | Paid ads, content, events |
| 6310 | Sales Commissions | Expense | Sales team compensation |
| 6320 | PR & Communications | Expense | Public relations |
| 6400 | Legal & Professional | Expense | Lawyers, accountants, auditors |
| 6410 | Insurance | Expense | E&O, cyber, general liability |
| 6420 | Licenses & Permits | Expense | Business licenses, compliance |
| 6500 | Travel & Entertainment | Expense | Business travel, client meals |
| 6600 | Research & Development | Expense | R&D not capitalized |
| 6700 | Bank Fees & Charges | Expense | Wire fees, service charges |
| 6710 | Payment Processing Fees | Expense | Stripe fees (non-COGS portion) |
| 6800 | Depreciation & Amortization | Expense | Fixed asset depreciation |
| 6900 | Miscellaneous Expense | Expense | Catch-all (minimize use) |

---

## Notes

- **Revenue split matters**: The hybrid model (retainer + per-agent + performance) requires three distinct revenue accounts to track pricing model effectiveness.
- **COGS granularity**: AI compute is likely the largest COGS line — track by provider if possible (OpenAI vs Anthropic vs other).
- **Deferred Revenue (2400)**: Critical for retainer-based billing — recognize monthly, not at invoice.
- **Stripe fees**: Allocate between COGS (5020, for customer-facing charges) and OpEx (6710, for internal transfers).
- **R&D (6600)**: Track carefully for potential R&D tax credits.
