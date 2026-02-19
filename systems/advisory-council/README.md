# 🏛️ Business Advisory Council

8 specialist AI personas analyze your business **in parallel**, synthesize findings into a prioritized digest, and learn from your feedback.

## Personas

| # | Persona | Domain |
|---|---------|--------|
| 1 | **RevenueGuardian** | Revenue streams, pricing, monetization |
| 2 | **GrowthStrategist** | Growth opportunities, market expansion |
| 3 | **SkepticalOperator** | Operational risks, what could go wrong |
| 4 | **ContentAnalyst** | Content performance, engagement patterns |
| 5 | **CompetitiveIntel** | Competitor moves, market positioning |
| 6 | **CustomerAdvocate** | Customer health, churn risk, satisfaction |
| 7 | **TechArchitect** | Technical debt, infrastructure, scalability |
| 8 | **FinancialAnalyst** | Costs, margins, burn rate, unit economics |

## Architecture

```
data-collectors/  →  [8 personas in parallel]  →  synthesizer  →  numbered digest
                                                                      ↓
                                                              deep-dive / feedback
                                                                      ↓
                                                              preference learning (SQLite)
```

- **Data isolation**: Each persona only sees keys relevant to their domain
- **Parallel execution**: All 8 run via `Promise.all()` — not sequential
- **Deduplication**: Synthesizer removes redundant findings across personas
- **Priority ranking**: Critical → High → Medium → Low, then by confidence score

## Usage

```bash
# Run a full council session
node council.js "Q1 review"

# Deep dive on recommendation #3
node deep-dive.js 1 3    # session_id=1, recommendation #3

# Provide feedback
node feedback.js 1 1 approve "Address this week"
node feedback.js 1 5 reject "Already handled"
node feedback.js 1 8 defer "Revisit next quarter"
```

## Programmatic API

```js
import { runSession } from './council.js';
import { deepDive } from './deep-dive.js';
import { recordFeedback } from './feedback.js';

const { sessionId, digest, recommendations } = await runSession('Weekly check');
console.log(digest);

// Deep dive
console.log(deepDive(sessionId, 3));

// Feedback
recordFeedback(sessionId, 1, 'approve', 'Top priority');
```

## Data Collectors

Stubs in `data-collectors/index.js`. Replace with real integrations:
- Stripe/billing → revenue, pricing, subscriptions
- Mixpanel/Amplitude → users, funnel, engagement
- PagerDuty → incidents
- Google Analytics → content, SEO
- Support platform → tickets, CSAT
- Accounting → finances, costs

## Database

SQLite via Node.js built-in `node:sqlite`. Schema in `schema.sql`.

Tables: `sessions`, `recommendations`, `feedback`, `preference_signals`, `deep_dives`

## Feedback Loop

Approve/reject actions update `preference_signals`, which bias future confidence scores per persona and category. Over time, the council learns which types of recommendations you value.
