// Analyzer: Config Consistency
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export const name = 'config-consistency';
export const label = 'Config Consistency';

async function findConfigs(dir, depth = 0, max = 3) {
  if (depth > max) return [];
  const results = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) results.push(...await findConfigs(full, depth + 1, max));
      else if (e.name === 'config.json' || e.name === '.env' || e.name === 'op.env') {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

export async function analyze(config) {
  const findings = [];
  const root = config.workspaceRoot;
  const configs = await findConfigs(root);
  
  let validJson = 0;
  let invalidJson = 0;
  let envFiles = 0;
  let opEnvFiles = 0;
  let plainSecrets = 0;

  for (const f of configs) {
    if (f.endsWith('.json')) {
      try {
        JSON.parse(await readFile(f, 'utf8'));
        validJson++;
      } catch {
        invalidJson++;
        findings.push(`🔴 Invalid JSON: ${f.replace(root, '.')}`);
      }
    } else if (f.endsWith('.env')) {
      envFiles++;
      try {
        const content = await readFile(f, 'utf8');
        // Check for plain secrets (not op:// references)
        const lines = content.split('\n').filter(l => l.includes('=') && !l.startsWith('#'));
        for (const l of lines) {
          const val = l.split('=').slice(1).join('=').trim();
          if (val && !val.startsWith('op://') && val.length > 10 && /[A-Za-z0-9+/=]{20}/.test(val)) {
            plainSecrets++;
          }
        }
      } catch {}
    } else if (f.endsWith('op.env')) {
      opEnvFiles++;
    }
  }

  findings.push(`📊 ${configs.length} config files found (${validJson} valid JSON, ${envFiles} .env, ${opEnvFiles} op.env)`);
  if (invalidJson > 0) findings.push(`🔴 ${invalidJson} invalid JSON configs`);
  if (plainSecrets > 0) findings.push(`🔴 ${plainSecrets} potential plain-text secrets in .env files`);
  if (opEnvFiles > 0) findings.push(`✅ ${opEnvFiles} op.env files using 1Password references`);

  let score = 90;
  score -= invalidJson * 15;
  score -= plainSecrets * 10;
  if (configs.length === 0) score = 50;

  return { score: Math.max(10, Math.min(100, Math.round(score))), findings };
}
