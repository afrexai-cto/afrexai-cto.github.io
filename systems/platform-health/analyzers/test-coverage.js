// Analyzer: Test Coverage
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export const name = 'test-coverage';
export const label = 'Test Coverage';

async function findFiles(dir, pattern, depth = 0, max = 3) {
  if (depth > max) return [];
  const results = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === '__tests__' || e.name === 'test' || e.name === 'tests') {
          results.push({ type: 'dir', path: full });
        }
        results.push(...await findFiles(full, pattern, depth + 1, max));
      } else if (pattern.test(e.name)) {
        results.push({ type: 'file', path: full });
      }
    }
  } catch {}
  return results;
}

export async function analyze(config) {
  const findings = [];
  const root = config.workspaceRoot;
  
  const testFiles = await findFiles(root, /\.(test|spec)\.(js|ts)$/);
  const allJs = await findFiles(root, /\.(js|ts)$/);
  const srcFiles = allJs.filter(f => f.type === 'file' && !/(test|spec|node_modules)/.test(f.path));
  
  // Check for test directories in key areas
  const keyDirs = ['systems', 'skills', 'crm', 'outbound', 'stripe-api'];
  const coverage = {};
  
  for (const d of keyDirs) {
    const tests = testFiles.filter(t => t.path.includes(`/${d}/`));
    coverage[d] = tests.length;
  }

  const totalTests = testFiles.filter(f => f.type === 'file').length;
  const totalSrc = srcFiles.length;
  const ratio = totalSrc > 0 ? totalTests / totalSrc : 0;

  findings.push(`📊 ${totalTests} test files found across ${totalSrc} source files (ratio: ${(ratio * 100).toFixed(1)}%)`);
  
  for (const [dir, count] of Object.entries(coverage)) {
    if (count === 0) findings.push(`🔴 No tests found in ${dir}/`);
    else findings.push(`✅ ${count} test file(s) in ${dir}/`);
  }

  let score = Math.min(100, Math.round(ratio * 200));
  if (totalTests === 0) score = 10;

  return { score: Math.max(10, score), findings };
}
