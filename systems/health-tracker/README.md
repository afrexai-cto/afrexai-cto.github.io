# 🍽️ Health Tracker — Food Journal & Symptom Correlation

Track food, drinks, symptoms, and notes. Correlate what you eat with how you feel.

## Quick Start

```bash
npm install
```

## Logging

```bash
node log.js food "chicken salad"
node log.js drink "coffee"
node log.js symptom "headache" 3        # severity 1-5
node log.js note "slept poorly"
```

## Analysis

```bash
node analyze.js weekly          # 7-day summary
node analyze.js correlations    # food-symptom correlations
```

## Reminders

3x daily schedule: **8am**, **1pm**, **7pm**

```bash
node reminders.js               # check current reminder
```

## Storage

- **Markdown journal**: `journal/YYYY-MM-DD.md` — human-readable daily logs
- **SQLite database**: `health.db` — structured queries and correlation analysis

## Entry Types

| Type | Emoji | Severity | Example |
|------|-------|----------|---------|
| food | 🍽️ | — | `node log.js food "pasta with tomato sauce"` |
| drink | 🥤 | — | `node log.js drink "green tea"` |
| symptom | 🤒 | 1-5 | `node log.js symptom "bloating" 4` |
| note | 📝 | — | `node log.js note "stressed at work"` |
