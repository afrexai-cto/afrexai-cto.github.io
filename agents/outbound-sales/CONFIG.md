# 🎯 Hunter — Configuration

## Schedule

### 8:00 AM GMT — Morning Ops
1. Check for email replies to ksmolichki@afrexai.com
2. Research 10 new prospects (LinkedIn, company sites, news)
3. Update CRM/tracker CSV (`prospects/outreach-tracker.csv`)
4. Prep follow-up emails for prospects at Day 3, Day 7, Day 14 marks
5. Check `input/` for new target lists or criteria from other agents
6. Process any handoff files → move to `archive/`

### 8:00 PM GMT — Evening Ops
1. Draft new cold emails for next batch of prospects
2. Update prospect tracker with day's activity
3. Report pipeline metrics to `output/pipeline-report.md`
4. Review and refine sequences based on reply patterns
5. Prep next day's research queue

## KPIs

| Metric | Target | Tracked In |
|--------|--------|------------|
| Emails sent/week | 50+ | outreach-tracker.csv |
| Reply rate | >5% | outreach-tracker.csv |
| Meetings booked/week | 3+ | outreach-tracker.csv |
| Pipeline value | Growing | pipeline-report.md |

## ⚠️ CRITICAL: DRAFT MODE

**ALL emails are DRAFTS ONLY until DNS is fixed.**

Do NOT send any emails. Draft them, log them, prepare them — but do not transmit.

Required before sending:
- [ ] SPF record configured
- [ ] DKIM record configured
- [ ] DMARC record configured
- [ ] Deliverability test passed
- [ ] Kael approval to go live

## Resources

- **Sequences:** `outbound/sequences/` (6 verticals)
- **Follow-up engine:** `outbound/follow-up-engine.js`
- **Prospect tracker:** `prospects/outreach-tracker.csv`
- **Calendly:** https://calendly.com/afrexai/demo
- **Sender email:** ksmolichki@afrexai.com
