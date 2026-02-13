# SOC 2 Type II Gap Analysis Checklist — AfrexAI

> Work through each item. Mark ✅ (in place), ⚠️ (partial), or ❌ (missing). Items marked ❌ must be remediated before the audit observation period begins.

---

## CC1 — Control Environment (Governance & Culture)

- [ ] **CC1.1** Board/leadership oversight of security is documented (even if "board" = 2 founders, document it)
- [ ] **CC1.2** Organizational chart exists showing reporting lines and security responsibilities
- [ ] **CC1.3** Code of conduct / acceptable use policy is signed by all personnel
- [ ] **CC1.4** Security roles and responsibilities are formally assigned (who is the "security lead"?)
- [ ] **CC1.5** Background checks performed on employees/contractors before access is granted
- [ ] **CC1.6** Annual security awareness training completed and recorded

## CC2 — Communication & Information

- [ ] **CC2.1** Internal communication channels for security matters are defined (e.g., Slack #security)
- [ ] **CC2.2** External communication process exists (breach notification to customers, regulators)
- [ ] **CC2.3** System description document drafted (services, infrastructure, data flows)
- [ ] **CC2.4** Privacy notice / terms of service published and current

## CC3 — Risk Assessment

- [ ] **CC3.1** Formal risk assessment performed (documented threats, likelihood, impact, mitigations)
- [ ] **CC3.2** Risk register maintained and reviewed at least annually
- [ ] **CC3.3** Risk assessment covers AI-specific risks (model poisoning, prompt injection, data leakage)
- [ ] **CC3.4** Risk appetite / tolerance statement documented by leadership

## CC4 — Monitoring Activities

- [ ] **CC4.1** Continuous monitoring of controls in place (automated via Vanta/Drata or manual)
- [ ] **CC4.2** Internal control deficiencies are tracked and remediated with deadlines
- [ ] **CC4.3** Evidence of control operation collected regularly (screenshots, logs, exports)

## CC5 — Control Activities

- [ ] **CC5.1** Policies and procedures documented (see policies/ directory)
- [ ] **CC5.2** Segregation of duties enforced (no single person deploys + approves in production)
- [ ] **CC5.3** Change management process exists (PR reviews, deployment approvals)

## CC6 — Logical & Physical Access Controls

- [ ] **CC6.1** Unique user accounts for all systems (no shared accounts)
- [ ] **CC6.2** MFA enforced on all critical systems (cloud console, GitHub, email, admin panels)
- [ ] **CC6.3** Principle of least privilege enforced and reviewed quarterly
- [ ] **CC6.4** Access provisioning/deprovisioning process documented (onboarding/offboarding)
- [ ] **CC6.5** Password policy enforced (min 12 chars, complexity, no reuse)
- [ ] **CC6.6** SSH keys / API keys rotated on a schedule; secrets stored in vault (not code)
- [ ] **CC6.7** Physical access controls (if applicable — office, data center)
- [ ] **CC6.8** Endpoint security: disk encryption (FileVault/BitLocker), screen lock, MDM

## CC7 — System Operations

- [ ] **CC7.1** Infrastructure monitoring & alerting in place (uptime, errors, latency)
- [ ] **CC7.2** Vulnerability scanning performed regularly (at least quarterly, ideally continuous)
- [ ] **CC7.3** Penetration testing performed annually by an independent third party
- [ ] **CC7.4** Anti-malware / EDR on all endpoints
- [ ] **CC7.5** Logging enabled on all production systems (min 90-day retention)
- [ ] **CC7.6** Incident response plan documented and tested

## CC8 — Change Management

- [ ] **CC8.1** All code changes go through pull request review before merge
- [ ] **CC8.2** Production deployments are automated (CI/CD) with audit trail
- [ ] **CC8.3** Infrastructure changes tracked (IaC preferred — Terraform, Pulumi, etc.)
- [ ] **CC8.4** Emergency change process documented
- [ ] **CC8.5** Separate dev/staging/production environments

## CC9 — Risk Mitigation (Vendor Management)

- [ ] **CC9.1** Vendor inventory maintained (all third parties that touch customer data)
- [ ] **CC9.2** Vendor risk assessments performed before onboarding
- [ ] **CC9.3** Vendor SOC 2 / security certifications collected and reviewed annually
- [ ] **CC9.4** Vendor contracts include security and data protection clauses

## A1 — Availability (if Availability criteria selected)

- [ ] **A1.1** SLA / uptime commitments documented
- [ ] **A1.2** Disaster recovery plan documented and tested
- [ ] **A1.3** Backup strategy in place (automated, tested, encrypted)
- [ ] **A1.4** Business continuity plan covers key-person risk (2-founder company!)
- [ ] **A1.5** Capacity planning performed

## C1 — Confidentiality

- [ ] **C1.1** Data classification policy in place (public, internal, confidential, restricted)
- [ ] **C1.2** Encryption at rest and in transit for all customer data
- [ ] **C1.3** Data retention and disposal policy documented
- [ ] **C1.4** NDAs signed with all employees, contractors, vendors

## PI1 — Processing Integrity (if selected)

- [ ] **PI1.1** Input validation and error handling in AI agent pipelines
- [ ] **PI1.2** Output accuracy monitoring (are agents doing what they should?)
- [ ] **PI1.3** Customer data processing agreements in place

---

## AI-Specific Controls (AfrexAI Addendum)

> These aren't SOC 2 requirements per se, but auditors increasingly ask about them and customers will too.

- [ ] AI model access controls — who can modify agent behavior/prompts?
- [ ] Prompt injection mitigation measures documented
- [ ] AI agent audit logs — all agent actions logged with timestamps
- [ ] Customer data isolation — agents for Client A cannot access Client B data
- [ ] Model training data governance — no customer data used for training without consent
- [ ] AI output review / human-in-the-loop controls where appropriate
- [ ] LLM API key management (OpenAI, Anthropic, etc.) — rotation, spend limits

---

## Scoring Summary

| Category | Total Items | ✅ | ⚠️ | ❌ |
|----------|-------------|---|---|---|
| CC1 Governance | 6 | | | |
| CC2 Communication | 4 | | | |
| CC3 Risk Assessment | 4 | | | |
| CC4 Monitoring | 3 | | | |
| CC5 Control Activities | 3 | | | |
| CC6 Access Controls | 8 | | | |
| CC7 System Operations | 6 | | | |
| CC8 Change Management | 5 | | | |
| CC9 Vendor Management | 4 | | | |
| A1 Availability | 5 | | | |
| C1 Confidentiality | 4 | | | |
| AI-Specific | 7 | | | |
| **TOTAL** | **59** | | | |
