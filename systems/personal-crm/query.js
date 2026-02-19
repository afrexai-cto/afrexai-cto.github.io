#!/usr/bin/env node
// Natural language query interface for the CRM
// Usage: node query.js "who do I know at NVIDIA?"

import { getDb, blobToFloat32, cosineSimilarity } from './db.js';
import { getEmbedding } from './embeddings.js';

const query = process.argv[2];
if (!query) {
  console.log('Usage: node query.js "your question"');
  console.log('Examples:');
  console.log('  node query.js "who do I know at NVIDIA?"');
  console.log('  node query.js "who haven\'t I talked to in a while?"');
  console.log('  node query.js "show contacts at Google"');
  console.log('  node query.js "list all contacts"');
  process.exit(0);
}

async function runQuery(q) {
  const db = getDb();
  const lower = q.toLowerCase();

  // --- Pattern-based shortcuts ---

  // "list all" or "show all"
  if (/\b(list|show)\s+(all|every)\b/i.test(q)) {
    const rows = db.prepare(`
      SELECT c.*, COUNT(i.id) as interaction_count,
             MAX(i.occurred_at) as last_interaction
      FROM contacts c
      LEFT JOIN interactions i ON i.contact_id = c.id
      WHERE c.is_noise = 0 AND c.merged_into IS NULL
      GROUP BY c.id ORDER BY last_interaction DESC LIMIT 50
    `).all();
    printContacts(rows);
    return;
  }

  // "who haven't I talked to" / "stale" / "neglected"
  if (/haven.t.*(talk|spoke|contact|reach)|stale|neglect|dormant/i.test(q)) {
    const rows = db.prepare(`
      SELECT c.*, COUNT(i.id) as interaction_count,
             MAX(i.occurred_at) as last_interaction,
             CAST(julianday('now') - julianday(MAX(i.occurred_at)) AS INTEGER) as days_ago
      FROM contacts c
      LEFT JOIN interactions i ON i.contact_id = c.id
      WHERE c.is_noise = 0 AND c.merged_into IS NULL
      GROUP BY c.id
      HAVING days_ago > 30 OR last_interaction IS NULL
      ORDER BY days_ago DESC LIMIT 20
    `).all();
    console.log(`\n🕐 Contacts you haven't interacted with recently:\n`);
    printContacts(rows, true);
    return;
  }

  // "who do I know at X" / "contacts at X"
  const atMatch = q.match(/(?:know|contacts?|people|work)\s+(?:at|from)\s+(.+?)[\?.]?$/i);
  if (atMatch) {
    const company = atMatch[1].trim();
    // Try direct company match first
    const rows = db.prepare(`
      SELECT c.*, COUNT(i.id) as interaction_count,
             MAX(i.occurred_at) as last_interaction
      FROM contacts c
      LEFT JOIN interactions i ON i.contact_id = c.id
      WHERE c.is_noise = 0 AND c.merged_into IS NULL
      AND (c.company LIKE ? OR c.email LIKE ? OR c.name LIKE ?)
      GROUP BY c.id ORDER BY interaction_count DESC
    `).all(`%${company}%`, `%${company.toLowerCase()}%`, `%${company}%`);

    if (rows.length > 0) {
      console.log(`\n🏢 Contacts at "${company}":\n`);
      printContacts(rows);
      return;
    }
    // Fall through to vector search
  }

  // --- Vector similarity search ---
  console.log(`\n🔍 Searching: "${q}"\n`);

  const queryVec = await getEmbedding(q);
  const allEmbeddings = db.prepare(`
    SELECT e.contact_id, e.vector, e.text FROM embeddings e
    JOIN contacts c ON c.id = e.contact_id
    WHERE c.is_noise = 0 AND c.merged_into IS NULL
  `).all();

  const scored = allEmbeddings.map(row => ({
    contact_id: row.contact_id,
    text: row.text,
    score: cosineSimilarity(queryVec, blobToFloat32(row.vector)),
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 10).filter(s => s.score > 0.3);

  if (top.length === 0) {
    console.log('No matching contacts found.');
    return;
  }

  const ids = top.map(t => t.contact_id);
  const contacts = db.prepare(`
    SELECT c.*, COUNT(i.id) as interaction_count,
           MAX(i.occurred_at) as last_interaction
    FROM contacts c
    LEFT JOIN interactions i ON i.contact_id = c.id
    WHERE c.id IN (${ids.map(() => '?').join(',')})
    GROUP BY c.id
  `).all(...ids);

  // Sort by similarity score
  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
  const sorted = top.map(t => ({ ...contactMap[t.contact_id], similarity: t.score })).filter(Boolean);

  printContacts(sorted);
}

function printContacts(rows, showDays = false) {
  if (!rows.length) {
    console.log('No contacts found.');
    return;
  }

  for (const c of rows) {
    const parts = [
      c.name || '(unnamed)',
      `<${c.email}>`,
    ];
    if (c.company) parts.push(`@ ${c.company}`);
    if (c.role) parts.push(`(${c.role})`);
    if (c.how_known) parts.push(`- ${c.how_known}`);

    let meta = [];
    if (c.interaction_count) meta.push(`${c.interaction_count} interactions`);
    if (c.last_interaction) meta.push(`last: ${c.last_interaction.split('T')[0]}`);
    if (showDays && c.days_ago) meta.push(`${c.days_ago} days ago`);
    if (c.similarity) meta.push(`match: ${(c.similarity * 100).toFixed(0)}%`);

    console.log(`  👤 ${parts.join(' ')}`);
    if (meta.length) console.log(`     ${meta.join(' | ')}`);
  }
  console.log(`\n  Total: ${rows.length} contacts`);
}

runQuery(query).catch(e => {
  console.error('❌ Query failed:', e.message);
  process.exit(1);
});
