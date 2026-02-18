---
name: afrexai-social-scheduler
description: Draft and schedule social media posts across platforms (LinkedIn, Twitter/X, Instagram, Facebook). Use when creating social content calendars, drafting posts, or planning social media campaigns.
---

# Social Media Scheduler

Draft platform-optimized social media posts and organize them into a content calendar.

## Usage

```
Create a week of social posts for:
- Topic: Launch of our new AI consulting service
- Platforms: LinkedIn, Twitter/X
- Tone: Professional but approachable
- CTA: Book a discovery call
```

## Output Format

Save to `social/YYYY-MM-DD-campaign.md`:

```markdown
# Social Calendar: [Campaign Name]
**Period:** YYYY-MM-DD to YYYY-MM-DD

## Monday — [Theme]

### LinkedIn
> [Post text, 150-300 words, professional tone]
> 
> Hashtags: #AI #Consulting
> Media: [suggestion]
> Best time: 8-10am or 12pm

### Twitter/X
> [Post text, <280 chars]
> 
> Thread: [if applicable, numbered tweets]
> Best time: 9am or 5pm

---
[Repeat for each day]
```

## Platform Guidelines

- **LinkedIn:** 150-300 words, storytelling, professional. Use line breaks for readability.
- **Twitter/X:** <280 chars or threads. Punchy, conversational. 1-3 hashtags max.
- **Instagram:** Caption + hook in first line. 5-15 hashtags at end.
- **Facebook:** Conversational, question-based, encourage comments.

## Rules

- Each post must have a clear CTA or engagement hook
- Vary post types: story, tip, question, statistic, case study
- Never repeat the same structure two days in a row
- Include media suggestions (image/video/carousel) for each post

---

*Built by [AfrexAI](https://afrexai-cto.github.io) — AI agent workforce for businesses.*
