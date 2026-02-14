#!/usr/bin/env python3
"""
timeline.py — Generate a chronological timeline of all touchpoints for a contact or company.

Usage:
    python timeline.py --contact-email brent@savant.com
    python timeline.py --contact-id 42
    python timeline.py --company-id 5
    python timeline.py --company-name "Savant Labs"
"""
import argparse, sys
from datetime import datetime
from db import get_conn, get_cursor


def get_timeline(contact_id=None, contact_email=None, company_id=None, company_name=None):
    conn = get_conn()
    cur = get_cursor(conn)

    # Resolve identifiers
    if contact_email:
        cur.execute("SELECT id, first_name, last_name, email, company_id FROM contacts WHERE lower(email) = lower(%s)", (contact_email,))
        row = cur.fetchone()
        if not row:
            return f"No contact found with email: {contact_email}"
        contact_id = row["id"]
        header = f"Timeline for {row.get('first_name','')} {row.get('last_name','')} ({row['email']})"
    elif contact_id:
        cur.execute("SELECT id, first_name, last_name, email, company_id FROM contacts WHERE id = %s", (contact_id,))
        row = cur.fetchone()
        if not row:
            return f"No contact found with id: {contact_id}"
        header = f"Timeline for {row.get('first_name','')} {row.get('last_name','')} ({row.get('email','')})"
    elif company_name:
        cur.execute("SELECT id, name FROM companies WHERE lower(name) = lower(%s)", (company_name,))
        row = cur.fetchone()
        if not row:
            return f"No company found: {company_name}"
        company_id = row["id"]
        header = f"Timeline for {row['name']}"
    elif company_id:
        cur.execute("SELECT id, name FROM companies WHERE id = %s", (company_id,))
        row = cur.fetchone()
        if not row:
            return f"No company found with id: {company_id}"
        header = f"Timeline for {row['name']}"
    else:
        return "Provide --contact-email, --contact-id, --company-id, or --company-name"

    # Fetch activities
    conditions, params = [], []
    if contact_id:
        conditions.append("contact_id = %s")
        params.append(contact_id)
    if company_id:
        conditions.append("company_id = %s")
        params.append(company_id)

    where = " OR ".join(conditions)
    cur.execute(f"""
        SELECT activity_type, agent, notes, metadata, created_at
        FROM activities WHERE {where}
        ORDER BY created_at ASC
    """, params)
    activities = cur.fetchall()
    conn.close()

    # Format
    lines = [f"\n{'='*60}", header, f"{'='*60}", f"Total touchpoints: {len(activities)}", ""]

    for a in activities:
        ts = a["created_at"].strftime("%Y-%m-%d %H:%M") if a["created_at"] else "unknown"
        icon = {"email": "📧", "call": "📞", "meeting": "🤝", "note": "📝"}.get(a["activity_type"], "•")
        agent_str = f" [{a['agent']}]" if a.get("agent") else ""
        lines.append(f"  {ts}  {icon} {a['activity_type'].upper()}{agent_str}")
        if a.get("notes"):
            for note_line in a["notes"][:200].split("\n"):
                lines.append(f"             {note_line}")
        lines.append("")

    if not activities:
        lines.append("  No activities recorded.")

    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser(description="CRM Timeline Viewer")
    p.add_argument("--contact-email", help="Contact email")
    p.add_argument("--contact-id", type=int, help="Contact ID")
    p.add_argument("--company-id", type=int, help="Company ID")
    p.add_argument("--company-name", help="Company name")
    args = p.parse_args()

    print(get_timeline(
        contact_id=args.contact_id, contact_email=args.contact_email,
        company_id=args.company_id, company_name=args.company_name,
    ))


if __name__ == "__main__":
    main()
