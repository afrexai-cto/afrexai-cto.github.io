---
name: afrexai-contract-reviewer
description: Review contracts, agreements, and legal documents to flag risks, unusual clauses, and missing protections. Use when analyzing NDAs, MSAs, SOWs, employment agreements, or any business contract for potential issues.
---

# Contract Reviewer

Analyze contracts and flag risks, unusual terms, and missing protections.

## Usage

```
Review this contract: [paste text or file path]
My role: [vendor/client/employee]
Key concerns: [IP, liability, payment terms]
```

## Output Format

```markdown
# Contract Review: [Document Title]
**Type:** [NDA/MSA/SOW/Employment/etc.]
**Parties:** [Party A] ↔ [Party B]
**Reviewing as:** [Your role]

## 🔴 High Risk
1. **[Clause name]** (Section X): [Issue and why it matters]
   - *Recommendation:* [Suggested change]

## 🟡 Medium Risk
1. **[Clause name]** (Section X): [Issue]
   - *Recommendation:* [Suggested change]

## 🟢 Standard/Acceptable
- [Clauses that look normal]

## ⚠️ Missing Protections
- [Important clauses not present, e.g., liability cap, termination rights]

## Summary
- Overall risk level: [Low/Medium/High]
- Top 3 items to negotiate: [list]
```

## What to Flag

- Unlimited liability or indemnification
- One-sided termination rights
- Broad IP assignment beyond project scope
- Non-compete clauses (duration, geography)
- Auto-renewal without notice periods
- Governing law in unfavorable jurisdiction
- Missing limitation of liability
- Vague scope that enables scope creep
- Payment terms exceeding Net 60

## Disclaimer

Always include: *"This is an AI-assisted review, not legal advice. Consult qualified legal counsel before signing."*

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
