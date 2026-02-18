# Access Control Policy

**AfrexAI, Inc.**
**Version:** 1.0 | **Effective Date:** [DATE] | **Owner:** [Security Lead Name] | **Next Review:** [DATE + 1 year]

---

## 1. Purpose

This policy defines how access to AfrexAI's information systems, applications, and data is granted, managed, reviewed, and revoked to ensure only authorized individuals have appropriate access.

## 2. Scope

All systems that store, process, or transmit AfrexAI or customer data, including but not limited to: cloud infrastructure (AWS/GCP), code repositories (GitHub), SaaS applications, databases, AI agent platforms, and LLM API accounts.

## 3. Principles

- **Least Privilege:** Users receive the minimum access necessary to perform their role.
- **Need-to-Know:** Access to customer data is granted only when required for a specific business function.
- **Separation of Duties:** No single individual should have unchecked ability to modify production systems without review.

## 4. Authentication Requirements

### 4.1 Passwords
- Minimum 12 characters
- Must include uppercase, lowercase, numbers, and special characters (or use a passphrase of 16+ characters)
- No reuse of the last 12 passwords
- Changed immediately if compromise is suspected
- Password managers are required (1Password, Bitwarden, or equivalent)

### 4.2 Multi-Factor Authentication (MFA)
MFA is **mandatory** on the following systems:
- Cloud provider consoles (AWS, GCP, Azure)
- Email (Google Workspace, Microsoft 365)
- Code repositories (GitHub, GitLab)
- CI/CD platforms
- Production databases and admin panels
- LLM API provider dashboards (OpenAI, Anthropic)
- Compliance platform (Vanta, Drata)
- Any system that can access customer data

Preferred MFA methods (in order): hardware security keys (YubiKey), authenticator apps (TOTP). SMS-based MFA is discouraged.

### 4.3 SSH & API Keys
- SSH keys must use Ed25519 or RSA 4096-bit minimum
- API keys and secrets stored in a secrets manager (AWS Secrets Manager, HashiCorp Vault, or Doppler) — **never in source code**
- API keys rotated at least quarterly
- LLM API keys have spend limits configured
- Unused keys are revoked immediately

## 5. Access Provisioning

### 5.1 Onboarding
When a new team member joins:
1. Security Lead creates accounts with role-appropriate access levels
2. MFA is configured before any system access is granted
3. New member reads and signs: Information Security Policy, Acceptable Use Policy, this Access Control Policy
4. Security awareness training completed within 30 days
5. Access granted is documented (who, what system, what role, date, approved by)

### 5.2 Role Changes
When a team member changes roles:
1. Previous role-specific access is revoked
2. New role-appropriate access is provisioned
3. Changes documented

### 5.3 Offboarding
When a team member departs (same day as departure):
1. All system accounts disabled or deleted
2. SSH keys and API keys revoked
3. Shared credentials rotated (if any were shared — this should be rare)
4. Email forwarding configured if needed (manager only)
5. Device wiped or returned
6. Offboarding checklist completed and stored as evidence

## 6. Access Levels

| Level | Description | Example Systems |
|-------|-------------|-----------------|
| **Admin** | Full control including user management and billing | Cloud console root, GitHub org owner |
| **Developer** | Read/write to code and staging; read-only to production logs | GitHub contributor, staging DB access |
| **Read-Only** | View access only; no ability to modify | Dashboard viewers, log readers |
| **Service Account** | Automated system access with scoped permissions | CI/CD deploy keys, monitoring agents |

Service accounts must:
- Have a documented owner (a human responsible for the account)
- Use scoped credentials (not admin-level)
- Be reviewed quarterly

## 7. Access Reviews

| Review | Frequency | Performed By | Evidence |
|--------|-----------|-------------|----------|
| User access listing across all critical systems | Quarterly | Security Lead | Exported user lists with roles |
| Privileged/admin access verification | Quarterly | Security Lead | Confirmation that admin access is still justified |
| Service account review | Quarterly | Security Lead | List of service accounts, owners, and permissions |
| Dormant account detection | Quarterly | Security Lead | Accounts inactive >90 days are disabled |

Access review results are documented and stored as SOC 2 evidence.

## 8. Remote Access

- All remote access to production systems requires VPN or equivalent encrypted channel
- Personal devices used for work must meet endpoint security requirements (see Information Security Policy §6)
- Public Wi-Fi use requires VPN

## 9. Physical Access

- AfrexAI currently operates remotely. Physical access controls apply if/when office space is obtained.
- Cloud provider physical security is inherited from AWS/GCP/Azure SOC 2 reports.

## 10. Logging & Monitoring

- All authentication events (login, logout, failed attempts) are logged
- Administrative actions are logged with user identity and timestamp
- Logs are retained for a minimum of 90 days
- Repeated failed login attempts trigger alerts (3+ failures in 15 minutes)

## 11. Exceptions

Any exception to this policy requires:
- Written justification
- Approval from the Security Lead
- A defined expiration date
- Documentation stored as evidence

---

**Approved by:**

| Name | Title | Signature | Date |
|------|-------|-----------|------|
| [Name] | CEO / Co-Founder | | |
| [Name] | CTO / Co-Founder | | |
