#!/usr/bin/env python3
"""
daily_report.py — Generate a daily CRM report for Slack.

Covers: new contacts, emails sent per agent, pipeline changes,
untouched prospects, top prospects to contact today.
"""
import sys
from datetime import datetime, timedelta
from db import get_conn, get_cursor


def generate_report(date=None):
    """Generate daily report for given date (default: today)."""
    if date is None:
        date = datetime.utcnow().date()

    start = datetime.combine(date, datetime.min.time())
    end = start + timedelta(days=1)
    conn = get_conn()
    cur = get_cursor(conn)

    lines = [
        f"📊 *CRM Daily Report — {date.strftime('%A, %B %d, %Y')}*",
        "",
    ]

    # 1. New contacts added today
    cur.execute("SELECT count(*) as cnt FROM contacts WHERE created_at >= %s AND created_at < %s", (start, end))
    new_contacts = cur.fetchone()["cnt"]
    lines.append(f"👤 *New contacts:* {new_contacts}")

    # 2. Emails sent per agent
    cur.execute("""
        SELECT agent, count(*) as cnt FROM activities
        WHERE activity_type = 'email' AND created_at >= %s AND created_at < %s
        GROUP BY agent ORDER BY cnt DESC
    """, (start, end))
    email_rows = cur.fetchall()
    if email_rows:
        lines.append("📧 *Emails sent:*")
        for r in email_rows:
            lines.append(f"   • {r['agent'] or 'unknown'}: {r['cnt']}")
    else:
        lines.append("📧 *Emails sent:* 0")

    # 3. Pipeline changes (deals updated today)
    cur.execute("""
        SELECT d.id, d.name, d.stage, d.value FROM deals d
        WHERE d.updated_at >= %s AND d.updated_at < %s
        ORDER BY d.value DESC NULLS LAST LIMIT 10
    """, (start, end))
    deal_changes = cur.fetchall()
    if deal_changes:
        lines.append(f"🔄 *Pipeline changes:* {len(deal_changes)} deal(s) updated")
        for d in deal_changes:
            val = f"${d['value']:,.0f}" if d.get("value") else "no value"
            lines.append(f"   • {d['name'] or f'Deal #{d[\"id\"]}'} → {d.get('stage', '?')} ({val})")
    else:
        lines.append("🔄 *Pipeline changes:* none")

    # 4. Untouched prospects (contacts with no activity in last 14 days)
    cur.execute("""
        SELECT count(*) as cnt FROM contacts c
        WHERE NOT EXISTS (
            SELECT 1 FROM activities a WHERE a.contact_id = c.id AND a.created_at >= %s
        )
    """, (start - timedelta(days=14),))
    untouched = cur.fetchone()["cnt"]
    lines.append(f"⚠️ *Untouched prospects (14+ days):* {untouched}")

    # 5. Top prospects to contact today (oldest last-touch first)
    cur.execute("""
        SELECT c.id, c.first_name, c.last_name, c.email, c.title,
               comp.name as company_name,
               max(a.created_at) as last_touch
        FROM contacts c
        LEFT JOIN companies comp ON c.company_id = comp.id
        LEFT JOIN activities a ON a.contact_id = c.id
        GROUP BY c.id, c.first_name, c.last_name, c.email, c.title, comp.name
        ORDER BY last_touch ASC NULLS FIRST
        LIMIT 5
    """)
    prospects = cur.fetchall()
    if prospects:
        lines.append("🎯 *Top prospects to contact today:*")
        for p in prospects:
            name = f"{p.get('first_name','') or ''} {p.get('last_name','') or ''}".strip() or p.get("email", "?")
            co = f" @ {p['company_name']}" if p.get("company_name") else ""
            touch = p["last_touch"].strftime("%b %d") if p.get("last_touch") else "never"
            lines.append(f"   • {name}{co} (last: {touch})")

    conn.close()
    lines.append("")
    return "\n".join(lines)


def main():
    import argparse
    p = argparse.ArgumentParser(description="CRM Daily Report")
    p.add_argument("--date", help="Date (YYYY-MM-DD), default today")
    args = p.parse_args()
    date = datetime.strptime(args.date, "%Y-%m-%d").date() if args.date else None
    print(generate_report(date))


if __name__ == "__main__":
    main()
