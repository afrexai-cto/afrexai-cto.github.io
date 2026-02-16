# Testing Request Guide

How to create manual QA testing request documents that anyone can follow.

## Core Philosophy

**The tester is NOT a developer.** They have never seen the codebase. They don't know the architecture. They don't know what "the service" is or where to find it.

Every instruction must be **recipe-like**: exact steps, exact values, exact expected results. If you say "test the login flow," you've failed. If you say "type `admin@test.com` in the email field and click Login," you're getting closer.

## Specificity Examples

### ❌ BAD
- "Test that validation works"
- "Check the error handling"
- "Verify the API responds correctly"
- "Make sure the form submits"

### ✅ GOOD
- "Type `abc` in the Price field and press Tab. Expected: Red border appears with message 'Price must be a number'"
- "Click Submit with all fields empty. Expected: Three error messages appear: 'Name required', 'Email required', 'Password required'"
- "Send GET to `http://localhost:3000/api/users/999999`. Expected: 404 response with body `{\"error\": \"User not found\"}`"
- "Type `test@example.com` in Email, `Short1!` in Password, click Register. Expected: Success toast, redirect to `/dashboard`"

## Document Structure

### 1. Header

```markdown
# Testing Request: [Feature Name]

**Date**: YYYY-MM-DD
**Branch**: feature/xyz
**PR**: #123 (if applicable)
**Developer**: @name
**Priority**: High | Medium | Low
**Estimated time**: X minutes
```

### 2. Pre-Test Verification

What must be true BEFORE testing begins:

```markdown
## Pre-Test Setup

### Environment
1. Pull branch: `git checkout feature/xyz && git pull`
2. Install dependencies: `npm install`
3. Run migrations: `npm run db:migrate`
4. Start the server: `npm run dev`
5. Verify server is running: Open `http://localhost:3000` — you should see the login page

### Required State
- Database seeded with test data: `npm run db:seed`
- Test user exists: `testuser@example.com` / `Password123!`
- Feature flag `NEW_CHECKOUT` is ON (set in `.env`: `NEW_CHECKOUT=true`)
```

### 3. Starting State & Auth

Always specify exactly how to reach the starting point:

```markdown
## Starting State

1. Open `http://localhost:3000/login`
2. Enter email: `testuser@example.com`
3. Enter password: `Password123!`
4. Click "Sign In"
5. Expected: Redirected to `/dashboard`, welcome message shows "Hello, Test User"
6. Navigate to `http://localhost:3000/settings` — this is where testing begins
```

### 4. Test Cases

Each test case must be atomic and self-contained:

```markdown
## Test Cases

### TC-01: [Descriptive name of what's being tested]

**Precondition**: [Starting state, e.g., "On the Settings page, logged in as testuser"]

**Steps**:
1. Click the "Edit Profile" button (blue button, top right of profile card)
2. Clear the "Display Name" field
3. Type: `New Display Name`
4. Click "Save Changes" (green button at bottom of form)

**Expected Result**:
- Green toast notification: "Profile updated successfully"
- Display name on profile card now shows "New Display Name"
- Page does NOT reload (stays on settings)

**Cleanup**: None needed — next test will overwrite this value

---

### TC-02: Edit profile with empty name (error case)

**Precondition**: On the Settings page, logged in as testuser

**Steps**:
1. Click "Edit Profile"
2. Clear the "Display Name" field completely (select all + delete)
3. Click "Save Changes"

**Expected Result**:
- Red error message below the field: "Display name is required"
- Save button remains enabled
- No toast notification appears
- No network request sent (check browser console Network tab)
```

### 5. Browser Console Monitoring

```markdown
## Browser Console Monitoring

Keep the browser DevTools Console tab open during ALL tests.

**Report any**:
- 🔴 Red errors (JavaScript exceptions)
- 🟡 Yellow warnings (deprecation notices, failed requests)
- 🔴 Failed network requests (4xx or 5xx in Network tab)

**Ignore**:
- React DevTools messages
- Favicon 404s
- Source map warnings
```

### 6. Terminal Monitoring

```markdown
## Terminal Monitoring

Keep the terminal running `npm run dev` visible.

**Report any**:
- Stack traces or error messages
- Unhandled promise rejections
- Database connection errors
- Any output that appears RED

**Note the timestamp** of any error relative to which test case triggered it.
```

### 7. Report Template

```markdown
## Test Report Template

Copy and fill out after testing:

**Tester**: [Your name]
**Date**: YYYY-MM-DD
**Branch**: [branch name]
**Environment**: [OS, Browser, Browser version]

### Results

| TC | Name | Status | Notes |
|---|---|---|---|
| TC-01 | Edit profile with valid name | ✅ PASS / ❌ FAIL / ⚠️ PARTIAL | |
| TC-02 | Edit profile with empty name | ✅ PASS / ❌ FAIL / ⚠️ PARTIAL | |

### Bugs Found
For each bug:
- **TC**: Which test case
- **Step**: Which step it failed on
- **Expected**: What should have happened
- **Actual**: What actually happened
- **Screenshot**: [attach]
- **Console errors**: [paste any]
- **Severity**: Blocker / Major / Minor / Cosmetic

### Console/Terminal Errors
[Paste any errors observed]

### General Notes
[Anything else — UX observations, performance issues, suggestions]
```

### 8. Blocker Guidelines

```markdown
## Blocker Guidelines

**STOP testing and report immediately if**:
- Application crashes or becomes unresponsive
- Data is lost or corrupted
- You cannot log in or reach the test area
- Server stops running
- Database errors appear in terminal

**Continue testing and note the issue if**:
- A single test case fails but others work
- UI looks wrong but functions correctly
- Performance is slow but functional
- Minor text/formatting issues
```

## Writing Tips

1. **Number every step** — never use paragraphs for instructions
2. **Specify exact values** — never say "enter some text"
3. **Describe what you see** — "blue button labeled 'Save'" not just "the save button"
4. **State expected results for every test** — never assume the tester knows what "correct" looks like
5. **Include cleanup steps** if a test modifies state that affects later tests
6. **Group related tests** but make each independent when possible
7. **Estimate time** — helps testers plan their work
8. **Include screenshots** of the UI if the interface is complex
