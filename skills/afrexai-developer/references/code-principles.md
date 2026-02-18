# Code Principles

## Hard Limits

| Metric | Maximum | Action When Exceeded |
|---|---|---|
| Lines per function | 50 | Extract helper functions |
| Parameters per function | 4 | Use options/config object |
| Nesting levels | 4 | Extract function or use early returns |
| Lines per file | 300 | Split by responsibility |
| Public methods per class | 10 | Extract to separate class/module |
| Cyclomatic complexity | 10 | Simplify conditional logic |

These are not guidelines. They are limits. If you exceed them, refactor before committing.

## Function Rules

### Structure
```
1. Guard clauses (validate, return early)
2. Core logic (the actual work)
3. Return value
```

### Naming
- Functions: verb + noun → `calculateTotal`, `validateInput`, `sendNotification`
- Booleans: `is/has/should/can` prefix → `isValid`, `hasPermission`
- Collections: plural → `users`, `orderItems`
- Constants: UPPER_SNAKE → `MAX_RETRIES`, `DEFAULT_TIMEOUT`
- Classes: PascalCase noun → `UserService`, `OrderRepository`
- Files: kebab-case → `user-service.ts`, `order-repository.ts`

### Parameters
- Max 4 positional parameters
- Beyond 4: use an options object
- Required params first, optional last
- Boolean params → use options object instead (avoid `doThing(true, false)`)

```typescript
// ❌ Bad
function createUser(name, email, role, active, sendEmail, template) {}

// ✅ Good
function createUser(name: string, email: string, options?: CreateUserOptions) {}
```

## File Rules

- One primary export per file
- Max 300 lines — split if larger
- Imports at the top, organized: external → internal → relative
- No circular dependencies

## Error Handling

### Do
- Use specific error types: `ValidationError`, `NotFoundError`, `AuthError`
- Include context in error messages: what, with what input, why
- Validate at boundaries (API handlers, public methods, config loaders)
- Fail fast — check preconditions first
- Log errors with structured context (not just the message)

### Don't
- Never `catch (e) {}` — empty catches hide bugs
- Never `catch (e) { console.log(e) }` without rethrowing or handling
- Never return `null` to indicate errors — throw or use Result types
- Never mix error handling with business logic

```typescript
// ❌ Bad
try { doEverything() } catch (e) { console.log('error') }

// ✅ Good
try {
  const user = await findUser(id);
  if (!user) throw new NotFoundError(`User ${id} not found`);
  return await updateUser(user, changes);
} catch (error) {
  if (error instanceof NotFoundError) throw error;
  throw new ServiceError('Failed to update user', { cause: error, userId: id });
}
```

## Anti-Patterns

| Anti-Pattern | Why It's Bad | Fix |
|---|---|---|
| God function (100+ lines) | Untestable, unreadable | Extract focused functions |
| Deep nesting (5+ levels) | Hard to follow logic flow | Early returns, extract helpers |
| Magic numbers | No context for future readers | Named constants |
| Boolean parameters | Unclear at call site | Options object |
| Catch-and-ignore | Hides bugs | Handle or rethrow |
| Copy-paste code | Maintenance nightmare | Extract shared utility |
| Premature optimization | Complexity without measured need | Profile first, optimize second |
| God class (20+ methods) | Too many responsibilities | Split by responsibility |
| String typing | No type safety | Enums, union types, branded types |
| Implicit dependencies | Hidden coupling | Explicit injection |

## Testing Requirements

- Unit tests for all business logic
- Edge cases: empty input, null, boundary values, error paths
- Test names describe behavior: `should reject expired tokens`
- One assertion per concept (not necessarily per test)
- No test interdependencies — each test stands alone
- Mock external services, not internal logic

## Quality Checklist

Before declaring any implementation complete:

- [ ] All functions ≤ 50 lines
- [ ] All functions ≤ 4 parameters
- [ ] Max 4 nesting levels
- [ ] All files ≤ 300 lines
- [ ] No magic numbers
- [ ] Specific error handling with context
- [ ] Self-documenting names (no abbreviations unless universal)
- [ ] Guard clauses at function tops
- [ ] No copy-pasted code blocks
- [ ] Follows existing project conventions
- [ ] Imports organized: external → internal → relative
- [ ] Business logic comments explain *why*, not *what*
