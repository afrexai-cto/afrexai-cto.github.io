# Earnings Reports System — Validation Results

Generated: 2026-02-19T03:06:11.545Z

## Test 1: Watchlist CRUD

✅ Watchlist has 3 tickers
✅ First ticker is AAPL
✅ Watchlist has 2 after removal

## Test 2: Earnings Calendar & Job Scheduling

✅ 2 pending jobs created

## Test 3: Narrative Report Generation

✅ AAPL verdict is beat
✅ Narrative mentions beat
✅ Narrative includes price change

AAPL Sample Report:
**AAPL beat expectations.** The company reported EPS of $2.42 versus the Street's estimate of $2.35 — a solid beat that shows the business is executing.

🚀 **Market reaction:** The stock is up 3.2% at $235.81 (prev close $228.50).

**Key takeaways:**
1. iPhone revenue surged 8% YoY, driven by strong Pro model demand
2. Services revenue hit all-time high at $26.3B, growing 14%
3. Guidance hints at AI-powered features boosting upgrade cycle in Q2
✅ TSLA verdict is miss
✅ Narrative mentions miss

TSLA Sample Report:
**TSLA missed expectations.** EPS came in at $0.45 against an estimate of $0.58 — a disappointing miss that raises questions about near-term momentum.

📉 **Market reaction:** The stock is down 8.5% at $224.18 (prev close $245.00).

**Key takeaways:**
1. Automotive margins fell to 16.3%, lowest in two years as price cuts bite
2. Cybertruck production ramp slower than expected, contributing losses
3. Energy storage revenue doubled but couldn't offset vehicle weakness
✅ GOOG verdict is met

GOOG Sample Report:
**GOOG met expectations.** EPS of $1.89 was roughly in line with the $1.88 estimate — no fireworks, but no alarm bells either.

➡️ **Market reaction:** The stock is up 0.3% at $178.73 (prev close $178.20).

**Key takeaways:**
1. Search revenue grew 12%, steady but unremarkable
2. Cloud division finally profitable, margin improved to 9%
3. YouTube ad revenue slightly below expectations amid TikTok competition

## Test 4: Job Lifecycle

✅ 1 completed job
✅ 1 job remaining after auto-delete
✅ Remaining job is MSFT

## Test 5: Past Reports Storage

✅ Past report stored
✅ Past report verdict correct

## All tests passed! ✅

