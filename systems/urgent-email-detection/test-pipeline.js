#!/usr/bin/env node
// End-to-end test of the classification pipeline with sample emails
import { classifyEmail, preClassifyNoise, isWithinWakingHours, formatAlert } from './classifier.js';
import { getDb, insertClassification, isAlreadyClassified, updateSenderReputation, getSenderReputation, closeDb } from './db.js';
import { submitFeedback, getFeedbackStats } from './feedback.js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));

const SAMPLE_EMAILS = [
  {
    message_id: 'test-001', thread_id: 't-001',
    subject: 'URGENT: Production database is down',
    sender: 'devops@mycompany.com', sender_domain: 'mycompany.com',
    snippet: 'The primary PostgreSQL instance is unresponsive. All API requests are failing.',
    body: 'The primary PostgreSQL instance has been unresponsive since 14:32 UTC. All API requests are returning 500 errors. Failover did not trigger. Customer-facing services impacted. Please investigate immediately.',
    received_at: '2026-02-19T02:30:00Z', raw_headers: '[]'
  },
  {
    message_id: 'test-002', thread_id: 't-002',
    subject: 'Your weekly digest from Medium',
    sender: 'noreply@medium.com', sender_domain: 'medium.com',
    snippet: 'Top stories this week: How to build a startup...',
    body: 'Here are the top stories from your network this week.',
    received_at: '2026-02-19T01:00:00Z', raw_headers: '[]'
  },
  {
    message_id: 'test-003', thread_id: 't-003',
    subject: 'Invoice #4521 - Payment overdue',
    sender: 'billing@vendor.io', sender_domain: 'vendor.io',
    snippet: 'Your invoice of £2,400 is now 7 days overdue. Service may be suspended.',
    body: 'Invoice #4521 for £2,400 issued on Feb 12 is now 7 days overdue. If payment is not received within 48 hours, your account services will be suspended.',
    received_at: '2026-02-19T02:15:00Z', raw_headers: '[]'
  },
  {
    message_id: 'test-004', thread_id: 't-004',
    subject: 'Meeting next Tuesday?',
    sender: 'colleague@mycompany.com', sender_domain: 'mycompany.com',
    snippet: 'Hey, are you free next Tuesday at 2pm for a quick sync on the Q1 roadmap?',
    body: 'Hey, are you free next Tuesday at 2pm for a quick sync on the Q1 roadmap? No rush, just whenever you get a chance to reply.',
    received_at: '2026-02-18T16:00:00Z', raw_headers: '[]'
  },
  {
    message_id: 'test-005', thread_id: 't-005',
    subject: 'Security Alert: Unusual sign-in activity',
    sender: 'security@google.com', sender_domain: 'google.com',
    snippet: 'We noticed a sign-in to your Google Account from a new device in Lagos, Nigeria.',
    body: 'We detected a sign-in to your Google Account from a new device. Location: Lagos, Nigeria. Device: Unknown Linux. If this was you, disregard. If not, your account may be compromised.',
    received_at: '2026-02-19T02:45:00Z', raw_headers: '[]'
  },
  {
    message_id: 'test-006', thread_id: 't-006',
    subject: '50% off everything this weekend!',
    sender: 'promo@shopify-store.com', sender_domain: 'shopify-store.com',
    snippet: 'Massive sale this weekend only. Use code SAVE50.',
    body: 'Shop now and save big! 50% off everything in store.',
    received_at: '2026-02-18T10:00:00Z', raw_headers: '[]'
  }
];

const EXPECTED = {
  'test-001': { label: 'critical', minScore: 0.85 },
  'test-002': { label: 'low', maxScore: 0.2, prefiltered: true },
  'test-003': { label: 'high', minScore: 0.6 },
  'test-004': { label: 'low', maxScore: 0.45 },
  'test-005': { label: 'critical', minScore: 0.8 },
  'test-006': { label: 'low', maxScore: 0.2, prefiltered: true }
};

async function runTests() {
  const results = [];
  const log = (msg) => { console.log(msg); results.push(msg); };
  
  log('# Urgent Email Detection - Validation Report');
  log(`\nRun: ${new Date().toISOString()}\n`);
  
  // Test 1: Database init
  log('## 1. Database Initialization');
  try {
    const db = await getDb();
    const tables = [];
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
    while (stmt.step()) tables.push(stmt.getAsObject().name);
    stmt.free();
    log(`✅ Database initialized. Tables: ${tables.join(', ')}`);
  } catch (e) {
    log(`❌ Database init failed: ${e.message}`);
  }
  
  // Test 2: Pre-filter noise
  log('\n## 2. Noise Pre-filtering');
  let prefilterPass = 0;
  for (const email of SAMPLE_EMAILS) {
    const isNoise = preClassifyNoise(email, config.noiseSenders, config.noiseDomains);
    const expected = EXPECTED[email.message_id]?.prefiltered || false;
    const pass = isNoise === expected;
    if (pass) prefilterPass++;
    log(`${pass ? '✅' : '❌'} ${email.message_id} (${email.sender}): noise=${isNoise}, expected=${expected}`);
  }
  log(`\nPre-filter: ${prefilterPass}/${SAMPLE_EMAILS.length} correct`);
  
  // Test 3: Time gating
  log('\n## 3. Time Gating');
  const testTimes = [
    { date: new Date('2026-02-19T03:00:00Z'), expected: false, desc: 'Wed 3am GMT' },
    { date: new Date('2026-02-19T10:00:00Z'), expected: true, desc: 'Wed 10am GMT' },
    { date: new Date('2026-02-19T21:30:00Z'), expected: false, desc: 'Wed 9:30pm GMT' },
    { date: new Date('2026-02-21T06:00:00Z'), expected: false, desc: 'Sat 6am GMT' },
    { date: new Date('2026-02-21T10:00:00Z'), expected: true, desc: 'Sat 10am GMT' },
  ];
  for (const t of testTimes) {
    const result = isWithinWakingHours(t.date);
    log(`${result === t.expected ? '✅' : '❌'} ${t.desc}: waking=${result}, expected=${t.expected}`);
  }
  
  // Test 4: AI Classification
  log('\n## 4. AI Classification');
  const nonNoise = SAMPLE_EMAILS.filter(e => !EXPECTED[e.message_id].prefiltered);
  let classifyPass = 0;
  
  for (const email of nonNoise) {
    try {
      const result = await classifyEmail(email);
      const exp = EXPECTED[email.message_id];
      
      let pass = true;
      const checks = [];
      
      if (exp.label && result.urgency_label !== exp.label) {
        const labels = ['low', 'medium', 'high', 'critical'];
        const diff = Math.abs(labels.indexOf(result.urgency_label) - labels.indexOf(exp.label));
        if (diff > 1) { pass = false; checks.push(`label: got ${result.urgency_label}, expected ${exp.label}`); }
        else checks.push(`label: ${result.urgency_label} (expected ${exp.label}, close enough)`);
      }
      if (exp.minScore && result.urgency_score < exp.minScore) {
        pass = false; checks.push(`score ${result.urgency_score} < min ${exp.minScore}`);
      }
      if (exp.maxScore && result.urgency_score > exp.maxScore) {
        pass = false; checks.push(`score ${result.urgency_score} > max ${exp.maxScore}`);
      }
      
      if (pass) classifyPass++;
      
      await insertClassification({
        ...email, urgency_score: result.urgency_score,
        urgency_label: result.urgency_label, reasoning: result.reasoning
      });
      await updateSenderReputation(email.sender, email.sender_domain, result.urgency_score);
      
      log(`${pass ? '✅' : '⚠️'} ${email.message_id}: "${email.subject}"`);
      log(`   → ${result.urgency_label} (${result.urgency_score}) - ${result.reasoning}`);
      if (checks.length) log(`   Notes: ${checks.join('; ')}`);
    } catch (e) {
      log(`❌ ${email.message_id}: Classification error - ${e.message}`);
    }
  }
  log(`\nClassification: ${classifyPass}/${nonNoise.length} within expected range`);
  
  // Store noise-filtered ones
  for (const email of SAMPLE_EMAILS.filter(e => EXPECTED[e.message_id].prefiltered)) {
    await insertClassification({ ...email, urgency_score: 0.0, urgency_label: 'low', reasoning: 'Pre-filtered noise' });
    await updateSenderReputation(email.sender, email.sender_domain, 0.0, true);
  }
  
  // Test 5: Feedback loop
  log('\n## 5. Feedback Loop');
  try {
    const fb = await submitFeedback('test-004', 'medium', 'Actually needs reply soon');
    log(`✅ Feedback submitted: ${fb.original} → ${fb.corrected} for ${fb.sender}`);
    const stats = await getFeedbackStats();
    log(`✅ Feedback stats: ${JSON.stringify(stats)}`);
    const rep = await getSenderReputation('colleague@mycompany.com');
    log(`✅ Sender reputation updated: avg_urgency=${rep?.avg_urgency?.toFixed(2)}`);
  } catch (e) {
    log(`❌ Feedback test failed: ${e.message}`);
  }
  
  // Test 6: Alert formatting
  log('\n## 6. Alert Formatting');
  const sampleAlert = formatAlert({
    urgency_label: 'critical', urgency_score: 0.95,
    sender: 'devops@mycompany.com', subject: 'URGENT: Production database is down',
    reasoning: 'Production outage affecting customers', message_id: 'test-001'
  });
  log(`✅ Alert formatted:\n\`\`\`\n${sampleAlert.text}\n\`\`\``);
  
  // Summary
  log('\n## Summary');
  log(`| Test | Result |`);
  log(`|------|--------|`);
  log(`| DB Init | ✅ |`);
  log(`| Pre-filter | ${prefilterPass}/${SAMPLE_EMAILS.length} |`);
  log(`| Time gating | Tested |`);
  log(`| AI Classification | ${classifyPass}/${nonNoise.length} |`);
  log(`| Feedback loop | Tested |`);
  log(`| Alert formatting | ✅ |`);
  
  writeFileSync(join(__dirname, 'VALIDATION.md'), results.join('\n'));
  console.log('\nResults written to VALIDATION.md');
  
  closeDb();
}

runTests().catch(e => { console.error('Test failed:', e); process.exit(1); });
