#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const patternsFile = path.join(__dirname, 'patterns.json');
const { patterns } = JSON.parse(fs.readFileSync(patternsFile, 'utf8'));

// Compile patterns once
const compiled = patterns.map(p => ({
  ...p,
  regex: new RegExp(p.find, p.flags || 'gi')
}));

function humanize(text) {
  if (!text || !text.trim()) return text;

  let result = text;

  for (const p of compiled) {
    if (p.id === 'capitalize-after-period') continue; // handled in cleanup
    result = result.replace(p.regex, p.replace);
  }

  // Fix capitalization after sentence-starting replacements that became empty
  // e.g., "It's worth noting that the..." → " the..." → "The..."
  result = result.replace(/([.!?]\s+)([a-z])/g, (_, pre, c) => pre + c.toUpperCase());
  // Fix start of string
  result = result.replace(/^\s*([a-z])/, (_, c) => c.toUpperCase());

  // Clean up double commas, double spaces, leading/trailing whitespace
  result = result.replace(/,\s*,/g, ',');
  result = result.replace(/ {2,}/g, ' ');
  result = result.replace(/\n /g, '\n');
  result = result.trim();

  return result;
}

// Export for testing
module.exports = { humanize };

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Direct argument mode
    console.log(humanize(args.join(' ')));
  } else {
    // Pipe/stdin mode
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      if (data.trim()) console.log(humanize(data));
    });
  }
}
