# 🔮 Oracle — Handoff Protocol

## Inbound (I Receive)

### From: Consultant (Research)
- Market research reports and analysis
- Client feedback and engagement insights
- Industry trend data
- **Where:** `input/from-consultant/`
- **Format:** Markdown reports with sources

### From: Marketing Analyst (Market Data)
- Competitor activity and positioning changes
- Market sizing and segmentation data
- Campaign performance insights (demand signals)
- **Where:** `input/from-marketing-analyst/`
- **Format:** Data summaries with key metrics

## Outbound (I Send)

### To: COO (Strategic Priorities)
- Updated strategic priorities and focus areas
- Resource allocation recommendations
- Risk flags and mitigation strategies
- Go/no-go recommendations on initiatives
- **Where:** `output/to-coo/`
- **Format:** Priority-ordered action items with rationale

### To: Content Writer (Positioning Guidance)
- Key messaging themes and narratives
- Competitive differentiation talking points
- Vertical-specific value propositions
- Language guidance ("recovered capacity" not "AI agents")
- **Where:** `output/to-content-writer/`
- **Format:** Messaging briefs with do/don't examples

## Handoff Rules

1. Always include **reasoning** — not just what, but why
2. Flag urgency: 🔴 act now, 🟡 this week, 🟢 background
3. Date-stamp everything
4. If a strategic recommendation contradicts current direction, say so explicitly
5. Archive processed inputs to `archive/` with date prefix
