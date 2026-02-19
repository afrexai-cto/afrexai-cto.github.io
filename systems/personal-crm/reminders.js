#!/usr/bin/env node
// Follow-up reminder management
// Usage:
//   node reminders.js                          - show pending reminders
//   node reminders.js create <contact_id> "title" "YYYY-MM-DD"
//   node reminders.js snooze <reminder_id> <days>
//   node reminders.js done <reminder_id>

import { getDb } from './db.js';

const db = getDb();
const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case 'create': {
    const [contactId, title, dueAt] = args;
    if (!contactId || !title || !dueAt) {
      console.log('Usage: node reminders.js create <contact_id> "title" "YYYY-MM-DD"');
      process.exit(1);
    }
    const result = db.prepare(
      'INSERT INTO reminders (contact_id, title, due_at) VALUES (?, ?, ?)'
    ).run(parseInt(contactId), title, dueAt);
    console.log(`✅ Reminder #${result.lastInsertRowid} created: "${title}" due ${dueAt}`);
    break;
  }

  case 'snooze': {
    const [id, days] = args;
    if (!id || !days) {
      console.log('Usage: node reminders.js snooze <id> <days>');
      process.exit(1);
    }
    db.prepare(
      `UPDATE reminders SET snoozed_until = datetime('now', '+' || ? || ' days') WHERE id = ?`
    ).run(parseInt(days), parseInt(id));
    console.log(`⏰ Reminder #${id} snoozed for ${days} days`);
    break;
  }

  case 'done': {
    const [id] = args;
    if (!id) { console.log('Usage: node reminders.js done <id>'); process.exit(1); }
    db.prepare('UPDATE reminders SET done = 1 WHERE id = ?').run(parseInt(id));
    console.log(`✅ Reminder #${id} marked done`);
    break;
  }

  default: {
    // Show pending reminders
    const reminders = db.prepare(`
      SELECT r.id, r.title, r.due_at, r.snoozed_until,
             c.name, c.email
      FROM reminders r
      LEFT JOIN contacts c ON c.id = r.contact_id
      WHERE r.done = 0
      AND (r.snoozed_until IS NULL OR datetime(r.snoozed_until) <= datetime('now'))
      ORDER BY r.due_at ASC
    `).all();

    if (reminders.length === 0) {
      console.log('\n✅ No pending reminders.');
    } else {
      const overdue = reminders.filter(r => new Date(r.due_at) < new Date());
      const upcoming = reminders.filter(r => new Date(r.due_at) >= new Date());

      if (overdue.length) {
        console.log(`\n🔴 Overdue (${overdue.length}):`);
        for (const r of overdue) {
          console.log(`  #${r.id} | ${r.due_at} | ${r.title} → ${r.name || r.email || 'general'}`);
        }
      }
      if (upcoming.length) {
        console.log(`\n📅 Upcoming (${upcoming.length}):`);
        for (const r of upcoming) {
          console.log(`  #${r.id} | ${r.due_at} | ${r.title} → ${r.name || r.email || 'general'}`);
        }
      }
    }
    break;
  }
}
