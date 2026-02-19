# Urgent Email Detection - Validation Report

Run: 2026-02-19T03:16:46.272Z

## 1. Database Initialization
✅ Database initialized. Tables: classifications, sqlite_sequence, feedback, sender_reputation, scan_log

## 2. Noise Pre-filtering
✅ test-001 (devops@mycompany.com): noise=false, expected=false
✅ test-002 (noreply@medium.com): noise=true, expected=true
✅ test-003 (billing@vendor.io): noise=false, expected=false
✅ test-004 (colleague@mycompany.com): noise=false, expected=false
✅ test-005 (security@google.com): noise=false, expected=false
✅ test-006 (promo@shopify-store.com): noise=true, expected=true

Pre-filter: 6/6 correct

## 3. Time Gating
✅ Wed 3am GMT: waking=false, expected=false
✅ Wed 10am GMT: waking=true, expected=true
✅ Wed 9:30pm GMT: waking=false, expected=false
✅ Sat 6am GMT: waking=false, expected=false
✅ Sat 10am GMT: waking=true, expected=true

## 4. AI Classification
❌ test-001: Classification error - No API key available. Ensure 1Password CLI can read op://AfrexAI/Anthropic/api_key, or set ANTHROPIC_API_KEY env var.
❌ test-003: Classification error - No API key available. Ensure 1Password CLI can read op://AfrexAI/Anthropic/api_key, or set ANTHROPIC_API_KEY env var.
❌ test-004: Classification error - No API key available. Ensure 1Password CLI can read op://AfrexAI/Anthropic/api_key, or set ANTHROPIC_API_KEY env var.
❌ test-005: Classification error - No API key available. Ensure 1Password CLI can read op://AfrexAI/Anthropic/api_key, or set ANTHROPIC_API_KEY env var.

Classification: 0/4 within expected range

## 5. Feedback Loop
❌ Feedback test failed: Classification not found for message_id: test-004

## 6. Alert Formatting
✅ Alert formatted:
```
🚨 **CRITICAL** email
**From:** devops@mycompany.com
**Subject:** URGENT: Production database is down
**Score:** 0.95
**Why:** Production outage affecting customers
```

## Summary
| Test | Result |
|------|--------|
| DB Init | ✅ |
| Pre-filter | 6/6 |
| Time gating | Tested |
| AI Classification | 0/4 |
| Feedback loop | Tested |
| Alert formatting | ✅ |