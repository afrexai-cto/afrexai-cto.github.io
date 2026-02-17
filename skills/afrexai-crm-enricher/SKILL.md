---
name: afrexai-crm-enricher
description: Enrich CRM contacts and company records with web research. Use when you need to fill in missing company data, find contact details, research prospects, or update stale CRM records with current information.
---

# CRM Enricher

Enrich contact and company records with web research.

## Usage

```
Enrich these contacts:
- John Smith, CEO, Acme Corp
- Jane Doe, CTO, TechStart Inc
```

Or: `Enrich contacts from [CSV file path]`

## Enrichment Fields

### Company
- Industry, sub-industry
- Employee count, revenue range
- Funding stage and total raised
- Headquarters location
- Tech stack (from job postings, BuiltWith)
- Recent news (funding, launches, hiring)
- LinkedIn company URL, website

### Contact
- Current title and company (verify)
- LinkedIn profile URL
- Professional background summary
- Recent activity or posts
- Mutual connections or shared interests

## Output Format

```markdown
# CRM Enrichment: [List/Campaign Name]
**Enriched:** YYYY-MM-DD | **Records:** X

## John Smith — Acme Corp
| Field | Value | Source | Confidence |
|---|---|---|---|
| Title | CEO | LinkedIn | High |
| Company Size | 150-200 | LinkedIn | High |
| Industry | AI/ML SaaS | Website | High |
| Funding | Series B, $25M | Crunchbase | High |
| Tech Stack | Python, AWS, React | Job postings | Medium |
| Recent News | Launched v2.0 Jan 2026 | Blog | High |

**Talking Points:**
- Recently raised Series B — likely scaling team
- Hiring ML engineers — potential AI consulting need
- Posted about automation challenges on LinkedIn

---
[Repeat for each contact]
```

## Rules

- Use web search to find current information
- Mark confidence level on each data point
- Flag stale or conflicting information
- Generate personalized talking points for sales outreach
- Never fabricate data — mark as "Not Found" if unavailable

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
