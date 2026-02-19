import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'tracker.db');

export function getDb() {
  const db = new DatabaseSync(DB_PATH);
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  // Execute each statement separately
  for (const stmt of schema.split(';').map(s => s.trim()).filter(Boolean)) {
    db.exec(stmt);
  }
  return db;
}

export function getRates() {
  return JSON.parse(readFileSync(join(__dirname, 'rates.json'), 'utf8')).rates;
}

export function calcCost(model, inputTokens, outputTokens) {
  const rates = getRates();
  const r = rates[model];
  if (!r) throw new Error(`Unknown model: ${model}. Available: ${Object.keys(rates).join(', ')}`);
  const inputCost = (inputTokens / 1_000_000) * r.input;
  const outputCost = (outputTokens / 1_000_000) * r.output;
  return { inputCost, outputCost, totalCost: inputCost + outputCost, provider: r.provider };
}
