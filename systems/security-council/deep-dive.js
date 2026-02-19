#!/usr/bin/env node
// Security Council - Deep Dive
// Perform detailed analysis on a specific finding

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import Database from 'better-sqlite3';

const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url), 'utf8'));
const dbPath = new URL(config.dbPath, import.meta.url).pathname;

function getApiKey() {
  return execSync(`op read "${config.apiKeyRef}"`, { encoding: 'utf8' }).trim();
}

async function callAnthropic(apiKey, system, user) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: config.anthropicModel,
      max_tokens: 8192,
      system,
      messages: [{ role: 'user', content: user }]
    })
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${await resp.text()}`);
  return (await resp.json()).content[0].text;
}

async function deepDive(findingNumber, scanId) {
  const db = new Database(dbPath);
  
  // Get the finding
  const query = scanId
    ? 'SELECT * FROM findings WHERE finding_number = ? AND scan_id = ?'
    : 'SELECT * FROM findings WHERE finding_number = ? ORDER BY scan_id DESC LIMIT 1';
  const args = scanId ? [findingNumber, scanId] : [findingNumber];
  const finding = db.prepare(query).get(...args);

  if (!finding) {
    console.error(`❌ Finding #${findingNumber} not found`);
    process.exit(1);
  }

  console.log(`🔬 Deep diving into Finding #${finding.finding_number}: ${finding.title}`);
  console.log(`   Severity: ${finding.severity} | Perspective: ${finding.perspective}`);
  console.log(`   File: ${finding.file_path || 'N/A'}\n`);

  // Read the actual file if it exists
  let fileContent = '';
  if (finding.file_path) {
    try {
      const fullPath = `${config.scanRoot}/${finding.file_path}`;
      fileContent = readFileSync(fullPath, 'utf8');
    } catch { fileContent = '[File not accessible]'; }
  }

  const apiKey = getApiKey();

  const system = `You are a senior security researcher performing a deep-dive analysis. Be thorough, specific, and actionable. Consider all four perspectives: offensive (how to exploit), defensive (how to protect), data privacy (what data is at risk), and operational realism (is this a real risk or theater).`;

  const prompt = `Perform a deep-dive security analysis on this finding:

FINDING #${finding.finding_number}
Title: ${finding.title}
Severity: ${finding.severity}
Perspective: ${finding.perspective}
File: ${finding.file_path || 'N/A'}
Lines: ${finding.line_range || 'N/A'}
Description: ${finding.description}
Evidence: ${finding.evidence || 'N/A'}
Original Recommendation: ${finding.recommendation || 'N/A'}

${fileContent ? `FULL FILE CONTENT:\n\`\`\`\n${fileContent}\n\`\`\`` : ''}

Provide:
1. **Exploit Scenario** — Step-by-step how an attacker would exploit this
2. **Impact Assessment** — What's the blast radius if exploited
3. **Root Cause** — Why does this vulnerability exist
4. **Fix** — Specific code changes or configuration needed (with examples)
5. **Verification** — How to confirm the fix works
6. **Related Risks** — Other issues this might indicate
7. **Priority** — Confirm or adjust the severity rating with justification`;

  const analysis = await callAnthropic(apiKey, system, prompt);

  // Store in DB
  db.prepare('INSERT INTO deep_dives (finding_id, analysis) VALUES (?, ?)')
    .run(finding.id, analysis);
  db.close();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`DEEP DIVE: Finding #${finding.finding_number} — ${finding.title}`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(analysis);
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Deep dive saved to database');
}

const findingNum = parseInt(process.argv[2]);
const scanId = process.argv[3] ? parseInt(process.argv[3]) : null;

if (!findingNum) {
  console.log('Usage: node deep-dive.js <finding-number> [scan-id]');
  process.exit(1);
}

deepDive(findingNum, scanId).catch(e => { console.error(e); process.exit(1); });
