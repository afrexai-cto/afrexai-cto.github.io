---
name: afrexai-invoice-generator
description: Generate professional invoices from project data. Use when creating, formatting, or managing invoices for clients — includes line items, taxes, payment terms, and branding. Outputs markdown or HTML-ready invoices.
---

# Invoice Generator

Generate complete, professional invoices from minimal input.

## Usage

Provide:
- Client name and address
- Line items (description, quantity, rate)
- Payment terms (Net 30, etc.)
- Invoice number (or auto-generate as `INV-YYYYMMDD-001`)

```
Generate invoice for:
- Client: Acme Corp, 123 Main St, NYC
- Items: AI Consulting (40hrs @ $200), Data Pipeline Setup (1 @ $5000)
- Payment: Net 30
- Tax: 8.875%
```

## Output Format

Save to `invoices/INV-{number}-{client}.md`:

```markdown
# INVOICE

**From:** [Your Company from context/config]
**To:** [Client Name & Address]
**Invoice #:** INV-20260217-001
**Date:** 2026-02-17
**Due:** 2026-03-19

---

| Description | Qty | Rate | Amount |
|---|---|---|---|
| AI Consulting | 40 hrs | $200.00 | $8,000.00 |
| Data Pipeline Setup | 1 | $5,000.00 | $5,000.00 |

| | |
|---|---|
| **Subtotal** | $13,000.00 |
| **Tax (8.875%)** | $1,153.75 |
| **Total Due** | **$14,153.75** |

---

**Payment Terms:** Net 30
**Bank:** [From config or ask]
```

## Rules

- Auto-number invoices sequentially if no number given
- Always show subtotal, tax (if applicable), and total
- Include due date calculated from payment terms
- Currency defaults to USD unless specified

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
