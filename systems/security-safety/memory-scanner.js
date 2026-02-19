#!/usr/bin/env node
// Memory file scanner — checks for suspicious patterns in memory files
'use strict';

const fs = require('fs');
const path = require('path');

const SUSPICIOUS = [
  { name: 'embedded_credentials', regex: /(?:password|secret|token|api_key)\s*[:=]\s*\S{8,}/gi },
  { name: 'base64_blob', regex: /[A-Za-z0-9+/]{100,}={0,2}/g },
  { name: 'injection_marker', regex: /(?:System:|Ignore previous|IGNORE PREVIOUS|override instruction)/gi },
  { name: 'url_with_credentials', regex: /https?:\/\/[^:]+:[^@]+@/gi },
  { name: 'private_key', regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
  { name: 'hex_encoded_secret', regex: /0x[0-9a-fA-F]{40,}/g },
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  for (const { name, regex } of SUSPICIOUS) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(content)) !== null) {
      findings.push({ pattern: name, position: m.index, snippet: content.substring(m.index, m.index + 40) + '...' });
    }
  }
  return findings;
}

function scanDirectory(dir) {
  const results = { timestamp: new Date().toISOString(), scanned: 0, issues: [] };
  if (!fs.existsSync(dir)) return results;

  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) walk(full);
      else if (entry.isFile() && /\.(md|txt|json)$/i.test(entry.name)) {
        results.scanned++;
        const findings = scanFile(full);
        if (findings.length) results.issues.push({ file: full, findings });
      }
    }
  };
  walk(dir);
  return results;
}

if (require.main === module) {
  const target = process.argv[2] || path.join(process.env.HOME, '.openclaw/workspace-main/memory');
  const r = scanDirectory(target);
  console.log(JSON.stringify(r, null, 2));
  if (r.issues.length) {
    console.error(`\n⚠️  ${r.issues.length} file(s) with suspicious patterns`);
    process.exit(1);
  } else {
    console.log(`\n✅ ${r.scanned} files scanned, no issues found`);
  }
}

module.exports = { scanFile, scanDirectory };
