# Spec Creation Guide

How and when to create specification documents for features.

## When to Create a Spec

Create a spec when:
- Feature touches 5+ files
- Multiple agents/phases will implement it
- Architecture decisions need to be recorded
- The feature has complex business logic
- You need stakeholder alignment before building
- You'll reference the design during implementation

Skip specs when:
- Simple bug fix or config change
- Single-file modification
- The plan document is sufficient

## Where to Save Specs

```
workspace/specs/<feature-name>.md
```

Use kebab-case for filenames. Examples:
- `specs/user-authentication.md`
- `specs/payment-processing.md`
- `specs/api-rate-limiting.md`

## Spec Document Template

```markdown
# Spec: [Feature Name]

**Date:** YYYY-MM-DD
**Status:** Draft | Review | Approved | Implemented
**Author:** [agent/human]

## Problem Statement
[What problem are we solving? Why does it matter? 2-3 sentences max.]

## Proposed Solution
[High-level description of the approach. What will we build?]

## Design

### Data Model
[New or modified models/schemas. Use code blocks for schema definitions.]

### API / Interface
[Endpoints, function signatures, component props — whatever the interface is.]

### Flow
[Step-by-step flow of how the feature works. Numbered list or diagram description.]

### File Structure
[New files to create, existing files to modify.]

```
src/
├── new-file.ts          # [purpose]
├── modified-file.ts     # [what changes]
```

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| [Decision 1] | [What we chose] | [Why] |
| [Decision 2] | [What we chose] | [Why] |

## Out of Scope
- [Thing we're explicitly NOT doing]
- [Another thing]

## Open Questions
- [ ] [Unresolved question 1]
- [ ] [Unresolved question 2]
```

## Referencing Specs

When implementing, reference the spec:
- In plan documents: "See `specs/user-authentication.md` for design details"
- In code comments: `// Per spec: specs/user-authentication.md#api-interface`
- In commit messages: "Implement user auth per specs/user-authentication.md"

## Spec Lifecycle

1. **Draft** — Initial creation during planning
2. **Review** — Shared for feedback (if applicable)
3. **Approved** — Ready for implementation
4. **Implemented** — Code matches spec, spec becomes documentation
5. **Superseded** — Replaced by a newer spec (add note at top pointing to new one)

## Best Practices

- **Keep specs concise** — A spec is a reference, not a novel. Target 50-150 lines.
- **Include decisions** — The "why" is more valuable than the "what" long-term
- **Update during implementation** — If the design changes, update the spec
- **Mark open questions** — Don't pretend you have all the answers
- **Use code blocks** — For schemas, APIs, and file structures. Precise > vague.
- **One feature per spec** — Don't combine unrelated features
- **Link to plan** — Spec describes the design; plan describes the execution
