// Main ingestion pipeline - handles all URL types
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { getDb, closeDb, runStmt, getRow, saveDb } from './db.js';
import { embed, chunkText } from './embeddings.js';
import { extractEntities, storeEntities } from './entities.js';
import { isYouTubeUrl, fetchYouTubeData } from './youtube.js';
import { isTwitterUrl, fetchTweetData } from './twitter.js';
import { isPdfUrl, fetchPdfData } from './pdf.js';

async function fetchArticleData(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml'
    },
    redirect: 'follow'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, aside, .sidebar, .ad, .advertisement').remove();

  const title = $('meta[property="og:title"]').attr('content')
    || $('title').text() || $('h1').first().text() || url;
  const author = $('meta[name="author"]').attr('content')
    || $('meta[property="article:author"]').attr('content') || null;
  const published = $('meta[property="article:published_time"]').attr('content')
    || $('time').first().attr('datetime') || null;

  let content = '';
  for (const sel of ['article', '[role="main"]', 'main', '.post-content', '.article-body', '.content']) {
    const el = $(sel);
    if (el.length) { content = el.text(); break; }
  }
  if (!content) content = $('body').text();
  content = content.replace(/\s+/g, ' ').trim();

  return {
    type: 'article', title: title.trim(), author, published_at: published, url, content,
    metadata: { description: $('meta[name="description"]').attr('content') || '' }
  };
}

async function fetchSourceData(url) {
  if (isYouTubeUrl(url)) return fetchYouTubeData(url);
  if (isTwitterUrl(url)) return fetchTweetData(url);
  if (isPdfUrl(url)) return fetchPdfData(url);
  return fetchArticleData(url);
}

function storeSource(db, data) {
  const existing = getRow(db, 'SELECT id FROM sources WHERE url = ?', [data.url]);
  if (existing) {
    console.log(`  Already ingested: ${data.url} (id=${existing.id})`);
    return existing.id;
  }

  const summary = (data.content || '').slice(0, 500);
  const weight = { article: 1.0, youtube: 0.9, twitter: 0.7, pdf: 1.1 }[data.type] || 1.0;

  const sourceId = runStmt(db,
    `INSERT INTO sources (url, type, title, author, published_at, content_text, summary, metadata, source_weight)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.url, data.type, data.title, data.author, data.published_at || null,
     data.content, summary, JSON.stringify(data.metadata || {}), weight]
  );

  const chunks = chunkText(data.content || '', 300);
  for (let i = 0; i < chunks.length; i++) {
    const emb = embed(chunks[i]);
    db.run(`INSERT INTO chunks (source_id, chunk_index, text, embedding, token_count) VALUES (?, ?, ?, ?, ?)`,
      [sourceId, i, chunks[i], JSON.stringify(emb), chunks[i].split(/\s+/).length]);
  }

  const entities = extractEntities(data.content || '');
  if (entities.length) storeEntities(db, sourceId, entities);

  console.log(`  Stored: ${data.title} (${data.type}, ${chunks.length} chunks, ${entities.length} entities)`);
  return sourceId;
}

export async function ingest(url, options = {}) {
  console.log(`Ingesting: ${url}`);
  const db = await getDb();
  try {
    const data = await fetchSourceData(url);
    const sourceId = storeSource(db, data);

    if (data.linkedUrls?.length) {
      console.log(`  Found ${data.linkedUrls.length} linked URL(s) in tweet`);
      for (const linkedUrl of data.linkedUrls) {
        try {
          console.log(`  Cross-ingesting: ${linkedUrl}`);
          const linkedData = await fetchSourceData(linkedUrl);
          const linkedId = storeSource(db, linkedData);
          if (linkedId !== sourceId) {
            db.run(`INSERT OR IGNORE INTO cross_references (source_id, linked_source_id, relationship) VALUES (?, ?, 'tweet_links')`,
              [sourceId, linkedId]);
          }
        } catch (e) {
          console.warn(`  Failed to cross-ingest ${linkedUrl}: ${e.message}`);
        }
      }
    }
    saveDb();
    return sourceId;
  } catch (e) {
    console.error(`  Failed: ${e.message}`);
    throw e;
  }
}

if (process.argv[1]?.endsWith('ingest.js') && process.argv.length > 2) {
  const urls = process.argv.slice(2);
  for (const url of urls) {
    try { await ingest(url); } catch (e) { console.error(e.message); }
  }
  closeDb();
}
