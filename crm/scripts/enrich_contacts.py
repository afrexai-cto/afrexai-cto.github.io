#!/usr/bin/env python3
"""
enrich_contacts.py — Generate enrichment search URLs for contacts missing title or linkedin_url.

Adds `enrichment_status` column to contacts if it doesn't exist.
Statuses: 'pending', 'search_generated', 'enriched', 'needs_verification', 'skipped'
"""
import sys, logging, json
from urllib.parse import quote_plus
from db import get_conn, get_cursor

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def ensure_enrichment_column(conn):
    cur = conn.cursor()
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'contacts' AND column_name = 'enrichment_status'
    """)
    if not cur.fetchone():
        cur.execute("ALTER TABLE contacts ADD COLUMN enrichment_status VARCHAR(50) DEFAULT 'pending'")
        conn.commit()
        log.info("Added enrichment_status column to contacts")


def generate_search_urls(contact):
    """Generate search URL patterns for a contact."""
    name = f"{contact.get('first_name', '') or ''} {contact.get('last_name', '') or ''}".strip()
    company = contact.get("company_name") or ""
    email = contact.get("email") or ""
    urls = {}

    if name:
        # LinkedIn search
        q = f"{name} {company} site:linkedin.com/in".strip()
        urls["linkedin"] = f"https://www.google.com/search?q={quote_plus(q)}"

        # Title search
        if not contact.get("title"):
            q2 = f"{name} {company} title OR role OR position".strip()
            urls["title"] = f"https://www.google.com/search?q={quote_plus(q2)}"
    elif email:
        local = email.split("@")[0]
        domain = email.split("@")[1] if "@" in email else ""
        q = f"{local} {domain} site:linkedin.com/in"
        urls["linkedin"] = f"https://www.google.com/search?q={quote_plus(q)}"

    return urls


def main():
    conn = get_conn()
    try:
        ensure_enrichment_column(conn)
        cur = get_cursor(conn)

        # Find contacts missing title or linkedin_url
        cur.execute("""
            SELECT c.*, comp.name as company_name
            FROM contacts c
            LEFT JOIN companies comp ON c.company_id = comp.id
            WHERE (c.title IS NULL OR c.title = '' OR c.linkedin_url IS NULL OR c.linkedin_url = '')
              AND (c.enrichment_status IS NULL OR c.enrichment_status = 'pending')
        """)
        contacts = cur.fetchall()
        log.info(f"Found {len(contacts)} contacts needing enrichment")

        results = []
        for contact in contacts:
            urls = generate_search_urls(contact)
            if not urls:
                cur.execute("UPDATE contacts SET enrichment_status = 'skipped' WHERE id = %s", (contact["id"],))
                log.info(f"Skipped #{contact['id']} — insufficient data for search")
                continue

            missing = []
            if not contact.get("title"):
                missing.append("title")
            if not contact.get("linkedin_url"):
                missing.append("linkedin_url")

            results.append({
                "contact_id": contact["id"],
                "name": f"{contact.get('first_name', '') or ''} {contact.get('last_name', '') or ''}".strip(),
                "email": contact.get("email"),
                "missing": missing,
                "search_urls": urls,
            })

            cur.execute(
                "UPDATE contacts SET enrichment_status = 'search_generated' WHERE id = %s",
                (contact["id"],),
            )

        conn.commit()

        # Output results
        if results:
            print(f"\n{'='*70}")
            print(f"ENRICHMENT SEARCH URLS — {len(results)} contacts")
            print(f"{'='*70}\n")
            for r in results:
                print(f"Contact #{r['contact_id']}: {r['name'] or r['email']}")
                print(f"  Missing: {', '.join(r['missing'])}")
                for kind, url in r["search_urls"].items():
                    print(f"  {kind}: {url}")
                print()
        else:
            print("No contacts need enrichment.")

    except Exception:
        conn.rollback()
        log.exception("Error during enrichment")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
