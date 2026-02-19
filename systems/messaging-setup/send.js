#!/usr/bin/env node
/**
 * CLI: Send messages to Telegram forum topics.
 * 
 * Usage:
 *   node send.js --topic daily-brief "Your morning summary here"
 *   node send.js --topic earnings --file report.pdf "Q4 earnings report"
 *   node send.js --topic financials --unlock "Portfolio update"
 *   node send.js --topic cron-updates --failure "Build #42 failed"
 *   node send.js --list                    # list all topics
 */

import { parseArgs } from 'util';
import { MessageRouter } from './router.js';

const { values, positionals } = parseArgs({
  options: {
    topic:   { type: 'string', short: 't' },
    file:    { type: 'string', short: 'f' },
    unlock:  { type: 'boolean', default: false },
    failure: { type: 'boolean', default: false },
    silent:  { type: 'boolean', default: false },
    list:    { type: 'boolean', short: 'l', default: false },
    help:    { type: 'boolean', short: 'h', default: false }
  },
  allowPositionals: true
});

if (values.help) {
  console.log(`
Usage: node send.js --topic <topic> [options] "message"

Options:
  --topic, -t    Target topic (e.g. daily-brief, earnings, crm)
  --file, -f     Attach a file (sends actual file, not link)
  --unlock       Required for locked topics (financials)
  --failure      Mark as failure (required for cron-updates)
  --silent       Send without notification
  --list, -l     List all available topics
  --help, -h     Show this help
`);
  process.exit(0);
}

const router = new MessageRouter();

if (values.list) {
  console.log('\nAvailable topics:\n');
  for (const t of router.listTopics()) {
    const status = t.ready ? '✅' : '⚠️  (no threadId)';
    console.log(`  ${status} ${t.topic.padEnd(18)} ${t.name}`);
    console.log(`     types: ${t.contentTypes.join(', ')}`);
  }
  process.exit(0);
}

if (!values.topic) {
  console.error('Error: --topic is required. Use --list to see topics, --help for usage.');
  process.exit(1);
}

const message = positionals.join(' ');
if (!message && !values.file) {
  console.error('Error: provide a message or --file.');
  process.exit(1);
}

try {
  const result = await router.route(values.topic, message || '', {
    filePath: values.file,
    unlocked: values.unlock,
    isFailure: values.failure,
    silent: values.silent
  });

  if (result) {
    console.log(`✅ Sent to ${values.topic}`);
  } else {
    console.log(`⏭  Skipped (filtered).`);
  }
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}
