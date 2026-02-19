#!/usr/bin/env node
/**
 * check-keys.js — Check which API keys are configured in 1Password
 * Usage: node check-keys.js [--json] [--quiet]
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const GREEN = '\x1b[32m✅';
const RED = '\x1b[31m❌';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

// Load env template
const templatePath = path.join(__dirname, 'env-template.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

// Map: 1Password item/field → which systems depend on it
const KEY_SYSTEMS = {
  'ANTHROPIC_API_KEY': ['security-council', 'urgent-email-detection', 'platform-health', 'advisory-council'],
  'OPENAI_API_KEY': ['personal-crm', 'video-pipeline', 'knowledge-base'],
  'GEMINI_API_KEY': ['image-gen', 'video-analysis', 'knowledge-base'],
  'GCP_PROJECT_ID': ['video-gen'],
  'GCP_SERVICE_ACCOUNT_KEY': ['video-gen'],
  'GOOGLE_OAUTH_CLIENT_ID': ['google-workspace', 'urgent-email-detection', 'daily-briefing', 'personal-crm'],
  'GOOGLE_OAUTH_CLIENT_SECRET': ['google-workspace', 'urgent-email-detection', 'daily-briefing', 'personal-crm'],
  'GOOGLE_OAUTH_REFRESH_TOKEN': ['google-workspace', 'urgent-email-detection', 'daily-briefing', 'personal-crm'],
  'GOOGLE_WORKSPACE_CREDENTIALS': ['google-workspace'],
  'GOOGLE_WORKSPACE_ENCRYPTION_KEY': ['google-workspace'],
  'TELEGRAM_BOT_TOKEN': ['messaging-setup', 'daily-briefing', 'earnings-reports', 'health-monitoring'],
  'TELEGRAM_FORUM_CHAT_ID': ['messaging-setup'],
  'SLACK_BOT_TOKEN': ['messaging-setup', 'video-pipeline'],
  'SLACK_APP_TOKEN': ['video-pipeline'],
  'SLACK_SIGNING_SECRET': ['messaging-setup'],
  'ASANA_ACCESS_TOKEN': ['asana-integration', 'video-pipeline'],
  'ASANA_WORKSPACE_GID': ['asana-integration', 'video-pipeline'],
  'ASANA_VIDEO_PIPELINE_PROJECT_GID': ['video-pipeline'],
  'TWITTER_BEARER_TOKEN': ['social-tracker', 'video-pipeline'],
  'TWITTER_USER_ID': ['social-tracker'],
  'YOUTUBE_API_KEY': ['social-tracker'],
  'YOUTUBE_CHANNEL_ID': ['social-tracker'],
  'INSTAGRAM_ACCESS_TOKEN': ['social-tracker'],
  'INSTAGRAM_ACCOUNT_ID': ['social-tracker'],
  'TIKTOK_ACCESS_TOKEN': ['social-tracker'],
  'TIKTOK_USERNAME': ['social-tracker'],
  'BEEHIIV_API_KEY': ['newsletter-crm'],
  'BEEHIIV_PUBLICATION_ID': ['newsletter-crm'],
  'HUBSPOT_API_KEY': ['newsletter-crm'],
  'FMP_API_KEY': ['earnings-reports'],
  'ALPHA_VANTAGE_API_KEY': ['earnings-reports'],
  'FATHOM_API_KEY': ['meeting-actions'],
  'TODOIST_API_KEY': ['meeting-actions'],
  'TODOIST_PROJECT_ID': ['meeting-actions'],
  'BACKUP_ENC_PASS': ['db-backups'],
};

// Group keys by 1Password item for cleaner display
const ITEM_GROUPS = {};
for (const [key, ref] of Object.entries(template)) {
  const match = ref.match(/^op:\/\/AfrexAI\/([^/]+)\//);
  if (match) {
    const item = match[1];
    if (!ITEM_GROUPS[item]) ITEM_GROUPS[item] = [];
    ITEM_GROUPS[item].push(key);
  }
}

async function checkKey(envName, opRef) {
  try {
    execSync(`op read "${opRef}"`, { stdio: 'pipe', timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const quiet = args.includes('--quiet');

  // Check op CLI is available
  try {
    execSync('op --version', { stdio: 'pipe' });
  } catch {
    console.error('❌ 1Password CLI (op) not found. Install: https://developer.1password.com/docs/cli/get-started/');
    process.exit(1);
  }

  const results = {};
  let configured = 0;
  let total = 0;
  const blockedSystems = new Set();

  if (!quiet) {
    console.log(`\n${BOLD}🔑 API Key Configuration Check${RESET}\n`);
  }

  // Check each item group
  for (const [item, keys] of Object.entries(ITEM_GROUPS)) {
    if (!quiet) console.log(`${DIM}${item}${RESET}`);

    for (const key of keys) {
      total++;
      const ref = template[key];
      const ok = await checkKey(key, ref);
      results[key] = ok;

      if (ok) {
        configured++;
        if (!quiet) console.log(`  ${GREEN} ${key}${RESET}`);
      } else {
        if (!quiet) console.log(`  ${RED} ${key}${RESET}`);
        const systems = KEY_SYSTEMS[key] || [];
        systems.forEach(s => blockedSystems.add(s));
      }
    }

    if (!quiet) console.log();
  }

  // Summary
  const blocked = [...blockedSystems].sort();

  if (jsonMode) {
    console.log(JSON.stringify({ configured, total, results, blockedSystems: blocked }, null, 2));
  } else {
    console.log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`${BOLD}${configured}/${total} keys configured.${RESET}`);
    if (blocked.length > 0) {
      console.log(`${RED} Missing keys block: ${blocked.join(', ')}${RESET}`);
    } else {
      console.log(`${GREEN} All systems fully operational!${RESET}`);
    }
    console.log();
  }

  process.exit(blocked.length > 0 ? 1 : 0);
}

main();
