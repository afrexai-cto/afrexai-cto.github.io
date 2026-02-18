#!/usr/bin/env python3
"""Send the 4 cold email drafts via Gmail SMTP."""
import smtplib, os, sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL = "ksmolichki@afrexai.com"
PASSWORD = os.environ["GMAIL_BUSINESS_APP_PASSWORD"]

SIGNATURE = '''<p>Learn more and book a call at <a href="https://afrexai.com">afrexai.com</a> — and see our AI agent skills storefront <a href="https://afrexai-cto.github.io/context-packs/">here</a>.</p>'''

emails = [
    {
        "to": "mg@cuvama.com",
        "subject": "What if your sales team had 10x the research capacity?",
        "body": """<p>Hi MG,</p>

<p>I've been digging into what Cuvama does — helping sales teams quantify value before the call even starts — and it's clear you understand that the best sellers aren't winging it, they're preparing.</p>

<p>Here's a thought: what if that preparation was almost entirely automated? I'm talking AI agents that research every prospect before outreach, generate tailored value narratives, and even draft customer success playbooks — all running in the background while your team focuses on closing.</p>

<p>At AfrexAI we build exactly that. AI agent swarms that handle sales enablement content, prospect research, and CS workflows autonomously. Not templates. Not copilots. Agents that actually <em>do the work</em>.</p>

<p>For a 30-person team trying to punch above its weight, this is the kind of multiplier that changes the game. Would you be up for a 30-minute chat to explore whether this fits where Cuvama's heading?</p>

{signature}

<p>Best,<br>Kalin Smolichki<br>CTO, AfrexAI</p>"""
    },
    {
        "to": "claire@trio-media.co.uk",
        "subject": "15 people doing the work of 40 — without burning out",
        "body": """<p>Hi Claire,</p>

<p>I love what you've done with Trio Media — buying out the founders in 2020 and building it into what it is today takes serious guts. Running a 15-person agency in Leeds that competes with the big shops is no small feat.</p>

<p>But here's the thing every agency founder I talk to eventually says: "We need more output but we can't keep hiring." Client reporting takes hours. Content calendars are a grind. Campaign optimisation is half-manual at best.</p>

<p>What if AI agents handled the repetitive 60%? At AfrexAI, we build autonomous agent workforces for businesses — think AI that writes first drafts of blog posts, compiles client performance reports weekly, and monitors campaign metrics so your team only steps in for the creative and strategic bits.</p>

<p>It's not about replacing anyone. It's about making your 15 people feel like 40. Fancy a 30-minute chat to see if it makes sense for Trio?</p>

{signature}

<p>Cheers,<br>Kalin Smolichki<br>CTO, AfrexAI</p>"""
    },
    {
        "to": "johannes@leadsie.com",
        "subject": "70K clients is amazing — until the support tickets scale too",
        "body": """<p>Hey Johannes,</p>

<p>70,000+ clients using Leadsie for agency onboarding is wild. You've clearly nailed the product-market fit for something agencies desperately needed — getting access to client ad accounts without the painful back-and-forth.</p>

<p>But I'd bet that at 70K clients, your team is feeling the weight of scale. Support tickets multiply. Documentation needs constant updating. Onboarding flows need localisation and iteration. And you're doing this with ~18 people.</p>

<p>That's where AI agents come in — and I don't mean a chatbot on your help page. At AfrexAI, we build autonomous agent workforces that handle things like: triaging and drafting support responses, generating and updating help docs, even personalising onboarding sequences based on client type. They run continuously, learn from your data, and free your team to focus on product.</p>

<p>Would love 30 minutes to riff on what this could look like for Leadsie. No strings, just ideas.</p>

{signature}

<p>Best,<br>Kalin Smolichki<br>CTO, AfrexAI</p>"""
    },
    {
        "to": "chris@beaconcrm.org",
        "subject": "What if every charity using Beacon had an AI assistant built in?",
        "body": """<p>Hi Chris,</p>

<p>Beacon is one of those products that makes you think "why didn't this exist sooner?" — a CRM actually built for charities instead of shoehorning Salesforce into a nonprofit. The 98% support satisfaction score is chef's kiss.</p>

<p>Here's something I keep thinking about: your charity customers are drowning in admin. Donor thank-you emails, grant reports, event follow-ups, data entry — all the stuff that takes time away from their actual mission. What if Beacon could help them automate the boring bits with AI?</p>

<p>At AfrexAI, we build AI agent workforces — autonomous agents that handle things like donor communication drafting, automated report generation, and workflow automation. We could either help Beacon's <em>internal</em> team scale (content, support docs, marketing) or explore what AI-powered features could look like for your customers.</p>

<p>Either way, I think there's a fascinating conversation here. Got 30 minutes for a chat?</p>

{signature}

<p>Cheers,<br>Kalin Smolichki<br>CTO, AfrexAI</p>"""
    },
]

def send_email(to, subject, html_body):
    msg = MIMEMultipart("alternative")
    msg["From"] = f"Kalin Smolichki <{EMAIL}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))
    
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(EMAIL, PASSWORD)
        server.sendmail(EMAIL, to, msg.as_string())
    print(f"✅ SENT to {to}")

for e in emails:
    body = e["body"].replace("{signature}", SIGNATURE)
    try:
        send_email(e["to"], e["subject"], body)
    except Exception as ex:
        print(f"❌ FAILED {e['to']}: {ex}")
