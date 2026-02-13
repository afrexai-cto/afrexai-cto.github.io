# Tax Implications: UK Founders with US Delaware LLC

**⚠️ This is a summary overview. Engage a cross-border tax advisor (UK + US) before making decisions.**

## The Core Issue

A multi-member US LLC is treated as a **partnership** for US tax purposes (pass-through entity). This creates complexity for UK tax residents because:

- The US sees it as a transparent entity (income passes through to members)
- HMRC's treatment of US LLCs is **complex and fact-dependent** (see Anson v HMRC)

## US Tax Obligations

### Federal

| Item | Details |
|------|---------|
| **Entity return** | Form 1065 (Partnership Return) — due March 15 annually |
| **Member returns** | Each member receives Schedule K-1 |
| **Personal filing** | Each member files Form 1040-NR (Non-Resident Alien) if there is US-source income |
| **Tax rate** | Depends on income type and amount; graduated rates up to 37% |
| **FIRPTA** | Applies if LLC holds US real property (unlikely for tech company) |

### Key Point: Effectively Connected Income (ECI)

- If the LLC has income **effectively connected** with a US trade or business, members must file US tax returns and pay US tax on that income
- If all operations/customers are outside the US and no one works from the US, there may be **no US-source income** — but this requires careful analysis

### Delaware State

| Item | Details |
|------|---------|
| **Franchise tax** | $300/yr (flat fee for LLCs) — due June 1 |
| **State income tax** | **None** — Delaware does not tax LLC income if no operations in Delaware |

### Other State Taxes

- If you have employees, customers, or an office in **New York** (e.g., virtual office), you may trigger NY tax obligations
- Virtual offices **alone** generally do not create nexus, but consult an advisor

## UK Tax Obligations

### HMRC Treatment of US LLCs

Following **Anson v HMRC [2015] UKSC 44**, HMRC accepts that a Delaware LLC member's share of LLC income can be treated as the member's own income (transparent treatment) — **but only if the LLC agreement provides that income is automatically allocated to members as it arises**.

This means:
- ✅ Your Operating Agreement should clearly state profits are allocated to members as earned (not just on distribution)
- ✅ UK members report their share of LLC profits on their UK self-assessment
- ✅ UK members can claim **foreign tax credit** for US taxes paid (under the US-UK Double Taxation Treaty)

### Double Taxation Treaty (US-UK)

| Provision | Effect |
|-----------|--------|
| **Article 7** | Business profits taxable only in country of residence unless there's a "permanent establishment" in the US |
| **Article 23** | UK gives credit for US taxes paid |
| **Treaty benefit** | Avoids double taxation — you pay the higher of the two rates, not both |

### Practical Outcome

1. LLC earns income
2. Income allocated to members (50/50)
3. If income is US-source ECI → members pay US tax, claim credit on UK return
4. If income is NOT US-source → likely only UK tax applies
5. UK self-assessment: report worldwide income, claim foreign tax credits

## Tax Filing Requirements Summary

| Filing | Who | When | Where |
|--------|-----|------|-------|
| Form 1065 | AfrexAI LLC | March 15 | IRS (US) |
| Schedule K-1 | Each member | With 1065 | IRS (US) |
| Form 1040-NR | Each member (if ECI) | April 15 | IRS (US) |
| Self-Assessment | Each member | January 31 | HMRC (UK) |
| Delaware franchise tax | AfrexAI LLC | June 1 | Delaware |
| BOI Report | AfrexAI LLC | Within 90 days of formation | FinCEN |

## Annual Compliance Costs (Estimate)

| Item | Cost |
|------|------|
| US tax preparation (1065 + 2x 1040-NR) | $1,500–3,000 |
| UK self-assessment (2 members) | $500–1,000 each |
| Delaware franchise tax | $300 |
| Registered agent | $125–199 |
| **Total annual compliance** | **$3,000–5,000** |

## ⚠️ Critical Considerations

### LLC vs C-Corp for UK Founders

Many advisors recommend UK founders use a **C-Corp** instead of an LLC because:
- C-Corp is clearly **opaque** for both US and UK tax purposes (no transparency issues)
- Dividends taxed at known rates (15% treaty rate for UK residents)
- Cleaner for VC fundraising
- No K-1 complexity

**However**, LLC is better if:
- You want pass-through taxation (avoid corporate-level tax)
- You're bootstrapping (no VC plans)
- Operations/income are primarily non-US (minimal US tax)
- You want flexibility to convert later

### Action Items

1. **Hire a cross-border tax advisor** — firms like:
   - Greenback Expat Tax Services
   - Bright!Tax
   - EY / Deloitte (larger budget)
   - Blick Rothenberg (UK firm with US expertise)
2. **Ensure Operating Agreement** allocates income to members as earned (Anson compliance)
3. **Track income sources** — US-source vs non-US-source matters enormously
4. **Consider the C-Corp question** seriously before filing — converting LLC to C-Corp later has tax consequences
5. **File everything on time** — penalties for late partnership returns are $220/member/month

---

*This guide reflects general principles as of February 2026. Tax law changes frequently. Professional advice is essential.*
