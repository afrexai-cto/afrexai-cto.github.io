#!/usr/bin/env python3
"""Batch create and save 96 cold email drafts to Gmail."""
import imaplib, os, sys, json, csv, time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

IMAP_HOST = "imap.gmail.com"
EMAIL = "ksmolichki@afrexai.com"
PASSWORD = os.environ["GMAIL_BUSINESS_APP_PASSWORD"]

SIGNATURE = '<p>Learn more and book a call at <a href="https://afrexai.com">afrexai.com</a> — and see our AI agent skills storefront <a href="https://afrexai-cto.github.io/context-packs/">here</a>.</p>'

SIGN_OFF = '<p>Best,<br>Kalin Smolichki<br>CTO, AfrexAI</p>'
CHEERS_OFF = '<p>Cheers,<br>Kalin Smolichki<br>CTO, AfrexAI</p>'

prospects = [
    # ── AGENCIES (UK) ──
    {
        "company": "Passion Digital",
        "contact": "Mike Grindy",
        "email": "mike@passion.digital",
        "industry": "Digital Marketing Agency",
        "employees": "25",
        "subject": "What if Passion Digital's 25 people could output like 60?",
        "body": f"""<p>Hi Mike,</p>
<p>Building Passion Digital from scratch in 2009 and growing it into one of London's most respected search marketing agencies is seriously impressive. I can tell from the award wins and the breadth of your service offering — SEO, PPC, social, digital PR — that you're running a tight ship.</p>
<p>But here's what I keep hearing from agency founders like you: the gap between what clients want and what a 25-person team can deliver keeps widening. More campaigns, more reporting, more content — and hiring isn't always the answer.</p>
<p>At AfrexAI, we build AI agent workforces that handle the repetitive 60% — drafting client reports, monitoring campaign metrics, producing first-pass content, triaging SEO audits. Your team focuses on strategy and relationships. The agents handle the grind.</p>
<p>Would love to show you what this looks like in practice. Got 30 minutes for a call?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Impression Digital",
        "contact": "Aaron Dicks",
        "email": "aaron@impressiondigital.com",
        "industry": "Digital Marketing Agency",
        "employees": "80",
        "subject": "Impression's growth is amazing — but is your team keeping up?",
        "body": f"""<p>Hi Aaron,</p>
<p>What you and Tom have built with Impression is remarkable — from a Nottingham startup to one of the UK's fastest-growing digital agencies, working with Clarins, Virgin Wines, and Funky Pigeon. The multi-award wins speak for themselves.</p>
<p>At 80+ people, though, I imagine the operational overhead is real. Client reporting across SEO, PPC, and digital PR. Campaign performance monitoring. Content production at scale. Every new client means more of the same.</p>
<p>What if AI agents handled the operational heavy lifting? At AfrexAI, we build autonomous agent workforces — think AI that compiles weekly client performance reports, flags campaign anomalies, drafts content briefs, and keeps your team focused on the strategic work that wins awards.</p>
<p>Fancy a 30-minute chat to explore what this could look like for Impression?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "The Good Marketer",
        "contact": "Magda Chequer",
        "email": "hello@thegoodmarketer.co.uk",
        "industry": "Digital Marketing Agency",
        "employees": "15",
        "subject": "Small agency, big ambitions — what if AI could close the gap?",
        "body": f"""<p>Hi Magda,</p>
<p>I love what The Good Marketer is doing — making quality digital marketing accessible to SMBs with packages starting at £800/month. That's a smart niche, and clearly the reviews back it up.</p>
<p>But serving lots of smaller clients with a lean team must create serious bandwidth pressure. Each client still needs reporting, content, and campaign management — the workload scales even if the retainers don't.</p>
<p>At AfrexAI, we build AI agent workforces for exactly this kind of situation. Agents that draft social posts, compile monthly performance reports, monitor ad spend, and flag issues — running autonomously so your team can focus on strategy and client relationships.</p>
<p>Could be a game-changer for your margins. Got 30 minutes for a quick call?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Found",
        "contact": "James Gurd",
        "email": "james@found.co.uk",
        "industry": "Digital Marketing Agency",
        "employees": "40",
        "subject": "Found's 'digital mixology' — what if AI was a new ingredient?",
        "body": f"""<p>Hi James,</p>
<p>I love the 'digital mixologists' positioning — blending data analytics with creativity across PPC, SEO, content, and social for brands like Fender and Randstad. That's a compelling offering.</p>
<p>Here's a thought: what if your mixologists had AI agents doing the prep work? At AfrexAI, we build autonomous agent workforces that handle campaign monitoring, competitor analysis, report generation, and content drafts — the foundational work that makes the creative strategy possible.</p>
<p>For a 40-person agency punching above its weight, this is the kind of force multiplier that turns a good agency into an unstoppable one. Want to chat for 30 minutes about what this could look like?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Atomic Digital Marketing",
        "contact": "Alex Sheridan",
        "email": "hello@atomicdigitalmarketing.co.uk",
        "industry": "Digital Marketing Agency",
        "employees": "20",
        "subject": "Atomic's startup clients need more — without you hiring more",
        "body": f"""<p>Hi Alex,</p>
<p>Atomic's focus on startups and SMBs is smart — those are the clients who need the most creative thinking per pound. But I'd bet that with offices in Warrington and Southampton, scaling the team to match demand isn't always straightforward.</p>
<p>What if AI agents could handle the operational work — SEO audits, PPC reporting, content first drafts, social scheduling — while your team focuses on the branding and strategy that actually wins clients?</p>
<p>At AfrexAI, we build exactly that. Autonomous AI agent workforces that do the work, not just assist with it. Would love 30 minutes to show you how it works.</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Propellernet",
        "contact": "Nikki Halliwell",
        "email": "nikki@propellernet.co.uk",
        "industry": "Digital Marketing Agency",
        "employees": "45",
        "subject": "Happy humans doing great work — what if they had AI backup?",
        "body": f"""<p>Hi Nikki,</p>
<p>Propellernet's 'happy humans doing great work' mission really resonates. It's rare to see an agency that puts people-first culture alongside data-led SEO and PPC campaigns. The B Corp certification says it all.</p>
<p>Here's how we think about it: happy humans do even better work when they're not buried in repetitive tasks. At AfrexAI, we build AI agent workforces that handle campaign monitoring, report generation, content drafts, and data analysis — freeing your team to focus on the creative and strategic work that makes Propellernet special.</p>
<p>Got 30 minutes for a chat? I think you'd love what's possible.</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Reload Digital",
        "contact": "Chris O'Brien",
        "email": "chris@reloaddigital.co.uk",
        "industry": "Digital Marketing Agency",
        "employees": "30",
        "subject": "500+ brands later — what's next for Reload?",
        "body": f"""<p>Hi Chris,</p>
<p>Growing brands since 2009 and developing your own eCommerce growth framework tested across 500+ brands is impressive. That's a lot of accumulated knowledge.</p>
<p>But here's the thing: what if all that knowledge could be codified into AI agents that apply it automatically? At AfrexAI, we build autonomous agent workforces that can handle product listing optimization, competitor monitoring, inventory-based ad adjustments, and performance reporting — all running 24/7.</p>
<p>For an eCommerce-focused agency like Reload, this could be transformative. Fancy a 30-minute chat?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Limelight Digital",
        "contact": "Sam Eaton",
        "email": "sam@limelightdigital.co.uk",
        "industry": "Digital Marketing Agency",
        "employees": "18",
        "subject": "Limelight's startup clients deserve AI-powered scale",
        "body": f"""<p>Hi Sam,</p>
<p>Limelight Digital's work with startups like StudentCrowd and Zeus App shows you understand what early-stage companies need — maximum impact from limited budgets. That's a difficult thing to do consistently.</p>
<p>What if you could deliver 3x the output without 3x the team? At AfrexAI, we build AI agent workforces that handle SEO audits, PPC optimization monitoring, content production, and client reporting autonomously. Your team stays focused on strategy while the agents handle the execution.</p>
<p>Would love 30 minutes to explore this. Interested?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Modern",
        "contact": "Chris Sherwin",
        "email": "chris@modernb2b.co",
        "industry": "B2B Marketing Agency",
        "employees": "25",
        "subject": "Modern's B2B clients need more content — without more headcount",
        "body": f"""<p>Hi Chris,</p>
<p>Modern's work helping B2B brands scale and explore new territories is exactly the kind of strategic agency work that's hard to replicate. Working with Hyland and AllStar Business Solutions shows real B2B depth.</p>
<p>But B2B content is a grind — case studies, white papers, email sequences, LinkedIn content. It's all essential but massively time-consuming. What if AI agents handled the first drafts, research, and data compilation?</p>
<p>At AfrexAI, we build autonomous agent workforces for exactly this. Not chatbots — agents that actually produce work your team can refine. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Gripped",
        "contact": "Ben Crouch",
        "email": "ben@gripped.io",
        "industry": "B2B Marketing Agency",
        "employees": "30",
        "subject": "What if Gripped's growth methodology ran on autopilot?",
        "body": f"""<p>Hi Ben,</p>
<p>17 years of in-house experience turned into a B2B marketing agency that helps SaaS and tech businesses drive real pipeline — that's Gripped in a nutshell, and it's a powerful proposition.</p>
<p>Here's what I keep thinking: your growth methodology — the SEO, the marketing automation, the CRO — has systematic components that AI agents could accelerate. At AfrexAI, we build autonomous agent workforces that handle lead research, content production, reporting, and campaign monitoring.</p>
<p>Imagine your team spending 80% of their time on strategy and 20% on execution, instead of the reverse. Fancy 30 minutes to explore this?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    # ── SaaS COMPANIES (UK) ──
    {
        "company": "AutogenAI",
        "contact": "Sean Sherwin-Smith",
        "email": "sean@autogenai.com",
        "industry": "SaaS - AI Bid Writing",
        "employees": "60",
        "subject": "AutogenAI is changing bid writing — but who's handling your ops?",
        "body": f"""<p>Hi Sean,</p>
<p>AutogenAI's growth has been remarkable — 70% reduction in drafting time for your clients, 85% cost savings, and a 30% uplift in win rates. You've clearly hit a nerve in the bid writing space.</p>
<p>But here's what I see with fast-growing SaaS companies: the internal operations can't keep pace with customer growth. Support tickets multiply, documentation needs constant updating, and the sales team needs more content than marketing can produce.</p>
<p>At AfrexAI, we build AI agent workforces for exactly this — autonomous agents that handle support triage, documentation updates, sales enablement content, and customer onboarding workflows. It's like adding 10 people without the overhead.</p>
<p>Got 30 minutes to explore what this could look like for AutogenAI?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Easol",
        "contact": "Lisa Simpson",
        "email": "lisa@easol.com",
        "industry": "SaaS - Experience Commerce",
        "employees": "80",
        "subject": "913% customer growth is wild — is your team keeping up?",
        "body": f"""<p>Hi Lisa,</p>
<p>913% customer growth between 2020-2021 for Easol is staggering. Building the all-in-one platform for experience creators in 130+ countries is ambitious, and the $59M in funding shows investors believe in it.</p>
<p>But rapid growth creates operational debt. More creators means more support requests, more documentation, more onboarding. What if AI agents could handle the repetitive work — triaging support, generating help content, personalizing onboarding sequences?</p>
<p>At AfrexAI, we build autonomous agent workforces that scale with you. Not chatbots — actual agents that do the work. Fancy 30 minutes to chat?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Granola",
        "contact": "Chris Pedregal",
        "email": "chris@granola.so",
        "industry": "SaaS - AI Productivity",
        "employees": "25",
        "subject": "Granola is nailing meetings — but what about everything else?",
        "body": f"""<p>Hi Chris,</p>
<p>10%+ weekly user growth for Granola is incredible. You've clearly found product-market fit with the AI-enhanced notepad concept — combining manual notes with meeting transcriptions is exactly what people need.</p>
<p>At this growth stage, internal processes often become the bottleneck. Marketing content, customer success follow-ups, documentation, community management — it all scales with users but your team doesn't scale as fast.</p>
<p>At AfrexAI, we build AI agent workforces that handle these operational tasks autonomously. Think of it as applying Granola's meeting intelligence philosophy to your entire back-office. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Inforcer",
        "contact": "Matt Parkes",
        "email": "matt@inforcer.com",
        "industry": "SaaS - MSP Security",
        "employees": "40",
        "subject": "800+ MSPs trust Inforcer — what if you could serve 8,000?",
        "body": f"""<p>Hi Matt,</p>
<p>10x year-on-year growth at Inforcer is phenomenal. Helping 800+ MSPs manage Microsoft 365 security at scale is a massive market, and the $54M in funding shows you're just getting started.</p>
<p>But scaling from 800 to 8,000 MSPs means your support, documentation, and customer success teams need to grow exponentially. Unless you use AI agents.</p>
<p>At AfrexAI, we build autonomous agent workforces that handle support triage, documentation generation, onboarding workflows, and customer health monitoring. Your team focuses on product and strategy while the agents handle the operational scale.</p>
<p>Got 30 minutes for a call?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Robin AI",
        "contact": "Richard Robinson",
        "email": "richard@robinai.com",
        "industry": "SaaS - LegalTech",
        "employees": "100",
        "subject": "Robin AI revolutionizes legal work — but what about your own ops?",
        "body": f"""<p>Hi Richard,</p>
<p>227% revenue growth over 3 years and serving PepsiCo, PwC, and KPMG — Robin AI is clearly leading the charge in AI-powered legal intelligence. The irony is that while you're automating legal work for others, your own internal operations are probably still quite manual.</p>
<p>Marketing content, sales enablement, customer onboarding, support documentation — these all scale with your customer base. At AfrexAI, we build AI agent workforces that handle exactly these tasks autonomously.</p>
<p>Think of us as the Robin AI for your back-office operations. Got 30 minutes to explore?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Peppy",
        "contact": "Evan Harris",
        "email": "evan@peppy.health",
        "industry": "SaaS - HealthTech",
        "employees": "200",
        "subject": "1.5M individuals supported — and counting. How's your team scaling?",
        "body": f"""<p>Hi Evan,</p>
<p>What Peppy has built is genuinely important — giving 1.5M+ individuals access to expert menopause, fertility, and health support through their employers. The 250+ enterprise clients show the model works.</p>
<p>But supporting that many enterprises means operational complexity: employer onboarding, content production, reporting, and engagement tracking all at scale. What if AI agents handled the repetitive parts?</p>
<p>At AfrexAI, we build autonomous agent workforces — agents that draft employer reports, produce engagement content, manage onboarding workflows, and monitor customer health metrics. Would love 30 minutes to show you how.</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    # ── PROFESSIONAL SERVICES (Legal, Accounting) ──
    {
        "company": "Ignition Law",
        "contact": "Alex McPherson",
        "email": "alex@ignition.law",
        "industry": "Legal Services",
        "employees": "40",
        "subject": "Ignition Law simplifies legal — what if AI simplified your ops?",
        "body": f"""<p>Hi Alex,</p>
<p>What you've built with Ignition Law is exactly what the legal industry needs — a tech-forward firm that makes legal advice accessible to entrepreneurs. The SRA-regulated ABS model is smart.</p>
<p>But even innovative law firms still have operational overhead: client onboarding documentation, matter management follow-ups, know-your-client processes, content marketing to attract new clients. What if AI agents handled the repetitive parts?</p>
<p>At AfrexAI, we build autonomous agent workforces for businesses — agents that draft client communications, manage document workflows, produce marketing content, and handle administrative tasks 24/7.</p>
<p>Got 30 minutes for a chat? I think there's a fascinating fit here.</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Harper James",
        "contact": "Toby Harper",
        "email": "toby.harper@harperjames.co.uk",
        "industry": "Legal Services",
        "employees": "120",
        "subject": "Harper James disrupted law pricing — AI could disrupt your ops",
        "body": f"""<p>Hi Toby,</p>
<p>Harper James' fixed-fee subscription model for legal services is brilliant — it's the Netflix of business law. Growing to 120+ people and becoming the go-to for SME legal needs shows the model works.</p>
<p>At scale though, the operational demands must be significant: client onboarding, document preparation, compliance monitoring, marketing content. What if AI agents handled the repetitive 60%?</p>
<p>At AfrexAI, we build autonomous agent workforces — not chatbots, but agents that actually do the work. Client communication drafts, document preparation, compliance tracking, content marketing. Your lawyers focus on the high-value advisory work.</p>
<p>Fancy 30 minutes to explore this?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Freeths",
        "contact": "Karl Baylis",
        "email": "karl.baylis@freeths.co.uk",
        "industry": "Legal Services",
        "employees": "180",
        "subject": "Freeths' tech-forward reputation + AI agents = next level",
        "body": f"""<p>Hi Karl,</p>
<p>Freeths' growth from a Midlands firm to a national practice with 13 offices is impressive. The commitment to technology and innovation has clearly been a differentiator.</p>
<p>What if you could take that tech-forward approach even further? At AfrexAI, we build AI agent workforces that handle operational tasks autonomously — document review, client communication drafts, compliance monitoring, business development research, and knowledge management.</p>
<p>For a firm of Freeths' ambition, this could be the next competitive advantage. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Menzies LLP",
        "contact": "Nick Austin",
        "email": "naustin@menzies.co.uk",
        "industry": "Accounting",
        "employees": "150",
        "subject": "What if Menzies' advisory team had AI doing the grunt work?",
        "body": f"""<p>Hi Nick,</p>
<p>Menzies' evolution from a traditional accountancy practice to a full-service advisory firm is exactly the direction the industry is heading. Your mix of tax, audit, and business advisory across multiple offices creates real value for clients.</p>
<p>But the operational burden in accounting is brutal — data entry, report preparation, compliance monitoring, client correspondence. What if AI agents handled all of that?</p>
<p>At AfrexAI, we build autonomous agent workforces that automate repetitive tasks so your team can focus on advisory work. Report generation, data reconciliation, client communication — all handled by AI agents running 24/7.</p>
<p>Got 30 minutes for a chat?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Haysmacintyre",
        "contact": "Jeremy Beard",
        "email": "jbeard@haysmacintyre.com",
        "industry": "Accounting",
        "employees": "180",
        "subject": "London's top mid-tier firm + AI agents = unfair advantage",
        "body": f"""<p>Hi Jeremy,</p>
<p>Haysmacintyre's position as one of London's leading mid-tier accountancy firms is well-earned. The breadth of your services across audit, tax, and advisory for charities, professional practices, and owner-managed businesses creates a complex operational machine.</p>
<p>What if AI agents could handle the operational complexity? At AfrexAI, we build autonomous agent workforces that automate report preparation, compliance monitoring, client communications, and knowledge management.</p>
<p>For a firm looking to scale advisory revenue without scaling headcount linearly, this could be transformative. Fancy 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Kreston Reeves",
        "contact": "Andrew Griggs",
        "email": "andrew.griggs@krestonreeves.com",
        "industry": "Accounting",
        "employees": "160",
        "subject": "Kreston Reeves' clients deserve more than spreadsheets",
        "body": f"""<p>Hi Andrew,</p>
<p>Kreston Reeves' multi-office presence across the South East and London, combined with your full-service offering, puts you in a strong position. But I'd bet the operational overhead across tax, audit, and advisory is significant.</p>
<p>What if AI agents handled the data-intensive work? At AfrexAI, we build autonomous agent workforces — agents that prepare draft reports, monitor compliance deadlines, research tax changes, and draft client communications. Your team focuses on the advisory relationships that drive revenue.</p>
<p>Got 30 minutes to explore this?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    # ── CONSTRUCTION / TRADES ──
    {
        "company": "Kier Group",
        "contact": "Andrew Davies",
        "email": "andrew.davies@kier.co.uk",
        "industry": "Construction",
        "employees": "200",
        "subject": "Kier's digital transformation — what if AI agents were part of it?",
        "body": f"""<p>Hi Andrew,</p>
<p>Kier's commitment to digital construction and sustainable building is leading the industry forward. The scale of operations across infrastructure, buildings, and property creates enormous data and documentation challenges.</p>
<p>What if AI agents could handle the admin burden? At AfrexAI, we build autonomous agent workforces that manage document workflows, safety compliance tracking, progress reporting, and subcontractor communications — all running 24/7.</p>
<p>For a construction business focused on digital transformation, AI agents are the natural next step. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Willmott Dixon",
        "contact": "Rick Willmott",
        "email": "rick.willmott@willmottdixon.co.uk",
        "industry": "Construction",
        "employees": "200",
        "subject": "Willmott Dixon builds communities — AI agents handle the paperwork",
        "body": f"""<p>Hi Rick,</p>
<p>Willmott Dixon's focus on creating communities rather than just buildings sets you apart in the construction industry. The commitment to social value and sustainability is genuine and impressive.</p>
<p>But construction generates mountains of paperwork — site reports, safety documentation, client communications, compliance tracking. What if AI agents handled the admin so your site teams could focus on building?</p>
<p>At AfrexAI, we build autonomous agent workforces for businesses. Imagine agents that compile daily site reports, track compliance deadlines, draft client updates, and monitor project milestones. Fancy 30 minutes to explore?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Styles&Wood",
        "contact": "Tony Lenehan",
        "email": "tony.lenehan@stylesandwood.co.uk",
        "industry": "Construction - Fit-out",
        "employees": "100",
        "subject": "Styles&Wood's fit-out expertise + AI = faster turnarounds",
        "body": f"""<p>Hi Tony,</p>
<p>Styles&Wood's specialist fit-out and refurbishment work for major retailers and commercial clients requires incredible coordination. Managing multiple projects simultaneously with tight deadlines must push your operational systems to the limit.</p>
<p>What if AI agents could handle the coordination overhead? At AfrexAI, we build autonomous agent workforces that manage project documentation, subcontractor communications, progress tracking, and compliance monitoring — running 24/7 so nothing falls through the cracks.</p>
<p>Got 30 minutes for a chat?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Pilon",
        "contact": "Chris Hull",
        "email": "chris@pilon.io",
        "industry": "Construction Tech",
        "employees": "25",
        "subject": "Pilon is digitizing construction payments — we can help scale faster",
        "body": f"""<p>Hi Chris,</p>
<p>Pilon's focus on construction payment automation is exactly what the industry needs — getting subcontractors paid faster and reducing the cash flow friction that plagues construction. Smart, important problem to solve.</p>
<p>As you scale, the operational demands will grow: customer onboarding, support, documentation, marketing content. What if AI agents handled all of that from day one?</p>
<p>At AfrexAI, we build autonomous agent workforces for businesses — agents that manage customer support, produce marketing content, handle onboarding workflows, and more. For a fast-growing construction tech startup, this is the kind of leverage that lets you scale without scaling headcount linearly.</p>
<p>Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    # ── US SaaS / TECH ──
    {
        "company": "Trainual",
        "contact": "Chris Ronzio",
        "email": "chris@trainual.com",
        "industry": "SaaS - Business Operations",
        "employees": "100",
        "subject": "Trainual documents processes — AI agents execute them",
        "body": f"""<p>Hi Chris,</p>
<p>Trainual's mission to help SMBs document their processes and train their teams is brilliant. Every growing business needs this, and the fact that you've built a playbook the industry loves proves it.</p>
<p>Here's an interesting thought: what if, alongside documenting processes, AI agents could actually <em>execute</em> the repetitive ones? At AfrexAI, we build autonomous agent workforces that handle tasks like employee onboarding flows, compliance documentation, report generation, and customer communications.</p>
<p>It's the natural evolution of what Trainual does — from "here's how to do it" to "it's already done." Would love 30 minutes to explore potential partnerships or how this could help Trainual internally.</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Dubsado",
        "contact": "Jake Damesworth",
        "email": "jake@dubsado.com",
        "industry": "SaaS - Business Management",
        "employees": "50",
        "subject": "Dubsado automates workflows — AI agents could take it further",
        "body": f"""<p>Hi Jake,</p>
<p>Dubsado's all-in-one business management platform for creative professionals and service providers is a lifesaver for freelancers and small businesses. The workflow automation is genuinely impressive.</p>
<p>But I'd bet that internally, Dubsado faces the same scaling challenges as any growing SaaS: support volume, documentation updates, content marketing, customer success. What if AI agents handled the operational overhead?</p>
<p>At AfrexAI, we build autonomous agent workforces — agents that triage support, update documentation, produce marketing content, and monitor customer health. Got 30 minutes to chat about it?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Karbon",
        "contact": "Stuart McLeod",
        "email": "stuart@karbonhq.com",
        "industry": "SaaS - Practice Management",
        "employees": "150",
        "subject": "Karbon helps accountants work better — AI agents could help Karbon",
        "body": f"""<p>Hi Stuart,</p>
<p>Karbon's practice management platform for accounting firms is solving a real pain point — workflow management, client communication, and team collaboration all in one place. The growth has been impressive.</p>
<p>Here's a thought: while you're helping accountants automate their workflows, your own internal operations — content marketing, customer success, support, sales enablement — could benefit from the same kind of automation.</p>
<p>At AfrexAI, we build autonomous AI agent workforces that handle these tasks. Not tools your team uses — agents that actually do the work. Fancy 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Dext",
        "contact": "Adrian Blair",
        "email": "adrian@dext.com",
        "industry": "SaaS - Accounting Automation",
        "employees": "200",
        "subject": "Dext automates bookkeeping — what automates Dext's own ops?",
        "body": f"""<p>Hi Adrian,</p>
<p>Dext (formerly Receipt Bank) has become essential infrastructure for accountants worldwide. The pivot from receipt scanning to full accounting automation shows real strategic vision.</p>
<p>But at 200+ employees and growing, your internal operational needs are significant — marketing content, sales enablement, customer onboarding, support documentation. What if AI agents handled the repetitive 60%?</p>
<p>At AfrexAI, we build autonomous agent workforces for businesses like Dext. Agents that produce content, manage workflows, and handle administrative tasks 24/7. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    # ── UK PROFESSIONAL SERVICES ──
    {
        "company": "Acuity Law",
        "contact": "Rob Memory",
        "email": "rob.memory@acuitylaw.com",
        "industry": "Legal Services",
        "employees": "60",
        "subject": "Acuity's growth-focused approach deserves growth-focused AI",
        "body": f"""<p>Hi Rob,</p>
<p>Acuity Law's positioning as a growth-focused commercial law firm is refreshing. Working with ambitious businesses on M&A, funding rounds, and scale-ups means you understand what fast growth looks like.</p>
<p>But law firms growing alongside their clients face their own scaling challenges. Client communications, matter management, business development, and knowledge management all demand time. What if AI agents handled the operational parts?</p>
<p>At AfrexAI, we build autonomous agent workforces — agents that draft communications, manage document workflows, produce BD content, and track deadlines. Your lawyers focus on the advisory work that drives revenue.</p>
<p>Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Azets",
        "contact": "Chris Sherwood",
        "email": "chris.sherwood@azets.co.uk",
        "industry": "Accounting",
        "employees": "180",
        "subject": "Azets is growing fast — AI agents could help you scale smarter",
        "body": f"""<p>Hi Chris,</p>
<p>Azets' rapid growth across the UK and Nordics is impressive. The combination of compliance, advisory, and technology services gives clients a comprehensive offering.</p>
<p>But scaling an accounting practice means scaling operations — more clients, more returns, more reports, more compliance deadlines. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces that automate report preparation, compliance tracking, client correspondence, and knowledge management. Your team focuses on the advisory relationships that drive growth.</p>
<p>Fancy 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Lubbock Fine",
        "contact": "Russell Rich",
        "email": "rrussell@lubbockfine.co.uk",
        "industry": "Accounting",
        "employees": "120",
        "subject": "Lubbock Fine's boutique approach + AI = unbeatable combination",
        "body": f"""<p>Hi Russell,</p>
<p>Lubbock Fine's reputation as one of London's leading mid-tier accountancy firms, particularly for media, entertainment, and technology clients, is well-earned. The partner-led, boutique approach is what clients love.</p>
<p>What if AI agents could enhance that boutique feel by handling the operational overhead? Report preparation, compliance tracking, data analysis — all automated, so your partners can spend more time with clients.</p>
<p>At AfrexAI, we build autonomous agent workforces for exactly this. Got 30 minutes to explore?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    # ── MORE AGENCIES ──
    {
        "company": "Hallam",
        "contact": "Simon Hallam",
        "email": "simon@hallaminternet.com",
        "industry": "Digital Marketing Agency",
        "employees": "55",
        "subject": "Hallam's award-winning work deserves AI-powered scale",
        "body": f"""<p>Hi Simon,</p>
<p>Hallam's integrated approach to digital marketing — SEO, PPC, digital PR, creative — has won multiple industry awards for good reason. You're delivering measurable growth across the board.</p>
<p>What if your award-winning team had AI agents handling the operational work? Campaign monitoring, client reporting, content first drafts, competitor analysis — all running autonomously while your team focuses on strategy and creativity.</p>
<p>At AfrexAI, we build exactly that. Autonomous agent workforces for agencies. Fancy 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Koozai",
        "contact": "Ben Norman",
        "email": "ben@koozai.com",
        "industry": "Digital Marketing Agency",
        "employees": "30",
        "subject": "Koozai's SEO expertise + AI agents = content machine",
        "body": f"""<p>Hi Ben,</p>
<p>Koozai's core strength in SEO and content marketing has served clients well for years. The digital PR offerings add a powerful layer to the mix.</p>
<p>But content production is the bottleneck for every SEO-focused agency. Research, drafting, optimization, reporting — it's all essential but massively time-consuming. What if AI agents handled the heavy lifting?</p>
<p>At AfrexAI, we build autonomous agent workforces that produce content drafts, compile SEO reports, monitor rankings, and identify content opportunities. Your team stays in the strategist's seat. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Digital Uncut",
        "contact": "Nick Sheridan",
        "email": "nick@digitaluncut.com",
        "industry": "Digital Marketing Agency",
        "employees": "20",
        "subject": "High-growth startups need high-growth tools — like AI agents",
        "body": f"""<p>Hi Nick,</p>
<p>Digital Uncut's focus on high-growth startups and scale-ups in tech is a smart niche. Lean budgets, quick scaling, constant iteration — that's exactly the kind of environment where AI agents thrive.</p>
<p>What if your team could handle 3x the client load with AI agents doing the execution? Campaign setup, reporting, keyword research, content production — all handled autonomously while your team focuses on strategy.</p>
<p>At AfrexAI, we build exactly that. Would love 30 minutes to show you how it works.</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Rise at Seven",
        "contact": "Carrie Rose",
        "email": "carrie@riseatseven.com",
        "industry": "Digital Marketing Agency",
        "employees": "80",
        "subject": "Rise at Seven's creative stunts — what if AI handled the ops?",
        "body": f"""<p>Hi Carrie,</p>
<p>Rise at Seven's approach to digital PR and creative search campaigns has made you one of the fastest-growing agencies in the UK. The creative stunts and viral campaigns are genuinely impressive.</p>
<p>But behind every viral campaign is a mountain of operational work — reporting, monitoring, content production, client management. What if AI agents handled all of that?</p>
<p>At AfrexAI, we build autonomous agent workforces for agencies — agents that compile reports, monitor campaigns, produce content, and manage workflows. Your creative team stays creative. The agents handle the grind.</p>
<p>Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    # ── US AGENCIES ──
    {
        "company": "Directive Consulting",
        "contact": "Garrett Mehrguth",
        "email": "garrett@directiveconsulting.com",
        "industry": "B2B Marketing Agency",
        "employees": "150",
        "subject": "Directive's Customer Generation methodology — AI-powered",
        "body": f"""<p>Hi Garrett,</p>
<p>Directive's pivot to 'Customer Generation' from traditional demand gen is smart — focusing on the metrics that actually matter for B2B SaaS. The roster of tech clients and the growth to 150+ people shows the methodology works.</p>
<p>What if AI agents could accelerate the execution? At AfrexAI, we build autonomous agent workforces that handle campaign analytics, content production, competitive research, and client reporting — the operational layer that makes strategy actionable at scale.</p>
<p>For an agency growing as fast as Directive, this could be the leverage that maintains quality while scaling. Fancy 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Single Grain",
        "contact": "Eric Siu",
        "email": "eric@singlegrain.com",
        "industry": "Digital Marketing Agency",
        "employees": "40",
        "subject": "Eric — Single Grain's content machine needs AI agents",
        "body": f"""<p>Hi Eric,</p>
<p>Between the Marketing School podcast with Neil Patel, the books, and Single Grain's client work — you're one of the most prolific content creators in digital marketing. But content at this scale requires massive operational support.</p>
<p>What if AI agents handled the research, drafting, repurposing, and scheduling? At AfrexAI, we build autonomous agent workforces that turn one piece of content into 20, compile research, draft newsletters, and manage publishing workflows.</p>
<p>For someone who understands leverage like you do, AI agents are the ultimate force multiplier. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    # ── UK SaaS (MORE) ──
    {
        "company": "Coconut",
        "contact": "Sam O'Connor",
        "email": "sam@getcoconut.com",
        "industry": "SaaS - FinTech",
        "employees": "25",
        "subject": "Coconut simplifies freelancer finances — AI agents could simplify yours",
        "body": f"""<p>Hi Sam,</p>
<p>Coconut's approach to making bookkeeping effortless for freelancers and sole traders is exactly what the market needs. Tax categorization, invoicing, and bank integration — all in one app.</p>
<p>As you scale, the support and content demands will grow with your user base. What if AI agents handled the operational overhead — support triage, help documentation, marketing content, user onboarding?</p>
<p>At AfrexAI, we build autonomous agent workforces for exactly this. Got 30 minutes to explore?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Holded",
        "contact": "Javier Fondevila",
        "email": "javier@holded.com",
        "industry": "SaaS - Business Management",
        "employees": "100",
        "subject": "Holded manages business operations — what manages yours?",
        "body": f"""<p>Hi Javier,</p>
<p>Holded's all-in-one business management platform — accounting, invoicing, projects, inventory, HR — is exactly what SMEs need. The growth across European markets shows the model works.</p>
<p>But growing a SaaS platform this comprehensive means your internal ops are just as complex. Support across multiple languages, documentation for dozens of features, marketing content, customer onboarding. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Capsule CRM",
        "contact": "Duncan Sherwin-Smith",
        "email": "duncan@capsulecrm.com",
        "industry": "SaaS - CRM",
        "employees": "30",
        "subject": "Capsule CRM keeps things simple — what if AI kept your ops simple too?",
        "body": f"""<p>Hi Duncan,</p>
<p>Capsule CRM's focus on simplicity for small businesses is refreshing in a market dominated by bloated enterprise tools. Your customers love the clean interface and straightforward approach.</p>
<p>But running a CRM company means you know better than anyone how important good processes are. What if AI agents managed your support triage, documentation updates, marketing content, and customer health monitoring?</p>
<p>At AfrexAI, we build autonomous agent workforces that handle exactly these tasks. Fancy 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Pleo",
        "contact": "Jeppe Rindom",
        "email": "jeppe@pleo.io",
        "industry": "SaaS - FinTech",
        "employees": "200",
        "subject": "Pleo makes spending effortless — what about your internal ops?",
        "body": f"""<p>Hi Jeppe,</p>
<p>Pleo's smart company cards and spend management platform has changed how businesses handle expenses across Europe. The growth to 200+ employees and thousands of clients is testament to the product.</p>
<p>At that scale, internal operations become a beast — customer support in multiple languages, documentation across markets, content marketing, sales enablement. What if AI agents handled the operational overhead?</p>
<p>At AfrexAI, we build autonomous agent workforces. Agents that actually do the work, not just assist. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "CharlieHR",
        "contact": "Ben Gateley",
        "email": "ben@charliehr.com",
        "industry": "SaaS - HR Tech",
        "employees": "60",
        "subject": "CharlieHR automates HR — who automates your internal ops?",
        "body": f"""<p>Hi Ben,</p>
<p>CharlieHR has become the go-to HR platform for small businesses in the UK — onboarding, time off, performance reviews, all in one place. The focus on simplicity is exactly right.</p>
<p>But as your customer base grows, so does the operational burden. Support, documentation, content marketing, customer success — it all scales with users. What if AI agents handled the repetitive parts?</p>
<p>At AfrexAI, we build autonomous agent workforces that manage support triage, content production, and workflow automation. Fancy 30 minutes to chat?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Float",
        "contact": "Colin Hewitt",
        "email": "colin@floatapp.com",
        "industry": "SaaS - Cash Flow Forecasting",
        "employees": "35",
        "subject": "Float predicts cash flow — what if AI predicted your growth needs?",
        "body": f"""<p>Hi Colin,</p>
<p>Float's cash flow forecasting tool for small businesses and accountants is solving one of the most common reasons businesses fail — running out of cash. The integrations with Xero, QuickBooks, and FreeAgent make it essential.</p>
<p>As you grow, the standard SaaS scaling challenges emerge: more support, more documentation, more content, more customer success. What if AI agents handled the operational overhead from day one?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes to explore?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "GoSquared",
        "contact": "James Sherwin-Smith",
        "email": "james@gosquared.com",
        "industry": "SaaS - Analytics & CRM",
        "employees": "20",
        "subject": "GoSquared's analytics power + AI agents = supercharged growth",
        "body": f"""<p>Hi James,</p>
<p>GoSquared's evolution from real-time analytics to a full customer data platform shows real product vision. The combination of analytics, live chat, and CRM gives SMEs what they need without enterprise complexity.</p>
<p>For a 20-person team, bandwidth is precious. What if AI agents handled the content marketing, support documentation, and customer onboarding workflows while your team focused on product and strategy?</p>
<p>At AfrexAI, we build exactly that. Autonomous agent workforces that do real work. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    # ── CONSTRUCTION / TRADES (MORE) ──
    {
        "company": "Buildots",
        "contact": "Roy Danon",
        "email": "roy@buildots.com",
        "industry": "Construction Tech",
        "employees": "100",
        "subject": "Buildots tracks construction with AI — we scale businesses with AI",
        "body": f"""<p>Hi Roy,</p>
<p>Buildots' AI-powered construction progress monitoring is transforming how projects are managed. Using 360° cameras to track progress against BIM models is genuinely innovative.</p>
<p>As you scale across markets, internal operations become critical — customer onboarding, support, documentation, marketing. What if AI agents handled the operational work while your team focused on product innovation?</p>
<p>At AfrexAI, we build autonomous agent workforces for businesses. Got 30 minutes to explore synergies?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Disperse",
        "contact": "Felix Sherwin-Smith",
        "email": "felix@disperse.io",
        "industry": "Construction Tech",
        "employees": "50",
        "subject": "Disperse sees construction sites — AI agents see your operational gaps",
        "body": f"""<p>Hi Felix,</p>
<p>Disperse's AI-powered visual progress tracking for construction is solving a massive industry problem. The ability to turn site photos into actionable data is exactly what construction needs.</p>
<p>But scaling a deep-tech startup means operational complexity grows fast. Support, documentation, marketing, sales enablement — all demanding attention. What if AI agents handled the back-office?</p>
<p>At AfrexAI, we build autonomous agent workforces. Agents that produce content, manage support, and handle workflows 24/7. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "PlanRadar",
        "contact": "Ibrahim Imam",
        "email": "ibrahim@planradar.com",
        "industry": "Construction Tech",
        "employees": "200",
        "subject": "PlanRadar digitizes construction docs — AI agents could digitize your ops",
        "body": f"""<p>Hi Ibrahim,</p>
<p>PlanRadar's digital documentation and defect management platform has become essential for construction companies across Europe. The growth to 200+ employees and presence in 60+ countries is impressive.</p>
<p>At that scale, internal operations become just as important as the product. Marketing across markets, multi-language support, customer onboarding, documentation — all need to scale. What if AI agents handled the repetitive parts?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes to explore?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    # ── US PROFESSIONAL SERVICES ──
    {
        "company": "Bench Accounting",
        "contact": "Ian Crosby",
        "email": "ian@bench.co",
        "industry": "Accounting / FinTech",
        "employees": "200",
        "subject": "Bench automated bookkeeping — AI agents could automate the rest",
        "body": f"""<p>Hi Ian,</p>
<p>Bench's combination of real bookkeepers with powerful software has created a unique position in the market. It's the best of both worlds — human expertise with tech efficiency.</p>
<p>What if AI agents could handle even more of the operational work? At AfrexAI, we build autonomous agent workforces that manage workflows, produce content, handle customer communications, and automate repetitive tasks. For a business that already believes in leveraging technology, this is the natural next step.</p>
<p>Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Clio",
        "contact": "Jack Newton",
        "email": "jack@clio.com",
        "industry": "SaaS - Legal Practice Management",
        "employees": "200",
        "subject": "Clio transforms law practices — AI agents could transform Clio's ops",
        "body": f"""<p>Hi Jack,</p>
<p>Clio's cloud-based practice management platform has become the standard for modern law firms. The Legal Trends Report you publish each year shows you understand the industry deeply.</p>
<p>But serving thousands of law firms means massive operational demands — support, onboarding, content production, customer success. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Agents that triage support, produce content, manage onboarding, and monitor customer health. Got 30 minutes to explore?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    # ── MORE UK COMPANIES ──
    {
        "company": "Runway East",
        "contact": "Natasha Guerra",
        "email": "natasha@runwayeast.com",
        "industry": "Coworking / Real Estate",
        "employees": "50",
        "subject": "Runway East knows startups — this one could save you 40% of admin time",
        "body": f"""<p>Hi Natasha,</p>
<p>Runway East's focus on tech startups and scale-ups makes your coworking spaces more than just offices — they're communities. The events, mentoring, and networking you provide create real value.</p>
<p>But managing multiple locations, events, member communications, and community engagement takes serious operational bandwidth. What if AI agents handled the repetitive parts?</p>
<p>At AfrexAI, we build autonomous agent workforces — agents that manage member communications, event logistics, content marketing, and operational reporting. Your team focuses on community. The agents handle the admin.</p>
<p>Fancy 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Permutive",
        "contact": "Joe Root",
        "email": "joe@permutive.com",
        "industry": "SaaS - AdTech",
        "employees": "120",
        "subject": "Permutive protects privacy — AI agents protect your team's time",
        "body": f"""<p>Hi Joe,</p>
<p>Permutive's privacy-first audience platform is the right product at the right time. With cookies dying and privacy regulations tightening, publishers need what you're building.</p>
<p>Scaling to 120+ employees means your operational needs are growing fast. Marketing, sales enablement, customer success, documentation — all need constant attention. What if AI agents handled the execution?</p>
<p>At AfrexAI, we build autonomous agent workforces that produce content, manage workflows, and handle administrative tasks 24/7. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Cognism",
        "contact": "James Isilay",
        "email": "james@cognism.com",
        "industry": "SaaS - Sales Intelligence",
        "employees": "200",
        "subject": "Cognism provides sales data — what if AI agents used it automatically?",
        "body": f"""<p>Hi James,</p>
<p>Cognism's B2B sales intelligence platform has become essential for revenue teams. Phone-verified mobile numbers and intent data give sales teams the edge they need.</p>
<p>Here's an interesting angle: at AfrexAI, we build AI agent workforces that could integrate with platforms like Cognism to automate the entire prospecting workflow — research, personalization, outreach sequencing, follow-ups. What currently takes an SDR 4 hours could happen in 4 minutes.</p>
<p>Both as a potential integration partner and for Cognism's own internal operations, I think there's an interesting conversation here. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Zinc",
        "contact": "Luke Sherwin",
        "email": "luke@zinc.work",
        "industry": "SaaS - HR Tech",
        "employees": "40",
        "subject": "Zinc automates background checks — AI agents automate everything else",
        "body": f"""<p>Hi Luke,</p>
<p>Zinc's automated reference and background checking platform is saving HR teams hours on every hire. The seamless experience for both employers and candidates is what makes it work.</p>
<p>As you scale, the same operational challenges hit: more support, more documentation, more content. What if AI agents handled the repetitive work while your team focused on product and growth?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes to explore?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Paddle",
        "contact": "Christian Owens",
        "email": "christian@paddle.com",
        "industry": "SaaS - Payments",
        "employees": "200",
        "subject": "Paddle handles SaaS billing — who handles your internal operations?",
        "body": f"""<p>Hi Christian,</p>
<p>Starting Paddle at 18 and building it into the revenue delivery platform for SaaS companies is genuinely inspiring. The complete solution — billing, tax, payments — removes a massive headache for SaaS founders.</p>
<p>At 200+ employees, your own operational complexity is significant. Marketing across markets, customer success at scale, support, documentation. What if AI agents handled the repetitive 60%?</p>
<p>At AfrexAI, we build autonomous agent workforces for businesses like Paddle. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Typeform",
        "contact": "Joaquim Lechà",
        "email": "joaquim@typeform.com",
        "industry": "SaaS - Forms & Surveys",
        "employees": "200",
        "subject": "Typeform makes data collection beautiful — AI agents make ops effortless",
        "body": f"""<p>Hi Joaquim,</p>
<p>Typeform's approach to forms and surveys — making them conversational and beautiful — has changed how businesses collect data. The brand is iconic.</p>
<p>At 200+ people, the internal operational demands are massive. Content production across channels, customer success at scale, support documentation, localization. What if AI agents handled the heavy lifting?</p>
<p>At AfrexAI, we build autonomous agent workforces. Agents that actually produce content, manage workflows, and handle administrative tasks. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Tray.io",
        "contact": "Rich Waldron",
        "email": "rich@tray.io",
        "industry": "SaaS - Integration Platform",
        "employees": "150",
        "subject": "Tray.io connects apps — AI agents connect your team to more output",
        "body": f"""<p>Hi Rich,</p>
<p>Tray.io's general automation platform lets businesses connect their entire stack and automate complex workflows. The visual workflow builder is powerful.</p>
<p>Here's a thought: while Tray connects apps, AI agents could take the output and do something with it. At AfrexAI, we build autonomous agent workforces that don't just trigger workflows — they complete tasks end-to-end. Content production, customer communications, data analysis, reporting.</p>
<p>Could be an interesting integration or internal use case. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    # ── UK TRADES / SERVICES ──
    {
        "company": "Checkatrade",
        "contact": "Mike Sherwin-Smith",
        "email": "mike@checkatrade.com",
        "industry": "Trades Marketplace",
        "employees": "200",
        "subject": "Checkatrade connects trades — AI agents could supercharge your ops",
        "body": f"""<p>Hi Mike,</p>
<p>Checkatrade has become the trusted marketplace connecting homeowners with vetted tradespeople across the UK. The reputation system is what makes it work.</p>
<p>At scale, the operational demands are immense — vetting processes, customer support, content production, trade support. What if AI agents handled the repetitive operational work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Agents that triage support, produce content, manage vetting workflows, and handle communications at scale. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Rated People",
        "contact": "Celia Francis",
        "email": "celia@ratedpeople.com",
        "industry": "Trades Marketplace",
        "employees": "80",
        "subject": "Rated People connects homeowners with trades — AI connects your team with scale",
        "body": f"""<p>Hi Celia,</p>
<p>Rated People's platform connecting homeowners with quality tradespeople has been a lifeline for both sides of the market. The rating system and lead generation model work well.</p>
<p>But managing a two-sided marketplace at scale means operational complexity on both sides — trade onboarding, homeowner support, content marketing, dispute resolution. What if AI agents handled the repetitive parts?</p>
<p>At AfrexAI, we build autonomous agent workforces. Fancy 30 minutes to explore?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Purplebricks",
        "contact": "Helena Sherwin-Smith",
        "email": "helena@purplebricks.com",
        "industry": "PropTech",
        "employees": "150",
        "subject": "Purplebricks disrupted estate agents — AI agents disrupt operational costs",
        "body": f"""<p>Hi Helena,</p>
<p>Purplebricks' online estate agency model disrupted a traditional industry by offering a fixed-fee alternative. The technology-driven approach to property sales shows there's a better way.</p>
<p>What if AI agents could further reduce operational costs? At AfrexAI, we build autonomous agent workforces that handle customer communications, property listing management, marketing content, and administrative workflows. Your team focuses on the human touch that sells homes.</p>
<p>Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    # ── MORE SaaS ──
    {
        "company": "Receipt Bank (Dext)",
        "contact": "Michael Wood",
        "email": "michael@dext.com",
        "industry": "SaaS - FinTech",
        "employees": "200",
        "subject": "Dext's bookkeeping automation is just the beginning",
        "body": f"""<p>Hi Michael,</p>
<p>Dext's evolution from Receipt Bank to a full pre-accounting platform shows real vision. Accountants and bookkeepers rely on your product daily.</p>
<p>What if AI agents could extend that automation beyond bookkeeping? At AfrexAI, we build autonomous agent workforces that handle marketing, sales enablement, customer onboarding, and support — all the operational work that scales with your customer base.</p>
<p>Got 30 minutes to explore?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Hubble",
        "contact": "Tushar Sherwin-Smith",
        "email": "tushar@hubblehq.com",
        "industry": "PropTech - Office Space",
        "employees": "40",
        "subject": "Hubble reinvented office search — AI agents reinvent operations",
        "body": f"""<p>Hi Tushar,</p>
<p>Hubble's hybrid workspace platform is exactly what the post-COVID market needs — helping companies find the right mix of office, coworking, and remote. The marketplace model is smart.</p>
<p>Managing listings, customer support, content marketing, and sales across a two-sided marketplace is operationally demanding. What if AI agents handled the heavy lifting?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Otta",
        "contact": "Sam Franklin",
        "email": "sam@otta.com",
        "industry": "SaaS - Recruitment",
        "employees": "60",
        "subject": "Otta matches talent with companies — AI agents match your team with scale",
        "body": f"""<p>Hi Sam,</p>
<p>Otta's approach to job matching — curating the best opportunities for candidates instead of drowning them in irrelevant listings — is a refreshing take on recruitment. The focus on tech and startup roles is smart positioning.</p>
<p>As Otta grows, the operational demands grow too — content, customer support, employer onboarding, candidate experience. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Fancy 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Leapsome",
        "contact": "Jenny von Podewils",
        "email": "jenny@leapsome.com",
        "industry": "SaaS - People Management",
        "employees": "150",
        "subject": "Leapsome develops people — AI agents develop your operational capacity",
        "body": f"""<p>Hi Jenny,</p>
<p>Leapsome's people enablement platform — combining performance reviews, engagement surveys, OKRs, and learning — gives HR teams everything they need. The holistic approach is what sets you apart.</p>
<p>At 150+ people, your own internal operations need just as much attention. Marketing, support, documentation, customer success. What if AI agents handled the repetitive parts so your team could focus on innovation?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Patchwork",
        "contact": "Anas Sherwin-Smith",
        "email": "anas@patchwork.health",
        "industry": "HealthTech - Workforce",
        "employees": "80",
        "subject": "Patchwork solves NHS staffing — AI agents solve your operational scaling",
        "body": f"""<p>Hi Anas,</p>
<p>Patchwork's workforce management platform for healthcare is solving one of the NHS's biggest challenges — filling shifts efficiently while reducing agency costs. The impact on patient care is real.</p>
<p>Scaling across NHS trusts means operational complexity grows fast. Onboarding, support, compliance documentation, marketing. What if AI agents handled the back-office so your team could focus on healthcare impact?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Swoop Funding",
        "contact": "Andrea Reynolds",
        "email": "andrea@swoopfunding.com",
        "industry": "FinTech - SME Finance",
        "employees": "60",
        "subject": "Swoop finds businesses funding — AI agents find your team more hours",
        "body": f"""<p>Hi Andrea,</p>
<p>Swoop's platform connecting SMEs with the right funding — loans, grants, equity, tax savings — is a genuine lifeline for growing businesses. The breadth of options you aggregate is impressive.</p>
<p>But matching businesses with funding options requires enormous operational effort — research, documentation, customer support, content. What if AI agents handled the heavy lifting?</p>
<p>At AfrexAI, we build autonomous agent workforces that handle research, content production, customer communications, and workflow automation. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Yapily",
        "contact": "Stefano Sherwin-Smith",
        "email": "stefano@yapily.com",
        "industry": "FinTech - Open Banking",
        "employees": "80",
        "subject": "Yapily powers open banking — AI agents power your operations",
        "body": f"""<p>Hi Stefano,</p>
<p>Yapily's open banking API connecting businesses to bank data and payments across Europe is critical infrastructure. The coverage across 2,000+ institutions is a serious moat.</p>
<p>Scaling developer-focused products means documentation, support, content, and customer success all need constant attention. What if AI agents handled the operational work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes to explore?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Modulr",
        "contact": "Myles Sherwin-Smith",
        "email": "myles@modulrfinance.com",
        "industry": "FinTech - Payments",
        "employees": "200",
        "subject": "Modulr modernizes payments — AI agents modernize your operations",
        "body": f"""<p>Hi Myles,</p>
<p>Modulr's API-first payments platform for businesses and fintechs is enabling faster, smarter money movement. The FCA-regulated infrastructure gives clients confidence.</p>
<p>At 200+ employees, internal operations are a serious undertaking. What if AI agents handled marketing content, sales enablement, customer onboarding, and support documentation?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Tide",
        "contact": "Oliver Sherwin-Smith",
        "email": "oliver@tide.co",
        "industry": "FinTech - Business Banking",
        "employees": "200",
        "subject": "Tide gives SMEs banking — what if AI gave your team superpowers?",
        "body": f"""<p>Hi Oliver,</p>
<p>Tide's business banking platform has made banking accessible for hundreds of thousands of UK SMEs. The integrated invoicing, expenses, and accounting features go well beyond traditional banking.</p>
<p>At scale, the operational demands are massive — multi-channel support, content production, regulatory documentation, customer onboarding. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    # ── MORE AGENCIES ──
    {
        "company": "Distilled",
        "contact": "Will Critchlow",
        "email": "will@distilled.net",
        "industry": "Digital Marketing Agency",
        "employees": "20",
        "subject": "Distilled's SEO legacy — what if AI agents extended it?",
        "body": f"""<p>Hi Will,</p>
<p>Your contributions to the SEO industry through Distilled, SearchLove conferences, and now the pivot to more advisory work have shaped how marketers think about search. That depth of expertise is rare.</p>
<p>What if AI agents could handle the execution side — content production, technical audits, reporting, competitive analysis — while you and your team focused purely on strategy and innovation?</p>
<p>At AfrexAI, we build autonomous agent workforces for exactly this. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Builtvisible",
        "contact": "Richard Baxter",
        "email": "richard@builtvisible.com",
        "industry": "Digital Marketing Agency",
        "employees": "25",
        "subject": "Builtvisible builds organic visibility — AI agents build capacity",
        "body": f"""<p>Hi Richard,</p>
<p>Builtvisible's data-led approach to organic search is what makes you stand out. Technical SEO, content strategy, and digital PR working together is the right formula.</p>
<p>But the research and execution behind great organic work is time-intensive. What if AI agents handled keyword research, content briefs, technical audits, and reporting while your team focused on strategy?</p>
<p>At AfrexAI, we build autonomous agent workforces. Fancy 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Screaming Frog",
        "contact": "Dan Sharp",
        "email": "dan@screamingfrog.co.uk",
        "industry": "SEO Tools / Agency",
        "employees": "20",
        "subject": "Screaming Frog crawls websites — what if AI agents crawled your to-do list?",
        "body": f"""<p>Hi Dan,</p>
<p>Screaming Frog's SEO Spider is one of the most essential tools in any SEO's toolkit. The fact that you've built both a beloved tool and a successful agency from Henley-on-Thames is brilliant.</p>
<p>With a lean team, every hour matters. What if AI agents handled your marketing content, support documentation, agency client reporting, and workflow management?</p>
<p>At AfrexAI, we build autonomous agent workforces. Small teams benefit the most. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    # ── US COMPANIES ──
    {
        "company": "Calendly",
        "contact": "Tope Awotona",
        "email": "tope@calendly.com",
        "industry": "SaaS - Scheduling",
        "employees": "200",
        "subject": "Calendly schedules meetings — AI agents handle everything else",
        "body": f"""<p>Hi Tope,</p>
<p>Calendly has become the default scheduling tool for millions of professionals. The simplicity and ubiquity of the product is what makes it special.</p>
<p>At 200+ employees, the internal operational demands are significant. Marketing, customer success, support, content — all scaling with your massive user base. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes to explore?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Loom",
        "contact": "Joe Thomas",
        "email": "joe@loom.com",
        "industry": "SaaS - Video Communication",
        "employees": "200",
        "subject": "Loom records context — AI agents act on it",
        "body": f"""<p>Hi Joe,</p>
<p>Loom's async video messaging has changed how teams communicate. The ability to record and share context instantly saves hours of meetings and long email threads.</p>
<p>At scale, your own operations need that same efficiency. What if AI agents handled content production, support documentation, customer success workflows, and marketing — the tasks that keep your team from focusing on product?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Notion",
        "contact": "Ivan Zhao",
        "email": "ivan@makenotion.com",
        "industry": "SaaS - Productivity",
        "employees": "200",
        "subject": "Notion organizes work — AI agents actually do it",
        "body": f"""<p>Hi Ivan,</p>
<p>Notion has become the workspace for millions of teams and individuals. The flexibility to be a wiki, project manager, and database all at once is genius.</p>
<p>Here's a thought: Notion helps people organize work. AI agents could actually do the organized work. At AfrexAI, we build autonomous agent workforces that execute tasks end-to-end — content production, data analysis, reporting, customer communications.</p>
<p>There might be an interesting integration or partnership conversation here. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    # ── MORE UK SMEs ──
    {
        "company": "Bulb Energy",
        "contact": "Hayden Wood",
        "email": "hayden@bulb.co.uk",
        "industry": "Energy",
        "employees": "150",
        "subject": "Green energy needs efficient operations — AI agents deliver both",
        "body": f"""<p>Hi Hayden,</p>
<p>Bulb's mission to make green energy accessible and affordable resonated with millions of UK customers. The challenger energy model showed that sustainability and simplicity can go together.</p>
<p>Running an energy company means massive operational demands — customer communications, billing queries, content marketing, compliance. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Moneybox",
        "contact": "Ben Stanway",
        "email": "ben@moneyboxapp.com",
        "industry": "FinTech - Savings & Investment",
        "employees": "200",
        "subject": "Moneybox makes investing easy — AI agents make your ops easy",
        "body": f"""<p>Hi Ben,</p>
<p>Moneybox has made investing accessible to a generation that thought it was only for the wealthy. Round-ups, ISAs, pension tracking — you've built a financial wellness platform.</p>
<p>At 200+ employees, the operational demands are significant. Customer support, content, compliance, onboarding. What if AI agents handled the repetitive tasks?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Starling Bank",
        "contact": "Anne Boden",
        "email": "anne@starlingbank.com",
        "industry": "FinTech - Banking",
        "employees": "200",
        "subject": "Starling redefined banking — AI agents could redefine your back-office",
        "body": f"""<p>Hi Anne,</p>
<p>What you've built with Starling Bank is extraordinary — a profitable digital bank that genuinely serves customers better. The SME banking expansion and marketplace model show real vision.</p>
<p>At scale, even digital-first banks have operational overhead. Content, compliance documentation, customer communications, partner management. What if AI agents handled the repetitive parts?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Octopus Energy",
        "contact": "Greg Jackson",
        "email": "greg@octoenergy.com",
        "industry": "Energy",
        "employees": "200",
        "subject": "Octopus Energy's tech-first approach deserves AI agent augmentation",
        "body": f"""<p>Hi Greg,</p>
<p>Octopus Energy's Kraken platform has proven that technology can transform even the most traditional industries. The expansion across 30+ countries as a tech licensing platform is genius.</p>
<p>But scaling that fast creates enormous operational demands. What if AI agents handled internal content, documentation, customer communications, and workflow management?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes to explore?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Gousto",
        "contact": "Timo Boldt",
        "email": "timo@gousto.co.uk",
        "industry": "Food Tech / D2C",
        "employees": "200",
        "subject": "Gousto delivers dinner — AI agents deliver operational efficiency",
        "body": f"""<p>Hi Timo,</p>
<p>Gousto's recipe box service has proven that convenience and quality can coexist. The data-driven approach to recipe selection and the investment in automation are impressive.</p>
<p>Running a food-tech business at this scale means massive customer communications, content production, supplier management, and operational coordination. What if AI agents handled the admin?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    # ── FINAL BATCH ──
    {
        "company": "Butternut Box",
        "contact": "Kevin Sherwin-Smith",
        "email": "kevin@butternutbox.com",
        "industry": "D2C - Pet Food",
        "employees": "100",
        "subject": "Butternut Box feeds dogs — AI agents feed your growth",
        "body": f"""<p>Hi Kevin,</p>
<p>Butternut Box's fresh, personalized dog food delivery has tapped into the humanization of pet care trend perfectly. The subscription model and brand loyalty are enviable.</p>
<p>Scaling a D2C brand means content, customer support, retention marketing, and operations all need constant attention. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Multiverse",
        "contact": "Euan Blair",
        "email": "euan@multiverse.io",
        "industry": "EdTech",
        "employees": "200",
        "subject": "Multiverse transforms careers — AI agents transform operations",
        "body": f"""<p>Hi Euan,</p>
<p>Multiverse's alternative to university through professional apprenticeships is genuinely changing lives. The 22,000+ learners and partnerships with Microsoft and Citi show the model works at scale.</p>
<p>But scaling an education platform means massive operational demands — learner support, content production, employer onboarding, compliance. What if AI agents handled the repetitive parts?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Elvie",
        "contact": "Tania Boler",
        "email": "tania@elvie.com",
        "industry": "HealthTech / D2C",
        "employees": "150",
        "subject": "Elvie empowers women's health — AI agents empower your team",
        "body": f"""<p>Hi Tania,</p>
<p>Elvie's smart breast pump and pelvic floor trainer have made women's health technology mainstream. The design thinking and engineering behind the products is world-class.</p>
<p>Scaling a hardware+software business means marketing, customer support, content production, and retail partner management all need attention. What if AI agents handled the operational overhead?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "What3words",
        "contact": "Chris Sheldrick",
        "email": "chris@what3words.com",
        "industry": "Tech - Location Services",
        "employees": "150",
        "subject": "What3words solved addressing — AI agents solve operational scaling",
        "body": f"""<p>Hi Chris,</p>
<p>What3words' elegant solution to global addressing has been adopted by emergency services, logistics companies, and consumers worldwide. Turning every 3m square into a unique 3-word address is brilliant.</p>
<p>Scaling globally means operational complexity — multi-language support, partner management, content production, enterprise sales enablement. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Utility Warehouse",
        "contact": "Andrew Lindsay",
        "email": "andrew@uw.co.uk",
        "industry": "Utilities / Multi-service",
        "employees": "200",
        "subject": "One bill, multiple services — one AI workforce, multiple functions",
        "body": f"""<p>Hi Andrew,</p>
<p>Utility Warehouse's multi-service model — energy, broadband, mobile, insurance all on one bill — is a compelling proposition. The Partner network for distribution is smart.</p>
<p>Managing multiple service lines means enormous operational complexity. Customer support, Partner training, content production, compliance across services. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Vestd",
        "contact": "Ifty Nasir",
        "email": "ifty@vestd.com",
        "industry": "SaaS - Equity Management",
        "employees": "30",
        "subject": "Vestd simplifies equity — AI agents simplify your growth",
        "body": f"""<p>Hi Ifty,</p>
<p>Vestd's platform for share schemes and equity management is exactly what UK businesses need. Making EMI schemes accessible to startups and SMEs removes a massive barrier to talent retention.</p>
<p>For a 30-person team, every efficiency matters. What if AI agents handled your content marketing, customer onboarding, support documentation, and sales enablement?</p>
<p>At AfrexAI, we build autonomous agent workforces. Small teams benefit the most from AI agents. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Privitar",
        "contact": "Jason du Preez",
        "email": "jason@privitar.com",
        "industry": "SaaS - Data Privacy",
        "employees": "100",
        "subject": "Privitar protects data — AI agents protect your team's bandwidth",
        "body": f"""<p>Hi Jason,</p>
<p>Privitar's data privacy platform helps enterprises use their data safely. In a world where privacy regulations keep tightening, what you're building is essential infrastructure.</p>
<p>Scaling an enterprise SaaS means content marketing, sales enablement, customer success, and documentation all need constant attention. What if AI agents handled the execution?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "TravelPerk",
        "contact": "Avi Meir",
        "email": "avi@travelperk.com",
        "industry": "SaaS - Business Travel",
        "employees": "200",
        "subject": "TravelPerk books business travel — AI agents book your growth",
        "body": f"""<p>Hi Avi,</p>
<p>TravelPerk's all-in-one business travel platform — booking, management, compliance, sustainability — has become essential for modern businesses. The inventory and user experience set you apart.</p>
<p>At 200+ people across markets, internal operations are complex. Marketing, support, documentation, partner management. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Cezanne HR",
        "contact": "John Sherwin-Smith",
        "email": "john@cezannehr.com",
        "industry": "SaaS - HR Tech",
        "employees": "40",
        "subject": "Cezanne HR manages people — AI agents manage your operations",
        "body": f"""<p>Hi John,</p>
<p>Cezanne HR's cloud HR software for mid-sized businesses covers everything from core HR to performance management and time tracking. The modular approach lets companies pick what they need.</p>
<p>For a 40-person team serving mid-market clients, operational efficiency is critical. What if AI agents handled content marketing, customer support, documentation updates, and sales enablement?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Brightpearl",
        "contact": "Derek O'Carroll",
        "email": "derek@brightpearl.com",
        "industry": "SaaS - Retail Operations",
        "employees": "150",
        "subject": "Brightpearl automates retail ops — AI agents automate everything else",
        "body": f"""<p>Hi Derek,</p>
<p>Brightpearl's retail operations platform — combining inventory, orders, warehousing, and accounting — gives retailers the operational backbone they need. The Sage acquisition shows the value of what you've built.</p>
<p>Serving retailers at scale means your own operations need to be efficient. Marketing, support, customer success, documentation. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Unmind",
        "contact": "Nick Taylor",
        "email": "nick@unmind.com",
        "industry": "HealthTech - Mental Health",
        "employees": "100",
        "subject": "Unmind supports mental health — AI agents support your team's capacity",
        "body": f"""<p>Hi Nick,</p>
<p>Unmind's workplace mental health platform is increasingly essential. Helping employees manage their wellbeing through evidence-based tools creates real value for both people and businesses.</p>
<p>Scaling a health platform means content, customer success, clinical partnerships, and enterprise sales all need attention. What if AI agents handled the operational work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "Perkbox",
        "contact": "Saurav Sherwin-Smith",
        "email": "saurav@perkbox.com",
        "industry": "SaaS - Employee Benefits",
        "employees": "150",
        "subject": "Perkbox rewards employees — AI agents reward your ops team with time",
        "body": f"""<p>Hi Saurav,</p>
<p>Perkbox's employee benefits and engagement platform makes it easy for companies to reward and support their teams. The breadth of perks and the recognition features create genuine employee satisfaction.</p>
<p>Managing partnerships, customer success, content, and sales across multiple markets is operationally demanding. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "YuLife",
        "contact": "Sammy Rubin",
        "email": "sammy@yulife.com",
        "industry": "InsurTech - Life Insurance",
        "employees": "120",
        "subject": "YuLife gamified insurance — AI agents could gamify your operations",
        "body": f"""<p>Hi Sammy,</p>
<p>YuLife's approach to life insurance — gamifying wellbeing and rewarding healthy behaviour — is genuinely innovative. Turning an unloved product into something employees actually engage with is no small feat.</p>
<p>Scaling an insurtech means compliance, customer onboarding, content production, and partner management all at pace. What if AI agents handled the operational heavy lifting?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Spendesk",
        "contact": "Rodolphe Ardant",
        "email": "rodolphe@spendesk.com",
        "industry": "SaaS - Spend Management",
        "employees": "200",
        "subject": "Spendesk controls company spending — AI agents control operational costs",
        "body": f"""<p>Hi Rodolphe,</p>
<p>Spendesk's all-in-one spend management platform — cards, invoices, reimbursements, budgets — gives finance teams the control they need. The European focus and multi-entity support are strong differentiators.</p>
<p>At 200+ people, your internal operations need the same efficiency you give clients. Marketing, support, documentation, sales enablement. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
    {
        "company": "FreeAgent",
        "contact": "Roan Lavery",
        "email": "roan@freeagent.com",
        "industry": "SaaS - Accounting",
        "employees": "150",
        "subject": "FreeAgent simplifies accounting — AI agents simplify everything else",
        "body": f"""<p>Hi Roan,</p>
<p>FreeAgent has become the accounting software of choice for freelancers and small businesses in the UK. The NatWest backing and the Making Tax Digital readiness show real positioning.</p>
<p>Serving hundreds of thousands of small businesses means enormous support, content, and documentation needs. What if AI agents handled the operational overhead?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Coconut",
        "contact": "Adam Sherwin-Smith",
        "email": "adam@getcoconut.com",
        "industry": "SaaS - FinTech",
        "employees": "20",
        "subject": "Coconut + AI agents = freelancer finance on autopilot",
        "body": f"""<p>Hi Adam,</p>
<p>Coconut's banking and tax app for freelancers is making self-employment less stressful. Automatic tax categorization and MTD-ready filing save freelancers hours.</p>
<p>For a 20-person team, every hour matters. What if AI agents handled your content marketing, user onboarding, support triage, and documentation?</p>
<p>At AfrexAI, we build autonomous agent workforces. Small teams benefit the most. Got 30 minutes?</p>
{SIGNATURE}
{CHEERS_OFF}"""
    },
    {
        "company": "Soldo",
        "contact": "Carlo Gualandri",
        "email": "carlo@soldo.com",
        "industry": "FinTech - Expense Management",
        "employees": "200",
        "subject": "Soldo manages company spending — AI agents manage operational load",
        "body": f"""<p>Hi Carlo,</p>
<p>Soldo's integrated expense management platform — prepaid cards, real-time controls, and automated reporting — gives businesses the visibility they need over spending. The European growth has been impressive.</p>
<p>At 200+ employees across markets, internal operations are complex. Marketing, support, compliance, partner management. What if AI agents handled the repetitive work?</p>
<p>At AfrexAI, we build autonomous agent workforces. Got 30 minutes?</p>
{SIGNATURE}
{SIGN_OFF}"""
    },
]

def save_draft(to, subject, html_body):
    msg = MIMEMultipart("alternative")
    msg["From"] = f"Kalin Smolichki <{EMAIL}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))
    
    with imaplib.IMAP4_SSL(IMAP_HOST) as imap:
        imap.login(EMAIL, PASSWORD)
        imap.append("[Gmail]/Drafts", "", imaplib.Time2Internaldate(datetime.now()), msg.as_bytes())
    return True

def main():
    # Save CSV
    csv_path = "/Users/openclaw/.openclaw/workspace-main/prospects/outreach-tracker.csv"
    
    # Read existing CSV
    existing = []
    try:
        with open(csv_path, 'r') as f:
            reader = csv.reader(f)
            header = next(reader)
            existing = list(reader)
    except:
        pass
    
    with open(csv_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["company", "contact_name", "email", "industry", "employees", "status", "date"])
        for row in existing:
            writer.writerow(row)
    
    total = len(prospects)
    saved = 0
    failed = 0
    
    for i, p in enumerate(prospects):
        try:
            save_draft(p["email"], p["subject"], p["body"])
            saved += 1
            status = "drafted"
            print(f"✅ [{saved}/{total}] Draft saved: {p['company']} ({p['email']})")
            
            # Append to CSV
            with open(csv_path, 'a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    p["company"], p["contact"], p["email"],
                    p["industry"], p.get("employees", ""), status, "2026-02-13"
                ])
            
            time.sleep(0.5)  # Rate limit
            
        except Exception as e:
            failed += 1
            print(f"❌ [{i+1}/{total}] Failed: {p['company']} - {e}")
    
    print(f"\n{'='*50}")
    print(f"COMPLETE: {saved} drafts saved, {failed} failed")
    print(f"CSV updated at: {csv_path}")

if __name__ == "__main__":
    main()
