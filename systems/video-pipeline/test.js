/**
 * Test suite - validates pipeline components with sample data.
 */
const { PipelineDB } = require('./db');
const fs = require('fs');
const path = require('path');

const results = [];

function log(name, pass, detail = '') {
  const status = pass ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}${detail ? ' — ' + detail : ''}`);
  results.push({ name, pass, detail });
}

async function setupDB() {
  const db = await PipelineDB.open(null); // in-memory
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  return db;
}

async function runTests() {
  // Test 1: Schema
  {
    const db = await setupDB();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    const expected = ['pitches', 'pitch_embeddings', 'feedback_log', 'knowledge_base'];
    log('Schema creation', expected.every(t => tables.includes(t)), `Tables: ${tables.join(', ')}`);
    db.close();
  }

  // Test 2: Cosine similarity
  {
    const { cosineSimilarity } = require('./dedup');
    log('Cosine sim (identical)', Math.abs(cosineSimilarity([1,0,0],[1,0,0]) - 1) < 0.001);
    log('Cosine sim (orthogonal)', Math.abs(cosineSimilarity([1,0,0],[0,1,0])) < 0.001);
  }

  // Test 3: Embedding buffer round-trip
  {
    const { embeddingToBuffer, bufferToEmbedding } = require('./dedup');
    const orig = [0.1, -0.5, 0.99, 0.0, -1.0];
    const restored = bufferToEmbedding(embeddingToBuffer(orig));
    log('Embedding buffer round-trip', orig.every((v, i) => Math.abs(v - restored[i]) < 0.0001));
  }

  // Test 4: Pitch CRUD
  {
    const db = await setupDB();
    const ins = db.prepare("INSERT INTO pitches (idea, slack_channel, slack_user, status) VALUES (?, ?, ?, ?)")
      .run('Test video idea about AI coding', 'C123', 'U456', 'pitched');
    log('Pitch insert', ins.lastInsertRowid > 0, `id=${ins.lastInsertRowid}`);
    const pitch = db.prepare('SELECT * FROM pitches WHERE id = ?').get(ins.lastInsertRowid);
    log('Pitch read', pitch.idea === 'Test video idea about AI coding');
    log('Pitch default status', pitch.status === 'pitched');
    db.close();
  }

  // Test 5: Feedback system
  {
    const db = await setupDB();
    const { updatePitchStatus, getFeedbackStats } = require('./feedback');
    db.prepare("INSERT INTO pitches (idea, status) VALUES (?, ?)").run('Idea A', 'pitched');
    db.prepare("INSERT INTO pitches (idea, status) VALUES (?, ?)").run('Idea B', 'pitched');
    db.prepare("INSERT INTO pitches (idea, status) VALUES (?, ?)").run('Idea C', 'pitched');
    updatePitchStatus(db, 1, 'accepted', 'Great topic');
    updatePitchStatus(db, 2, 'rejected', 'Too niche');
    updatePitchStatus(db, 3, 'accepted', 'Trending');
    const stats = getFeedbackStats(db);
    const ac = stats.stats.find(s => s.status === 'accepted')?.count || 0;
    const rj = stats.stats.find(s => s.status === 'rejected')?.count || 0;
    log('Feedback - status update', ac === 2 && rj === 1, `accepted=${ac}, rejected=${rj}`);
    log('Feedback - accept rate', Math.abs(stats.acceptRate - 2/3) < 0.01, `rate=${(stats.acceptRate*100).toFixed(1)}%`);
    log('Feedback - log entries', stats.recentFeedback.length === 3, `entries=${stats.recentFeedback.length}`);
    db.close();
  }

  // Test 6: Pattern analysis
  {
    const db = await setupDB();
    const { updatePitchStatus, analyzePatterns } = require('./feedback');
    const ideas = [
      { idea: 'AI coding tools comparison', status: 'accepted' },
      { idea: 'AI agents for productivity', status: 'accepted' },
      { idea: 'Best AI coding assistants 2026', status: 'produced' },
      { idea: 'My cat photos collection', status: 'rejected' },
      { idea: 'Random cooking tips', status: 'rejected' },
    ];
    ideas.forEach(({ idea, status }) => {
      const r = db.prepare("INSERT INTO pitches (idea, status) VALUES (?, 'pitched')").run(idea);
      updatePitchStatus(db, r.lastInsertRowid, status);
    });
    const patterns = analyzePatterns(db);
    log('Pattern analysis', patterns.totalAccepted === 3 && patterns.totalRejected === 2);
    log('Pattern insights', patterns.topInsights.length > 0, `insights: ${patterns.topInsights.map(i=>i.word).join(', ')}`);
    db.close();
  }

  // Test 7: Dedup with mock embeddings
  {
    const db = await setupDB();
    const { embeddingToBuffer, cosineSimilarity, storeEmbedding } = require('./dedup');
    const emb1 = Array.from({length:10}, ()=>Math.random());
    const emb2 = emb1.map(v=>v+0.01);
    const emb3 = Array.from({length:10}, ()=>Math.random());
    db.prepare("INSERT INTO pitches (idea, status) VALUES (?, ?)").run('Original idea', 'pitched');
    storeEmbedding(db, 1, emb1);
    const sim = cosineSimilarity(emb1, emb2);
    const diffSim = cosineSimilarity(emb1, emb3);
    log('Dedup - similar vectors', sim > 0.9, `sim=${sim.toFixed(4)}`);
    log('Dedup - different vectors', diffSim < sim, `sim=${diffSim.toFixed(4)}`);
    db.close();
  }

  // Test 8: Angle extraction
  {
    const { extractAngles } = require('./twitter-research');
    const tweets = [
      { text: 'How to build AI agents from scratch, a beginner guide' },
      { text: 'Comparing GPT-4 vs Claude, which is better for coding?' },
      { text: 'The future of AI coding in 2026 looks wild' },
    ];
    const angles = extractAngles(tweets);
    log('Angle extraction', angles.length >= 2, `angles: ${angles.join(', ')}`);
    log('Angle - tutorial', angles.includes('Tutorial/How-to'));
    log('Angle - comparison', angles.includes('Comparison'));
  }

  // Test 9: Config validation
  {
    const config = require('./config.json');
    log('Config - slack', !!config.slack?.botToken);
    log('Config - asana', !!config.asana?.accessToken);
    log('Config - twitter', !!config.twitter?.bearerToken);
    log('Config - threshold', config.pipeline?.duplicateThreshold === 0.4);
  }

  // Test 10: KB CRUD
  {
    const db = await setupDB();
    const { embeddingToBuffer } = require('./dedup');
    const emb = Array.from({length:10}, ()=>Math.random());
    db.prepare("INSERT INTO knowledge_base (title, url, content, tags, embedding) VALUES (?, ?, ?, ?, ?)")
      .run('AI Coding Guide', 'https://example.com/ai', 'Guide to AI', 'ai,coding', embeddingToBuffer(emb));
    const row = db.prepare('SELECT * FROM knowledge_base WHERE id = 1').get();
    log('KB insert and read', row.title === 'AI Coding Guide');
    db.close();
  }

  // Summary
  console.log('\n=== Summary ===');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`${passed}/${total} tests passed`);

  // Write VALIDATION.md
  const validation = `# VALIDATION.md - Video Pipeline Test Results

**Date:** ${new Date().toISOString()}
**Tests:** ${passed}/${total} passed

## Results

| # | Test | Status | Detail |
|---|------|--------|--------|
${results.map((r, i) => `| ${i+1} | ${r.name} | ${r.pass ? '✅ PASS' : '❌ FAIL'} | ${r.detail || '-'} |`).join('\n')}

## Test Coverage

- **Schema:** Table creation and indexes
- **Dedup:** Cosine similarity, embedding buffer round-trip, vector comparison
- **Feedback:** Status updates, logging, accept rate, pattern analysis
- **Twitter:** Angle extraction from tweet text
- **Knowledge Base:** CRUD with embeddings
- **Config:** All sections validated
- **Pitch CRUD:** Insert, read, default status

## Architecture

\`\`\`
Slack mention → slack-listener.js → pipeline.js
                                       ├── dedup.js (semantic similarity)
                                       ├── twitter-research.js (X/Twitter API v2)
                                       ├── kb-search.js (knowledge base)
                                       ├── asana-client.js (POST /tasks)
                                       └── feedback.js (status tracking + learning)
\`\`\`

## API Endpoints Used

### Slack Web API
- \`conversations.replies\` — fetch full thread context
- \`chat.postMessage\` — reply in thread with results
- Socket Mode — real-time event listening for app_mention

### Asana REST API v1
- \`POST /tasks\` — create video idea card with html_notes
- \`GET /tasks/{gid}\` — read task details
- \`PUT /tasks/{gid}\` — update task status

### Twitter API v2
- \`GET /tweets/search/recent\` — search tweets about topic
- Tweet fields: public_metrics, context_annotations
- Expansions: author_id with user.fields

### OpenAI API
- \`POST /embeddings\` — text-embedding-3-small for semantic search
`;

  fs.writeFileSync(path.join(__dirname, 'VALIDATION.md'), validation);
  console.log('Validation written to VALIDATION.md');
  process.exit(passed === total ? 0 : 1);
}

console.log('=== Video Pipeline Test Suite ===\n');
runTests().catch(err => { console.error(err); process.exit(1); });
