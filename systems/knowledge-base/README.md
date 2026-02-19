# Knowledge Base (RAG)

Semantic search knowledge base with multi-source ingestion, entity extraction, and time-aware ranking.

## Setup

```bash
npm install
```

## Usage

### Ingest URLs

```bash
# Web articles
node ingest.js https://example.com/article

# YouTube (auto-extracts transcript)
node ingest.js https://www.youtube.com/watch?v=VIDEO_ID

# Twitter/X (also ingests linked articles)
node ingest.js https://x.com/user/status/123456

# PDFs
node ingest.js https://example.com/paper.pdf

# Multiple URLs
node ingest.js URL1 URL2 URL3
```

### Query

```bash
node query.js what are the latest AI developments
```

### Programmatic

```javascript
import { ingest } from './ingest.js';
import { query, crossPostSummary } from './query.js';

await ingest('https://example.com/article');
const results = query('search terms', {
  limit: 10,
  type: 'article',        // filter by source type
  entityFilter: 'openai', // filter by entity
  timeWeight: 0.3,        // 0-1, higher = more recency bias
  minScore: 0.05
});
console.log(crossPostSummary(results));
```

## Architecture

| Component | File | Purpose |
|-----------|------|---------|
| Ingestion | `ingest.js` | URL routing, article scraping, storage pipeline |
| YouTube | `youtube.js` | Transcript extraction via caption tracks |
| Twitter | `twitter.js` | Tweet extraction via oEmbed, linked URL detection |
| PDF | `pdf.js` | Text extraction via pdf-parse |
| Entities | `entities.js` | Pattern-based NER (people, companies, concepts) |
| Embeddings | `embeddings.js` | Bag-of-words TF vectors (512-dim) |
| Query | `query.js` | Semantic search with time decay + source weighting |
| Database | `db.js` | SQLite connection + schema setup |
| Schema | `schema.sql` | Tables: sources, chunks, entities, cross_references |

## Ranking

```
finalScore = (semantic * (1 - timeWeight) + timeDecay * timeWeight) * sourceWeight
```

- **Semantic:** Cosine similarity between query and chunk embeddings
- **Time decay:** Half-life of 30 days (configurable)
- **Source weights:** PDF 1.1, Article 1.0, YouTube 0.9, Twitter 0.7

## Paywalled Content

For paywalled articles, use browser automation to extract content before ingestion:

```javascript
// Example with Playwright/Puppeteer
const browser = await chromium.launch();
const page = await browser.newPage();
// Log in or use cookies for the paywalled site
await page.goto(url);
const content = await page.textContent('article');
// Then ingest the extracted content directly via the store pipeline
```

The system's `fetchArticleData` sends standard browser headers. For sites requiring JavaScript rendering or authentication, pre-extract the HTML and pass it through Cheerio, or extend `ingest.js` with a browser automation fallback.

## Cross-Post Summaries

Use `crossPostSummary(results)` to generate a markdown summary across multiple sources, including entities and excerpts. Useful for briefings, newsletters, or sharing across channels.

## Production Upgrades

- **Embeddings:** Replace `embeddings.js` with OpenAI `text-embedding-3-small` or Cohere for much better semantic search
- **Entity extraction:** Use a proper NER model (spaCy, Hugging Face) instead of regex patterns
- **Twitter:** Use Twitter API v2 for reliable thread extraction
- **Vector search:** Use sqlite-vss extension for native vector similarity search at scale
