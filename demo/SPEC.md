# AfrexAI Interactive Demo Portal — Implementation Spec

## Overview

Single-page app at `/demo/index.html` with **two demo modes** representing AfrexAI's two service models:

1. **CMA (Customer Managed Agents)** — customer buys OpenClaw, installs AfrexAI skills from ClawHub, runs agents themselves
2. **AaaS (AI-Agents-as-a-Service)** — AfrexAI deploys and manages a full agent workforce on the customer's behalf

No login, no frameworks, no build tools. Vanilla HTML/CSS/JS. One file.

---

## File Structure

| File | Est. Lines | Purpose |
|------|-----------|---------|
| `demo/index.html` | ~1400 | Complete SPA — both modes, all data inline |

---

## Navigation Flow

```
[Landing: Choose Your Path]
    ├── "I want to manage my own agents" → CMA Demo
    │       [Skill Browser] → [Install Flow] → [Agent Running] → [Results]
    │
    └── "I want AfrexAI to manage for me" → AaaS Demo
            [Company Selector] → [Dashboard] → [Agent Detail] → [ROI]
```

A top-left "← Back to demo menu" link is always visible in both modes to return to landing.

---

## Landing Page

Full-screen, centred. Two paths presented as large cards side by side (stack on mobile).

```
┌──────────────────────────────────────────────────────┐
│                    AfrexAI                            │
│              See AI Agents in Action                  │
│                                                       │
│   ┌─────────────────┐    ┌─────────────────┐         │
│   │  🛠️ DIY          │    │  🏢 Managed      │         │
│   │                  │    │                  │         │
│   │ Install skills   │    │ We deploy &      │         │
│   │ from ClawHub.    │    │ manage your      │         │
│   │ Run agents on    │    │ AI workforce.    │         │
│   │ your OpenClaw.   │    │ You watch it     │         │
│   │                  │    │ work.            │         │
│   │ Self-service.    │    │ Full-service.    │         │
│   │ You're in        │    │ We handle        │         │
│   │ control.         │    │ everything.      │         │
│   │                  │    │                  │         │
│   │ [Explore →]      │    │ [Explore →]      │         │
│   └─────────────────┘    └─────────────────┘         │
│                                                       │
│   Not sure? Start with DIY — upgrade to managed       │
│   anytime.                                            │
└──────────────────────────────────────────────────────┘
```

### Card Details

**Left card (CMA):**
- Icon: 🛠️
- Title: "Manage Your Own Agents"
- Subtitle: "OpenClaw + ClawHub Skills"
- Bullets: "Browse the skill marketplace", "Install with one click", "Your agents, your control"
- Gold outline border, dark fill

**Right card (AaaS):**
- Icon: 🏢
- Title: "AfrexAI Managed Workforce"
- Subtitle: "AI-Agents-as-a-Service"
- Bullets: "3-9 agents deployed for you", "Real-time monitoring & SLA", "Full ROI reporting"
- Gold filled, dark text (more prominent — this is the bigger sale)

---

# MODE 1: CMA Demo (Customer Managed Agents)

## Concept

Simulates the experience of a small business owner who has OpenClaw installed and is browsing ClawHub for skills to give their agent. Linear walkthrough with 4 steps, each a screen.

## Flow

```
[Step 1: ClawHub Skill Browser] → [Step 2: Install Skill] → [Step 3: Agent Working] → [Step 4: Results]
```

Progress bar at top showing steps 1-4.

## Screen 1: ClawHub Skill Browser

Simulates a marketplace/app-store UI.

**Header**: "ClawHub — Skill Marketplace" with search bar (decorative — filters the cards below with simple text match).

**Skill cards** (6 cards, 2×3 grid, scroll on mobile):

```js
const CMA_SKILLS = [
  {
    id: "email-triage",
    name: "Email Triage & Response",
    icon: "📧",
    author: "AfrexAI",
    rating: 4.8,
    installs: "2.4k",
    category: "Productivity",
    description: "Automatically categorises incoming emails by priority and intent. Drafts responses for routine enquiries. Flags urgent items for human review.",
    capabilities: ["Priority classification", "Auto-draft replies", "Urgent flagging", "Newsletter filtering"],
    price: "Free"
  },
  {
    id: "invoice-processor",
    name: "Invoice Processing",
    icon: "🧾",
    author: "AfrexAI",
    rating: 4.6,
    installs: "1.8k",
    category: "Finance",
    description: "Extracts data from invoices (PDF, email, photo). Matches to POs, flags discrepancies, routes for approval.",
    capabilities: ["PDF extraction", "PO matching", "Approval routing", "Duplicate detection"],
    price: "Free"
  },
  {
    id: "appointment-scheduler",
    name: "Appointment Scheduler",
    icon: "📅",
    author: "AfrexAI",
    rating: 4.9,
    installs: "3.1k",
    category: "Operations",
    description: "Manages appointment booking, reminders, rescheduling, and no-show follow-up across calendar systems.",
    capabilities: ["Calendar sync", "SMS/email reminders", "Waitlist management", "No-show re-engagement"],
    price: "Free"
  },
  {
    id: "document-summariser",
    name: "Document Summariser",
    icon: "📄",
    author: "AfrexAI",
    rating: 4.5,
    installs: "1.2k",
    category: "Research",
    description: "Reads lengthy documents and produces structured summaries with key points, action items, and risk flags.",
    capabilities: ["Executive summaries", "Action item extraction", "Risk flagging", "Multi-format support"],
    price: "Free"
  },
  {
    id: "social-monitor",
    name: "Social Media Monitor",
    icon: "📱",
    author: "AfrexAI",
    rating: 4.3,
    installs: "890",
    category: "Marketing",
    description: "Monitors brand mentions across social platforms. Alerts on negative sentiment. Drafts responses.",
    capabilities: ["Mention tracking", "Sentiment analysis", "Response drafts", "Weekly reports"],
    price: "Free"
  },
  {
    id: "daily-briefing",
    name: "Daily Briefing Generator",
    icon: "☀️",
    author: "AfrexAI",
    rating: 4.7,
    installs: "2.1k",
    category: "Productivity",
    description: "Compiles a morning briefing from your calendar, email, tasks, and news. Delivered to your preferred channel.",
    capabilities: ["Calendar summary", "Email highlights", "Task priorities", "Industry news"],
    price: "Free"
  }
];
```

**Each card shows:**
- Icon (large emoji)
- Skill name (bold)
- Author: "by AfrexAI" (gold text)
- Star rating + install count
- Category pill badge
- 1-line description (truncated)
- "Install" button (gold outline)

**Clicking a card** → expands it inline or opens a detail overlay with full description + capabilities list + bigger "Install to Your Agent →" button.

**Clicking "Install"** on any skill → transitions to Step 2 with that skill selected. For the demo, we pre-select **Email Triage & Response** if they click the main CTA button, but any card's install button works.

## Screen 2: Install Flow

Simulated installation sequence. ~5 seconds of animated progress.

```
┌─────────────────────────────────────────┐
│  Installing "Email Triage & Response"   │
│                                         │
│  ✅ Connecting to your OpenClaw...      │
│  ✅ Downloading skill package...        │
│  ✅ Configuring permissions...          │
│  ⏳ Running first scan...              │
│  ○  Ready                               │
│                                         │
│  [━━━━━━━━━━━━━━━░░░░░]  72%          │
└─────────────────────────────────────────┘
```

Steps appear one at a time (1s apart), check marks animate in. Progress bar fills. After all complete (~5s), big green checkmark and "Your agent now has the Email Triage skill! →  See it in action" button.

## Screen 3: Agent Working

Shows a single agent (named "Your Agent" or "Alex" — a friendly default) actively using the installed skill. This is a simplified version of the AaaS activity feed but for one agent.

**Layout:**
```
┌──────────────────────────────────────────┐
│  🤖 Your Agent — Alex                    │
│  Skill: Email Triage & Response  ● Live  │
├──────────────────────────────────────────┤
│                                          │
│  📥 Inbox: 34 unread emails              │
│                                          │
│  Activity:                               │
│  10:42:03  Scanning inbox...             │
│  10:42:05  Categorised: Newsletter (→ Read│
│            Later)                         │
│  10:42:08  Categorised: Client enquiry   │
│            from Sarah at Meridian (→ HIGH)│
│  10:42:11  Drafting reply to Sarah...    │
│  10:42:14  ✅ Draft ready for review     │
│  10:42:18  Categorised: Spam (→ Trash)   │
│  10:42:21  Categorised: Invoice from     │
│            supplier (→ Finance)           │
│  10:42:25  Flagged: Urgent — contract    │
│            deadline tomorrow (→ YOU)      │
│  ...                                     │
│                                          │
│  Processed: 12/34  ━━━━━━━━░░░  35%     │
└──────────────────────────────────────────┘
```

Activities appear one by one (2-3s intervals). Each has a category badge:
- 🔴 URGENT → forwarded to you
- 🟡 HIGH → draft response ready
- 🟢 ROUTINE → auto-handled
- ⚪ LOW → filed/archived

After 12-15 items (or user clicks "Skip to results →"), transition to Step 4.

**Activity templates for Email Triage simulation:**
```js
const CMA_EMAIL_ACTIVITIES = [
  { text: "Categorised: Newsletter from {sender} → Read Later", priority: "low", action: "Filed" },
  { text: "Categorised: Client enquiry from {client} → HIGH", priority: "high", action: "Draft ready" },
  { text: "Drafting reply to {client}...", priority: null, action: null },
  { text: "✅ Draft reply ready for your review", priority: null, action: "Review" },
  { text: "Categorised: Spam from {spammer} → Trash", priority: "low", action: "Deleted" },
  { text: "Categorised: Invoice from {vendor} → Finance folder", priority: "routine", action: "Filed" },
  { text: "🚨 Flagged URGENT: {urgent_subject}", priority: "urgent", action: "Sent to you" },
  { text: "Categorised: Meeting request from {colleague} → Calendar", priority: "routine", action: "Accepted" },
  { text: "Categorised: Support ticket #{num} → Support queue", priority: "routine", action: "Routed" },
  { text: "Auto-replied to {sender}: 'Thanks, we'll get back to you within 24h'", priority: "routine", action: "Sent" }
];

const CMA_FILL = {
  sender: ["HubSpot", "Mailchimp", "LinkedIn", "TechCrunch", "Industry Weekly"],
  client: ["Sarah at Meridian", "James from BuildRight", "Pacific Legal team", "Priya at Summit Financial"],
  spammer: ["crypto-deals@spam.com", "win-prize@fake.net", "urgent-offer@scam.co"],
  vendor: ["AWS", "Dropbox", "Adobe", "Zoom"],
  urgent_subject: ["Contract deadline tomorrow — needs signature", "Server alert: disk space critical", "Client escalation — immediate response needed"],
  colleague: ["David", "Maria", "Tom", "Rachel"],
  num: ["4821", "4822", "4823", "4824"]
};
```

## Screen 4: Results Summary

Shows what the agent accomplished in the simulated session.

```
┌──────────────────────────────────────────┐
│  ✅ Session Complete                      │
│                                          │
│  Your agent processed 34 emails in 4 min │
│                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ 🔴 3   │ │ 🟡 8   │ │ 🟢 15  │      │
│  │ Urgent  │ │ High   │ │Routine │      │
│  │Flagged  │ │ Drafts │ │ Auto-  │      │
│  │ for you │ │ ready  │ │handled │      │
│  └────────┘ └────────┘ └────────┘      │
│                        ┌────────┐       │
│                        │ ⚪ 8   │       │
│                        │ Low    │       │
│                        │ Filed  │       │
│                        └────────┘       │
│                                          │
│  ⏱️ Time saved: ~45 minutes              │
│  📊 That's 15 hours/month on autopilot   │
│                                          │
│  Want more skills? There are 6 on        │
│  ClawHub — and growing.                  │
│                                          │
│  [Browse ClawHub Skills]  [Get OpenClaw] │
│                                          │
│  Or let us handle everything →           │
│  [See Managed Service Demo]              │
└──────────────────────────────────────────┘
```

**KPI cards** (animated counters):
- Emails processed: 34
- Urgent flagged: 3
- Drafts ready: 8
- Auto-handled: 23
- Time saved: ~45 min
- Monthly projection: 15 hrs saved

**CTAs:**
- Primary: "Browse Skills on ClawHub" → `https://clawhub.com` (placeholder, can update later)
- Secondary: "Get Started with OpenClaw" → `https://openclaw.com` (placeholder)
- Tertiary: "Or let us handle everything → See Managed Service Demo" → switches to AaaS mode

---

# MODE 2: AaaS Demo (AI-Agents-as-a-Service)

This is the existing spec, mostly unchanged. The richer, full-dashboard experience.

## Flow

```
[Company Selector] → [Dashboard + Activity Feed] → [Agent Detail] → [ROI + Before/After]
```

## Company Selector

3 cards — same as original spec. Prospect picks a demo company.

## Data Model

### Companies

```js
const AAAS_DATA = {
  companies: [
    {
      id: "meridian-health",
      name: "Meridian Health Partners",
      vertical: "Healthcare",
      tier: "Enterprise",
      tierPrice: "$12,000/mo base",
      monthlyPrice: 13200,
      agentCount: 3,
      logo: "🏥",
      tagline: "Multi-location medical practice — 45 staff",
      deployedSince: "2025-11-12",
      agents: [
        {
          id: "patient-coordinator",
          name: "Patient Coordinator",
          description: "Manages appointment scheduling, referrals, patient communications, and intake workflows",
          icon: "📋",
          status: "active",
          tasksCompleted: 1243,
          tasksToday: 47,
          avgTaskTime: "2.1 min",
          hoursSavedMonth: 142,
          uptime: 99.98
        },
        {
          id: "compliance-officer",
          name: "Compliance Officer",
          description: "Monitors HIPAA compliance, audit readiness, policy updates, and staff training schedules",
          icon: "🛡️",
          status: "active",
          tasksCompleted: 891,
          tasksToday: 12,
          avgTaskTime: "5.8 min",
          hoursSavedMonth: 96,
          uptime: 99.99
        },
        {
          id: "records-analyst",
          name: "Records Analyst",
          description: "Manages medical record requests, ensures documentation completeness, and tracks chart deficiencies",
          icon: "🗂️",
          status: "active",
          tasksCompleted: 713,
          tasksToday: 28,
          avgTaskTime: "3.2 min",
          hoursSavedMonth: 74,
          uptime: 99.95
        }
      ],
      kpis: {
        tasksThisMonth: 2847,
        hoursSaved: 312,
        costSavings: 18720,
        avgResponseTime: "2.4 min",
        uptime: 99.97,
        slaCompliance: 99.8
      },
      activities: [
        { agent: "patient-coordinator", templates: [
          "Scheduled appointment for {patient} — {specialty}",
          "Sent appointment reminder to {patient}",
          "Processed referral from Dr. {doctor} → {specialty}",
          "Updated intake forms for new patient {patient}",
          "Rescheduled {patient} from {date1} to {date2}",
          "Confirmed insurance eligibility for {patient}"
        ]},
        { agent: "compliance-officer", templates: [
          "Completed HIPAA training verification — {staff}",
          "Flagged expired BAA with {vendor}",
          "Generated monthly compliance report",
          "Verified access log audit — {department}",
          "Updated privacy policy documentation"
        ]},
        { agent: "records-analyst", templates: [
          "Processed medical records request — {patient}",
          "Flagged incomplete chart for Dr. {doctor}",
          "Archived {count} inactive patient records",
          "Sent records to {facility} via secure transfer",
          "Completed chart deficiency review — {department}"
        ]}
      ],
      fill: {
        patient: ["Maria Santos", "James Chen", "Aisha Patel", "Robert Kim", "Diana Moss", "Carlos Rivera", "Priya Sharma", "Thomas Walker"],
        specialty: ["Cardiology", "Orthopedics", "Internal Medicine", "Dermatology", "Neurology", "Pediatrics"],
        doctor: ["Chen", "Patel", "Williams", "Nakamura", "Okafor"],
        staff: ["Dr. Chen", "Nurse Williams", "Tech Santos", "Admin Patel"],
        vendor: ["LabCorp", "Quest Diagnostics", "Medline", "McKesson"],
        department: ["Cardiology", "Radiology", "ER", "Admin"],
        facility: ["St. Mary's Hospital", "Regional Medical Center", "University Health"],
        date1: ["Monday 2pm", "Tuesday 10am", "Wednesday 3pm"],
        date2: ["Thursday 11am", "Friday 9am", "Monday 4pm"],
        count: ["34", "18", "27", "42"]
      },
      beforeAfter: {
        before: [
          { task: "Patient scheduling", time: "45 min/patient", pain: "12% double-bookings" },
          { task: "HIPAA audit prep", time: "3 weeks", pain: "Manual checklist gaps" },
          { task: "Records requests", time: "48hr turnaround", pain: "22% incomplete" },
          { task: "Referral follow-up", time: "Often forgotten", pain: "35% drop-off" }
        ],
        after: [
          { task: "Patient scheduling", time: "3 min/patient", gain: "93% faster" },
          { task: "HIPAA audit prep", time: "Always current", gain: "Continuous monitoring" },
          { task: "Records requests", time: "4hr turnaround", gain: "92% faster" },
          { task: "Referral follow-up", time: "Same-day", gain: "98% completion" }
        ]
      }
    },

    {
      id: "pacific-legal",
      name: "Pacific Legal Group",
      vertical: "Legal Services",
      tier: "Growth",
      tierPrice: "$4,500/mo base",
      monthlyPrice: 4950,
      agentCount: 3,
      logo: "⚖️",
      tagline: "Boutique litigation firm — 12 attorneys",
      deployedSince: "2025-12-03",
      agents: [
        {
          id: "legal-ea",
          name: "Legal Executive Assistant",
          description: "Manages calendars, deadlines, court filings, and daily administrative workflow for attorneys",
          icon: "📅",
          status: "active",
          tasksCompleted: 891,
          tasksToday: 31,
          avgTaskTime: "1.8 min",
          hoursSavedMonth: 96,
          uptime: 99.99
        },
        {
          id: "document-analyst",
          name: "Document Analyst",
          description: "Reviews, summarises, and flags issues in contracts, briefs, and legal documents",
          icon: "📄",
          status: "active",
          tasksCompleted: 634,
          tasksToday: 18,
          avgTaskTime: "4.2 min",
          hoursSavedMonth: 87,
          uptime: 99.95
        },
        {
          id: "client-followup",
          name: "Client Follow-up Coordinator",
          description: "Tracks client communications, sends follow-ups, and ensures nothing falls through the cracks",
          icon: "📞",
          status: "active",
          tasksCompleted: 512,
          tasksToday: 22,
          avgTaskTime: "1.4 min",
          hoursSavedMonth: 54,
          uptime: 99.97
        }
      ],
      kpis: {
        tasksThisMonth: 2037,
        hoursSaved: 237,
        costSavings: 23700,
        avgResponseTime: "1.8 min",
        uptime: 99.97,
        slaCompliance: 99.9
      },
      activities: [
        { agent: "legal-ea", templates: [
          "Filed motion in {case}",
          "Calendared deadline: {deadline} for {attorney}",
          "Prepared conference agenda for {attorney}",
          "Sent court appearance reminder — {court}",
          "Booked deposition room for {case}",
          "Updated case calendar — {case}"
        ]},
        { agent: "document-analyst", templates: [
          "Reviewed contract for {client} ({pages} pages)",
          "Flagged non-standard indemnity clause in {document}",
          "Summarised deposition transcript — {case}",
          "Compared contract revisions — {document}",
          "Generated due diligence checklist for {client}"
        ]},
        { agent: "client-followup", templates: [
          "Sent case status update to {client}",
          "Scheduled consultation with {prospect}",
          "Followed up on outstanding invoice — {client}",
          "Sent document request to {client}",
          "Confirmed retainer agreement receipt — {client}"
        ]}
      ],
      fill: {
        case: ["Martinez v. StateBank", "Chen IP Dispute", "Greenfield Zoning Appeal", "Duval Employment Claim"],
        deadline: ["Discovery response due Mar 3", "Filing deadline Mar 10", "Mediation brief due Feb 28"],
        attorney: ["Ms. Tanaka", "Mr. Osei", "Ms. Reeves", "Mr. Gutierrez"],
        court: ["SF Superior Court", "9th Circuit", "CA Court of Appeal"],
        client: ["Martinez family", "Chen Industries", "Greenfield LLC", "Duval Corp"],
        prospect: ["Rivera Holdings", "Westlake Properties"],
        pages: ["42", "18", "67", "124", "31"],
        document: ["Greenfield lease agreement", "Chen licensing terms", "Duval severance package"]
      },
      beforeAfter: {
        before: [
          { task: "Deadline tracking", time: "Manual calendar checks", pain: "2 missed deadlines/year" },
          { task: "Document review", time: "4-6 hours/contract", pain: "Key clauses missed" },
          { task: "Client follow-up", time: "Whenever remembered", pain: "38% response lag >48h" },
          { task: "Court filing prep", time: "Half-day per filing", pain: "Last-minute scrambles" }
        ],
        after: [
          { task: "Deadline tracking", time: "Auto-calendared", gain: "Zero missed deadlines" },
          { task: "Document review", time: "45 min/contract", gain: "87% faster" },
          { task: "Client follow-up", time: "Same-day, every time", gain: "98% within 24h" },
          { task: "Court filing prep", time: "2 hours", gain: "75% faster" }
        ]
      }
    },

    {
      id: "buildright",
      name: "BuildRight Construction",
      vertical: "Construction",
      tier: "Starter",
      tierPrice: "$1,500/mo",
      monthlyPrice: 1500,
      agentCount: 1,
      logo: "🏗️",
      tagline: "Commercial contractor — 28 crew, 4 active sites",
      deployedSince: "2026-01-08",
      agents: [
        {
          id: "site-reporter",
          name: "Site Reporter",
          description: "Compiles daily site reports, logs progress photos, tracks weather delays and milestones",
          icon: "📊",
          status: "active",
          tasksCompleted: 423,
          tasksToday: 14,
          avgTaskTime: "3.5 min",
          hoursSavedMonth: 67,
          uptime: 99.92
        }
      ],
      kpis: {
        tasksThisMonth: 423,
        hoursSaved: 67,
        costSavings: 4020,
        avgResponseTime: "3.2 min",
        uptime: 99.92,
        slaCompliance: 99.5
      },
      activities: [
        { agent: "site-reporter", templates: [
          "Generated daily report — {site}",
          "Logged weather delay at {site}: {weather}",
          "Updated milestone: {milestone} at {site}",
          "Compiled weekly progress summary — {site}",
          "Flagged schedule variance — {site} ({days} days behind)",
          "Uploaded {photoCount} progress photos — {site}",
          "Sent daily report to {recipient}"
        ]}
      ],
      fill: {
        site: ["Riverside Office Complex", "Marina Heights Phase 2", "Downtown Parking Structure", "Eastgate Retail Center"],
        weather: ["Heavy rain — outdoor work paused", "High wind advisory — crane ops suspended", "Heat advisory — modified schedule"],
        milestone: ["Foundation pour complete", "Steel framing 80%", "Rough electrical started", "HVAC install on schedule"],
        days: ["2", "3", "1", "5"],
        photoCount: ["12", "8", "15", "6"],
        recipient: ["Mike (PM)", "Client: Riverside LLC", "Safety team", "Head office"]
      },
      beforeAfter: {
        before: [
          { task: "Daily reports", time: "1.5 hrs/site/day", pain: "Often late or skipped" },
          { task: "Progress tracking", time: "Weekly at best", pain: "Surprises at client meetings" },
          { task: "Weather delays", time: "Verbal only", pain: "No audit trail" },
          { task: "Photo documentation", time: "Ad hoc", pain: "Missing coverage" }
        ],
        after: [
          { task: "Daily reports", time: "Auto-generated by 6pm", gain: "100% on-time" },
          { task: "Progress tracking", time: "Real-time", gain: "Daily milestone updates" },
          { task: "Weather delays", time: "Auto-logged", gain: "Full audit trail" },
          { task: "Photo documentation", time: "Structured & tagged", gain: "Complete site history" }
        ]
      },
      upgradePrompt: {
        show: true,
        text: "BuildRight runs 1 agent on Starter ($1,500/mo). Upgrading to Growth ($4,500/mo) adds Safety & Compliance Monitor + Project Coordinator — covering OSHA tracking, subcontractor scheduling, and RFI management."
      }
    }
  ]
};
```

## AaaS Layout

```
┌─────────────────────────────────────────────────────┐
│  ← Demo Menu  │  AfrexAI Managed  │  Company  │[⇄] │
├───────────┬─────────────────────────────────────────┤
│ Sidebar   │  Main Content                           │
│           │                                         │
│ 📊 Dashboard│                                       │
│ 🤖 Agents   │                                       │
│ 📈 ROI      │                                       │
│           │                                         │
│ ───────── │                                         │
│ SLA: 99.8%│                                         │
│ ───────── │                                         │
│ 📞 Book   │                                         │
│    Call    │                                         │
└───────────┴─────────────────────────────────────────┘
```

Mobile (<768px): bottom tab bar with 3 icons (Dashboard, Agents, ROI).

### Sidebar extras vs original spec
- **SLA Compliance** indicator (green bar + percentage) — reinforces "managed service" feel
- "Managed by AfrexAI" badge at top of sidebar

## AaaS Views

### Dashboard View
- **KPI cards** (5 cards, wrap on mobile):
  - Tasks This Month (animated counter)
  - Hours Saved ("≈ X work weeks")
  - Cost Savings ("vs manual processing")
  - SLA Compliance (percentage + green/amber indicator)
  - Uptime (percentage + green dot)
- **Agent Status Grid**: card per agent — name, icon, pulsing status dot, current action, tasks today
- **Live Activity Feed**: new items every 3-8s, slide-in animation, max 50 DOM nodes

### Agents View
- Full agent cards with click → slide-out detail panel (400px from right, fullscreen on mobile)
- Detail panel: stats grid, task log (last 20, live-updating), capacity bar (60-85%)

### ROI View
- **ROI Summary**: big animated numbers + "equivalent to X FTEs" + cost vs savings bar (CSS)
- **Before/After**: two-column table, red-tinted left (without), green-tinted right (with AfrexAI)
- **Upgrade prompt** (BuildRight only): shown as a gold-bordered callout box

### CTA Bar (AaaS only)
- Fixed bottom 60px bar, semi-transparent
- "Ready to deploy your own AI agents?" + gold "Book a Call →" button
- Links to `https://calendly.com/cbeckford-afrexai/30min`

---

## Activity Simulation Engine (shared logic, used by both modes)

```js
class ActivitySimulator {
  constructor(templates, fillData, onActivity) {
    this.templates = templates;   // array of { agent, templates[] }
    this.fill = fillData;         // { key: [values] }
    this.onActivity = onActivity; // callback(item)
    this.timer = null;
    this.count = 0;
  }

  start(seedCount = 15, intervalRange = [3000, 8000]) {
    this.intervalRange = intervalRange;
    // Seed history: generate seedCount items with timestamps spread over last 30 min
    for (let i = seedCount; i > 0; i--) {
      const offset = i * (30 * 60 * 1000 / seedCount);
      const item = this.generate(new Date(Date.now() - offset));
      this.onActivity(item, false); // false = no animation
    }
    this.scheduleNext();
  }

  scheduleNext() {
    const [min, max] = this.intervalRange;
    const delay = min + Math.random() * (max - min);
    this.timer = setTimeout(() => {
      const item = this.generate(new Date());
      this.onActivity(item, true); // true = animate
      this.count++;
      this.scheduleNext();
    }, delay);
  }

  generate(timestamp) {
    // 1. Pick random agent group (weighted or uniform)
    const group = this.templates[Math.floor(Math.random() * this.templates.length)];
    // 2. Pick random template
    const tpl = group.templates[Math.floor(Math.random() * group.templates.length)];
    // 3. Replace {placeholders} with random fill data
    const text = tpl.replace(/\{(\w+)\}/g, (_, key) => {
      const arr = this.fill[key];
      return arr ? arr[Math.floor(Math.random() * arr.length)] : key;
    });
    return {
      time: timestamp,
      agent: group.agent,
      text: text
    };
  }

  stop() {
    clearTimeout(this.timer);
  }
}
```

### CMA mode uses the same engine
- Single agent group, faster interval `[2000, 3500]`, seed 0 items (starts empty, builds up live)
- `onActivity` callback also updates the inbox progress counter

### AaaS mode
- Multi-agent groups, interval `[3000, 8000]`, seed 15 items
- `onActivity` updates feed DOM, agent tasksToday, and periodic KPI bumps

### Agent Status Cycling (AaaS only)

Each agent independently cycles status every 10-15s:
- **active** (green pulse) — 70% — shows current task text
- **processing** (gold pulse) — 20% — "Analysing...", "Generating report..."
- **idle** (grey) — 10% — "Waiting for tasks"

### KPI Counter Animation

```js
function animateCounter(el, from, to, duration = 600) {
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(from + (to - from) * progress);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
```

---

## Styling (both modes share CSS variables)

```css
:root {
  --bg: #0a0a0a;
  --surface: #111;
  --surface2: #1a1a1a;
  --surface3: #222;
  --gold: #FFD700;
  --gold-dim: #b89b00;
  --text: #e8e8e8;
  --text-dim: #888;
  --text-muted: #555;
  --green: #00e676;
  --red: #ff5252;
  --orange: #ffab40;
  --blue: #448aff;
  --radius: 12px;
}
```

### Mode-specific styling
- **CMA mode**: slightly more "product" feel — rounded cards, app-store grid, step progress indicator with gold dots
- **AaaS mode**: more "enterprise dashboard" feel — sidebar nav, denser data layout, SLA badges

### Shared effects
- `@keyframes slideIn { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }`
- `@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }`
- Gold hover glow: `box-shadow: 0 0 20px rgba(255,215,0,0.15)`
- Cards: `background: var(--surface); border: 1px solid var(--surface3); border-radius: 12px`

### Responsive breakpoints
- `>1024px`: full sidebar (AaaS) or 3-col grid (CMA)
- `768-1024px`: collapsed sidebar/hamburger
- `<768px`: bottom tabs (AaaS), stacked cards (both), full-width panels

---

## State Management

Single `state` object, no framework:

```js
const state = {
  mode: null,              // 'cma' | 'aaas' | null (landing)
  cma: {
    step: 1,               // 1-4
    selectedSkill: null,    // skill id
    processedCount: 0,
    results: { urgent: 0, high: 0, routine: 0, low: 0 }
  },
  aaas: {
    selectedCompany: null,  // company id
    currentView: 'dashboard', // dashboard | agents | roi
    agentDetailOpen: null   // agent id or null
  },
  simulator: null           // ActivitySimulator instance
};
```

View switching: all views are divs with `display:none` by default, toggled by `showView(mode, view)` function. Simulator is stopped/started on every major navigation.

---

## Implementation Notes

1. **Single file** — all HTML, CSS, JS inline. ~1400 lines estimated.
2. **No external deps** — system fonts, emoji icons. No CDN.
3. **URL hash** — optional: `#cma`, `#aaas`, `#aaas/meridian-health` for bookmarkable states. Simple `hashchange` listener.
4. **Performance** — cap activity feed DOM at 50 nodes. Use `documentFragment` for batch inserts.
5. **Accessibility** — `aria-live="polite"` on feeds, button roles, keyboard navigation, focus management on panel open/close.
6. **CMA → AaaS bridge** — the "See Managed Service Demo" link on CMA results screen sets `state.mode = 'aaas'` and transitions to company selector.
7. **AaaS → CMA bridge** — not needed (AaaS is the upsell), but the "← Demo Menu" link returns to landing.

---

## Build Checklist

- [ ] Create `demo/index.html`
- [ ] Landing page with two mode cards
- [ ] **CMA Mode:**
  - [ ] Skill browser with 6 skill cards + search filter
  - [ ] Skill detail expand/overlay
  - [ ] Install flow animation (5 steps, progress bar)
  - [ ] Agent working screen with live email triage simulation
  - [ ] Results summary with KPI cards + CTAs
- [ ] **AaaS Mode:**
  - [ ] Company selector (3 cards)
  - [ ] Dashboard view (KPIs + agent grid + activity feed)
  - [ ] Agent detail slide-out panel
  - [ ] ROI + Before/After view
  - [ ] CTA bottom bar with Calendly link
- [ ] **Shared:**
  - [ ] ActivitySimulator class
  - [ ] Counter animation utility
  - [ ] Mobile responsive layout
  - [ ] Back-to-landing navigation
  - [ ] All data constants (CMA_SKILLS, CMA_EMAIL_ACTIVITIES, AAAS_DATA)
- [ ] Test: both modes end-to-end
- [ ] Test: company switching in AaaS mode
- [ ] Test: mobile layout both modes
- [ ] Verify Calendly link
