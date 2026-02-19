// Analyzer: Storage
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export const name = 'storage';
export const label = 'Storage';

async function findLargeFiles(dir, depth = 0, max = 3) {
  if (depth > max) return [];
  const results = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) results.push(...await findLargeFiles(full, depth + 1, max));
      else {
        try {
          const s = await stat(full);
          if (s.size > 1024 * 1024) results.push({ path: full, size: s.size }); // >1MB
        } catch {}
      }
    }
  } catch {}
  return results;
}

export async function analyze(config) {
  const findings = [];
  const root = config.workspaceRoot;
  
  const largeFiles = await findLargeFiles(root);
  largeFiles.sort((a, b) => b.size - a.size);
  
  // Find DB files specifically
  const dbFiles = largeFiles.filter(f => /\.(db|sqlite|sqlite3)$/.test(f.path));
  const otherLarge = largeFiles.filter(f => !/\.(db|sqlite|sqlite3)$/.test(f.path));
  
  const fmt = (bytes) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`;

  if (dbFiles.length > 0) {
    findings.push(`🗄️ Database files:`);
    for (const f of dbFiles.slice(0, 5)) {
      findings.push(`  - ${f.path.replace(root, '.')} (${fmt(f.size)})`);
    }
  }
  
  if (otherLarge.length > 0) {
    findings.push(`📁 Large files (>1MB):`);
    for (const f of otherLarge.slice(0, 5)) {
      findings.push(`  - ${f.path.replace(root, '.')} (${fmt(f.size)})`);
    }
  }

  if (largeFiles.length === 0) {
    findings.push('✅ No files over 1MB found - workspace is lean');
  }

  const totalLargeMB = largeFiles.reduce((s, f) => s + f.size, 0) / (1024 * 1024);
  findings.push(`📊 Total large file storage: ${totalLargeMB.toFixed(1)}MB`);

  let score = 95;
  score -= dbFiles.filter(f => f.size > 50 * 1024 * 1024).length * 15; // >50MB DBs
  score -= Math.min(20, otherLarge.length * 2);

  return { score: Math.max(10, Math.min(100, Math.round(score))), findings };
}
