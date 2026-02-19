/**
 * Completion Check - Runs 3x daily (8am, 12pm, 4pm).
 * Reports on overdue, pending, and waiting-on items.
 * Tracks "waiting on" for external contacts only.
 */
import { getDb, initDb } from './db.js';
import config from './config.json' with { type: 'json' };

export function runCompletionCheck() {
  const db = initDb();
  const now = new Date().toISOString();

  // Overdue items (past due_date, not done/archived)
  const overdue = db.prepare(`
    SELECT ai.*, c.name as owner_name, c.email as owner_email, m.title as meeting_title
    FROM action_items ai
    LEFT JOIN contacts c ON ai.owner_contact_id = c.id
    LEFT JOIN meetings m ON ai.meeting_id = m.id
    WHERE ai.due_date < date('now')
    AND ai.status IN ('approved', 'in_progress')
    ORDER BY ai.due_date ASC
  `).all();

  // Pending approval
  const pending = db.prepare(`
    SELECT ai.*, m.title as meeting_title
    FROM action_items ai
    LEFT JOIN meetings m ON ai.meeting_id = m.id
    WHERE ai.status = 'pending_approval'
    ORDER BY ai.created_at ASC
  `).all();

  // Waiting on (external contacts only)
  const waitingOn = db.prepare(`
    SELECT w.*, c.name as contact_name, c.email as contact_email, c.company,
           ai.description as action_description
    FROM waiting_on w
    JOIN contacts c ON w.contact_id = c.id
    JOIN action_items ai ON w.action_item_id = ai.id
    WHERE w.status = 'waiting'
    AND c.is_internal = 0
    ORDER BY w.due_date ASC
  `).all();

  // Mark overdue waiting-on items
  db.prepare(`
    UPDATE waiting_on SET status = 'overdue', updated_at = datetime('now')
    WHERE status = 'waiting' AND due_date < date('now')
  `).run();

  const report = {
    checkedAt: now,
    overdue: overdue.map(i => ({
      id: i.id,
      description: i.description,
      owner: i.owner_name || i.owner_email,
      dueDate: i.due_date,
      meeting: i.meeting_title,
      daysOverdue: Math.floor((Date.now() - new Date(i.due_date).getTime()) / 86400000),
    })),
    pendingApproval: pending.map(i => ({
      id: i.id,
      description: i.description,
      meeting: i.meeting_title,
      createdAt: i.created_at,
    })),
    waitingOn: waitingOn.map(w => ({
      id: w.id,
      description: w.description,
      contact: w.contact_name || w.contact_email,
      company: w.company,
      actionItem: w.action_description,
      dueDate: w.due_date,
    })),
    summary: {
      overdueCount: overdue.length,
      pendingCount: pending.length,
      waitingOnCount: waitingOn.length,
    },
  };

  return report;
}

export async function createWaitingOn(db, actionItemId, contactId, description, dueDate) {
  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();
  db.prepare(`INSERT INTO waiting_on (id, action_item_id, contact_id, description, due_date)
    VALUES (?, ?, ?, ?, ?)`).run(id, actionItemId, contactId, description, dueDate);
  return id;
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runCompletionCheck();
  console.log(JSON.stringify(report, null, 2));
}
