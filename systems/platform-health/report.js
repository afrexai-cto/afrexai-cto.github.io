#!/usr/bin/env node
// Platform Health Council - Report Generator
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));
const db = new DatabaseSync(join(__dirname, config.dbPath), { readOnly: true });

const mode = process.argv[2] || 'latest';

if (mode === 'latest') {
  const run = db.prepare('SELECT * FROM health_runs ORDER BY id DESC LIMIT 1').get();
  if (!run) { console.log('No health runs found. Run health-check.js first.'); process.exit(1); }
  
  const results = db.prepare('SELECT * FROM health_results WHERE run_id = ? ORDER BY score ASC').all(run.id);
  
  let md = `# 🏥 Platform Health Report\n\n`;
  md += `**Run #${run.id}** | ${run.run_at} | Overall: **${run.overall_score}/100**\n\n`;
  md += `## Area Scores\n\n| Area | Score | Status |\n|------|-------|--------|\n`;
  
  for (const r of results) {
    const icon = r.status === 'healthy' ? '✅' : r.status === 'warning' ? '⚠️' : '🔴';
    md += `| ${r.area} | ${r.score}/100 | ${icon} ${r.status} |\n`;
  }

  md += `\n## Detailed Findings\n\n`;
  for (const r of results) {
    md += `### ${r.area} (${r.score}/100)\n`;
    const findings = JSON.parse(r.findings || '[]');
    for (const f of findings) md += `- ${f}\n`;
    md += '\n';
  }

  try {
    const summary = JSON.parse(run.summary);
    if (summary.recommendations) {
      md += `## 📋 Recommendations\n\n`;
      summary.recommendations.forEach((r, i) => md += `${i + 1}. ${r}\n`);
    }
  } catch {
    md += `## Summary\n\n${run.summary}\n`;
  }

  console.log(md);
} else if (mode === 'trends') {
  console.log('# 📈 Health Trends\n');
  for (const area of config.areas) {
    const trends = db.prepare('SELECT score, recorded_at FROM health_trends WHERE area = ? ORDER BY recorded_at DESC LIMIT 10').all(area);
    if (trends.length > 0) {
      console.log(`## ${area}`);
      for (const t of trends) console.log(`  ${t.recorded_at}: ${t.score}/100`);
      console.log();
    }
  }
}

db.close();
