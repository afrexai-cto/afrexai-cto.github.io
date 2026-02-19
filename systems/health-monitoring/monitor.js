#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const STATE_PATH = path.join(__dirname, 'state.json');

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));

const runDaily = require('./checks/daily');
const runWeekly = require('./checks/weekly');
const runMonthly = require('./checks/monthly');

const args = process.argv.slice(2);
const forceAll = args.includes('--all');
const forceDaily = args.includes('--daily') || forceAll;
const forceWeekly = args.includes('--weekly') || forceAll;
const forceMonthly = args.includes('--monthly') || forceAll;

const now = Date.now();
const results = { timestamp: new Date().toISOString(), checksRun: [], alerts: [], skipped: [] };

function shouldRun(name, cooldown, forced) {
  if (forced) return true;
  const last = state.lastRun[name] || 0;
  return (now - last) >= cooldown;
}

// Daily
if (shouldRun('daily', config.cooldowns.daily, forceDaily)) {
  const alerts = runDaily(config);
  results.checksRun.push('daily');
  results.alerts.push(...alerts);
  state.lastRun.daily = now;
} else {
  results.skipped.push('daily (cooldown)');
}

// Weekly
if (shouldRun('weekly', config.cooldowns.weekly, forceWeekly)) {
  const alerts = runWeekly(config);
  results.checksRun.push('weekly');
  results.alerts.push(...alerts);
  state.lastRun.weekly = now;
} else {
  results.skipped.push('weekly (cooldown)');
}

// Monthly
if (shouldRun('monthly', config.cooldowns.monthly, forceMonthly)) {
  const alerts = runMonthly(config);
  results.checksRun.push('monthly');
  results.alerts.push(...alerts);
  state.lastRun.monthly = now;
} else {
  results.skipped.push('monthly (cooldown)');
}

// Save state
state.lastRunTimestamp = results.timestamp;
state.alerts = results.alerts;
fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));

// Output
if (results.alerts.length === 0) {
  console.log(`✅ All clear — ${results.checksRun.join(', ')} checks passed`);
  if (results.skipped.length) console.log(`   Skipped: ${results.skipped.join(', ')}`);
} else {
  const critical = results.alerts.filter(a => a.level === 'critical');
  const warns = results.alerts.filter(a => a.level === 'warn');
  const infos = results.alerts.filter(a => a.level === 'info' || a.level === 'error');

  if (critical.length) {
    console.log(`🚨 ${critical.length} CRITICAL alert(s):`);
    critical.forEach(a => console.log(`   [${a.check}] ${a.message}`));
  }
  if (warns.length) {
    console.log(`⚠️  ${warns.length} warning(s):`);
    warns.forEach(a => console.log(`   [${a.check}] ${a.message}`));
  }
  if (infos.length) {
    console.log(`ℹ️  ${infos.length} info:`);
    infos.forEach(a => console.log(`   [${a.check}] ${a.message}`));
  }
}

// Output JSON for programmatic use
if (args.includes('--json')) {
  console.log(JSON.stringify(results, null, 2));
}

process.exit(results.alerts.some(a => a.level === 'critical') ? 2 : 
             results.alerts.some(a => a.level === 'warn') ? 1 : 0);
