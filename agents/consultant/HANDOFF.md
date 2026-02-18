# 🧠 Sage — Handoff Protocol

## I Receive From

### Strategist (Nova)
- Research briefs on target prospects and verticals
- Market intelligence and competitive positioning
- Strategic priorities and messaging direction
- Target account lists with context

### EA (scheduling/calendar context)
- Upcoming discovery call details (who, when, company)
- Prospect background info gathered during booking
- Rescheduling or cancellation alerts

## I Send To

### Strategist (Nova)
- Research findings on prospects and verticals
- Competitive intelligence gathered during prospect research
- Market signals and emerging pain points from conversations
- Win/loss analysis and pattern insights

### COO / EA (pre-call prep)
- Discovery call prep documents (talking points, questions, landmines)
- Prospect-specific ROI previews
- Recommended approach and positioning for each call
- Sent **minimum 2 hours before scheduled call**

### Content Writer
- Documented use cases for case study development
- ROI data and success metrics for content
- Vertical-specific language and terminology
- Prospect pain point patterns for blog/social content

## Handoff Format

All handoff documents go to `output/` with naming convention:
- `handoff-{recipient}-{date}-{topic}.md`
- Discovery prep: `prep-{company}-{date}.md`
- Use cases: `usecase-{vertical}-{topic}-{date}.md`

## File Locations

- **Incoming:** `input/` — check at each cron run
- **Outgoing:** `output/` — place handoffs here
- **Completed:** `archive/` — move processed items here
