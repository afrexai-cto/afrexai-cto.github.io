#!/usr/bin/env node
/**
 * Creates all 13 forum topics in the Telegram supergroup and saves thread IDs to config.json.
 * Run once: node setup-topics.js
 * 
 * Prerequisites:
 * - Telegram supergroup with Topics enabled
 * - Bot added as admin with "Manage Topics" permission
 * - 1Password CLI authenticated (for secret resolution)
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const CONFIG_PATH = new URL('./config.json', import.meta.url).pathname;

function resolveSecret(ref) {
  if (!ref || !ref.startsWith('op://')) return ref;
  return execSync(`op read "${ref}"`, { encoding: 'utf8' }).trim();
}

async function main() {
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  const token = resolveSecret(config.telegram.botToken);
  const chatId = resolveSecret(config.telegram.chatId);
  const apiBase = config.telegram.apiBase;

  console.log(`Creating ${Object.keys(config.telegram.topics).length} forum topics...\n`);

  let created = 0;
  let skipped = 0;

  for (const [key, topic] of Object.entries(config.telegram.topics)) {
    if (topic.threadId) {
      console.log(`  ⏭  ${key} — already has threadId ${topic.threadId}`);
      skipped++;
      continue;
    }

    try {
      const res = await fetch(`${apiBase}/bot${token}/createForumTopic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          name: topic.name,
          icon_color: topic.iconColor
        })
      });

      const data = await res.json();
      if (!data.ok) {
        console.error(`  ❌ ${key} — ${data.description}`);
        continue;
      }

      config.telegram.topics[key].threadId = data.result.message_thread_id;
      console.log(`  ✅ ${key} — threadId: ${data.result.message_thread_id}`);
      created++;

      // Rate limit: 1 req/sec to be safe
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ❌ ${key} — ${err.message}`);
    }
  }

  // Save updated config with thread IDs
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
  console.log(`\nDone: ${created} created, ${skipped} skipped. Config saved.`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
