# VALIDATION.md - Knowledge Base Test Results

**Date:** 2026-02-19T03:04:41.754Z
**Passed:** 20/20
**Failed:** 0

## Test Results

✅ YouTube URL detection
✅ YouTube video ID extraction
✅ Twitter URL detection
✅ Tweet info extraction
✅ PDF URL detection
✅ Embedding generation
✅ Cosine similarity - identical texts
✅ Cosine similarity - similar > different
✅ Text chunking
✅ Entity extraction - people
✅ Entity extraction - companies
✅ Entity extraction - concepts
✅ Database schema creation
✅ Source insertion + chunking + entities
✅ Insert second source
✅ Semantic search returns relevant results
✅ Query for cooking returns cooking article higher
✅ Entity filter works
✅ Cross-post summary generation
✅ Type filter works

## Components Tested

- URL type detection (YouTube, Twitter/X, PDF, article)
- Video ID and tweet info extraction
- Embedding generation (512-dim bag-of-words TF vectors)
- Cosine similarity (self=1.0, similar>different)
- Text chunking
- Entity extraction (people, companies, concepts)
- SQLite schema creation (sql.js, pure JS)
- Source ingestion with chunking and embedding
- Entity storage and linking
- Semantic search with time-aware ranking
- Source-type weighted ranking
- Entity-based filtering
- Cross-post summary generation
- Type filtering
