# Data Handling & Classification Policy

**AfrexAI, Inc.**
**Version:** 1.0 | **Effective Date:** [DATE] | **Owner:** [Security Lead Name] | **Next Review:** [DATE + 1 year]

---

## 1. Purpose

This policy defines how AfrexAI classifies, handles, stores, transmits, and disposes of data to protect its confidentiality, integrity, and availability throughout its lifecycle.

## 2. Scope

All data created, collected, processed, stored, or transmitted by AfrexAI, including customer data processed by AI agents, internal business data, and employee data.

## 3. Data Classification

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | **Public** | Information intended for public consumption; no impact if disclosed | Marketing materials, public docs, blog posts |
| 2 | **Internal** | Internal business information; minor impact if disclosed | Internal Slack messages, meeting notes, non-sensitive configs |
| 3 | **Confidential** | Sensitive business or customer information; significant impact if disclosed | Customer data processed by AI agents, financial records, contracts, employee PII, API keys |
| 4 | **Restricted** | Highly sensitive data; severe impact if disclosed | Authentication credentials, encryption keys, customer data involving PII/PHI/financial data, security audit findings |

**Default classification:** All data is **Confidential** unless explicitly classified otherwise.

## 4. Handling Requirements by Classification

### 4.1 Storage

| | Public | Internal | Confidential | Restricted |
|---|---|---|---|---|
| Encryption at rest | Not required | Recommended | **Required** (AES-256) | **Required** (AES-256) |
| Access control | Open | Authenticated users | Need-to-know | Strict need-to-know + MFA |
| Storage location | Any | Approved systems | Approved, encrypted systems | Approved, encrypted, audited systems |

### 4.2 Transmission

| | Public | Internal | Confidential | Restricted |
|---|---|---|---|---|
| Encryption in transit | Not required | **Required** (TLS 1.2+) | **Required** (TLS 1.2+) | **Required** (TLS 1.2+) |
| Email | OK | OK | Avoid; use secure channels | **Prohibited** via email |
| Messaging (Slack, etc.) | OK | OK | Avoid for bulk data | **Prohibited** |

### 4.3 AI Agent Data Handling

Customer data processed by AI agents is classified as **Confidential** or **Restricted** (depending on content):

- AI agents access only the data necessary for the specific task
- **Tenant isolation:** Agent for Customer A cannot access Customer B's data. Enforced at infrastructure level.
- Data sent to third-party LLM APIs:
  - Only sent to providers with approved DPAs
  - Opt out of training data usage where available
  - Minimize data sent (strip unnecessary PII before API calls where feasible)
- Agent conversation logs retained per customer agreement; default 90 days then deleted
- Agent outputs containing customer data inherit the classification of the input data

## 5. Data Retention & Disposal

| Data Type | Retention Period | Disposal Method |
|-----------|-----------------|-----------------|
| Customer data (active engagement) | Duration of contract + 30 days | Secure deletion from all systems |
| Customer data (AI agent logs) | 90 days (or per customer agreement) | Automated purge |
| Financial records | 7 years | Secure deletion |
| Employee records | Duration of employment + 3 years | Secure deletion |
| System/audit logs | Minimum 1 year | Automated rotation |
| Backups containing customer data | 90 days | Encrypted; purged on schedule |

### Secure Disposal Methods
- **Digital data:** Cryptographic erasure or overwrite using approved tools. For cloud storage, delete objects and confirm removal (including versioned copies).
- **Physical media:** Degaussing or physical destruction. (Currently not applicable — AfrexAI is cloud-native.)

## 6. Data Collection & Minimization

- Collect only the data necessary to deliver the service
- Do not collect sensitive data (SSN, health records, financial account numbers) unless explicitly required by the service and agreed with the customer
- Anonymize or pseudonymize data where possible, especially for development and testing
- **No customer data in development/staging environments** unless anonymized

## 7. Backups

- Production databases backed up automatically at least daily
- Backups encrypted at rest (AES-256)
- Backups stored in a separate region/zone from production
- Backup restoration tested at least quarterly
- Backup access restricted to Security Lead and documented

## 8. Data Subject Rights

Where applicable (GDPR, CCPA, etc.):
- AfrexAI supports customer requests for data access, correction, deletion, and portability
- Requests are fulfilled within 30 days
- Process for handling data subject requests is documented

## 9. Incident Handling

Data-related security incidents (unauthorized access, data loss, data exposure) are handled per the **Incident Response Policy**. Any confirmed data breach involving customer data triggers:
- Customer notification within 72 hours
- Regulatory notification as required by law
- Post-incident review

## 10. Training

All personnel receive data handling training as part of security awareness training, covering:
- Classification levels and their meaning
- How to handle each classification level
- What to do if data is mishandled or exposed

---

**Approved by:**

| Name | Title | Signature | Date |
|------|-------|-----------|------|
| [Name] | CEO / Co-Founder | | |
| [Name] | CTO / Co-Founder | | |
