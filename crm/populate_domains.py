#!/usr/bin/env python3
"""Populate companies.domain from websites and contact emails. Deduplicate by domain."""

import re
import psycopg2
from urllib.parse import urlparse

DB = dict(host="localhost", dbname="afrexai_crm", user="openclaw")

def extract_domain(url):
    """Extract clean domain from URL or email."""
    if not url:
        return None
    url = url.strip()
    if '@' in url:
        return url.split('@')[-1].lower().strip()
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    try:
        parsed = urlparse(url)
        domain = parsed.hostname or ''
        domain = domain.lower().strip()
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain if domain and '.' in domain else None
    except Exception:
        return None

def main():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # 1. Populate domain from website
    cur.execute("SELECT id, website FROM companies WHERE domain IS NULL AND website IS NOT NULL AND website != ''")
    updated = 0
    for cid, website in cur.fetchall():
        domain = extract_domain(website)
        if domain:
            cur.execute("UPDATE companies SET domain = %s WHERE id = %s", (domain, cid))
            updated += 1
    print(f"Set domain from website for {updated} companies")

    # 2. Fill remaining from contact emails
    cur.execute("""
        SELECT DISTINCT co.id, c.email
        FROM companies co
        JOIN contacts c ON c.company_id = co.id
        WHERE co.domain IS NULL AND c.email IS NOT NULL AND c.email != ''
    """)
    email_updated = 0
    for cid, email in cur.fetchall():
        domain = extract_domain(email)
        if domain and domain not in ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'):
            cur.execute("UPDATE companies SET domain = %s WHERE id = %s AND domain IS NULL", (domain, cid))
            email_updated += 1
    print(f"Set domain from contact email for {email_updated} companies")

    # 3. Deduplicate: find companies sharing the same domain
    cur.execute("""
        SELECT domain, array_agg(id ORDER BY id) as ids, array_agg(name ORDER BY id) as names
        FROM companies
        WHERE domain IS NOT NULL AND domain != ''
        GROUP BY domain
        HAVING COUNT(*) > 1
    """)
    dupes = cur.fetchall()
    merged = 0
    for domain, ids, names in dupes:
        keep_id = ids[0]
        merge_ids = ids[1:]
        print(f"  Duplicate domain '{domain}': keeping '{names[0]}' (id={keep_id}), merging {list(zip(names[1:], merge_ids))}")
        for mid in merge_ids:
            # Reassign contacts, deals, activities to the kept company
            for table in ('contacts', 'deals', 'activities'):
                cur.execute(f"UPDATE {table} SET company_id = %s WHERE company_id = %s", (keep_id, mid))
            cur.execute("UPDATE email_threads SET company_id = %s WHERE company_id = %s", (keep_id, mid))
            cur.execute("UPDATE timeline_events SET company_id = %s WHERE company_id = %s", (keep_id, mid))
            # Move tags
            cur.execute("UPDATE company_tags SET company_id = %s WHERE company_id = %s AND tag_id NOT IN (SELECT tag_id FROM company_tags WHERE company_id = %s)", (keep_id, mid, keep_id))
            cur.execute("DELETE FROM company_tags WHERE company_id = %s", (mid,))
            cur.execute("DELETE FROM companies WHERE id = %s", (mid,))
            merged += 1

    if merged:
        print(f"Merged {merged} duplicate companies")
    else:
        print("No duplicate domains found")

    conn.commit()
    cur.close()
    conn.close()
    print("Done.")

if __name__ == "__main__":
    main()
