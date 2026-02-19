#!/usr/bin/env node
// Prompt injection detector — scans text for injection markers
'use strict';

const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

const MARKERS = config.injection.markers;

function detect(text) {
  const found = [];
  const lower = text.toLowerCase();
  for (const marker of MARKERS) {
    const search = marker.toLowerCase();
    let idx = lower.indexOf(search);
    while (idx !== -1) {
      found.push({ marker, position: idx, context: text.substring(Math.max(0, idx - 20), idx + marker.length + 20).trim() });
      idx = lower.indexOf(search, idx + 1);
    }
  }
  return { injectionDetected: found.length > 0, findings: found };
}

function sanitize(text) {
  let result = text;
  for (const marker of MARKERS) {
    const re = new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(re, '[INJECTION-BLOCKED]');
  }
  return result;
}

// CLI mode
if (require.main === module) {
  const input = process.argv.slice(2).join(' ') || fs.readFileSync(0, 'utf8');
  const result = detect(input);
  if (result.injectionDetected) {
    console.log(`⚠️  INJECTION DETECTED — ${result.findings.length} marker(s) found:`);
    for (const f of result.findings) {
      console.log(`  • "${f.marker}" at pos ${f.position} | ...${f.context}...`);
    }
    console.log('\nSanitized output:');
    console.log(sanitize(input));
  } else {
    console.log('✅ No injection markers detected.');
  }
}

module.exports = { detect, sanitize };
