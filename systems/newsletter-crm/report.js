#!/usr/bin/env node
// Newsletter & CRM Report CLI
// Usage: node report.js [subscribers|deals|overview]

const { query } = require('./db');

const report = process.argv[2] || 'overview';

function subscriberReport() {
  console.log('\n📧 SUBSCRIBER REPORT');
  console.log('═'.repeat(50));

  const total = query(`SELECT COUNT(*) as c FROM subscribers`)[0].c;
  const active = query(`SELECT COUNT(*) as c FROM subscribers WHERE status='active'`)[0].c;
  const inactive = query(`SELECT COUNT(*) as c FROM subscribers WHERE status='inactive'`)[0].c;
  const newLast30 = query(`SELECT COUNT(*) as c FROM subscribers WHERE created_at >= datetime('now', '-30 days')`)[0].c;

  console.log(`Total Subscribers:  ${total}`);
  console.log(`Active:             ${active}`);
  console.log(`Inactive/Churned:   ${inactive}`);
  console.log(`Churn Rate:         ${total > 0 ? (inactive / total * 100).toFixed(1) : 0}%`);
  console.log(`New (30 days):      ${newLast30}`);

  const segments = query(`SELECT name, subscriber_count FROM subscriber_segments ORDER BY subscriber_count DESC`);
  if (segments.length) {
    console.log('\nSegments:');
    segments.forEach(s => console.log(`  • ${s.name}: ${s.subscriber_count}`));
  }

  const posts = query(`SELECT title, stats_open_rate, stats_click_rate, stats_recipients FROM posts ORDER BY publish_date DESC LIMIT 5`);
  if (posts.length) {
    console.log('\nRecent Posts:');
    posts.forEach(p => console.log(`  • ${p.title} — Open: ${(p.stats_open_rate * 100).toFixed(0)}%, Click: ${(p.stats_click_rate * 100).toFixed(0)}%, Sent: ${p.stats_recipients}`));
  }

  const bySource = query(`SELECT utm_source, COUNT(*) as c FROM subscribers WHERE utm_source IS NOT NULL GROUP BY utm_source ORDER BY c DESC`);
  if (bySource.length) {
    console.log('\nBy Source:');
    bySource.forEach(s => console.log(`  • ${s.utm_source}: ${s.c}`));
  }
}

function dealsReport() {
  console.log('\n💰 DEALS REPORT');
  console.log('═'.repeat(50));

  const active = query(`SELECT COUNT(*) as c, COALESCE(SUM(amount),0) as t FROM deals WHERE is_active=1`)[0];
  const won = query(`SELECT COUNT(*) as c, COALESCE(SUM(amount),0) as t FROM deals WHERE stage='closedwon'`)[0];
  const total = query(`SELECT COUNT(*) as c, COALESCE(SUM(amount),0) as t FROM deals`)[0];

  console.log(`Total Deals:        ${total.c}  ($${total.t.toLocaleString()})`);
  console.log(`Active Pipeline:    ${active.c}  ($${active.t.toLocaleString()})`);
  console.log(`Closed Won:         ${won.c}  ($${won.t.toLocaleString()})`);

  const byStage = query(`SELECT stage, COUNT(*) as c, COALESCE(SUM(amount),0) as t FROM deals GROUP BY stage ORDER BY c DESC`);
  if (byStage.length) {
    console.log('\nBy Stage:');
    byStage.forEach(s => console.log(`  • ${s.stage}: ${s.c} deals ($${s.t.toLocaleString()})`));
  }

  const contacts = query(`SELECT lifecycle_stage, COUNT(*) as c FROM contacts GROUP BY lifecycle_stage ORDER BY c DESC`);
  if (contacts.length) {
    console.log('\nContacts by Lifecycle:');
    contacts.forEach(c => console.log(`  • ${c.lifecycle_stage}: ${c.c}`));
  }
}

function overviewReport() {
  console.log('\n📊 OVERVIEW REPORT');
  console.log('═'.repeat(50));
  subscriberReport();
  dealsReport();

  console.log('\n🔄 SYNC LOG (Last 5)');
  console.log('─'.repeat(50));
  const logs = query(`SELECT platform, entity, count, status, finished_at FROM sync_log ORDER BY finished_at DESC LIMIT 5`);
  logs.forEach(l => console.log(`  ${l.finished_at} | ${l.platform}/${l.entity}: ${l.count} (${l.status})`));
}

switch (report) {
  case 'subscribers': subscriberReport(); break;
  case 'deals': dealsReport(); break;
  case 'overview': overviewReport(); break;
  default:
    console.error(`Unknown report: ${report}. Use: subscribers, deals, or overview`);
    process.exit(1);
}

console.log('');
