// Analyzer: Cron Job Health
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

export const name = 'cron-health';
export const label = 'Cron Job Health';

export async function analyze(config) {
  const findings = [];
  const root = config.workspaceRoot;
  
  // Check OpenClaw cron config
  const cronPaths = [
    join(root, '../crons'),
    join(root, 'crons'),
  ];
  
  let cronFiles = [];
  for (const p of cronPaths) {
    try {
      const entries = await readdir(p);
      cronFiles.push(...entries.map(e => join(p, e)));
    } catch {}
  }

  // Check system dirs for cron-like patterns
  const systemsDir = join(root, 'systems');
  let systems = [];
  try { systems = await readdir(systemsDir); } catch {}
  
  let totalSystems = systems.length;
  let systemsWithHealth = 0;
  
  for (const sys of systems) {
    const sysPath = join(systemsDir, sys);
    try {
      const files = await readdir(sysPath);
      // Check for health indicators: recent logs, db files, etc
      const hasDb = files.some(f => f.endsWith('.db') || f.endsWith('.sqlite'));
      const hasPackage = files.includes('package.json');
      if (hasDb || hasPackage) systemsWithHealth++;
      
      // Check for stale systems (no recent modification)
      const s = await stat(sysPath);
      const daysSinceModified = (Date.now() - s.mtimeMs) / (1000 * 60 * 60 * 24);
      if (daysSinceModified > 30) {
        findings.push(`⚠️ System "${sys}" hasn't been modified in ${Math.floor(daysSinceModified)} days`);
      }
    } catch {}
  }

  if (cronFiles.length === 0) {
    findings.push('ℹ️ No dedicated cron directory found - jobs may be managed via OpenClaw scheduler');
  }
  
  findings.push(`📊 ${totalSystems} systems found, ${systemsWithHealth} have active data/packages`);

  const score = totalSystems > 0 ? Math.min(100, 60 + (systemsWithHealth / totalSystems) * 40) : 50;
  
  return { score: Math.round(score), findings };
}
