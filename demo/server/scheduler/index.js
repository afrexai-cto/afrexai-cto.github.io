'use strict';

/**
 * Cron-based task scheduler. Stores schedules in db.json.
 * Uses a simple setInterval check (every 60s) against cron expressions.
 * No external cron library — simple pattern matching for common patterns.
 */

const db = require('../db');
const executor = require('../agents/executor');

let checkInterval = null;

function init(demoDir) {
  // Start the scheduler loop
  checkInterval = setInterval(checkSchedules, 60 * 1000);
  console.log('[scheduler] Started (checking every 60s)');

  // Also run immediately to catch any due tasks
  setTimeout(checkSchedules, 5000);
}

function stop() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

/**
 * Parse simple cron expression: "minute hour dayOfMonth month dayOfWeek"
 * Supports: asterisk, specific numbers, ranges like 1-5, steps like asterisk/15
 */
function matchesCron(cronExpr, date) {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const fields = [
    date.getMinutes(),
    date.getHours(),
    date.getDate(),
    date.getMonth() + 1,
    date.getDay(),
  ];

  return parts.every((pattern, i) => matchesField(pattern, fields[i]));
}

function matchesField(pattern, value) {
  if (pattern === '*') return true;

  // Step: */N
  if (pattern.startsWith('*/')) {
    const step = parseInt(pattern.slice(2));
    return value % step === 0;
  }

  // Range: N-M
  if (pattern.includes('-')) {
    const [min, max] = pattern.split('-').map(Number);
    return value >= min && value <= max;
  }

  // List: N,M,O
  if (pattern.includes(',')) {
    return pattern.split(',').map(Number).includes(value);
  }

  // Exact match
  return parseInt(pattern) === value;
}

/**
 * Check all schedules and run due tasks
 */
async function checkSchedules() {
  const data = db.read();
  const schedules = data.schedules || [];
  const now = new Date();

  for (const schedule of schedules) {
    if (!schedule.enabled) continue;

    // Check if cron matches current minute
    if (!matchesCron(schedule.cron, now)) continue;

    // Prevent double-run within same minute
    if (schedule.lastRun) {
      const lastRun = new Date(schedule.lastRun);
      if (now.getTime() - lastRun.getTime() < 55000) continue;
    }

    console.log(`[scheduler] Running task: ${schedule.taskId} for ${schedule.companyId}`);

    // Update lastRun immediately to prevent re-trigger
    db.update(d => {
      const s = (d.schedules || []).find(s => s.id === schedule.id);
      if (s) s.lastRun = now.toISOString();
    });

    try {
      const result = await executor.executeTask(schedule.taskId);
      console.log(`[scheduler] Completed: ${schedule.taskId} → ${result.deliverablePath}`);

      // Update next run estimate
      db.update(d => {
        const s = (d.schedules || []).find(s => s.id === schedule.id);
        if (s) s.lastResult = { status: 'ok', runId: result.runId, at: now.toISOString() };
      });
    } catch (err) {
      console.error(`[scheduler] Failed: ${schedule.taskId}:`, err.message);
      db.update(d => {
        const s = (d.schedules || []).find(s => s.id === schedule.id);
        if (s) s.lastResult = { status: 'error', error: err.message, at: now.toISOString() };
      });
    }
  }
}

/**
 * Add a schedule
 */
function addSchedule({ companyId, taskId, cron, label }) {
  const id = `sched-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const schedule = {
    id,
    companyId,
    taskId,
    cron,
    label: label || taskId,
    enabled: true,
    createdAt: new Date().toISOString(),
    lastRun: null,
    lastResult: null,
  };

  db.update(data => {
    if (!data.schedules) data.schedules = [];
    data.schedules.push(schedule);
  });

  return schedule;
}

function removeSchedule(scheduleId) {
  db.update(data => {
    data.schedules = (data.schedules || []).filter(s => s.id !== scheduleId);
  });
}

function updateSchedule(scheduleId, updates) {
  db.update(data => {
    const s = (data.schedules || []).find(s => s.id === scheduleId);
    if (s) Object.assign(s, updates);
  });
}

function listSchedules(companyId) {
  const data = db.read();
  const schedules = data.schedules || [];
  return companyId ? schedules.filter(s => s.companyId === companyId) : schedules;
}

// Pre-configured schedules for demo companies
const DEFAULT_SCHEDULES = [
  { companyId: 'buildright', taskId: 'daily-site-report', cron: '0 18 * * 1-5', label: 'Daily Site Report (6pm weekdays)' },
  { companyId: 'meridian-health', taskId: 'schedule-patient', cron: '0 8 * * 1-5', label: 'Morning Scheduling Run (8am weekdays)' },
  { companyId: 'meridian-health', taskId: 'compliance-audit', cron: '0 6 * * 1', label: 'Weekly Compliance Audit (Mon 6am)' },
  { companyId: 'meridian-health', taskId: 'records-request', cron: '0 9,14 * * 1-5', label: 'Records Processing (9am & 2pm weekdays)' },
  { companyId: 'pacific-legal', taskId: 'contract-review', cron: '0 7 * * 1-5', label: 'Morning Contract Review (7am weekdays)' },
  { companyId: 'pacific-legal', taskId: 'client-followup', cron: '0 16 * * 1-5', label: 'Afternoon Client Follow-ups (4pm weekdays)' },
];

function seedDefaults() {
  const data = db.read();
  if (data.schedules && data.schedules.length > 0) return;

  for (const sched of DEFAULT_SCHEDULES) {
    addSchedule(sched);
  }
  console.log(`[scheduler] Seeded ${DEFAULT_SCHEDULES.length} default schedules`);
}

module.exports = { init, stop, addSchedule, removeSchedule, updateSchedule, listSchedules, seedDefaults, matchesCron };
