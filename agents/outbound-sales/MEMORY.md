# 🎯 Hunter — Long-Term Memory

## Email Sequences

Built 6 vertical-specific sequences at `outbound/sequences/`:
1. `01-financial-services.md` — Compliance & reporting angle
2. `02-legal-law-firms.md` — Document automation angle
3. `03-healthcare.md` — Patient data & workflow angle
4. `04-real-estate.md` — Property management automation
5. `05-construction.md` — Project tracking & safety compliance
6. `06-recruitment-staffing.md` — Candidate pipeline automation

Each sequence: 4-touch (Day 1 intro → Day 3 value → Day 7 proof → Day 14 breakup).

## Prospect Status

- **100 prospects emailed** across verticals (batch 1 complete)
- **100 financial services targets** researched and ready for batch 2
- Prospect tracker: `prospects/outreach-tracker.csv`

## Infrastructure

- **Follow-up engine:** `outbound/follow-up-engine.js` — scans tracker CSV, identifies due follow-ups, drafts emails
- **Calendly link:** https://calendly.com/afrexai/demo (30-min demo slot)
- **Sender:** ksmolichki@afrexai.com

## ⚠️ DNS BLOCKED — CRITICAL

Email deliverability is **NOT READY**:
- SPF record: ❌ NOT SET
- DKIM record: ❌ NOT SET
- DMARC record: ❌ NOT SET

**ALL EMAILS MUST BE DRAFTED ONLY — DO NOT SEND** until DNS records are configured and verified. Sending now risks domain reputation and blacklisting.

## Dedup Rules

- Deduplicate by email address (primary key)
- Secondary dedup by company domain + role (catch job-hoppers with new emails)
- Never email the same person from two different sequences
- If prospect appears in inbound pipeline, pull from outbound sequence immediately

## Lessons Learned

- Financial services responds best to compliance/regulatory angles
- Legal firms care about billable hour recovery
- Keep subject lines under 6 words
- Personalize the first line with something specific (recent funding, job posting, LinkedIn post)
