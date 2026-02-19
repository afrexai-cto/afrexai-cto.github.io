const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkDataFreshness(config) {
  const alerts = [];
  const trackerDir = path.join(config.workspaceRoot, 'systems/social-media-tracker');
  
  if (!fs.existsSync(trackerDir)) {
    // Check for any social-media related dirs
    const systemsDir = path.join(config.workspaceRoot, 'systems');
    const dirs = fs.readdirSync(systemsDir).filter(d => d.includes('social') || d.includes('media'));
    if (dirs.length === 0) {
      alerts.push({ level: 'info', check: 'data-freshness', message: 'No social media tracker found in systems/' });
      return alerts;
    }
  }

  // Check for data files and their freshness
  const dataLocations = [
    path.join(trackerDir, 'data'),
    path.join(trackerDir, 'output'),
    trackerDir
  ];

  let newestFile = null;
  let newestTime = 0;

  for (const loc of dataLocations) {
    if (!fs.existsSync(loc)) continue;
    try {
      const files = fs.readdirSync(loc).filter(f => f.endsWith('.json') || f.endsWith('.csv'));
      for (const f of files) {
        const stat = fs.statSync(path.join(loc, f));
        if (stat.mtimeMs > newestTime) {
          newestTime = stat.mtimeMs;
          newestFile = f;
        }
      }
    } catch {}
  }

  if (newestFile) {
    const ageDays = (Date.now() - newestTime) / (1000 * 60 * 60 * 24);
    if (ageDays > config.thresholds.dataFreshnessDays) {
      alerts.push({
        level: 'warn',
        check: 'data-freshness',
        message: `Social media data is ${ageDays.toFixed(1)} days old (threshold: ${config.thresholds.dataFreshnessDays}d). Latest: ${newestFile}`
      });
    }
  }

  return alerts;
}

function checkRepoSize(config) {
  const alerts = [];
  try {
    const output = execSync('du -sm .git', { cwd: config.workspaceRoot, encoding: 'utf8' });
    const sizeMB = parseInt(output.split('\t')[0], 10);
    if (sizeMB > config.thresholds.repoSizeMB) {
      alerts.push({
        level: 'warn',
        check: 'repo-size',
        message: `Git repo is ${sizeMB}MB (threshold: ${config.thresholds.repoSizeMB}MB)`
      });
    }
  } catch (e) {
    alerts.push({ level: 'error', check: 'repo-size', message: `Failed to check repo size: ${e.message}` });
  }
  return alerts;
}

function scanErrorLogs(config) {
  const alerts = [];
  try {
    // Look for log files across the workspace
    const output = execSync(
      `find "${config.workspaceRoot}" -maxdepth 4 -name "*.log" -newer "${config.workspaceRoot}/.git/HEAD" 2>/dev/null || true`,
      { encoding: 'utf8', timeout: 10000 }
    );
    
    const logFiles = output.trim().split('\n').filter(Boolean);
    const errorCounts = {};

    for (const logFile of logFiles.slice(0, 20)) {
      try {
        const content = fs.readFileSync(logFile, 'utf8').slice(-50000); // last 50KB
        const errorLines = content.split('\n').filter(l => /error|fatal|critical|exception/i.test(l));
        for (const line of errorLines) {
          const key = line.replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^\s]*/g, '').trim().slice(0, 100);
          errorCounts[key] = (errorCounts[key] || 0) + 1;
        }
      } catch {}
    }

    const recurring = Object.entries(errorCounts).filter(([, count]) => count >= 3);
    if (recurring.length > 0) {
      alerts.push({
        level: 'warn',
        check: 'error-logs',
        message: `Found ${recurring.length} recurring error patterns: ${recurring.map(([msg, c]) => `"${msg.slice(0, 60)}..." (×${c})`).join('; ')}`
      });
    }
  } catch (e) {
    alerts.push({ level: 'error', check: 'error-logs', message: `Log scan failed: ${e.message}` });
  }
  return alerts;
}

function runGitBackup(config) {
  const alerts = [];
  try {
    const status = execSync('git status --porcelain', { cwd: config.workspaceRoot, encoding: 'utf8' });
    const remotes = execSync('git remote -v', { cwd: config.workspaceRoot, encoding: 'utf8' });
    
    if (!remotes.trim()) {
      alerts.push({ level: 'info', check: 'git-backup', message: 'No git remotes configured — backup skipped' });
      return alerts;
    }

    if (status.trim()) {
      // There are uncommitted changes — note but don't auto-commit
      const changedFiles = status.trim().split('\n').length;
      alerts.push({ level: 'info', check: 'git-backup', message: `${changedFiles} uncommitted changes detected` });
    }

    // Try to fetch to verify remote connectivity
    try {
      execSync('git fetch --dry-run 2>&1', { cwd: config.workspaceRoot, encoding: 'utf8', timeout: 15000 });
    } catch (e) {
      alerts.push({ level: 'warn', check: 'git-backup', message: `Remote unreachable: ${e.message.slice(0, 100)}` });
    }
  } catch (e) {
    alerts.push({ level: 'error', check: 'git-backup', message: `Git backup check failed: ${e.message}` });
  }
  return alerts;
}

module.exports = function runDailyChecks(config) {
  return [
    ...checkDataFreshness(config),
    ...checkRepoSize(config),
    ...scanErrorLogs(config),
    ...runGitBackup(config)
  ];
};
