# OpenClaw for Business: Managed AI Agent Hosting

**Date:** February 15, 2026  
**Purpose:** Feasibility analysis for AfrexAI Step 3 — hosting AI agents for enterprise customers using OpenClaw infrastructure

---

## 1. How OpenClaw Works

### Architecture Overview

OpenClaw is a self-hosted, open-source (MIT) AI assistant gateway. The core architecture:

```
Messaging Channels (WhatsApp/Telegram/Slack/Discord/Signal/iMessage/Teams/Google Chat/Matrix/WebChat)
    │
    ▼
┌─────────────────────────────┐
│       Gateway (daemon)       │
│  Single WS control plane     │
│  ws://127.0.0.1:18789       │
└──────────┬──────────────────┘
           │
           ├── Pi agent (RPC) — the AI brain
           ├── CLI (openclaw …)
           ├── WebChat UI / Control UI
           ├── macOS/iOS/Android nodes
           └── Skills + Tools
```

**Key components:**

- **Gateway:** Single long-lived Node.js process. Owns all messaging connections, sessions, routing, cron, webhooks. Exposes typed WebSocket API for all clients. One Gateway per host.
- **Agent Runtime (Pi):** Runs in RPC mode with tool streaming and block streaming. Supports multi-model (Anthropic recommended, OpenAI supported). Session-based with memory/workspace per agent.
- **Multi-Agent Routing:** Route inbound channels/accounts/peers to isolated agents, each with own workspace and sessions. Configured via `agents.list[]` in `openclaw.json`.
- **Skills System:** AgentSkills-compatible folder structure (SKILL.md + frontmatter). Three tiers: bundled → managed (~/.openclaw/skills) → workspace (/skills). Per-agent skills possible. ClawHub registry for discovery/install. Skills teach the agent how to use tools (browser, canvas, cron, exec, etc.).
- **Cron:** Gateway-native scheduler. Persists to `~/.openclaw/cron/jobs.json`. Supports one-shot, interval, and cron expressions. Can run in main session or isolated session with delivery to any channel.
- **Sandboxing:** Optional Docker-based tool execution isolation. Modes: off/non-main/all. Scopes: per-session/per-agent/shared container. Workspace access: none/ro/rw. Browser can also be sandboxed.
- **Channels:** WhatsApp (Baileys), Telegram (grammY), Slack (Bolt), Discord (discord.js), Google Chat, Signal, BlueBubbles/iMessage, Microsoft Teams, Matrix, Zalo, WebChat. Each with DM pairing, group routing, mention gating.

### Deployment Options

- **Native:** `npm install -g openclaw@latest` + `openclaw onboard --install-daemon` (launchd/systemd)
- **Docker:** Full Compose setup with `docker-setup.sh`, persisted config/workspace on host
- **Hetzner VPS:** Documented Docker-on-VPS flow
- **Remote Access:** Tailscale Serve/Funnel or SSH tunnels with token auth

---

## 2. Multi-Tenant Architecture Options

### Option A: One OpenClaw Instance Per Customer (Recommended)

Each customer gets a dedicated Gateway process + workspace + Docker container.

**Pros:**
- Complete data isolation (separate filesystems, processes, credentials)
- Independent scaling and restart
- Customer-specific model configs, skills, channel connections
- No noisy-neighbor risk
- Simplest SOC 2 story — hard boundary between tenants
- Can run on different hardware tiers per customer need

**Cons:**
- Higher base resource usage (~200-500MB RAM per idle Gateway)
- More ops overhead (N containers to manage)
- WhatsApp sessions are per-Gateway (each customer needs own phone/number)

**Implementation:**
```
Per customer:
├── Docker container (Gateway + agent)
├── ~/.openclaw/          (config, cron, credentials)
├── ~/.openclaw/workspace (agent memory, files)
├── Channel credentials   (WhatsApp QR, Telegram bot token, etc.)
└── API keys              (Anthropic/OpenAI, managed by AfrexAI)
```

Orchestrated via Docker Compose per customer, or Kubernetes with one pod per tenant.

### Option B: Shared Gateway with Agent Isolation

Single Gateway, multiple agents via `agents.list[]`, each with own workspace.

**Pros:**
- Lower resource usage
- Simpler ops (one process)

**Cons:**
- Shared process = shared failure domain
- WhatsApp is one-session-per-Gateway (can't isolate WhatsApp accounts)
- Sandbox isolation is good but not a hard security boundary ("not a perfect security boundary" per docs)
- Harder SOC 2 compliance story
- Config changes require Gateway restart affecting all tenants
- Credential leakage risk in shared process memory

**Verdict:** Option A (per-customer instance) is the clear winner for enterprise. The marginal cost of separate containers is negligible compared to the security and isolation benefits.

### Option C: Hybrid

Shared infrastructure for lower-tier customers (Discovery/Build), dedicated instances for Fractional/Enterprise tier. Reduces cost for smaller accounts while maintaining isolation for premium.

---

## 3. Security Requirements

### Data Isolation (Per-Customer Instance Model)

| Layer | Implementation |
|-------|---------------|
| **Process isolation** | Separate Docker containers per customer |
| **Filesystem isolation** | Separate volumes, no shared mounts |
| **Network isolation** | Docker network segmentation, no inter-container traffic |
| **Credential isolation** | Per-customer API keys in separate 1Password vaults or secrets manager |
| **Channel isolation** | Each customer's own WhatsApp number, Telegram bot, Slack app, etc. |
| **Memory/session isolation** | Separate agent workspaces, separate session stores |

### SOC 2 Implications

AfrexAI is already pursuing SOC 2 (per existing docs). Key additional controls for managed hosting:

- **CC6.1 (Logical Access):** Per-customer auth tokens, no shared admin access between tenants
- **CC6.3 (Encryption):** Encrypt volumes at rest (LUKS on Hetzner, EBS encryption on AWS, default on GCP)
- **CC6.7 (Transmission Security):** TLS for all WS connections (Tailscale or reverse proxy with certs)
- **CC7.2 (Monitoring):** Per-customer logging, audit trail of agent actions
- **CC8.1 (Change Management):** Version-pinned OpenClaw per customer, controlled rollouts
- **A1.2 (Recovery):** Per-customer backup of workspace, config, cron jobs

### Encryption

| Type | Method |
|------|--------|
| **At rest** | Volume encryption (provider-level), encrypted backups |
| **In transit** | TLS 1.3 for all WS/HTTP, Tailscale mesh (WireGuard) for internal |
| **Secrets** | 1Password / AWS Secrets Manager, never in plaintext config |
| **Agent memory** | Workspace files on encrypted volumes; consider application-level encryption for PII |

### Additional Security Measures

- Gateway `dmPolicy="pairing"` by default — no open inbound
- Sandboxing enabled for all customer agents (`sandbox.mode: "all"`)
- Read-only workspace access where possible
- No elevated exec for customer agents
- Regular OpenClaw version updates (security patches)
- Network egress controls (limit what agents can access)

---

## 4. Hosting Cost Estimates

### Per-Customer Infrastructure Cost

#### Hetzner (Best Value — Recommended for Initial Scale)

| Component | Spec | Monthly Cost |
|-----------|------|-------------|
| **VPS (Gateway + Agent)** | CX32 (4 vCPU, 8GB RAM) | €8.50 (~$9) |
| **Storage** | 80GB NVMe (included) + 100GB backup | €3 |
| **Bandwidth** | 20TB included | $0 |
| **Total per customer** | | **~$12/mo** |

For larger customers (more tools, browser automation):
| **VPS** | CX42 (8 vCPU, 16GB RAM) | €17 (~$18) |
| **Total** | | **~$21/mo** |

#### AWS (Enterprise Compliance Requirement)

| Component | Spec | Monthly Cost |
|-----------|------|-------------|
| **EC2** | t3.medium (2 vCPU, 4GB) | ~$30 |
| **EBS** | 50GB gp3 | ~$4 |
| **Bandwidth** | ~50GB egress | ~$5 |
| **Total per customer** | | **~$40/mo** |

Larger: t3.large (8GB) = ~$60/mo total

#### GCP (Similar to AWS)

| Component | Spec | Monthly Cost |
|-----------|------|-------------|
| **Compute** | e2-medium (2 vCPU, 4GB) | ~$25 |
| **Storage + network** | | ~$8 |
| **Total per customer** | | **~$33/mo** |

### LLM API Costs (The Big Variable)

This is the dominant cost. Estimates per customer per month:

| Usage Level | Description | Anthropic Cost/mo | OpenAI Cost/mo |
|-------------|-------------|-------------------|----------------|
| **Light** | 500 agent turns/mo, short context | $50–$150 | $40–$120 |
| **Medium** | 2,000 turns/mo, mixed context | $200–$600 | $150–$450 |
| **Heavy** | 5,000+ turns/mo, long context, Opus | $800–$2,500 | $500–$1,500 |
| **Enterprise** | 10,000+ turns, multi-agent, tools | $2,000–$5,000+ | $1,200–$3,000+ |

**Key levers:**
- Model choice matters enormously: Haiku/Sonnet vs Opus is 10-50x cost difference
- Prompt caching reduces repeat context costs ~90%
- Session pruning limits context window growth
- OAuth subscriptions (Claude Pro/Max at $20-100/mo) cap costs but have rate limits

**Realistic blended estimate per customer: $200–$1,000/mo** (assuming Sonnet for routine tasks, Opus for complex ones, with caching)

### Total Per-Customer Cost

| Tier | Hosting | LLM | Support Time (est.) | Total Cost/mo |
|------|---------|-----|--------------------:|---------------|
| **Light (SMB)** | $12 (Hetzner) | $150 | 2h × $75 = $150 | **~$310** |
| **Medium (Build)** | $18 (Hetzner) | $500 | 5h × $75 = $375 | **~$890** |
| **Heavy (Fractional)** | $40 (AWS) | $1,200 | 10h × $75 = $750 | **~$1,990** |
| **Enterprise** | $60 (AWS) | $3,000 | 20h × $75 = $1,500 | **~$4,560** |

*Support time = agent maintenance, skill updates, monitoring, customer requests*

---

## 5. Margin Analysis

### At AfrexAI's Price Points ($1,500–$12,000/mo)

| Customer Tier | Revenue/mo | Total Cost/mo | Gross Margin | Margin % |
|---------------|-----------|---------------|-------------|----------|
| **$1,500/mo** (Build-Light) | $1,500 | $310–$500 | $1,000–$1,190 | **67–79%** |
| **$3,000/mo** (Build-Standard) | $3,000 | $500–$890 | $2,110–$2,500 | **70–83%** |
| **$5,000/mo** (Fractional-Light) | $5,000 | $890–$1,500 | $3,500–$4,110 | **70–82%** |
| **$10,000/mo** (Fractional) | $10,000 | $1,500–$2,500 | $7,500–$8,500 | **75–85%** |
| **$12,000/mo** (Enterprise-Light) | $12,000 | $2,000–$3,500 | $8,500–$10,000 | **71–83%** |
| **$25,000/mo** (Enterprise) | $25,000 | $3,500–$5,000 | $20,000–$21,500 | **80–86%** |

### Key Margin Insights

1. **Hosting is negligible** — $12-60/mo per customer is noise. Hetzner makes this almost free.
2. **LLM costs are the variable** — 60-80% of COGS. Model selection is the #1 margin lever.
3. **Human support is the hidden cost** — at scale, this dominates. Automation reduces it.
4. **Margins are excellent** — 70-85% gross margins are achievable, comparable to SaaS.
5. **Scaling economics improve** — shared ops tooling, automated provisioning, bulk API discounts.

### Break-Even per Customer

At $1,500/mo minimum pricing with Hetzner hosting:
- Hosting: $12/mo
- LLM (light): $150/mo  
- Minimum viable cost: **~$162/mo** (before human time)
- Even with 2h/mo support: **~$312/mo** → 79% margin

**The business is viable even at the low end.**

### Sensitivity to LLM Costs

If a customer's agents are heavy LLM users ($2,000+/mo in API calls):
- At $3,000/mo pricing → margin drops to 33% (bad)
- At $5,000/mo pricing → margin is 60% (acceptable)
- **Solution:** Tier pricing to usage, or cap LLM budget per tier with overage billing

---

## 6. Competitors: Managed AI Agent Services

These are companies offering **managed/hosted AI agent services** (not just platforms):

### Direct Competitors (Managed Agent Services)

| Company | Model | Pricing | Notes |
|---------|-------|---------|-------|
| **Sierra AI** | Managed conversational AI agents for enterprise CX. $10B valuation. | Custom enterprise pricing (est. $10K-100K+/mo) | Bret Taylor (ex-Salesforce CEO). Focus on customer experience agents. Fully managed — they build, host, and maintain. |
| **Lindy.ai** | No-code AI agent builder with white-label/service partner program | $49-299/mo self-serve; custom for enterprise | Service Partners resell and manage Lindy agents for customers. Closest to AfrexAI's model but platform-first. |
| **Relevance AI** | No-code agent builder with agency/partner program | Usage-based; partner managed services | Partners build and host agents on Relevance infra for end customers. |

### Adjacent Competitors (Agencies Doing Managed AI)

| Company | Model | Notes |
|---------|-------|-------|
| **Botpress partners/agencies** | Build + manage chatbots/agents on Botpress platform | Many agencies white-label Botpress for enterprise customers |
| **Voiceflow agencies** | Managed voice/chat agent services | Service partners build and host on Voiceflow |
| **Big consultancies (Accenture, Deloitte, McKinsey)** | AI transformation + managed services | $50K-500K+/mo but slow, generic |
| **Boutique AI agencies** | Custom agent builds + hosting | Fragmented market, usually <$50K/mo deals |

### What Makes AfrexAI Different

1. **OpenClaw is self-hosted & open source** — no platform lock-in, full control over infrastructure
2. **Multi-channel native** — WhatsApp, Telegram, Slack, Discord, iMessage all built-in (most competitors do 1-2 channels)
3. **True agent capabilities** — browser control, file access, cron, code execution (not just chatbots)
4. **Personal assistant model** — OpenClaw agents feel like dedicated team members, not widgets
5. **Coding agent DNA** — can actually write code, manage repos, automate technical workflows
6. **Cost advantage** — open source infra on Hetzner vs proprietary platforms = 3-5x lower COGS

### Competitive Gaps to Watch

- **Sierra** is raising the bar for enterprise CX agents (but at $10K-100K/mo — different market)
- **Salesforce Agentforce** is the 800-lb gorilla for Salesforce shops
- **Microsoft Copilot Studio** for M365-centric enterprises
- None of these offer the **personal, always-on, multi-channel** experience that OpenClaw provides

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Build Docker Compose template for per-customer provisioning
- [ ] Create customer onboarding automation (one-command deploy)
- [ ] Set up centralized monitoring (Grafana/Prometheus per instance)
- [ ] Establish backup automation for customer workspaces
- [ ] Define standard skill packs per vertical (legal, real estate, finance)

### Phase 2: Operations (Weeks 5-8)
- [ ] Build admin dashboard for multi-tenant management
- [ ] LLM cost tracking and alerting per customer
- [ ] Automated OpenClaw version updates (staged rollout)
- [ ] Customer-facing status page
- [ ] SOC 2 evidence collection automation

### Phase 3: Scale (Weeks 9-12)
- [ ] Self-service customer portal (view usage, manage channels)
- [ ] Kubernetes migration for 20+ customers
- [ ] Bulk API key management (negotiate enterprise Anthropic pricing)
- [ ] Automated skill deployment pipeline

---

## 8. Recommendations

1. **Start with Hetzner** — $12/customer/mo hosting is unbeatable. Move enterprise customers to AWS/GCP only if they require it for compliance.

2. **One instance per customer** — the isolation is worth the marginal cost. Don't compromise on security.

3. **Price floor of $1,500/mo** — even light usage is profitable. Below this, support time kills margins.

4. **Cap LLM costs per tier** — use Sonnet as default, Opus on-demand. Implement usage alerts. Consider Claude Pro/Max subscriptions for lighter customers.

5. **Automate provisioning ASAP** — the ops burden of manual setup is the real scaling bottleneck, not infrastructure cost.

6. **Lead with multi-channel** — this is OpenClaw's killer feature. No competitor does WhatsApp + Slack + Discord + email from one agent.

7. **Target $5,000-10,000/mo sweet spot** — best margin (75-85%), serious enough for enterprise, accessible enough for mid-market.

---

## Summary

| Metric | Value |
|--------|-------|
| **Hosting cost per customer** | $12–$60/mo |
| **LLM cost per customer** | $150–$3,000/mo |
| **Total COGS per customer** | $300–$5,000/mo |
| **Target pricing** | $1,500–$25,000/mo |
| **Gross margins** | 70–85% |
| **Break-even per customer** | ~$300/mo (light usage) |
| **Architecture** | Per-customer Docker instance on Hetzner/AWS |
| **Security model** | Full isolation + encryption + SOC 2 aligned |
| **Competitive moat** | Multi-channel, open source, coding agent DNA, cost advantage |

**Bottom line:** OpenClaw-based managed AI agent hosting is highly viable with excellent margins. The infrastructure costs are trivial — LLM API usage and human support time are the real costs. At AfrexAI's price points, even conservative estimates show 70%+ gross margins. The key risk is LLM cost volatility on heavy-usage customers, mitigated by usage-based pricing tiers.
