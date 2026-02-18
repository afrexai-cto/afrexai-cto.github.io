# Information Security Policy

**AfrexAI, Inc.**
**Version:** 1.0 | **Effective Date:** [DATE] | **Owner:** [CEO/CTO Name] | **Next Review:** [DATE + 1 year]

---

## 1. Purpose

This policy establishes the information security framework for AfrexAI to protect the confidentiality, integrity, and availability of company and customer information assets. It applies to all systems, data, and personnel involved in delivering AfrexAI's AI agent workforce services.

## 2. Scope

This policy applies to:
- All AfrexAI founders, employees, contractors, and third-party service providers
- All information systems, networks, applications, and data (cloud and local)
- All customer data processed by AfrexAI's AI agents

## 3. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| **Security Lead** ([Name]) | Owns this policy. Oversees security program, risk assessments, incident response, and compliance. |
| **All Personnel** | Follow this policy, report security incidents, complete security training, protect credentials. |

> At AfrexAI's current stage (2 founders), one founder serves as Security Lead. This role will transition to a dedicated hire as the company scales.

## 4. Information Security Principles

1. **Least Privilege:** Access to systems and data is granted only as needed to perform job functions and revoked when no longer required.
2. **Defense in Depth:** Multiple layers of security controls protect information assets.
3. **Encryption:** Customer data is encrypted at rest (AES-256 or equivalent) and in transit (TLS 1.2+).
4. **Logging & Monitoring:** All access to production systems and customer data is logged, retained for a minimum of 90 days, and monitored for anomalies.
5. **Separation of Environments:** Development, staging, and production environments are logically separated. Customer data is not used in development without anonymization.

## 5. Access Control

- Unique accounts required for all personnel on all systems.
- Multi-factor authentication (MFA) required on all critical systems including cloud consoles, code repositories, email, and administrative interfaces.
- Passwords must be a minimum of 12 characters with complexity requirements.
- Access is reviewed quarterly and upon any personnel change.
- See **Access Control Policy** for full details.

## 6. Asset Management

- All hardware (laptops, mobile devices) used for company business must have:
  - Full disk encryption enabled (FileVault, BitLocker)
  - Automatic screen lock (≤5 minutes)
  - Current operating system and security patches
  - Anti-malware / EDR software (when workforce exceeds 5 people or MDM is deployed)
- A hardware inventory is maintained and reviewed annually.

## 7. Network Security

- Production infrastructure runs in [AWS/GCP/Azure] with network segmentation via VPCs/security groups.
- Administrative access to production requires VPN or equivalent secure channel.
- Firewall rules follow deny-by-default; only required ports are open.
- Public-facing services are protected by WAF where applicable.

## 8. Vulnerability Management

- Automated vulnerability scanning runs at least quarterly on all production systems.
- Critical and high-severity vulnerabilities are remediated within 30 days.
- An independent penetration test is performed annually.
- Dependencies are monitored for known vulnerabilities (Dependabot, Snyk, or equivalent).

## 9. Data Protection

- Customer data is classified per the **Data Handling & Classification Policy**.
- Customer data is isolated per tenant — AI agents for one customer cannot access another customer's data.
- Data retention follows documented schedules. Data is securely deleted when no longer needed.
- Backups are automated, encrypted, and tested quarterly.

## 10. AI-Specific Security

- AI agent actions are logged with full audit trails (timestamp, customer, action, input, output).
- Prompt injection mitigation controls are implemented and reviewed.
- LLM API keys are stored in secrets management (not in code), rotated quarterly, and have spend limits.
- Customer data sent to third-party LLM APIs is governed by data processing agreements.
- No customer data is used to train or fine-tune models without explicit written consent.

## 11. Incident Management

- Security incidents are managed per the **Incident Response Policy**.
- All personnel must report suspected security incidents immediately to the Security Lead.
- Post-incident reviews are conducted and documented.

## 12. Security Awareness

- All personnel complete security awareness training within 30 days of onboarding and annually thereafter.
- Training covers: phishing, social engineering, password hygiene, data handling, incident reporting.
- Completion records are maintained as evidence.

## 13. Compliance

- AfrexAI maintains SOC 2 Type II compliance.
- This policy is reviewed and updated at least annually or upon significant changes to infrastructure, services, or threats.
- Exceptions to this policy require written approval from the Security Lead.

## 14. Enforcement

Violation of this policy may result in disciplinary action, up to and including termination of employment or contract, and may also result in legal action.

---

**Approved by:**

| Name | Title | Signature | Date |
|------|-------|-----------|------|
| [Name] | CEO / Co-Founder | | |
| [Name] | CTO / Co-Founder | | |
