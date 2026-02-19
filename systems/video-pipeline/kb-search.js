/**
 * Knowledge base search - find related articles/content already saved.
 * Uses semantic similarity against stored KB embeddings.
 */
const { getEmbedding, bufferToEmbedding, cosineSimilarity } = require('./dedup');

/**
 * Search knowledge base for content related to an idea.
 * Returns top N most relevant articles.
 */
async function searchKnowledgeBase(db, ideaText, topN = 5) {
  const ideaEmbedding = await getEmbedding(ideaText);

  const rows = db.prepare(`
    SELECT id, title, url, content, tags, embedding
    FROM knowledge_base
    WHERE embedding IS NOT NULL
  `).all();

  const scored = rows.map(row => {
    const emb = bufferToEmbedding(row.embedding);
    const sim = cosineSimilarity(ideaEmbedding, emb);
    return { ...row, similarity: sim, embedding: undefined };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topN).filter(s => s.similarity > 0.2);
}

/**
 * Add an article to the knowledge base.
 */
async function addToKnowledgeBase(db, { title, url, content, tags }) {
  const embedding = await getEmbedding(`${title} ${content || ''}`);
  const { embeddingToBuffer } = require('./dedup');

  const result = db.prepare(`
    INSERT INTO knowledge_base (title, url, content, tags, embedding)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, url, content, tags, embeddingToBuffer(embedding));

  return result.lastInsertRowid;
}

module.exports = { searchKnowledgeBase, addToKnowledgeBase };
