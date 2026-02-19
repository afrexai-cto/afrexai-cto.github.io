#!/usr/bin/env node
/**
 * Test routing logic without making API calls.
 * Validates: topic resolution, content-type mapping, filters, locks.
 */

import { readFileSync } from 'fs';

const CONFIG_PATH = new URL('./config.json', import.meta.url).pathname;
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

// Inline router logic for testing (no API calls needed)
const CONTENT_TYPE_MAP = {
  'daily-brief':      ['daily-brief', 'morning-summary', 'daily-report'],
  'crm':              ['crm', 'contact', 'lead', 'deal', 'pipeline'],
  'email':            ['email', 'inbox', 'mail'],
  'knowledge-base':   ['knowledge', 'kb', 'wiki', 'reference', 'doc'],
  'meta-analysis':    ['meta', 'analysis', 'insight', 'pattern'],
  'video-ideas':      ['video', 'youtube', 'content-idea', 'thumbnail'],
  'earnings':         ['earnings', 'revenue', 'income', 'payout'],
  'cron-updates':     ['cron', 'cron-failure', 'job-failure', 'scheduler'],
  'financials':       ['financial', 'bank', 'investment', 'portfolio', 'tax'],
  'health':           ['health', 'workout', 'sleep', 'nutrition', 'medical'],
  'security':         ['security', 'alert', 'breach', 'auth', 'access'],
  'advisory-council': ['advisory', 'council', 'strategy', 'decision'],
  'action-items':     ['action', 'todo', 'task', 'followup', 'reminder']
};

const typeToTopic = {};
for (const [topic, types] of Object.entries(CONTENT_TYPE_MAP)) {
  for (const t of types) typeToTopic[t] = topic;
}

function resolve(input) {
  const key = input.toLowerCase().trim();
  if (config.telegram.topics[key]) return key;
  if (typeToTopic[key]) return typeToTopic[key];
  return null;
}

// --- Tests ---
let pass = 0, fail = 0;

function assert(name, condition) {
  if (condition) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); }
}

console.log('\n=== Topic Resolution ===\n');

// Direct topic names
assert('direct: daily-brief', resolve('daily-brief') === 'daily-brief');
assert('direct: crm', resolve('crm') === 'crm');
assert('direct: financials', resolve('financials') === 'financials');
assert('direct: action-items', resolve('action-items') === 'action-items');

// Content type aliases
assert('alias: lead → crm', resolve('lead') === 'crm');
assert('alias: inbox → email', resolve('inbox') === 'email');
assert('alias: youtube → video-ideas', resolve('youtube') === 'video-ideas');
assert('alias: revenue → earnings', resolve('revenue') === 'earnings');
assert('alias: workout → health', resolve('workout') === 'health');
assert('alias: breach → security', resolve('breach') === 'security');
assert('alias: todo → action-items', resolve('todo') === 'action-items');
assert('alias: wiki → knowledge-base', resolve('wiki') === 'knowledge-base');
assert('alias: strategy → advisory-council', resolve('strategy') === 'advisory-council');
assert('alias: portfolio → financials', resolve('portfolio') === 'financials');
assert('alias: cron-failure → cron-updates', resolve('cron-failure') === 'cron-updates');
assert('alias: morning-summary → daily-brief', resolve('morning-summary') === 'daily-brief');

// Unknown type
assert('unknown: "random" → null', resolve('random') === null);
assert('unknown: "" → null', resolve('') === null);

console.log('\n=== Config Validation ===\n');

// 13 topics exist
const topicKeys = Object.keys(config.telegram.topics);
assert(`13 topics defined (got ${topicKeys.length})`, topicKeys.length === 13);

// Cron filter
assert('cron-updates has failures-only filter', config.telegram.topics['cron-updates'].filter === 'failures-only');

// Financials locked
assert('financials is locked', config.telegram.topics['financials'].locked === true);

// All topics have names
assert('all topics have names', topicKeys.every(k => config.telegram.topics[k].name));

console.log('\n=== Slack Config ===\n');

assert('Slack mode is mention-only', config.slack.mode === 'mention-only');
assert('Auto-react emoji is eyes', config.slack.autoReactEmoji === 'eyes');
assert('Max messages per task is 2', config.slack.maxMessagesPerTask === 2);

console.log('\n=== No Cross-Posting (Isolation) ===\n');

// Verify no content type maps to multiple topics
const allTypes = Object.values(CONTENT_TYPE_MAP).flat();
const uniqueTypes = new Set(allTypes);
assert(`all ${allTypes.length} content types are unique (no duplicates)`, allTypes.length === uniqueTypes.size);

// Verify every topic has at least one content type
for (const key of topicKeys) {
  assert(`${key} has content types`, !!CONTENT_TYPE_MAP[key]?.length);
}

console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);
