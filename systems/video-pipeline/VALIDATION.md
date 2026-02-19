# VALIDATION.md - Video Pipeline Test Results

**Date:** 2026-02-19T03:08:24.511Z
**Tests:** 22/22 passed

## Results

| # | Test | Status | Detail |
|---|------|--------|--------|
| 1 | Schema creation | ✅ PASS | Tables: pitches, sqlite_sequence, pitch_embeddings, feedback_log, knowledge_base |
| 2 | Cosine sim (identical) | ✅ PASS | - |
| 3 | Cosine sim (orthogonal) | ✅ PASS | - |
| 4 | Embedding buffer round-trip | ✅ PASS | - |
| 5 | Pitch insert | ✅ PASS | id=1 |
| 6 | Pitch read | ✅ PASS | - |
| 7 | Pitch default status | ✅ PASS | - |
| 8 | Feedback - status update | ✅ PASS | accepted=2, rejected=1 |
| 9 | Feedback - accept rate | ✅ PASS | rate=66.7% |
| 10 | Feedback - log entries | ✅ PASS | entries=3 |
| 11 | Pattern analysis | ✅ PASS | - |
| 12 | Pattern insights | ✅ PASS | insights: coding |
| 13 | Dedup - similar vectors | ✅ PASS | sim=1.0000 |
| 14 | Dedup - different vectors | ✅ PASS | sim=0.7568 |
| 15 | Angle extraction | ✅ PASS | angles: Tutorial/How-to, Comparison, Trend/Future outlook, Beginner guide |
| 16 | Angle - tutorial | ✅ PASS | - |
| 17 | Angle - comparison | ✅ PASS | - |
| 18 | Config - slack | ✅ PASS | - |
| 19 | Config - asana | ✅ PASS | - |
| 20 | Config - twitter | ✅ PASS | - |
| 21 | Config - threshold | ✅ PASS | - |
| 22 | KB insert and read | ✅ PASS | - |

## Test Coverage

- **Schema:** Table creation and indexes
- **Dedup:** Cosine similarity, embedding buffer round-trip, vector comparison
- **Feedback:** Status updates, logging, accept rate, pattern analysis
- **Twitter:** Angle extraction from tweet text
- **Knowledge Base:** CRUD with embeddings
- **Config:** All sections validated
- **Pitch CRUD:** Insert, read, default status

## Architecture

```
Slack mention → slack-listener.js → pipeline.js
                                       ├── dedup.js (semantic similarity)
                                       ├── twitter-research.js (X/Twitter API v2)
                                       ├── kb-search.js (knowledge base)
                                       ├── asana-client.js (POST /tasks)
                                       └── feedback.js (status tracking + learning)
```

## API Endpoints Used

### Slack Web API
- `conversations.replies` — fetch full thread context
- `chat.postMessage` — reply in thread with results
- Socket Mode — real-time event listening for app_mention

### Asana REST API v1
- `POST /tasks` — create video idea card with html_notes
- `GET /tasks/{gid}` — read task details
- `PUT /tasks/{gid}` — update task status

### Twitter API v2
- `GET /tweets/search/recent` — search tweets about topic
- Tweet fields: public_metrics, context_annotations
- Expansions: author_id with user.fields

### OpenAI API
- `POST /embeddings` — text-embedding-3-small for semantic search
