const fs = require('fs');
const path = require('path');

function scanMemoryFiles(config) {
  const alerts = [];
  const memoryDir = path.join(config.workspaceRoot, 'memory');
  const patterns = config.suspiciousPatterns || [];

  if (!fs.existsSync(memoryDir)) {
    alerts.push({ level: 'info', check: 'memory-scan', message: 'No memory directory found' });
    return alerts;
  }

  const findings = [];

  function scanDir(dir, depth = 0) {
    if (depth > 3) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDir(fullPath, depth + 1);
        } else if (entry.isFile() && /\.(md|txt|json)$/i.test(entry.name)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
            for (const pattern of patterns) {
              if (content.includes(pattern.toLowerCase())) {
                findings.push({
                  file: path.relative(config.workspaceRoot, fullPath),
                  pattern
                });
              }
            }
          } catch {}
        }
      }
    } catch {}
  }

  // Scan memory dir and also top-level md files
  scanDir(memoryDir);
  
  // Also scan MEMORY.md, SOUL.md, etc.
  const topLevelFiles = ['MEMORY.md', 'SOUL.md', 'AGENTS.md', 'HEARTBEAT.md', 'USER.md', 'TOOLS.md'];
  for (const fname of topLevelFiles) {
    const fpath = path.join(config.workspaceRoot, fname);
    if (fs.existsSync(fpath)) {
      try {
        const content = fs.readFileSync(fpath, 'utf8').toLowerCase();
        for (const pattern of patterns) {
          if (content.includes(pattern.toLowerCase())) {
            findings.push({ file: fname, pattern });
          }
        }
      } catch {}
    }
  }

  if (findings.length > 0) {
    alerts.push({
      level: 'critical',
      check: 'memory-scan',
      message: `Found ${findings.length} suspicious pattern(s) in memory files: ${findings.map(f => `"${f.pattern}" in ${f.file}`).join('; ')}`
    });
  }

  return alerts;
}

module.exports = function runMonthlyChecks(config) {
  return scanMemoryFiles(config);
};
