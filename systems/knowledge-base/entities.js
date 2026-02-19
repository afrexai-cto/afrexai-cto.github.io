// Entity extraction from text using pattern matching
import { runStmt, allRows, getRow } from './db.js';

const CONCEPT_KEYWORDS = [
  'artificial intelligence', 'machine learning', 'blockchain', 'cryptocurrency',
  'climate change', 'renewable energy', 'quantum computing', 'cybersecurity',
  'deep learning', 'neural network', 'large language model', 'open source',
  'venture capital', 'startup', 'IPO', 'regulation', 'privacy', 'encryption',
  'robotics', 'autonomous', 'metaverse', 'web3', 'defi', 'NFT', 'AGI',
  'transformer', 'diffusion model', 'fine-tuning', 'RAG', 'vector database'
];

const STOP_NAMES = new Set([
  'The', 'This', 'That', 'These', 'Those', 'What', 'When', 'Where', 'Which',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December', 'Monday', 'Tuesday',
  'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Read More',
  'Sign Up', 'Log In', 'New York', 'San Francisco', 'Los Angeles',
  'United States', 'United Kingdom', 'Image Credit', 'Getty Images',
  'Share This', 'Click Here'
]);

const KNOWN_COMPANIES = ['Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'OpenAI', 'Anthropic',
  'Tesla', 'SpaceX', 'Netflix', 'Nvidia', 'Intel', 'AMD', 'Twitter', 'Stripe',
  'Shopify', 'Salesforce', 'Oracle', 'IBM', 'Samsung', 'Huawei', 'ByteDance',
  'TikTok', 'Uber', 'Airbnb', 'Coinbase', 'Binance', 'GitHub', 'GitLab',
  'Stability AI', 'Midjourney', 'Cohere', 'DeepMind', 'Mistral'];

function extractPeople(text) {
  const matches = [...text.matchAll(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})\b/g)];
  const people = new Map();
  for (const m of matches) {
    const name = m[1];
    if (STOP_NAMES.has(name) || name.split(' ').length < 2) continue;
    people.set(name, (people.get(name) || 0) + 1);
  }
  return [...people.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
    .map(([name]) => ({ name, type: 'person' }));
}

function extractCompanies(text) {
  const companies = new Map();
  const pattern = /\b([A-Z][A-Za-z]*(?:\s[A-Z][A-Za-z]*)*)\s+(Inc|Corp|Ltd|LLC|Co|Group|Holdings|Technologies|Labs|AI|Foundation)\b/g;
  for (const m of text.matchAll(pattern)) {
    const name = `${m[1]} ${m[2]}`;
    companies.set(name, (companies.get(name) || 0) + 1);
  }
  for (const name of KNOWN_COMPANIES) {
    if (text.includes(name)) companies.set(name, (companies.get(name) || 0) + 1);
  }
  return [...companies.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    .map(([name]) => ({ name, type: 'company' }));
}

function extractConcepts(text) {
  const lower = text.toLowerCase();
  return CONCEPT_KEYWORDS.filter(c => lower.includes(c.toLowerCase()))
    .map(name => ({ name, type: 'concept' }));
}

export function extractEntities(text) {
  return [...extractPeople(text), ...extractCompanies(text), ...extractConcepts(text)];
}

export function storeEntities(db, sourceId, entities) {
  for (const e of entities) {
    const canonical = e.name.toLowerCase().trim();
    db.run(`INSERT OR IGNORE INTO entities (name, type, canonical_name) VALUES (?, ?, ?)`,
      [e.name, e.type, canonical]);
    const row = getRow(db, `SELECT id FROM entities WHERE name = ? AND type = ?`, [e.name, e.type]);
    if (row) {
      db.run(`INSERT OR IGNORE INTO source_entities (source_id, entity_id, relevance) VALUES (?, ?, ?)`,
        [sourceId, row.id, e.relevance || 1.0]);
    }
  }
}
