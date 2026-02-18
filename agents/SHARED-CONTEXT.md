# SHARED-CONTEXT.md — AfrexAI Agent Reference

Read this first. This is real data, not templates.

## PostgreSQL CRM Access
```bash
export PATH=/usr/local/opt/postgresql@17/bin:$PATH
psql -U openclaw -d afrexai_crm
```

### Schema (9 tables)
| Table | Rows | Key Columns |
|-------|------|-------------|
| companies | 367 | id, name, website, industry, employees, revenue_estimate, city, state, country, icp_score, source |
| contacts | 200 | id, company_id, first_name, last_name, email, email_verified, title, role_tier, last_contacted |
| deals | 0 | id, company_id, contact_id, name, stage, value, currency, close_date, probability, owner_agent |
| activities | 98 | id, deal_id, contact_id, company_id, agent, agent_email, type, subject, body, direction, status |
| email_threads | 0 | — |
| linkedin_posts | 0 | — |
| tags | 13 | — |
| company_tags | 0 | — |
| timeline_events | 0 | — |

### CRM Data Breakdown
**By Industry:**
- Real Estate: 100 | Fintech: 21 | Regional Bank: 20 | Insurance Agency: 20
- Wealth Management: 20 | Accounting: 20 | Healthcare (Dental): 10
- Agencies (B2B/Digital/eCommerce/PR): 14 | Recruitment: 4 | Legal: 2

**By State (US):**
- TX: 57 | FL: 56 | CA: 18 | NY: 9 | MI/MA/UT: 5 each

**NOTE:** deals table is EMPTY. Every agent should log deals when they find real opportunities.

### Useful Queries
```sql
-- Find companies by industry
SELECT name, city, state, icp_score FROM companies WHERE industry ILIKE '%real estate%' ORDER BY icp_score DESC LIMIT 20;

-- Find contacts with emails
SELECT c.first_name, c.last_name, c.email, c.title, co.name FROM contacts c JOIN companies co ON c.company_id = co.id WHERE c.email IS NOT NULL;

-- Log a new activity
INSERT INTO activities (company_id, contact_id, agent, agent_email, type, subject, body, direction, status, created_at) VALUES (1, 1, 'Hunter', 'dkessler@afrexai.com', 'email', 'Subject', 'Body', 'outbound', 'sent', NOW());

-- Create a deal
INSERT INTO deals (company_id, contact_id, name, stage, value, currency, close_date, probability, owner_agent, created_at, updated_at) VALUES (1, 1, 'Deal Name', 'prospecting', 120000, 'USD', '2026-03-15', 10, 'Hunter', NOW(), NOW());
```

## Stripe (Real Revenue)
- **All-time gross**: $84,621.66 | **Paid to bank**: $111,227.91 | **ARR**: $166,803
- Access: `source /Users/openclaw/.openclaw/vault/op-service-account.env && SK=$(op read "op://AfrexAI/cfpvk6eywbaoopfd5gqnbaglgu/secret key") && curl -s -u "$SK:"`

### Paying Customers
| Customer | Monthly | Status |
|----------|---------|--------|
| Albert Thombs (VADIS) | $12,143 | Recurring, 1 pending |
| Jacob Johnson (PremGrp) | Variable | $10K pending |
| Brett McCroary (BuildGrid) | $120/mo sub | 2 invoices overdue (34d, 65d) |
| Lisa Kingham (Hansford Road) | $120/mo sub | Active |
| VADA (Albert & Shawnda) | — | $1,250 overdue 259 days |

## Gmail (LIVE)
- Send from: ksmolichki@afrexai.com (SMTP with app password in 1Password)
- Agent aliases: nokafor@, mchen@, pnair@, jadeyemi@, sreyes@, abrooks@, dkessler@, emensah@, zosei@ (all @afrexai.com)
- App password: `op read "op://AfrexAI/Gmail/app_password"` (via service account env)

## Prospect Files
- `/Users/openclaw/.openclaw/workspace-main/prospects/real-estate-brokerages-100.csv`
- `/Users/openclaw/.openclaw/workspace-main/prospects/outreach-tracker.csv`

## Key Links
- Website: https://afrexai-cto.github.io/
- Calendly: https://calendly.com/cbeckford-afrexai/30min
- Storefront: https://afrexai-cto.github.io/context-packs/
- Calculator: https://afrexai-cto.github.io/ai-revenue-calculator/

## DO NOT
- Use QuickBooks — it's not connected. Use PostgreSQL + local CSVs.
- Store secrets in files — use 1Password at runtime only.
- Send external emails without real context. Personalize everything.
- Write reports nobody reads. ACT — draft emails, update CRM, create deals.
