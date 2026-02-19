// Analyzer: Prompt Quality
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export const name = 'prompt-quality';
export const label = 'Prompt Quality';

async function findPrompts(dir, depth = 0, max = 3) {
  if (depth > max) return [];
  const results = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) results.push(...await findPrompts(full, depth + 1, max));
      else if (e.name === 'SKILL.md' || e.name.includes('prompt') || e.name === 'AGENTS.md') {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

export async function analyze(config) {
  const findings = [];
  const root = config.workspaceRoot;
  const promptFiles = await findPrompts(root);
  
  let totalPrompts = promptFiles.length;
  let shortPrompts = 0;
  let noExamples = 0;
  let wellStructured = 0;

  for (const f of promptFiles.slice(0, 50)) {
    try {
      const content = await readFile(f, 'utf8');
      const len = content.length;
      
      if (len < 100) { shortPrompts++; continue; }
      
      const hasHeaders = content.includes('#');
      const hasExamples = /example|e\.g\.|for instance/i.test(content);
      const hasConstraints = /must|should|never|always|do not/i.test(content);
      
      if (!hasExamples) noExamples++;
      if (hasHeaders && hasConstraints) wellStructured++;
    } catch {}
  }

  findings.push(`📊 ${totalPrompts} prompt/skill files found`);
  if (shortPrompts > 0) findings.push(`⚠️ ${shortPrompts} prompts are very short (<100 chars)`);
  if (noExamples > 0) findings.push(`ℹ️ ${noExamples} prompts lack examples`);
  findings.push(`✅ ${wellStructured} prompts are well-structured (headers + constraints)`);

  let score = 70;
  if (totalPrompts > 10) score += 10;
  score -= shortPrompts * 3;
  score += wellStructured * 2;
  score -= noExamples;

  return { score: Math.max(10, Math.min(100, Math.round(score))), findings };
}
