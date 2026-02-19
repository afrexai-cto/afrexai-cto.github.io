/**
 * Approval Queue - Manages action item approval workflow.
 * Outputs structured JSON for Telegram/webhook delivery.
 */
import { getDb, initDb } from './db.js';
import config from './config.json' with { type: 'json' };

export function queueForApproval(actionItemId) {
  const db = initDb();
  const item = db.prepare(`
    SELECT ai.*, m.title as meeting_title, c.name as owner_name, c.email as owner_email
    FROM action_items ai
    LEFT JOIN meetings m ON ai.meeting_id = m.id
    LEFT JOIN contacts c ON ai.owner_contact_id = c.id
    WHERE ai.id = ?
  `).get(actionItemId);

  if (!item) throw new Error(`Action item ${actionItemId} not found`);

  const payload = {
    type: 'action_item_approval',
    actionItemId: item.id,
    meetingTitle: item.meeting_title,
    description: item.description,
    ownership: item.ownership,
    owner: item.owner_name || 'Unassigned',
    ownerEmail: item.owner_email,
    dueDate: item.due_date,
    priority: item.priority,
    actions: [
      { label: '✅ Approve', callback: `approve:${item.id}` },
      { label: '❌ Reject', callback: `reject:${item.id}` },
      { label: '✏️ Edit', callback: `edit:${item.id}` },
    ],
  };

  db.prepare('INSERT INTO approval_queue (action_item_id, payload) VALUES (?, ?)')
    .run(actionItemId, JSON.stringify(payload));

  return payload;
}

export async function deliverPendingApprovals() {
  const db = initDb();
  const pending = db.prepare('SELECT * FROM approval_queue WHERE delivered = 0').all();

  for (const item of pending) {
    try {
      // STUB: Send to Telegram/webhook
      console.log(`[approval] Would POST to ${config.approvalWebhook}:`, item.payload);
      db.prepare('UPDATE approval_queue SET delivered = 1, delivered_at = datetime(\'now\') WHERE id = ?')
        .run(item.id);
    } catch (err) {
      console.error(`[approval] Delivery failed for ${item.id}:`, err.message);
    }
  }

  return pending.length;
}

export function processApproval(actionItemId, response) {
  const db = initDb();
  if (!['approved', 'rejected'].includes(response)) {
    throw new Error(`Invalid response: ${response}`);
  }

  const newStatus = response === 'approved' ? 'approved' : 'rejected';
  db.prepare('UPDATE action_items SET status = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(newStatus, actionItemId);
  db.prepare('UPDATE approval_queue SET response = ?, responded_at = datetime(\'now\') WHERE action_item_id = ?')
    .run(response, actionItemId);

  return { actionItemId, status: newStatus };
}

export function getPendingApprovals() {
  const db = initDb();
  return db.prepare(`
    SELECT ai.*, m.title as meeting_title
    FROM action_items ai
    LEFT JOIN meetings m ON ai.meeting_id = m.id
    WHERE ai.status = 'pending_approval'
    ORDER BY ai.created_at DESC
  `).all();
}

export default { queueForApproval, deliverPendingApprovals, processApproval, getPendingApprovals };
