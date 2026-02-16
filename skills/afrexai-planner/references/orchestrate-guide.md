# Orchestration Guide

Rules and constraints for orchestrating multi-phase builds with sub-agents.

## Agent Constraints Block

Every implementation agent (including yourself) operates under these hard limits:

```
MAX_FILE_LINES:     300    # No file exceeds 300 lines. Split if it would.
MAX_FUNCTION_LINES:  50    # No function exceeds 50 lines. Decompose.
SCOPE:              exact  # Implement exactly what's specified. Nothing more.
TESTS:              skip   # Don't write tests unless explicitly asked.
DOCS:               skip   # Don't write docs unless explicitly asked.
LINT:               fix    # Fix lint/type errors in files you touch. Don't chase others.
```

Include this block (or a summary) when delegating to implementation agents.

## Phase-Specific Rules

### Implementation Phase
- One phase at a time — complete and verify before starting the next
- Each task should modify 1-3 files max
- Run the code after each phase to verify it works
- If a task is taking more than one turn, it's too big — split it
- Commit after each phase if using git

### File Limits
- **Creating a file > 300 lines?** Split into modules immediately
- **Function > 50 lines?** Extract helper functions
- **Component > 200 lines?** Split into sub-components
- These aren't guidelines — they're hard stops

### Test Phase (when requested)
- Only test what was just built
- One test file per source file max
- Focus on happy path + critical edge cases
- Don't aim for coverage percentages — aim for confidence
- Max 150 lines per test file

### Documentation Phase (when requested)
- README updates only — don't create separate doc files unless asked
- Document the "what" and "why", not the "how" (code is the how)
- Max 100 lines of docs per feature
- API docs: one example per endpoint, that's it

## When to Skip Phases

| Phase | Skip When |
|-------|-----------|
| Planning | Single-file change, trivial fix |
| Spec | Plan document is sufficient |
| Tests | Not asked for, prototype/spike, trivial change |
| Docs | Not asked for, internal tooling, obvious code |
| Review | Single small change, low risk |

Default: **Plan → Implement → Verify**. Only add Test/Doc/Review phases when explicitly requested or when the risk justifies it.

## Output Standards

### Code Output
- Working code that runs without errors
- Follows existing codebase patterns
- No TODO comments unless explicitly part of the plan
- No commented-out code
- No placeholder implementations ("// implement later")

### Plan/Spec Output
- Saved to files in the workspace (not just chat messages)
- Uses the templates from this skill's references
- Includes specific file paths and function names
- Has clear success criteria

### Communication
- Report phase completion with: what was done, what to verify, what's next
- Flag blockers immediately — don't spin on unsolvable problems
- If you deviate from the plan, explain why

## Scope Control

### No Scope Creep
The #1 risk in orchestrated builds. Guard against it aggressively.

**Scope creep looks like:**
- "While I'm here, I'll also refactor this..."
- "This would be better if we also added..."
- "I noticed this other issue, let me fix it too..."
- Adding error handling for cases not in the requirements
- Making things "more robust" beyond what's needed

**How to handle it:**
- Note the improvement opportunity in a comment or separate task
- Don't implement it now
- Stay on the plan

### Exceptions
You MAY deviate from the plan when:
- The code literally won't work without the change (missing import, type error)
- A security vulnerability is introduced by following the plan exactly
- The plan is based on incorrect assumptions about the codebase (flag and adjust)

## Red Flags to Watch For

### In Planning
- 🚩 Plan has > 5 phases — feature is too big, split it
- 🚩 Tasks are vague ("set up the system") — not ready to implement
- 🚩 No success criteria — how will you know it's done?
- 🚩 Circular dependencies between phases
- 🚩 Plan doesn't reference existing code — did you read the codebase?

### In Implementation
- 🚩 File growing past 250 lines — split now, not at 300
- 🚩 Function growing past 40 lines — decompose now, not at 50
- 🚩 Touching files not in the plan — scope creep alert
- 🚩 Copy-pasting code blocks — extract to shared utility
- 🚩 Agent spinning for > 2 turns on one task — task is too big or blocked
- 🚩 "It mostly works except..." — it doesn't work, fix it before moving on

### In Orchestration
- 🚩 Multiple agents editing the same file — merge conflict incoming
- 🚩 Phase depends on unverified previous phase — stop and verify
- 🚩 Agent asking questions that the plan should have answered — plan was incomplete
- 🚩 Estimated 3 tasks, actually needed 10 — re-plan, don't just keep going
