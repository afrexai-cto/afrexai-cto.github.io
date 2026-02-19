// Analyzer: Skill Integrity
import { readdir, readFile, access } from 'fs/promises';
import { join } from 'path';

export const name = 'skill-integrity';
export const label = 'Skill Integrity';

export async function analyze(config) {
  const findings = [];
  const skillsDir = join(config.workspaceRoot, 'skills');
  
  let skills = [];
  try { skills = await readdir(skillsDir); } catch { 
    findings.push('🔴 No skills directory found');
    return { score: 20, findings };
  }

  let hasSkillMd = 0;
  let hasPackageJson = 0;
  let hasEntrypoint = 0;
  let broken = [];

  for (const skill of skills) {
    const dir = join(skillsDir, skill);
    try {
      const files = await readdir(dir);
      
      if (files.includes('SKILL.md')) hasSkillMd++;
      else broken.push(`${skill}: missing SKILL.md`);
      
      if (files.includes('package.json')) hasPackageJson++;
      
      const hasEntry = files.some(f => f === 'index.js' || f === 'index.ts' || f === 'main.js');
      if (hasEntry) hasEntrypoint++;
    } catch {}
  }

  const total = skills.length;
  findings.push(`📊 ${total} skills found`);
  findings.push(`✅ ${hasSkillMd}/${total} have SKILL.md`);
  findings.push(`📦 ${hasPackageJson}/${total} have package.json`);
  findings.push(`🔧 ${hasEntrypoint}/${total} have an entrypoint`);
  
  if (broken.length > 0) {
    findings.push(`⚠️ Issues: ${broken.slice(0, 5).join('; ')}`);
  }

  const score = total > 0 ? Math.round((hasSkillMd / total) * 50 + (hasEntrypoint / total) * 30 + 20) : 30;

  return { score: Math.min(100, score), findings };
}
