#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb, calcCost } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSONL_PATH = join(__dirname, 'usage.jsonl');

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    model:  { type: 'string', short: 'm' },
    input:  { type: 'string', short: 'i' },
    output: { type: 'string', short: 'o' },
    task:   { type: 'string', short: 't' },
  }
});

const command = positionals[0];

if (command === 'log') {
  const { model, input, output, task } = values;
  if (!model || !input || !output) {
    console.error('Usage: node track.js log --model <model> --input <tokens> --output <tokens> [--task <type>]');
    process.exit(1);
  }

  const inputTokens = parseInt(input);
  const outputTokens = parseInt(output);
  const { inputCost, outputCost, totalCost, provider } = calcCost(model, inputTokens, outputTokens);
  const timestamp = new Date().toISOString();

  // JSONL log
  const entry = { timestamp, model, provider, input_tokens: inputTokens, output_tokens: outputTokens, task: task || null, input_cost: inputCost, output_cost: outputCost, total_cost: totalCost };
  appendFileSync(JSONL_PATH, JSON.stringify(entry) + '\n');

  // SQLite
  const db = getDb();
  db.prepare(`INSERT INTO usage_log (timestamp, model, provider, input_tokens, output_tokens, task, input_cost, output_cost, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(timestamp, model, provider, inputTokens, outputTokens, task || null, inputCost, outputCost, totalCost);
  db.close();

  console.log(`Logged: ${model} | ${inputTokens}in/${outputTokens}out | $${totalCost.toFixed(6)} | task: ${task || 'none'}`);

} else if (command === 'rates') {
  const { getRates } = await import('./db.js');
  const rates = getRates();
  console.log('Model rates (per 1M tokens):');
  for (const [m, r] of Object.entries(rates)) {
    console.log(`  ${m.padEnd(22)} in: $${r.input.toFixed(2).padStart(6)}  out: $${r.output.toFixed(2).padStart(6)}  [${r.provider}]`);
  }

} else {
  console.error('Commands: log, rates');
  process.exit(1);
}
