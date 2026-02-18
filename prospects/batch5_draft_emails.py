#!/usr/bin/env python3
"""Batch 5: Draft cold emails for AfrexAI outbound prospecting."""

import imaplib
import email
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import csv
import time

GMAIL_USER = "ksmolichki@afrexai.com"
GMAIL_PASS = os.environ["GMAIL_BUSINESS_APP_PASSWORD"]

SIGNATURE = """<br><br>Learn more and book a call at <a href="https://afrexai.com">afrexai.com</a> — and see our AI agent skills storefront <a href="https://afrexai-cto.github.io/context-packs/">here</a>.<br><br>Best,<br>Kalin Smolichki<br>CTO, AfrexAI"""

prospects = [
    # LAW FIRMS (4)
    {
        "company": "Peckar & Abramson",
        "contact_name": "Steven Peckar",
        "email": "speckar@pecklaw.com",
        "industry": "Law Firm - Construction Law",
        "employees": 104,
        "subject": "AI for Construction Law — VADIS Recovered $1.6M",
        "body": """<p>Hi Steven,</p>
<p>Congratulations on Peckar & Abramson's continued leadership in construction law — being the top-ranked national firm in the space with 104 attorneys across 10 offices is a remarkable achievement.</p>
<p>I'm reaching out because we've built AI agents specifically for legal and construction firms. Our VADIS case study is particularly relevant to your practice: an AI-powered document analysis system that helped recover <strong>$1.6M in previously missed claims</strong> — by autonomously reviewing contracts, change orders, and project documentation.</p>
<p>For a firm like P&A that handles complex construction disputes daily, imagine AI agents that can:</p>
<ul>
<li>Analyze thousands of project documents and flag discrepancies in minutes</li>
<li>Auto-draft initial contract reviews and claims summaries</li>
<li>Provide 24/7 client intake and triage for your 10 offices</li>
</ul>
<p>Would you have 30 minutes for a quick call to explore how AI could amplify your attorneys' capacity without adding headcount?</p>"""
    },
    {
        "company": "Wyrick Robbins",
        "contact_name": "Josh Otto",
        "email": "jotto@wyrick.com",
        "industry": "Law Firm - Business/Growth",
        "employees": 121,
        "subject": "AI Agents for Mid-Size Law Firms — Real ROI, Not Hype",
        "body": """<p>Hi Josh,</p>
<p>Congratulations on your appointment as Managing Partner at Wyrick Robbins — taking the helm of a firm ranked #39 on the Leopard Mid-Sized 200 is an exciting milestone.</p>
<p>I wanted to introduce AfrexAI because we specialize in building custom AI agents for mid-size law firms — the sweet spot where you're handling sophisticated work but don't have Big Law tech budgets.</p>
<p>One quick example: our VADIS case study showed how an AI document analysis agent recovered <strong>$1.6M in previously missed claims</strong> for a legal client. We're seeing similar results across contract review, client intake automation, and knowledge management.</p>
<p>For a 121-attorney firm like Wyrick Robbins serving growth-oriented businesses, AI agents can be a real competitive differentiator — especially for:</p>
<ul>
<li>Automating repetitive due diligence across M&A deals</li>
<li>24/7 client intake and routing across practice areas</li>
<li>Internal knowledge retrieval from your firm's document corpus</li>
</ul>
<p>Would you have 30 minutes to explore what's possible? Happy to show a quick demo.</p>"""
    },
    {
        "company": "Christian & Small",
        "contact_name": "Greer Mallette",
        "email": "gbm@csattorneys.com",
        "industry": "Law Firm - Litigation/Business",
        "employees": 42,
        "subject": "AI That Actually Helps Litigators — Not Just Hype",
        "body": """<p>Hi Greer,</p>
<p>I noticed Christian & Small's strong recognition in Chambers USA and your firm's commitment to diversity through the Leadership Council on Legal Diversity — impressive to be the only Alabama firm in that program for over a decade.</p>
<p>I'm reaching out because we've built AI agents that are delivering real ROI for litigation-focused firms. Our VADIS case study is a great example: AI-powered document analysis that recovered <strong>$1.6M in previously missed claims</strong> by autonomously reviewing case files and flagging critical inconsistencies.</p>
<p>For a firm like Christian & Small handling insurance defense, transportation, and commercial litigation, the applications are immediate:</p>
<ul>
<li>AI-powered case intake that triages and summarizes new matters overnight</li>
<li>Document review agents that can process thousands of pages and surface key facts</li>
<li>Client communication automation — keeping clients informed without attorney time</li>
</ul>
<p>Would 30 minutes work for a quick conversation about how AI could help your team handle more cases without adding headcount?</p>"""
    },
    {
        "company": "McCathern Law",
        "contact_name": "Stephanie Almeter",
        "email": "salmeter@mccathernlaw.com",
        "industry": "Law Firm - Full Service",
        "employees": 60,
        "subject": "AI Agents for McCathern — Multiply Your Team's Output",
        "body": """<p>Hi Stephanie,</p>
<p>Congratulations on your promotion to Managing Partner of McCathern's Dallas headquarters — a well-deserved recognition of your leadership.</p>
<p>I wanted to reach out because we're helping law firms like yours deploy AI agents that deliver measurable results. Our VADIS case study showed how AI document analysis recovered <strong>$1.6M in previously missed claims</strong> — and that's just one application.</p>
<p>For McCathern's diverse practice areas across multiple offices, AI agents can help you:</p>
<ul>
<li>Automate initial document review and case summarization</li>
<li>Run 24/7 client intake across all offices with intelligent routing</li>
<li>Generate first drafts of routine legal documents in seconds</li>
</ul>
<p>As you step into the MP role, AI could be a force multiplier for your vision. Would you have 30 minutes for a quick call?</p>"""
    },
    # CONSTRUCTION (4)
    {
        "company": "Harrison Construction",
        "contact_name": "Tim Harrison",
        "email": "info@harrison-const.com",
        "industry": "Construction - General Contractor",
        "employees": 150,
        "subject": "How a Construction Company Saved $52K with AI — SiteVoice Case Study",
        "body": """<p>Hi Tim,</p>
<p>Congratulations on being named the 2024 Member of the Year by the Chamber of Commerce of West Alabama — a testament to the legacy you've built since founding Harrison Construction in 1996.</p>
<p>I'm reaching out because we've developed AI specifically for construction companies. Our SiteVoice case study is directly relevant: a voice-first AI agent that <strong>saved a construction company $52,000 and 90% of administrative time</strong> on daily reporting, safety documentation, and project updates.</p>
<p>For a company like Harrison Construction managing multiple commercial projects across Alabama, imagine:</p>
<ul>
<li>Superintendents filing daily reports by voice from the job site — no typing, no paperwork</li>
<li>AI that automatically flags safety compliance gaps before they become issues</li>
<li>Instant project status summaries pulled from all your active sites</li>
</ul>
<p>Would you have 30 minutes to see a quick demo? I think you'd find it immediately relevant to your operations.</p>"""
    },
    {
        "company": "Maugel DeStefano Architects",
        "contact_name": "Jonathan Cocker",
        "email": "jcocker@maugel.com",
        "industry": "Architecture - Commercial/Healthcare",
        "employees": 35,
        "subject": "AI Agents for Architecture Firms — Automate the Admin, Focus on Design",
        "body": """<p>Hi Jonathan,</p>
<p>Congratulations on Maugel DeStefano being named 2023 Architecture Firm of the Year — a remarkable recognition for the firm you and your partners have built in Harvard, MA.</p>
<p>I'm reaching out because we've been working with professional services firms to deploy AI agents that handle the operational work that pulls principals away from design. Our SiteVoice case study showed how AI <strong>saved $52K and 90% of admin time</strong> in construction — and the same principles apply to architecture.</p>
<p>For Maugel DeStefano's work across healthcare, biotech, corporate, and multifamily sectors, AI agents could help with:</p>
<ul>
<li>Automated project documentation and meeting note summarization</li>
<li>Client communication management — updates, scheduling, follow-ups</li>
<li>RFP response drafting using your firm's project history and capabilities</li>
</ul>
<p>Would you have 30 minutes for a quick conversation? I'd love to show you what's possible for a mid-size architecture practice.</p>"""
    },
    {
        "company": "BHDP Architecture",
        "contact_name": "Drew Suszko",
        "email": "dsuszko@bhdp.com",
        "industry": "Architecture - Strategic Design",
        "employees": 188,
        "subject": "AI for BHDP's New Chapter — A Tool for Your Leadership Vision",
        "body": """<p>Hi Drew,</p>
<p>Congratulations on being named CEO of BHDP Architecture — stepping into leadership of a firm with $64.5M in revenue and nearly 200 professionals across multiple offices is an exciting new chapter.</p>
<p>As you shape BHDP's strategic direction, I wanted to introduce AI agents that could amplify your team's capacity. Our SiteVoice case study demonstrated <strong>$52K in savings and 90% reduction in admin time</strong> for a construction company — and the same AI approach works for design firms.</p>
<p>For BHDP's scale, AI agents could help with:</p>
<ul>
<li>Project management automation — status updates, resource tracking, timeline alerts</li>
<li>Proposal and RFP response generation from your firm's project library</li>
<li>Cross-office knowledge sharing — instantly finding relevant past projects and lessons learned</li>
</ul>
<p>Would 30 minutes work for a quick call? I'd love to show you how AI fits into your vision for BHDP's next chapter.</p>"""
    },
    {
        "company": "Quinn Evans",
        "contact_name": "Alyson Steele",
        "email": "asteele@quinnevans.com",
        "industry": "Architecture - Historic Preservation/Design",
        "employees": 200,
        "subject": "AI Agents for Quinn Evans — Amplify 200 Professionals",
        "body": """<p>Hi Alyson,</p>
<p>Congratulations on the 2024 AIA Architecture Firm Award — an incredible recognition for Quinn Evans and your leadership in tripling the firm's size as CEO. That growth trajectory is impressive.</p>
<p>I'm reaching out because firms experiencing rapid growth like Quinn Evans often hit operational bottlenecks that AI agents can solve. Our SiteVoice case study showed <strong>$52K in savings and 90% time reduction</strong> on project documentation — and our AI agents are helping professional services firms scale without proportionally scaling overhead.</p>
<p>For Quinn Evans with 200+ professionals across six offices, AI could help with:</p>
<ul>
<li>Automated project documentation and cross-office knowledge sharing</li>
<li>Client communication management at scale</li>
<li>RFP response generation leveraging your award-winning portfolio</li>
</ul>
<p>Would you have 30 minutes for a quick call? I'd love to explore how AI can support your continued growth.</p>"""
    },
    # FINANCIAL ADVISORY (4)
    {
        "company": "Cassaday & Company",
        "contact_name": "Steve Cassaday",
        "email": "steve@cassaday.com",
        "industry": "Financial Advisory - Wealth Management",
        "employees": 85,
        "subject": "AI Agents for RIAs — 18x Barron's Top 100 Deserves 18x Efficiency",
        "body": """<p>Hi Steve,</p>
<p>Being named a Barron's Top 100 Independent Financial Advisor for 18 consecutive years is a remarkable achievement — that kind of consistency speaks to the quality of service at Cassaday & Company.</p>
<p>I'm reaching out because we've been building AI agents specifically for financial advisory firms. With 85 employees serving high-net-worth clients, I imagine your team faces the constant tension between personalized service and operational efficiency.</p>
<p>Our AI agents can help firms like Cassaday & Company by:</p>
<ul>
<li>Automating client meeting prep — pulling portfolio data, recent communications, and market updates into a concise brief</li>
<li>Handling routine client inquiries 24/7 — account questions, scheduling, document requests</li>
<li>Generating personalized quarterly review materials in seconds instead of hours</li>
</ul>
<p>The result? Your advisors spend more time on the high-value relationship work that earned those 18 Barron's recognitions — and less on admin.</p>
<p>Would you have 30 minutes for a quick call to explore what's possible?</p>"""
    },
    {
        "company": "LVW Advisors",
        "contact_name": "Lori Van Dusen",
        "email": "lvandusen@lvwadvisors.com",
        "industry": "Financial Advisory - Wealth Management",
        "employees": 50,
        "subject": "AI for Forbes Top RIA Firms — Scale Without Losing the Personal Touch",
        "body": """<p>Hi Lori,</p>
<p>Congratulations on LVW Advisors making the Forbes/SHOOK America's Top RIA Firms list — a well-deserved recognition of what you've built since founding the firm.</p>
<p>I'm reaching out because we specialize in AI agents for professional services firms. For a top-ranked RIA like LVW, the challenge is always scaling personalized service while maintaining the client experience that earned you that Forbes recognition.</p>
<p>Our AI agents help financial advisory firms by:</p>
<ul>
<li>Automating client onboarding workflows — document collection, KYC, account setup</li>
<li>Providing 24/7 client service for routine inquiries — account balances, document requests, scheduling</li>
<li>Generating personalized financial reports and meeting prep materials in seconds</li>
</ul>
<p>Would you have 30 minutes for a quick conversation? I'd love to show you how AI can multiply your team's capacity.</p>"""
    },
    {
        "company": "Greenspring Advisors",
        "contact_name": "Brian Gorczynski",
        "email": "bgorczynski@greenspringadvisors.com",
        "industry": "Financial Advisory - RIA/Wealth Management",
        "employees": 67,
        "subject": "AI Agents for $10B RIAs — Scale Your Post-Merger Operations",
        "body": """<p>Hi Brian,</p>
<p>Congratulations on the Greenspring-Wealthstream merger creating a $10B employee-owned RIA — that's a major milestone. Maintaining employee ownership at that scale is admirable.</p>
<p>Mergers create incredible opportunities but also operational complexity. That's exactly where our AI agents shine — helping firms like Greenspring Advisors integrate systems, standardize processes, and scale service delivery without ballooning headcount.</p>
<p>Our AI agents can help your newly combined firm by:</p>
<ul>
<li>Unifying client communication across legacy systems and processes</li>
<li>Automating repetitive compliance and reporting workflows</li>
<li>Providing consistent 24/7 client service across all your offices during the integration</li>
</ul>
<p>Would you have 30 minutes to discuss how AI could smooth your post-merger operations?</p>"""
    },
    {
        "company": "Falcon Wealth Planning",
        "contact_name": "Michael Jensen",
        "email": "michael@falconwealthplanning.com",
        "industry": "Financial Advisory - Fee-Only RIA",
        "employees": 30,
        "subject": "AI for Fastest-Growing RIAs — Scale Like Falcon",
        "body": """<p>Hi Michael,</p>
<p>Your trajectory at Falcon Wealth Planning is impressive — from managing partner to ETF.com's Top 100, ThinkAdvisor Luminaries finalist, and Barron's Top 1200. That kind of recognition doesn't happen by accident.</p>
<p>I'm reaching out because fast-growing RIAs like Falcon face a common challenge: maintaining the personal touch that built your reputation while scaling to serve more clients. Our AI agents solve this by handling the operational work so your team can focus on what matters.</p>
<p>For Falcon Wealth Planning, AI agents could:</p>
<ul>
<li>Automate client meeting prep and follow-up documentation</li>
<li>Handle routine client inquiries 24/7 — scheduling, document requests, account questions</li>
<li>Generate personalized financial planning summaries from your data in seconds</li>
</ul>
<p>Would you have 30 minutes for a quick call? I think you'd find this directly relevant to your growth plans.</p>"""
    },
    # MANUFACTURING (4)
    {
        "company": "Flexial Corporation",
        "contact_name": "Team",
        "email": "info@flexial.com",
        "industry": "Manufacturing - Aerospace Components",
        "employees": 150,
        "subject": "AI Agents for Aerospace Manufacturing — Cut Admin Time by 90%",
        "body": """<p>Hi there,</p>
<p>I'm reaching out to the leadership team at Flexial Corporation because we've been helping manufacturing companies deploy AI agents that dramatically reduce administrative overhead.</p>
<p>Our SiteVoice case study demonstrated <strong>$52K in savings and 90% reduction in admin time</strong> for a construction company — and the same voice-first AI approach is even more powerful for precision manufacturing environments like aerospace.</p>
<p>For Flexial Corporation, AI agents could help with:</p>
<ul>
<li>Voice-driven quality inspection reporting — operators log findings hands-free on the shop floor</li>
<li>Automated compliance documentation for aerospace standards (AS9100, NADCAP)</li>
<li>Real-time production tracking and exception alerts across your operations</li>
</ul>
<p>Manufacturing companies typically see the fastest ROI from AI because of the sheer volume of documentation and reporting requirements. Would someone on your leadership team have 30 minutes for a quick call?</p>"""
    },
    {
        "company": "Bliss Industries",
        "contact_name": "Team",
        "email": "info@blissindustries.com",
        "industry": "Manufacturing - Machinery/Equipment",
        "employees": 100,
        "subject": "AI for Manufacturing Operations — Real Results, Not Science Fiction",
        "body": """<p>Hi there,</p>
<p>I'm reaching out to the leadership team at Bliss Industries because we've been deploying AI agents that are delivering measurable ROI for manufacturing companies.</p>
<p>Our SiteVoice case study showed <strong>$52K in savings and 90% admin time reduction</strong> — and manufacturing companies see even faster payback because of the documentation-heavy nature of your operations.</p>
<p>For Bliss Industries, AI agents could help with:</p>
<ul>
<li>Voice-first shop floor reporting — production logs, quality checks, safety observations without stopping work</li>
<li>Automated work order management and scheduling optimization</li>
<li>Customer communication automation — order status, delivery updates, technical support triage</li>
</ul>
<p>Would someone on your leadership team have 30 minutes for a quick conversation? Happy to show a demo relevant to your operations.</p>"""
    },
    {
        "company": "Dallas Plastics Corporation",
        "contact_name": "Team",
        "email": "info@dallasplastics.com",
        "industry": "Manufacturing - Plastics/Packaging",
        "employees": 100,
        "subject": "AI for Plastics Manufacturing — Save 90% on Admin Time",
        "body": """<p>Hi there,</p>
<p>I'm reaching out to the leadership team at Dallas Plastics Corporation because we've been helping manufacturing companies deploy AI agents that eliminate operational bottlenecks.</p>
<p>Our case studies show dramatic results: <strong>$52K saved and 90% reduction in administrative time</strong> through voice-first AI agents. For a plastics manufacturer handling continuous production runs, the applications are immediate.</p>
<p>AI agents could help Dallas Plastics with:</p>
<ul>
<li>Automated production reporting — operators log output, quality metrics, and exceptions by voice</li>
<li>Real-time inventory tracking and reorder alerts for raw materials</li>
<li>Customer order management — automated status updates and delivery coordination</li>
</ul>
<p>Would someone on your leadership team have 30 minutes to explore how AI could improve your operations?</p>"""
    },
    {
        "company": "Elwood Corporation",
        "contact_name": "Team",
        "email": "info@elwoodcorp.com",
        "industry": "Manufacturing - Industrial Automation",
        "employees": 120,
        "subject": "AI Agents for Industrial Automation Companies — Practice What You Preach",
        "body": """<p>Hi there,</p>
<p>As a company in the industrial automation space, Elwood Corporation understands the value of technology in improving operational efficiency. I'm reaching out because we've been building the next layer of that efficiency — AI agents that handle the cognitive work that automation can't.</p>
<p>Our case studies show <strong>$52K in savings and 90% reduction in admin time</strong>. For a company like Elwood, the opportunity is to use AI agents internally while potentially offering AI-enhanced services to your customers.</p>
<p>Immediate applications for Elwood Corporation:</p>
<ul>
<li>Technical documentation automation — manuals, specifications, installation guides</li>
<li>Customer support triage — AI agents that understand your products and can handle first-line inquiries</li>
<li>Sales engineering support — automated proposal generation from specs and requirements</li>
</ul>
<p>Would someone on your leadership team have 30 minutes for a quick conversation?</p>"""
    },
    # EDTECH/EDUCATION (4)
    {
        "company": "Knack",
        "contact_name": "Megan Dusenbery",
        "email": "megan@joinknack.com",
        "industry": "EdTech - Peer Tutoring Platform",
        "employees": 50,
        "subject": "AI Agents for EdTech — Scale Your Platform Without Scaling Your Team",
        "body": """<p>Hi Megan,</p>
<p>Congratulations on stepping into the CEO role at Knack following the Series B — exciting times for the peer tutoring platform.</p>
<p>I'm reaching out because EdTech companies at your stage face a familiar challenge: scaling operations to match platform growth without proportionally growing the team. That's exactly what our AI agents solve.</p>
<p>For Knack, AI agents could help with:</p>
<ul>
<li>Automated tutor-student matching and scheduling optimization</li>
<li>24/7 support for students and tutors — onboarding, FAQs, session management</li>
<li>Institutional sales support — automated outreach, demo scheduling, and follow-up</li>
</ul>
<p>We've built AI agents that integrate with existing platforms and start delivering value in weeks, not months. Would you have 30 minutes for a quick call to explore what's possible?</p>"""
    },
    {
        "company": "CYPHER Learning",
        "contact_name": "Graham Glass",
        "email": "graham@cypherlearning.com",
        "industry": "EdTech - Learning Management System",
        "employees": 150,
        "subject": "AI Agents to Supercharge CYPHER Learning's Operations",
        "body": """<p>Hi Graham,</p>
<p>CYPHER Learning's success in building a globally recognized LMS platform with 50+ language options is impressive — Forbes recognition in EdTech doesn't come easy.</p>
<p>I'm reaching out because we build custom AI agents that help EdTech companies scale their operations. For a platform like CYPHER that serves diverse global markets, the operational complexity grows exponentially with each new market and language.</p>
<p>Our AI agents could help CYPHER Learning by:</p>
<ul>
<li>Automating customer onboarding and training across all 50+ supported languages</li>
<li>Providing 24/7 multilingual customer support that understands your platform deeply</li>
<li>Generating localized marketing content and sales materials at scale</li>
</ul>
<p>Would you have 30 minutes for a quick call? I'd love to show you how AI agents could amplify your team's global reach.</p>"""
    },
    {
        "company": "ClassDojo",
        "contact_name": "Sam Chaudhary",
        "email": "sam@classdojo.com",
        "industry": "EdTech - K-8 Communication Platform",
        "employees": 150,
        "subject": "AI Agents for ClassDojo — Serve More Schools Without More Staff",
        "body": """<p>Hi Sam,</p>
<p>ClassDojo's reach into 95% of US schools is extraordinary — you've essentially built the communication infrastructure for K-8 education. That scale creates both incredible opportunity and operational complexity.</p>
<p>I'm reaching out because we build AI agents that help EdTech platforms at scale manage the operational work that grows linearly with users. For ClassDojo, that might mean:</p>
<ul>
<li>AI-powered customer success — proactively helping schools maximize platform adoption</li>
<li>Automated content moderation and safety monitoring at scale</li>
<li>Intelligent support routing — resolving common issues instantly while escalating complex ones</li>
</ul>
<p>Would you have 30 minutes to explore how AI agents could help ClassDojo serve even more schools effectively?</p>"""
    },
    {
        "company": "Copyleaks",
        "contact_name": "Alon Yamin",
        "email": "alon@copyleaks.com",
        "industry": "EdTech - AI Content Detection",
        "employees": 100,
        "subject": "AI Agents for Copyleaks — Scaling an AI Company with AI",
        "body": """<p>Hi Alon,</p>
<p>Copyleaks' growth to 650,000+ daily AI content checks is remarkable — you've positioned the company at the center of one of education's most critical challenges.</p>
<p>I'm reaching out because even AI companies benefit from AI agents handling their operations. With demand exploding for AI detection tools, your team is probably stretched across sales, support, and enterprise deployments.</p>
<p>Our AI agents could help Copyleaks by:</p>
<ul>
<li>Automating enterprise sales support — demo scheduling, proposal generation, technical qualification</li>
<li>24/7 customer support that understands your product deeply enough to handle integration questions</li>
<li>Automated onboarding workflows for institutional clients (universities, school districts)</li>
</ul>
<p>Would you have 30 minutes for a quick call? There's something fitting about an AI company using AI agents to scale faster.</p>"""
    },
    # HOSPITALITY/RESTAURANTS (4)
    {
        "company": "Seven Reasons Group",
        "contact_name": "Ezequiel Vázquez-Ger",
        "email": "info@sevenreasonsgroup.com",
        "industry": "Hospitality - Multi-Concept Restaurant Group",
        "employees": 150,
        "subject": "AI for Restaurant Groups — From Ritz-Carlton to Surreal, Automate Operations",
        "body": """<p>Hi Ezequiel,</p>
<p>Seven Reasons Group's rapid expansion from a single restaurant to concepts at the Ritz-Carlton (Quadrant, TheSaga), plus Imperfecto, Joy, and Surreal — that's an impressive portfolio you've built in Washington, D.C.</p>
<p>I'm reaching out because multi-concept restaurant groups face a unique operational challenge: each concept has its own identity, menu, and staffing needs, but the back-office work (scheduling, inventory, vendor management) is repetitive across all of them.</p>
<p>Our AI agents help restaurant groups by:</p>
<ul>
<li>Automating staff scheduling optimization across all concepts</li>
<li>Managing vendor communications, ordering, and invoice reconciliation</li>
<li>Handling reservations, guest inquiries, and event coordination 24/7</li>
</ul>
<p>Our case studies show <strong>90% time savings on administrative tasks</strong>. For a growing group like Seven Reasons, that means your leadership team focuses on creating extraordinary guest experiences — not drowning in operations.</p>
<p>Would you have 30 minutes for a quick call?</p>"""
    },
    {
        "company": "Castellucci Hospitality Group",
        "contact_name": "Federico Castellucci III",
        "email": "info@chgrestaurants.com",
        "industry": "Hospitality - Multi-Concept Restaurant Group",
        "employees": 300,
        "subject": "AI for CHG — Automate Operations Across Your Atlanta Restaurants",
        "body": """<p>Hi Federico,</p>
<p>Growing Castellucci Hospitality Group from a single family operation to a multi-unit, multi-concept restaurant group in Atlanta — with Cooks & Soldiers, Double Zero, Mujo, Sugo, and The Iberian Pig — is a testament to your vision from Cornell Hospitality to CEO.</p>
<p>I'm reaching out because restaurant groups at your scale (200-500 employees) are where AI agents deliver the most dramatic ROI. The administrative burden of managing multiple concepts, locations, and hundreds of staff members is enormous — and most of it can be automated.</p>
<p>Our AI agents help hospitality groups by:</p>
<ul>
<li>Optimizing staff scheduling across all locations — reducing labor costs by 5-15%</li>
<li>Automating vendor management, ordering, and invoice reconciliation</li>
<li>Handling guest communications, reservations, and event inquiries 24/7</li>
</ul>
<p>Would you have 30 minutes for a quick conversation? I'd love to show you how AI can free up your management team to focus on the guest experience.</p>"""
    },
    {
        "company": "Atlas Restaurant Group",
        "contact_name": "Alex Smith",
        "email": "info@atlasrestaurantgroup.com",
        "industry": "Hospitality - Restaurant/Entertainment Group",
        "employees": 200,
        "subject": "AI Agents for 50 Restaurants — Atlas-Scale Operations, Automated",
        "body": """<p>Hi Alex,</p>
<p>Building Atlas Restaurant Group from an ice cream shop to 50 bars, restaurants, and entertainment concepts across five states with $200M+ in revenue — that CNBC story was incredible. The entrepreneurial energy is palpable.</p>
<p>At that scale, the operational complexity is immense. Every new concept multiplies scheduling, vendor management, compliance, and guest communication workloads. That's exactly where our AI agents deliver massive ROI.</p>
<p>For Atlas Restaurant Group, AI agents could:</p>
<ul>
<li>Centralize and automate staff scheduling across all 50 venues — reducing labor admin by 90%</li>
<li>Handle vendor communications, price comparisons, and ordering across all locations</li>
<li>Manage guest inquiries, reservations, and event coordination 24/7 across all concepts</li>
</ul>
<p>Our case studies show <strong>90% reduction in administrative time</strong>. At your scale, that translates to hundreds of thousands in savings.</p>
<p>Would you have 30 minutes for a quick call?</p>"""
    },
    {
        "company": "Boka Restaurant Group",
        "contact_name": "Rob Katz",
        "email": "info@bokagrp.com",
        "industry": "Hospitality - Chef-Driven Restaurant Group",
        "employees": 200,
        "subject": "AI for James Beard-Winning Restaurant Groups — Automate the Back of House",
        "body": """<p>Hi Rob,</p>
<p>Boka Restaurant Group's 18 James Beard nominations and the 2019 Outstanding Restaurateur award speak for themselves. What you and Kevin have built in Chicago — nearly 20 chef-driven concepts — is exceptional.</p>
<p>I'm reaching out because restaurant groups at your level invest enormous energy in the guest experience and culinary excellence, but back-office operations often consume disproportionate management time. Our AI agents solve that.</p>
<p>For Boka Restaurant Group, AI agents could:</p>
<ul>
<li>Automate scheduling across all concepts — reducing labor admin while respecting each restaurant's unique needs</li>
<li>Handle vendor management, ordering, and cost tracking across your portfolio</li>
<li>Manage guest communications, VIP preferences, and cross-concept recommendations</li>
</ul>
<p>Our case studies show <strong>90% time savings on administrative tasks</strong>. That means your team spends more time on what earned those James Beard nominations.</p>
<p>Would you have 30 minutes for a quick conversation?</p>"""
    },
    # ADDITIONAL CONSTRUCTION/LAW/ENGINEERING (4 more to reach 28)
    {
        "company": "Foster Garvey",
        "contact_name": "Joe Levitt",
        "email": "joe.levitt@foster.com",
        "industry": "Law Firm - Full Service/Business",
        "employees": 130,
        "subject": "AI Agents for Mid-Size Law Firms — VADIS Recovered $1.6M",
        "body": """<p>Hi Joe,</p>
<p>Foster Garvey's recognition on the 2024 Leopard Law Firm Index Mid-Sized 200 is well-deserved — it reflects the firm's strength in balancing sophisticated legal work with the agility of a mid-size platform.</p>
<p>I'm reaching out because we've built AI agents specifically for mid-size law firms. Our VADIS case study showed how AI-powered document analysis recovered <strong>$1.6M in previously missed claims</strong> — and we're seeing similar results across the legal industry.</p>
<p>For Foster Garvey's diverse practice areas, AI agents can help with:</p>
<ul>
<li>Contract analysis and due diligence automation for your business law practice</li>
<li>24/7 client intake and triage across your multiple offices</li>
<li>Knowledge management — instantly finding relevant precedents from your firm's document corpus</li>
</ul>
<p>Would you have 30 minutes for a quick call to explore what's possible?</p>"""
    },
    {
        "company": "Fredon Corporation",
        "contact_name": "Team",
        "email": "info@fredoncorp.com",
        "industry": "Manufacturing - Machinery",
        "employees": 100,
        "subject": "AI for Manufacturing — $52K Saved, 90% Time Reduction",
        "body": """<p>Hi there,</p>
<p>I'm reaching out to the leadership team at Fredon Corporation because we've been helping manufacturing companies deploy AI agents that deliver measurable operational improvements.</p>
<p>Our SiteVoice case study demonstrated <strong>$52K in savings and 90% reduction in administrative time</strong> through voice-first AI agents. For a machinery manufacturer like Fredon, the applications are immediate and impactful.</p>
<p>AI agents could help Fredon Corporation with:</p>
<ul>
<li>Voice-driven production reporting — operators log quality metrics and exceptions hands-free</li>
<li>Automated customer support — order tracking, technical inquiries, parts ordering</li>
<li>Streamlined documentation for regulatory compliance and quality certifications</li>
</ul>
<p>Manufacturing companies typically see the fastest ROI from AI because of the documentation intensity. Would someone on your leadership team have 30 minutes for a quick conversation?</p>"""
    },
    {
        "company": "Duvall Decker Architects",
        "contact_name": "Roy Decker",
        "email": "info@duvalldecker.com",
        "industry": "Architecture - Award-Winning Design",
        "employees": 40,
        "subject": "AI for the 2026 AIA Firm of the Year — Amplify Your Design Practice",
        "body": """<p>Hi Roy,</p>
<p>Congratulations on Duvall Decker receiving the 2026 AIA Architecture Firm Award — the highest honor for a US architecture practice. What an incredible achievement for the firm.</p>
<p>I'm reaching out because award-winning architecture firms like Duvall Decker often find that operational and administrative work consumes time that should be spent on design excellence. Our AI agents solve this by automating the repetitive work.</p>
<p>For Duvall Decker, AI agents could help with:</p>
<ul>
<li>Automated project documentation — meeting notes, RFI responses, submittal tracking</li>
<li>Client communication management — updates, scheduling, and follow-ups</li>
<li>RFP and proposal generation leveraging your award-winning project portfolio</li>
</ul>
<p>Our case studies show <strong>90% time savings on administrative tasks</strong>. Would you have 30 minutes for a quick conversation?</p>"""
    },
    {
        "company": "LPA Design Studios",
        "contact_name": "Dan Heinfeld",
        "email": "info@lpadesignstudios.com",
        "industry": "Architecture - Sustainable Design",
        "employees": 180,
        "subject": "AI Agents for the 2025 AIA Firm of the Year — Scale Without Overhead",
        "body": """<p>Hi Dan,</p>
<p>Congratulations on LPA Design Studios receiving the 2025 AIA Architecture Firm Award — a fitting recognition of your leadership in sustainable design and net-zero architecture.</p>
<p>I'm reaching out because firms at LPA's scale (~180 professionals) are perfectly positioned to benefit from AI agents. You're large enough that operational complexity matters, but nimble enough to implement quickly.</p>
<p>For LPA Design Studios, AI agents could help with:</p>
<ul>
<li>Automated sustainability analysis and reporting — tracking energy modeling, LEED documentation</li>
<li>Cross-office project coordination and knowledge sharing</li>
<li>Client communication automation and RFP response generation</li>
</ul>
<p>Our case studies show <strong>$52K in savings and 90% admin time reduction</strong>. For a firm doing cutting-edge sustainable design, AI is the natural next step.</p>
<p>Would you have 30 minutes for a quick call?</p>"""
    },
]

def create_draft(imap, to_email, subject, html_body):
    """Create a draft email in Gmail via IMAP."""
    msg = MIMEMultipart("alternative")
    msg["From"] = GMAIL_USER
    msg["To"] = to_email
    msg["Subject"] = subject
    
    full_html = f"""<html><body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
{html_body}
{SIGNATURE}
</body></html>"""
    
    msg.attach(MIMEText(full_html, "html"))
    
    # Save as draft via IMAP
    raw_msg = msg.as_bytes()
    imap.append("[Gmail]/Drafts", "\\Draft", None, raw_msg)
    print(f"  ✓ Draft created: {subject} → {to_email}")

def main():
    print(f"Connecting to Gmail as {GMAIL_USER}...")
    imap = imaplib.IMAP4_SSL("imap.gmail.com", 993)
    imap.login(GMAIL_USER, GMAIL_PASS)
    print("Connected!")
    
    # Track CSV entries
    csv_rows = []
    
    for i, p in enumerate(prospects, 1):
        print(f"\n[{i}/{len(prospects)}] {p['company']} — {p['contact_name']}")
        try:
            create_draft(imap, p["email"], p["subject"], p["body"])
            csv_rows.append({
                "company": p["company"],
                "contact_name": p["contact_name"],
                "email": p["email"],
                "industry": p["industry"],
                "employees": p["employees"],
                "status": "drafted",
                "date": "2026-02-13"
            })
        except Exception as e:
            print(f"  ✗ Error: {e}")
            csv_rows.append({
                "company": p["company"],
                "contact_name": p["contact_name"],
                "email": p["email"],
                "industry": p["industry"],
                "employees": p["employees"],
                "status": f"error: {e}",
                "date": "2026-02-13"
            })
        time.sleep(0.5)  # Rate limiting
    
    imap.logout()
    
    # Append to CSV
    csv_path = "outreach-tracker.csv"
    file_exists = os.path.exists(csv_path)
    
    with open(csv_path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["company", "contact_name", "email", "industry", "employees", "status", "date"])
        if not file_exists:
            writer.writeheader()
        for row in csv_rows:
            writer.writerow(row)
    
    print(f"\n✅ Done! {len(csv_rows)} prospects added to {csv_path}")
    print(f"   Drafted: {sum(1 for r in csv_rows if r['status'] == 'drafted')}")
    print(f"   Errors: {sum(1 for r in csv_rows if r['status'].startswith('error'))}")

if __name__ == "__main__":
    main()
