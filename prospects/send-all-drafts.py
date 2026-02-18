#!/usr/bin/env python3
"""Fetch all drafts from Gmail and send them via SMTP, then update tracker."""

import imaplib
import smtplib
import email
import os
import csv
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

EMAIL_ADDR = "ksmolichki@afrexai.com"
APP_PASSWORD = os.environ["GMAIL_BUSINESS_APP_PASSWORD"]
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
IMAP_HOST = "imap.gmail.com"
IMAP_PORT = 993
TRACKER_PATH = "prospects/outreach-tracker.csv"

def get_drafts():
    """Fetch all drafts from Gmail, return list of (uid, to_email, subject, raw_msg)"""
    imap = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
    imap.login(EMAIL_ADDR, APP_PASSWORD)
    imap.select('[Gmail]/Drafts')
    
    status, data = imap.uid('search', None, 'ALL')
    if status != 'OK' or not data[0]:
        print("No drafts found")
        imap.logout()
        return []
    
    uids = data[0].split()
    print(f"Found {len(uids)} drafts")
    
    drafts = []
    for uid in uids:
        status, msg_data = imap.uid('fetch', uid, '(RFC822)')
        if status != 'OK':
            continue
        raw = msg_data[0][1]
        msg = email.message_from_bytes(raw)
        to_addr = msg.get('To', '')
        subject = msg.get('Subject', '')
        drafts.append((uid, to_addr, subject, raw, msg))
    
    # Don't logout yet - we need to delete drafts after sending
    return drafts, imap

def send_email(smtp_conn, msg):
    """Send an email message via SMTP"""
    from_addr = msg.get('From', EMAIL_ADDR)
    to_addr = msg.get('To')
    if not to_addr:
        return False
    smtp_conn.sendmail(from_addr, [to_addr], msg.as_bytes())
    return True

def update_tracker(sent_emails):
    """Update tracker CSV - change 'drafted' to 'sent' for sent emails"""
    rows = []
    with open(TRACKER_PATH, 'r') as f:
        reader = csv.reader(f)
        for row in reader:
            rows.append(row)
    
    # sent_emails is a set of email addresses that were sent
    updated = 0
    for row in rows[1:]:  # skip header
        if len(row) >= 6 and row[2].strip().lower() in sent_emails and row[5].strip() == 'drafted':
            row[5] = 'sent'
            updated += 1
    
    with open(TRACKER_PATH, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    
    return updated

if __name__ == "__main__":
    print(f"=== Sending all Gmail drafts for {EMAIL_ADDR} ===")
    print(f"Time: {datetime.now().isoformat()}")
    
    # Get drafts
    result = get_drafts()
    if not result:
        exit(1)
    drafts, imap = result
    
    print(f"\nConnecting to SMTP...")
    smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
    smtp.starttls()
    smtp.login(EMAIL_ADDR, APP_PASSWORD)
    print("SMTP connected.\n")
    
    sent_count = 0
    failed_count = 0
    sent_emails = set()
    sent_uids = []
    
    for uid, to_addr, subject, raw, msg in drafts:
        try:
            # Extract clean email from To field
            to_clean = to_addr
            if '<' in to_addr:
                to_clean = to_addr.split('<')[1].split('>')[0]
            to_clean = to_clean.strip().lower()
            
            print(f"[{sent_count + failed_count + 1}/{len(drafts)}] Sending to {to_clean}: {subject[:60]}...")
            
            send_email(smtp, msg)
            sent_emails.add(to_clean)
            sent_uids.append(uid)
            sent_count += 1
            print(f"  ✓ Sent")
            time.sleep(1)  # Rate limit
            
        except Exception as e:
            print(f"  ✗ Failed: {e}")
            failed_count += 1
    
    smtp.quit()
    
    # Delete sent drafts from Gmail
    print(f"\nDeleting {len(sent_uids)} sent drafts from Gmail...")
    for uid in sent_uids:
        try:
            imap.uid('store', uid, '+FLAGS', '\\Deleted')
        except:
            pass
    imap.expunge()
    imap.logout()
    
    # Update tracker
    print(f"\nUpdating tracker...")
    updated = update_tracker(sent_emails)
    
    print(f"\n=== SUMMARY ===")
    print(f"Total drafts found: {len(drafts)}")
    print(f"Successfully sent: {sent_count}")
    print(f"Failed: {failed_count}")
    print(f"Tracker rows updated: {updated}")
