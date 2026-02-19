#!/usr/bin/env node
// Security Council - AI Analyzer
// Sends code batches to Anthropic API for multi-perspective security analysis

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import Database from 'better-sqlite3';

const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url), 'utf8'));
const dbPath = new URL(config.dbPath, import.meta.url).pathname;

export function initDb() {
  const db = new Database(dbPath);
  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  db.exec(schema);
  db.close();
  console.log('✅ Database initialized');
}

function getApiKey() {
  return execSync(`op read "${config.apiKeyRef}"`, { encoding: 'utf8' }).trim();
}

async function callAnthropic(apiKey, systemPrompt, userContent) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: config.anthropicModel,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }]
    })
  });
  if (!resp.ok) throw new Error(`Anthropic API ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data.content[0].text;
}

function buildBatches(files) {
  const batches = [];
  let current = [];
  let currentSize = 0;
  for (const f of files) {
    if (current.length >= config.batchSize) {
      batches.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(f);
    currentSize += f.size;
  }
  if (current.length) batches.push(current);
  return batches;
}

function formatFilesForPrompt(files) {
  return files.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n');
}

const ANALYSIS_PROMPT = `Analyze the following code files for security issues from your assigned perspective.

For each finding, output EXACTLY this JSON format (one per line, no markdown):
{"severity":"critical|high|medium|low|info","title":"Short title","file_path":"path","line_range":"start-end or null","description":"What's wrong","evidence":"relevant code snippet","recommendation":"How to fix"}

If no findings, output: {"no_findings":true}
Only output JSON lines. No commentary.

FILES:
`;

async function analyze() {
  const scanData = JSON.parse(readFileSync(new URL('./scan-data.json', import.meta.url), 'utf8'));
  
  let apiKey;
  try {
    apiKey = getApiKey();
  } catch (e) {
    console.error('❌ Failed to get API key from 1Password. Ensure `op` CLI is authenticated.');
    console.error('   Run: eval $(op signin)');
    process.exit(1);
  }

  const db = new Database(dbPath);
  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  db.exec(schema);

  const scan = db.prepare(
    'INSERT INTO scans (files_scanned) VALUES (?)'
  ).run(scanData.fileCount);
  const scanId = scan.lastInsertRowid;

  const batches = buildBatches(scanData.files);
  const perspectives = Object.entries(config.perspectives);
  const allFindings = [];
  let findingNum = 0;

  console.log(`🔍 Analyzing ${scanData.fileCount} files across ${batches.length} batches × ${perspectives.length} perspectives`);

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const filesText = formatFilesForPrompt(batch);

    for (const [perspective, systemPrompt] of perspectives) {
      console.log(`  📋 Batch ${bi + 1}/${batches.length} — ${perspective}`);
      try {
        const result = await callAnthropic(apiKey, systemPrompt, ANALYSIS_PROMPT + filesText);
        
        for (const line of result.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('//')) continue;
          try {
            const finding = JSON.parse(trimmed);
            if (finding.no_findings) continue;
            findingNum++;
            finding.perspective = perspective;
            finding.finding_number = findingNum;
            allFindings.push(finding);

            db.prepare(`INSERT INTO findings (scan_id, finding_number, severity, perspective, title, file_path, line_range, description, evidence, recommendation)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
              .run(scanId, findingNum, finding.severity, perspective, finding.title, finding.file_path || null, finding.line_range || null, finding.description, finding.evidence || null, finding.recommendation || null);
          } catch { /* skip non-JSON lines */ }
        }
      } catch (e) {
        console.error(`  ❌ Error on batch ${bi + 1}/${perspective}: ${e.message}`);
      }
    }
  }

  // Update scan record
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of allFindings) counts[f.severity] = (counts[f.severity] || 0) + 1;

  db.prepare(`UPDATE scans SET completed_at = datetime('now'), total_findings = ?, critical_count = ?, high_count = ?, medium_count = ?, low_count = ?, status = 'completed' WHERE id = ?`)
    .run(allFindings.length, counts.critical, counts.high, counts.medium, counts.low, scanId);

  db.close();

  // Write findings for report generator
  writeFileSync(
    new URL('./findings.json', import.meta.url),
    JSON.stringify({ scanId, scannedAt: scanData.scannedAt, findings: allFindings }, null, 2)
  );

  console.log(`\n✅ Analysis complete: ${allFindings.length} findings (${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low)`);
  
  if (counts.critical > 0) {
    console.log(`\n🚨 CRITICAL FINDINGS DETECTED — Immediate attention required!`);
  }
}

// Run if executed directly
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/.*\//, ''));
if (isMain || process.argv[1]?.endsWith('analyzer.js')) {
  analyze().catch(e => { console.error(e); process.exit(1); });
}
