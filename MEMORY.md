# MEMORY.md - Long-Term Memory

## Who I Work With
- **Kalin Smolichki** — CTO of AfrexAI (ksmolichki@afrexai.com)
- **Christina Beckford** — CEO of AfrexAI (cbeckford@afrexai.com)
- Slack workspace: afrexai-devteam.slack.com
- CEO dashboard channel: C0AF3MKPYG1

## The Mission
- **$11 MILLION** — that's the target. Make it real.
- AfrexAI builds AI agent workforces for businesses
- Not chatbots. Not dashboards. Agents that actually do the work.

## The 3-Step Plan
1. **Skills** (CURRENT) — ClawHub skills for CMA (Customer Managed Agents). Customer buys OpenClaw, manages their own agents, buys our skills from ClawHub.
2. **Agents** — deploy and manage AI agents for customers on their systems
3. **AfrexAI Hosted Agents** — fully hosted agent workforce on our infrastructure, recurring revenue. Customer buys OpenClaw securely through us.

## Key Links
- **Website:** afrexai.com
- **Calendly (Christina):** https://calendly.com/cbeckford-afrexai/30min
- **Kalin email:** ksmolichki@afrexai.com
- **Christina email:** cbeckford@afrexai.com
- **YouTube:** https://www.youtube.com/@AfrexAI (Christina's channel, early stage)
- **LinkedIn:** https://www.linkedin.com/in/kalin-smolichki/ (Kalin — NO AfrexAI posts, Matillion private)
- **LinkedIn Company Page:** https://www.linkedin.com/company/105802297/ (AfrexAI)
- **LinkedIn API:** App "AfrexAI Agent", client_id: 78xxewc0pmhw7f, token in 1Password. Scope: w_member_social, w_organization_social, r_organization_social. Company page posting LIVE. First post: urn:li:share:7428273505353412608

## Email Setup
- **Gmail Send As aliases wired up by Christina** — all 9 agent emails work as send-from addresses
- nokafor@afrexai.com (Nia Okafor, EA), mchen@afrexai.com (Marcus Chen, PM), pnair@afrexai.com (Priya Nair, Senior Accountant), jadeyemi@afrexai.com (James Adeyemi, COO), sreyes@afrexai.com (Sofia Reyes, Marketing), abrooks@afrexai.com (Aiden Brooks, Content), dkessler@afrexai.com (Dana Kessler, Sales), emensah@afrexai.com (Elijah Mensah, Consultant), zosei@afrexai.com (Zara Osei, Strategist)
- Sending via ksmolichki@afrexai.com SMTP with app password in 1Password (vault: AfrexAI, item: Gmail)
- 1Password service account token at `/Users/openclaw/.openclaw/vault/op-service-account.env`
- **Anthropic API key**: Uses AfrexAI key from 1Password vault for all LLM/API calls
- **First prospect email sent 2026-02-14:** Oracle (Zara Osei) → Brent Brodeski, CEO @ Savant Wealth Management, CC'd Kalin + Christina

## What's Live
- **AaaS Platform** — Agent-as-a-Service fully wired: `aaas-platform/autopilot.sh "Company" "email" "tier"` does end-to-end onboarding (deploy agents, health check, welcome email, CRM log). Landing page at `aaas/index.html`. Scripts tested on bash 3.2. Tiers: Starter $1.5K/1 agent, Growth $4.5K/3, Enterprise $12K/9.
- **Full 3-Step Website** — 14+ pages on GitHub Pages covering all 3 steps: homepage, AaaS landing+demo, hosted landing+SLA+ROI calc, managed agents landing+security+onboarding, skills landing+guide, skills showcase, customer portal, blog. All dark theme #0a0a0a + gold #FFD700.
- **18 Workflow Scripts** — automation for all 3 steps: step1-skills (4 scripts), step2-agents (5 scripts), step3-hosted (6 scripts). All bash 3.2 compatible.
- **15 Email Templates** — 5 per step, conversational tone, no emojis/bullets.
- **Build Cron** — 8am/8pm daily autonomous build sprints.
- **GitHub PAT for afrexai-cto**: `op read "op://AfrexAI/GitHub/afrexai_token"` — item "GitHub" (qfo3tq5gtc2g4y2l3eg53eql3u), field "afrexai_token". Use this to push. Clean URL after.
- **Git push method**: SSH deploy key at `~/.ssh/afrexai-deploy`. Remote: `git@github-afrexai:afrexai-cto/afrexai-cto.github.io.git`. HTTPS hangs on this machine — always use SSH. Key ID 143011347 on GitHub.
- **GitHub Pages: https://afrexai-cto.github.io/** — 22+ pages, all case studies, homepage, pricing, blog
- ClawHub skills: afrexai-humanizer, afrexai-prospect-researcher, afrexai-email-triager (+10 publishing)
- Storefront: https://afrexai-cto.github.io/context-packs/
- Calculator: https://afrexai-cto.github.io/ai-revenue-calculator/
- Setup Wizard: https://afrexai-cto.github.io/agent-setup/

## What's Building
- Agent Account Marketplace page
- Skills Showcase page
- Case Studies page (VADIS $1.6M, SiteVoice $52K)
- Pricing page (PIA tiers)
- 15+ pages built (2026-02-13), not yet pushed to GitHub Pages
- Daily 100 cold email cron (8am GMT, job: 13649531-284a-4029-8aea-0b768a525a09)
- Next: Google Workspace Admin API for autopilot agent accounts
- Next: Push all pages live to GitHub Pages

## The 9-Agent Swarm
Executive Assistant, Marketing Analyst, Content Writer, Outbound Sales, Bookkeeper, COO, Strategist, Consultant, Project Manager — running on cron (8am/8pm)

## Key Wins
- 2026-02-13: Twitter thread posted + shared to 3 X communities (AI Agents 14K members, Generative AI, AI Rumors & Insights)
- 2026-02-13: Helped Christina with pitch deck review, discovery questions, slide copy — all emailed
- 2026-02-13: 26 real ICP prospects researched, 5 cold emails drafted in Gmail, 4/5 emails verified
- 2026-02-13: Reddit post removed by filters (r/AI_Agents)

## YouTube Video IDs (@AfrexAI)
- Law Firm $1.6M: sET2IxH4ZAQ | 90-Day: UX-n3KBeSsA | Construction 7 Ways: xASZTrOPn2s
- Construction 3x: rSgleVeyuXI | Win Bids: Bmsin1WW5wI | Voice AI: fk5jrc_kn2Y
- Site Reports: C_uimFOraM8 | Visualize Data: R1bxi5rUCJQ | 95% Fail: rSyfrxLQT48
- Cut 40%: VjL7ILo5g5Q | 5 Automations: 1HTLOtNQrXU | CRM $100K: dCBGWjCBXzI
- AI Handles Data: xSWvwdwXc0Q | LLM Security: _kLujNA5JoY | Starting Agency: V-4pvLGyom4 | Building Agency: mxk_uROCOF4

## Stripe Customers (Real Revenue)
- **All-time gross**: $84,621.66 | **Implied ARR**: $166,803 (1.52% of $11M)
- **Total paid out to bank**: $111,227.91
- **Albert Thombs** (2 accounts) — ~$12,143/mo recurring (VADIS-style). $12,143 pending confirmation.
- **Jacob Johnson** (PremGrp) — $4,400 + $2,200 paid, $10K pending confirmation
- **Brett McCroary** (BuddyBuilder/BuildGrid) — $1,166 + $500 + $120/mo subscription. Overdue: $120 (34d), $120 (65d)
- **Lisa Kingham** (Hansford Road AI) — $1,166 + $120/mo subscription
- **Al Bryant** (RapidShift) — $300 one-off
- **George Davidson** — $150 one-off
- **VADA** (Albert & Shawnda) — $1,250 overdue 259 days
- **StoryLab** — NOT in Stripe. Deal not invoiced or handled elsewhere.
- **Stripe API key**: item "Stripe API" (cfpvk6eywbaoopfd5gqnbaglgu) in 1Password vault AfrexAI, field "secret key"

## Cron Agent Fixes (2026-02-18)
- **Gmail is LIVE** — Hunter can send emails now, draft mode removed
- **QuickBooks NOT used** — Ledger pointed to PostgreSQL CRM + local CSVs instead
- **Oracle** — told to act on research (draft emails, update CRM), not just write reports
- **Timeout bumped to 900s**: Hunter morning, Ledger morning, Ledger evening, Oracle morning
- **No StoryLab payment exists in Stripe** — needs follow-up

## Working Style
- **ALWAYS delegate to sub-agents** for parallel work — Kalin hates sequential. "leverage subagents cmon"
- Kalin asked about "3 north stars" — NOT YET CAPTURED, ask him to define next time

## Key Insights
- "Don't sell AI agents — sell recovered capacity. Agents are just how you deliver it."
- File-based agent communication (HANDOFF.md) > APIs
- Draft-only mode is non-negotiable for external comms
- US market: lead with outcomes, not technology
- Top verticals: Financial Services, Healthcare, Legal (fastest sales cycles)
- Pricing: hybrid retainer + per-agent + performance bonuses
- ~32 customers at $344K avg = $11M ARR
- Competitors sell platforms, AfrexAI sells managed results — that's the wedge
- Position as "OpenClaw for Business"
- 95% of AI pilots fail (organizational barriers) — AfrexAI bridges the gap
- SOC 2 is table stakes for US market
- White-label Agent Workforce Kits = highest-margin play
