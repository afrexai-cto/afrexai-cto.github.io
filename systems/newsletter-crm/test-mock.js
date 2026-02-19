#!/usr/bin/env node
// Test suite with mock data
const fs = require('fs');

// Clean up previous test db
try { fs.unlinkSync('./data.db'); } catch {}

async function run() {
  const results = [];

  function test(name, fn) {
    try {
      fn();
      results.push({ name, pass: true });
      console.log(`  ✅ ${name}`);
    } catch (e) {
      results.push({ name, pass: false, error: e.message });
      console.log(`  ❌ ${name}: ${e.message}`);
    }
  }

  console.log('\n🧪 Running tests...\n');

  // 1. Sync
  console.log('Sync Tests:');
  const beehiiv = require('./platforms/beehiiv');
  const hubspot = require('./platforms/hubspot');

  const bResult = await beehiiv.syncAll();
  test('Beehiiv sync subscribers', () => { if (bResult.subscribers !== 5) throw new Error(`Expected 5, got ${bResult.subscribers}`); });
  test('Beehiiv sync posts', () => { if (bResult.posts !== 3) throw new Error(`Expected 3, got ${bResult.posts}`); });
  test('Beehiiv sync segments', () => { if (bResult.segments !== 3) throw new Error(`Expected 3, got ${bResult.segments}`); });

  const hResult = await hubspot.syncAll();
  test('HubSpot sync deals', () => { if (hResult.deals !== 4) throw new Error(`Expected 4, got ${hResult.deals}`); });
  test('HubSpot sync contacts', () => { if (hResult.contacts !== 4) throw new Error(`Expected 4, got ${hResult.contacts}`); });
  test('HubSpot sync pipelines', () => { if (hResult.pipelines !== 1) throw new Error(`Expected 1, got ${hResult.pipelines}`); });

  // 2. Query
  console.log('\nQuery Tests:');
  const { query } = require('./db');

  test('Subscribers in DB', () => {
    const r = query(`SELECT COUNT(*) as c FROM subscribers`);
    if (r[0].c !== 5) throw new Error(`Expected 5, got ${r[0].c}`);
  });

  test('Active subscribers', () => {
    const r = query(`SELECT COUNT(*) as c FROM subscribers WHERE status='active'`);
    if (r[0].c !== 4) throw new Error(`Expected 4, got ${r[0].c}`);
  });

  test('Deals in DB', () => {
    const r = query(`SELECT COUNT(*) as c FROM deals`);
    if (r[0].c !== 4) throw new Error(`Expected 4, got ${r[0].c}`);
  });

  test('Active deals value', () => {
    const r = query(`SELECT SUM(amount) as t FROM deals WHERE is_active=1`);
    if (r[0].t !== 96000) throw new Error(`Expected 96000, got ${r[0].t}`);
  });

  test('Posts open rates stored', () => {
    const r = query(`SELECT stats_open_rate FROM posts WHERE id='post_001'`);
    if (r[0].stats_open_rate !== 0.8) throw new Error(`Expected 0.8, got ${r[0].stats_open_rate}`);
  });

  // 3. Advisory data
  console.log('\nAdvisory Data Tests:');
  const bAdvisory = beehiiv.getAdvisoryData();
  test('Beehiiv advisory data structure', () => {
    if (bAdvisory.platform !== 'beehiiv') throw new Error('Wrong platform');
    if (typeof bAdvisory.summary.activeSubscribers !== 'number') throw new Error('Missing activeSubscribers');
    if (!Array.isArray(bAdvisory.recentPosts)) throw new Error('Missing recentPosts');
  });

  const hAdvisory = hubspot.getAdvisoryData();
  test('HubSpot advisory data structure', () => {
    if (hAdvisory.platform !== 'hubspot') throw new Error('Wrong platform');
    if (typeof hAdvisory.summary.activeDeals !== 'number') throw new Error('Missing activeDeals');
    if (!Array.isArray(hAdvisory.dealsByStage)) throw new Error('Missing dealsByStage');
  });

  // 4. Sync log
  console.log('\nSync Log Tests:');
  test('Sync log entries created', () => {
    const r = query(`SELECT COUNT(*) as c FROM sync_log WHERE status='success'`);
    if (r[0].c < 6) throw new Error(`Expected >=6 log entries, got ${r[0].c}`);
  });

  // Summary
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${'═'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length}`);

  // Write VALIDATION.md
  let md = `# VALIDATION.md - Newsletter & CRM Integration\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Mode:** Mock data (config.mock=true)\n\n`;
  md += `## Test Results\n\n`;
  md += `| Test | Status |\n|------|--------|\n`;
  results.forEach(r => { md += `| ${r.name} | ${r.pass ? '✅ Pass' : '❌ Fail: ' + r.error} |\n`; });
  md += `\n**Total: ${passed}/${results.length} passed**\n\n`;
  md += `## Sync Summary\n\n`;
  md += `- Beehiiv: ${bResult.subscribers} subscribers, ${bResult.posts} posts, ${bResult.segments} segments\n`;
  md += `- HubSpot: ${hResult.deals} deals, ${hResult.contacts} contacts, ${hResult.pipelines} pipelines\n\n`;
  md += `## Advisory Council Data Feed\n\n`;
  md += `### Beehiiv\n\`\`\`json\n${JSON.stringify(bAdvisory, null, 2)}\n\`\`\`\n\n`;
  md += `### HubSpot\n\`\`\`json\n${JSON.stringify(hAdvisory, null, 2)}\n\`\`\`\n`;

  fs.writeFileSync('./VALIDATION.md', md);
  console.log('\n📄 VALIDATION.md written');

  if (failed > 0) process.exit(1);
}

run();
