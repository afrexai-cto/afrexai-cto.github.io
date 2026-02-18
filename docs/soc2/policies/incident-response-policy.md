# Incident Response Policy

**AfrexAI, Inc.**
**Version:** 1.0 | **Effective Date:** [DATE] | **Owner:** [Security Lead Name] | **Next Review:** [DATE + 1 year]

---

## 1. Purpose

This policy establishes procedures for identifying, responding to, and recovering from security incidents to minimize damage, reduce recovery time, and protect AfrexAI and its customers.

## 2. Scope

All security events and incidents affecting AfrexAI's systems, data, or services, including those involving customer data processed by AI agents.

## 3. Definitions

| Term | Definition |
|------|-----------|
| **Security Event** | Any observable occurrence relevant to information security (e.g., failed login attempt, alert trigger). |
| **Security Incident** | A security event that results in (or has the potential for) unauthorized access, data loss, service disruption, or policy violation. |
| **Data Breach** | A confirmed incident where customer or sensitive data was accessed or exfiltrated by an unauthorized party. |

## 4. Severity Classification

| Severity | Description | Examples | Response Time |
|----------|-------------|----------|---------------|
| **Critical (P1)** | Active data breach, system compromise, or total service outage | Customer data exfiltrated; production DB compromised; ransomware | Immediate (within 1 hour) |
| **High (P2)** | Significant security issue with potential for data exposure | Unauthorized access detected; vulnerability actively exploited; AI agent behaving anomalously with customer data | Within 4 hours |
| **Medium (P3)** | Security issue with limited immediate impact | Phishing attempt on team member; suspicious login from unusual location; non-critical vuln discovered | Within 24 hours |
| **Low (P4)** | Minor security event, informational | Failed login attempts; policy violation with no data impact; spam | Within 72 hours |

## 5. Incident Response Team

| Role | Person | Responsibilities |
|------|--------|-----------------|
| **Incident Commander** | [Founder 1 Name] | Leads response, makes decisions, coordinates communication |
| **Technical Lead** | [Founder 2 Name] | Investigates root cause, implements containment and remediation |
| **Communications** | [Founder 1 Name] | Handles customer and external communication |

> As AfrexAI grows, these roles will be distributed across additional team members.

## 6. Incident Response Phases

### Phase 1: Detection & Identification

**Sources of detection:**
- Automated monitoring alerts (infrastructure, application, security tools)
- Compliance platform alerts (Vanta/Drata)
- Customer reports
- Team member observations
- Third-party notifications (cloud provider, LLM API provider, security researchers)

**Actions:**
1. Confirm whether the event constitutes an incident
2. Assign severity level (P1–P4)
3. Create an incident record with: date/time detected, description, severity, systems affected, initial assessment
4. Notify the Incident Commander immediately for P1/P2

### Phase 2: Containment

**Immediate containment (stop the bleeding):**
- Revoke compromised credentials
- Isolate affected systems (security group changes, disable network access)
- Disable compromised user accounts
- If AI agent is affected: halt the agent immediately; quarantine its data access
- Preserve logs and forensic evidence before any system changes

**Short-term containment:**
- Apply temporary fixes (firewall rules, access blocks)
- Redirect traffic if needed
- Enable enhanced logging on affected systems

### Phase 3: Eradication

- Identify root cause
- Remove the threat (malware, unauthorized access, vulnerability)
- Patch vulnerable systems
- Reset all potentially compromised credentials
- Verify AI agent integrity if agents were involved (review recent actions/outputs)

### Phase 4: Recovery

- Restore systems from clean backups if needed
- Gradually return systems to production with enhanced monitoring
- Verify system integrity before restoring full access
- Re-enable AI agents only after confirming data isolation and behavior integrity
- Monitor closely for recurrence (24–72 hours)

### Phase 5: Post-Incident Review

Conducted within 5 business days of incident resolution:

1. **Timeline:** What happened, when, and in what order?
2. **Root Cause:** What was the underlying cause?
3. **Detection:** How was the incident detected? Could we detect it faster?
4. **Response:** What went well? What didn't?
5. **Impact:** What data/systems/customers were affected?
6. **Remediation:** What changes prevent recurrence?
7. **Action Items:** Specific tasks with owners and deadlines

Post-incident review is documented and stored. Blameless culture — focus on systems, not individuals.

## 7. Communication & Notification

### Internal
- P1/P2: Immediate notification to all team members via Slack/phone
- All incidents: Logged in incident tracking system

### Customer Notification
For incidents involving customer data:
- Notify affected customers within **72 hours** of confirmed breach
- Notification includes: what happened, what data was affected, what we're doing about it, what they should do
- Follow up with post-incident summary

### Regulatory/Legal
- If personal data of EU residents is involved: GDPR requires notification to supervisory authority within 72 hours
- Consult legal counsel for any confirmed data breach
- Document all notifications sent

## 8. AI Agent-Specific Procedures

| Scenario | Response |
|----------|----------|
| AI agent accessing wrong customer's data | Immediately halt agent. Revoke access. Audit all recent actions. Notify both customers. |
| AI agent producing harmful/unauthorized output | Halt agent. Review prompt chain and inputs. Check for prompt injection. |
| LLM API key compromised | Rotate key immediately. Check API usage logs for unauthorized calls. Set new spend limits. |
| Customer reports AI agent doing something unexpected | Halt agent for that customer. Pull audit logs. Investigate. Respond to customer within 4 hours. |

## 9. Evidence Preservation

For all P1/P2 incidents:
- Preserve all logs (do not rotate or delete)
- Take system snapshots/images if possible
- Document all actions taken with timestamps
- Screenshot relevant dashboards and alerts
- Store evidence in a secure, access-controlled location

## 10. Testing

- Incident response plan is tested at least annually via tabletop exercise
- Test scenarios include: data breach, ransomware, AI agent compromise, cloud account takeover
- Test results and improvements are documented

## 11. Reporting

A summary of all security incidents is reviewed quarterly by leadership, including:
- Number and severity of incidents
- Mean time to detect and respond
- Trends and patterns
- Status of remediation action items

---

**Approved by:**

| Name | Title | Signature | Date |
|------|-------|-----------|------|
| [Name] | CEO / Co-Founder | | |
| [Name] | CTO / Co-Founder | | |
