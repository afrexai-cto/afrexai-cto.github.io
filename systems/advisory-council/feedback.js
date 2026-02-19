import { getDb } from './db.js';

/**
 * Record feedback on a recommendation and update preference signals.
 * Usage: node feedback.js <session_id> <number> <approve|reject|defer> [comment]
 */
export function recordFeedback(sessionId, number, action, comment = '') {
  const db = getDb();
  const rec = db.prepare('SELECT * FROM recommendations WHERE session_id = ? AND number = ?').get(sessionId, number);
  if (!rec) return `No recommendation #${number} in session ${sessionId}.`;

  db.prepare('INSERT INTO feedback (recommendation_id, action, comment) VALUES (?, ?, ?)').run(rec.id, action, comment);

  updatePreferences(db, rec.persona, rec.category, action);

  return `✅ Recorded: ${action} on #${number} (${rec.title})${comment ? ` — "${comment}"` : ''}`;
}

function updatePreferences(db, persona, category, action) {
  const existing = db.prepare('SELECT * FROM preference_signals WHERE persona = ? AND category = ?').get(persona, category || '__general__');

  const delta = action === 'approve' ? 0.1 : action === 'reject' ? -0.1 : 0;

  if (existing) {
    const newBias = Math.max(-1, Math.min(1, existing.priority_bias + delta));
    const total = existing.approval_rate * 10; // rough running avg
    const newRate = action === 'approve' ? (total + 1) / 11 : action === 'reject' ? total / 11 : existing.approval_rate;
    db.prepare('UPDATE preference_signals SET priority_bias = ?, approval_rate = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(newBias, newRate, existing.id);
  } else {
    const rate = action === 'approve' ? 1.0 : action === 'reject' ? 0.0 : 0.5;
    db.prepare('INSERT INTO preference_signals (persona, category, priority_bias, approval_rate) VALUES (?, ?, ?, ?)')
      .run(persona, category || '__general__', delta, rate);
  }
}

export function getPreferences() {
  const db = getDb();
  return db.prepare('SELECT * FROM preference_signals').all();
}

export function getFeedbackHistory(limit = 20) {
  const db = getDb();
  return db.prepare(`
    SELECT f.*, r.number, r.title, r.persona, r.session_id
    FROM feedback f JOIN recommendations r ON f.recommendation_id = r.id
    ORDER BY f.created_at DESC LIMIT ?
  `).all(limit);
}

// CLI mode
if (process.argv[1]?.endsWith('feedback.js') && process.argv[2]) {
  const sessionId = parseInt(process.argv[2]);
  const number = parseInt(process.argv[3]);
  const action = process.argv[4];
  const comment = process.argv.slice(5).join(' ');
  console.log(recordFeedback(sessionId, number, action, comment));
}
