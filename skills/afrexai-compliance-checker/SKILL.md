---
name: afrexai-compliance-checker
description: Check documents, policies, or processes against regulatory and compliance requirements (GDPR, SOC 2, HIPAA, ISO 27001, etc.). Use when reviewing privacy policies, security practices, data handling procedures, or preparing for audits.
---

# Compliance Checker

Review documents against regulatory requirements and flag gaps.

## Usage

```
Check this privacy policy against GDPR:
[paste text or file path]
```

Or: `Review our data handling process for SOC 2 readiness`

## Supported Frameworks

- **GDPR** — Data protection, consent, rights, DPO, breach notification
- **SOC 2** — Security, availability, processing integrity, confidentiality, privacy
- **HIPAA** — PHI handling, safeguards, BAAs, breach notification
- **ISO 27001** — Information security management controls
- **CCPA/CPRA** — California consumer privacy rights
- **PCI DSS** — Payment card data security

## Output Format

```markdown
# Compliance Review: [Document/Process]
**Framework:** [GDPR/SOC 2/etc.]
**Reviewed:** YYYY-MM-DD

## Compliance Score: X/10

## ✅ Compliant
- [Requirement]: [How it's met]

## ❌ Non-Compliant
- [Requirement]: [What's missing and why it matters]
  - *Remediation:* [Specific fix]

## ⚠️ Partially Compliant
- [Requirement]: [What exists vs what's needed]
  - *Remediation:* [Specific fix]

## Priority Remediation Plan
1. [Highest risk item] — [Effort: Low/Med/High]
2. [Next item] — [Effort]

## Disclaimer
This is an AI-assisted compliance review, not a certified audit. Engage qualified compliance professionals for formal certification.
```

## Rules

- Always specify which framework version/year
- Prioritize findings by risk severity
- Provide specific, actionable remediation steps
- Include the disclaimer on every review

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
