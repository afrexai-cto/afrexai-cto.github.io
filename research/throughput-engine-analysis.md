# StoryLab Throughput Engine — PDF Analysis & Gap Report

**Date:** 2026-02-18
**Source:** StoryLab Strategic Technology Integration Roadmap (15-page internal deck)
**Prepared for:** Jacob Johnson, CEO | Execution: Feb–Apr 2026

---

## What the PDF Describes

This is **Jacob's internal strategy deck for StoryLab 2.0** — a platform upgrade combining two engines:

### 1. The Logic Engine (Anthropic Harness)
- 24/7 autonomous coding agent using Claude
- Breaks PRDs into granular sessions to avoid context limits
- **Workflow:** Initializer Agent → feature_list.json → Coding Loop (Read Progress → Implement Feature → Puppeteer Visual Check → Commit) → repeat with fresh context each loop
- Based on Cole Medin's "Claude codes for 24 hours" experiment
- Stats from reference: 24hrs continuous, 54 sequential sessions, 54% feature completion rate
- TDD + Claude Agent SDK for programmatic control

### 2. The Design Engine (Gemini 3.0 Pro)
- Apple-quality UI fidelity (vs generic "vibe coding" output)
- Multimodal: sketch-to-app generation
- System-style consistency
- Based on Brock Mesarich's Gemini 3 analysis

### Integration Architecture
- **Strategy C: User Choice** — users pick cost vs fidelity
- Logic Engine path: `long-running-build-worker.ts` → Anthropic Harness (backend logic, DB schema, core functionality)
- Design Engine path: `gemini-service.ts` → Gemini Service (UI generation, component styling, "Enhance UI" pass)
- Both engines connect bidirectionally

### API Routes
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/agi/builds/[id]/initialize | Trigger feature generation |
| POST | /api/agi/builds/[id]/session | Run single coding loop |
| POST | /api/agi/builds/[id]/validate | Puppeteer visual check |
| POST | /api/agi/builds/[id]/enhance-ui | Gemini UI pass |

### Database Schema
- `BuildFeature` model: id, status (PENDING/CODING/VALIDATING/DONE), testCaseJson, parentBuildId

### Credit Economics
- Standard Build: 80 credits (fixed)
- Long-Running Build: 20 base + 5/feature (scales with complexity)
- Enhanced UI Add-on: +15 credits (Gemini pass)
- Power User Combo: 20 base + 8/feature avg

### Platform Status (as of deck creation)
**LIVE:** AGI + StoryLab codebase merge, Cloud deployment (Hostinger/Cloudflare), Neon PostgreSQL & Auth, 74 agents live
**IN PROGRESS:** Multi-tenant upgrade, Remote Build Agent provisioning, Admin Dashboard for demos
**PENDING:** Payments integration, Stripe Connect workflow

### 3-Phase Timeline
**Phase 1 (Feb 2026) — Infrastructure:**
- CI/CD pipelines, load balancing, cloud instance for remote build agent, Prisma schema update, Gemini service creation, demo admin dashboard

**Phase 2 (Mar 2026) — Intelligence & Security:**
- Auth hardening & encryption, DB optimization, initializer logic & coding loop, Puppeteer validation, security audit (Rick - Cyber Analysis)

**Phase 3 (Apr 2026) — Production Launch:**
- API rate limiting, Gemini SDK & sketch upload, E2E testing, Stripe payments live, **GO-LIVE milestone end of April**

---

## Gap Analysis: What AfrexAI Has Built vs What StoryLab Needs

### ✅ ALREADY HAVE (Strong Overlap)
| StoryLab Need | AfrexAI Equivalent | Notes |
|---------------|-------------------|-------|
| 24/7 autonomous agents | 46 cron jobs, 10 agents, 8am/8pm build sprints | Core competency — we run this daily |
| Agent coordination/harness | OpenClaw + sub-agent spawning + HANDOFF.md | Different architecture but same concept |
| Fresh context per session | sessions_spawn with isolated sessions | Exactly how our swarm works |
| TDD/validation loops | afrexai-tester skill + validation in build crons | Have the skill, need to wire for StoryLab |
| Stripe payments | Stripe API live, 7 customers, $84K+ revenue | Can deploy for StoryLab quickly |
| CI/CD & deployment | GitHub Pages + SSH deploy | Different stack but capability exists |
| Admin dashboards | CEO dashboard, CRM dashboard (both on cron) | Template exists, needs StoryLab branding |
| Multi-tenant platform | AaaS platform with 7 customer deployments | `aaas-platform/autopilot.sh` handles onboarding |
| Credit/billing model | Stripe subscription tiers already live | Starter/Growth/Enterprise pricing exists |

### 🟧 PARTIALLY BUILT (Needs Adaptation)
| StoryLab Need | Current State | Gap |
|---------------|--------------|-----|
| PRD → Feature List → Coding Loop | We have afrexai-planner + afrexai-developer skills | Need to wire into StoryLab's specific initializer→loop flow |
| Puppeteer visual validation | Not currently using Puppeteer | Need to add browser-based visual testing |
| Git commit per feature loop | We do git commits but not per-feature-loop | Need automated commit-per-iteration |
| Build progress tracking (LongRunningBuildProgress) | Tracker agent does sprint boards | Need real-time progress component |
| Database schema (BuildFeature model) | We use Neon PostgreSQL (CRM) | Need StoryLab-specific Prisma models |

### ❌ NOT YET BUILT (New Work)
| StoryLab Need | Priority | Effort |
|---------------|----------|--------|
| Gemini 3.0 Pro integration (Design Engine) | HIGH | Medium — need Gemini API key + service |
| Sketch-to-app multimodal input | HIGH | Medium — Gemini SDK + upload UI |
| `long-running-build-worker.ts` | HIGH | Large — core autonomous coding loop |
| `gemini-service.ts` | HIGH | Medium — Gemini API wrapper |
| 4 API routes (/initialize, /session, /validate, /enhance-ui) | HIGH | Medium — Next.js API routes |
| Remote Build Agent provisioning (cloud instances) | MEDIUM | Large — cloud infra |
| "Enhance UI" pass (Gemini post-processing) | MEDIUM | Small — API call after build |
| Stripe Connect workflow (marketplace payments) | LOW (Phase 3) | Medium |
| Security audit coordination with Rick | LOW (Phase 2) | External dependency |

---

## Implementation Score

**Overall: ~40% aligned**

- **Infrastructure layer:** 60% — we have cloud, auth, DB, deployment patterns
- **Agent orchestration:** 70% — our swarm architecture maps well to the harness concept
- **The actual coding loop (Logic Engine):** 20% — concept matches but StoryLab-specific worker not built
- **Design Engine (Gemini):** 0% — completely new
- **Commerce/billing:** 50% — Stripe live but needs StoryLab-specific credit model
- **UI/UX (dashboard, progress, sketch upload):** 15% — have dashboard patterns, need StoryLab components

---

## Recommended Next Steps

1. **Build `long-running-build-worker.ts`** — the core coding loop. Our planner+developer skills can scaffold this.
2. **Create Gemini service** — get API key, build `gemini-service.ts` wrapper
3. **Wire the 4 API routes** — initialize, session, validate, enhance-ui
4. **Add Puppeteer validation** — browser-based visual checks in the loop
5. **Deploy Prisma schema** — BuildFeature model on Neon PostgreSQL
6. **Credit billing system** — map to existing Stripe setup

Jacob's timeline has Phase 1 (infra) in Feb — we're already mid-Feb, so we're behind on his timeline but ahead on foundational capabilities.
