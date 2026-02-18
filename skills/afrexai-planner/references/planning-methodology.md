# Planning Methodology

The full 5-step strategic planning process for AI builder agents.

## Step 1: Requirements Analysis

Before anything else, understand what you're building.

### Actions
- Read the request carefully — twice
- Identify explicit requirements (what was asked for)
- Identify implicit requirements (what's obviously needed but unstated)
- List inputs, outputs, and constraints
- Define success criteria: how do we know it's done?
- Identify stakeholders and affected systems

### Questions to Ask
- What problem does this solve?
- Who/what uses this?
- What are the edge cases?
- What are the acceptance criteria?
- Are there performance or security requirements?
- What's out of scope?

### Output
A clear requirements summary with success criteria and scope boundaries.

---

## Step 2: Technical Assessment

Explore the existing codebase before proposing changes.

### Actions
- Read relevant files and directories
- Map the dependency graph (what depends on what)
- Identify existing patterns (naming, structure, error handling)
- Find reusable code — don't reinvent
- Check for configuration or environment requirements
- Assess current test coverage in affected areas

### Key Questions
- What files will be created/modified/deleted?
- What patterns does the codebase already use? Follow them.
- Are there existing utilities or helpers to leverage?
- What's the data flow for this feature?
- Are there migration or backwards-compatibility concerns?

### Output
A technical context summary listing affected files, patterns to follow, dependencies, and potential conflicts.

---

## Step 3: Phase Planning

Break work into ordered, shippable phases.

### Rules
- **2-5 phases** for most features (1 phase = trivial, 6+ = too complex, split the feature)
- Each phase should be **independently verifiable** — you can check it works before moving on
- Phases should build on each other — Phase 2 assumes Phase 1 is complete
- Order by dependency: foundation first, features second, polish last

### Common Phase Patterns

**New Feature:**
1. Data layer (models, schemas, migrations)
2. Business logic (services, handlers)
3. API/Interface layer (routes, UI components)
4. Integration (wire everything together)

**Refactor:**
1. Create new structure alongside old
2. Migrate consumers one by one
3. Remove old structure
4. Clean up

**Bug Fix:**
1. Reproduce and understand the bug
2. Implement fix
3. Verify fix doesn't break other things

### Output
An ordered list of phases with clear descriptions and dependencies.

---

## Step 4: Task Breakdown

Each phase gets concrete, actionable tasks.

### Rules
- One task = one clear action
- Tasks should be completable in a single agent turn (< 15 minutes of work)
- Use specific file paths and function names
- Each task should be independently verifiable
- Order tasks by dependency within each phase

### Good vs Bad Tasks

| ❌ Bad | ✅ Good |
|--------|---------|
| "Set up the database" | "Create `schema/users.ts` with User model: id, email, name, createdAt" |
| "Add authentication" | "Add `authMiddleware()` to `middleware/auth.ts` that validates JWT from Authorization header" |
| "Update the frontend" | "Add `UserProfile` component to `components/UserProfile.tsx` that displays name and email" |
| "Handle errors" | "Add try/catch to `createUser()` in `services/users.ts`, return 400 for validation errors, 500 for DB errors" |

### Output
A checklist of specific tasks per phase, ordered by dependency.

---

## Step 5: Risk Assessment

Identify what could go wrong and how to handle it.

### Risk Categories
- **Breaking changes** — Will this break existing functionality?
- **Data integrity** — Could data be lost or corrupted?
- **Security** — Auth bypass, injection, data exposure?
- **Performance** — N+1 queries, missing indexes, large payloads?
- **Edge cases** — Empty states, concurrent access, race conditions?
- **Dependencies** — External services, version conflicts, API changes?

### Risk Format
For each risk:
- **What**: Description of the risk
- **Likelihood**: Low / Medium / High
- **Impact**: Low / Medium / High
- **Mitigation**: What to do about it

### Output
A risk table with mitigations for anything Medium+ likelihood or impact.

---

## Plan Document Template

```markdown
# Plan: [Feature Name]

**Date:** YYYY-MM-DD
**Status:** Draft | Approved | In Progress | Complete
**Estimated Phases:** N
**Estimated Tasks:** N

## Summary
[One paragraph: what we're building, why, and the high-level approach]

## Requirements
- [Requirement 1]
- [Requirement 2]
- Success criteria: [How we know it's done]

## Technical Context
- **Affected files:** [list]
- **Key patterns:** [patterns to follow]
- **Dependencies:** [what this depends on]

## Phases

### Phase 1: [Name]
**Goal:** [What this phase achieves]
- [ ] Task 1: [Specific action with file paths]
- [ ] Task 2: [Specific action with file paths]
**Verification:** [How to check this phase works]

### Phase 2: [Name]
**Goal:** [What this phase achieves]
- [ ] Task 1
- [ ] Task 2
**Verification:** [How to check]

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [Risk 1] | Medium | High | [What to do] |
| [Risk 2] | Low | Medium | [What to do] |

## Next Steps
1. [Immediate first action]
2. [Second action]
3. [Third action]
```

---

## DO / DON'T Best Practices

### DO
- ✅ Read the codebase before planning — understand what exists
- ✅ Follow existing patterns — consistency beats cleverness
- ✅ Keep phases small and verifiable
- ✅ Use specific file paths and function names in tasks
- ✅ Flag unknowns explicitly — "I'm unsure about X, need to verify"
- ✅ Define success criteria upfront
- ✅ Consider rollback — how do we undo this if it goes wrong?
- ✅ Estimate complexity honestly — if it's big, say it's big
- ✅ Save plans to files — they're reference documents for implementation

### DON'T
- ❌ Start coding without a plan for complex work
- ❌ Assume requirements — ask when ambiguous
- ❌ Plan more than you need — a 2-file change doesn't need 5 phases
- ❌ Ignore existing code — duplicating functionality is waste
- ❌ Over-engineer — solve the problem at hand, not hypothetical future problems
- ❌ Mix concerns in phases — one phase shouldn't do auth AND UI AND database
- ❌ Skip the risk assessment — it takes 2 minutes and saves hours
- ❌ Plan in your head — write it down, always
- ❌ Gold-plate the plan — a good plan today beats a perfect plan never
