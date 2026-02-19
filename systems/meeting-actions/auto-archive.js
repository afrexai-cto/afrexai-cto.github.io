/**
 * Auto-Archive - Archives items older than 14 days.
 */
import { getDb, initDb } from './db.js';
import config from './config.json' with { type: 'json' };

export function autoArchive() {
  const db = initDb();
  const days = config.archiveAfterDays;

  // Archive done/rejected action items older than threshold
  const archivedActions = db.prepare(`
    UPDATE action_items SET status = 'archived', updated_at = datetime('now')
    WHERE status IN ('done', 'rejected')
    AND updated_at < datetime('now', ? || ' days')
  `).run(`-${days}`);

  // Archive received/overdue waiting-on items older than threshold
  const archivedWaiting = db.prepare(`
    UPDATE waiting_on SET status = 'archived', updated_at = datetime('now')
    WHERE status IN ('received', 'overdue')
    AND updated_at < datetime('now', ? || ' days')
  `).run(`-${days}`);

  const result = {
    archivedAt: new Date().toISOString(),
    actionItemsArchived: archivedActions.changes,
    waitingOnArchived: archivedWaiting.changes,
    thresholdDays: days,
  };

  console.log('[auto-archive]', result);
  return result;
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  autoArchive();
}
