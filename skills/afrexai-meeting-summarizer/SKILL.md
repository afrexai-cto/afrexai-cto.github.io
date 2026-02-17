---
name: afrexai-meeting-summarizer
description: Summarize meeting transcripts or notes into structured action items, decisions, and key takeaways. Use when processing meeting recordings, transcripts, or raw notes into actionable summaries.
---

# Meeting Summarizer

Turn raw meeting transcripts into structured, actionable summaries.

## Usage

Provide a transcript (paste text, file path, or URL) and optionally the meeting type.

```
Summarize this meeting transcript: [paste or file path]
Meeting type: client kickoff
```

## Output Format

Save to `meetings/YYYY-MM-DD-{topic}.md`:

```markdown
# Meeting Summary: [Topic]
**Date:** YYYY-MM-DD | **Duration:** ~Xmin | **Attendees:** [names]

## Key Decisions
1. [Decision with context]

## Action Items
| Owner | Action | Deadline |
|---|---|---|
| Name | Task description | Date |

## Discussion Summary
- [Topic 1]: [2-3 sentence summary]
- [Topic 2]: [2-3 sentence summary]

## Open Questions
- [Unresolved item needing follow-up]

## Next Meeting
- Date/topic if mentioned
```

## Rules

- Extract ALL action items with owners and deadlines
- Flag decisions explicitly — these are the most valuable part
- Keep discussion summary to 2-3 sentences per topic
- If no owner assigned, mark as "TBD"
- If no deadline mentioned, mark as "TBD"
- Separate facts from opinions

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
