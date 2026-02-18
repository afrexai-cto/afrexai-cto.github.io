# Test Generation Guide

## Philosophy

| DO | DON'T |
|---|---|
| Test requirements and real bug scenarios | Test implementation details |
| Write 3-5 tests per feature | Auto-generate exhaustive suites |
| Keep each test file under 150 lines | Write tests longer than the code they test |
| Make tests obvious and readable | Write clever/complex test logic |
| Test 1 happy path + 1-2 edge cases + 1 error | Test every possible code path |
| Name tests by what they validate | Name tests by method name |
| Delete tests that don't catch real bugs | Keep tests "just because" |

## Hard Constraints

| Constraint | Limit |
|---|---|
| Tests per feature | 3-5 MAX |
| Lines per test file | 150 MAX |
| Happy path tests | 1 |
| Edge case tests | 1-2 |
| Error case tests | 1 |
| Setup/helper code | Minimal — inline preferred |

## Test Structure

```
describe('[Feature/Module Name]', () => {
  // Happy path — the main use case works
  test('creates user with valid data', () => { ... })

  // Edge case — boundary or unusual input
  test('handles empty name by using email prefix', () => { ... })

  // Edge case — another realistic scenario
  test('trims whitespace from all string fields', () => { ... })

  // Error case — what should fail, fails correctly
  test('rejects duplicate email with specific error', () => { ... })
})
```

## Process

### Step 1: Read the Code
- Open the file/module being tested
- Understand its public API and responsibilities
- Identify what requirements it fulfills

### Step 2: Identify What to Test
Ask: "What could break that would matter?"
- The main success scenario (happy path)
- Boundary conditions (empty input, max values, special characters)
- Error conditions (invalid input, missing dependencies, network failures)
- Any business rules or validation logic

### Step 3: Write Minimal Tests
- Start with the happy path
- Add 1-2 edge cases that cover realistic scenarios
- Add 1 error case
- Use descriptive test names: `test('rejects order when inventory is zero')`
- Keep assertions focused — 1-3 assertions per test

### Step 4: Run Tests
- Execute the test file
- All tests must pass
- Fix any failures — if a test is hard to make pass, question whether it's testing the right thing

### Step 5: Stop
- Do NOT add more tests "for coverage"
- Do NOT refactor working tests
- Do NOT add tests for trivial code (getters, constructors, simple pass-through)

## What NOT to Test

- **Trivial code**: Getters, setters, constructors with no logic
- **Framework behavior**: Don't test that Express routes or React renders — that's the framework's job
- **Implementation mirrors**: If your test is just the code copy-pasted with assertEquals, delete it
- **Every permutation**: 3 edge cases, not 30
- **Third-party libraries**: Test YOUR code's integration with them, not their internals

## Output Format

After generating tests, report:

```markdown
## Test Generation Report

- **Target**: `src/services/user-service.ts`
- **Test file**: `src/services/__tests__/user-service.test.ts`
- **Tests written**: 4
- **Lines**: 87

### Tests
| # | Test | Validates |
|---|---|---|
| 1 | creates user with valid data | Happy path — basic user creation flow |
| 2 | handles missing optional fields | Edge — graceful defaults |
| 3 | normalizes email to lowercase | Edge — data consistency |
| 4 | rejects duplicate email | Error — uniqueness constraint |

### Not Tested (and why)
- `getUser()` — trivial database lookup, no logic
- `deleteUser()` — simple pass-through to ORM
```

## Choosing a Test Framework

Use whatever the project already uses. If nothing exists:
- **JavaScript/TypeScript**: Vitest or Jest
- **Python**: pytest
- **Go**: built-in testing package
- **Rust**: built-in #[test]

Don't add a new test framework if one already exists in `package.json`, `pyproject.toml`, etc.
