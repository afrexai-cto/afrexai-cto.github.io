#!/usr/bin/env node
// Repo size monitor — warns when repo exceeds thresholds
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

const WARN_MB = config.automatedChecks.repoSizeMonitor.warnThresholdMB;
const CRIT_MB = config.automatedChecks.repoSizeMonitor.criticalThresholdMB;

function checkRepo(repoPath) {
  const result = { timestamp: new Date().toISOString(), repoPath, checks: [] };

  // Total repo size
  try {
    const out = execSync(`du -sm "${repoPath}" 2>/dev/null`, { encoding: 'utf8' });
    const sizeMB = parseInt(out.split('\t')[0], 10);
    const level = sizeMB >= CRIT_MB ? 'critical' : sizeMB >= WARN_MB ? 'warning' : 'ok';
    result.checks.push({ name: 'repo_size', sizeMB, level, thresholds: { warn: WARN_MB, critical: CRIT_MB } });
  } catch (e) {
    result.checks.push({ name: 'repo_size', error: e.message });
  }

  // Git objects size
  try {
    const out = execSync(`git -C "${repoPath}" count-objects -vH 2>/dev/null`, { encoding: 'utf8' });
    result.checks.push({ name: 'git_objects', detail: out.trim() });
  } catch {
    result.checks.push({ name: 'git_objects', detail: 'Not a git repo or git unavailable' });
  }

  // Large files
  try {
    const out = execSync(`find "${repoPath}" -type f -size +10M -not -path "*/.git/*" 2>/dev/null | head -20`, { encoding: 'utf8' });
    const files = out.trim().split('\n').filter(Boolean);
    result.checks.push({ name: 'large_files', count: files.length, files: files.slice(0, 10) });
  } catch {
    result.checks.push({ name: 'large_files', count: 0, files: [] });
  }

  return result;
}

if (require.main === module) {
  const target = process.argv[2] || path.join(process.env.HOME, '.openclaw/workspace-main');
  const r = checkRepo(target);
  console.log(JSON.stringify(r, null, 2));
}

module.exports = { checkRepo };
