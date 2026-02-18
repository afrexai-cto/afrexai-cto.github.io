#!/usr/bin/env python3
"""
activity_logger.py — Utility module to log activities to the AfrexAI CRM.

Usage:
    from activity_logger import log_email, log_call, log_meeting, log_note

    log_email(agent='oracle', to_email='brent@savant.com', subject='Follow up', body='...', status='sent')
    log_call(agent='oracle', to_email='brent@savant.com', notes='Discussed pricing', duration_min=15)
    log_meeting(agent='oracle', to_email='brent@savant.com', notes='Demo call', duration_min=30)
    log_note(agent='oracle', to_email='brent@savant.com', notes='Key decision maker')
"""
import json
from datetime import datetime
from db import get_conn, get_cursor


def _resolve_contact(cur, email=None, contact_id=None):
    """Resolve a contact by email or id. Returns (contact_id, company_id) or (None, None)."""
    if contact_id:
        cur.execute("SELECT id, company_id FROM contacts WHERE id = %s", (contact_id,))
    elif email:
        cur.execute("SELECT id, company_id FROM contacts WHERE lower(email) = lower(%s) LIMIT 1", (email,))
    else:
        return None, None
    row = cur.fetchone()
    return (row["id"], row.get("company_id")) if row else (None, None)


def _log_activity(activity_type, agent, to_email=None, contact_id=None, company_id=None,
                   subject=None, body=None, notes=None, status=None, duration_min=None,
                   metadata=None):
    """Core logging function."""
    conn = get_conn()
    try:
        cur = get_cursor(conn)
        cid, comp_id = _resolve_contact(cur, email=to_email, contact_id=contact_id)
        if company_id:
            comp_id = company_id

        meta = metadata or {}
        if subject:
            meta["subject"] = subject
        if body:
            meta["body"] = body[:2000]
        if duration_min:
            meta["duration_min"] = duration_min
        if status:
            meta["status"] = status

        cur.execute("""
            INSERT INTO activities (contact_id, company_id, activity_type, agent, notes, metadata, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (cid, comp_id, activity_type, agent, notes or subject, json.dumps(meta) if meta else None, datetime.utcnow()))

        activity_id = cur.fetchone()["id"]
        conn.commit()
        return activity_id
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def log_email(agent, to_email=None, contact_id=None, subject="", body="", status="sent", **kw):
    """Log an email activity."""
    return _log_activity("email", agent, to_email=to_email, contact_id=contact_id,
                          subject=subject, body=body, status=status, **kw)


def log_call(agent, to_email=None, contact_id=None, notes="", duration_min=None, **kw):
    """Log a phone call activity."""
    return _log_activity("call", agent, to_email=to_email, contact_id=contact_id,
                          notes=notes, duration_min=duration_min, **kw)


def log_meeting(agent, to_email=None, contact_id=None, notes="", duration_min=None, **kw):
    """Log a meeting activity."""
    return _log_activity("meeting", agent, to_email=to_email, contact_id=contact_id,
                          notes=notes, duration_min=duration_min, **kw)


def log_note(agent, to_email=None, contact_id=None, notes="", **kw):
    """Log a general note."""
    return _log_activity("note", agent, to_email=to_email, contact_id=contact_id, notes=notes, **kw)


if __name__ == "__main__":
    print("activity_logger — import this module to log CRM activities.")
    print("Functions: log_email, log_call, log_meeting, log_note")
