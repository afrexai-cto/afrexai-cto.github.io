# Quick Wins — Do THIS WEEK (Feb 13–20, 2026)

> These are zero/low-cost actions that immediately improve your security posture and start generating SOC 2 evidence. Do all of them. None require an auditor or compliance platform.

---

## Day 1 (Friday, Feb 13)

### 🔐 1. Enable MFA Everywhere — 30 minutes
- [ ] Google Workspace / email — enforce MFA for both founders
- [ ] GitHub — require 2FA on org
- [ ] AWS / GCP / Azure console — enable MFA on root and IAM accounts
- [ ] OpenAI / Anthropic / LLM provider dashboards
- [ ] Slack
- [ ] Any admin panel for your product
- **Why:** Single biggest security improvement. Auditors check this first.

### 💻 2. Enable Disk Encryption — 10 minutes
- [ ] macOS: System Settings → FileVault → Turn On
- [ ] Windows: BitLocker → Turn On
- [ ] Verify on all devices both founders use
- **Why:** Required for SOC 2. Takes 10 minutes, generates evidence forever.

### 🔒 3. Enable Screen Lock — 5 minutes
- [ ] Set auto-lock to 5 minutes or less on all devices
- [ ] Require password on wake
- **Why:** Trivial but auditors specifically check for it.

---

## Day 2 (Saturday/Monday)

### 📋 4. Adopt the Policies in This Package — 1 hour
- [ ] Read through all 6 policies in `policies/`
- [ ] Customize company-specific details (fill in [brackets])
- [ ] Both founders sign (digital signature or typed acknowledgment is fine)
- [ ] Store signed copies (Google Drive, Notion, or compliance platform once set up)
- **Why:** You cannot pass SOC 2 without documented policies. These are done — just adopt them.

### 🗂️ 5. Create a Vendor Inventory — 30 minutes
- [ ] Open a spreadsheet. Columns: Vendor Name, What They Do, Data Access (Y/N), SOC 2 Report (Y/N), Contract (Y/N)
- [ ] List every SaaS tool and API you use: cloud provider, LLM APIs, email, GitHub, Slack, payments, analytics, monitoring, etc.
- [ ] For critical vendors (handle customer data): note whether they have SOC 2
- **Why:** Vendor management is a SOC 2 requirement. The inventory takes 30 min; auditors love it.

---

## Day 3 (Tuesday)

### 🔑 6. Audit Access & Remove Stale Accounts — 30 minutes
- [ ] GitHub: remove any former collaborators, bots, or test accounts
- [ ] Cloud console: delete unused IAM users/roles/keys
- [ ] SaaS tools: deactivate any accounts that shouldn't exist
- [ ] Check for API keys in code repos: `git log --all -p | grep -i "sk-\|AKIA\|password\|secret"` (or use `trufflehog`/`gitleaks`)
- **Why:** Least-privilege access control is core to SOC 2. Clean house now.

### 📊 7. Enable Cloud Logging — 30 minutes
- [ ] AWS: Enable CloudTrail (all regions). Enable S3 access logging on buckets with customer data.
- [ ] GCP: Ensure audit logs are enabled (they're on by default, but verify retention).
- [ ] Set log retention to minimum 90 days (365 preferred).
- **Why:** You need logs for the entire observation period. Start now so you don't lose evidence.

---

## Day 4 (Wednesday)

### 🛡️ 8. Apply for Vanta/Drata Startup Program — 15 minutes
- [ ] Go to https://www.vanta.com/startups — submit application
- [ ] Also apply to https://drata.com/startup as backup
- [ ] Takes 1–5 business days for approval
- **Why:** The sooner you're on the platform, the sooner evidence collection starts automatically.

### 📝 9. Draft Your System Description — 1 hour
- [ ] One-page document answering:
  - What does AfrexAI do? (AI agents that do X for businesses)
  - What infrastructure do you use? (AWS/GCP, databases, LLM APIs)
  - How does customer data flow? (Client → API → Agent → LLM → Response → Client)
  - What data do you store? Where? How is it encrypted?
  - Who has access to production systems?
- **Why:** The auditor needs this. Writing it now forces you to understand your own security surface.

---

## Day 5 (Thursday)

### ⚡ 10. Set Up Basic Monitoring & Alerts — 30 minutes
- [ ] Uptime monitoring: Use free tier of UptimeRobot, Better Stack, or Checkly
- [ ] Error alerting: Ensure unhandled exceptions alert to Slack/email
- [ ] Cloud spend alerts: Set budget alerts in AWS/GCP to catch anomalies (security signal)
- **Why:** SOC 2 requires monitoring. Free tools get you started immediately.

### 🔄 11. Configure GitHub Branch Protection — 15 minutes
- [ ] Main/production branch: require PR reviews (at least 1 reviewer)
- [ ] Require status checks to pass before merging
- [ ] Disable force-push to main
- [ ] Enable signed commits (nice to have)
- **Why:** Change management control. Auditors will check your Git settings.

---

## End of Week Scorecard

By Friday Feb 20, you should have:

- [x] MFA on all critical systems
- [x] Disk encryption on all devices
- [x] 6 security policies adopted and signed
- [x] Vendor inventory spreadsheet
- [x] Clean access across all systems
- [x] Cloud logging enabled with 90+ day retention
- [x] Compliance platform application submitted
- [x] System description drafted
- [x] Basic monitoring in place
- [x] GitHub branch protection configured

**That's roughly 5–6 hours of work total, and it covers ~30% of your SOC 2 requirements.**

---

## What NOT to Do This Week

- ❌ Don't buy expensive security tools yet — wait for the compliance platform to tell you what's missing
- ❌ Don't hire a consultant yet — this package + a compliance platform gets you 80% there
- ❌ Don't start the audit process — you need the observation period first
- ❌ Don't overcomplicate policies — simple and followed beats comprehensive and ignored
