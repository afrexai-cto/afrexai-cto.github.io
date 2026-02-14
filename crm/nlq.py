#!/usr/bin/env python3
"""Natural Language Query interface for AfrexAI CRM.

Usage: python nlq.py "How many companies haven't been contacted?"
"""

import sys
import re
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

DB = dict(host="localhost", dbname="afrexai_crm", user="openclaw")

def connect():
    return psycopg2.connect(**DB)

# ---------- helpers ----------

def time_window(text):
    """Extract a time window from text, return (interval_sql, params)."""
    t = text.lower()
    if "today" in t:
        return "created_at >= CURRENT_DATE", []
    if "yesterday" in t:
        return "created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE", []
    m = re.search(r'(?:last|past)\s+(\d+)\s+(day|week|month|year)s?', t)
    if m:
        n, unit = m.group(1), m.group(2)
        return f"created_at >= NOW() - INTERVAL '{n} {unit}s'", []
    if "last week" in t or "past week" in t:
        return "created_at >= NOW() - INTERVAL '7 days'", []
    if "last month" in t or "past month" in t:
        return "created_at >= NOW() - INTERVAL '1 month'", []
    if "this year" in t:
        return "created_at >= DATE_TRUNC('year', NOW())", []
    return None, []

def extract_limit(text):
    m = re.search(r'(?:top|first|limit)\s+(\d+)', text.lower())
    return int(m.group(1)) if m else None

def extract_agent(text):
    m = re.search(r'(?:agent|by|from|did)\s+(\w+)', text.lower())
    return m.group(1) if m else None

def extract_industry(text):
    m = re.search(r'(?:in|at|from)\s+([\w\s&]+?)(?:\s+(?:companies|company|industry|sector)|$)', text.lower())
    return m.group(1).strip() if m else None

def extract_stage(text):
    stages = ['prospect', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'demo', 'discovery']
    t = text.lower().replace(' ', '_')
    for s in stages:
        if s in t:
            return s.replace('_', ' ')
    return None

# ---------- patterns ----------

PATTERNS = []

def pattern(regex, priority=50):
    def decorator(fn):
        PATTERNS.append((priority, re.compile(regex, re.IGNORECASE), fn))
        return fn
    return decorator

# 1. Count companies not contacted
@pattern(r"how many companies?\s+(?:haven.t|have not|not)\s+been\s+contacted")
def companies_not_contacted(text, m):
    return ("SELECT COUNT(*) as count FROM companies WHERE last_activity IS NULL", [])

# 2. Count contacts / companies (generic)
@pattern(r"how many\s+(contacts?|companies|deals|activities)")
def count_entity(text, m):
    entity = m.group(1).rstrip('s') + 's'
    if entity == 'companys': entity = 'companies'
    if entity == 'activitys': entity = 'activities'
    tw, p = time_window(text)
    where = f"WHERE {tw}" if tw else ""
    return (f"SELECT COUNT(*) as count FROM {entity} {where}", p)

# 3. Contacts at <industry> companies
@pattern(r"(?:show|list|get|find)\s+(?:me\s+)?(?:all\s+)?contacts?\s+(?:at|from|in)\s+(.+?)\s+companies")
def contacts_at_industry(text, m):
    ind = m.group(1).strip()
    return ("SELECT c.first_name, c.last_name, c.email, c.title, co.name as company "
            "FROM contacts c JOIN companies co ON c.company_id=co.id "
            "WHERE co.industry ILIKE %s ORDER BY co.name", [f"%{ind}%"])

# 4. What did <agent> do/send
@pattern(r"what did\s+(\w+)\s+(?:do|send|log)")
def agent_activities(text, m):
    agent = m.group(1).lower()
    tw, p = time_window(text)
    where = f"AND a.{tw}" if tw else ""
    return (f"SELECT a.type, a.subject, a.direction, a.created_at, co.name as company "
            f"FROM activities a LEFT JOIN companies co ON a.company_id=co.id "
            f"WHERE a.agent ILIKE %s {where} ORDER BY a.created_at DESC LIMIT 20",
            [f"%{agent}%"] + p)

# 5. Top N biggest untouched prospects
@pattern(r"(?:top|biggest|largest)\s*(\d*)\s*(?:biggest|largest)?\s*untouched\s+(?:prospects?|companies)")
def top_untouched(text, m):
    n = int(m.group(1)) if m.group(1) else 10
    return ("SELECT c.name, c.industry, c.employees, c.icp_score "
            "FROM companies c WHERE c.last_activity IS NULL "
            "ORDER BY c.employees DESC NULLS LAST LIMIT %s", [n])

# 6. Show deals by stage
@pattern(r"(?:show|list|get)\s+(?:me\s+)?(?:all\s+)?deals?\s+(?:in|at)\s+(\w[\w\s]*?)(?:\s+stage)?$")
def deals_by_stage(text, m):
    stage = m.group(1).strip()
    return ("SELECT d.name, d.value, d.currency, co.name as company, d.close_date "
            "FROM deals d LEFT JOIN companies co ON d.company_id=co.id "
            "WHERE d.stage ILIKE %s ORDER BY d.value DESC NULLS LAST", [f"%{stage}%"])

# 7. Total deal value / pipeline value
@pattern(r"(?:total|sum)\s+(?:deal|pipeline)\s+value")
def total_deal_value(text, m):
    return ("SELECT SUM(value) as total_value, currency, COUNT(*) as deal_count "
            "FROM deals GROUP BY currency", [])

# 8. Recent activities
@pattern(r"(?:recent|latest|last)\s+(?:(\d+)\s+)?activities")
def recent_activities(text, m):
    n = int(m.group(1)) if m.group(1) else 10
    return ("SELECT a.type, a.subject, a.agent, a.direction, a.created_at, co.name as company "
            "FROM activities a LEFT JOIN companies co ON a.company_id=co.id "
            "ORDER BY a.created_at DESC LIMIT %s", [n])

# 9. Companies in <industry>
@pattern(r"(?:show|list|get|find)\s+(?:me\s+)?(?:all\s+)?companies?\s+(?:in|from)\s+(.+?)$")
def companies_in_industry(text, m):
    ind = m.group(1).strip()
    return ("SELECT name, website, employees, icp_score, city, country "
            "FROM companies WHERE industry ILIKE %s ORDER BY employees DESC NULLS LAST",
            [f"%{ind}%"])

# 10. Who is the contact / company info
@pattern(r"(?:who is|tell me about|info (?:on|about))\s+(.+)")
def lookup_entity(text, m):
    name = m.group(1).strip().rstrip('?')
    return ("SELECT c.first_name, c.last_name, c.email, c.title, c.phone, co.name as company "
            "FROM contacts c LEFT JOIN companies co ON c.company_id=co.id "
            "WHERE c.first_name || ' ' || c.last_name ILIKE %s "
            "UNION ALL "
            "SELECT name, industry, website, city, country, employees::text "
            "FROM companies WHERE name ILIKE %s LIMIT 10",
            [f"%{name}%", f"%{name}%"])

# 11. Stale / inactive companies (no activity in N days)
@pattern(r"(?:stale|inactive|dormant)\s+companies")
def stale_companies(text, m):
    return ("SELECT name, industry, last_activity, employees "
            "FROM companies WHERE last_activity < NOW() - INTERVAL '30 days' "
            "OR last_activity IS NULL ORDER BY last_activity NULLS FIRST LIMIT 20", [])

# 12. Email threads status
@pattern(r"(?:show|list|get)\s+(?:me\s+)?(?:all\s+)?(?:stale|active|closed)\s+(?:email\s+)?threads?")
def email_threads_status(text, m):
    status = 'active'
    if 'stale' in text.lower(): status = 'stale'
    elif 'closed' in text.lower(): status = 'closed'
    return ("SELECT et.subject, et.message_count, et.last_message_at, co.name as company "
            "FROM email_threads et LEFT JOIN companies co ON et.company_id=co.id "
            "WHERE et.status = %s ORDER BY et.last_message_at DESC", [status])

# 13. Contacts without email
@pattern(r"contacts?\s+(?:without|missing|no)\s+emails?")
def contacts_no_email(text, m):
    return ("SELECT c.first_name, c.last_name, c.title, co.name as company "
            "FROM contacts c LEFT JOIN companies co ON c.company_id=co.id "
            "WHERE c.email IS NULL OR c.email = '' ORDER BY co.name", [])

# 14. Activities by type
@pattern(r"(?:show|list|how many)\s+(?:me\s+)?(\w+)\s+(?:activities|emails|calls|meetings)")
def activities_by_type(text, m):
    atype = m.group(1).lower()
    if atype in ('email', 'call', 'meeting', 'note', 'linkedin'):
        tw, p = time_window(text)
        where = f"AND {tw}" if tw else ""
        return (f"SELECT a.subject, a.agent, a.direction, a.created_at, co.name as company "
                f"FROM activities a LEFT JOIN companies co ON a.company_id=co.id "
                f"WHERE a.type ILIKE %s {where} ORDER BY a.created_at DESC LIMIT 20",
                [f"%{atype}%"] + p)
    return None

# 15. Timeline for a company
@pattern(r"timeline\s+(?:for|of)\s+(.+)")
def company_timeline(text, m):
    name = m.group(1).strip().rstrip('?')
    return ("SELECT te.event_type, te.event_data, te.agent, te.created_at "
            "FROM timeline_events te JOIN companies co ON te.company_id=co.id "
            "WHERE co.name ILIKE %s ORDER BY te.created_at DESC LIMIT 30",
            [f"%{name}%"])

# 16. Companies by ICP score
@pattern(r"(?:top|best|highest)\s*(\d*)\s*(?:icp|scored)\s*(?:companies|prospects)?")
def top_icp(text, m):
    n = int(m.group(1)) if m.group(1) else 10
    return ("SELECT name, industry, icp_score, employees, city "
            "FROM companies WHERE icp_score IS NOT NULL "
            "ORDER BY icp_score DESC LIMIT %s", [n])

# 17. Deal pipeline summary
@pattern(r"(?:pipeline|deal)\s+summary|deals?\s+by\s+stage")
def pipeline_summary(text, m):
    return ("SELECT stage, COUNT(*) as count, SUM(value) as total_value "
            "FROM deals GROUP BY stage ORDER BY count DESC", [])

# 18. Contacts added recently
@pattern(r"(?:new|recent)\s+contacts")
def new_contacts(text, m):
    tw, p = time_window(text)
    where = f"WHERE c.{tw}" if tw else "WHERE c.created_at >= NOW() - INTERVAL '7 days'"
    return (f"SELECT c.first_name, c.last_name, c.email, c.title, co.name as company, c.created_at "
            f"FROM contacts c LEFT JOIN companies co ON c.company_id=co.id "
            f"{where} ORDER BY c.created_at DESC", p)

# Sort patterns by priority
PATTERNS.sort(key=lambda x: x[0])

# ---------- execute ----------

def run_query(question):
    for _, regex, fn in PATTERNS:
        m = regex.search(question)
        if m:
            result = fn(question, m)
            if result is None:
                continue
            sql, params = result
            return sql, params
    return None, None

def format_results(rows, columns):
    if not rows:
        return "No results found."
    # Determine column widths
    widths = [len(c) for c in columns]
    str_rows = []
    for row in rows:
        sr = [str(v) if v is not None else '' for v in row]
        str_rows.append(sr)
        for i, v in enumerate(sr):
            widths[i] = max(widths[i], len(v))
    # Build table
    header = " | ".join(c.ljust(w) for c, w in zip(columns, widths))
    sep = "-+-".join("-" * w for w in widths)
    lines = [header, sep]
    for sr in str_rows:
        lines.append(" | ".join(v.ljust(w) for v, w in zip(sr, widths)))
    return "\n".join(lines)

def main():
    if len(sys.argv) < 2:
        print("Usage: python nlq.py \"your question here\"")
        sys.exit(1)

    question = " ".join(sys.argv[1:])
    sql, params = run_query(question)

    if sql is None:
        print(f"Sorry, I couldn't understand: \"{question}\"")
        print("\nTry questions like:")
        print('  "How many companies haven\'t been contacted?"')
        print('  "Show me all contacts at insurance companies"')
        print('  "Top 5 biggest untouched prospects"')
        print('  "Recent 10 activities"')
        print('  "Pipeline summary"')
        print('  "Stale companies"')
        print('  "What did oracle send last week?"')
        sys.exit(1)

    conn = connect()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description]
            print(format_results(rows, columns))
            print(f"\n({len(rows)} row{'s' if len(rows)!=1 else ''})")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
