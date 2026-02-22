# Customer Onboarding Checklist

**Version:** 1.0 | **Last Updated:** 2026-02-22

---

## 10-Step Onboarding Flow

Typical timeline: **Day 0 to Day 90 (ongoing)**

---

### Step 1: Stripe Subscription ✦ Day 0

- [ ] Customer selects tier (Single Agent $1,500/mo or Full Swarm $5,000/mo)
- [ ] Create Stripe subscription (monthly billing, card on file)
- [ ] Apply introductory pricing if applicable (50% off first 3 months)
- [ ] Send payment confirmation email
- [ ] Create customer record in tracking spreadsheet
- [ ] Create customer directory: `customers/<customer-slug>/`

**Owner:** Sales / Ops
**Tools:** Stripe Dashboard, Google Sheets

---

### Step 2: Kickoff Call ✦ Day 1-3

- [ ] Schedule 60-minute kickoff via Calendly
- [ ] Agenda:
  - Understand customer's business and goals
  - Identify key workflows to automate
  - Determine integrations needed (email, CRM, Slack, etc.)
  - Agree on agent persona and tone
  - Set success metrics (KPIs)
  - Discuss communication preferences
- [ ] Record call notes in `customers/<slug>/kickoff-notes.md`
- [ ] Send follow-up email with agreed scope

**Owner:** Consultant / Account Lead
**Duration:** 60 minutes

---

### Step 3: Config Generation ✦ Day 3-5

- [ ] Create SOUL.md — agent persona tailored to customer's brand
- [ ] Create USER.md — customer profile and preferences
- [ ] Create AGENTS.md — workspace rules and conventions
- [ ] Create TOOLS.md — integration-specific notes
- [ ] Configure agent schedules (cron timing)
- [ ] Write integration configs (which APIs, what permissions)
- [ ] Create op.env with 1Password references for all secrets
- [ ] Internal review of configs (second pair of eyes)

**Owner:** Technical Lead
**Deliverable:** Complete config directory ready for deployment

---

### Step 4: VPS Deployment ✦ Day 5-6

- [ ] Run `deploy-customer.sh` or follow manual deployment runbook
- [ ] Verify server is running and healthy
- [ ] Confirm SSH access works
- [ ] Setup DNS: `<slug>.aaas.afrexai.com`
- [ ] Install SSL certificate
- [ ] Add UptimeRobot monitor
- [ ] Record server details in customer directory

**Owner:** DevOps / Technical Lead
**Reference:** `deployment.md`

---

### Step 5: Connect Integrations ✦ Day 6-8

- [ ] Gmail / Google Workspace — OAuth connection
- [ ] Slack — Bot token installed in customer's workspace
- [ ] CRM — API key or OAuth (HubSpot, Salesforce, etc.)
- [ ] Calendar — Calendly or Google Calendar access
- [ ] Any custom integrations (Notion, Airtable, QuickBooks, etc.)
- [ ] Test each integration with a simple read/write operation
- [ ] Document all connected integrations in `integrations.md`

**Owner:** Technical Lead + Customer (for OAuth approvals)
**Note:** Customer will need to grant permissions — send clear instructions

---

### Step 6: 48-Hour Burn-In ✦ Day 8-10

- [ ] Run agent through 2 full daily cycles (morning + evening)
- [ ] Monitor logs for errors or unexpected behaviour
- [ ] Review all agent outputs for quality and accuracy
- [ ] Check resource usage (CPU, RAM, disk)
- [ ] Verify cron schedules fire correctly
- [ ] Fix any issues found
- [ ] Document burn-in results in `customers/<slug>/burn-in-report.md`

**Owner:** Technical Lead
**Success Criteria:** 2 clean cycles with no errors, outputs are relevant and correct

---

### Step 7: Go-Live Email ✦ Day 10

- [ ] Send go-live email to customer with:
  - Confirmation that agent is live and running
  - Summary of what the agent does and when
  - How to reach support (email, Slack channel)
  - What to expect in the first week
  - Link to status page (if available)
- [ ] Update customer status to "Active" in tracking sheet
- [ ] Post in #aaas-customers Slack channel

**Owner:** Account Lead
**Template:** `templates/go-live-email.md` (create after first customer)

---

### Step 8: Day 7 Check-In ✦ Day 17

- [ ] Schedule 30-minute check-in call
- [ ] Review agent performance with customer
- [ ] Gather feedback on outputs and behaviour
- [ ] Identify any adjustments needed (persona, timing, integrations)
- [ ] Make config updates if required
- [ ] Document feedback in `customers/<slug>/feedback/week-1.md`

**Owner:** Account Lead
**Duration:** 30 minutes

---

### Step 9: Monthly Report ✦ Day 30, then Monthly

- [ ] Generate SLA uptime report from UptimeRobot
- [ ] Compile agent activity summary:
  - Tasks executed
  - Key outputs/achievements
  - Any incidents and resolutions
- [ ] Calculate ROI metrics where possible
- [ ] Send report to customer
- [ ] File in `customers/<slug>/reports/YYYY-MM.md`

**Owner:** Ops + Account Lead
**Cadence:** Monthly, within first 5 business days of the month

---

### Step 10: Quarterly Tune-Up ✦ Day 90, then Quarterly

- [ ] Schedule 45-minute strategy review
- [ ] Analyse 3 months of performance data
- [ ] Identify optimization opportunities:
  - New workflows to automate
  - Agent persona refinements
  - Integration additions/changes
  - Upsell to higher tier if appropriate
- [ ] Update SOUL.md and configs as needed
- [ ] Redeploy updated configs
- [ ] Set goals for next quarter
- [ ] Document in `customers/<slug>/quarterly/Q<N>-review.md`

**Owner:** Consultant + Account Lead
**Duration:** 45 minutes

---

## Timeline Summary

```
Day 0     ── Stripe subscription
Day 1-3   ── Kickoff call
Day 3-5   ── Config generation
Day 5-6   ── VPS deployment
Day 6-8   ── Connect integrations
Day 8-10  ── 48-hour burn-in
Day 10    ── Go-live email
Day 17    ── Day 7 check-in
Day 30    ── First monthly report
Day 90    ── First quarterly tune-up
Ongoing   ── Monthly reports + quarterly reviews
```

## Customer Health Scoring

Track each customer monthly:

| Signal | Green | Yellow | Red |
|--------|-------|--------|-----|
| Uptime | > 99.5% | 98-99.5% | < 98% |
| Agent success rate | > 90% | 75-90% | < 75% |
| Customer responsiveness | Replies < 24h | Replies < 72h | No replies |
| Support tickets | 0-1/month | 2-3/month | 4+/month |
| Renewal likelihood | Confirmed/happy | Neutral | At risk |
