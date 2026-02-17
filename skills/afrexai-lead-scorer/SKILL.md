---
name: afrexai-lead-scorer
description: Score and prioritize sales leads based on Ideal Customer Profile (ICP) criteria. Use when evaluating prospects, qualifying leads, or prioritizing outreach lists against fit and intent signals.
---

# Lead Scorer

Score leads against your ICP to prioritize outreach.

## Usage

```
Score these leads against our ICP:
ICP: B2B SaaS, 50-500 employees, Series A+, US/UK, needs AI automation
Leads: [paste CSV, list, or file path]
```

## Scoring Framework

Each lead scored 0-100 across weighted dimensions:

| Dimension | Weight | Signals |
|---|---|---|
| Company Fit | 30% | Industry, size, funding, geography |
| Role Fit | 25% | Title, seniority, decision-making power |
| Intent | 25% | Recent activity, tech stack, job postings |
| Timing | 20% | Funding round, hiring, pain signals |

## Output Format

```markdown
# Lead Scoring: [Campaign/List Name]
**ICP:** [Summary]
**Scored:** YYYY-MM-DD

## 🔥 Hot (80-100)
| Lead | Company | Score | Key Signals |
|---|---|---|---|
| Name | Co | 92 | Series B, hiring ML engineers, 200 emp |

## 🟡 Warm (50-79)
[Same table format]

## 🔵 Cold (<50)
[Same table format]

## Recommended Actions
- **Hot leads:** Personalized outreach within 48hrs
- **Warm leads:** Nurture sequence
- **Cold leads:** Archive or revisit in 90 days
```

## Rules

- If web research is available, enrich leads before scoring
- Always explain *why* a lead scored high or low
- Flag leads with incomplete data — don't guess
- Sort within each tier by score descending

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
