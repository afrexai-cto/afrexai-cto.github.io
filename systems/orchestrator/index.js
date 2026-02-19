#!/usr/bin/env node
/**
 * Master Orchestrator — runs all 26 systems on schedule.
 * Routes outputs to Telegram topics via messaging-setup router.
 * Logs every run to model-cost-tracker.
 * Pipes data between systems via wiring.js.
 *
 * Usage: node index.js
 *   --once <jobId>   Run a single job immediately and exit
 *   --dry-run        Print schedule without starting
 *   --list           List all jobs
 */

import { readFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import { pullDataFor, securitySystems } from './wiring.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SYSTEMS_DIR = resolve(__dirname, '..');
const schedule = JSON.parse(readFileSync(join(__dirname, 'schedule.json'), 'utf8'));

// ── Lazy-loaded shared modules ──────────────────────────────────────────

let _router = null;
async function getRouter() {
  if (!_router) {
    try {
      const { MessageRouter } = await import(join(SYSTEMS_DIR, 'messaging-setup/router.js'));
      _router = new MessageRouter();
    } catch (e) {
      console.warn('[orchestrator] Router unavailable:', e.message);
      _router = { route: async (topic, msg) => console.log(`[${topic}] ${msg.slice(0, 120)}`) };
    }
  }
  return _router;
}

let _costDb = null;
function getCostDb() {
  if (!_costDb) {
    try {
      const dbMod = join(SYSTEMS_DIR, 'model-cost-tracker/db.js');
      // Synchronous import isn't possible for ESM; use a thin wrapper
      _costDb = { ready: false, path: dbMod };
    } catch { _costDb = null; }
  }
  return _costDb;
}

// ── Cost tracking ───────────────────────────────────────────────────────

async function logRun(jobId, system, status, durationMs, output) {
  try {
    const { getDb } = await import(join(SYSTEMS_DIR, 'model-cost-tracker/db.js'));
    const db = getDb();
    db.prepare(`
      INSERT INTO runs (job_id, system, status, duration_ms, output_preview, ts)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(jobId, system, status, durationMs, (output || '').slice(0, 500));
  } catch {
    // Cost tracker DB may not have 'runs' table yet — create it
    try {
      const { getDb } = await import(join(SYSTEMS_DIR, 'model-cost-tracker/db.js'));
      const db = getDb();
      db.exec(`CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT, system TEXT, status TEXT,
        duration_ms INTEGER, output_preview TEXT, ts TEXT
      )`);
      db.prepare(`
        INSERT INTO runs (job_id, system, status, duration_ms, output_preview, ts)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(jobId, system, status, durationMs, (output || '').slice(0, 500));
    } catch (e) {
      console.warn(`[cost-tracker] Failed to log run: ${e.message}`);
    }
  }
}

// ── System runners ──────────────────────────────────────────────────────

const runners = {
  // JS-based systems: import and call
  'advisory-council': async (action, pipeData) => {
    const { runSession } = await import(join(SYSTEMS_DIR, 'advisory-council/council.js'));
    return await runSession(pipeData ? JSON.stringify(pipeData) : 'Scheduled session');
  },

  'asana-integration': async (action) => {
    return execRun('node', [join(SYSTEMS_DIR, 'asana-integration/sync.js'), `--${action}`]);
  },

  'daily-briefing': async (action, pipeData) => {
    // Briefing is a top-level script; run it
    const dateStr = new Date().toISOString().slice(0, 10);
    return execRun('node', [join(SYSTEMS_DIR, 'daily-briefing/briefing.js'), `--date=${dateStr}`]);
  },

  'db-backups': async () => {
    return execRun('bash', [join(SYSTEMS_DIR, 'db-backups/backup.sh')]);
  },

  'earnings-reports': async (action) => {
    return execRun('node', [join(SYSTEMS_DIR, 'earnings-reports/earnings-calendar.js'), action]);
  },

  'git-auto-sync': async () => {
    return execRun('bash', [join(SYSTEMS_DIR, 'git-auto-sync/sync.sh')]);
  },

  'google-workspace': async () => {
    return execRun('node', [join(SYSTEMS_DIR, 'google-workspace/calendar.js'), '--sync']);
  },

  'health-monitoring': async (action) => {
    return execRun('node', [join(SYSTEMS_DIR, 'health-monitoring/monitor.js'), `--${action}`]);
  },

  'health-tracker': async (action, pipeData) => {
    const label = pipeData?.label || 'morning';
    return execRun('node', [join(SYSTEMS_DIR, 'health-tracker/reminders.js'), label]);
  },

  'knowledge-base': async (action) => {
    return execRun('node', [join(SYSTEMS_DIR, 'knowledge-base/ingest.js')]);
  },

  'meeting-actions': async (action) => {
    if (action === 'fathom-poll') {
      return execRun('node', [join(SYSTEMS_DIR, 'meeting-actions/fathom-client.js'), 'poll']);
    }
    if (action === 'completion-check') {
      return execRun('node', [join(SYSTEMS_DIR, 'meeting-actions/approval-queue.js'), '--check']);
    }
    return execRun('node', [join(SYSTEMS_DIR, 'meeting-actions/action-extractor.js')]);
  },

  'messaging-setup': async () => { return 'Router is always-on — no scheduled action.'; },

  'model-cost-tracker': async (action) => {
    return execRun('node', ['-e', `
      import('${join(SYSTEMS_DIR, 'model-cost-tracker/db.js')}').then(({getDb}) => {
        const db = getDb();
        const row = db.prepare("SELECT SUM(total_cost) as total FROM api_calls WHERE date(created_at) = date('now')").get();
        console.log(JSON.stringify({ dailyCost: row?.total || 0 }));
      })
    `]);
  },

  'newsletter-crm': async () => {
    return execRun('node', [join(SYSTEMS_DIR, 'newsletter-crm/db.js'), '--sync']);
  },

  'personal-crm': async (action) => {
    return execRun('node', [join(SYSTEMS_DIR, 'personal-crm/enrichment.js')]);
  },

  'platform-health': async () => {
    return execRun('node', [join(SYSTEMS_DIR, 'platform-health/health-check.js')]);
  },

  'prompt-engineering': async () => { return 'Reference system — no scheduled action.'; },

  'security-council': async (action) => {
    return execRun('node', [join(SYSTEMS_DIR, 'security-council/analyzer.js'), action || 'nightly']);
  },

  'security-safety': async (action) => {
    if (action === 'memory-scan') {
      return execRun('node', [join(SYSTEMS_DIR, 'security-safety/memory-scanner.js')]);
    }
    return execRun('node', [join(SYSTEMS_DIR, 'security-safety/gateway-verify.js')]);
  },

  'social-tracker': async (action) => {
    if (action === 'snapshot') {
      return execRun('node', [join(SYSTEMS_DIR, 'social-tracker/snapshot.js')]);
    }
    return execRun('node', [join(SYSTEMS_DIR, 'social-tracker/report.js'), 'today']);
  },

  'urgent-email-detection': async () => {
    return execRun('node', [join(SYSTEMS_DIR, 'urgent-email-detection/classifier.js'), '--scan']);
  },

  'video-analysis': async () => { return 'On-demand system — no scheduled action.'; },
  'video-gen': async () => { return 'On-demand system — no scheduled action.'; },

  'video-pipeline': async (action) => {
    return execRun('node', [join(SYSTEMS_DIR, 'video-pipeline/pipeline.js'), '--check']);
  },

  'humanizer': async () => { return 'On-demand system — no scheduled action.'; },
  'image-gen': async () => { return 'On-demand system — no scheduled action.'; },
};

function execRun(cmd, args, timeoutMs = 120000) {
  return new Promise((resolve) => {
    let output = '';
    const proc = spawn(cmd, args, {
      timeout: timeoutMs,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_NO_WARNINGS: '1' }
    });
    proc.stdout.on('data', d => { output += d.toString(); });
    proc.stderr.on('data', d => { output += d.toString(); });
    proc.on('close', code => {
      resolve(code === 0 ? output : `EXIT ${code}: ${output.slice(-1000)}`);
    });
    proc.on('error', e => resolve(`SPAWN ERROR: ${e.message}`));
  });
}

// ── Cron parser (minimal, handles our schedule.json patterns) ───────────

function parseCron(expr) {
  const parts = expr.split(' ');
  if (parts.length !== 5) throw new Error(`Invalid cron: ${expr}`);
  return { minute: parts[0], hour: parts[1], dom: parts[2], month: parts[3], dow: parts[4] };
}

function matchesCronField(field, value) {
  if (field === '*') return true;
  // Ranges like 9-18
  if (field.includes('-') && !field.includes('/') && !field.includes(',')) {
    const [lo, hi] = field.split('-').map(Number);
    return value >= lo && value <= hi;
  }
  // Steps like */5, */30
  if (field.startsWith('*/')) {
    const step = Number(field.slice(2));
    return value % step === 0;
  }
  // Ranges with steps like 9-18/5 (unlikely but handle)
  if (field.includes('-') && field.includes('/')) {
    const [range, step] = field.split('/');
    const [lo, hi] = range.split('-').map(Number);
    return value >= lo && value <= hi && (value - lo) % Number(step) === 0;
  }
  // Lists like 0,30
  return field.split(',').map(Number).includes(value);
}

function cronMatches(expr, date) {
  const { minute, hour, dom, month, dow } = parseCron(expr);
  return matchesCronField(minute, date.getMinutes()) &&
    matchesCronField(hour, date.getHours()) &&
    matchesCronField(dom, date.getDate()) &&
    matchesCronField(month, date.getMonth() + 1) &&
    matchesCronField(dow, date.getDay());
}

// ── Job execution ───────────────────────────────────────────────────────

async function executeJob(job) {
  const start = Date.now();
  const jobId = job.id;
  const system = job.system;
  const topic = job.topic;
  console.log(`[${new Date().toISOString()}] ▶ ${jobId}`);

  try {
    // Pull pipe data if needed
    let pipeData = job.params || null;
    if (job.dataPipes) {
      const { data, errors } = await pullDataFor(system === 'daily-briefing' ? 'daily-briefing' :
        system === 'advisory-council' ? 'advisory-council' : system);
      pipeData = { ...pipeData, ...data };
      if (errors.length) {
        console.warn(`[${jobId}] Pipe errors:`, errors);
      }
    }

    // Run the system
    const runner = runners[system];
    if (!runner) throw new Error(`No runner for system: ${system}`);

    const output = await runner(job.action, pipeData);
    const durationMs = Date.now() - start;
    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

    // Log to cost tracker
    await logRun(jobId, system, 'ok', durationMs, outputStr);

    // Route output to correct topic
    if (outputStr && outputStr.length > 5 && topic) {
      try {
        const router = await getRouter();
        await router.route(topic, `**${job.description}**\n\n${outputStr.slice(0, 3500)}`, {
          isFailure: false
        });
      } catch (routeErr) {
        console.warn(`[${jobId}] Route failed: ${routeErr.message}`);
      }
    }

    console.log(`[${new Date().toISOString()}] ✓ ${jobId} (${durationMs}ms)`);
    return { status: 'ok', durationMs, output: outputStr };

  } catch (error) {
    const durationMs = Date.now() - start;
    console.error(`[${new Date().toISOString()}] ✗ ${jobId}: ${error.message}`);

    // Log failure
    await logRun(jobId, system, 'error', durationMs, error.message);

    // Alert to cron-updates topic
    try {
      const router = await getRouter();
      await router.route('cron-updates', `❌ **${jobId}** failed\n\n\`${error.message}\``, {
        isFailure: true
      });
    } catch { /* router itself failed — nothing we can do */ }

    return { status: 'error', durationMs, error: error.message };
  }
}

// ── Main loop ───────────────────────────────────────────────────────────

async function mainLoop() {
  console.log(`[orchestrator] Started — ${schedule.jobs.length} jobs loaded`);
  console.log(`[orchestrator] Checking every 60s\n`);

  // Track last-run minute to avoid double-firing
  const lastRun = {};

  const tick = async () => {
    const now = new Date();
    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

    const due = schedule.jobs.filter(job => {
      const key = `${job.id}:${minuteKey}`;
      if (lastRun[key]) return false;
      if (cronMatches(job.cron, now)) {
        lastRun[key] = true;
        return true;
      }
      return false;
    });

    if (due.length) {
      console.log(`[${now.toISOString()}] ${due.length} job(s) due: ${due.map(j => j.id).join(', ')}`);
      // Run concurrently but with a concurrency limit of 4
      const CONCURRENCY = 4;
      for (let i = 0; i < due.length; i += CONCURRENCY) {
        await Promise.all(due.slice(i, i + CONCURRENCY).map(executeJob));
      }
    }

    // Cleanup old lastRun keys (keep last 200)
    const keys = Object.keys(lastRun);
    if (keys.length > 200) {
      keys.slice(0, keys.length - 200).forEach(k => delete lastRun[k]);
    }
  };

  // Initial tick
  await tick();
  // Then every 60 seconds
  setInterval(tick, 60_000);
}

// ── CLI ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--list')) {
  console.log('Orchestrator Jobs:\n');
  for (const job of schedule.jobs) {
    console.log(`  ${job.id.padEnd(35)} ${job.cron.padEnd(20)} → ${job.topic}`);
  }
  process.exit(0);
}

if (args.includes('--dry-run')) {
  console.log('Dry run — schedule loaded:\n');
  const now = new Date();
  for (const job of schedule.jobs) {
    const matches = cronMatches(job.cron, now);
    console.log(`  ${matches ? '▶' : ' '} ${job.id.padEnd(35)} ${job.cron.padEnd(20)} ${job.description}`);
  }
  process.exit(0);
}

if (args.includes('--once')) {
  const jobId = args[args.indexOf('--once') + 1];
  const job = schedule.jobs.find(j => j.id === jobId);
  if (!job) {
    console.error(`Job not found: ${jobId}`);
    console.error(`Available: ${schedule.jobs.map(j => j.id).join(', ')}`);
    process.exit(1);
  }
  const result = await executeJob(job);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'ok' ? 0 : 1);
}

// Default: run the main loop
mainLoop().catch(e => {
  console.error('[orchestrator] Fatal:', e);
  process.exit(1);
});
