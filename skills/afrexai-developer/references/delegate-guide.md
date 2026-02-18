# Delegation Guide

## When to Delegate vs Do Yourself

### Delegate When
- Task has **3+ independent parts** that can run in parallel
- You need **investigation** before you can implement (send an investigator)
- Task requires **different expertise** (e.g., frontend + backend + infra)
- Total work exceeds **~500 lines of changes**
- You need a **second opinion** on architecture

### Do Yourself When
- Task is a single focused change (< 200 lines)
- All changes are in one module/feature
- You understand the full context already
- Delegation overhead > actual work

## Agent Types

| Agent | Purpose | Give Them | Expect Back |
|---|---|---|---|
| **Investigator** | Research, explore, understand | Question + scope boundaries | Findings report with evidence |
| **Analyzer** | Audit code, find patterns, assess | Codebase path + what to look for | Structured analysis with file refs |
| **Implementer** | Write code, build features | Spec + context + constraints | Working code + summary |
| **Tester** | Verify, break things, edge cases | What to test + acceptance criteria | Test results + issues found |

## Parallel vs Sequential

### Parallel Delegation
Use when tasks are independent:

```
Main Agent
├── Sub-agent A: Implement user API ──→ user.service.ts, user.routes.ts
├── Sub-agent B: Implement order API ──→ order.service.ts, order.routes.ts
└── Sub-agent C: Implement shared auth ──→ auth.middleware.ts
```

Good for: independent features, investigation + implementation simultaneously.

### Sequential Delegation
Use when tasks depend on each other:

```
1. Investigator: "What's the current auth flow?"
   → Report: "JWT in middleware, roles in DB, 3 permission levels"
2. Implementer: "Add admin role using this auth pattern"
   → Code: new role + routes + tests
3. Tester: "Verify admin role works with existing flows"
   → Results: pass/fail + edge cases
```

Good for: unfamiliar codebases, complex changes with dependencies.

## Mini-Delegation Strategy

For large tasks (500+ lines), break into mini-delegations:

1. **Decompose** the task into 3-7 focused subtasks
2. **Order** by dependencies (independent tasks can parallelize)
3. **Specify** each subtask clearly:
   - What to build/change
   - Which files to touch
   - Constraints and patterns to follow
   - Expected output
4. **Integrate** results — review, resolve conflicts, ensure consistency

### Example Decomposition

Task: "Add user notifications feature"

```
Subtask 1 (Implementer): Create notification types and repository
  Files: notification.types.ts, notification.repository.ts
  Pattern: Follow existing user.repository.ts pattern

Subtask 2 (Implementer): Create notification service
  Files: notification.service.ts
  Depends on: Subtask 1 types
  
Subtask 3 (Implementer): Add notification API routes
  Files: notification.routes.ts
  Pattern: Follow existing user.routes.ts

Subtask 4 (Implementer): Add event listeners for notifications
  Files: notification.listeners.ts
  Events: user.created, order.placed, order.shipped

Subtask 5 (Tester): Test all notification flows
  Scope: API endpoints + event-driven notifications
```

## Report Standards

Every delegated task must return a report containing:

### Required
- **Files changed**: Full paths with line counts
- **What was done**: One-paragraph summary
- **Quality check**: Confirmation that hard limits were met

### When Debugging
- **Root cause**: Specific explanation with code reference
- **File path + line number**: Exact location of the issue
- **Code snippet**: The problematic code AND the fix
- **Verification**: How you confirmed the fix works

### When Investigating
- **Findings**: Structured list of discoveries
- **Evidence**: File paths, code snippets, log output
- **Recommendations**: What to do with the findings

## Anti-Patterns

| Anti-Pattern | Why It Fails | Instead |
|---|---|---|
| Vague delegation | "Fix the auth" → agent doesn't know scope | Specific: "Add rate limiting to POST /auth/login" |
| No context | Agent wastes time re-discovering what you know | Share relevant file paths, patterns, constraints |
| Too many sub-agents | Coordination overhead dominates | Max 5 parallel agents; prefer 2-3 |
| No integration plan | Agents produce conflicting changes | Define file ownership — one agent per file |
| Delegating trivial work | Overhead > the work itself | Just do it yourself |
| Not reviewing results | Blind trust in sub-agents | Always review before declaring done |
| Micro-managing | Specifying every line | Give goals and constraints, not instructions |
