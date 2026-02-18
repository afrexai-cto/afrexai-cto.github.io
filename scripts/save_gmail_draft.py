#!/usr/bin/env python3
"""Save an email draft to Gmail via IMAP."""
import imaplib, os, sys, json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

IMAP_HOST = "imap.gmail.com"
EMAIL = "ksmolichki@afrexai.com"
PASSWORD = os.environ["GMAIL_BUSINESS_APP_PASSWORD"]

def save_draft(to, subject, html_body):
    msg = MIMEMultipart("alternative")
    msg["From"] = f"Kalin Smolichki <{EMAIL}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))
    
    with imaplib.IMAP4_SSL(IMAP_HOST) as imap:
        imap.login(EMAIL, PASSWORD)
        imap.append("[Gmail]/Drafts", "", imaplib.Time2Internaldate(datetime.now()), msg.as_bytes())
    return True

if __name__ == "__main__":
    # Read JSON from stdin: {"to": "...", "subject": "...", "body": "..."}
    data = json.load(sys.stdin)
    save_draft(data["to"], data["subject"], data["body"])
    print(f"✅ Draft saved for {data['to']}")
