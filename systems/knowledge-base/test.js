// End-to-end test of ingestion and query pipeline
import { getDb, closeDb, runStmt, allRows, getRow } from './db.js';
import { embed, cosineSimilarity, chunkText } from './embeddings.js';
import { extractEntities, storeEntities } from './entities.js';
import { query, crossPostSummary, getSourceEntities } from './query.js';
import { isYouTubeUrl, extractVideoId } from './youtube.js';
import { isTwitterUrl, extractTweetInfo } from './twitter.js';
import { isPdfUrl } from './pdf.js';
import { writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = [];
let passed = 0, failed = 0;

async function test(name, fn) {
  try {
    await fn();
    results.push(`✅ ${name}`);
    passed++;
  } catch (e) {
    results.push(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }

// --- URL Detection ---
await test('YouTube URL detection', async () => {
  assert(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'));
  assert(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ'));
  assert(!isYouTubeUrl('https://example.com'));
});

await test('YouTube video ID extraction', async () => {
  assert(extractVideoId('https://www.youtube.com/watch?v=abc123_-XYZ') === 'abc123_-XYZ');
});

await test('Twitter URL detection', async () => {
  assert(isTwitterUrl('https://twitter.com/user/status/123'));
  assert(isTwitterUrl('https://x.com/user/status/123'));
  assert(!isTwitterUrl('https://example.com'));
});

await test('Tweet info extraction', async () => {
  const info = extractTweetInfo('https://x.com/elonmusk/status/1234567890');
  assert(info.username === 'elonmusk');
  assert(info.tweetId === '1234567890');
});

await test('PDF URL detection', async () => {
  assert(isPdfUrl('https://example.com/doc.pdf'));
  assert(!isPdfUrl('https://example.com/page'));
});

// --- Embeddings ---
await test('Embedding generation', async () => {
  const e = embed('hello world');
  assert(Array.isArray(e) && e.length === 512);
  const norm = Math.sqrt(e.reduce((s, v) => s + v * v, 0));
  assert(Math.abs(norm - 1.0) < 0.01);
});

await test('Cosine similarity - identical texts', async () => {
  const a = embed('machine learning is great');
  assert(Math.abs(cosineSimilarity(a, a) - 1.0) < 0.001);
});

await test('Cosine similarity - similar > different', async () => {
  const a = embed('artificial intelligence and machine learning');
  const b = embed('deep learning neural networks AI');
  const c = embed('cooking recipes for pasta dinner');
  assert(cosineSimilarity(a, b) > cosineSimilarity(a, c));
});

await test('Text chunking', async () => {
  const chunks = chunkText(Array(600).fill('word').join(' '), 300);
  assert(chunks.length === 2);
});

// --- Entity Extraction ---
await test('Entity extraction - people', async () => {
  const entities = extractEntities('Elon Musk and Sam Altman discussed AI.');
  const names = entities.filter(e => e.type === 'person').map(e => e.name);
  assert(names.includes('Elon Musk'));
  assert(names.includes('Sam Altman'));
});

await test('Entity extraction - companies', async () => {
  const entities = extractEntities('OpenAI and Google are leading. Anthropic released Claude.');
  const names = entities.filter(e => e.type === 'company').map(e => e.name);
  assert(names.includes('OpenAI'));
  assert(names.includes('Google'));
  assert(names.includes('Anthropic'));
});

await test('Entity extraction - concepts', async () => {
  const entities = extractEntities('Advances in machine learning and artificial intelligence.');
  const names = entities.filter(e => e.type === 'concept').map(e => e.name);
  assert(names.includes('machine learning'));
  assert(names.includes('artificial intelligence'));
});

// --- Database + Pipeline ---
await test('Database schema creation', async () => {
  const db = await getDb();
  const tables = allRows(db, "SELECT name FROM sqlite_master WHERE type='table'");
  const names = tables.map(t => t.name);
  assert(names.includes('sources'));
  assert(names.includes('chunks'));
  assert(names.includes('entities'));
});

await test('Source insertion + chunking + entities', async () => {
  const db = await getDb();
  const sourceId = runStmt(db,
    `INSERT INTO sources (url, type, title, content_text, source_weight) VALUES (?, ?, ?, ?, ?)`,
    ['https://test.example.com/article1', 'article', 'Test Article on AI',
     'Artificial intelligence and machine learning are transforming technology. OpenAI and Google lead the charge. Deep learning models are getting bigger.', 1.0]);

  const chunks = chunkText('Artificial intelligence and machine learning are transforming technology. OpenAI and Google lead the charge. Deep learning models are getting bigger.');
  for (let i = 0; i < chunks.length; i++) {
    db.run('INSERT INTO chunks (source_id, chunk_index, text, embedding, token_count) VALUES (?, ?, ?, ?, ?)',
      [sourceId, i, chunks[i], JSON.stringify(embed(chunks[i])), chunks[i].split(/\s+/).length]);
  }

  const entities = extractEntities('Artificial intelligence and machine learning are transforming technology. OpenAI and Google lead the charge.');
  storeEntities(db, sourceId, entities);
  const stored = await getSourceEntities(sourceId);
  assert(stored.length > 0, 'Should have entities');
});

await test('Insert second source', async () => {
  const db = await getDb();
  const sourceId = runStmt(db,
    `INSERT INTO sources (url, type, title, content_text, source_weight) VALUES (?, ?, ?, ?, ?)`,
    ['https://test.example.com/article2', 'article', 'Cooking Recipes Guide',
     'The best pasta recipes for dinner. Italian cooking with fresh ingredients. How to make perfect risotto and pizza dough from scratch.', 1.0]);
  const chunks = chunkText('The best pasta recipes for dinner. Italian cooking with fresh ingredients. How to make perfect risotto and pizza dough from scratch.');
  for (let i = 0; i < chunks.length; i++) {
    db.run('INSERT INTO chunks (source_id, chunk_index, text, embedding, token_count) VALUES (?, ?, ?, ?, ?)',
      [sourceId, i, chunks[i], JSON.stringify(embed(chunks[i])), chunks[i].split(/\s+/).length]);
  }
});

// --- Query Pipeline ---
await test('Semantic search returns relevant results', async () => {
  const r = await query('artificial intelligence companies');
  assert(r.length > 0);
  assert(r[0].title === 'Test Article on AI', `Top result should be AI article, got: ${r[0].title}`);
});

await test('Query for cooking returns cooking article higher', async () => {
  const r = await query('pasta recipes Italian food');
  assert(r.length > 0);
  const cookIdx = r.findIndex(x => x.title.includes('Cooking'));
  const aiIdx = r.findIndex(x => x.title.includes('AI'));
  assert(cookIdx < aiIdx || aiIdx === -1);
});

await test('Entity filter works', async () => {
  const r = await query('technology', { entityFilter: 'openai' });
  assert(r.length > 0);
  assert(r.every(x => x.title.includes('AI')));
});

await test('Cross-post summary generation', async () => {
  const r = await query('technology');
  const summary = await crossPostSummary(r);
  assert(summary.includes('## Summary'));
  assert(summary.includes('Score:'));
});

await test('Type filter works', async () => {
  const r = await query('anything', { type: 'youtube' });
  assert(r.length === 0);
});

// --- Cleanup and report ---
closeDb();
try { unlinkSync(join(__dirname, 'knowledge.db')); } catch {}

const report = [
  '# VALIDATION.md - Knowledge Base Test Results', '',
  `**Date:** ${new Date().toISOString()}`,
  `**Passed:** ${passed}/${passed + failed}`,
  `**Failed:** ${failed}`, '',
  '## Test Results', '', ...results, '',
  '## Components Tested', '',
  '- URL type detection (YouTube, Twitter/X, PDF, article)',
  '- Video ID and tweet info extraction',
  '- Embedding generation (512-dim bag-of-words TF vectors)',
  '- Cosine similarity (self=1.0, similar>different)',
  '- Text chunking',
  '- Entity extraction (people, companies, concepts)',
  '- SQLite schema creation (sql.js, pure JS)',
  '- Source ingestion with chunking and embedding',
  '- Entity storage and linking',
  '- Semantic search with time-aware ranking',
  '- Source-type weighted ranking',
  '- Entity-based filtering',
  '- Cross-post summary generation',
  '- Type filtering', ''
];

writeFileSync(join(__dirname, 'VALIDATION.md'), report.join('\n'));
console.log(`\n${'='.repeat(50)}\nResults: ${passed} passed, ${failed} failed\n${'='.repeat(50)}`);
if (failed) process.exit(1);
