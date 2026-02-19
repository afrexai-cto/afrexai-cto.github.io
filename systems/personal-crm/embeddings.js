// Embedding generation via OpenAI API
import OpenAI from 'openai';
import { execSync } from 'child_process';

let _client;

function getClient() {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY ||
      execSync('op read "op://AfrexAI/OpenAI/api_key"', { encoding: 'utf8' }).trim();
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export async function getEmbedding(text) {
  const client = getClient();
  const resp = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  });
  return resp.data[0].embedding;
}

export async function getEmbeddings(texts) {
  const client = getClient();
  const resp = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts.map(t => t.slice(0, 8000)),
  });
  return resp.data.map(d => d.embedding);
}
