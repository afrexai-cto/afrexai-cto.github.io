#!/usr/bin/env python3
"""Save follow-up email drafts for construction and legal prospects."""
import imaplib, os, sys, json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone

IMAP_HOST = "imap.gmail.com"
EMAIL = "ksmolichki@afrexai.com"
PASSWORD = os.environ["GMAIL_BUSINESS_APP_PASSWORD"]

def save_draft(to, subject, html_body):
    msg = MIMEMultipart("alternative")
    msg["From"] = f"Kalin Smolichki <{EMAIL}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))
    with imaplib.IMAP4_SSL(IMAP_HOST) as imap:
        imap.login(EMAIL, PASSWORD)
        imap.append("[Gmail]/Drafts", "", imaplib.Time2Internaldate(datetime.now(timezone.utc)), msg.as_bytes())
    print(f"✅ Draft saved for {to} — {subject}")

SIGN_OFF = """<p>Best,<br>
Kalin Smolichki<br>
CTO, AfrexAI</p>"""

FOOTER = """<p>Learn more at <a href="https://afrexai.com">afrexai.com</a></p>"""

# NOTE: These video titles were requested but not found on YouTube.
# Using [VIDEO_TITLE_PLACEHOLDER] format — replace with actual URLs once published.
# Recommended: search AfrexAI YouTube channel or create these videos first.
VIDEO_CONSTRUCTION_1 = "https://www.youtube.com/results?search_query=7+ways+construction+contractors+AI"  # placeholder
VIDEO_CONSTRUCTION_2 = "https://www.youtube.com/results?search_query=construction+software+3x+revenue"  # placeholder
VIDEO_CONSTRUCTION_3 = "https://www.youtube.com/results?search_query=construction+companies+AI+win+more+bids"  # placeholder
VIDEO_CONSTRUCTION_4 = "https://www.youtube.com/results?search_query=automating+manual+site+reports+construction"  # placeholder
VIDEO_LAW_FIRM = "https://www.youtube.com/results?search_query=1.6M+law+firm+AI"  # placeholder

# ---- CONSTRUCTION PROSPECTS ----
construction_prospects = [
    {
        "to": "jason@mechanicalone.com",
        "name": "Jason",
        "company": "Mechanical One",
        "subject": "Re: AI for Mechanical One — quick follow-up",
        "video_title": "7 Ways Construction Contractors Can Use AI",
        "video_url": VIDEO_CONSTRUCTION_1,
        "hook": "managing HVAC/plumbing/electrical crews across multiple job sites"
    },
    {
        "to": "meir@mvp-builders.com",
        "name": "Meir",
        "company": "MVP Builders",
        "subject": "Re: AI for MVP Builders — quick follow-up",
        "video_title": "This Construction Software Will 3x Your Revenue",
        "video_url": VIDEO_CONSTRUCTION_2,
        "hook": "scaling residential remodeling without scaling headcount"
    },
    {
        "to": "tim@troyerpostbuildings.com",
        "name": "Tim",
        "company": "Troyer Post Buildings",
        "subject": "Re: AI for Troyer Post Buildings — quick follow-up",
        "video_title": "How Construction Companies Use AI to Win More Bids",
        "video_url": VIDEO_CONSTRUCTION_3,
        "hook": "streamlining estimates and winning more post-frame building projects"
    },
    {
        "to": "info@harrison-const.com",
        "name": "Tim",
        "company": "Harrison Construction",
        "subject": "Re: AI for Harrison Construction — quick follow-up",
        "video_title": "Automating Manual Site Reports for Construction",
        "video_url": VIDEO_CONSTRUCTION_4,
        "hook": "eliminating manual site reporting across your general contracting projects"
    },
    {
        "to": "jcocker@maugel.com",
        "name": "Jonathan",
        "company": "Maugel DeStefano Architects",
        "subject": "Re: AI for Maugel DeStefano — quick follow-up",
        "video_title": "7 Ways Construction Contractors Can Use AI",
        "video_url": VIDEO_CONSTRUCTION_1,
        "hook": "automating repetitive documentation across your commercial and healthcare architecture projects"
    },
    {
        "to": "dsuszko@bhdp.com",
        "name": "Drew",
        "company": "BHDP Architecture",
        "subject": "Re: AI for BHDP Architecture — quick follow-up",
        "video_title": "Automating Manual Site Reports for Construction",
        "video_url": VIDEO_CONSTRUCTION_4,
        "hook": "streamlining strategic design documentation and client reporting"
    },
    {
        "to": "asteele@quinnevans.com",
        "name": "Alyson",
        "company": "Quinn Evans",
        "subject": "Re: AI for Quinn Evans — quick follow-up",
        "video_title": "This Construction Software Will 3x Your Revenue",
        "video_url": VIDEO_CONSTRUCTION_2,
        "hook": "reducing admin overhead so your team can focus on preservation and design work"
    },
    {
        "to": "info@duvalldecker.com",
        "name": "Roy",
        "company": "Duvall Decker Architects",
        "subject": "Re: AI for Duvall Decker — quick follow-up",
        "video_title": "How Construction Companies Use AI to Win More Bids",
        "video_url": VIDEO_CONSTRUCTION_3,
        "hook": "winning more design projects by responding to RFPs faster with AI assistance"
    },
    {
        "to": "info@lpadesignstudios.com",
        "name": "Dan",
        "company": "LPA Design Studios",
        "subject": "Re: AI for LPA Design Studios — quick follow-up",
        "video_title": "7 Ways Construction Contractors Can Use AI",
        "video_url": VIDEO_CONSTRUCTION_1,
        "hook": "applying AI to sustainable design workflows and client deliverables"
    },
    {
        "to": "heather@ripleypr.com",
        "name": "Heather",
        "company": "Ripley PR",
        "subject": "Re: AI for Ripley PR — quick follow-up",
        "video_title": "This Construction Software Will 3x Your Revenue",
        "video_url": VIDEO_CONSTRUCTION_2,
        "hook": "helping your construction and trades clients see the power of AI — and positioning Ripley as the forward-thinking PR partner"
    },
]

# Peckar & Abramson gets BOTH construction + law firm angle
construction_law_prospect = {
    "to": "speckar@pecklaw.com",
    "name": "Steven",
    "company": "Peckar & Abramson",
    "subject": "Re: AI for Peckar & Abramson — quick follow-up",
}

# ---- LEGAL PROSPECTS (for $1.6M Law Firm video) ----
legal_prospects = [
    {"to": "ltsai@reidcollins.com", "name": "Lisa", "company": "Reid Collins & Tsai", "subject": "Re: AI for Reid Collins & Tsai — quick follow-up"},
    {"to": "alex@ignitionlaw.com", "name": "Alex", "company": "Ignition Law", "subject": "Re: AI for Ignition Law — quick follow-up"},
    {"to": "jotto@wyrick.com", "name": "Josh", "company": "Wyrick Robbins", "subject": "Re: AI for Wyrick Robbins — quick follow-up"},
    {"to": "gbm@csattorneys.com", "name": "Greer", "company": "Christian & Small", "subject": "Re: AI for Christian & Small — quick follow-up"},
    {"to": "salmeter@mccathernlaw.com", "name": "Stephanie", "company": "McCathern Law", "subject": "Re: AI for McCathern Law — quick follow-up"},
    {"to": "joe.levitt@foster.com", "name": "Joe", "company": "Foster Garvey", "subject": "Re: AI for Foster Garvey — quick follow-up"},
]

def construction_email(p):
    return f"""<p>Hi {p['name']},</p>

<p>I wanted to follow up on my earlier email about how AI can transform operations at {p['company']}.</p>

<p>Since reaching out, I came across a video I thought you'd find valuable — especially relevant to {p['hook']}:</p>

<p>👉 <a href="{p['video_url']}">{p['video_title']}</a></p>

<p>One quick example: our client <strong>SiteVoice</strong> (a construction services company) used our AI agents to automate site reporting and back-office operations. The result? <strong>$52K saved annually</strong> and <strong>90% time savings</strong> on manual processes. That's real money back in the business.</p>

<p>I'd love to show you what a similar setup could look like for {p['company']}. Would a 15-minute call next week work?</p>

{FOOTER}

{SIGN_OFF}"""

def peckar_email(p):
    return f"""<p>Hi {p['name']},</p>

<p>I wanted to follow up on my earlier email about AI for {p['company']}.</p>

<p>Given your unique position at the intersection of law and construction, I thought you'd find both of these valuable:</p>

<p>🏗️ <strong>For your construction expertise:</strong><br>
👉 <a href="{VIDEO_CONSTRUCTION_3}">How Construction Companies Use AI to Win More Bids</a></p>

<p>⚖️ <strong>For your legal practice:</strong><br>
👉 <a href="{VIDEO_LAW_FIRM}">How a $1.6M Law Firm Uses AI to Scale</a></p>

<p>A real-world example: our client <strong>SiteVoice</strong> (construction services) used AI agents to automate site reporting and operations — saving <strong>$52K annually</strong> with <strong>90% time savings</strong>. Imagine applying that same approach to construction litigation documentation and case management.</p>

<p>Would a brief call make sense to explore what's possible for Peckar & Abramson?</p>

{FOOTER}

{SIGN_OFF}"""

def legal_email(p):
    return f"""<p>Hi {p['name']},</p>

<p>I wanted to follow up on my earlier email about how AI can drive efficiency at {p['company']}.</p>

<p>I thought you'd find this particularly relevant — a breakdown of how a $1.6M law firm is using AI to scale without adding headcount:</p>

<p>👉 <a href="{VIDEO_LAW_FIRM}">How a $1.6M Law Firm Uses AI to Scale</a></p>

<p>We're seeing law firms use AI agents to automate intake, document review, and client communications — the same kind of operational wins we delivered for <strong>SiteVoice</strong> (a construction services client), where AI saved <strong>$52K annually</strong> and cut manual processes by <strong>90%</strong>.</p>

<p>For a firm like {p['company']}, the applications in litigation support, contract review, and client management are significant.</p>

<p>Happy to walk through what this could look like for your team. Would a 15-minute call next week work?</p>

{FOOTER}

{SIGN_OFF}"""

if __name__ == "__main__":
    count = 0
    # Construction prospects
    for p in construction_prospects:
        save_draft(p["to"], p["subject"], construction_email(p))
        count += 1

    # Peckar (construction law — gets both angles)
    save_draft(construction_law_prospect["to"], construction_law_prospect["subject"], peckar_email(construction_law_prospect))
    count += 1

    # Legal prospects
    for p in legal_prospects:
        save_draft(p["to"], p["subject"], legal_email(p))
        count += 1

    print(f"\n🎉 Total drafts saved: {count}")
