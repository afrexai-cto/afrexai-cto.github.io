#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rulesPath = path.join(__dirname, 'rules.json');
const { rules } = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

function lint(text, filePath) {
  const lines = text.split('\n');
  const findings = [];

  for (const rule of rules) {
    if (rule.pattern) {
      const re = new RegExp(rule.pattern, 'gi');
      if (rule.countThreshold) {
        // Count-based rule: only flag if matches exceed threshold
        const matches = text.match(re);
        if (matches && matches.length >= rule.countThreshold) {
          findings.push({
            rule: rule.id,
            severity: rule.severity,
            message: `${rule.name}: Found ${matches.length} instances (threshold: ${rule.countThreshold})`,
            suggestion: rule.suggestion,
            matches: matches.slice(0, 5).map(m => `"${m}"`)
          });
        }
      } else {
        // Line-based rule: report each match with location
        for (let i = 0; i < lines.length; i++) {
          const lineMatches = lines[i].match(re);
          if (lineMatches) {
            // Skip matches inside code blocks
            const before = lines.slice(0, i + 1).join('\n');
            const codeBlockCount = (before.match(/```/g) || []).length;
            if (codeBlockCount % 2 === 1) continue; // inside a code block

            findings.push({
              rule: rule.id,
              severity: rule.severity,
              line: i + 1,
              message: `${rule.name}: "${lineMatches[0]}"`,
              suggestion: rule.suggestion,
              text: lines[i].trim().substring(0, 120)
            });
          }
        }
      }
    }

    // Heuristic checks
    if (rule.check === 'heuristic') {
      if (rule.id === 'too-many-rules') {
        // Count imperative sentences as rough proxy for distinct rules
        const imperatives = text.match(/^[\-\*]\s+.{10,}$/gm) || [];
        const numbered = text.match(/^\d+[\.\)]\s+.{10,}$/gm) || [];
        const ruleCount = imperatives.length + numbered.length;
        if (ruleCount > rule.threshold) {
          findings.push({
            rule: rule.id,
            severity: rule.severity,
            message: `${rule.name}: Found ~${ruleCount} rule-like items (threshold: ${rule.threshold})`,
            suggestion: rule.suggestion
          });
        }
      }

      if (rule.id === 'explain-why') {
        // Check for short imperative lines with no reasoning
        const shortRules = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (/^[\-\*]\s+\S/.test(line) && line.length < 60 && line.length > 10) {
            // Short bullet point — check if next line provides reasoning
            const next = (lines[i + 1] || '').trim();
            if (!next || /^[\-\*\d#]/.test(next) || next === '') {
              shortRules.push({ line: i + 1, text: line.substring(0, 80) });
            }
          }
        }
        if (shortRules.length > 3) {
          findings.push({
            rule: rule.id,
            severity: rule.severity,
            message: `${rule.name}: ${shortRules.length} short rules without visible reasoning`,
            suggestion: rule.suggestion,
            examples: shortRules.slice(0, 3).map(r => `L${r.line}: ${r.text}`)
          });
        }
      }
    }
  }

  return findings;
}

function formatFindings(findings, filePath) {
  if (findings.length === 0) {
    return `✅ ${filePath}: No issues found\n`;
  }

  const out = [`\n📋 ${filePath}: ${findings.length} issue(s)\n`];
  const icons = { warning: '⚠️', info: 'ℹ️', error: '❌' };

  for (const f of findings) {
    const icon = icons[f.severity] || '•';
    const loc = f.line ? `:${f.line}` : '';
    out.push(`  ${icon} [${f.rule}]${loc} ${f.message}`);
    if (f.text) out.push(`    → ${f.text}`);
    if (f.examples) f.examples.forEach(e => out.push(`    → ${e}`));
    if (f.matches) out.push(`    → Matches: ${f.matches.join(', ')}`);
    out.push(`    💡 ${f.suggestion}`);
    out.push('');
  }

  return out.join('\n');
}

// --- CLI ---
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node lint.js <file.md> [file2.md ...]');
  console.log('       node lint.js --json <file.md>');
  process.exit(1);
}

const jsonMode = args.includes('--json');
const files = args.filter(a => a !== '--json');
let totalIssues = 0;
const allResults = [];

for (const file of files) {
  try {
    const text = fs.readFileSync(file, 'utf8');
    const findings = lint(text, file);
    totalIssues += findings.length;

    if (jsonMode) {
      allResults.push({ file, findings });
    } else {
      process.stdout.write(formatFindings(findings, file));
    }
  } catch (err) {
    console.error(`Error reading ${file}: ${err.message}`);
  }
}

if (jsonMode) {
  console.log(JSON.stringify(allResults, null, 2));
}

if (!jsonMode) {
  console.log(`\n${totalIssues} total issue(s) across ${files.length} file(s)`);
}

process.exit(totalIssues > 0 ? 1 : 0);
