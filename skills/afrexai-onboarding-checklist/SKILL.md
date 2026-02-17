---
name: afrexai-onboarding-checklist
description: Generate and manage customer or employee onboarding checklists and workflows. Use when setting up new client engagements, onboarding employees, or creating structured multi-step onboarding processes.
---

# Onboarding Checklist

Create structured onboarding workflows for clients or employees.

## Usage

```
Create onboarding checklist for:
- Type: new client
- Client: Acme Corp
- Service: AI consulting engagement
- Start date: 2026-03-01
```

## Output Format

Save to `onboarding/{type}-{name}-YYYY-MM-DD.md`:

```markdown
# Onboarding: [Name]
**Type:** Client/Employee | **Start:** YYYY-MM-DD | **Owner:** [Name]

## Pre-Start (Before Day 1)
- [ ] Send welcome email with key contacts
- [ ] Collect signed contracts and NDAs
- [ ] Set up project management workspace
- [ ] Create shared drive/folder
- [ ] Schedule kickoff meeting

## Week 1: Setup
- [ ] Kickoff meeting — align on goals and timeline
- [ ] Gather access credentials and system requirements
- [ ] Define communication cadence (weekly standup, etc.)
- [ ] Share project plan and milestones
- [ ] Assign primary point of contact

## Week 2: Ramp
- [ ] First deliverable review
- [ ] Feedback loop established
- [ ] Escalation path confirmed

## Ongoing
- [ ] Weekly status reports
- [ ] Monthly business review
- [ ] Quarterly roadmap planning
```

## Customization

Adapt checklist based on:
- **Client onboarding:** Focus on access, contracts, kickoff, communication
- **Employee onboarding:** Focus on IT setup, HR paperwork, training, mentor assignment
- **Partner onboarding:** Focus on integration, API access, joint planning

## Rules

- Every item must be actionable (starts with a verb)
- Include deadlines relative to start date
- Assign owners where possible
- Group by phase/timeframe

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
