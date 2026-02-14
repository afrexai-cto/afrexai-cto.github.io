#!/usr/bin/env python3
"""
deduplicate.py — Find and merge duplicate companies and contacts in AfrexAI CRM.

Duplicates:
  - Companies: same name (case-insensitive) or same domain
  - Contacts: same email (case-insensitive)

Strategy: keep the record with the most non-null fields, merge notes.
"""
import sys, logging
from datetime import datetime
from db import get_conn, get_cursor

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def non_null_count(row):
    """Count non-null, non-empty values in a dict row."""
    return sum(1 for v in row.values() if v is not None and v != "")


def merge_notes(*notes):
    """Combine notes fields, deduplicating."""
    parts = []
    for n in notes:
        if n and n.strip():
            parts.append(n.strip())
    return "\n---\n".join(parts) if parts else None


def deduplicate_companies(conn):
    """Find and merge duplicate companies."""
    cur = get_cursor(conn)

    # Find dupes by lower(name)
    cur.execute("""
        SELECT lower(name) as lname, array_agg(id ORDER BY id) as ids
        FROM companies WHERE name IS NOT NULL
        GROUP BY lower(name) HAVING count(*) > 1
    """)
    name_dupes = cur.fetchall()

    # Find dupes by domain (non-null)
    cur.execute("""
        SELECT lower(domain) as ldomain, array_agg(id ORDER BY id) as ids
        FROM companies WHERE domain IS NOT NULL AND domain != ''
        GROUP BY lower(domain) HAVING count(*) > 1
    """)
    domain_dupes = cur.fetchall()

    # Collect unique duplicate groups (sets of ids)
    groups = {}
    for row in name_dupes + domain_dupes:
        ids = tuple(sorted(row["ids"]))
        groups[ids] = ids

    merged_count = 0
    for ids in groups.values():
        cur.execute("SELECT * FROM companies WHERE id = ANY(%s) ORDER BY id", (list(ids),))
        rows = cur.fetchall()
        if len(rows) < 2:
            continue

        # Pick keeper: most non-null fields
        keeper = max(rows, key=non_null_count)
        losers = [r for r in rows if r["id"] != keeper["id"]]
        loser_ids = [r["id"] for r in losers]

        # Merge notes
        all_notes = [r.get("notes") for r in rows]
        merged = merge_notes(*all_notes)
        if merged:
            cur.execute("UPDATE companies SET notes = %s WHERE id = %s", (merged, keeper["id"]))

        # Re-point foreign keys
        for lid in loser_ids:
            cur.execute("UPDATE contacts SET company_id = %s WHERE company_id = %s", (keeper["id"], lid))
            cur.execute("UPDATE deals SET company_id = %s WHERE company_id = %s", (keeper["id"], lid))
            cur.execute("UPDATE activities SET company_id = %s WHERE company_id = %s", (keeper["id"], lid))
            cur.execute("UPDATE company_tags SET company_id = %s WHERE company_id = %s AND company_id NOT IN (SELECT company_id FROM company_tags WHERE company_id = %s)", (keeper["id"], lid, keeper["id"]))
            cur.execute("DELETE FROM company_tags WHERE company_id = %s", (lid,))
            cur.execute("DELETE FROM companies WHERE id = %s", (lid,))

        log.info(f"Company merge: kept #{keeper['id']} ({keeper.get('name')}), removed {loser_ids}")
        merged_count += 1

    return merged_count


def deduplicate_contacts(conn):
    """Find and merge duplicate contacts by email."""
    cur = get_cursor(conn)

    cur.execute("""
        SELECT lower(email) as lemail, array_agg(id ORDER BY id) as ids
        FROM contacts WHERE email IS NOT NULL AND email != ''
        GROUP BY lower(email) HAVING count(*) > 1
    """)
    dupes = cur.fetchall()

    merged_count = 0
    for row in dupes:
        ids = row["ids"]
        cur.execute("SELECT * FROM contacts WHERE id = ANY(%s) ORDER BY id", (ids,))
        rows = cur.fetchall()
        if len(rows) < 2:
            continue

        keeper = max(rows, key=non_null_count)
        losers = [r for r in rows if r["id"] != keeper["id"]]
        loser_ids = [r["id"] for r in losers]

        all_notes = [r.get("notes") for r in rows]
        merged = merge_notes(*all_notes)
        if merged:
            cur.execute("UPDATE contacts SET notes = %s WHERE id = %s", (merged, keeper["id"]))

        for lid in loser_ids:
            cur.execute("UPDATE activities SET contact_id = %s WHERE contact_id = %s", (keeper["id"], lid))
            cur.execute("UPDATE deals SET contact_id = %s WHERE contact_id = %s", (keeper["id"], lid))
            cur.execute("DELETE FROM contacts WHERE id = %s", (lid,))

        log.info(f"Contact merge: kept #{keeper['id']} ({keeper.get('email')}), removed {loser_ids}")
        merged_count += 1

    return merged_count


def main():
    conn = get_conn()
    try:
        c = deduplicate_companies(conn)
        log.info(f"Merged {c} company duplicate group(s)")
        ct = deduplicate_contacts(conn)
        log.info(f"Merged {ct} contact duplicate group(s)")
        conn.commit()
        log.info("Done. All changes committed.")
    except Exception:
        conn.rollback()
        log.exception("Error during deduplication, rolled back")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
