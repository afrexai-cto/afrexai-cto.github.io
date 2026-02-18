# Debug Guide — First-Principles Debugging

Use this when normal debugging fails. When you've been stuck for more than 10 minutes. When "just try things" isn't working.

## The Method

### Step 1: STOP AND ASSESS

Stop changing code. Categorize what you know:

| Category | Question |
|---|---|
| **Known** | What do you know FOR CERTAIN? (verified, not assumed) |
| **Assumed** | What are you ASSUMING is true? (likely but unverified) |
| **Unknown** | What DON'T you know? |

Write these down. Most bugs hide in the "Assumed" column — things you think are true but haven't verified.

### Step 2: Verify Assumptions

Take every item in "Assumed" and verify it:

- Is the function actually being called? (add a log)
- Is the input what you expect? (log the actual value)
- Is the config what you expect? (print it)
- Is the dependency the version you think? (check)
- Is the database state what you expect? (query it)

**The bug is almost always a false assumption.**

### Step 3: Trace the Dependency Chain

Map the full path from input to failure:

```
User Input → API Handler → Service → Repository → Database
                                ↑
                          Bug is HERE (maybe)
```

For each link in the chain:
1. What is the expected input/output?
2. What is the ACTUAL input/output?
3. Where does expected diverge from actual?

The divergence point is where the bug lives.

### Step 4: Instrumentation Strategy

Add targeted logging at three points:

#### Entry Logging
```typescript
function processOrder(input: OrderInput) {
  console.log('[processOrder] ENTRY', { input });
  // ...
}
```

#### State Verification
```typescript
const user = await findUser(id);
console.log('[processOrder] user lookup', { id, found: !!user, role: user?.role });
```

#### Exit/Error Context
```typescript
try {
  return await save(order);
} catch (error) {
  console.error('[processOrder] FAILED', { orderId: order.id, error: error.message, stack: error.stack });
  throw error;
}
```

### Step 5: Hypothesis-Driven Testing

1. Form ONE specific hypothesis: "The bug is caused by X"
2. Design a test that PROVES or DISPROVES this hypothesis
3. Run the test
4. If disproved → eliminate and form next hypothesis
5. If proved → fix with confidence

**Never change code to "see if it helps" without a hypothesis.**

### Step 6: Systematic Elimination

If you can't form a hypothesis, bisect:

- **Binary search in time**: `git bisect` — when did it start failing?
- **Binary search in code**: Comment out half the logic. Does it still fail?
- **Binary search in data**: Does it fail with minimal input? Add complexity until it breaks.
- **Minimal reproduction**: Strip everything until you have the smallest case that fails

## Quick Reference

```
STUCK ON A BUG?
│
├─ Step 1: STOP. List Known / Assumed / Unknown
├─ Step 2: Verify every assumption with actual evidence
├─ Step 3: Trace input → output, find divergence point
├─ Step 4: Add entry/state/exit logging at the divergence
├─ Step 5: Form hypothesis → test → prove or eliminate
└─ Step 6: If lost, bisect (time, code, or data)
```

## Anti-Patterns

| Anti-Pattern | Why It Fails | Instead |
|---|---|---|
| Random changes | No signal, just noise | Form a hypothesis first |
| Reading code and guessing | Your mental model may be wrong | Add logs, get real data |
| Fixing symptoms | Root cause still exists | Find the actual cause |
| Assuming your code is right | Ego blocks debugging | Verify, don't assume |
| Changing multiple things at once | Can't tell what fixed it | One change per test |
| Searching Stack Overflow first | Your bug is specific to your code | Understand YOUR system first |
| "It works on my machine" | Environment difference IS the bug | Compare environments explicitly |

## Common Bug Categories

| Category | First Check |
|---|---|
| "It's not called" | Log at entry point — is it actually reached? |
| "Wrong value" | Log the actual value at each transform step |
| "Works sometimes" | Race condition — log timestamps and order of operations |
| "Works locally, fails in prod" | Environment diff — config, versions, permissions |
| "Worked yesterday" | `git log` — what changed? `git bisect` to find it |
| "Error makes no sense" | Read the FULL error including stack trace and cause chain |
