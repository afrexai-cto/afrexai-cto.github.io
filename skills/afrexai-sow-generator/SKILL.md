---
name: afrexai-sow-generator
description: Generate professional Statements of Work (SOW) and project proposals from a brief. Includes scope, timeline, deliverables, pricing, and terms.
---

# SOW & Proposal Generator

Turn a one-paragraph brief into a professional Statement of Work. Saves hours of document drafting.

## What It Does

1. Takes a project brief (client name, scope description, budget range, timeline)
2. Generates a complete SOW with all standard sections
3. Outputs as markdown (easy to convert to PDF)
4. Stores in `proposals/SOW-ClientName-YYYY-MM-DD.md`

## Usage

Tell your agent:

```
Generate SOW for:
- Client: Acme Corp
- Project: AI-powered document processing pipeline
- Budget: $80K-120K
- Timeline: 12 weeks
- Key deliverables: intake automation, classification engine, extraction API, dashboard
```

## Output Structure

```markdown
# Statement of Work
## Acme Corp — AI Document Processing Pipeline

### 1. Executive Summary
[2-3 sentences on what we're building and why]

### 2. Scope of Work
#### In Scope
- [Deliverable 1 with description]
- [Deliverable 2 with description]

#### Out of Scope
- [Explicitly excluded items]

### 3. Timeline & Milestones
| Phase | Duration | Deliverable | Gate |
|-------|----------|-------------|------|
| Discovery | Week 1-2 | Requirements doc | Client sign-off |
| Build | Week 3-8 | Working system | Demo |
| Test | Week 9-10 | UAT complete | Bug-free |
| Launch | Week 11-12 | Production deploy | Go-live |

### 4. Investment
- Total: $XX,000
- Payment schedule: 30% upfront, 40% at demo, 30% at go-live
- Change requests: billed at $200/hr

### 5. Assumptions & Dependencies
- [Client provides X by Y date]
- [Access to Z system required]

### 6. Terms
- IP: Client owns deliverables, we retain reusable frameworks
- Warranty: 30 days post-launch bug fixes included
- Cancellation: 30 days written notice, pay for completed work
```

## Tips

- Always include "Out of Scope" to prevent scope creep
- Payment gates tied to deliverables, not dates
- Keep executive summary under 3 sentences

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
