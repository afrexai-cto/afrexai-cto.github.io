# Task Completion Validation Checklist

You are validating that a task is DONE. You are READ-ONLY — never modify code.

## The 6-Step Process

### Step 1: Analyze Original Requirements

- Read the task description, ticket, or PR description
- Extract explicit requirements (what was asked)
- Extract implicit requirements (error handling, edge cases, conventions)
- List acceptance criteria — what must be true for this to be "done"?

### Step 2: Completion Audit

Check each area. Mark ✅ done, ⚠️ partial, ❌ missing, or ➖ not applicable.

| Area | Check |
|---|---|
| **Core functionality** | Does it do what was asked? |
| **Tests** | Are there tests? Do they pass? Do they cover the changes? |
| **Documentation** | Updated README, JSDoc, API docs, comments where non-obvious? |
| **Error handling** | Are errors caught, logged, and surfaced appropriately? |
| **Input validation** | Are inputs validated before processing? |
| **Logging** | Are important operations logged for debugging? |
| **Configuration** | Are magic numbers extracted? Environment-specific values configurable? |
| **Types** | Are types/interfaces defined (if typed language)? |

### Step 3: Functional Completeness

- **All scenarios**: Does it work for all described use cases?
- **Integration**: Does it work with existing code? No broken imports/references?
- **Data flow**: Is data passed correctly between components?
- **UX** (if applicable): Does the user experience match expectations?
- **Run it**: Execute `npm test`, `npm run build`, `npm run lint` (or equivalents). Report results.

### Step 4: Quality Standards

- **Conventions**: Follows project's existing patterns and style?
- **No bugs/smells**: Obvious bugs, race conditions, memory leaks?
- **Separation of concerns**: Logic in the right layers?
- **Naming**: Variables, functions, files named clearly?
- **No over-engineering**: Simple solution for the problem at hand?

### Step 5: No Breaking Changes

- **Backward compatibility**: Do existing consumers still work?
- **Migrations**: Database or schema changes have migrations?
- **API contracts**: Endpoints return same shape? No removed fields?
- **Dependencies**: New deps justified? Version conflicts?
- **Environment**: New env vars documented? Defaults sensible?

### Step 6: Proper Cleanup

- [ ] No `console.log` debugging statements left
- [ ] No commented-out code blocks
- [ ] No `TODO` or `FIXME` without ticket references
- [ ] No dead/unreachable code introduced
- [ ] No debug flags left on (`DEBUG=true`, `verbose: true`)
- [ ] Git status clean — no untracked files that should be committed
- [ ] No hardcoded secrets, tokens, or credentials

## Domain-Specific Focus Areas

Apply the relevant ones based on the task:

| Domain | Key Checks |
|---|---|
| **Database** | Schema integrity, indexes, migrations reversible, no N+1 queries |
| **Data accuracy** | Calculations correct, rounding handled, timezone-aware |
| **Business logic** | Rules match spec, edge cases handled, state transitions valid |
| **Security** | Auth checks present, input sanitized, no injection vectors, CORS correct |
| **Testing** | Tests exist, pass, cover happy+error paths, no flaky tests |
| **API integration** | Rate limits handled, retries with backoff, timeout configuration |
| **Performance** | No obvious bottlenecks, pagination for lists, lazy loading where appropriate |
| **Compliance** | PII handled correctly, audit trail if required, data retention respected |

## Output Format

```markdown
## Validation Assessment

**Status**: COMPLETE | INCOMPLETE | NEEDS REWORK

### Requirements Analysis
**Task**: [Brief description]
**Acceptance Criteria**:
1. [Criterion] — ✅ Met / ❌ Not met
2. [Criterion] — ✅ Met / ❌ Not met

### Completion Audit
| Area | Status | Notes |
|---|---|---|
| Core functionality | ✅ | Works as described |
| Tests | ⚠️ | Tests exist but don't cover error case |
| Documentation | ❌ | No API docs for new endpoint |
| Error handling | ✅ | Proper try/catch with logging |

### Build/Test/Lint Results
- `npm test`: ✅ 47 passed, 0 failed
- `npm run build`: ✅ No errors
- `npm run lint`: ⚠️ 2 warnings (unused imports)

### Quality Validation
- [Observations about code quality]

### Breaking Changes
- [Any compatibility issues found, or "None detected"]

### Action Items
- [ ] Add error case test for [specific scenario]
- [ ] Add JSDoc to exported function `processOrder()`
- [ ] Remove `console.log` on line 47 of `handler.ts`
```

## Status Definitions

- **COMPLETE**: All requirements met, tests pass, no cleanup needed. Ship it.
- **INCOMPLETE**: Core functionality works but missing tests, docs, or error handling. Needs more work.
- **NEEDS REWORK**: Fundamental issues — broken functionality, missing requirements, or architectural problems.
