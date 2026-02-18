# B2B Lead Scoring Model
## AfrexAI Marketing Analyst — Prioritizing Leads for £1M ARR

### Purpose

Not all leads are equal. With limited sales capacity (founder + 1-2 people),
AfrexAI must ruthlessly prioritize. Lead scoring ensures the highest-value
prospects get attention first, directly impacting close rates and ARR growth.

### Scoring Dimensions

Two independent scores, combined for final priority:
1. **Fit Score** (0-50): How well does this lead match our ICP?
2. **Engagement Score** (0-50): How interested/active is this lead?
3. **Total Score** (0-100): Fit + Engagement = Priority

### Fit Scoring Criteria

| Criterion                  | Values & Points                                          |
|---------------------------|----------------------------------------------------------|
| Company Revenue           | £50M+: 10 | £10-50M: 8 | £5-10M: 6 | £2-5M: 3 | <£2M: 0 |
| Employee Count            | 200-500: 10 | 100-200: 8 | 50-100: 6 | <50: 2          |
| Industry                  | Pro services: 10 | Finance: 10 | E-com: 8 | Health: 7 | Other: 3 |
| Job Title                 | C-suite: 10 | VP/Director: 8 | Manager: 5 | IC: 1     |
| Location                  | London: 5 | UK major city: 4 | UK other: 3 | Non-UK: 0 |
| Technology maturity       | Cloud + data: 5 | Cloud only: 3 | Legacy: 1           |

**Max Fit Score: 50**

### Engagement Scoring Criteria

| Action                              | Points | Decay         |
|-------------------------------------|--------|---------------|
| Requested demo/call                 | 20     | None          |
| Downloaded gated content            | 10     | -2/week       |
| Attended webinar                    | 10     | -2/week       |
| Visited pricing page                | 8      | -3/week       |
| Visited 3+ pages in one session     | 5      | -2/week       |
| Opened 3+ emails                    | 5      | -1/week       |
| Clicked email CTA                   | 7      | -2/week       |
| Replied to outbound email           | 15     | -3/week       |
| LinkedIn: accepted connection       | 3      | None          |
| LinkedIn: engaged with post 2x+    | 5      | -1/week       |
| LinkedIn: sent DM                   | 12     | -2/week       |
| Returned to site after 7+ days      | 5      | -2/week       |
| Visited case study page             | 6      | -2/week       |
| Unsubscribed from email             | -20    | None          |
| Marked email as spam                | -50    | None          |

**Max Engagement Score: 50 (capped)**

### Score Decay

Engagement scores decay over time because interest fades:
- Decay applied weekly on Sunday night
- Once engagement score hits 0, lead moves to nurture
- Any new engagement resets decay timer for that action
- Fit score never decays (company characteristics don't change)

### Lead Classification

| Total Score | Classification | Response SLA | Action                           |
|-------------|---------------|--------------|----------------------------------|
| 80-100      | Hot Lead      | 1 hour       | Founder calls personally         |
| 60-79       | Warm Lead     | 4 hours      | Book discovery call              |
| 40-59       | MQL           | 24 hours     | Add to nurture + outbound        |
| 20-39       | Cold Lead     | 48 hours     | Automated nurture only           |
| 0-19        | Not qualified | None         | Stay in database, no action      |

### MQL → SQL Conversion Criteria

An MQL becomes an SQL when ALL of these are confirmed:
1. **Budget**: Can invest £15K+ in AI project
2. **Authority**: Person has budget authority or direct line to buyer
3. **Need**: Specific problem identified (not "exploring AI generally")
4. **Timeline**: Looking to start within 3 months

### Lead Score Automation

**CRM Setup (HubSpot recommended):**
- Fit scoring: Populated from enrichment data (Clearbit, Apollo)
- Engagement scoring: Tracked via website analytics + email platform
- Score recalculated: Real-time for engagement, daily for fit
- Alerts: Slack notification when any lead crosses 60+ threshold

### Scoring Model Calibration

**Monthly review:**
- Compare predicted score vs actual outcome (did high-score leads convert?)
- Adjust point values based on actual conversion correlation
- Check for scoring inflation (are too many leads scoring high?)
- Target distribution: 5% Hot, 15% Warm, 30% MQL, 50% Cold/Unqualified

**Quarterly overhaul:**
- Full regression analysis: which scoring criteria actually predict conversion?
- Add/remove criteria based on data
- Adjust thresholds based on sales capacity

### Integration with Agent Swarm

- **Marketing Analyst**: Maintains scoring model, monitors distribution
- **Outbound Agent**: Receives prioritized lead lists daily, sorted by score
- **Content Writer**: Gets insights on which content drives highest-scoring leads
- **COO**: Reviews conversion rates by score tier weekly

### Key Metrics to Track

- MQL to SQL conversion rate by score tier (target: 15-25% overall)
- Average time from MQL to SQL (target: <14 days for score 60+)
- Lead score accuracy: % of 80+ scores that convert to client
- Score distribution: healthy funnel = pyramid shape
- False positives: high-score leads that never convert (investigate why)

### Example Lead Score Calculation

```
Company: UK law firm, 150 employees, £20M revenue
Contact: Head of Operations
→ Fit: Revenue(8) + Employees(8) + Industry(10) + Title(8) + London(5) + Cloud(3) = 42

Engagement: Downloaded whitepaper(10) + Visited pricing(8) + Opened 4 emails(5) = 23

Total: 42 + 23 = 65 → WARM LEAD → Book discovery call within 4 hours
```

### Data Enrichment Sources

- **Clearbit / Apollo**: Company firmographics, tech stack
- **LinkedIn Sales Navigator**: Job titles, company updates, connections
- **Companies House**: UK company financials (revenue, employee count)
- **BuiltWith**: Technology stack detection
- **Google Analytics**: On-site behaviour tracking
