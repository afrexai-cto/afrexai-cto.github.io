#!/usr/bin/env node
import { getDb, closeDb } from './db.js';
import { getAllPersonas } from './personas/index.js';
import { collectAll } from './data-collectors/index.js';
import { synthesize, formatDigest } from './synthesizer.js';
import { getPreferences } from './feedback.js';
import { deepDive } from './deep-dive.js';
import { recordFeedback } from './feedback.js';

/**
 * Run a full advisory council session.
 * All 8 personas analyze in PARALLEL, then synthesizer merges results.
 */
export async function runSession(context = 'Scheduled advisory session') {
  const db = getDb();
  const startTime = Date.now();

  // 1. Create session
  const { lastInsertRowid: sessionId } = db.prepare('INSERT INTO sessions (context) VALUES (?)').run(context);
  console.log(`\n🏛️  Advisory Council Session #${sessionId}`);
  console.log(`Context: ${context}\n`);

  // 2. Collect all data in parallel
  console.log('📊 Collecting business data...');
  const allData = await collectAll();

  // 3. Load learned preferences
  const preferences = getPreferences();

  // 4. Run ALL personas in PARALLEL
  console.log('🧠 Running 8 expert analyses in parallel...');
  const personas = getAllPersonas();
  const results = await Promise.all(
    personas.map(async (p) => {
      const recs = await p.analyze(allData, preferences);
      console.log(`   ✓ ${p.name}: ${recs.length} findings`);
      return { persona: p.name, recs };
    })
  );

  // 5. Synthesize
  console.log('\n🔄 Synthesizing findings...');
  const numbered = synthesize(sessionId, results);

  // 6. Format and output
  const digest = formatDigest(numbered);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⏱️  Completed in ${elapsed}s\n`);
  console.log(digest);

  return { sessionId, digest, recommendations: numbered };
}

// CLI
if (process.argv[1]?.endsWith('council.js')) {
  const context = process.argv.slice(2).join(' ') || 'CLI advisory session';
  runSession(context)
    .then(({ sessionId, recommendations }) => {
      console.log(`\nSession ${sessionId}: ${recommendations.length} recommendations stored.`);

      // Demo: deep dive on #3
      if (recommendations.length >= 3) {
        console.log('\n' + '='.repeat(60));
        console.log('DEMO: Deep dive on #3');
        console.log('='.repeat(60));
        console.log(deepDive(sessionId, 3));
      }

      // Demo: feedback
      if (recommendations.length >= 1) {
        console.log('\n' + '='.repeat(60));
        console.log('DEMO: Approve #1, Reject #2');
        console.log('='.repeat(60));
        console.log(recordFeedback(sessionId, 1, 'approve', 'Top priority, address immediately'));
        console.log(recordFeedback(sessionId, 2, 'reject', 'Already being handled'));
      }

      closeDb();
    })
    .catch(e => { console.error(e); process.exit(1); });
}
