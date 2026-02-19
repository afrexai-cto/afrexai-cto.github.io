// Simple local embeddings using term frequency vectors
// No external API needed - works offline with bag-of-words TF approach
// For production, swap in OpenAI/Cohere embeddings

const VOCAB_SIZE = 512; // hash-bucketed vocabulary

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && t.length < 30);
}

function hashToken(token) {
  let h = 0;
  for (let i = 0; i < token.length; i++) {
    h = ((h << 5) - h + token.charCodeAt(i)) | 0;
  }
  return ((h % VOCAB_SIZE) + VOCAB_SIZE) % VOCAB_SIZE;
}

export function embed(text) {
  const tokens = tokenize(text);
  const vec = new Float32Array(VOCAB_SIZE);
  for (const t of tokens) vec[hashToken(t)]++;
  // L2 normalize
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  const result = [];
  for (let i = 0; i < vec.length; i++) result.push(+(vec[i] / norm).toFixed(6));
  return result;
}

export function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function chunkText(text, maxTokens = 300) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += maxTokens) {
    const chunk = words.slice(i, i + maxTokens).join(' ');
    if (chunk.trim()) chunks.push(chunk);
  }
  return chunks.length ? chunks : [text || ''];
}
