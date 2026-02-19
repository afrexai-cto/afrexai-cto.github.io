// Analyzer: Data Integrity (Contact Database)
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

export const name = 'data-integrity';
export const label = 'Data Integrity';

export async function analyze(config) {
  const findings = [];
  const root = config.workspaceRoot;
  
  // Check CRM / personal-crm systems
  const crmPaths = [
    join(root, 'crm'),
    join(root, 'systems/personal-crm'),
  ];
  
  let crmFound = false;
  let dbSize = 0;
  let hasSchema = false;
  let hasBackup = false;

  for (const crmPath of crmPaths) {
    try {
      const files = await readdir(crmPath);
      crmFound = true;
      
      for (const f of files) {
        if (f.endsWith('.db') || f.endsWith('.sqlite')) {
          const s = await stat(join(crmPath, f));
          dbSize += s.size;
          findings.push(`🗄️ Database: ${f} (${(s.size / 1024).toFixed(0)}KB)`);
        }
        if (f.includes('schema') || f.includes('migration')) hasSchema = true;
        if (f.includes('backup')) hasBackup = true;
      }
      
      // Check for package.json with schema info
      if (files.includes('package.json')) {
        findings.push(`✅ ${crmPath.replace(root, '.')} has package.json`);
      }
    } catch {}
  }

  // Check backup system
  const backupDir = join(root, 'systems/db-backups');
  try {
    const backupFiles = await readdir(backupDir);
    hasBackup = backupFiles.length > 0;
    findings.push(`💾 Backup system found with ${backupFiles.length} files`);
  } catch {}

  if (!crmFound) {
    findings.push('⚠️ No CRM/contact database directory found');
  }
  if (hasSchema) findings.push('✅ Schema/migration files present');
  if (!hasBackup) findings.push('⚠️ No backup files detected');

  let score = 60;
  if (crmFound) score += 15;
  if (hasSchema) score += 10;
  if (hasBackup) score += 15;

  return { score: Math.min(100, Math.round(score)), findings };
}
