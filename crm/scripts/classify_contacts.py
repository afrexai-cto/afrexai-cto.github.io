#!/usr/bin/env python3
"""
classify_contacts.py — Classify contacts by role tier based on title field.

Tiers: C-Suite, VP, Director, Manager, Other
Adds `role_tier` column to contacts if it doesn't exist.
"""
import re, sys, logging
from db import get_conn, get_cursor

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

TIER_PATTERNS = [
    ("C-Suite", re.compile(
        r'\b(ceo|cto|cfo|coo|cio|cmo|cpo|cro|chief|founder|co-founder|cofounder|president|owner)\b', re.I)),
    ("VP", re.compile(
        r'\b(vp|vice\s*president|svp|evp|avp)\b', re.I)),
    ("Director", re.compile(
        r'\b(director|head\s+of|principal)\b', re.I)),
    ("Manager", re.compile(
        r'\b(manager|lead|supervisor|coordinator|team\s+lead)\b', re.I)),
]


def classify_title(title):
    if not title:
        return "Other"
    for tier, pattern in TIER_PATTERNS:
        if pattern.search(title):
            return tier
    return "Other"


def main():
    conn = get_conn()
    try:
        cur = conn.cursor()
        # Ensure column exists
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'contacts' AND column_name = 'role_tier'
        """)
        if not cur.fetchone():
            cur.execute("ALTER TABLE contacts ADD COLUMN role_tier VARCHAR(20)")
            log.info("Added role_tier column to contacts")

        cur2 = get_cursor(conn)
        cur2.execute("SELECT id, title FROM contacts")
        contacts = cur2.fetchall()

        counts = {}
        for c in contacts:
            tier = classify_title(c.get("title"))
            cur.execute("UPDATE contacts SET role_tier = %s WHERE id = %s", (tier, c["id"]))
            counts[tier] = counts.get(tier, 0) + 1

        conn.commit()
        log.info(f"Classified {len(contacts)} contacts:")
        for tier, cnt in sorted(counts.items(), key=lambda x: -x[1]):
            log.info(f"  {tier}: {cnt}")

    except Exception:
        conn.rollback()
        log.exception("Error during classification")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
