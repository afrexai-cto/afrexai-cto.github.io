# Vendor Management Policy

**AfrexAI, Inc.**
**Version:** 1.0 | **Effective Date:** [DATE] | **Owner:** [Security Lead Name] | **Next Review:** [DATE + 1 year]

---

## 1. Purpose

This policy establishes requirements for evaluating, onboarding, monitoring, and offboarding third-party vendors to ensure they meet AfrexAI's security and compliance standards, particularly when they have access to customer data or critical systems.

## 2. Scope

All third-party vendors, service providers, contractors, and SaaS tools used by AfrexAI, including but not limited to: cloud infrastructure providers, LLM API providers, SaaS applications, payment processors, and professional service firms.

## 3. Vendor Classification

| Tier | Criteria | Examples | Review Frequency |
|------|----------|----------|-----------------|
| **Critical** | Processes or stores customer data; outage would halt AfrexAI services | AWS/GCP, OpenAI/Anthropic, production database hosting | Annually |
| **Important** | Accesses internal data or supports key business functions | GitHub, Slack, Google Workspace, monitoring tools | Annually |
| **Standard** | No access to sensitive data; limited business impact if unavailable | Marketing tools, design tools, office supplies | At onboarding only |

## 4. Vendor Inventory

A vendor inventory is maintained with the following information for each vendor:

- Vendor name and primary contact
- Service provided
- Tier classification (Critical / Important / Standard)
- Data access: what data does the vendor access/process? (customer data, internal data, none)
- Security certifications held (SOC 2, ISO 27001, etc.)
- Contract/agreement in place (Y/N) with expiration date
- Data Processing Agreement (DPA) in place (Y/N) — required if vendor processes customer data
- Last review date
- Risk assessment result

The inventory is reviewed and updated at least annually.

## 5. Vendor Risk Assessment

### 5.1 Pre-Onboarding Assessment

Before onboarding a Critical or Important vendor:

1. **Security review:** Request and review the vendor's SOC 2 report, ISO 27001 certificate, or equivalent security documentation
2. **Data handling:** Understand what data the vendor will access, where it's stored, and how it's protected
3. **Compliance:** Verify the vendor meets applicable regulatory requirements (GDPR, etc.)
4. **Incident response:** Confirm the vendor has an incident response process and will notify AfrexAI of breaches
5. **Sub-processors:** Identify any sub-processors the vendor uses for AfrexAI data

### 5.2 Risk Scoring

| Factor | Low Risk | Medium Risk | High Risk |
|--------|----------|-------------|-----------|
| Data access | No customer data | Metadata or aggregated data | Direct customer data access |
| SOC 2 / ISO 27001 | Current report available | Report available but aging | No report or certification |
| Data location | Same jurisdiction | Known jurisdiction with adequacy | Unknown or high-risk jurisdiction |
| Replaceability | Easily replaced | Replaceable with effort | Single point of failure |

### 5.3 LLM API Provider Assessment (AI-Specific)

For LLM providers (OpenAI, Anthropic, Google, etc.), additionally assess:
- Data retention policy: Does the provider retain prompts/completions? For how long?
- Training data usage: Is customer data used to train/improve models? Can this be opted out?
- API data processing agreement in place?
- Logging and audit capabilities
- Data residency options

## 6. Contractual Requirements

Contracts with Critical and Important vendors must include:

- [ ] Data protection and confidentiality obligations
- [ ] Right to audit (or SOC 2 report as substitute)
- [ ] Breach notification requirements (within 72 hours)
- [ ] Data return/deletion upon contract termination
- [ ] Compliance with applicable laws and regulations
- [ ] Limitation on sub-processing without notification
- [ ] Insurance requirements (for critical vendors)

For vendors processing personal data: a Data Processing Agreement (DPA) compliant with applicable privacy laws.

## 7. Ongoing Monitoring

| Activity | Frequency | Responsible |
|----------|-----------|-------------|
| Review vendor SOC 2 / security reports | Annually | Security Lead |
| Review vendor access permissions | Quarterly (as part of access review) | Security Lead |
| Check for vendor security incidents/breaches (news, notifications) | Ongoing | Security Lead |
| Review vendor inventory for completeness | Annually | Security Lead |
| Verify DPAs and contracts are current | Annually | Security Lead |

## 8. Vendor Offboarding

When a vendor relationship ends:

1. Revoke all access the vendor has to AfrexAI systems and data
2. Request written confirmation of data deletion from the vendor
3. Rotate any shared credentials or API keys
4. Update the vendor inventory
5. Retain vendor records for a minimum of 3 years

## 9. Exceptions

Exceptions to this policy (e.g., using a vendor without SOC 2) require:
- Written risk acceptance from the Security Lead
- Documented compensating controls
- A defined review date

---

**Approved by:**

| Name | Title | Signature | Date |
|------|-------|-----------|------|
| [Name] | CEO / Co-Founder | | |
| [Name] | CTO / Co-Founder | | |
