#!/usr/bin/env python3
"""Batch 4 - Draft cold emails for AfrexAI outbound prospecting."""

import imaplib
import email
import os
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import csv
from datetime import datetime

GMAIL_USER = "ksmolichki@afrexai.com"
GMAIL_PASS = os.environ["GMAIL_BUSINESS_APP_PASSWORD"]

FOOTER = """<p>Learn more and book a call at <a href="https://afrexai.com">afrexai.com</a> — and see our AI agent skills storefront <a href="https://afrexai-cto.github.io/context-packs/">here</a>.</p>
<p>Best,<br>Kalin Smolichki<br>CTO, AfrexAI</p>"""

prospects = [
    # Healthcare/Dental
    {
        "company": "Dental Beauty Partners",
        "contact": "Dr. Dev Patel",
        "email": "dev@dentalbeautypartners.co.uk",
        "industry": "Healthcare - Dental Group",
        "employees": "200+",
        "subject": "AI agents for Dental Beauty Partners' 50+ practices",
        "body": """<p>Hi Dev,</p>
<p>Congratulations on reaching the 50-practice milestone at Dental Beauty Partners — that's phenomenal growth with a 73% CAGR.</p>
<p>At AfrexAI, we build custom AI agent teams for multi-location healthcare businesses like yours. Think: automated patient booking and follow-ups, intelligent recall systems, cross-practice reporting dashboards, and AI-powered treatment plan communications — all running 24/7 without adding headcount.</p>
<p>For a dental group scaling as fast as DBP, even a 10% improvement in patient recall rates or admin efficiency across 50 locations compounds into serious revenue.</p>
<p>Would you have 30 minutes for a quick call to explore what's possible?</p>"""
    },
    {
        "company": "DECA Dental Group",
        "contact": "Dr. Sulman Ahmed",
        "email": "info@decadental.com",
        "industry": "Healthcare - Dental Group",
        "employees": "500+",
        "subject": "AI-powered operations for DECA Dental's national growth",
        "body": """<p>Hi Dr. Ahmed,</p>
<p>I've been following DECA Dental Group's impressive national expansion with Ideal Dental — building from a single office in 2008 to a major DSO is remarkable.</p>
<p>At AfrexAI, we build custom AI agent teams that help dental groups like yours automate the operational complexity that comes with rapid scaling — from patient communications and scheduling optimization to cross-location analytics and staff coordination.</p>
<p>Our AI agents work around the clock, handling the repetitive tasks that slow down your operations team, so your people can focus on what matters: patient care and growth.</p>
<p>Would you have 30 minutes this week or next to explore how AI agents could support DECA's continued expansion?</p>"""
    },
    {
        "company": "Vista Verde Dental Partners",
        "contact": "Dustin Netral",
        "email": "info@vistaverdedental.com",
        "industry": "Healthcare - Dental Group",
        "employees": "50-200",
        "subject": "AI agents to scale Vista Verde Dental Partners",
        "body": """<p>Hi Dustin,</p>
<p>As President and CEO of Vista Verde Dental Partners, you know the operational challenges of managing a growing dental group — scheduling, patient communications, compliance tracking, and cross-practice coordination.</p>
<p>At AfrexAI, we build custom AI agent teams specifically for multi-location healthcare businesses. Our agents handle patient recall automation, appointment scheduling, review management, and operational reporting — running 24/7 without adding to your payroll.</p>
<p>Would you have 30 minutes for a conversation about how AI agents could help Vista Verde scale more efficiently?</p>"""
    },
    {
        "company": "Dental365",
        "contact": "Dr. Scott Asnis",
        "email": "info@godental365.com",
        "industry": "Healthcare - Dental Group",
        "employees": "300+",
        "subject": "AI agents for Dental365's rapid growth",
        "body": """<p>Hi Dr. Asnis,</p>
<p>I heard your Group Dentistry Now podcast interview — Dental365's growth trajectory is impressive. Scaling a dental group that fast creates enormous operational complexity.</p>
<p>At AfrexAI, we build custom AI agent teams that tackle exactly those challenges: automating patient communications, optimising scheduling across locations, managing reviews and reputation, and generating cross-practice insights — all without adding headcount.</p>
<p>Would 30 minutes work to explore what AI agents could do for Dental365?</p>"""
    },
    # Real Estate
    {
        "company": "LPT Realty",
        "contact": "Robert Palmer",
        "email": "robert@lptrealty.com",
        "industry": "Real Estate - Brokerage",
        "employees": "100+",
        "subject": "AI agents to supercharge LPT Realty's hybrid model",
        "body": """<p>Hi Robert,</p>
<p>LPT Realty's meteoric growth over the past four years is remarkable — your hybrid revenue share model is clearly resonating with agents.</p>
<p>At AfrexAI, we build custom AI agent teams for fast-growing brokerages. Think: AI-powered lead qualification and routing, automated agent onboarding workflows, transaction coordination bots, and intelligent CRM management — running 24/7 so your team can focus on closing deals.</p>
<p>For a brokerage scaling as fast as LPT, these AI agents can be the operational backbone that keeps everything running smoothly without proportionally growing your back-office team.</p>
<p>Would you have 30 minutes for a quick call to explore what's possible?</p>"""
    },
    {
        "company": "The Agency RE",
        "contact": "Mauricio Umansky",
        "email": "info@theagencyre.com",
        "industry": "Real Estate - Luxury Brokerage",
        "employees": "200+",
        "subject": "AI agents for The Agency's billion-dollar operations",
        "body": """<p>Hi Mauricio,</p>
<p>The Agency's position as Hollywood's premier luxury brokerage is well-earned. At that scale, the operational demands — client communications, market analysis, transaction management — only compound.</p>
<p>At AfrexAI, we build custom AI agent teams for high-growth real estate firms. Our agents handle lead nurturing, market intelligence reports, transaction tracking, and client follow-ups — all running autonomously so your agents can focus on relationships and closings.</p>
<p>Would you have 30 minutes to explore how AI agents could enhance The Agency's operations?</p>"""
    },
    {
        "company": "Antwerp Dental Group",
        "contact": "Dr. Raj Wadhwani",
        "email": "info@antwerpdentalgroup.co.uk",
        "industry": "Healthcare - Dental Group",
        "employees": "50-100",
        "subject": "AI agents for Antwerp Dental Group's practices",
        "body": """<p>Hi Dr. Wadhwani,</p>
<p>Since founding Antwerp Dental Group in 1998, you've built one of the largest dental groups in Cambridgeshire — that's over 25 years of steady growth.</p>
<p>At AfrexAI, we build custom AI agent teams for dental groups like yours. Our agents automate patient recall, handle appointment scheduling, manage review responses, and generate practice analytics — all running around the clock.</p>
<p>For an established group like Antwerp, even modest efficiency gains across your practices translate to meaningful revenue and better patient experience.</p>
<p>Would you have 30 minutes for a chat about what's possible?</p>"""
    },
    # Logistics/Supply Chain
    {
        "company": "Walker Logistics",
        "contact": "Ian Walker",
        "email": "info@walkerlogistics.com",
        "industry": "Logistics - 3PL Fulfilment",
        "employees": "50-100",
        "subject": "AI agents for Walker Logistics' fulfilment operations",
        "body": """<p>Hi Ian,</p>
<p>Walker Logistics' 23 years of organic growth — now serving 50+ clients across 80+ countries with a 99.91% UK success rate — is a testament to doing fulfilment right.</p>
<p>At AfrexAI, we build custom AI agent teams for logistics companies. Our agents can automate inventory forecasting, order exception handling, carrier selection optimization, and client reporting — all running 24/7 alongside your operations team.</p>
<p>For a 3PL handling 6.4M+ pieces picked, even small efficiency gains compound massively. Would you have 30 minutes to explore how AI agents could help Walker Logistics?</p>"""
    },
    {
        "company": "Smart Gladiator",
        "contact": "Puga Sankara",
        "email": "puga@smartgladiator.com",
        "industry": "Logistics - Supply Chain Technology",
        "employees": "20-50",
        "subject": "AI agents to complement Smart Gladiator's mobile tech",
        "body": """<p>Hi Puga,</p>
<p>Smart Gladiator's work in mobile technology for retailers, distributors, and 3PLs is right at the intersection of logistics and technology where AI agents can add enormous value.</p>
<p>At AfrexAI, we build custom AI agent teams that can extend your platform's capabilities — think intelligent dispatch optimization, automated exception handling, predictive demand analytics, and autonomous customer communication workflows.</p>
<p>Would you have 30 minutes to discuss how AI agents could complement Smart Gladiator's offerings?</p>"""
    },
    # Accounting Firms
    {
        "company": "McKonly & Asbury",
        "contact": "Michael Hoffner",
        "email": "mhoffner@macpas.com",
        "industry": "Accounting - CPA Firm",
        "employees": "100-200",
        "subject": "AI agents for the #1 ranked midsized firm",
        "body": """<p>Hi Michael,</p>
<p>Congratulations on McKonly & Asbury's recognition as the #1 ranked midsized firm by Accounting Today — that's a reflection of real excellence.</p>
<p>At AfrexAI, we build custom AI agent teams for accounting firms. Our agents automate client onboarding, document collection and follow-ups, engagement letter management, tax deadline tracking, and internal workflow coordination — freeing your team to focus on advisory work.</p>
<p>In a profession facing talent shortages, AI agents let your existing team punch above their weight. Would you have 30 minutes to explore what's possible for McKonly & Asbury?</p>"""
    },
    {
        "company": "Keiter CPA",
        "contact": "Managing Partner",
        "email": "info@keitercpa.com",
        "industry": "Accounting - CPA Firm",
        "employees": "100-200",
        "subject": "AI agents for Keiter's Best of the Best operations",
        "body": """<p>Hi there,</p>
<p>Keiter's recognition as a Best of the Best CPA firm in 2024 speaks volumes about your commitment to quality. With that reputation comes growing client demand — and the operational complexity that follows.</p>
<p>At AfrexAI, we build custom AI agent teams for accounting firms. Our agents handle client document collection, engagement tracking, deadline management, and internal workflows — running 24/7 so your professionals can focus on the high-value advisory work that earned you that recognition.</p>
<p>Would you have 30 minutes to explore how AI agents could support Keiter's growth?</p>"""
    },
    {
        "company": "Hazlewoods",
        "contact": "Managing Partner",
        "email": "info@hazlewoods.co.uk",
        "industry": "Accounting - UK Firm",
        "employees": "550",
        "subject": "AI agents for Hazlewoods' 550-person operation",
        "body": """<p>Hi there,</p>
<p>Hazlewoods' growth from Marcus Hazlewood's founding in 1919 to over 550 employees across five offices is remarkable — over a century of trusted advisory.</p>
<p>At AfrexAI, we build custom AI agent teams for accounting and advisory firms. At your scale, our agents can automate client communications, document management, compliance tracking, and cross-office workflow coordination — creating efficiencies that compound across 550+ people.</p>
<p>Would you have 30 minutes for a conversation about what AI agents could do for Hazlewoods?</p>"""
    },
    {
        "company": "Saffery",
        "contact": "Managing Partner",
        "email": "info@saffery.com",
        "industry": "Accounting - UK Chartered Accountants",
        "employees": "200+",
        "subject": "AI agents for Saffery's partner-led model",
        "body": """<p>Hi there,</p>
<p>Saffery's partner-led, people-focused approach to tax and business advice is exactly the kind of firm where AI agents add the most value — by handling the operational heavy lifting so your partners and teams can stay focused on client relationships.</p>
<p>At AfrexAI, we build custom AI agent teams for professional services firms. Our agents automate document collection, compliance tracking, client onboarding, and internal workflow management.</p>
<p>Would you have 30 minutes to explore the possibilities?</p>"""
    },
    # Recruitment/Staffing
    {
        "company": "Tiger Recruitment",
        "contact": "David Morel",
        "email": "david.morel@tiger-recruitment.com",
        "industry": "Recruitment - Business Support",
        "employees": "50-100",
        "subject": "AI agents to amplify Tiger Recruitment's placements",
        "body": """<p>Hi David,</p>
<p>Since founding Tiger Recruitment in 2001, you've built a leading name in senior-level and C-suite business support recruitment. That kind of high-touch placement work generates enormous operational overhead.</p>
<p>At AfrexAI, we build custom AI agent teams for recruitment agencies. Our agents handle candidate sourcing automation, CV screening and shortlisting, interview scheduling, client communication follow-ups, and pipeline management — all running 24/7.</p>
<p>For a firm like Tiger, this means your consultants spend more time on the relationship-building that wins placements, not the admin that slows them down.</p>
<p>Would you have 30 minutes for a quick call?</p>"""
    },
    {
        "company": "Brite Recruitment",
        "contact": "Karen Pollard",
        "email": "info@briterecruitment.com",
        "industry": "Recruitment - Staffing",
        "employees": "30-50",
        "subject": "AI agents to scale Brite Recruitment's award-winning service",
        "body": """<p>Hi Karen,</p>
<p>Since founding Brite Recruitment in 2006, you've built an award-winning agency with an impressively strong team. Scaling a recruitment business while maintaining service quality is one of the hardest things to do.</p>
<p>At AfrexAI, we build custom AI agent teams for recruitment agencies. Our agents automate candidate sourcing, CV parsing, interview coordination, and client reporting — freeing your consultants to focus on the relationships that drive placements.</p>
<p>Would you have 30 minutes to explore how AI agents could help Brite scale further?</p>"""
    },
    {
        "company": "MRJ Recruitment",
        "contact": "Jody Marks",
        "email": "info@mrjrecruitment.com",
        "industry": "Recruitment - Staffing",
        "employees": "20-50",
        "subject": "AI agents to supercharge MRJ Recruitment",
        "body": """<p>Hi Jody,</p>
<p>As founder and CEO of MRJ Recruitment, you know that the biggest bottleneck in recruitment isn't finding opportunities — it's managing the operational complexity of matching, communicating, and coordinating at scale.</p>
<p>At AfrexAI, we build custom AI agent teams for recruitment agencies. Our agents handle candidate outreach, scheduling, follow-ups, and pipeline tracking — running 24/7 so your team can focus on closing placements.</p>
<p>Would you have 30 minutes for a conversation about what's possible?</p>"""
    },
    {
        "company": "80Twenty",
        "contact": "Founder",
        "email": "hello@80twenty.com",
        "industry": "Recruitment - Boutique Staffing",
        "employees": "10-30",
        "subject": "AI agents for 80Twenty's high-growth client matching",
        "body": """<p>Hi there,</p>
<p>80Twenty's focus on connecting high-growth companies with exceptional candidates is exactly the kind of boutique recruitment where AI agents add disproportionate value.</p>
<p>At AfrexAI, we build custom AI agent teams for recruitment firms. Our agents automate candidate sourcing, qualification screening, interview scheduling, and pipeline analytics — letting your team focus purely on the high-touch matching that high-growth clients demand.</p>
<p>Would you have 30 minutes to explore the possibilities?</p>"""
    },
    # E-commerce
    {
        "company": "Spacegoods",
        "contact": "Matthew Kelly",
        "email": "hello@spacegoods.com",
        "industry": "E-commerce - Wellness/Supplements",
        "employees": "10-30",
        "subject": "AI agents for Spacegoods' explosive growth",
        "body": """<p>Hi Matt,</p>
<p>Spacegoods' 9,100% search growth and successful seed raise are incredible — you're clearly riding the adaptogenic mushroom wave at exactly the right time.</p>
<p>At AfrexAI, we build custom AI agent teams for fast-growing DTC brands. Our agents handle customer support automation, subscription management, review and UGC collection, inventory forecasting, and marketing workflow automation — all running 24/7.</p>
<p>For a brand growing as fast as Spacegoods, these AI agents let you scale operations without proportionally scaling headcount. Would you have 30 minutes to explore what's possible?</p>"""
    },
    {
        "company": "Misen",
        "contact": "Omar Rada",
        "email": "hello@misen.com",
        "industry": "E-commerce - DTC Cookware",
        "employees": "20-50",
        "subject": "AI agents to sharpen Misen's operations",
        "body": """<p>Hi Omar,</p>
<p>Misen's mission to make fewer, better kitchen tools at great prices — from that legendary $1M crowdfunded chef's knife onward — is the kind of focused DTC brand where operational efficiency is everything.</p>
<p>At AfrexAI, we build custom AI agent teams for DTC brands. Our agents automate customer support, returns processing, inventory management, supplier communications, and marketing workflows — running 24/7 so your team can focus on product and growth.</p>
<p>Would you have 30 minutes to discuss how AI agents could help Misen operate more efficiently?</p>"""
    },
    {
        "company": "Elvie",
        "contact": "Tania Boler",
        "email": "hello@elvie.com",
        "industry": "E-commerce - FemTech",
        "employees": "100-200",
        "subject": "AI agents for Elvie's global operations",
        "body": """<p>Hi Tania,</p>
<p>Elvie's work in women's health technology — from the smart breast pump to pelvic floor trainers — is genuinely category-defining. With $189M+ in funding and global distribution, the operational complexity must be significant.</p>
<p>At AfrexAI, we build custom AI agent teams for scaling consumer tech brands. Our agents handle customer support automation, warranty and returns management, supply chain coordination, and cross-market operations — running around the clock.</p>
<p>Would you have 30 minutes to explore how AI agents could support Elvie's continued growth?</p>"""
    },
    {
        "company": "The Farmer's Dog",
        "contact": "Brett Podolsky",
        "email": "hello@thefarmersdog.com",
        "industry": "E-commerce - DTC Pet Food",
        "employees": "200+",
        "subject": "AI agents for The Farmer's Dog at $800M scale",
        "body": """<p>Hi Brett,</p>
<p>The Farmer's Dog delivering 100M+ meals and approaching $800M in sales is a DTC success story. At that scale, operational efficiency becomes your biggest competitive advantage.</p>
<p>At AfrexAI, we build custom AI agent teams for high-growth DTC brands. Our agents automate subscription management, customer support, logistics coordination, and operational analytics — running 24/7 to keep your operations lean as you scale.</p>
<p>Would you have 30 minutes to explore what AI agents could do for The Farmer's Dog?</p>"""
    },
    # Insurance
    {
        "company": "American Insurance",
        "contact": "Kip White",
        "email": "info@aioinc.us",
        "industry": "Insurance - Independent Agency",
        "employees": "20-50",
        "subject": "AI agents for American Insurance's independent advantage",
        "body": """<p>Hi Kip,</p>
<p>Since opening your first agency in 1990 and making the smart move from captive to independent, you've built American Insurance on the principle of better service through broader carrier access.</p>
<p>At AfrexAI, we build custom AI agent teams for insurance agencies. Our agents automate policy comparisons, client follow-ups, renewal reminders, claims coordination, and lead qualification — running 24/7 so your agents can focus on the consultative work that sets independents apart.</p>
<p>Would you have 30 minutes to explore how AI agents could enhance American Insurance's operations?</p>"""
    },
    {
        "company": "Affordable American Insurance",
        "contact": "Aimee Griffin",
        "email": "info@insuranceaai.com",
        "industry": "Insurance - Independent Agency",
        "employees": "20-50",
        "subject": "AI agents for Affordable Insurance's 30-year legacy",
        "body": """<p>Hi Aimee,</p>
<p>30 years of building Affordable Insurance from the ground up — with a focus on accessible, client-focused solutions — is a remarkable entrepreneurial achievement.</p>
<p>At AfrexAI, we build custom AI agent teams for insurance agencies. Our agents handle lead qualification, policy renewals, client communications, claims follow-ups, and cross-sell identification — all running 24/7.</p>
<p>For an established agency like yours, AI agents can amplify your team's capacity without losing the personal touch that's driven your success. Would you have 30 minutes for a quick call?</p>"""
    },
    # More Logistics
    {
        "company": "Zencargo",
        "contact": "Alex Hersham",
        "email": "hello@zencargo.com",
        "industry": "Logistics - Digital Freight Forwarding",
        "employees": "100-200",
        "subject": "AI agents to enhance Zencargo's digital freight platform",
        "body": """<p>Hi Alex,</p>
<p>Zencargo's mission to bring digital intelligence to freight forwarding is transforming how businesses manage their supply chains. As you scale, the operational demands of managing shipments, documentation, and client communications only intensify.</p>
<p>At AfrexAI, we build custom AI agent teams for logistics companies. Our agents automate shipment tracking, documentation processing, exception handling, and client updates — running 24/7 alongside your platform.</p>
<p>Would you have 30 minutes to discuss how AI agents could complement Zencargo's digital-first approach?</p>"""
    },
    # More Real Estate
    {
        "company": "Nested",
        "contact": "Matt Robinson",
        "email": "hello@nested.com",
        "industry": "Real Estate - PropTech",
        "employees": "50-100",
        "subject": "AI agents for Nested's estate agency model",
        "body": """<p>Hi Matt,</p>
<p>Nested's approach to modernising the estate agency experience — combining technology with great service — is exactly where AI agents can add enormous value.</p>
<p>At AfrexAI, we build custom AI agent teams for forward-thinking property companies. Our agents handle lead qualification, viewing scheduling, vendor updates, offer management, and post-sale coordination — all running 24/7.</p>
<p>Would you have 30 minutes to explore how AI agents could enhance Nested's operations?</p>"""
    },
    # More Accounting
    {
        "company": "Blick Rothenberg",
        "contact": "Managing Partner",
        "email": "info@blickrothenberg.com",
        "industry": "Accounting - UK Advisory Firm",
        "employees": "200+",
        "subject": "AI agents for Blick Rothenberg's 80th year and beyond",
        "body": """<p>Hi there,</p>
<p>As Blick Rothenberg marks 80 years of delivering trusted advice, the firm's commitment to quality is clear. With that legacy comes the opportunity to leverage AI to serve clients even better.</p>
<p>At AfrexAI, we build custom AI agent teams for professional services firms. Our agents automate client onboarding, document collection, compliance tracking, and internal workflows — freeing your professionals to focus on the advisory work that defines your reputation.</p>
<p>Would you have 30 minutes to explore what AI agents could do for Blick Rothenberg?</p>"""
    },
]

def save_draft_imap(to_email, subject, html_body):
    """Save email as draft via IMAP."""
    msg = MIMEMultipart('alternative')
    msg['From'] = GMAIL_USER
    msg['To'] = to_email
    msg['Subject'] = subject
    
    full_html = f"""<html><body>{html_body}{FOOTER}</body></html>"""
    msg.attach(MIMEText(full_html, 'html'))
    
    imap = imaplib.IMAP4_SSL('imap.gmail.com', 993)
    imap.login(GMAIL_USER, GMAIL_PASS)
    imap.append('[Gmail]/Drafts', '\\Draft', None, msg.as_bytes())
    imap.logout()

def append_tracker(prospect):
    """Append prospect to outreach tracker CSV."""
    tracker_path = '/Users/openclaw/.openclaw/workspace-main/prospects/outreach-tracker.csv'
    with open(tracker_path, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            prospect['company'],
            prospect['contact'],
            prospect['email'],
            prospect['industry'],
            prospect['employees'],
            'drafted',
            datetime.now().strftime('%Y-%m-%d')
        ])

if __name__ == '__main__':
    success = 0
    failed = 0
    for i, p in enumerate(prospects):
        try:
            print(f"[{i+1}/{len(prospects)}] Drafting email to {p['company']} ({p['email']})...")
            save_draft_imap(p['email'], p['subject'], p['body'])
            append_tracker(p)
            success += 1
            time.sleep(1)  # Rate limit
        except Exception as e:
            print(f"  FAILED: {e}")
            failed += 1
    
    print(f"\nDone! {success} drafted, {failed} failed.")
