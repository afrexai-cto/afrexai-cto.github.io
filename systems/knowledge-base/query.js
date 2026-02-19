// Semantic search with time-aware and source-weighted ranking
import { getDb, closeDb, allRows } from './db.js';
import { embed, cosineSimilarity } from './embeddings.js';

function timeDecay(ingestedAt, halfLifeDays = 30) {
  const age = (Date.now() - new Date(ingestedAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, age / halfLifeDays);
}

export async function query(text, options = {}) {
  const { limit = 10, type = null, minScore = 0.05, timeWeight = 0.3, entityFilter = null } = options;
  const db = await getDb();
  const queryEmb = embed(text);

  let sql = `SELECT c.id, c.text, c.embedding, c.source_id, c.chunk_index,
    s.title, s.url, s.type, s.author, s.ingested_at, s.published_at, s.source_weight, s.summary
    FROM chunks c JOIN sources s ON c.source_id = s.id`;
  const params = [];
  if (type) { sql += ' WHERE s.type = ?'; params.push(type); }

  const rows = allRows(db, sql, params);

  let results = rows.map(row => {
    const chunkEmb = JSON.parse(row.embedding);
    const semantic = cosineSimilarity(queryEmb, chunkEmb);
    const time = timeDecay(row.published_at || row.ingested_at);
    const weight = row.source_weight || 1.0;
    const score = (semantic * (1 - timeWeight) + time * timeWeight) * weight;

    return {
      chunkId: row.id, sourceId: row.source_id, chunkIndex: row.chunk_index,
      text: row.text, title: row.title, url: row.url, type: row.type,
      author: row.author, date: row.published_at || row.ingested_at,
      semantic, timeScore: time, score
    };
  });

  if (entityFilter) {
    const entitySources = allRows(db,
      `SELECT DISTINCT se.source_id FROM source_entities se
       JOIN entities e ON se.entity_id = e.id WHERE e.canonical_name LIKE ?`,
      [`%${entityFilter.toLowerCase()}%`]);
    const sourceIds = new Set(entitySources.map(r => r.source_id));
    results = results.filter(r => sourceIds.has(r.sourceId));
  }

  results.sort((a, b) => b.score - a.score);
  const seen = new Set();
  const deduped = [];
  for (const r of results) {
    if (!seen.has(r.sourceId) && r.semantic >= minScore) {
      seen.add(r.sourceId);
      deduped.push(r);
    }
    if (deduped.length >= limit) break;
  }
  return deduped;
}

export async function getSourceEntities(sourceId) {
  const db = await getDb();
  return allRows(db,
    `SELECT e.name, e.type, se.relevance FROM source_entities se
     JOIN entities e ON se.entity_id = e.id WHERE se.source_id = ? ORDER BY se.relevance DESC`,
    [sourceId]);
}

export async function getCrossRefs(sourceId) {
  const db = await getDb();
  return allRows(db,
    `SELECT s.id, s.title, s.url, s.type, cr.relationship FROM cross_references cr
     JOIN sources s ON cr.linked_source_id = s.id WHERE cr.source_id = ?`,
    [sourceId]);
}

export async function crossPostSummary(results) {
  if (!results.length) return 'No results found.';
  const lines = [`## Summary (${results.length} sources)\n`];
  for (const r of results) {
    const entities = await getSourceEntities(r.sourceId);
    const entityStr = entities.slice(0, 5).map(e => e.name).join(', ');
    lines.push(`### ${r.title}`);
    lines.push(`- **Source:** ${r.url}`);
    lines.push(`- **Type:** ${r.type} | **Score:** ${r.score.toFixed(3)}`);
    if (entityStr) lines.push(`- **Entities:** ${entityStr}`);
    lines.push(`- **Excerpt:** ${r.text.slice(0, 200)}...`);
    lines.push('');
  }
  return lines.join('\n');
}

if (process.argv[1]?.endsWith('query.js') && process.argv.length > 2) {
  const q = process.argv.slice(2).join(' ');
  console.log(`\nQuerying: "${q}"\n`);
  const results = await query(q);
  if (!results.length) console.log('No results found.');
  else console.log(await crossPostSummary(results));
  closeDb();
}
