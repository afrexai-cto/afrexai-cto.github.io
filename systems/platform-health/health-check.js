#!/usr/bin/env node
// Platform Health Council - Main Health Check Runner
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));
const dbPath = join(__dirname, config.dbPath);

// Initialize DB
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));

const analyzerNames = [
  'cron-health', 'code-quality', 'test-coverage', 'prompt-quality',
  'dependencies', 'storage', 'skill-integrity', 'config-consistency', 'data-integrity'
];

async function runAllAnalyzers() {
  console.log('🏥 Platform Health Council - Running Analysis\n');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const name of analyzerNames) {
    const analyzer = await import(`./analyzers/${name}.js`);
    console.log(`\n📋 Analyzing: ${analyzer.label}...`);
    
    try {
      const result = await analyzer.analyze(config);
      result.area = name;
      const status = result.score >= config.thresholds.healthy ? 'healthy' 
        : result.score >= config.thresholds.warning ? 'warning' : 'critical';
      result.status = status;
      results.push(result);
      
      const icon = status === 'healthy' ? '✅' : status === 'warning' ? '⚠️' : '🔴';
      console.log(`  ${icon} Score: ${result.score}/100 (${status})`);
      for (const f of result.findings) console.log(`  ${f}`);
    } catch (err) {
      console.log(`  🔴 Error: ${err.message}`);
      results.push({ area: name, score: 0, status: 'critical', findings: [`Error: ${err.message}`] });
    }
  }

  const overall = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
  
  // Store in DB
  const insertRun = db.prepare('INSERT INTO health_runs (overall_score, summary) VALUES (?, ?)');
  const insertResult = db.prepare('INSERT INTO health_results (run_id, area, score, status, findings, recommendations) VALUES (?, ?, ?, ?, ?, ?)');
  const insertTrend = db.prepare('INSERT INTO health_trends (area, score) VALUES (?, ?)');

  insertRun.run(overall, `Health check completed with overall score ${overall}/100`);
  // Get last insert rowid
  const runId = db.prepare('SELECT last_insert_rowid() as id').get().id;

  for (const r of results) {
    insertResult.run(runId, r.area, r.score, r.status, JSON.stringify(r.findings), '[]');
    insertTrend.run(r.area, r.score);
  }

  // AI-powered recommendations
  let recommendations = [];
  try {
    recommendations = await generateRecommendations(results, overall);
  } catch (err) {
    console.log(`\n⚠️ AI recommendations unavailable: ${err.message}`);
    recommendations = generateFallbackRecommendations(results);
  }

  db.prepare('UPDATE health_runs SET summary = ? WHERE id = ?').run(
    JSON.stringify({ overall, recommendations }), runId
  );

  console.log('\n' + '='.repeat(60));
  console.log(`\n🏥 OVERALL HEALTH SCORE: ${overall}/100`);
  console.log('\n📋 NUMBERED RECOMMENDATIONS:\n');
  recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));

  const output = { runId, overall, results, recommendations, timestamp: new Date().toISOString() };
  writeFileSync(join(__dirname, 'last-run.json'), JSON.stringify(output, null, 2));
  console.log(`\n💾 Results saved to health.db (run #${runId}) and last-run.json`);

  db.close();
  return output;
}

async function generateRecommendations(results, overall) {
  const { execSync } = await import('child_process');
  let apiKey;
  try {
    apiKey = execSync('op read "op://AfrexAI/Anthropic/api_key"', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    throw new Error('Could not retrieve API key from 1Password');
  }

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });

  const summary = results.map(r => `${r.area}: ${r.score}/100 (${r.status}) - ${r.findings.join('; ')}`).join('\n');

  const resp = await client.messages.create({
    model: config.anthropicModel,
    max_tokens: config.maxAiAnalysisTokens,
    messages: [{
      role: 'user',
      content: `You are a platform health advisor. Based on these health check results (overall: ${overall}/100), provide exactly 5-8 numbered actionable recommendations. Be specific and prioritize by impact.\n\n${summary}\n\nReturn ONLY a JSON array of strings, each being one recommendation.`
    }]
  });

  const text = resp.content[0].text;
  const match = text.match(/\[[\s\S]*\]/);
  if (match) return JSON.parse(match[0]);
  throw new Error('Could not parse AI response');
}

function generateFallbackRecommendations(results) {
  const recs = [];
  const critical = results.filter(r => r.status === 'critical');
  const warnings = results.filter(r => r.status === 'warning');
  
  if (critical.length > 0) recs.push(`Address critical issues in: ${critical.map(r => r.area).join(', ')}`);
  if (warnings.length > 0) recs.push(`Review warnings in: ${warnings.map(r => r.area).join(', ')}`);
  
  for (const r of results) {
    if (r.score < 50) recs.push(`${r.area}: Needs immediate attention (score: ${r.score})`);
    else if (r.score < 80) recs.push(`${r.area}: Room for improvement (score: ${r.score})`);
  }
  
  if (recs.length === 0) recs.push('All areas are healthy! Continue monitoring.');
  return recs;
}

runAllAnalyzers().catch(err => { console.error('Fatal:', err); process.exit(1); });
