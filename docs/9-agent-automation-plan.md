# AfrexAI 9-Agent Automation Plan

> **Version:** 1.0 | **Date:** 2026-02-13 | **Authors:** Kalin Smolichki (CTO), AI Architect
> **Goal:** Automate AfrexAI's entire operation toward $11M ARR with 9 AI agents running on OpenClaw cron (8am/8pm GMT daily)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Agent Communication System](#agent-communication-system)
3. [The 9 Agents — Detailed Specs](#the-9-agents)
4. [Escalation Protocol](#escalation-protocol)
5. [Revenue Impact Estimate](#revenue-impact-estimate)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Risk & Failure Modes](#risk--failure-modes)
8. [The "Lights Out" Vision](#the-lights-out-vision)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw (MacBook Host)                    │
│                                                               │
│  CRON: 08:00 GMT ──▶ All 9 agents run morning routines       │
│  CRON: 20:00 GMT ──▶ All 9 agents run evening routines       │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Exec Asst│  │Marketing │  │ Content  │  │ Outbound │     │
│  │  Agent   │  │ Analyst  │  │  Writer  │  │  Sales   │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │              │              │              │           │
│  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐     │
│  │Bookkeeper│  │   COO    │  │Strategist│  │Consultant│     │
│  │  Agent   │  │  Agent   │  │  Agent   │  │  Agent   │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │              │              │              │           │
│       │         ┌────┴─────┐       │              │           │
│       └─────────│  Project │───────┘──────────────┘           │
│                 │  Manager │                                   │
│                 └──────────┘                                   │
│                                                               │
│  Shared: workspace-main/agents/ (file-based coordination)     │
│  Comms:  Slack #ceo-dashboard, #dev                           │
│  Data:   Gmail, Google Sheets, QuickBooks, Calendly, Web      │
└─────────────────────────────────────────────────────────────┘
```

### Cron Schedule (OpenClaw)

```
# Morning routines — staggered to avoid rate limits
0 8 * * *   openclaw cron exec --label coo-morning         # COO first (coordinates others)
2 8 * * *   openclaw cron exec --label exec-asst-morning
4 8 * * *   openclaw cron exec --label outbound-morning
6 8 * * *   openclaw cron exec --label marketing-morning
8 8 * * *   openclaw cron exec --label content-morning
10 8 * * *  openclaw cron exec --label bookkeeper-morning
12 8 * * *  openclaw cron exec --label strategist-morning
14 8 * * *  openclaw cron exec --label consultant-morning
16 8 * * *  openclaw cron exec --label pm-morning

# Evening routines — staggered
0 20 * * *  openclaw cron exec --label pm-evening           # PM first (collects status)
2 20 * * *  openclaw cron exec --label outbound-evening
4 20 * * *  openclaw cron exec --label marketing-evening
6 20 * * *  openclaw cron exec --label content-evening
8 20 * * *  openclaw cron exec --label bookkeeper-evening
10 20 * * * openclaw cron exec --label strategist-evening
12 20 * * * openclaw cron exec --label consultant-evening
14 20 * * * openclaw cron exec --label exec-asst-evening
16 20 * * * openclaw cron exec --label coo-evening          # COO last (synthesizes)
```

### Workspace File Structure

```
workspace-main/
├── agents/
│   ├── HANDOFF.md                    # Central handoff queue
│   ├── exec-assistant/
│   │   ├── SOUL.md                   # Agent persona & instructions
│   │   ├── briefing-today.md         # Today's briefing output
│   │   └── inbox-summary.md          # Processed inbox
│   ├── marketing-analyst/
│   │   ├── SOUL.md
│   │   ├── weekly-metrics.md
│   │   └── campaign-report.md
│   ├── content-writer/
│   │   ├── SOUL.md
│   │   ├── content-calendar.md
│   │   ├── drafts/                   # Blog posts, scripts, social
│   │   └── published-log.md
│   ├── outbound-sales/
│   │   ├── SOUL.md
│   │   ├── pipeline.md              # Active deals & stages
│   │   ├── sequences/               # Email sequence templates
│   │   ├── sent-log.md              # Daily send log
│   │   └── replies.md               # Replies needing action
│   ├── bookkeeper/
│   │   ├── SOUL.md
│   │   ├── monthly-pnl.md
│   │   ├── invoices-pending.md
│   │   └── expense-log.md
│   ├── coo/
│   │   ├── SOUL.md
│   │   ├── ops-status.md            # Cross-agent status roll-up
│   │   ├── process-log.md
│   │   └── blockers.md
│   ├── strategist/
│   │   ├── SOUL.md
│   │   ├── market-intel.md
│   │   ├── competitive-landscape.md
│   │   └── growth-plan.md
│   ├── consultant/
│   │   ├── SOUL.md
│   │   ├── client-prep/             # Per-prospect discovery prep
│   │   ├── onboarding-playbook.md
│   │   └── active-clients.md
│   └── project-manager/
│       ├── SOUL.md
│       ├── sprint-board.md          # Current sprint tasks
│       ├── milestones.md
│       └── daily-standup.md         # Auto-generated standup
├── data/
│   ├── prospects.csv                # Master prospect list
│   ├── financial-services-100.csv   # Ready-to-send targets
│   ├── referral-partners.csv
│   └── email-sequences/            # 6 vertical sequences
├── reports/
│   ├── daily/                      # YYYY-MM-DD-daily-report.md
│   └── weekly/                     # YYYY-WXX-weekly-report.md
└── docs/
    └── 9-agent-automation-plan.md  # This file
```

---

## Agent Communication System

### HANDOFF.md Protocol

All inter-agent communication flows through `agents/HANDOFF.md`. This is a FIFO queue with structured entries:

```markdown
## Pending Handoffs

### [2026-02-13T08:04Z] outbound-sales → consultant
**Type:** PREP_REQUEST
**Priority:** HIGH
**Subject:** Discovery call prep — Barclays (Sarah Chen, VP Digital)
**Details:** Meeting scheduled 2026-02-14 10:00 GMT. Prospect replied to cold email sequence #3 (financial services). Interested in automating compliance reporting. Need discovery brief by EOD.
**Status:** PENDING

### [2026-02-13T08:06Z] marketing-analyst → content-writer
**Type:** CONTENT_REQUEST
**Priority:** MEDIUM
**Subject:** Blog post on AI agent ROI — top-performing keyword
**Details:** "AI agent workforce ROI" getting 2.4K monthly searches, no competing content from our competitors. Recommend 1500-word blog post with case study angle.
**Status:** PENDING
```

**Rules:**
1. Each agent reads HANDOFF.md at start of every run
2. Pick up any handoffs addressed to you → change status to `IN_PROGRESS`
3. When complete → change status to `DONE` and add output reference
4. Completed handoffs older than 7 days are archived to `agents/handoff-archive/YYYY-MM.md`
5. COO agent monitors HANDOFF.md for stuck items (>24h PENDING)

### Slack Communication

| Channel | Purpose | Who Posts |
|---------|---------|-----------|
| `#ceo-dashboard` (C0AF3MKPYG1) | Executive summaries, KPIs, alerts | COO, Exec Asst, PM |
| `#dev` (C0AEF3QQDSA) | Technical issues, agent errors, infrastructure | All agents (errors only) |

**Slack posting rules:**
- Morning summary → `#ceo-dashboard` at 08:20 (after all morning agents complete)
- Evening summary → `#ceo-dashboard` at 20:20
- Errors/blockers → `#dev` immediately
- Never spam. One consolidated message per run per channel max.

---

## The 9 Agents

---

### 1. Executive Assistant Agent

**Persona:** Efficient, professional, anticipates needs. Speaks in crisp bullet points.

#### Daily 8am Routine
1. **Scan Gmail** for both ksmolichki@afrexai.com and cbeckford@afrexai.com
   - Categorize: Urgent / Needs Response / FYI / Spam
   - Flag any prospect replies → handoff to Outbound Sales
   - Flag any client emails → handoff to Consultant
2. **Check Calendly** for new bookings in next 48 hours
3. **Check Google Calendar** for today's meetings
4. **Generate morning briefing** → `agents/exec-assistant/briefing-today.md`
   - Weather (London), calendar, urgent emails, key metrics from yesterday
5. **Post briefing** to `#ceo-dashboard`:
   ```
   ☀️ Good morning! Here's your Feb 13 briefing:
   📅 2 meetings today: 10am Prospect call (Barclays), 2pm Team sync
   📧 3 urgent emails (2 prospect replies, 1 vendor invoice)
   📊 Yesterday: 25 emails sent, 2 replies, 1 meeting booked
   🚨 Action needed: Approve invoice from AWS ($847)
   ```

#### Daily 8pm Routine
1. **Scan Gmail** for afternoon/evening emails
2. **Prep tomorrow** — preview calendar, flag early meetings
3. **Post evening wrap** to `#ceo-dashboard`:
   ```
   🌙 EOD Summary — Feb 13:
   ✅ 4/5 tasks completed today
   📧 12 emails processed, 2 need your response tomorrow AM
   📅 Tomorrow: 3 meetings, first at 9am
   ⚠️ Reminder: Proposal for Lloyds due Friday
   ```

#### Triggers
- New email labeled "URGENT" → immediate Slack alert to `#ceo-dashboard`
- Calendly booking → immediate handoff to Consultant for prep
- Calendar event in <2 hours → reminder to `#ceo-dashboard`

#### Tools
- Gmail API (read/categorize/draft replies)
- Google Calendar API (read events)
- Calendly API (read bookings)
- Slack (post to #ceo-dashboard)
- Web search (weather, quick lookups)

#### Outputs
| Output | Location | Frequency |
|--------|----------|-----------|
| Morning briefing | `agents/exec-assistant/briefing-today.md` | Daily 8am |
| Inbox summary | `agents/exec-assistant/inbox-summary.md` | 2x daily |
| Slack briefing | `#ceo-dashboard` | 2x daily |

#### Handoff Points
- Prospect replies → `Outbound Sales` (via HANDOFF.md)
- Client emails → `Consultant` (via HANDOFF.md)
- Invoice/billing emails → `Bookkeeper` (via HANDOFF.md)
- Meeting prep requests → `Consultant` (via HANDOFF.md)

#### KPIs
- Inbox zero maintenance (% emails categorized within 12h): Target >95%
- Briefing accuracy (meetings/emails correctly flagged): Target 100%
- Response time on urgent flags: <30 min during business hours

#### Week 1 Quick Wins
- [x] Set up Gmail scanning cron — categorize and summarize inbox
- [x] Morning/evening Slack briefings to #ceo-dashboard
- [x] Calendar preview with prep reminders
- [ ] Auto-draft simple email replies for approval

---

### 2. Marketing Analyst Agent

**Persona:** Data-driven, concise, always ties metrics to revenue impact.

#### Daily 8am Routine
1. **Check website analytics** (GitHub Pages — use web fetch on afrexai-cto.github.io)
   - Page views, unique visitors, top pages, referral sources
2. **Check email campaign metrics** — open rates, click rates, reply rates from sent-log
3. **Monitor social signals** — web search for "AfrexAI" mentions, competitor activity
4. **Update** `agents/marketing-analyst/weekly-metrics.md` with daily data point
5. **Identify anomalies** — any metric up/down >20% → flag in HANDOFF.md for COO

#### Daily 8pm Routine
1. **Compile daily marketing scorecard** → append to `reports/daily/YYYY-MM-DD-daily-report.md`
2. **Check competitor activity** — web search top 5 competitors for new content, pricing changes, funding
3. **Generate content recommendations** → handoff to Content Writer if gaps found
4. **Weekly rollup** (Fridays only) → `agents/marketing-analyst/campaign-report.md` + post to #ceo-dashboard

#### Triggers
- Email open rate drops below 15% → alert COO + Outbound Sales
- Competitor raises funding or launches product → immediate intel to Strategist
- Website traffic spike → investigate source, report to COO

#### Tools
- Web fetch (site analytics, competitor monitoring)
- Web search (brand mentions, market trends)
- Gmail (campaign metrics from sent emails)
- Slack (alerts)
- File system (reports, metrics tracking)

#### Outputs
| Output | Location | Frequency |
|--------|----------|-----------|
| Daily metrics | `agents/marketing-analyst/weekly-metrics.md` | Daily |
| Campaign report | `agents/marketing-analyst/campaign-report.md` | Weekly (Fri) |
| Content recs | HANDOFF.md → Content Writer | As needed |
| Competitor intel | HANDOFF.md → Strategist | As found |

#### Handoff Points
- Content gaps/opportunities → `Content Writer`
- Competitor intelligence → `Strategist`
- Campaign performance issues → `COO`
- Lead source analysis → `Outbound Sales`

#### KPIs
- Report delivery rate: 100% (never miss a daily/weekly report)
- Actionable insights per week: Target ≥3
- Time-to-alert on anomalies: <4 hours
- Email open rate tracking accuracy: ±2%

#### Week 1 Quick Wins
- [x] Daily website traffic check via web fetch
- [x] Competitor monitoring (web search 5 competitors daily)
- [x] Email campaign metrics tracking from outbound send logs
- [ ] Set up weekly metrics dashboard in Google Sheets

---

### 3. Content Writer Agent

**Persona:** Creative, persuasive, understands B2B SaaS voice. Writes in AfrexAI's tone: confident, practical, no-BS.

#### Daily 8am Routine
1. **Check HANDOFF.md** for content requests from Marketing Analyst or Strategist
2. **Review content calendar** (`agents/content-writer/content-calendar.md`)
   - What's due today? What's in draft? What needs publishing?
3. **Generate/continue one content piece** based on priority:
   - Blog post draft → `agents/content-writer/drafts/YYYY-MM-DD-title.md`
   - Social media posts (LinkedIn, Twitter) → `agents/content-writer/drafts/social-YYYY-MM-DD.md`
   - Email sequence copy → `agents/content-writer/drafts/email-sequence-NAME.md`
   - YouTube video script → `agents/content-writer/drafts/video-YYYY-MM-DD.md`
4. **Post draft notification** to #ceo-dashboard for review

#### Daily 8pm Routine
1. **Research trending topics** — web search for AI agent trends, B2B automation news
2. **Queue tomorrow's social posts** — draft 2-3 LinkedIn/Twitter posts
3. **Update content calendar** with completed/new items
4. **Brainstorm** — generate 3 content ideas weekly, add to idea backlog

#### Triggers
- Marketing Analyst flags content gap → prioritize that topic
- Outbound Sales requests case study → draft outline
- New client win → draft announcement post
- YouTube comment spike → draft response/follow-up content

#### Tools
- Web search (topic research, trending content)
- Web fetch (reference articles, competitor content)
- File system (drafts, calendar)
- Slack (post drafts for review)

#### Outputs
| Output | Location | Frequency |
|--------|----------|-----------|
| Blog drafts | `agents/content-writer/drafts/` | 2-3/week |
| Social posts | `agents/content-writer/drafts/social-*` | Daily |
| Email copy | `agents/content-writer/drafts/email-*` | As needed |
| Video scripts | `agents/content-writer/drafts/video-*` | 1/week |
| Content calendar | `agents/content-writer/content-calendar.md` | Updated daily |

#### Handoff Points
- Finished blog posts → `Marketing Analyst` (for publishing/tracking)
- Case studies → `Consultant` (for client approval)
- Email sequences → `Outbound Sales` (for campaign use)
- Video scripts → Christina (for YouTube recording)

#### KPIs
- Content pieces produced per week: Target ≥5 (2 blogs, 5+ social, 1 video script)
- Draft-to-publish cycle time: <48 hours
- Content calendar adherence: >80%
- Quality score (founder approval rate on first draft): >70%

#### Week 1 Quick Wins
- [x] Generate 5 LinkedIn posts about AI agent workforce benefits
- [x] Draft 1 blog post: "Why Your Business Needs an AI Agent Workforce in 2026"
- [x] Create content calendar template for next 30 days
- [ ] Draft YouTube video script: "We Replaced Our Entire Back Office with AI Agents"

---

### 4. Outbound Sales Agent

**Persona:** Persistent, personalized, data-driven. Never spammy. Thinks in sequences and conversion rates.

#### Daily 8am Routine
1. **Check for replies** — scan Gmail for responses to cold emails
   - Positive reply → update `agents/outbound-sales/pipeline.md`, handoff to Consultant
   - Objection → draft response using objection-handling framework
   - Bounce → remove from list, log in `agents/outbound-sales/sent-log.md`
   - Unsubscribe → remove immediately
2. **Send daily batch** (PAUSED until DNS fixed):
   - Pull next 20-30 prospects from `data/financial-services-100.csv`
   - Personalize using prospect research (web search company + person)
   - Send via Gmail with appropriate sequence template from `data/email-sequences/`
   - Log all sends to `agents/outbound-sales/sent-log.md`
3. **Follow-up sequences** — check who needs Day 3, Day 7, Day 14 follow-ups
4. **Update pipeline** with any stage changes

#### Daily 8pm Routine
1. **Prospect research** for tomorrow's batch
   - Web search each prospect: company news, recent hires, pain points
   - Write personalization notes in `agents/outbound-sales/prospect-notes/`
2. **Sequence performance review** — which sequence/vertical is converting best?
3. **Pipeline update** → `agents/outbound-sales/pipeline.md`
4. **Post daily sales summary** to #ceo-dashboard:
   ```
   📧 Outbound Sales — Feb 13:
   Sent: 25 | Opens: 18 (72%) | Replies: 3 (12%) | Meetings: 1
   Pipeline: 4 prospects in discovery, 1 proposal stage
   🔥 Hot lead: Barclays (Sarah Chen) — discovery call tomorrow
   ⏸️ Email sending PAUSED — waiting on DNS fix
   ```

#### Triggers
- Positive email reply → immediate pipeline update + Consultant handoff
- Calendly booking from prospect → immediate prep request to Consultant
- DNS fixed (SPF/DKIM/DMARC) → resume email sending immediately
- Pipeline deal >7 days in same stage → nudge/escalate

#### Tools
- Gmail API (send, read, categorize)
- Web search (prospect research)
- Web fetch (company websites, LinkedIn profiles)
- Slack (pipeline updates)
- File system (sequences, prospect data, pipeline)

#### Outputs
| Output | Location | Frequency |
|--------|----------|-----------|
| Sent log | `agents/outbound-sales/sent-log.md` | Daily |
| Pipeline | `agents/outbound-sales/pipeline.md` | Updated daily |
| Reply analysis | `agents/outbound-sales/replies.md` | As received |
| Prospect research | `agents/outbound-sales/prospect-notes/` | Daily |
| Sales summary | Slack #ceo-dashboard | Daily 8pm |

#### Handoff Points
- Meeting booked → `Consultant` (discovery prep)
- Positive reply needing meeting → `Exec Assistant` (scheduling)
- Case study request → `Content Writer`
- Market feedback from prospects → `Strategist`
- Revenue forecast update → `Bookkeeper`

#### KPIs
- Emails sent per day: 20-30 (when DNS active)
- Open rate: Target >50%
- Reply rate: Target >5%
- Meeting booking rate: Target >2% of sends
- Pipeline velocity: <14 days average first-touch to discovery call
- Sequence completion rate: >80% of prospects receive full sequence

#### Week 1 Quick Wins
- [x] Set up reply monitoring and auto-categorization
- [x] Prospect research automation for financial services 100
- [x] Pipeline tracking in pipeline.md
- [ ] **CRITICAL:** Fix DNS (SPF/DKIM/DMARC) to resume sending
- [ ] Test send 10 emails manually to verify deliverability

---

### 5. Bookkeeper Agent

**Persona:** Meticulous, conservative, flags anomalies early. Speaks in numbers.

#### Daily 8am Routine
1. **Check QuickBooks Online** for:
   - New transactions to categorize
   - Outstanding invoices (overdue > 30 days → escalate)
   - Bank feed items needing review
2. **Check Gmail** for:
   - Invoices received (vendor bills) → log in `agents/bookkeeper/expense-log.md`
   - Payment confirmations → update records
3. **Cash position snapshot** → update `agents/bookkeeper/monthly-pnl.md`
4. **Flag any anomalies** — unexpected charges, subscription renewals, failed payments

#### Daily 8pm Routine
1. **Reconcile day's transactions** in QuickBooks
2. **Update expense log** with any new entries
3. **Revenue tracking** — update ARR tracker based on pipeline + closed deals
4. **Weekly P&L** (Fridays) → `agents/bookkeeper/monthly-pnl.md` + post to #ceo-dashboard
5. **Monthly close prep** (last day of month) — flag items needing attention

#### Triggers
- Invoice overdue >30 days → escalate to Christina via Slack
- Unexpected charge >$500 → immediate alert to #ceo-dashboard
- New client payment received → notify COO + update ARR tracker
- Subscription renewal coming in <7 days → alert to Exec Assistant

#### Tools
- QuickBooks Online API (transactions, invoices, reports)
- Gmail (invoice/receipt scanning)
- Slack (financial alerts)
- File system (P&L, expense tracking)

#### Outputs
| Output | Location | Frequency |
|--------|----------|-----------|
| Monthly P&L | `agents/bookkeeper/monthly-pnl.md` | Weekly update |
| Expense log | `agents/bookkeeper/expense-log.md` | Daily |
| Pending invoices | `agents/bookkeeper/invoices-pending.md` | Daily |
| Cash position | Slack #ceo-dashboard | Weekly (Fri) |
| ARR tracker | `agents/bookkeeper/arr-tracker.md` | Updated on changes |

#### Handoff Points
- Client payment received → `COO` (service delivery trigger)
- Overdue invoice → `Consultant` (client relationship follow-up)
- Budget vs actual report → `Strategist` (planning input)
- Expense anomalies → `Exec Assistant` (founder approval)

#### KPIs
- Transaction categorization accuracy: >98%
- Invoice follow-up within 48h of overdue: 100%
- Monthly close completed by 5th of following month: 100%
- Cash position accuracy: ±$100

#### Week 1 Quick Wins
- [x] Connect QuickBooks Online, pull current balance + recent transactions
- [x] Create expense log template and populate with current month
- [x] Set up overdue invoice alerts
- [ ] Generate first monthly P&L summary

---

### 6. COO (Chief Operating Officer) Agent

**Persona:** Strategic operator. Sees the whole board. Optimizes for throughput and removes blockers. The "manager of managers."

#### Daily 8am Routine (RUNS FIRST — 08:00)
1. **Read all agent status files** — scan every agent's latest output
2. **Check HANDOFF.md** — identify stuck items (>24h PENDING), reassign if needed
3. **Check #dev channel** for overnight errors/issues
4. **Generate operations status** → `agents/coo/ops-status.md`:
   ```markdown
   ## Ops Status — Feb 13, 08:00
   ### Agent Health
   - ✅ Exec Asst: Running normally
   - ✅ Marketing: Running normally
   - ⚠️ Outbound Sales: PAUSED (DNS issue)
   - ✅ Content Writer: 2 pieces in draft
   - ✅ Bookkeeper: QuickBooks synced
   - ✅ Strategist: Competitor report due today
   - ✅ Consultant: 1 discovery call today
   - ✅ PM: Sprint on track (3/5 tasks done)
   
   ### Blockers
   - 🔴 DNS (SPF/DKIM/DMARC) — blocks all outbound email. Owner: Kalin. ETA: TBD
   
   ### Key Metrics
   - Pipeline: $45K in active opportunities
   - Emails sent this week: 0 (paused)
   - Content produced: 3 pieces
   - ARR: $0 (pre-revenue)
   ```
5. **Set priorities for the day** — update `agents/coo/daily-priorities.md`

#### Daily 8pm Routine (RUNS LAST — 20:16)
1. **Collect all agent evening outputs** — synthesize into single daily report
2. **Generate daily report** → `reports/daily/YYYY-MM-DD-daily-report.md`
3. **Post executive summary** to #ceo-dashboard:
   ```
   📊 Daily Ops Report — Feb 13
   
   🎯 Goals hit: 4/6
   📧 Outbound: 0 sent (DNS blocked) | 2 replies processed
   📝 Content: 1 blog draft, 3 social posts queued
   💰 Pipeline: $45K active | $0 closed
   🚨 Blockers: DNS fix needed (Day 3)
   
   Tomorrow's priorities:
   1. DNS fix (Kalin)
   2. Barclays discovery call (10am)
   3. Publish blog post
   ```
4. **Process optimization** — identify one process to improve, document in `agents/coo/process-log.md`
5. **Weekly ops review** (Fridays) — comprehensive week summary + next week plan

#### Triggers
- Any agent fails/errors → immediate triage + #dev alert
- HANDOFF.md item stuck >24h → escalate or reassign
- New client signed → trigger onboarding workflow across all agents
- Revenue milestone hit → celebration post + process update

#### Tools
- File system (all agent directories — read access)
- Slack (both channels)
- HANDOFF.md (read/write/manage)
- All agent output files (read)

#### Outputs
| Output | Location | Frequency |
|--------|----------|-----------|
| Ops status | `agents/coo/ops-status.md` | 2x daily |
| Daily report | `reports/daily/YYYY-MM-DD-daily-report.md` | Daily |
| Blockers list | `agents/coo/blockers.md` | Updated continuously |
| Process improvements | `agents/coo/process-log.md` | Weekly |
| Executive summary | Slack #ceo-dashboard | 2x daily |

#### Handoff Points
- Blockers → appropriate agent or founder (via HANDOFF.md)
- Process changes → `Project Manager` (for implementation)
- Revenue updates → `Bookkeeper`
- Strategic issues → `Strategist`
- All agents report TO the COO; COO reports to founders

#### KPIs
- Daily report delivery: 100% on time
- Blocker resolution time: <24 hours average
- Agent uptime: >95% (no missed cron runs)
- Cross-agent handoff completion rate: >90% within SLA

#### Week 1 Quick Wins
- [x] Set up ops-status.md and daily report templates
- [x] Implement HANDOFF.md monitoring and stuck-item detection
- [x] Daily executive summary to #ceo-dashboard
- [ ] Document all current blockers with owners and ETAs

---

### 7. Strategist Agent

**Persona:** Visionary yet practical. Thinks in frameworks. Connects market signals to tactical moves.

#### Daily 8am Routine
1. **Market intelligence scan** — web search for:
   - "AI agent" industry news (last 24h)
   - Competitor activity (Relevance AI, Lindy, AutoGPT, CrewAI, etc.)
   - Target vertical news (financial services, legal, healthcare)
   - Funding rounds in AI agent space
2. **Update market intel** → `agents/strategist/market-intel.md`
3. **Check HANDOFF.md** for strategic requests from other agents
4. **Flag opportunities** — new market entry, partnership, positioning change

#### Daily 8pm Routine
1. **Competitive analysis update** — any new competitor moves today?
2. **Strategic recommendations** — based on day's intel + internal metrics:
   - Pricing adjustments?
   - New vertical to target?
   - Partnership opportunity?
   - Positioning shift?
3. **Weekly strategy brief** (Wednesdays) → `agents/strategist/growth-plan.md`
   - Market trends, competitive moves, recommended actions
   - Post summary to #ceo-dashboard
4. **Quarterly planning input** (1st of month) — comprehensive market review

#### Triggers
- Competitor raises >$10M → immediate competitive analysis
- New regulation affecting AI agents → risk assessment
- Client/prospect mentions competitor → positioning guidance to Sales
- Market shift (new AI capability, major tech announcement) → opportunity assessment

#### Tools
- Web search (market research, competitor monitoring)
- Web fetch (news articles, reports, competitor websites)
- File system (strategy docs, market intel)
- Slack (strategic alerts)

#### Outputs
| Output | Location | Frequency |
|--------|----------|-----------|
| Market intel | `agents/strategist/market-intel.md` | Daily |
| Competitive landscape | `agents/strategist/competitive-landscape.md` | Weekly |
| Growth plan | `agents/strategist/growth-plan.md` | Weekly (Wed) |
| Strategic alerts | Slack #ceo-dashboard | As needed |

#### Handoff Points
- Competitive positioning → `Content Writer` (differentiation messaging)
- Market opportunities → `COO` (resource allocation)
- Pricing intelligence → `Consultant` (proposal support)
- Vertical insights → `Outbound Sales` (targeting refinement)

#### KPIs
- Market intel reports: Daily delivery 100%
- Actionable strategic recommendations per week: ≥2
- Competitor tracking coverage: Top 10 competitors monitored
- Strategic accuracy (recommendations adopted by founders): >50%

#### Week 1 Quick Wins
- [x] Map competitive landscape — top 10 AI agent companies
- [x] Financial services vertical deep-dive (target market analysis)
- [x] Pricing benchmark — what competitors charge
- [ ] First weekly strategy brief with 3 actionable recommendations

---

### 8. Consultant Agent

**Persona:** Client-obsessed, polished, thorough. Prepares like it's a board meeting every time.

#### Daily 8am Routine
1. **Check HANDOFF.md** for:
   - Discovery call prep requests from Outbound Sales
   - Client onboarding tasks
   - Proposal requests
2. **Review today's meetings** (from Exec Assistant briefing)
   - For each meeting: prepare discovery brief in `agents/consultant/client-prep/COMPANY-NAME.md`:
     - Company background (web search)
     - Key stakeholders and their LinkedIn profiles
     - Pain points and use cases for AI agents
     - Competitive solutions they might be evaluating
     - Recommended AfrexAI package and pricing
     - Discovery questions to ask
     - Objection handling prep
3. **Check active clients** — any deliverables due? Any satisfaction check needed?

#### Daily 8pm Routine
1. **Post-meeting notes** — if meetings happened today, process notes into:
   - Updated client profile
   - Next steps and action items → HANDOFF.md
   - Proposal draft if requested
2. **Onboarding tracking** — any clients in onboarding? Update status.
3. **Prepare next-day meeting materials** if any calls tomorrow
4. **Client health check** (Fridays) — review all active client relationships

#### Triggers
- New Calendly booking → immediate discovery prep
- Client emails "urgent" or "problem" → immediate alert to COO + prep response
- Proposal requested → draft within 24h
- Client contract renewal approaching (30 days out) → prep renewal conversation

#### Tools
- Web search (prospect/client research)
- Web fetch (company websites, news)
- Gmail (client communication)
- Calendly (meeting info)
- Slack (alerts, prep delivery)
- File system (client briefs, proposals)

#### Outputs
| Output | Location | Frequency |
|--------|----------|-----------|
| Discovery briefs | `agents/consultant/client-prep/COMPANY.md` | Per meeting |
| Proposals | `agents/consultant/proposals/` | As requested |
| Client status | `agents/consultant/active-clients.md` | Weekly |
| Onboarding playbook | `agents/consultant/onboarding-playbook.md` | Updated as refined |

#### Handoff Points
- Closed deal → `Bookkeeper` (invoice) + `COO` (delivery) + `PM` (project setup)
- Proposal needs → `Content Writer` (polished copy)
- Competitive question from client → `Strategist`
- Meeting scheduling → `Exec Assistant`
- Client feedback → `Marketing Analyst` (testimonial/case study opportunity)

#### KPIs
- Discovery brief prep: 100% coverage (every meeting has a brief)
- Brief quality (founders found it useful): >80%
- Proposal turnaround: <24 hours
- Client satisfaction (NPS proxy): >8/10
- Onboarding completion rate: 100%

#### Week 1 Quick Wins
- [x] Create discovery brief template
- [x] Prep briefs for any meetings this week
- [x] Build onboarding playbook v1
- [ ] Draft standard proposal template with AfrexAI pricing tiers

---

### 9. Project Manager Agent

**Persona:** Organized, accountable, keeps things moving. Never lets a task fall through the cracks.

#### Daily 8am Routine (RUNS LAST in AM — 08:16)
1. **Generate daily standup** from all agent outputs → `agents/project-manager/daily-standup.md`:
   ```markdown
   ## Daily Standup — Feb 13
   
   ### What happened yesterday
   - Outbound: 25 emails sent, 2 replies received
   - Content: Published LinkedIn post, blog draft 80% complete
   - Consultant: Discovery call with Barclays — positive, proposal requested
   - Bookkeeper: Monthly reconciliation started
   
   ### What's planned today
   - Outbound: Follow-up sequence Day 3 for 15 prospects
   - Content: Finish blog draft, 3 social posts
   - Consultant: Prep Barclays proposal
   - Strategist: Weekly competitive brief
   
   ### Blockers
   - DNS fix (SPF/DKIM/DMARC) — Day 3 — Owner: Kalin
   - QuickBooks API rate limit hit yesterday — monitoring
   ```
2. **Update sprint board** → `agents/project-manager/sprint-board.md`
   - Move completed tasks to Done
   - Flag overdue tasks
   - Assign new tasks from backlog
3. **Check milestones** → `agents/project-manager/milestones.md`
   - Are we on track for weekly/monthly goals?
   - Any at risk? Flag immediately.

#### Daily 8pm Routine (RUNS FIRST in PM — 20:00)
1. **Collect status from all agents** — read their evening outputs
2. **Update sprint board** with end-of-day status
3. **Calculate velocity** — tasks completed vs planned
4. **Sprint review** (Fridays) — comprehensive sprint report:
   - Velocity, completion rate, carry-over tasks
   - Next sprint planning
   - Post to #ceo-dashboard
5. **Generate tomorrow's task list** for each agent

#### Triggers
- Task overdue by >1 day → escalate to COO
- Sprint goal at risk → alert founders
- New initiative from Strategist → break down into tasks
- Client project started → create project plan

#### Tools
- File system (sprint boards, milestones, standup notes)
- Slack (standup posts, alerts)
- HANDOFF.md (task routing)

#### Outputs
| Output | Location | Frequency |
|--------|----------|-----------|
| Daily standup | `agents/project-manager/daily-standup.md` | Daily |
| Sprint board | `agents/project-manager/sprint-board.md` | Updated 2x daily |
| Milestones | `agents/project-manager/milestones.md` | Updated weekly |
| Sprint review | `reports/weekly/YYYY-WXX-sprint-review.md` | Weekly (Fri) |

#### Handoff Points
- Task assignments → all agents (via HANDOFF.md)
- Sprint reports → `COO` (operational input)
- Resource conflicts → `COO` (prioritization)
- Client project milestones → `Consultant` (client updates)

#### KPIs
- Standup delivery: 100% daily
- Sprint completion rate: >75%
- Task tracking accuracy (no orphaned tasks): 100%
- Milestone on-time delivery: >80%

#### Week 1 Quick Wins
- [x] Create sprint board with current priorities
- [x] First daily standup generated
- [x] Set up milestone tracker with $11M ARR path
- [ ] Sprint 1 plan: top 10 priorities for next 2 weeks

---

## Escalation Protocol

### When to Escalate to Founders

```
SEVERITY 1 — IMMEDIATE (Slack DM + #ceo-dashboard)
├── Client threatening to churn
├── Security breach / data leak
├── Legal issue (cease & desist, compliance)
├── System down (all agents offline)
└── Revenue opportunity >$50K requiring human approval

SEVERITY 2 — SAME DAY (#ceo-dashboard)
├── Blocker >48 hours unresolved
├── Client complaint
├── Budget approval needed >$200
├── Strategic decision needed (pricing, new vertical)
└── Agent disagreement (conflicting recommendations)

SEVERITY 3 — NEXT STANDUP (daily report)
├── Task overdue >2 days
├── Metric trending wrong direction for 3+ days
├── Process improvement suggestion
└── Resource request

AUTO-HANDLE (no escalation needed)
├── Routine email categorization
├── Content drafts (flag for review, don't block)
├── Prospect research
├── Report generation
├── Calendar management
└── Transaction categorization (standard items)
```

### Escalation Routing
| Issue Type | Primary Owner | Escalation To |
|-----------|---------------|---------------|
| Technical (infra, DNS, APIs) | Kalin | → Christina if >72h unresolved |
| Revenue (deals, pricing) | Christina | → Kalin if technical blocker |
| Client relationship | Christina | → Kalin if technical delivery issue |
| Strategy (market, competition) | Christina | → Both for major pivots |
| Operations (process, agents) | COO Agent | → Kalin for technical, Christina for business |

---

## Revenue Impact Estimate

### Hours Saved Per Week (at full operation)

| Agent | Tasks Automated | Hours/Week Saved | FTE Equivalent |
|-------|----------------|-----------------|----------------|
| Executive Assistant | Inbox mgmt, briefings, scheduling | 10h | 0.25 FTE |
| Marketing Analyst | Metrics tracking, reporting, monitoring | 12h | 0.30 FTE |
| Content Writer | Blog posts, social, email copy | 15h | 0.38 FTE |
| Outbound Sales | Prospect research, personalization, follow-up | 20h | 0.50 FTE |
| Bookkeeper | Transaction categorization, reporting | 8h | 0.20 FTE |
| COO | Cross-functional coordination, status tracking | 10h | 0.25 FTE |
| Strategist | Market research, competitive analysis | 12h | 0.30 FTE |
| Consultant | Discovery prep, proposals, research | 10h | 0.25 FTE |
| Project Manager | Sprint planning, status tracking, standups | 8h | 0.20 FTE |
| **TOTAL** | | **105h/week** | **2.63 FTE** |

### Cost Savings
- Average fully-loaded cost for these roles: ~$75K/year per FTE
- 2.63 FTE equivalent = **$197K/year in labor cost avoided**
- OpenClaw + API costs estimate: ~$500/month = $6K/year
- **Net savings: ~$191K/year**

### Revenue Enablement
- Outbound agent sending 25 emails/day × 5 days = 125/week
- At 2% meeting rate = 2.5 meetings/week
- At 25% close rate = ~2.5 new clients/month
- At $5K/month average deal = **$150K new ARR per year from outbound alone**
- Content marketing + inbound (3-6 month lag) = additional **$100K-300K ARR**
- **Total estimated revenue impact: $250K-450K ARR in Year 1**

---

## Implementation Roadmap

### Phase 1: Foundation (This Week — Feb 13-19)

**Priority: Get the basics running**

| Day | Task | Owner | Agent |
|-----|------|-------|-------|
| Day 1 (Thu) | Create all agent SOUL.md files | Kalin | — |
| Day 1 | Set up workspace file structure (`agents/`, `data/`, `reports/`) | Kalin | — |
| Day 1 | Configure COO + Exec Assistant + PM cron jobs | Kalin | — |
| Day 2 (Fri) | **FIX DNS (SPF/DKIM/DMARC)** — unblocks all outbound | Kalin | — |
| Day 2 | Launch morning/evening Slack briefings | Kalin | COO, ExecAsst |
| Day 3 (Sat) | Configure Outbound Sales + Marketing cron jobs | Kalin | — |
| Day 3 | Test email sending (10 test emails) | Kalin | Outbound |
| Day 4 (Sun) | Configure Content Writer + Strategist cron | Kalin | — |
| Day 5 (Mon) | All 9 agents live on cron | Kalin | All |
| Day 5 | First full daily standup auto-generated | — | PM |
| Day 6-7 | Monitor, fix errors, tune agent instructions | Kalin | — |

**Week 1 Deliverables:**
- [ ] All 9 SOUL.md files written
- [ ] HANDOFF.md protocol operational
- [ ] DNS fixed, email sending resumed
- [ ] Daily Slack briefings running
- [ ] First 50 emails sent to financial services targets
- [ ] First blog post published
- [ ] Sprint board populated

### Phase 2: Optimization (Weeks 2-3 — Feb 20 - Mar 5)

**Priority: Refine quality, add integrations, build pipeline**

| Task | Owner | Week |
|------|-------|------|
| Tune agent instructions based on Week 1 output quality | Kalin | W2 |
| Connect QuickBooks API for automated bookkeeping | Kalin | W2 |
| Build Google Sheets dashboards for metrics | Marketing | W2 |
| Send remaining 100 financial services cold emails | Outbound | W2 |
| Activate referral partner outreach sequence | Outbound | W2 |
| Publish 3 blog posts to GitHub Pages | Content | W2-3 |
| Record + publish first YouTube video | Christina | W2 |
| Build proposal template library | Consultant | W2 |
| First discovery calls from outbound pipeline | Consultant | W3 |
| Implement email open/click tracking | Marketing | W3 |
| Cross-agent handoff refinement (reduce stuck items) | COO | W3 |
| First weekly strategy brief published | Strategist | W2 |

**Phase 2 Deliverables:**
- [ ] 200+ cold emails sent across all verticals
- [ ] 5+ discovery calls booked
- [ ] QuickBooks automated
- [ ] 3 blog posts live
- [ ] 1 YouTube video published
- [ ] Referral partners contacted
- [ ] <5% stuck handoffs

### Phase 3: Scale (Month 2-3 — Mar 6 - Apr 30)

**Priority: First revenue, expand verticals, refine product-market fit**

| Task | Timeline | Owner |
|------|----------|-------|
| Close first paying client | Mar W1-2 | Christina + Consultant |
| Expand to 500+ prospect database | Mar W1 | Outbound + Strategist |
| Add 3 new verticals (legal, healthcare, real estate) | Mar W2-3 | Strategist + Content |
| Build case study from first client | Mar W3 | Content + Consultant |
| Implement lead scoring model | Mar W2 | Marketing + Outbound |
| Launch referral program with partners | Mar W3 | Outbound |
| Monthly business review automation | Mar W4 | COO + Bookkeeper |
| Scale to 50 emails/day | Apr W1 | Outbound |
| Webinar/demo automation | Apr W2 | Content + Consultant |
| Hire first human (SDR or CSM) based on bottleneck data | Apr W3 | Christina |

**Phase 3 Deliverables:**
- [ ] $5K+ MRR (first clients)
- [ ] 1,000+ prospects contacted
- [ ] 20+ discovery calls completed
- [ ] 3+ clients onboarded
- [ ] Case study published
- [ ] Referral pipeline active

---

## Risk & Failure Modes

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| DNS never gets fixed | LOW | CRITICAL | Escalation: if not fixed by Feb 17, use alternative email service (SendGrid, Mailgun) |
| OpenClaw cron fails silently | MEDIUM | HIGH | COO agent checks all agent outputs; missing output = alert to #dev |
| Gmail API rate limits | MEDIUM | MEDIUM | Stagger sends, batch processing, stay under 500/day |
| QuickBooks API changes | LOW | MEDIUM | Monitor API status, manual fallback process |
| MacBook goes to sleep / offline | MEDIUM | HIGH | Ensure macOS Energy settings prevent sleep; consider cloud migration Phase 3 |
| Agent produces bad output | HIGH | MEDIUM | All external-facing content requires founder approval first 30 days |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Agents generate spam/low-quality emails | MEDIUM | HIGH | Human review of first 50 emails; A/B test sequences; monitor bounce/spam rates |
| Agent-to-agent handoffs get stuck | HIGH | MEDIUM | COO monitors HANDOFF.md; 24h SLA with auto-escalation |
| Information silos (agents don't share context) | MEDIUM | MEDIUM | HANDOFF.md protocol; COO cross-reads all outputs |
| Over-automation (doing things that should be human) | LOW | HIGH | Escalation protocol; "when in doubt, ask" rule |
| Prospect data quality issues | MEDIUM | MEDIUM | Data validation in outbound agent; bounce monitoring |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| No replies from cold outreach | MEDIUM | HIGH | Test multiple sequences; iterate messaging weekly; add LinkedIn outreach |
| Product-market fit miss | MEDIUM | CRITICAL | Strategist monitors market; weekly strategy review; talk to prospects |
| Competitor undercuts pricing | LOW | MEDIUM | Strategist competitive monitoring; differentiate on service quality |
| Founders overwhelmed by approvals | HIGH | MEDIUM | Gradually increase agent autonomy; batch approvals daily |

### Disaster Recovery
- **All agent outputs are files in workspace** — version controlled via git
- **Daily git commit** of all workspace changes at 21:00
- **If OpenClaw fails**: agents can be run manually via CLI
- **If MacBook dies**: workspace synced to GitHub; spin up on new machine in <1 hour

---

## The "Lights Out" Vision

### What AfrexAI looks like at full autonomy (Target: Month 4+)

```
06:00  MacBook wakes up. OpenClaw starts.
       
08:00  COO Agent reads the state of the world.
08:02  Exec Assistant scans inbox, preps briefing.
08:04  Outbound Sales sends 30 personalized cold emails.
08:06  Marketing Analyst pulls metrics, spots a blog post going viral.
08:08  Content Writer drafts a follow-up post to capitalize on traffic.
08:10  Bookkeeper reconciles yesterday's transactions, flags overdue invoice.
08:12  Strategist spots competitor just raised $20M — drafts repositioning memo.
08:14  Consultant preps discovery brief for 10am call with Barclays.
08:16  PM generates standup, updates sprint board.

08:20  #ceo-dashboard lights up with a single, clean morning briefing.
       Christina reads it over coffee in 3 minutes. Approves two proposals.
       Kalin checks #dev — no errors. Ships a product feature.

10:00  Christina takes discovery call. Brief is perfect. Prospect is impressed.
       
12:00  Outbound agent detects 3 positive replies. Auto-schedules follow-ups.
       Consultant starts prep for next week's calls.

14:00  Content Writer publishes blog post. Marketing Analyst starts tracking.
       
16:00  New client signs. Bookkeeper sends invoice. COO triggers onboarding.
       PM creates client project board. Consultant sends welcome email.

20:00  PM collects everyone's status. Sprint updated.
20:02  Outbound Sales researches tomorrow's 30 prospects.
20:04  Marketing compiles daily scorecard. Content queues social posts.
20:08  Bookkeeper updates P&L. New client revenue reflected.
20:10  Strategist files evening intelligence report.
20:14  Exec Assistant preps tomorrow's briefing.
20:16  COO synthesizes everything into one daily report.

20:20  #ceo-dashboard: "Good day. 1 client closed ($5K MRR). Pipeline at $180K.
       3 meetings booked for next week. Blog got 2.4K views. Sprint 73% complete.
       No blockers. Good night."

21:00  Git commits all workspace changes. MacBook sleeps.
```

### The Human Roles at "Lights Out"

**Christina (CEO) — 2-3 hours/day:**
- Morning: Read briefing (3 min), approve proposals (10 min)
- Midday: Take 1-2 discovery/client calls (human touch matters)
- Afternoon: Strategic decisions flagged by agents
- Everything else is automated

**Kalin (CTO) — 2-3 hours/day:**
- Morning: Check #dev for errors (5 min), fix any technical issues
- Build product/features (the actual service AfrexAI sells)
- Review agent output quality weekly
- Infrastructure improvements

### The Path to $11M ARR

```
Month 1:  9 agents operational. First pipeline built.         $0 ARR
Month 2:  First 3 clients closed.                              $15K ARR
Month 3:  Referral program active. 10 clients.                 $50K ARR
Month 4:  Case studies live. Inbound starts flowing.           $120K ARR
Month 6:  25 clients. First hire (human CSM).                  $300K ARR
Month 9:  50 clients. Sales team of 2 humans + agents.         $750K ARR
Month 12: 100 clients. Product refinement. Series A prep.      $1.5M ARR
Month 18: 250 clients. 5 employees + 9 agents.                 $4M ARR
Month 24: 500 clients. 10 employees + agents. Multi-product.   $8M ARR
Month 30: 700+ clients. Enterprise deals. Channel partners.    $11M ARR
```

### What Makes This Work

1. **AfrexAI eats its own dog food** — the 9-agent system IS the product demo
2. **Compound effect** — each agent makes the others more effective
3. **Data flywheel** — more outreach → more data → better targeting → more closes
4. **Founder leverage** — 2 humans + 9 agents = output of a 12-person company
5. **The pitch writes itself** — "We run our entire company on AI agents. Let us do the same for you."

---

## Appendix: Agent SOUL.md Templates

Each agent needs a `SOUL.md` that defines its identity, instructions, and boundaries. These should be created in Phase 1, Day 1.

**Template structure:**
```markdown
# [Agent Name] — AfrexAI

## Identity
You are the [role] for AfrexAI. [One sentence persona.]

## Your Mission
[Primary objective in one sentence.]

## Daily Routines
### 8am Morning Run
[Numbered steps — copy from this document]

### 8pm Evening Run
[Numbered steps — copy from this document]

## Tools Available
[List of tools this agent can use]

## Communication
- Read HANDOFF.md at start of every run
- Pick up items addressed to you
- Create handoffs for other agents when needed
- Post to Slack only as specified

## Boundaries
- Never send external emails without human approval (first 30 days)
- Never make financial commitments
- Escalate per the escalation protocol
- When in doubt, ask via #ceo-dashboard

## Output Files
[List of files this agent maintains]
```

---

*This is a living document. Update as agents go live and we learn what works.*

*"The best time to automate was yesterday. The second best time is right now." — Let's go.* 🚀
