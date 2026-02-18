# Email Deliverability Guide — AfrexAI Cold Outreach

**Date:** 2026-02-13
**Domain:** afrexai.com
**Sender:** ksmolichki@afrexai.com
**Provider:** Google Workspace (confirmed via MX records)

---

## 1. DNS Audit Results

### ✅ MX Records — OK
```
1   aspmx.l.google.com
5   alt1.aspmx.l.google.com
5   alt2.aspmx.l.google.com
10  alt3.aspmx.l.google.com
10  alt4.aspmx.l.google.com
```
Standard Google Workspace setup. No issues.

### 🔴 SPF Record — MISSING
No SPF record found. This is **critical**. Without SPF, receiving servers can't verify that Google is authorized to send on behalf of afrexai.com. Emails will likely land in spam or be rejected.

**Fix — Add this TXT record to afrexai.com DNS:**
```
v=spf1 include:_spf.google.com ~all
```
Use `~all` (softfail) initially. Once confirmed working, tighten to `-all` (hardfail).

### 🔴 DKIM Record — MISSING
No DKIM signatures found at any common selectors (default, google, selector1, selector2, mail, k1).

**Fix:**
1. Go to **Google Admin Console** → Apps → Google Workspace → Gmail → Authenticate email
2. Click **Generate new record** for afrexai.com
3. Google will give you a selector (usually `google`) and a TXT record value
4. Add the TXT record at `google._domainkey.afrexai.com`
5. Go back to Admin Console and click **Start authentication**

### 🔴 DMARC Record — MISSING
No DMARC record at `_dmarc.afrexai.com`.

**Fix — Add this TXT record at `_dmarc.afrexai.com`:**
```
v=DMARC1; p=none; rua=mailto:dmarc-reports@afrexai.com; pct=100
```
Start with `p=none` (monitor mode) to collect reports. After 2-4 weeks of clean data, move to `p=quarantine`, then eventually `p=reject`.

### ⚠️ Summary

| Record | Status | Priority |
|--------|--------|----------|
| MX     | ✅ OK  | —        |
| SPF    | 🔴 Missing | **Do TODAY** |
| DKIM   | 🔴 Missing | **Do TODAY** |
| DMARC  | 🔴 Missing | **Do TODAY** |

**Without SPF, DKIM, and DMARC, your emails are almost certainly hitting spam.** The ~100 emails already sent likely had poor deliverability. Fix these records before sending anything else.

---

## 2. Immediate Action Plan

### Today (before any more emails go out):
1. **Add SPF record** (5 min, DNS only)
2. **Enable DKIM in Google Admin** (10 min)
3. **Add DMARC record** (5 min, DNS only)
4. **Wait 24-48h** for DNS propagation
5. **Verify** with [mail-tester.com](https://www.mail-tester.com) — send a test email and aim for 9+/10

### This week:
6. Start email warming (see below)
7. Set up deliverability monitoring

---

## 3. Email Warming Strategy

### Why This Is Urgent
You sent ~100 emails from a new-ish domain **without SPF/DKIM/DMARC**. This likely damaged your sender reputation. You need to rehabilitate it.

### Warming Plan (after DNS fixes)

**Week 1-2: Recovery mode**
- Send **0 cold emails**
- Only warm emails (via warming tool) + normal business correspondence
- 10-20 warm emails/day, gradually increasing

**Week 3-4: Gentle ramp**
- 5-10 cold emails/day maximum
- Continue warming (20-30/day)
- Monitor bounce rate and spam complaints

**Week 5-8: Scale up**
- 15-25 cold emails/day
- Continue warming (20-30/day in background)
- Add second mailbox if needed

**Week 9+: Cruise**
- 30-50 cold emails/day per mailbox
- Never stop warming entirely (keep 10-15/day forever)

### Key Rules
- **Never exceed 50 cold emails/day from a single mailbox**
- Keep bounce rate under 3%
- If replies drop or bounces spike, pull back immediately
- Warming is not optional — it's permanent infrastructure

---

## 4. Recommended Warming Tools

| Tool | Price | Notes |
|------|-------|-------|
| **Instantly.ai** | $30/mo | Best for cold email — warming + sending + analytics in one. Top pick. |
| **Lemwarm** (by Lemlist) | $29/mo (included with Lemlist) | Good if using Lemlist for campaigns |
| **Warmbox** | $15/mo | Budget option, warming only |
| **Mailreach** | $25/mo | Good reputation monitoring + warming |
| **Smartlead** | $39/mo | Warming + sending, good for multi-mailbox |

### Recommendation
**Use Instantly.ai or Smartlead.** They combine warming + cold email sending + analytics. You don't want separate tools for each. Connect your Google Workspace account via App Password (not OAuth for cold tools).

---

## 5. Multiple Mailbox Strategy

**Yes, absolutely use multiple mailboxes.** Here's why and how:

### Setup
Create 2-3 sending addresses on afrexai.com:
- `ksmolichki@afrexai.com` (primary, already exists)
- `kalin@afrexai.com` (alias or separate account)
- `k.smolichki@afrexai.com` (variation)

### Why Multiple
- Distributes sending volume (each mailbox stays under radar)
- If one gets flagged, others keep working
- Allows A/B testing of approaches
- Industry standard for cold outreach at scale

### Rules
- Each mailbox needs its own warming
- Each mailbox maxes at 30-50 cold emails/day
- Rotate mailboxes across campaigns
- All mailboxes benefit from the same SPF/DKIM/DMARC (domain-level)

### Optional: Secondary Domain
For extra protection, consider a secondary domain (e.g., `afrexai.io` or `getafrex.com`) that redirects to afrexai.com. This protects your primary domain reputation. Warm it for 2-4 weeks before use.

---

## 6. Daily Sending Limits

| Mailbox Age | Cold Emails/Day | Warm Emails/Day | Total |
|-------------|----------------|-----------------|-------|
| Week 1-2 | 0 | 10-20 | 10-20 |
| Week 3-4 | 5-10 | 20-30 | 25-40 |
| Week 5-8 | 15-25 | 20-30 | 35-55 |
| Week 9+ | 30-50 | 10-15 | 40-65 |

### Hard Limits (Google Workspace)
- Google Workspace: 2,000 emails/day per account (hard limit)
- **Practical safe limit for cold: 50/day per mailbox**
- Never send more than 100 total emails (cold + warm + regular) per mailbox per day
- Space emails out — don't blast 50 at 9am. Use 1-3 min random intervals over 6-8 hours

### Sending Window
- Send between **8am-6pm recipient's local timezone**
- Best days: Tuesday, Wednesday, Thursday
- Avoid Monday mornings and Friday afternoons

---

## 7. Monitoring Deliverability

### Tools
| Tool | What It Does | Cost |
|------|-------------|------|
| [mail-tester.com](https://www.mail-tester.com) | One-off email score check | Free (3/day) |
| [MXToolbox](https://mxtoolbox.com) | DNS/blacklist monitoring | Free |
| Google Postmaster Tools | Gmail-specific reputation data | Free |
| Instantly.ai / Smartlead | Built-in deliverability dashboard | Included |
| [GlockApps](https://glockapps.com) | Inbox placement testing | $59/mo |

### Key Metrics to Track
- **Open rate:** Healthy = 40-60% for cold email. Below 20% = likely spam folder
- **Bounce rate:** Keep under 3%. Above 5% = stop and clean your list
- **Reply rate:** 5-15% is good for cold email
- **Spam complaints:** Must stay under 0.1%
- **Blacklist status:** Check weekly on MXToolbox

### Set Up Google Postmaster Tools
1. Go to [postmaster.google.com](https://postmaster.google.com)
2. Add and verify afrexai.com
3. Monitor spam rate, IP reputation, domain reputation, authentication

---

## 8. Subject Line Best Practices

### Rules for Cold Email Subjects
- **Short:** 3-7 words. Under 50 characters.
- **Lowercase or sentence case** — no Title Case, no ALL CAPS
- **No spam triggers:** avoid "free", "guaranteed", "limited time", "act now", exclamation marks
- **Personal:** Use their name, company, or something specific
- **Curiosity-driven:** Make them want to open without being clickbait

### Examples That Work
```
quick question about {company}
{first_name} — saw your {recent thing}
idea for {company}'s AI strategy
{mutual connection} suggested I reach out
thought on {specific pain point}
```

### What to Avoid
```
❌ FREE AI Solution For Your Business!!!
❌ Exclusive Offer Inside
❌ Re: Our conversation (if you never talked)
❌ Anything longer than 7 words
❌ Generic "partnership opportunity"
```

---

## 9. Follow-Up Sequence Design

### Recommended Sequence (5 touches)

| Touch | Timing | Purpose |
|-------|--------|---------|
| **Email 1** | Day 0 | Initial outreach — value prop, specific to them |
| **Email 2** | Day 3 | Follow up — different angle or add value (case study, insight) |
| **Email 3** | Day 7 | Bump — short, "did you see my note?" + one new point |
| **Email 4** | Day 14 | Breakup tease — "I'll assume timing isn't right, but..." |
| **Email 5** | Day 28 | Final breakup — clean close, leave door open |

### Rules
- **All follow-ups in the same thread** (reply to your own email)
- Keep follow-ups shorter than the original
- Each email should add something new (don't just repeat)
- Email 4-5 can be 2-3 sentences max
- **Never more than 5 emails** without a reply
- If they reply negatively, stop immediately and thank them
- If they open but don't reply after email 3, the offer isn't compelling enough — revise

### Follow-Up Templates

**Email 2 (Day 3):**
> Hey {first_name}, following up on my note — wanted to share that we helped {similar company} achieve {specific result}. Would that kind of outcome be relevant for {company}?

**Email 3 (Day 7):**
> {first_name} — just bumping this up. Happy to share more details or jump on a quick 15-min call if easier. Either way, no pressure.

**Email 5 (Day 28):**
> Hey {first_name}, I'll assume the timing isn't right and won't keep filling your inbox. If AI automation becomes a priority down the line, I'm here. Best of luck with everything at {company}.

---

## 10. Checklist — Do This In Order

- [ ] **Add SPF record** to afrexai.com DNS
- [ ] **Generate and add DKIM** via Google Admin Console
- [ ] **Add DMARC record** to afrexai.com DNS
- [ ] **Wait 24-48h** for propagation
- [ ] **Test** with mail-tester.com (aim for 9+/10)
- [ ] **Sign up for Instantly.ai or Smartlead**
- [ ] **Connect mailbox and start warming** (2 weeks minimum before cold sending)
- [ ] **Set up Google Postmaster Tools**
- [ ] **Create 1-2 additional mailboxes** on afrexai.com
- [ ] **Warm all mailboxes** simultaneously
- [ ] **Resume cold outreach** at week 3, starting with 5-10/day
- [ ] **Monitor** open rates, bounces, spam complaints weekly

---

## ⚠️ Critical Warning

**The ~100 emails already sent without authentication records likely damaged your domain reputation with major providers (Gmail, Outlook, Yahoo).** The warming period is not optional — it's recovery. Be patient. Sending more cold email now will make things worse. Fix the DNS, warm for 2 weeks, then resume slowly.
