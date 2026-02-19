#!/usr/bin/env node
// Redaction engine — strips API keys, tokens, credentials from text
'use strict';

const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

const PATTERNS = Object.entries(config.redaction.patterns).map(([name, pat]) => ({
  name,
  regex: new RegExp(pat, 'gm'),
}));

const REPLACEMENT = config.redaction.replacement || '[REDACTED]';

function redact(text) {
  const findings = [];
  let result = text;
  for (const { name, regex } of PATTERNS) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      findings.push({ type: name, position: match.index, length: match[0].length });
    }
    result = result.replace(regex, REPLACEMENT);
  }
  return { redacted: result, findings };
}

// CLI mode
if (require.main === module) {
  const input = process.argv.slice(2).join(' ');
  if (!input) {
    console.error('Usage: node redact.js "text containing secrets"');
    process.exit(1);
  }
  const { redacted, findings } = redact(input);
  console.log(redacted);
  if (findings.length > 0) {
    console.error(`\n[redact] ${findings.length} item(s) redacted: ${findings.map(f => f.type).join(', ')}`);
  }
}

module.exports = { redact };
