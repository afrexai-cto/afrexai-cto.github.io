#!/usr/bin/env python3
"""
Batch 2: Draft 20 cold outreach emails for AfrexAI and save as Gmail drafts via IMAP.
"""
import imaplib
import email
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import time
import csv
import os
from datetime import datetime

GMAIL_USER = "ksmolichki@afrexai.com"
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_BUSINESS_APP_PASSWORD", "umkt zejr mzds yneu")

SIGNATURE = """<p>Learn more and book a call at <a href="https://afrexai.com">afrexai.com</a> — and see our AI agent skills storefront <a href="https://afrexai-cto.github.io/context-packs/">here</a>.</p>
<p>Best,<br>Kalin Smolichki<br>CTO, AfrexAI</p>"""

prospects = [
    {
        "company": "Squibble",
        "contact": "Kim Leary",
        "email": "kim@squibble.design",
        "industry": "Design & Digital Agency",
        "employees": 20,
        "subject": "Squibble's BIMA 100 recognition — what's next?",
        "body": """<p>Hi Kim,</p>
<p>Congratulations on making the BIMA 100 most influential list — well deserved given what you've built with Squibble since 2010. Growing a strategy-led design agency in Birmingham while co-founding the Midlands Marketing Awards takes serious operational bandwidth.</p>
<p>I'm curious: as you scale the team and take on more client work, how much time goes into the ops side — proposals, project scheduling, client comms, invoicing? At AfrexAI, we build custom AI agents that automate exactly those back-office tasks for agencies like yours, typically saving 15-20 hours per week.</p>
<p>Would a 30-minute call be worth it to explore what that could look like for Squibble?</p>"""
    },
    {
        "company": "The Social Shepherd",
        "contact": "Jack Shepherd",
        "email": "jack@thesocialshepherd.com",
        "industry": "Social Media Agency",
        "employees": 70,
        "subject": "Scaling from 2 to 70 — where's the ops bottleneck?",
        "body": """<p>Hi Jack,</p>
<p>Growing The Social Shepherd from you and Zoe to a 70-person agency working with Premier Inn and easyJet is a remarkable trajectory. Moving into the Bath HQ must have been a milestone moment.</p>
<p>At that scale, I'd imagine campaign reporting, client onboarding, and internal coordination eat up a lot of your team's time. At AfrexAI, we build AI agents that handle exactly those repetitive workflows — think automated reporting, brief intake, scheduling — so your team can focus on the creative work that wins clients.</p>
<p>Worth a 30-minute chat to see if there's a fit?</p>"""
    },
    {
        "company": "Rise at Seven",
        "contact": "Carrie Rose",
        "email": "carrie@riseatseven.com",
        "industry": "SEO & Content Agency",
        "employees": 100,
        "subject": "Rise at Seven's US launch — automating the back office",
        "body": """<p>Hi Carrie,</p>
<p>Scaling Rise at Seven to 100+ staff across 3 UK offices while preparing a US launch is no small feat. The creative and search-first approach clearly resonates — your work with Game alone speaks volumes.</p>
<p>When agencies hit your stage of growth, we typically see the back-office become the bottleneck: HR processes, cross-office coordination, proposal generation, client reporting. At AfrexAI, we build AI agents that automate these workflows so your team stays focused on what made you famous — the creative work.</p>
<p>Could a quick 30-minute call make sense to explore what AI automation could do for Rise at Seven's ops?</p>"""
    },
    {
        "company": "Gripped",
        "contact": "Ben Crouch",
        "email": "ben@gripped.io",
        "industry": "B2B Marketing Agency",
        "employees": 33,
        "subject": "Gripped: B2B SaaS expertise meets AI-powered ops",
        "body": """<p>Hi Ben,</p>
<p>I've been looking at what you and Steve have built with Gripped — a B2B marketing agency purpose-built for SaaS and tech companies. Having co-founders with real CMO/CPO experience inside SaaS companies gives you a massive edge.</p>
<p>Given you serve the very companies building automation tools, I'd imagine you appreciate when someone applies the same thinking to agency ops. At AfrexAI, we build custom AI agents that handle lead qualification, proposal drafting, reporting, and client onboarding — the repetitive work that slows down a 33-person team.</p>
<p>Worth 30 minutes to see what we could automate for Gripped?</p>"""
    },
    {
        "company": "GA Agency",
        "contact": "Guido Ampollini",
        "email": "guido@ga.agency",
        "industry": "International Digital Marketing",
        "employees": 40,
        "subject": "GA Agency's global growth — and the ops to support it",
        "body": """<p>Hi Guido,</p>
<p>Making the Agency Hackers Top 50 leaders list is a great recognition of GA Agency's growth. Running an international digital agency with paid media, organic, and strategy across multiple markets generates a lot of operational complexity.</p>
<p>We work with agencies like yours to automate the ops that don't scale well with headcount — multi-market reporting, client comms, campaign brief processing, invoicing. Our AI agents plug into your existing tools and handle the grunt work, typically saving 15-20 hours per week across the team.</p>
<p>Fancy a 30-minute call to explore what that could look like?</p>"""
    },
    {
        "company": "Make Agency",
        "contact": "Tom Witcherley",
        "email": "tom@makeagency.co.uk",
        "industry": "Digital Agency",
        "employees": 30,
        "subject": "Make Agency — less admin, more making",
        "body": """<p>Hi Tom,</p>
<p>I came across Make Agency and was impressed by the blend of data-led performance and creative strategy — it's clear you've built something that stands apart from the Farringdon crowd.</p>
<p>For agencies in the 20-50 person range, the operational overhead of project management, reporting, and client admin can quietly consume 30%+ of the team's time. At AfrexAI, we build custom AI agents that automate these repetitive tasks — so your team spends more time making and less time administrating.</p>
<p>Would a 30-minute call be worth exploring?</p>"""
    },
    {
        "company": "Sagefrog Marketing Group",
        "contact": "Mark Schmukler",
        "email": "mark@sagefrog.com",
        "industry": "B2B Marketing Agency",
        "employees": 30,
        "subject": "35 years in B2B marketing — ready for AI-powered ops?",
        "body": """<p>Hi Mark,</p>
<p>With 35+ years of B2B marketing and consulting experience and a Google Certified Business Trainer credential, you've seen every evolution of the marketing industry. Sagefrog's focus on B2B brands puts you in the perfect position to appreciate what's coming next.</p>
<p>The agencies that pull ahead in 2026 will be the ones that apply AI internally — not just for clients. At AfrexAI, we build custom AI agents that handle proposal generation, campaign reporting, lead qualification, and client onboarding. Think of it as giving your team a tireless operations assistant.</p>
<p>Worth a quick 30-minute call to explore what this could mean for Sagefrog?</p>"""
    },
    {
        "company": "Disruptive Advertising",
        "contact": "Jacob Baadsgaard",
        "email": "jacob@disruptiveadvertising.com",
        "industry": "PPC & Digital Advertising Agency",
        "employees": 150,
        "subject": "Disruptive Advertising at 150 people — where AI fits",
        "body": """<p>Hi Jacob,</p>
<p>Building Disruptive Advertising to 150 people and $51M in revenue from Pleasant Grove, Utah is genuinely impressive. At that scale, the operational machinery — client reporting, team coordination, QA, billing — becomes its own challenge.</p>
<p>At AfrexAI, we build custom AI agents for companies at exactly your stage. Think automated campaign reporting, client onboarding workflows, internal knowledge bases that actually work, and smart scheduling across teams. Our clients typically reclaim 20+ hours per week in operational time.</p>
<p>Would 30 minutes be worth it to see if there's a quick win for Disruptive?</p>"""
    },
    {
        "company": "Ignition Law",
        "contact": "Alex McPherson",
        "email": "alex@ignitionlaw.com",
        "industry": "Legal - Law Firm",
        "employees": 40,
        "subject": "Ignition Law + AI agents = less admin, more client work",
        "body": """<p>Hi Alex,</p>
<p>What you've built with Ignition Law since 2015 — a full-service firm focused on startups and scale-ups with pragmatic, cost-effective services — is exactly the kind of firm that should be leading on operational efficiency.</p>
<p>Law firms like yours typically lose 25-30% of billable capacity to admin: client intake, document prep, scheduling, follow-ups, billing. At AfrexAI, we build custom AI agents that automate these workflows — so your lawyers spend more time on client work and less on paperwork.</p>
<p>Worth a 30-minute call to explore what this could free up for Ignition Law?</p>"""
    },
    {
        "company": "ClickSlice",
        "contact": "Joshua George",
        "email": "joshua@clickslice.co.uk",
        "industry": "SEO & eCommerce Agency",
        "employees": 20,
        "subject": "ClickSlice's evolution from SEO to full eCommerce — and the ops to match",
        "body": """<p>Hi Joshua,</p>
<p>I saw ClickSlice just expanded from a pure SEO agency into full-service eCommerce growth in 2024. That's a big shift — more service lines, more client touchpoints, more operational complexity to manage.</p>
<p>At AfrexAI, we build AI agents specifically for agencies going through this kind of growth. Think automated client onboarding, SEO reporting that writes itself, proposal generation, and smart task routing across your expanded team. It's like hiring an ops manager who never sleeps.</p>
<p>Fancy a 30-minute call to see if there's a fit?</p>"""
    },
    {
        "company": "Charle Agency",
        "contact": "Nic Dunn",
        "email": "nic@charle.co.uk",
        "industry": "Shopify eCommerce Agency",
        "employees": 20,
        "subject": "Charle Agency — automating the ops behind Shopify Plus",
        "body": """<p>Hi Nic,</p>
<p>As a Shopify Plus accredited agency, Charle is clearly doing high-level eCommerce work for ambitious brands. The masterclasses and free guides show you're investing in the long game — building authority, not just billing hours.</p>
<p>The challenge for agencies like Charle is that Shopify builds scale beautifully for your clients, but your own internal ops often don't. At AfrexAI, we build custom AI agents to handle project scoping, client communication, QA checklists, and invoicing — the work that scales linearly with each new client.</p>
<p>Would a 30-minute call make sense to explore what we could automate?</p>"""
    },
    {
        "company": "Heur",
        "contact": "Chris Nawrocki",
        "email": "chris@heur.co.uk",
        "industry": "eCommerce Growth Agency",
        "employees": 25,
        "subject": "Heur's eCommerce Awards win — scaling the ops to match",
        "body": """<p>Hi Chris,</p>
<p>Congratulations on winning Best eCommerce Agency (under 30 employees) — and on what you and Chris Raven have built since founding Heur in 2019. Fractional leadership and holistic growth strategy is a smart positioning for D2C brands.</p>
<p>When you're offering fractional CMO services, every hour your team spends on internal admin is an hour not spent on client strategy. At AfrexAI, we build AI agents that automate the operational side — audit workflows, client reporting, scheduling, brief intake — so your team stays focused on the high-value advisory work.</p>
<p>Worth 30 minutes to see what we could free up for Heur?</p>"""
    },
    {
        "company": "Sphere Digital Recruitment",
        "contact": "Ed Steer",
        "email": "ed@spheredigitalrecruitment.com",
        "industry": "Recruitment Agency",
        "employees": 50,
        "subject": "Sphere Digital Recruitment — AI agents for recruiter productivity",
        "body": """<p>Hi Ed,</p>
<p>Building Sphere into a specialist digital recruitment agency that wins Best Small Company awards is impressive. Recruitment is one of the industries where operational efficiency directly translates to revenue — every minute a recruiter spends on admin is a minute not spent placing candidates.</p>
<p>At AfrexAI, we build custom AI agents that handle candidate screening, interview scheduling, client briefs, CRM updates, and follow-up emails. For recruitment firms, we've seen this free up 20-30% of each recruiter's time — time that goes straight back into billings.</p>
<p>Would a 30-minute call be worth exploring?</p>"""
    },
    {
        "company": "Directive",
        "contact": "Garrett Mehrguth",
        "email": "garrett@directiveconsulting.com",
        "industry": "SaaS Performance Marketing",
        "employees": 100,
        "subject": "Directive at $20M — where AI agents fit into the stack",
        "body": """<p>Hi Garrett,</p>
<p>What you've built with Directive is exactly what the SaaS marketing world needed — moving from vanity MQLs to qualified pipeline. The Customer Generation methodology is smart, and the growth to $20M+ in revenue and 100+ people proves the market agrees.</p>
<p>At that scale, I'd bet the operational overhead is significant: multi-client reporting, campaign QA, onboarding, billing reconciliation. At AfrexAI, we build custom AI agents for exactly these workflows — automating the repetitive ops so your team stays focused on the strategy and execution that drives client results.</p>
<p>Would 30 minutes be worth it to explore a quick win?</p>"""
    },
    {
        "company": "eComOne",
        "contact": "Richard Hill",
        "email": "richard@ecomone.com",
        "industry": "eCommerce Growth Agency",
        "employees": 20,
        "subject": "eComOne's growth — and the ops behind it",
        "body": """<p>Hi Richard,</p>
<p>I've been following eComOne's journey and the eCommerce growth work you're doing. As a CEO and founder driving $4M+ in revenue with a focused team, you know that every operational inefficiency hits your margins directly.</p>
<p>At AfrexAI, we build custom AI agents that handle the ops that don't need a human — client reporting, proposal drafts, campaign monitoring alerts, scheduling, and follow-ups. For eCommerce agencies, this typically frees up 15-20 hours per week across the team.</p>
<p>Worth a 30-minute call to see what quick wins might be there for eComOne?</p>"""
    },
    {
        "company": "Ironpaper",
        "contact": "Jonathan Franchell",
        "email": "jonathan@ironpaper.com",
        "industry": "B2B Growth Agency",
        "employees": 30,
        "subject": "Ironpaper's B2B growth engine — with AI-powered ops",
        "body": """<p>Hi Jonathan,</p>
<p>Twenty years running Ironpaper — from founding in NYC in 2003 to becoming a HubSpot Diamond Partner focused on B2B growth — that's serious staying power in an industry where agencies come and go every year.</p>
<p>With complex B2B sales cycles, your team likely manages a heavy operational load: lead nurturing sequences, reporting across multiple client accounts, content workflows, and CRM hygiene. At AfrexAI, we build AI agents that automate exactly these workflows — think of it as an ops layer that makes your HubSpot stack even more powerful.</p>
<p>Worth a 30-minute call to explore the possibilities?</p>"""
    },
    {
        "company": "Cyber Command",
        "contact": "Reade Taylor",
        "email": "reade@cybercommand.com",
        "industry": "IT Managed Services",
        "employees": 30,
        "subject": "Cyber Command — from IBM engineer to MSP owner. AI for the ops?",
        "body": """<p>Hi Reade,</p>
<p>Going from IBM Internet Security Systems engineer to founding Cyber Command in Orlando shows you understand what businesses actually need from their IT partner — not just tech talk, but reliable support they can count on.</p>
<p>MSPs like Cyber Command deal with a huge volume of tickets, client onboarding, documentation, and monitoring alerts. At AfrexAI, we build custom AI agents that handle ticket triage, client communication, documentation updates, and routine monitoring — so your engineers focus on the complex problems that need a human touch.</p>
<p>Would 30 minutes be worth it to see how AI agents could help Cyber Command scale?</p>"""
    },
    {
        "company": "Hallam",
        "contact": "Jake Third",
        "email": "jake@hallam.agency",
        "industry": "Digital Marketing Agency",
        "employees": 50,
        "subject": "Hallam's move to employee ownership — and what AI can do next",
        "body": """<p>Hi Jake,</p>
<p>Congratulations on Hallam's transition to employee ownership — that's a bold and exciting move for Nottingham's most-awarded digital agency. Three consecutive Grand Prix wins and now an ownership model that empowers your team. That's culture done right.</p>
<p>With employee ownership, operational efficiency directly benefits everyone on the team. At AfrexAI, we build custom AI agents that automate reporting, client onboarding, brief processing, and internal workflows — freeing your 50+ specialists to do what they do best while boosting margins that now flow back to the team.</p>
<p>Worth a 30-minute call to explore what AI automation could mean for Hallam's next chapter?</p>"""
    },
    {
        "company": "Funnel Boost Media",
        "contact": "Ryan Duncan",
        "email": "ryan@funnelboostmedia.com",
        "industry": "Digital Marketing & Lead Generation",
        "employees": 30,
        "subject": "Funnel Boost Media — AI agents to boost your own ops",
        "body": """<p>Hi Ryan,</p>
<p>As a veteran-owned marketing and lead generation company in San Antonio, Funnel Boost Media clearly knows how to generate results for local businesses. Your focus on revenue-driven SEO, PPC, and CRO is exactly the kind of measurable approach that wins long-term clients.</p>
<p>Here's a thought: you help your clients generate leads more efficiently. What if you could do the same for your own operations? At AfrexAI, we build custom AI agents that handle client reporting, lead processing, proposal generation, and scheduling — the operational work that scales linearly with every new client you take on.</p>
<p>Worth a 30-minute call to see what we could automate?</p>"""
    },
    {
        "company": "The SEO Works",
        "contact": "Ben Foster",
        "email": "ben@seoworks.co.uk",
        "industry": "Digital Growth Agency",
        "employees": 80,
        "subject": "The SEO Works goes employee-owned — AI to supercharge the next chapter",
        "body": """<p>Hi Ben,</p>
<p>Huge congratulations on The SEO Works' move to employee ownership. Growing from a Sheffield startup in 2009 to one of the North's leading digital growth agencies with 80+ people — and now giving that team ownership — is a fantastic story.</p>
<p>With employee ownership, every efficiency gain benefits the whole team directly. At AfrexAI, we build custom AI agents that automate campaign reporting, client onboarding, internal knowledge management, and scheduling across large teams. For an 80-person agency, we typically find 30-40+ hours per week of automatable work.</p>
<p>Would 30 minutes be worth it to explore what AI could do for The SEO Works' margins — margins that now flow directly to your team?</p>"""
    },
]

def save_draft(imap_conn, to_email, subject, html_body):
    """Save an email as a draft in Gmail via IMAP."""
    msg = MIMEMultipart('alternative')
    msg['From'] = GMAIL_USER
    msg['To'] = to_email
    msg['Subject'] = subject
    msg['Date'] = email.utils.formatdate(localtime=True)
    
    full_html = f"""<html><body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
{html_body}
{SIGNATURE}
</body></html>"""
    
    msg.attach(MIMEText(full_html, 'html'))
    
    # Append to Gmail Drafts
    result = imap_conn.append(
        '[Gmail]/Drafts',
        '\\Draft',
        imaplib.Time2Internaldate(time.time()),
        msg.as_bytes()
    )
    return result

def main():
    print(f"Connecting to Gmail IMAP as {GMAIL_USER}...")
    imap = imaplib.IMAP4_SSL('imap.gmail.com')
    imap.login(GMAIL_USER, GMAIL_APP_PASSWORD)
    print("Connected successfully.")
    
    success_count = 0
    failed = []
    
    for i, p in enumerate(prospects):
        try:
            result = save_draft(imap, p['email'], p['subject'], p['body'])
            status = result[0]
            if status == 'OK':
                print(f"  [{i+1}/20] ✅ Draft saved: {p['company']} ({p['contact']} <{p['email']}>)")
                success_count += 1
            else:
                print(f"  [{i+1}/20] ❌ Failed: {p['company']} — {result}")
                failed.append(p['company'])
        except Exception as e:
            print(f"  [{i+1}/20] ❌ Error: {p['company']} — {e}")
            failed.append(p['company'])
        time.sleep(0.5)
    
    imap.logout()
    print(f"\nDone: {success_count}/20 drafts saved. Failed: {failed if failed else 'None'}")
    
    # Append to tracker CSV
    tracker_path = os.path.join(os.path.dirname(__file__), 'outreach-tracker.csv')
    with open(tracker_path, 'a', newline='') as f:
        writer = csv.writer(f)
        for p in prospects:
            if p['company'] not in failed:
                writer.writerow([
                    p['company'],
                    p['contact'],
                    p['email'],
                    p['industry'],
                    p['employees'],
                    'drafted',
                    datetime.now().strftime('%Y-%m-%d')
                ])
    print(f"Tracker updated at {tracker_path}")

if __name__ == '__main__':
    main()
