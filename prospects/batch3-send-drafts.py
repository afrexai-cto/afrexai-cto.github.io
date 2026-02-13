#!/usr/bin/env python3
"""Batch 3: Draft 20 cold emails for AfrexAI outbound prospecting - US Market"""

import smtplib
import imaplib
import email
import os
import time
import csv
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
IMAP_HOST = "imap.gmail.com"
IMAP_PORT = 993
EMAIL = "ksmolichki@afrexai.com"
APP_PASSWORD = os.environ["GMAIL_BUSINESS_APP_PASSWORD"]

SIGNATURE = """<p>Learn more and book a call at <a href="https://afrexai.com">afrexai.com</a> — and see our AI agent skills storefront <a href="https://afrexai-cto.github.io/context-packs/">here</a>.</p>
<p>Best,<br>Kalin Smolichki<br>CTO, AfrexAI</p>"""

prospects = [
    # US Marketing/Creative/PR Agencies (5)
    {
        "company": "Six Degrees Creative",
        "contact_name": "Brian Wright",
        "email": "brian@sixdegreescreative.com",
        "industry": "Marketing Agency - Experiential",
        "employees": "40",
        "subject": "AI agents for Six Degrees Creative's experiential campaigns",
        "body": """<p>Hi Brian,</p>
<p>Congrats on winning Ad Age's 2024 Gold Small Agency of the Year — and the incredible growth from a Morehouse dorm room hustle to 40 people across Atlanta, NY, and LA. The Super Bowl fashion showcases for the NFL are seriously impressive work.</p>
<p>As Six Degrees scales experiential campaigns for brands like the NFL and Doja Cat, I imagine the back-office operations — proposals, client reporting, scheduling, vendor coordination — are getting heavier. That's exactly where we help.</p>
<p>At AfrexAI, we build custom AI agent workforces for growing agencies. Think: an AI that drafts campaign briefs from client calls, auto-generates post-event reports, or handles vendor follow-ups — freeing your creative team to focus on what they do best.</p>
<p>Would love to show you what an AI agent workforce could look like for Six Degrees.</p>"""
    },
    {
        "company": "JCW Creative",
        "contact_name": "John Williams",
        "email": "john@jcwcreative.com",
        "industry": "Creative Marketing Agency",
        "employees": "30",
        "subject": "Scaling JCW Creative with AI agents",
        "body": """<p>Hi John,</p>
<p>Congratulations on making the 2024 Inc. 5000 — that's no small feat for a creative agency. I noticed JCW has built an impressive full-service team spanning content, design, photo/video, and web development.</p>
<p>With that many moving parts across creative disciplines, I'm guessing project coordination, content scheduling, and client reporting eat up a lot of your team's time. That's the kind of operational drag we eliminate.</p>
<p>At AfrexAI, we deploy custom AI agent workforces for agencies like yours. Imagine AI agents that handle content calendar management, auto-generate social media copy drafts, or compile weekly client performance reports — so your 30+ creatives stay in their zone of genius.</p>
<p>Would a quick call make sense to explore what this could look like for JCW?</p>"""
    },
    {
        "company": "KSA Marketing",
        "contact_name": "Katie Schibler Conn",
        "email": "katie@teamksa.com",
        "industry": "Integrated Marketing Agency",
        "employees": "25",
        "subject": "AI-powered ops for KSA's next growth chapter",
        "body": """<p>Hi Katie,</p>
<p>Love the KSA story — from serving PepsiCo and PlayStation in 2011 to a two-time Inc. 5000 honoree. Your "scrappy, kick-ass" approach clearly works, and I respect the honesty about the bumpy ride along the way.</p>
<p>As KSA grows across healthcare, education, and economic development, the operational complexity grows too — more clients, more campaigns, more reporting. What if you could add capacity without adding headcount?</p>
<p>AfrexAI builds custom AI agent workforces for marketing agencies. We're talking AI that handles campaign performance reporting, drafts client briefs, manages intake workflows, or even does competitive research — the repetitive stuff that steals time from strategic work.</p>
<p>Would love to show you what a "smart, scrappy" AI team could look like alongside your human one.</p>"""
    },
    {
        "company": "Ripley PR",
        "contact_name": "Heather Ripley",
        "email": "heather@ripleypr.com",
        "industry": "PR Agency - Construction/Trades",
        "employees": "15",
        "subject": "AI agents to scale Ripley PR's construction & trades coverage",
        "body": """<p>Hi Heather,</p>
<p>Saw that Ripley PR was named one of Newsweek's top agencies — well deserved given your deep specialization in construction, HVAC, plumbing, and trades PR. That niche focus is a real competitive moat.</p>
<p>Being the go-to PR firm for the trades industry means a lot of media monitoring, pitch writing, and coverage tracking across highly specific trade publications. That's exactly the kind of repetitive-but-critical work AI agents excel at.</p>
<p>At AfrexAI, we build custom AI agent workforces. For a PR firm like yours, that could mean AI agents that monitor trade media mentions in real-time, draft pitch templates personalized by outlet, or compile monthly coverage reports for clients — all without adding headcount.</p>
<p>Would a quick conversation make sense?</p>"""
    },
    {
        "company": "Cooperate Marketing",
        "contact_name": "Brian Fourman",
        "email": "brian@cooperatemarketing.com",
        "industry": "MarTech Agency",
        "employees": "30",
        "subject": "AI agents for Cooperate Marketing's martech stack",
        "body": """<p>Hi Brian,</p>
<p>Congrats on the Inc. 5000 recognition and bringing on a new CTO to level up Cooperate's tech capabilities. As a martech-focused agency, you already understand the power of automation — so this should resonate.</p>
<p>At AfrexAI, we build custom AI agent workforces that go beyond standard martech automation. Instead of just connecting tools, our agents reason, adapt, and handle complex workflows: think automated campaign audits, intelligent lead scoring that learns from your clients' data, or AI agents that handle client onboarding workflows end-to-end.</p>
<p>Given Cooperate's focus on bespoke marketing technology solutions, I think there's a natural fit — both for your internal operations and potentially as a service you offer clients.</p>
<p>Worth a 15-minute call to explore?</p>"""
    },

    # US SaaS Startups (5)
    {
        "company": "Stainless",
        "contact_name": "Alex Rattray",
        "email": "alex@stainlessapi.com",
        "industry": "SaaS - API Platform",
        "employees": "30",
        "subject": "AI agent workforce for Stainless's scaling ops",
        "body": """<p>Hi Alex,</p>
<p>Stainless caught my eye — building the platform for high-quality APIs, backed by a16z and Sequoia with a $25M Series A. As someone building developer tools myself, I appreciate the craft that goes into great API design.</p>
<p>Post-Series A is typically when operational complexity explodes: more customers, more support tickets, more internal coordination. That's exactly where AfrexAI comes in.</p>
<p>We build custom AI agent workforces for SaaS companies. For a developer tools company like Stainless, that could mean AI agents handling technical support triage, auto-generating API documentation updates from code changes, or managing customer onboarding sequences — all running 24/7.</p>
<p>Would love to chat about how AI agents could help Stainless scale without the usual growing pains.</p>"""
    },
    {
        "company": "Listen Labs",
        "contact_name": "Team",
        "email": "hello@listenlabs.ai",
        "industry": "SaaS - AI Market Research",
        "employees": "25",
        "subject": "AI agents to supercharge Listen Labs operations",
        "body": """<p>Hi there,</p>
<p>Listen Labs' mission resonates — making deep customer conversations fast and scalable with AI. The $27M Sequoia-backed Series A says a lot about the opportunity you're chasing.</p>
<p>As an AI-first company yourselves, you'll appreciate this: at AfrexAI, we build custom AI agent workforces that handle the operational side of scaling. Not the product — the business around it. Think AI agents that manage customer success workflows, handle billing inquiries, compile investor reports, or coordinate hiring pipelines.</p>
<p>The irony of AI companies still doing operations manually is real. We fix that.</p>
<p>Happy to show you what an AI agent workforce looks like in practice.</p>"""
    },
    {
        "company": "Pogo",
        "contact_name": "Team",
        "email": "hello@joinpogo.com",
        "industry": "FinTech - Consumer Data",
        "employees": "30",
        "subject": "AI agent workforce for Pogo's growth phase",
        "body": """<p>Hi there,</p>
<p>2M+ users and engagement on par with Instagram — that's a serious consumer product. Pogo's mission to help people earn and save by unlocking their data power is compelling, and the Series A backing from 20VC and Josh Buckley validates the traction.</p>
<p>At this stage, I imagine the ops demands are intense: user support at scale, compliance workflows, partner management, internal reporting. That's where AfrexAI comes in.</p>
<p>We build custom AI agent workforces — AI that handles user support triage, automates compliance documentation, generates investor/board reports, and manages vendor follow-ups. All running continuously, no breaks, no burnout.</p>
<p>Would love to explore how AI agents could help Pogo scale operations as fast as you're scaling users.</p>"""
    },
    {
        "company": "Consulting IQ",
        "contact_name": "Team",
        "email": "info@consultingiq.ai",
        "industry": "SaaS - AI Consulting Platform",
        "employees": "20",
        "subject": "AI agents to power Consulting IQ's own operations",
        "body": """<p>Hi there,</p>
<p>Loved the Business Insider piece about Consulting IQ positioning as AI-powered boutique consulting for SMBs — disrupting the McKinseys of the world. Bold move, and clearly well-timed.</p>
<p>Here's the meta pitch: as you build AI consulting for others, AfrexAI can build the AI agent workforce that runs YOUR operations. Customer onboarding, support ticket handling, content generation for marketing, sales follow-up sequences — all handled by purpose-built AI agents.</p>
<p>We're essentially the back-office AI team so your human team can focus on product and growth. Would love to compare notes on what we're each building.</p>"""
    },
    {
        "company": "Perceptis AI",
        "contact_name": "Team",
        "email": "hello@perceptis.ai",
        "industry": "SaaS - AI Consulting",
        "employees": "25",
        "subject": "AI agent workforce for Perceptis AI's scaling",
        "body": """<p>Hi there,</p>
<p>The $3.6M raise and the thesis that boutique consulting firms powered by AI are growing 2-3x faster than McKinsey/BCG/Bain — that's a narrative I believe in deeply. We're building something complementary at AfrexAI.</p>
<p>While Perceptis focuses on AI-powered consulting delivery, we build custom AI agent workforces for the operational side: the scheduling, reporting, client communication, billing, and coordination that every growing firm struggles with.</p>
<p>Think of it as AI consultants for the consulting firm's own operations. Would love to explore synergies.</p>"""
    },

    # US Professional Services (5)
    {
        "company": "Founder's CPA",
        "contact_name": "Curt Mastio",
        "email": "curt@founderscpa.com",
        "industry": "Accounting - Startup Focused",
        "employees": "20",
        "subject": "AI agents for Founder's CPA — from a fellow startup builder",
        "body": """<p>Hi Curt,</p>
<p>Fellow startup ecosystem person here. Love what you've built at Founder's CPA — serving 200+ startups that have collectively raised $200M+, plus mentoring at Techstars Chicago and Iowa. The Northwestern adjunct teaching is a nice touch too.</p>
<p>Here's what I've noticed about growing CPA firms: the client work scales linearly with headcount, but the admin overhead — client onboarding, document collection, follow-up emails, report generation — can be automated dramatically with AI agents.</p>
<p>At AfrexAI, we build custom AI agent workforces. For an accounting firm, that means AI that handles client document collection workflows, auto-generates financial report drafts, manages tax deadline reminders, and handles routine client inquiries. Your CPAs focus on advisory; the AI handles the operational machinery.</p>
<p>As someone who teaches entrepreneurship, I think you'd find our approach interesting. Quick call?</p>"""
    },
    {
        "company": "Shay CPA",
        "contact_name": "Akshay Shrimanker",
        "email": "akshay@shaycpa.com",
        "industry": "Accounting - Tech Startups",
        "employees": "15",
        "subject": "AI agents for Shay CPA — built for tech-forward firms",
        "body": """<p>Hi Akshay,</p>
<p>Congrats on the NYSSCPA Forty Under 40 award — well deserved. Shay CPA's focus on tech startups from Y Combinator, Techstars, and 500 Startups graduates is a great niche, and the hands-on approach clearly resonates with founders.</p>
<p>As a CPA firm that works exclusively with tech companies, you already understand the power of automation. But there's a gap between using cloud tools and having AI that actually handles workflows end-to-end.</p>
<p>AfrexAI builds custom AI agent workforces. For Shay CPA, that could mean AI agents that handle client document intake, chase missing receipts/statements, draft quarterly financial summaries, or manage tax deadline workflows across your entire client base — simultaneously.</p>
<p>Your tech-founder clients would love knowing their CPA firm practices what it preaches. Interested in a quick demo?</p>"""
    },
    {
        "company": "Reid Collins & Tsai",
        "contact_name": "Lisa Tsai",
        "email": "ltsai@reidcollins.com",
        "industry": "Law Firm - Litigation Boutique",
        "employees": "50",
        "subject": "AI agent workforce for Reid Collins & Tsai",
        "body": """<p>Hi Lisa,</p>
<p>Your insights on talent retention for boutique law firms in the Lawdragon interview were spot-on — culture is everything when competing against BigLaw compensation. Building a firm where top litigators want to stay is a real achievement.</p>
<p>One way boutique firms can punch above their weight: AI agent workforces that handle the operational burden. At AfrexAI, we build custom AI agents for professional services firms. For a litigation boutique, that means AI handling document review triage, case research summarization, client communication drafts, billing review, and scheduling — freeing your litigators to focus on what they're actually great at.</p>
<p>The talent retention angle is real too: lawyers who spend less time on admin are happier lawyers. Would love to explore this with you.</p>"""
    },
    {
        "company": "Ignyte Group",
        "contact_name": "Team",
        "email": "info@ignytegroup.com",
        "industry": "Management Consulting",
        "employees": "30",
        "subject": "AI agent workforce for Ignyte Group's consulting operations",
        "body": """<p>Hi there,</p>
<p>Ignyte Group's combination of design thinking, tech-forward approach, and classical data-driven consulting is exactly the kind of modern firm that should be leveraging AI agents for operations.</p>
<p>At AfrexAI, we build custom AI agent workforces for consulting firms. Think: AI agents that handle proposal drafting, client deliverable formatting, research compilation, time tracking reminders, and project status reporting — all the operational overhead that pulls consultants away from billable, high-value work.</p>
<p>For a firm based in DC serving government and enterprise clients, the efficiency gains translate directly to margins and competitiveness. Worth a conversation?</p>"""
    },
    {
        "company": "The Keystone Group",
        "contact_name": "Team",
        "email": "info@thekeystonegroup.com",
        "industry": "Management Consulting - M&A",
        "employees": "40",
        "subject": "AI agents for Keystone Group's deal operations",
        "body": """<p>Hi there,</p>
<p>Keystone's focus on operational diligence through integration planning and execution for M&A deals is fascinating — it's some of the most complex, time-pressured work in consulting.</p>
<p>That intensity is exactly where AI agent workforces add the most value. At AfrexAI, we build custom AI agents for professional services firms. For M&A consulting, imagine AI agents that compile due diligence checklists, track integration milestones across workstreams, auto-generate status reports for deal teams, and manage the mountain of coordination that every deal requires.</p>
<p>Your consultants focus on the strategic decisions; our AI agents handle the operational machinery. Would love to explore this.</p>"""
    },

    # US Construction/Trades (5)
    {
        "company": "Mechanical One",
        "contact_name": "Jason James",
        "email": "jason@mechanicalone.com",
        "industry": "HVAC/Plumbing/Electrical",
        "employees": "50",
        "subject": "AI agents to fuel Mechanical One's Inc. 5000 growth",
        "body": """<p>Hi Jason,</p>
<p>Making the Inc. 5000 list for a company founded in 2021 is remarkable — and the expansion from plumbing into HVAC, gas, and electrical shows serious strategic vision. Central Florida is a great market for home services.</p>
<p>Here's the challenge every fast-growing trades company hits: the back-office can't keep up. Scheduling, dispatching, customer follow-ups, invoice chasing, review requests — it all piles up. That's exactly what AI agents solve.</p>
<p>At AfrexAI, we build custom AI agent workforces for trades companies. For Mechanical One, that could mean AI agents that handle appointment scheduling and confirmations, send automated post-service review requests, chase outstanding invoices, manage parts ordering workflows, and handle after-hours customer inquiries — 24/7, no overtime.</p>
<p>Would love to show you what this looks like in practice.</p>"""
    },
    {
        "company": "MVP Builders",
        "contact_name": "Meir Vatury",
        "email": "meir@mvp-builders.com",
        "industry": "Construction - Residential Remodeling",
        "employees": "40",
        "subject": "AI agents to scale MVP Builders' operations",
        "body": """<p>Hi Meir,</p>
<p>Moving up on the Inc. 5000 list year over year while expanding from LA to San Jose — that's impressive growth for a residential construction company. Kitchen remodels, ADUs, bathroom renovations — the demand is clearly there.</p>
<p>With multi-location operations and a full service lineup, the coordination complexity must be significant: estimating, scheduling crews, managing permits, client communication, subcontractor coordination. That's where AI agents make a massive difference.</p>
<p>At AfrexAI, we build custom AI agent workforces for construction companies. Think AI that handles lead follow-up within minutes, automates permit status tracking, sends project milestone updates to homeowners, manages subcontractor scheduling, and compiles job costing reports — all without adding office staff.</p>
<p>Would a quick call make sense to explore this?</p>"""
    },
    {
        "company": "Troyer Post Buildings",
        "contact_name": "Tim Troyer",
        "email": "tim@troyerpostbuildings.com",
        "industry": "Construction - Post Frame Buildings",
        "employees": "35",
        "subject": "AI agents for Troyer Post Buildings' Inc. 5000 scaling",
        "body": """<p>Hi Tim,</p>
<p>Congrats on the Inc. 5000 recognition — growing from a farming-focused post frame builder to commercial and residential projects is a great evolution. The Troyer brothers clearly know how to build (pun intended).</p>
<p>As the project volume grows across farming, commercial, and residential, I imagine the operational side gets heavier: estimating, scheduling, customer communication, material ordering, permit tracking. That's exactly where AI agents come in.</p>
<p>At AfrexAI, we build custom AI agent workforces for construction companies. For Troyer Post Buildings, that could mean AI handling lead qualification and follow-up, auto-generating preliminary estimates, managing project timelines, sending customer updates, and tracking material orders — all running 24/7.</p>
<p>Would love to show you how AI can help Troyer scale operations as fast as you're scaling projects.</p>"""
    },
    {
        "company": "The Brand Agency",
        "contact_name": "Priscila Martinez",
        "email": "priscila@thebrandagency.com",
        "industry": "PR & Creative Communications",
        "employees": "20",
        "subject": "AI agents for The Brand Agency's growing client roster",
        "body": """<p>Hi Priscila,</p>
<p>Congrats on making Inc.'s 2024 Female Founders List and Ragan's Top Women in Communications — that's a powerful double recognition. The Brand Agency's award-winning PR and creative communications work clearly speaks for itself.</p>
<p>As the agency grows and the client roster expands, the operational demands grow too: media list management, pitch customization, coverage tracking, reporting, and client communication. AI agents can handle all of that.</p>
<p>At AfrexAI, we build custom AI agent workforces for PR and marketing agencies. Think AI that monitors media coverage in real-time, auto-generates personalized pitch drafts, compiles client reports, and manages media relationship databases — so your team focuses on strategy and creative.</p>
<p>Would love to explore what an AI agent team could look like for The Brand Agency.</p>"""
    },
    {
        "company": "Yes&",
        "contact_name": "Robert Sprague",
        "email": "robert@yesandagency.com",
        "industry": "Marketing Agency",
        "employees": "50",
        "subject": "AI agents for Yes& — 6x Inc. 5000 deserves 6x efficiency",
        "body": """<p>Hi Robert,</p>
<p>Six times on the Inc. 5000 — that's not a fluke, that's a system. Yes&'s "positivity + possibility" philosophy clearly creates sustained growth, and the consistency is what stands out most.</p>
<p>After six years of rapid growth, I'd wager the operational complexity has grown just as fast. More clients, more campaigns, more coordination across teams. What if AI agents could handle the operational overhead so your team stays focused on the creative and strategic work that drives growth?</p>
<p>At AfrexAI, we build custom AI agent workforces for agencies. Think AI that handles project status reporting, client brief intake, competitive research, meeting note summaries, and campaign performance dashboards — all automated, running continuously.</p>
<p>For a six-time Inc. 5000 agency, the ROI conversation is straightforward. Worth a quick call?</p>"""
    },
]

def save_as_draft(to_email, subject, html_body):
    """Save email as draft in Gmail via IMAP"""
    msg = MIMEMultipart('alternative')
    msg['From'] = f"Kalin Smolichki <{EMAIL}>"
    msg['To'] = to_email
    msg['Subject'] = subject
    
    full_html = f"""<html><body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
{html_body}
{SIGNATURE}
</body></html>"""
    
    msg.attach(MIMEText(full_html, 'html'))
    
    # Connect to IMAP and save as draft
    imap = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
    imap.login(EMAIL, APP_PASSWORD)
    imap.append('[Gmail]/Drafts', '', imaplib.Time2Internaldate(time.time()), msg.as_bytes())
    imap.logout()
    return True

def append_to_tracker(prospect, date_str):
    """Append prospect to CSV tracker"""
    tracker_path = "prospects/outreach-tracker.csv"
    with open(tracker_path, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            prospect['company'],
            prospect['contact_name'],
            prospect['email'],
            prospect['industry'],
            prospect['employees'],
            'drafted',
            date_str
        ])

if __name__ == "__main__":
    date_str = datetime.now().strftime('%Y-%m-%d')
    success = 0
    failed = 0
    
    for i, p in enumerate(prospects):
        try:
            print(f"[{i+1}/20] Drafting email for {p['company']} ({p['contact_name']})...")
            save_as_draft(p['email'], p['subject'], p['body'])
            append_to_tracker(p, date_str)
            success += 1
            print(f"  ✓ Draft saved")
            time.sleep(1)  # Rate limiting
        except Exception as e:
            print(f"  ✗ Failed: {e}")
            failed += 1
    
    print(f"\nDone! {success} drafts saved, {failed} failed.")
