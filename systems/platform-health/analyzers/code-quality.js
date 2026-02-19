// Analyzer: Code Quality
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export const name = 'code-quality';
export const label = 'Code Quality';

async function collectJsFiles(dir, depth = 0, max = 3) {
  if (depth > max) return [];
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) files.push(...await collectJsFiles(full, depth + 1, max));
      else if (e.name.endsWith('.js') || e.name.endsWith('.ts')) files.push(full);
    }
  } catch {}
  return files;
}

export async function analyze(config) {
  const findings = [];
  const root = config.workspaceRoot;
  const jsFiles = await collectJsFiles(root);
  
  let totalLines = 0;
  let todoCount = 0;
  let hackCount = 0;
  let longFiles = 0;
  let noErrorHandling = 0;

  for (const f of jsFiles.slice(0, 100)) {
    try {
      const content = await readFile(f, 'utf8');
      const lines = content.split('\n');
      totalLines += lines.length;
      
      if (lines.length > 300) longFiles++;
      
      const upper = content.toUpperCase();
      todoCount += (upper.match(/TODO/g) || []).length;
      hackCount += (upper.match(/HACK|FIXME|XXX/g) || []).length;
      
      if (content.includes('async ') && !content.includes('catch') && !content.includes('try')) {
        noErrorHandling++;
      }
    } catch {}
  }

  findings.push(`📊 ${jsFiles.length} JS/TS files, ~${totalLines} total lines`);
  if (todoCount > 0) findings.push(`⚠️ ${todoCount} TODO comments found`);
  if (hackCount > 0) findings.push(`🔴 ${hackCount} HACK/FIXME/XXX markers found`);
  if (longFiles > 0) findings.push(`⚠️ ${longFiles} files exceed 300 lines`);
  if (noErrorHandling > 0) findings.push(`⚠️ ${noErrorHandling} async files without try/catch`);

  let score = 90;
  score -= Math.min(20, todoCount * 2);
  score -= Math.min(20, hackCount * 5);
  score -= Math.min(15, longFiles * 3);
  score -= Math.min(15, noErrorHandling * 3);

  return { score: Math.max(10, Math.round(score)), findings };
}
