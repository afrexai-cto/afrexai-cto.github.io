// Analyzer: Dependencies
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export const name = 'dependencies';
export const label = 'Dependencies';

async function findPackageJsons(dir, depth = 0, max = 2) {
  if (depth > max) return [];
  const results = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) results.push(...await findPackageJsons(full, depth + 1, max));
      else if (e.name === 'package.json') results.push(full);
    }
  } catch {}
  return results;
}

export async function analyze(config) {
  const findings = [];
  const root = config.workspaceRoot;
  const pkgFiles = await findPackageJsons(root);
  
  let totalDeps = 0;
  let noPinned = 0;
  let noLockfile = 0;
  const depMap = new Map();

  for (const f of pkgFiles) {
    try {
      const pkg = JSON.parse(await readFile(f, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const depCount = Object.keys(deps).length;
      totalDeps += depCount;
      
      // Check for lock file
      const dir = f.replace('/package.json', '');
      try { await readFile(join(dir, 'package-lock.json')); }
      catch {
        try { await readFile(join(dir, 'yarn.lock')); }
        catch { noLockfile++; findings.push(`⚠️ No lockfile: ${f.replace(root, '.')}`); }
      }

      for (const [name, ver] of Object.entries(deps)) {
        if (ver.startsWith('^') || ver.startsWith('~') || ver === '*') noPinned++;
        depMap.set(name, (depMap.get(name) || 0) + 1);
      }
    } catch {}
  }

  // Find duplicate deps across projects
  const shared = [...depMap.entries()].filter(([, c]) => c > 2);
  
  findings.push(`📊 ${pkgFiles.length} package.json files, ${totalDeps} total dependencies`);
  if (noPinned > 0) findings.push(`ℹ️ ${noPinned} dependencies use floating versions (^/~)`);
  if (shared.length > 0) findings.push(`📦 Most shared deps: ${shared.slice(0, 5).map(([n, c]) => `${n}(${c}x)`).join(', ')}`);

  let score = 85;
  score -= noLockfile * 5;
  if (totalDeps === 0) score = 50;

  return { score: Math.max(10, Math.min(100, Math.round(score))), findings };
}
