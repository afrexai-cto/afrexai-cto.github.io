# AaaS Customer Onboarding Checklist

## Pre-Deployment (Day 1-2)
- [ ] Signed agreement received
- [ ] First payment processed (Stripe)
- [ ] Onboarding call scheduled (15 min)
- [ ] Customer fills out intake form: current tools, pain points, priority automations
- [ ] VPS provisioned (Hetzner CX31)
- [ ] OpenClaw installed + base config

## Configuration (Day 3-5)
- [ ] Agent personas configured per customer's industry/needs
- [ ] Tool integrations connected (CRM, email, calendar, etc.)
- [ ] Cron jobs set up (daily briefs, monitoring, alerts)
- [ ] Memory files seeded with customer context
- [ ] Test scenarios run — all agents responding correctly

## Go-Live (Day 6-7)
- [ ] Customer walkthrough call (30 min) — show agents in action
- [ ] Monitoring alerts configured (SLA: 99.5% uptime)
- [ ] Customer Telegram/Slack channel connected
- [ ] First daily briefing delivered
- [ ] "Week 1 Win" documented — one measurable result to share

## Ongoing (Monthly)
- [ ] Weekly performance report sent
- [ ] Monthly review call (15 min)
- [ ] Agent configs updated based on feedback
- [ ] New automations added as identified
- [ ] Invoice auto-sent via Stripe

## Escalation
- Customer issues: respond within 2 hours during business hours
- System down: respond within 30 minutes, restore within 4 hours
- Feature requests: logged, reviewed weekly, deployed if <2 hours effort
