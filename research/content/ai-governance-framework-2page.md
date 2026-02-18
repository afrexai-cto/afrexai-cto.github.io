# AI Governance Framework for Insurance Carriers
### A Practical 2-Page Guide to CT SB-2 & Emerging State AI Regulation

*Prepared by AfrexAI — AI Implementation & Governance for Financial Services*

---

## Page 1: The Regulatory Landscape & What It Means for You

### What's Changed (2025-2026)

| Regulation | Effective | Who's Affected | Key Obligation |
|-----------|-----------|---------------|----------------|
| **CT SB-2** (Insurance AI) | Enforcement active; 60-day cure ends June 30, 2026 | All carriers using AI in underwriting, pricing, claims | Developer/deployer governance programs, bias testing, consumer disclosure |
| **CO SB21-169** | Already enforced | Carriers operating in CO | Unfair discrimination testing for life insurance AI |
| **HHS AI Mandate** | April 3, 2026 | Health insurers, TPAs | AI governance practices across all divisions |
| **NAIC Model Bulletin** | Adopted by 15+ states | All P&C and life carriers | Board-level AI risk oversight, inventory of AI systems |

### The 3 Obligations Every Carrier Must Meet

**1. AI System Inventory & Risk Classification**
- Catalog every AI/ML model in production (underwriting, claims, fraud, pricing, marketing)
- Classify each by risk tier: High (coverage decisions), Medium (routing/triage), Low (internal ops)
- High-risk models require documented governance before June 30

**2. Bias Testing & Impact Assessment**
- Disparate impact testing across protected classes (race, gender, age, disability)
- Document methodology, frequency (minimum annual), and remediation steps
- CT SB-2 specifically requires testing against "proxy discrimination" — correlations that produce discriminatory outcomes even without using protected data directly

**3. Consumer Transparency & Disclosure**
- Consumers must be informed when AI materially influences coverage, pricing, or claims decisions
- Adverse action notices must explain AI's role in the decision
- Carriers must maintain records of AI-assisted decisions for regulatory examination

---

## Page 2: The Implementation Playbook (90-Day Sprint)

### Phase 1: Discovery & Inventory (Weeks 1-3)
| Action | Owner | Output |
|--------|-------|--------|
| Catalog all AI/ML models across business lines | CIO/CTO + Line Leaders | AI System Registry |
| Map data flows and third-party model dependencies | Data Engineering | Data Lineage Map |
| Identify high-risk models (coverage/pricing decisions) | Compliance + Actuarial | Risk Classification Matrix |
| Review existing vendor AI governance (e.g., Verisk, LexisNexis models) | Procurement | Vendor AI Audit Checklist |

### Phase 2: Governance Framework Build (Weeks 4-8)
| Action | Owner | Output |
|--------|-------|--------|
| Establish AI Governance Committee (cross-functional) | Board/C-Suite sponsor | Charter & Meeting Cadence |
| Define bias testing methodology per model type | Actuarial + Data Science | Testing Protocols |
| Build model documentation templates (purpose, data, limitations, monitoring) | Data Science | Model Cards for each high-risk system |
| Draft consumer disclosure language | Legal + Compliance | Disclosure Templates |
| Implement model monitoring dashboards | Engineering | Real-time drift & fairness metrics |

### Phase 3: Validation & Audit Readiness (Weeks 9-12)
| Action | Owner | Output |
|--------|-------|--------|
| Run bias tests on all high-risk models | Data Science | Test Results & Remediation Log |
| Conduct mock regulatory examination | Compliance | Gap Assessment |
| Train frontline staff on AI disclosure requirements | HR/Training | Completion Records |
| Document governance program for regulator submission | Compliance | Governance Program Package |

### What "Done" Looks Like
✅ Every AI model inventoried and risk-classified
✅ Bias testing completed and documented for high-risk models
✅ Consumer disclosure processes live in claims and underwriting
✅ Board-level oversight established with quarterly review cadence
✅ Audit trail ready for CT AG examination

---

### Why Carriers Partner With AfrexAI

Most governance programs stall at Phase 1. Teams don't know what counts as "AI," actuarial and IT speak different languages, and compliance frameworks become shelfware.

We've built governance programs for regulated industries that actually work — not 200-page policies nobody reads, but operational systems that satisfy regulators AND improve model performance.

**The counterintuitive truth:** Well-governed AI models perform *better*. Bias testing catches data quality issues. Documentation forces clarity on model purpose. Monitoring catches drift before it costs you money.

**Next step:** 30-minute diagnostic call to map your current AI inventory and identify your top 3 compliance gaps before June 30.

📧 ksmolichki@afrexai.com | 🌐 afrexai.com

---
*© 2026 AfrexAI. This framework is provided for informational purposes and does not constitute legal advice.*
