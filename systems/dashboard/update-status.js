#!/usr/bin/env node
/**
 * update-status.js — Scans each system directory and updates status.json
 * Run: node update-status.js
 */
const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = __dirname;
const SYSTEMS_DIR = path.resolve(DASHBOARD_DIR, '..');
const STATUS_FILE = path.join(DASHBOARD_DIR, 'status.json');

const SYSTEM_IDS = [
  'crm', 'briefing', 'email', 'calendar',
  'social-twitter', 'social-linkedin', 'social-ig',
  'advisory', 'finance', 'invoicing', 'legal', 'docs',
  'knowledge', 'voice', 'notifications', 'search',
  'browser', 'memory', 'heartbeat', 'cron',
  'security', 'analytics', 'media', 'travel', 'health', 'property'
];

const SYSTEM_NAMES = {
  'crm': 'CRM & Contacts', 'briefing': 'Daily Briefing', 'email': 'Email Intelligence',
  'calendar': 'Calendar Ops', 'social-twitter': 'Twitter / X', 'social-linkedin': 'LinkedIn',
  'social-ig': 'Instagram', 'advisory': 'Advisory Engine', 'finance': 'Finance Tracker',
  'invoicing': 'Invoicing', 'legal': 'Legal & Compliance', 'docs': 'Document Manager',
  'knowledge': 'Knowledge Base', 'voice': 'Voice & TTS', 'notifications': 'Notifications',
  'search': 'Web Search', 'browser': 'Browser Automation', 'memory': 'Memory System',
  'heartbeat': 'Heartbeat Monitor', 'cron': 'Cron Scheduler', 'security': 'Security & Vault',
  'analytics': 'Analytics', 'media': 'Media Processing', 'travel': 'Travel & Logistics',
  'health': 'Health & Wellness', 'property': 'Property Manager'
};

// Markers that indicate API keys are needed
const KEY_MARKERS = ['op://', 'API_KEY', 'SECRET', 'TOKEN'];

function checkSystem(id) {
  const dirs = [
    path.join(SYSTEMS_DIR, id),
    path.join(SYSTEMS_DIR, id.replace('-', '/')),
  ];
  const dir = dirs.find(d => fs.existsSync(d));

  const result = { id, name: SYSTEM_NAMES[id] || id, status: 'error', lastRun: null, tests: 0 };

  if (!dir) return result;

  // Count test files
  try {
    const files = fs.readdirSync(dir, { recursive: true }).map(String);
    result.tests = files.filter(f => /\.(test|spec)\.(js|ts|mjs)$/.test(f)).length;

    // Check for op.env → needs keys if no actual env set
    const opEnv = path.join(dir, 'op.env');
    if (fs.existsSync(opEnv)) {
      const content = fs.readFileSync(opEnv, 'utf8');
      if (KEY_MARKERS.some(m => content.includes(m))) {
        // Check if there's evidence of successful runs
        const hasOutput = files.some(f => /output|log|result/i.test(f));
        if (!hasOutput) {
          result.status = 'needs_keys';
          return result;
        }
      }
    }

    // Find most recent file modification as proxy for "last run"
    let latestMtime = 0;
    for (const f of files) {
      try {
        const stat = fs.statSync(path.join(dir, f));
        if (stat.mtimeMs > latestMtime) latestMtime = stat.mtimeMs;
      } catch {}
    }

    if (latestMtime > 0) {
      result.lastRun = new Date(latestMtime).toISOString();
      const ageHours = (Date.now() - latestMtime) / 3600000;
      result.status = ageHours < 24 ? 'running' : 'error';
    }
  } catch (e) {
    result.status = 'error';
  }

  return result;
}

function main() {
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8')); } catch {}

  const systems = SYSTEM_IDS.map(checkSystem);
  const running = systems.filter(s => s.status === 'running').length;
  const healthScore = Math.round((running / systems.length) * 100);
  const oldHealth = existing.healthScore || 0;

  const updated = {
    ...existing,
    lastUpdated: new Date().toISOString(),
    healthScore,
    healthTrend: healthScore > oldHealth ? 'up' : healthScore < oldHealth ? 'down' : 'stable',
    systems,
  };

  fs.writeFileSync(STATUS_FILE, JSON.stringify(updated, null, 2));
  console.log(`✅ Updated ${systems.length} systems | Health: ${healthScore}% (${running} running)`);
}

main();
