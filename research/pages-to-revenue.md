# AfrexAI GitHub Pages → Revenue Machine
## Actionable Playbook — February 2026

**Current state:** 22+ pages live at afrexai-cto.github.io. Zero forms, zero analytics, zero lead capture. Good content, no conversion infrastructure.

**Goal:** Turn the site into a lead generation engine that books qualified calls.

---

## 1. SEO Quick Wins

### What's Missing Right Now
The site has decent content but zero SEO infrastructure. Fix these immediately:

#### robots.txt (create at repo root)
```
User-agent: *
Allow: /
Sitemap: https://afrexai-cto.github.io/sitemap.xml
```

#### sitemap.xml
Generate with all 22+ pages. Use [xml-sitemaps.com](https://www.xml-sitemaps.com/) or build manually. Include `<lastmod>` dates. Submit to Google Search Console immediately.

#### Meta Tags (every page needs these)
```html
<meta name="description" content="[unique 155-char description per page]">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://afrexai-cto.github.io/[page]">

<!-- Open Graph -->
<meta property="og:title" content="[page title]">
<meta property="og:description" content="[description]">
<meta property="og:image" content="[social share image]">
<meta property="og:url" content="[canonical URL]">
<meta property="og:type" content="website">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[title]">
<meta name="twitter:description" content="[description]">
```

#### Structured Data (JSON-LD)
Add to every page in `<script type="application/ld+json">`:

**Homepage:** Organization schema
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AfrexAI",
  "url": "https://afrexai-cto.github.io",
  "description": "Managed AI workforce — we build, deploy, and host AI agents that run your operations 24/7.",
  "sameAs": ["https://linkedin.com/company/afrexai"]
}
```

**Pricing page:** Product schema with pricing
**Blog posts:** Article schema with author, datePublished
**Vertical pages (law, construction, SaaS):** Service schema
**FAQ sections:** FAQPage schema (these get rich snippets in Google)

#### Target Keywords
| Keyword Cluster | Target Page | Difficulty |
|---|---|---|
| "AI agents for business" | Homepage | Medium |
| "managed AI agents" / "AI agent service" | Homepage, Managed Agents page | Low-Medium (emerging term) |
| "AI for law firms" / "AI legal billing" | /ai-for-law-firms.html | Medium |
| "AI for construction companies" | /ai-for-construction.html | Low |
| "AI for SaaS operations" | /ai-for-saas.html | Medium |
| "AI workforce management" | Homepage | Medium |
| "AI agent pricing" / "AI agent cost" | Pricing page | Low |
| "AI billing agent" / "AI collections agent" | Agent-specific pages | Low |
| "hire AI agent" / "AI digital worker" | Homepage | Low-Medium |
| "AI vs hiring employee cost" | ROI calculator, blog | Low |

These are **emerging keywords** with low competition — the AI agent space is early. This is your window. Vertical + use-case keywords ("AI billing for law firms") will be easiest to rank for.

#### Immediate Actions
1. **Google Search Console** — verify site ownership, submit sitemap (free, 10 min)
2. **Custom domain** — `afrexai-cto.github.io` hurts SEO credibility. Get `afrexai.com` or similar, point it via GitHub Pages CNAME ($12/year)
3. **Title tags** — every page should have a unique `<title>` with primary keyword
4. **Internal linking** — every vertical page should link to pricing + ROI calculator. Blog posts link to relevant service pages
5. **Page speed** — GitHub Pages is fast by default, but audit with PageSpeed Insights

---

## 2. Lead Capture

### The Problem
Zero forms = zero leads. This is the single highest-impact fix.

### Recommended: Formspree (Best for GitHub Pages)
- **Free tier:** 50 submissions/month (enough to start)
- **Gold plan:** $10/month for 1,000 submissions + integrations
- **Why:** No backend needed, works with plain HTML forms, spam filtering built-in, email notifications, integrates with Zapier/webhooks
- **Alternative:** [Getform.io](https://getform.io/) (250 free submissions/month)

### Implementation
```html
<form action="https://formspree.io/f/{your-form-id}" method="POST">
  <input type="text" name="name" placeholder="Your name" required>
  <input type="email" name="email" placeholder="Work email" required>
  <input type="text" name="company" placeholder="Company name">
  <select name="interest">
    <option value="">What are you interested in?</option>
    <option value="skills">Skills/CMA Package</option>
    <option value="managed">Managed Agents</option>
    <option value="hosted">Fully Hosted Agents</option>
  </select>
  <textarea name="message" placeholder="Tell us about your use case"></textarea>
  <button type="submit">Get Started →</button>
</form>
```

### Which Pages Need Forms (Priority Order)

| Page | Form Type | CTA |
|---|---|---|
| **Pricing page** | Full contact form | "Start Your Free Agent Audit" |
| **Homepage** | Email + company name | "Book a Call" |
| **Each vertical page** (law, construction, SaaS) | Industry-specific form | "See How AI Works for [Industry]" |
| **ROI Calculator** | Email gate the results | "Get Your Full ROI Report" |
| **Blog posts** | Email-only popup/inline | "Get Our AI Deployment Guide" |
| **Every page (sticky)** | Floating CTA button | "Talk to Us" → Calendly link |

### Calendly Integration (Critical)
Embed [Calendly](https://calendly.com/) (free tier) on a `/book-call.html` page. Every CTA should ultimately drive here. This is your conversion event.

### What NOT to Use
- **Google Forms:** Ugly, unprofessional, kills trust
- **Typeform:** Overkill for this stage, expensive ($25/mo+)
- **Netlify Forms:** Only works on Netlify, not GitHub Pages

---

## 3. Analytics

### Recommended: Plausible Analytics
- **Cost:** $9/month (10K pageviews) or self-host free
- **Why over Google Analytics:**
  - Privacy-friendly (no cookie banner needed)
  - Lightweight (~1KB script vs GA's ~45KB)
  - Simple dashboard, you'll actually use it
  - GDPR compliant out of the box
- **Alternative:** [Umami](https://umami.is/) (free, self-hosted) or [Fathom](https://usefathom.com/) ($14/mo)

### Implementation (add to every page, before `</head>`)
```html
<script defer data-domain="afrexai-cto.github.io" src="https://plausible.io/js/script.js"></script>
```

### Also Set Up (Free)
1. **Google Search Console** — see what queries bring impressions/clicks
2. **Microsoft Clarity** (free) — heatmaps + session recordings to see where visitors click/drop off
3. **Plausible goals** — track form submissions, Calendly clicks, pricing page views

### If You Prefer Free
Use **Google Analytics 4** (free) + **Microsoft Clarity** (free). GA4 is more complex but costs nothing:
```html
<!-- GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Key Events to Track
- Form submissions (goal conversions)
- Calendly link clicks
- ROI calculator usage
- Pricing page visits
- Scroll depth on long pages
- Blog → service page navigation

---

## 4. Conversion Optimization

### The Ideal Visitor Journey

```
Organic/Paid Traffic
        ↓
   Landing Page (vertical page or homepage)
        ↓
   Proof/Education (case study, ROI calculator, demo)
        ↓
   Pricing Page (anchor on value, not cost)
        ↓
   Book a Call (Calendly)
        ↓
   Sales Call → Close
```

### Three Main Funnels

**Funnel 1: Industry-Specific (Highest Intent)**
```
Google "AI for law firms" → /ai-for-law-firms.html → ROI Calculator → /pricing.html → /book-call.html
```

**Funnel 2: Problem-Aware**
```
Blog post "How to automate billing recovery" → /ai-for-law-firms.html → /book-call.html
```

**Funnel 3: Solution-Aware**
```
Google "managed AI agents pricing" → /pricing.html → /book-call.html
```

### Page-by-Page Optimization

**Homepage** — Currently too broad. Needs:
- Hero with ONE clear CTA ("Book Your Free AI Audit")
- Social proof section (logos, numbers, testimonials)
- 3 use cases with links to vertical pages
- Sticky header CTA

**Vertical Pages (Law, Construction, SaaS)** — These are your best assets. Each needs:
- Industry-specific pain points in the hero
- ROI numbers specific to that industry
- Embedded form (not just a link)
- Case study or detailed example

**Pricing Page** — Needs:
- Comparison to hiring a human employee (your $2,500/mo vs $6K+/mo salary)
- FAQ section (with FAQPage schema)
- "Most Popular" badge on middle tier
- CTA: "Start with a Free Audit" not "Buy Now"

**ROI Calculator** — Gate the detailed results behind email:
- Let them play with the calculator freely
- "Email me my full ROI report" to get the PDF/detailed breakdown
- This is your best lead magnet

### Quick Wins
- Add a **sticky CTA bar** at the top of every page: "Book a free AI audit → [Calendly link]"
- Add **exit-intent popup** with email capture (use [Sumo](https://sumo.com/) free tier)
- Every page needs a CTA **above the fold**
- Remove any dead-end pages (pages with no CTA)

---

## 5. Content Marketing That Converts

### Blog Posts That Will Rank (Ordered by Impact)

**High intent, low competition (write these first):**
1. "AI Agents vs. Hiring: The Real Cost Comparison for 2026" — targets "AI vs hiring cost"
2. "How We Recovered $1.6M in Unpaid Legal Bills Using AI Agents" — case study, linkable
3. "What Are Managed AI Agents? The Complete Guide" — own the definition
4. "AI Agent Pricing: What Should You Pay in 2026?" — captures pricing queries
5. "5 Operations You Should Automate with AI Agents (Not Chatbots)" — differentiates from chatbot noise

**Industry-specific (long-tail, high conversion):**
6. "AI Billing Recovery for Law Firms: A Practical Guide"
7. "How Construction Companies Use AI for Safety Compliance"
8. "AI-Powered Collections: How to Recover AR Without Hiring"
9. "SaaS Customer Onboarding: How AI Agents Reduce Churn by 30%"

**Comparison/alternative posts (capture competitor traffic):**
10. "AfrexAI vs. Hiring a VA: Which Is Right for Your Business?"
11. "Best AI Agent Platforms 2026: Managed vs. DIY"
12. "Smith.ai vs. AfrexAI: AI Receptionist vs. Managed AI Workforce"

### Content Strategy
- **Publish cadence:** 2 posts/month minimum
- **Each post must have:** a CTA to book a call or download a lead magnet
- **Internal linking:** every blog post links to 2-3 service pages
- **Promotion:** share on LinkedIn (founder's personal account gets 5-10x more reach than company page)

---

## 6. Social Proof (With No Paying Customers Yet)

### Strategy: Build Proof Through Free Value

**1. Beta Program (Start This Week)**
- Offer **3-5 free AI agent pilots** (2-week trial) to companies in your target verticals
- Requirements: they provide a testimonial + case study permission
- Page: `/beta-program.html` with application form
- Messaging: "We're selecting 5 companies for our managed AI agent beta. Zero cost. You keep the results."

**2. Free AI Audit**
- Offer free 30-min "AI Readiness Audit" calls
- Even if they don't buy, you get:
  - Testimonial quotes about the audit itself
  - Pipeline for later
  - Content ideas from real conversations

**3. Use Your Own Numbers**
- You already claim "$1.6M recovered" and "9 agents running" — put these front and center
- Create a detailed case study page for the law firm recovery story
- Turn internal metrics into social proof: "368 companies in our CRM" → "Trusted by 300+ companies evaluating AI"

**4. Logos**
- If you've done ANY work for ANY company, ask to use their logo
- Even "companies we've consulted with" counts

**5. Founder Credibility**
- Add an `/about.html` or `/team.html` page
- Founder's LinkedIn profile, background, why this company exists
- People buy from people at this stage, not brands

**6. Third-Party Proof**
- Get listed on [G2](https://www.g2.com/), [Product Hunt](https://www.producthunt.com/), [There's An AI For That](https://theresanaiforthat.com/)
- Write guest posts on industry blogs
- Get quoted in AI newsletters

---

## 7. Paid Acquisition

### Is It Worth It at $1,500-$12K/mo Contract Value?

**Yes, but carefully.** At these price points, you can afford $500-$2,000 CAC and still be profitable.

### Google Ads
- **Budget:** Start with $1,500/month
- **Target keywords:** "managed AI agents," "AI agents for law firms," "AI billing automation," "hire AI agent"
- **Expected CPC:** $5-15 for AI/SaaS keywords
- **Expected conversion rate:** 2-5% landing page → form fill
- **Math:** $1,500 budget ÷ $10 avg CPC = 150 clicks → 5-8 leads → 1-2 qualified calls → potentially 1 close at $2,500-$12K/mo
- **CAC:** ~$1,500 for a customer paying $2,500+/mo = payback in month 1
- **Recommendation:** Worth it. Start with exact match + phrase match on high-intent keywords. Use dedicated landing pages (not homepage).

### LinkedIn Ads
- **Budget:** $2,000/month minimum (LinkedIn is expensive)
- **CPC:** $8-15 for B2B targeting
- **Best format:** Sponsored content (thought leadership posts from founder account)
- **Targeting:** Job titles (COO, VP Operations, Managing Partner) + company size (50-500) + industries (legal, construction, SaaS)
- **Recommendation:** Better for brand awareness than direct conversion. Start with organic LinkedIn posts first — if those work, amplify with ads.

### Better ROI Channels First
1. **LinkedIn organic** (free) — founder posts 3x/week about AI operations, behind-the-scenes, results
2. **Cold email** (low cost) — use Apollo.io ($49/mo) to find ops leaders, send them to ROI calculator
3. **Google Ads** (start at $1,500/mo) — capture high-intent search
4. **LinkedIn Ads** (defer until $5K+/mo marketing budget)

---

## 8. Referral / Partnership Program

### Yes, Build These Pages

**Partner Program (`/partners.html`)**
- Target: IT consultants, MSPs, fractional COOs, business coaches
- Offer: 15-20% recurring commission on referred clients
- They send clients → you close and manage → they get paid monthly
- This is high-leverage for your price points

**What the page needs:**
- Clear commission structure
- "How it works" in 3 steps
- Application form (Formspree)
- Partner portal promise (even if it's just a shared Google Sheet initially)

**Affiliate Program**
- Too early. Affiliate programs work at scale with self-serve products
- Your service is high-touch and sales-led — partner/referral is better

**Integration Partners**
- List tools you integrate with (CRMs, billing systems, project management)
- Each integration = a landing page that ranks for "[tool] + AI automation"
- Example: "Clio AI Integration" for law firms, "Procore AI Automation" for construction

---

## 9. Email Capture + Nurture

### Lead Magnets (Create These)

| Lead Magnet | Target Audience | Delivery |
|---|---|---|
| "AI Readiness Scorecard" (interactive quiz) | All visitors | Email-gated results |
| "The ROI of AI Agents: 2026 Benchmark Report" (PDF) | Decision makers | Download after email |
| "AI Audit Checklist: 10 Operations to Automate First" | Ops leaders | Download after email |
| "Case Study: $1.6M Recovered with AI Billing Agents" (PDF) | Law firms | Download after email |

### Email Platform
- **Recommended:** [Brevo (formerly Sendinblue)](https://www.brevo.com/) — free up to 300 emails/day, includes automation
- **Alternative:** [Mailchimp](https://mailchimp.com/) free tier (500 contacts) or [ConvertKit](https://convertkit.com/) ($15/mo, better for sequences)
- **Integration:** Formspree webhook → Zapier → email platform (or use Brevo's built-in forms)

### Email Nurture Sequence (7 emails over 14 days)

```
Day 0: "Here's your [lead magnet]" + intro to AfrexAI
Day 2: "How AI agents are different from chatbots" (education)
Day 4: "Case study: $1.6M recovered" (proof)
Day 7: "[Industry]-specific AI use cases" (relevance)
Day 9: "What a managed AI agent costs vs. hiring" (ROI)
Day 11: "Here's what your first 30 days look like" (reduce friction)
Day 14: "Book your free AI audit — limited spots" (urgency + CTA)
```

### Implementation Steps
1. Sign up for Brevo (free)
2. Create lead magnet PDFs (use Canva, 1-2 hours each)
3. Set up Formspree → Zapier → Brevo automation
4. Build `/resources.html` page with all lead magnets
5. Add inline email capture to every blog post
6. Add exit-intent popup site-wide

---

## 10. Competitive Analysis

### How Competitors Structure for Conversion

| Element | Sierra.ai | Lindy.ai | 11x.ai | Smith.ai | **AfrexAI (Current)** |
|---|---|---|---|---|---|
| Custom domain | ✅ | ✅ | ✅ | ✅ | ❌ github.io |
| Clear hero CTA | ✅ "Talk to us" | ✅ "Try free" | ✅ "Hire [Agent]" | ✅ "Get started" | ⚠️ No CTA button |
| Demo/free trial | ✅ Demo request | ✅ 7-day free trial | ✅ Demo | ✅ Free consultation | ❌ Nothing |
| Social proof | ✅ Customer logos + metrics | ✅ Testimonials | ✅ Enterprise logos | ✅ Reviews + ratings | ⚠️ Numbers but no logos/testimonials |
| Lead capture forms | ✅ Multiple | ✅ Sign-up flow | ✅ Contact + demo | ✅ Every page | ❌ Zero forms |
| Analytics | ✅ | ✅ | ✅ | ✅ | ❌ None |
| Blog/content | ✅ Active | ✅ Active | ✅ Active | ✅ Active | ⚠️ Exists but no SEO |
| Pricing on site | ❌ Enterprise sales | ✅ Transparent | ❌ Sales-led | ✅ Transparent | ✅ Transparent (good!) |
| Named AI agents | ❌ | ❌ | ✅ Alice, Julian | ❌ | ❌ |

### Key Takeaways from Competitors

**Sierra.ai (enterprise, $4.5B valuation)**
- Leads with outcomes ("Transform your customer experience")
- Heavy on enterprise social proof (logos)
- No pricing = pure enterprise sales motion
- **Lesson:** AfrexAI shouldn't compete here. Your transparent pricing is an advantage for SMBs.

**Lindy.ai (self-serve, ~$30-200/mo)**
- Leads with personal pain ("You're drowning in busywork")
- 7-day free trial = low-friction entry
- Testimonials section prominent
- **Lesson:** They own the low end. Your managed service is the premium alternative.

**11x.ai (mid-market, named agents)**
- "Hire Alice" / "Hire Julian" — personifies AI agents with names
- **Lesson:** Consider naming your agents. "Hire Kai, your AI billing agent" is more compelling than "Billing Agent."

**Smith.ai (SMB, $240-600/mo)**
- Closest competitor for the law firm vertical
- Heavy on reviews (4.8 stars, 100+ reviews on G2/Clutch)
- Transparent pricing with feature comparison tables
- Live chat on every page
- **Lesson:** Smith.ai is your direct competitor for law firms. Differentiate on "full AI workforce" vs "AI receptionist."

### AfrexAI's Competitive Advantages (Lean Into These)
1. **Transparent pricing** — Sierra and 11x hide it. You show it. This builds trust.
2. **Fully managed** — Lindy is DIY. You do it all. That's worth paying for.
3. **Industry-specific** — vertical pages for law, construction, SaaS. Most competitors are horizontal.
4. **Real metrics** — $1.6M recovered, 9 agents running, 70-85% margins. Use these everywhere.

---

## Priority Implementation Roadmap

### Week 1 (Critical — Do This Now)
- [ ] Add Formspree forms to pricing page, homepage, and vertical pages
- [ ] Set up Google Search Console + submit sitemap
- [ ] Add Plausible or GA4 to all pages
- [ ] Add Calendly `/book-call.html` page
- [ ] Add meta descriptions + OG tags to all pages
- [ ] Add sticky "Book a Free AI Audit" CTA bar to all pages

### Week 2
- [ ] Create `/beta-program.html` with application form
- [ ] Set up Brevo email account + first welcome sequence
- [ ] Create 1 lead magnet PDF (AI Audit Checklist)
- [ ] Add structured data (JSON-LD) to all pages
- [ ] Create robots.txt + sitemap.xml

### Week 3-4
- [ ] Write + publish 2 high-intent blog posts
- [ ] Create `/partners.html` page
- [ ] Add Microsoft Clarity for heatmaps
- [ ] Set up exit-intent popup with email capture
- [ ] Get a custom domain and redirect github.io

### Month 2
- [ ] Launch Google Ads ($1,500/mo budget)
- [ ] Start LinkedIn content cadence (3x/week)
- [ ] Create remaining lead magnets
- [ ] Build email nurture sequence (7 emails)
- [ ] Create comparison/alternative blog posts
- [ ] Get listed on G2 / Product Hunt

### Month 3+
- [ ] Analyze analytics data, optimize top pages
- [ ] A/B test headlines and CTAs
- [ ] Scale Google Ads based on CAC data
- [ ] Develop case studies from beta program
- [ ] Consider LinkedIn Ads if budget allows

---

## Budget Summary

| Item | Monthly Cost | Priority |
|---|---|---|
| Formspree (Gold) | $10 | Week 1 |
| Plausible Analytics | $9 | Week 1 |
| Custom Domain | $1 (annual $12) | Week 2 |
| Brevo (email) | $0 (free tier) | Week 2 |
| Calendly | $0 (free tier) | Week 1 |
| Microsoft Clarity | $0 | Week 3 |
| Google Ads | $1,500 | Month 2 |
| **Total Month 1** | **~$20/mo** | |
| **Total Month 2+** | **~$1,520/mo** | |

The site has good content and real differentiators. The problem is purely conversion infrastructure — forms, analytics, CTAs, and lead nurture. Fix that and the 22 pages become a revenue engine.
