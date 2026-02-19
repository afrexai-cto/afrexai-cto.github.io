# Principle: Explain Why, Not Just What

## Before
```
- Keep responses under 3 sentences
- Use bullet points for lists
- Don't use emoji
- Always include a source link
```

## After
```
Keep responses under 3 sentences — users are scanning a feed and skip anything longer.

Use bullet points when listing more than two items, since they're easier to scan than inline lists.

Skip emoji — the output feeds into a CMS that strips them and leaves broken characters.

Include a source link so editors can fact-check without a separate search.
```

## Why
Every rule now has context. If the CMS gets fixed to support emoji, someone reviewing the prompt knows they can drop that rule. If the format changes from a feed to long-form, they know "3 sentences" was for scanning and can adjust. The model also generalizes better — with the scanning context, it'll also keep paragraphs short and front-load key information.
