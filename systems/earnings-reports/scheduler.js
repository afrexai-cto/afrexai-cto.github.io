#!/usr/bin/env node
/**
 * Scheduler — checks for pending jobs whose run_at has passed, executes them.
 * Designed to be called periodically (e.g., via cron every 15 min).
 * 
 * Usage:
 *   node scheduler.js run      — process due jobs
 *   node scheduler.js status   — show all pending jobs
 *   node scheduler.js cleanup  — remove completed jobs
 */
import { getDb } from './db.js';
import { generateReport } from './report-generator.js';

const db = getDb();

async function processDueJobs() {
  const now = new Date().toISOString();
  const dueJobs = db.prepare(`
    SELECT * FROM scheduled_jobs WHERE status = 'pending' AND run_at <= ? ORDER BY run_at
  `).all(now);

  if (!dueJobs.length) {
    console.log('No jobs due right now.');
    return [];
  }

  console.log(`Processing ${dueJobs.length} due job(s)...\n`);
  const results = [];

  for (const job of dueJobs) {
    console.log(`⏳ ${job.ticker} (report: ${job.report_date})...`);
    db.prepare('UPDATE scheduled_jobs SET status = ? WHERE id = ?').run('running', job.id);

    try {
      const result = await generateReport(job.ticker, job.report_date);
      if (result.success) {
        console.log(`✅ ${job.ticker} — ${result.verdict}`);
        console.log(result.narrative);
        console.log('\n---\n');
        db.prepare('UPDATE scheduled_jobs SET status = ? WHERE id = ?').run('completed', job.id);
        results.push(result);
      } else {
        console.error(`❌ ${job.ticker} failed: ${result.error}`);
        db.prepare('UPDATE scheduled_jobs SET status = ? WHERE id = ?').run('failed', job.id);
      }
    } catch (e) {
      console.error(`❌ ${job.ticker} error: ${e.message}`);
      db.prepare('UPDATE scheduled_jobs SET status = ? WHERE id = ?').run('failed', job.id);
    }
  }

  // Auto-delete completed jobs
  const deleted = db.prepare("DELETE FROM scheduled_jobs WHERE status = 'completed'").run();
  if (deleted.changes) console.log(`🗑️  Cleaned up ${deleted.changes} completed job(s).`);

  return results;
}

function showStatus() {
  const jobs = db.prepare('SELECT * FROM scheduled_jobs ORDER BY run_at').all();
  if (!jobs.length) {
    console.log('No scheduled jobs.');
    return;
  }
  console.log(`\n📋 Scheduled Jobs (${jobs.length}):\n`);
  for (const j of jobs) {
    const icon = j.status === 'pending' ? '⏰' : j.status === 'completed' ? '✅' : j.status === 'failed' ? '❌' : '⏳';
    console.log(`  ${icon} ${j.ticker} | Report: ${j.report_date} | Run at: ${j.run_at} | Status: ${j.status}`);
  }
  console.log();
}

function cleanup() {
  const deleted = db.prepare("DELETE FROM scheduled_jobs WHERE status IN ('completed', 'failed')").run();
  console.log(`Cleaned up ${deleted.changes} job(s).`);
}

const [,, cmd] = process.argv;
switch (cmd) {
  case 'run':
    processDueJobs().then(() => process.exit(0));
    break;
  case 'status':
    showStatus();
    break;
  case 'cleanup':
    cleanup();
    break;
  default:
    console.log('Usage: node scheduler.js <run|status|cleanup>');
}
