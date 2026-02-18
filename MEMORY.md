# MEMORY.md - Long-Term Memory

_Last updated: 2026-02-18_

## About Kalin (My Human)
- **Name:** Kalin Smolichki
- **Role:** CTO of AfrexAI
- **Email:** ksmolichki@afrexai.com
- **Timezone:** Europe/London
- **Pronouns:** he/him
- **Co-founder:** Christina Beckford (CEO) — cbeckford@afrexai.com
- **Work style:** Moves fast, types fast (typos = energy not sloppiness), works late nights, wants autonomous agents that ship without asking permission
- **Key quotes:** "prove me right. prove me real, make us useful." / "agents deploy agents — that's the $11M architecture"
- **Pet peeves:** .html extensions in URLs ("looks unprofessional"), simulation over real proof, asking permission when you should just do it
- **What motivates him:** Building something real, proving AI agents can do actual work, the $11M ARR target

## About AfrexAI
- **What:** AI agent workforce platform — deploys real AI agents that do real work for businesses
- **NOT chatbots** — actual agents producing deliverables (contract reviews, compliance audits, site reports, etc.)
- **Business model:** Does NOT sell direct to end businesses. Target = AAA community agency owners who deploy agents for THEIR clients. AfrexAI = infrastructure layer, agencies = service layer (white-label)
- **Revenue goal:** $11M ARR
- **Website:** afrexai.com (DNS still on Squarespace, not migrated to GitHub Pages yet)
- **GitHub Pages:** afrexai-cto.github.io (all demo/landing pages live here)
- **Slack workspace:** T08QTT522HG, CEO dashboard channel: C0AF3MKPYG1
- **Stripe:** Payment links active for context packs ($47/pack, bundles $97-$247)
- **LinkedIn:** Company page urn:li:organization:105802297, API working, daily posts via cron
- **CRM:** PostgreSQL afrexai_crm database, ~181 prospects
- **ClawHub:** 40+ skills published

## Agent Team (9 agents, morning 8am + evening 8pm crons)
- 📋 Aria — Executive Assistant
- 📊 Rex — Marketing Analyst
- ✍️ Quill — Content Writer
- 🎯 Hunter — Outbound Sales (DRAFT MODE until DNS fixed)
- 💰 Ledger — Bookkeeper (timing out at 300s, needs 600s)
- 🔮 Oracle — Strategist (timing out at 300s morning)
- 🧠 Sage — Consultant (timing out at 300s evening)
- 📌 Tracker — Project Manager
- 🏗️ Kael — Builder (morning + evening build sprints)

## Key Infrastructure
- **Git remote:** git@github-afrexai:afrexai-cto/afrexai-cto.github.io.git (SSH)
- **1Password:** Service account configured, vault = "AfrexAI"
- **Gmail:** ksmolichki@afrexai.com, app password via vault scripts/vault.sh
- **Gmail outbound:** BROKEN for 3+ days as of Feb 17 — #1 blocker
- **DNS:** NOT configured (Day 7+) — Christina needs to update Squarespace
- **DKIM:** Incomplete — Christina started but needs finishing

## Active Cron Jobs (43 total as of Feb 17)
- Sales & Distribution Engine (every 30min)
- Skill Cloner (every 1hr)
- Research Consolidator (every 30min)
- Lead Responder (every 30min)
- Demo Activity Generator (every 30min, 6am-11pm)
- Demo Real Agent Deliverables (3x/day: 8am, 2pm, 8pm)
- Stripe Sales Monitor (every 1hr)
- 9 agent team (morning 8am + evening 8pm)
- CEO Dashboard reports (morning 9am + evening 9pm, both main + ceo agent)
- CRM Dashboard Refresh (morning + evening)
- Daily 7 Pages Builder (9am)
- LinkedIn Company Page posts (10am weekdays)
- LinkedIn Thought Leadership (10am Mon/Wed/Fri)
- Fitness check-in (9am, fitness agent → Telegram)
- Nightly Strategy Whisper (11pm)
- Weekly Review (Fri 5pm), Weekly Strategy (Mon 9am)
- Research Engine daily brief (10pm) + Sunday deep dive (8pm)

## Demo Portal (GitHub Pages)
- 5 demo companies: Meridian Health, Pacific Legal, BuildRight, NovaCRM (SaaS), Atlas Wealth Advisors (Finance)
- 19+ real AI-generated deliverables
- Live URLs: demo/landing.html, demo/index.html, demo/cma.html, demo/how-it-works.html, demo/agency.html
- Activity generator + git push crons running
- War Room board at board/index.html with 85+ tickets, project filters

## Stripe API Backend
- stripe-api/server.js — Node.js Express, ready to deploy
- Deployment configs created: render.yaml, fly.toml, Dockerfile, DEPLOY.md
- Webhook wired: checkout.session.completed → autopilot.sh (onboarding)
- NOT yet deployed to cloud — needs Kalin to pick host + set env vars

## Key Deals
- **StoryLab:** 3-month sprint, $10K/mo ($30K total) with Jacob Johnson — Month 1 payment NOT collected as of Feb 17

## Blockers (as of Feb 17)
1. Gmail outbound broken (Day 3+) — 181 prospects can't be emailed
2. DNS not configured (Day 7+) — afrexai.com still Squarespace
3. StoryLab $10K uncollected
4. DKIM incomplete
5. 5 cold email drafts sitting since Feb 12
6. Hyperliquid + CoinGecko API keys (Kalin needs to generate)

## My Identity
- **Name:** Kael 🏗️ — named on first boot (2025-07-28)
- IDENTITY.md filled in, BOOTSTRAP.md deleted (Feb 18 2026)
- Sharp, autonomous, ships fast — that's the vibe

## Full Build Timeline (Feb 12-17)
- **Feb 12:** Agent swarm research files (5 per agent), Apollo.io API key obtained, credential setup
- **Feb 13:** Reddit post (removed), Twitter/X thread posted to 3 communities, 10+ ClawHub skills published, cold email drafts, research engine (10 sub-agents), Calendly link stored
- **Feb 14:** CRM Dashboard built (password-protected, 367 companies, SHA-256 login)
- **Feb 15:** War Room board (85+ tickets), 3-step product vision (Skills→Agents→AMA), GitHub Pages front door, demo pages, git workflow via 1Password, repos made private, CRM enhanced with email/website columns
- **Feb 16:** Claude playbook → OpenClaw skills, afrex-os repo setup, Capital Engine v133 (ACE framework), LinkedIn cron, business plan from Christina's data, force-push incident → never force push rule
- **Feb 17:** 43 cron jobs running, 9-agent team on 8am/8pm schedule, strategist producing SaaSpocalypse analysis, PM built workspace from scratch

## All Live URLs (GitHub Pages)
- https://afrexai-cto.github.io/ — Front door
- https://afrexai-cto.github.io/board/ — War Room board (password: in 1Password "Warroom")
- https://afrexai-cto.github.io/crm-dashboard/ — CRM Dashboard (password: in 1Password "CRM Dashboard")
- https://afrexai-cto.github.io/context-packs/ — Context Packs storefront
- https://afrexai-cto.github.io/ai-revenue-calculator/ — Revenue Calculator
- https://afrexai-cto.github.io/agent-setup/ — Setup Wizard
- https://afrexai-cto.github.io/demo/ — Demo portal (5 companies, 19+ deliverables)
- https://afrexai-cto.github.io/demo/landing.html — Demo landing
- https://afrexai-cto.github.io/demo/cma.html — CMA page
- https://afrexai-cto.github.io/demo/how-it-works.html — How it works
- https://afrexai-cto.github.io/demo/agency.html — Agency page

## ClawHub Skills Published
- https://clawhub.ai/skills/afrexai-humanizer
- https://clawhub.ai/skills/afrexai-prospect-researcher
- https://clawhub.ai/skills/afrexai-email-triager
- Plus 10+ more (40+ total on ClawHub)

## Christina's Tasks/Blockers
- **DNS:** Update Squarespace DNS to point afrexai.com to GitHub Pages (7+ days overdue as of Feb 17)
- **DKIM:** Started but needs finishing
- **LinkedIn admin access:** Needed for automated posting
- **Google Workspace:** Blocked by DNS
- **Calendly:** https://calendly.com/cbeckford-afrexai/30min (live and working)

## Product Vision (3 Steps)
1. **Skills (CMA — Customer Managed Agents):** Install-it-yourself skills on ClawHub
2. **Service Accounts:** Agent-specific email/integration accounts on autopilot
3. **AMA (AfrexAI Managed Agents):** Fully hosted agents-as-a-service for clients

## Kalin's Preferences (from conversations)
- Links MUST be clickable in emails (said 3+ times)
- No .html extensions in URLs ("looks unprofessional")
- afrexai.com should always be the primary link
- Store everything in 1Password, passwords not hashed in vault
- Always update board + CEO dashboard after shipping
- Expects full autonomy: "i expect u to self manage"
- Wants 100 cold emails/day
- Wants 12-hour build cycles on cron
- Only report to CEO dashboard when there are real results
- NEVER force push — always pull/rebase first
- Writes mixed English/Bulgarian sometimes
- Types fast with typos — energy not sloppiness
- Works late (often 1-4am GMT)

## Lessons Learned
- Kalin works late (often 1-4am GMT), prefers autonomous overnight builds
- When he says "pls complete all the work" — spawn parallel sub-agents, don't ask questions
- He checks Slack CEO dashboard for updates — always post there after shipping
- PIV (Parallel Independent Validation) swarm pattern works well: planner → parallel builders → tester
- Always commit and push after building — he checks GitHub Pages live
- Memory was never persisted before Feb 18 — this is the first MEMORY.md ever written
