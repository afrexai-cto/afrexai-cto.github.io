import { getDb } from './db.js';

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

/**
 * Merge recommendations from all personas, deduplicate, rank, number, and store.
 */
export function synthesize(sessionId, allResults) {
  const db = getDb();
  const flat = [];

  for (const { persona, recs } of allResults) {
    for (const r of recs) {
      flat.push({ ...r, persona });
    }
  }

  // Deduplicate by similar titles (simple keyword overlap)
  const deduped = dedup(flat);

  // Sort: priority → confidence desc
  deduped.sort((a, b) => {
    const pd = (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
    if (pd !== 0) return pd;
    return (b.confidence ?? 0) - (a.confidence ?? 0);
  });

  // Number and store
  const insert = db.prepare(`INSERT INTO recommendations (session_id, number, persona, title, body, priority, category, confidence) VALUES (?,?,?,?,?,?,?,?)`);
  const numbered = deduped.map((r, i) => {
    const num = i + 1;
    insert.run(sessionId, num, r.persona, r.title, r.body, r.priority, r.category || null, r.confidence || 0.5);
    return { ...r, number: num };
  });

  // Update session summary
  const critCount = numbered.filter(r => r.priority === 'critical').length;
  const highCount = numbered.filter(r => r.priority === 'high').length;
  const summary = `${numbered.length} recommendations: ${critCount} critical, ${highCount} high priority`;
  db.prepare('UPDATE sessions SET summary = ? WHERE id = ?').run(summary, sessionId);

  return numbered;
}

function dedup(recs) {
  const seen = new Set();
  return recs.filter(r => {
    const key = r.title.toLowerCase().replace(/[^a-z]/g, '').slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatDigest(recs) {
  const lines = ['# 📋 Advisory Council Digest\n'];
  let lastPriority = null;

  for (const r of recs) {
    if (r.priority !== lastPriority) {
      const emoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[r.priority] || '⚪';
      lines.push(`\n## ${emoji} ${r.priority.toUpperCase()}\n`);
      lastPriority = r.priority;
    }
    lines.push(`**#${r.number}** [${r.persona}] ${r.title}`);
    lines.push(`   ${r.body}`);
    lines.push(`   _Confidence: ${(r.confidence * 100).toFixed(0)}%_\n`);
  }

  lines.push('\n---');
  lines.push('_"Tell me more about #N" for deep dive | "approve #N" / "reject #N" for feedback_');
  return lines.join('\n');
}
