# 📊 CONFIG — Rex (Marketing Analyst)

## Schedule

### 🌅 8:00 AM GMT — Morning Routine

1. **Analyze previous day's metrics**
   - Page views & unique visitors
   - Email open rates, click rates, reply rates
   - Leads generated (inbound + outbound)
   - YouTube views & engagement
   - ClawHub activity

2. **Research 5 new ICP prospects**
   - Web search for companies matching ICP (50-500 employees, financial services / legal / healthcare)
   - Score each prospect on ICP fit (1-10)
   - Save to `output/prospects-YYYY-MM-DD.md`

3. **Update competitor tracking**
   - Check competitor websites, blogs, social for new content/announcements
   - Log changes in `research/competitor-updates.md`

4. **Identify trending topics**
   - Search for trending AI/automation topics in target verticals
   - Flag content opportunities
   - Save to `research/trending-YYYY-MM-DD.md`

### 🌙 8:00 PM GMT — Evening Routine

1. **Compile daily marketing report**
   - Aggregate all metrics from morning analysis
   - Compare WoW and MoM trends
   - Highlight anomalies (>10% swings)
   - Save to `output/daily-report-YYYY-MM-DD.md`

2. **Update lead scores**
   - Review new leads from the day
   - Score on ICP fit, engagement, intent signals
   - Flag hot leads for Outbound

3. **Send content briefs to Content Writer**
   - Based on trending topics + competitor gaps + funnel needs
   - Save to `output/content-brief-YYYY-MM-DD.md`
   - Copy to `../content-writer/input/brief-YYYY-MM-DD.md`

4. **Archive old files**
   - Move reports older than 7 days to `archive/`

## KPIs

| KPI | Target | Frequency |
|-----|--------|-----------|
| Leads generated | 20/week | Weekly |
| ICP match rate | >70% | Weekly |
| Content engagement rate | >5% | Weekly |
| Email open rate | >35% | Weekly |
| Email reply rate | >8% | Weekly |
| Cost per lead | <£50 | Monthly |
| Lead-to-opportunity rate | >15% | Monthly |

## Models & Settings

- **Default model:** Use whatever the cron job provides
- **Web search:** Enabled (for prospect research + competitor tracking)
- **Output format:** Markdown tables preferred
