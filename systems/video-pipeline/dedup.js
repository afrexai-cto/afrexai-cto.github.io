/**
 * Deduplication via semantic similarity search against previous pitches.
 * Uses SQLite + OpenAI embeddings with cosine similarity.
 */
const { OpenAI } = require('openai');
const config = require('./config.json');

let openaiClient = null;

function getOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || config.openai.apiKey });
  }
  return openaiClient;
}

/** Generate embedding vector for text */
async function getEmbedding(text) {
  const resp = await getOpenAI().embeddings.create({
    model: config.openai.embeddingModel,
    input: text,
    dimensions: config.openai.embeddingDimensions,
  });
  return resp.data[0].embedding;
}

/** Convert float64 array to Buffer (float32) */
function embeddingToBuffer(embedding) {
  const buf = Buffer.alloc(embedding.length * 4);
  for (let i = 0; i < embedding.length; i++) {
    buf.writeFloatLE(embedding[i], i * 4);
  }
  return buf;
}

/** Convert Buffer back to float64 array */
function bufferToEmbedding(buf) {
  const arr = [];
  for (let i = 0; i < buf.length; i += 4) {
    arr.push(buf.readFloatLE(i));
  }
  return arr;
}

/** Cosine similarity between two vectors */
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Check if idea is duplicate against all existing pitches.
 * Returns { isDuplicate, bestMatch, similarity } 
 */
async function checkDuplicate(db, ideaText) {
  const embedding = await getEmbedding(ideaText);
  const rows = db.prepare(`
    SELECT pe.pitch_id, pe.embedding, p.idea, p.status
    FROM pitch_embeddings pe
    JOIN pitches p ON p.id = pe.pitch_id
    WHERE p.status != 'duplicate'
  `).all();

  let bestMatch = null;
  let bestSimilarity = -1;

  for (const row of rows) {
    const existing = bufferToEmbedding(row.embedding);
    const sim = cosineSimilarity(embedding, existing);
    if (sim > bestSimilarity) {
      bestSimilarity = sim;
      bestMatch = { pitchId: row.pitch_id, idea: row.idea, status: row.status };
    }
  }

  const threshold = config.pipeline.duplicateThreshold;
  return {
    isDuplicate: bestSimilarity > threshold,
    bestMatch,
    similarity: bestSimilarity,
    embedding,
  };
}

/** Store embedding for a pitch */
function storeEmbedding(db, pitchId, embedding) {
  db.prepare('INSERT OR REPLACE INTO pitch_embeddings (pitch_id, embedding) VALUES (?, ?)')
    .run(pitchId, embeddingToBuffer(embedding));
}

module.exports = {
  getEmbedding,
  checkDuplicate,
  storeEmbedding,
  cosineSimilarity,
  embeddingToBuffer,
  bufferToEmbedding,
};
