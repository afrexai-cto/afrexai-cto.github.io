/**
 * Attendee Matcher - Matches meeting attendees to CRM contacts.
 * Creates new contacts if not found. Updates relationship summaries.
 */
import { getDb, initDb } from './db.js';
import { v4 as uuid } from 'uuid';
import config from './config.json' with { type: 'json' };

// Stub CRM lookup
async function lookupCrmContact(email) {
  // STUB: Replace with actual CRM API call
  console.log(`[crm] Would lookup contact: ${email}`);
  return null; // { id, name, company }
}

function isInternal(email) {
  return config.internalDomains.some(d => email.toLowerCase().endsWith(`@${d}`));
}

export function findOrCreateContact(db, { email, name, company }) {
  let contact = db.prepare('SELECT * FROM contacts WHERE email = ?').get(email);
  if (contact) return contact;

  const id = uuid();
  const internal = isInternal(email) ? 1 : 0;
  db.prepare(`INSERT INTO contacts (id, email, name, company, is_internal) VALUES (?, ?, ?, ?, ?)`)
    .run(id, email, name || null, company || null, internal);
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
}

export function updateRelationshipSummary(db, contactId, meetingTitle, meetingSummary) {
  const contact = db.prepare('SELECT relationship_summary FROM contacts WHERE id = ?').get(contactId);
  if (!contact) return;

  const date = new Date().toISOString().split('T')[0];
  const entry = `\n[${date}] ${meetingTitle}: ${meetingSummary || 'Meeting held.'}`;
  const updated = (contact.relationship_summary || '') + entry;

  db.prepare('UPDATE contacts SET relationship_summary = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(updated, contactId);
}

export async function matchAttendees(meetingId, attendees) {
  const db = initDb();
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
  if (!meeting) throw new Error(`Meeting ${meetingId} not found`);

  const matched = [];
  for (const att of attendees) {
    // Try CRM lookup first
    const crmContact = await lookupCrmContact(att.email);
    const contact = findOrCreateContact(db, {
      email: att.email,
      name: crmContact?.name || att.name,
      company: crmContact?.company || att.company,
    });

    // Update CRM ID if found
    if (crmContact?.id && !contact.crm_id) {
      db.prepare('UPDATE contacts SET crm_id = ? WHERE id = ?').run(crmContact.id, contact.id);
    }

    // Link attendee to meeting
    db.prepare('INSERT OR IGNORE INTO meeting_attendees (meeting_id, contact_id, role) VALUES (?, ?, ?)')
      .run(meetingId, contact.id, att.role || 'attendee');

    // Update relationship summary
    updateRelationshipSummary(db, contact.id, meeting.title, meeting.summary);
    matched.push(contact);
  }

  return matched;
}

export default { matchAttendees, findOrCreateContact, updateRelationshipSummary, isInternal };
