# VALIDATION — Health Tracker

**Date:** 2026-02-19  
**Status:** ✅ All tests passed

## Test Results

### 1. Logging (log.js)
All four entry types work correctly:
```
✅ Logged food: "chicken salad" [id:1]
✅ Logged food: "pizza" [id:2]
✅ Logged drink: "coffee" [id:3]
✅ Logged drink: "water" [id:4]
✅ Logged symptom: "headache" (severity 4/5) [id:5]
✅ Logged symptom: "bloating" (severity 2/5) [id:6]
✅ Logged note: "slept poorly" [id:7]
```

### 2. Weekly Analysis (analyze.js weekly)
```
=== Weekly Summary ===

📅 2026-02-19
  🍽️  chicken salad, pizza
  🥤 coffee, water
  🩺 headache (4/5), bloating (2/5)
  📝 slept poorly

📊 Totals: 2 foods, 2 drinks, 2 symptoms
   Avg symptom severity: 3.0/5
```

### 3. Correlations (analyze.js correlations)
```
=== Food/Drink ↔ Symptom Correlations ===

  🍽️ chicken salad → 🩺 headache  [████] avg:4.0/5 (1x)
  🍽️ pizza → 🩺 headache  [████] avg:4.0/5 (1x)
  🥤 coffee → 🩺 headache  [████] avg:4.0/5 (1x)

⚠️  Potential Triggers (avg severity ≥ 3):
   chicken salad → headache (avg 4.0/5)
   pizza → headache (avg 4.0/5)
   coffee → headache (avg 4.0/5)
```

### 4. Markdown Journal (data/2026-02-19.md)
✅ File created with correct formatting, emoji icons, timestamps, and severity annotations.

### 5. SQLite Database (health.db)
✅ Schema applied, 7 rows inserted, queries return correct results.

### 6. Reminders (reminders.js)
✅ Schedule displays correctly. `check` mode exits 0 when reminder is due, 1 otherwise.

## Architecture
- **db.js** — Shared database helper using `node:sqlite` (Node.js built-in, zero dependencies)
- **log.js** — CLI entry logger → writes to both SQLite and markdown
- **analyze.js** — Weekly summary and food↔symptom correlation analysis
- **reminders.js** — 3x daily reminder schedule (8am, 1pm, 7pm)
- **schema.sql** — Single `entries` table with type, description, severity, timestamp, date
- **data/*.md** — Human-readable daily journals
