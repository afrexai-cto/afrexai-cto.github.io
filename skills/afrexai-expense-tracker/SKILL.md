---
name: afrexai-expense-tracker
description: Categorize, track, and summarize business expenses. Use when processing receipts, categorizing transactions, generating expense reports, or analyzing spending patterns.
---

# Expense Tracker

Categorize and summarize business expenses from raw transaction data.

## Usage

```
Categorize these expenses:
- $49.99 Zoom monthly subscription
- $234.50 Delta Airlines SFO-NYC
- $18.75 Uber to client meeting
- $1,200 WeWork hot desk February
- $89.00 Figma annual (prorated)
```

Or: `Process expenses from [file path / CSV]`

## Categories

| Category | Examples | Tax Deductible |
|---|---|---|
| Software & SaaS | Zoom, Figma, AWS | Yes |
| Travel | Flights, hotels, car rental | Yes |
| Transport | Uber, taxi, parking | Yes (business) |
| Office & Coworking | WeWork, supplies | Yes |
| Meals & Entertainment | Client dinners | 50% (US) |
| Professional Services | Legal, accounting | Yes |
| Marketing | Ads, events, swag | Yes |
| Equipment | Laptop, monitor | Depreciable |
| Other | Uncategorized | Review |

## Output Format

```markdown
# Expense Report: [Period]
**Total:** $X,XXX.XX

## By Category
| Category | Amount | % of Total | Count |
|---|---|---|---|
| Software & SaaS | $XXX | XX% | X |
| Travel | $XXX | XX% | X |

## All Transactions
| Date | Description | Category | Amount |
|---|---|---|---|
| YYYY-MM-DD | Zoom | Software & SaaS | $49.99 |

## Insights
- Top spending category: [X]
- Month-over-month change: [if historical data available]
- Flagged items: [unusual or duplicate expenses]
```

## Rules

- Auto-categorize based on vendor/description
- Flag potential duplicates
- Flag unusually large expenses for review
- Default currency USD unless specified

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
