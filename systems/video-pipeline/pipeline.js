/**
 * Main pipeline orchestrator.
 * Slack trigger → dedup check → Twitter research → KB search → Asana card → reply
 */
const { PipelineDB } = require('./db');
const path = require('path');
const fs = require('fs');
const { checkDuplicate, storeEmbedding } = require('./dedup');
const { researchTopic } = require('./twitter-research');
const { searchKnowledgeBase } = require('./kb-search');
const { createVideoIdeaCard } = require('./asana-client');
const config = require('./config.json');

const DB_PATH = path.join(__dirname, 'pipeline.db');

/** Initialize database with schema */
async function initDB() {
  const db = await PipelineDB.open(DB_PATH);
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  return db;
}

/**
 * Run the full pipeline for a video idea.
 * @param {object} input - { idea, threadContext, slackChannel, slackThreadTs, slackUser }
 * @returns {object} result
 */
async function runPipeline(input) {
  const db = await initDB();

  try {
    const { idea, threadContext, slackChannel, slackThreadTs, slackUser } = input;

    // Step 1: Dedup check
    console.log(`[pipeline] Checking duplicates for: "${idea.slice(0, 80)}..."`);
    const dupResult = await checkDuplicate(db, idea);

    if (dupResult.isDuplicate) {
      // Store as duplicate
      const ins = db.prepare(`
        INSERT INTO pitches (idea, slack_channel, slack_thread_ts, slack_user, thread_context, status, duplicate_of, similarity_score)
        VALUES (?, ?, ?, ?, ?, 'duplicate', ?, ?)
      `).run(idea, slackChannel, slackThreadTs, slackUser,
        JSON.stringify(threadContext), dupResult.bestMatch.pitchId, dupResult.similarity);

      storeEmbedding(db, ins.lastInsertRowid, dupResult.embedding);

      return {
        duplicate: true,
        duplicateOf: dupResult.bestMatch.idea,
        similarity: dupResult.similarity,
        pitchId: ins.lastInsertRowid,
      };
    }

    // Step 2: Twitter research
    console.log('[pipeline] Running Twitter research...');
    let research;
    try {
      research = await researchTopic(idea);
    } catch (err) {
      console.warn('[pipeline] Twitter research failed, continuing:', err.message);
      research = { tweets: [], themes: [], angles: ['General overview'], tweetCount: 0, topTweet: null };
    }

    // Step 3: Knowledge base search
    console.log('[pipeline] Searching knowledge base...');
    let kbResults;
    try {
      kbResults = await searchKnowledgeBase(db, idea);
    } catch (err) {
      console.warn('[pipeline] KB search failed, continuing:', err.message);
      kbResults = [];
    }

    // Step 4: Combine angles
    const allAngles = [...new Set([
      ...research.angles,
      ...(kbResults.length > 0 ? ['Build on existing content'] : []),
    ])];

    // Step 5: Create Asana card
    console.log('[pipeline] Creating Asana card...');
    let asanaResult;
    try {
      asanaResult = await createVideoIdeaCard({
        idea,
        researchFindings: research,
        kbSources: kbResults,
        suggestedAngles: allAngles,
        slackUser,
        slackChannel,
      });
    } catch (err) {
      console.warn('[pipeline] Asana card creation failed:', err.message);
      asanaResult = { gid: null, url: null };
    }

    // Step 6: Store pitch in DB
    const ins = db.prepare(`
      INSERT INTO pitches (idea, slack_channel, slack_thread_ts, slack_user, thread_context,
        research_findings, kb_sources, suggested_angles, asana_task_gid, asana_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pitched')
    `).run(
      idea, slackChannel, slackThreadTs, slackUser,
      JSON.stringify(threadContext),
      JSON.stringify(research),
      JSON.stringify(kbResults),
      JSON.stringify(allAngles),
      asanaResult.gid,
      asanaResult.url,
    );

    storeEmbedding(db, ins.lastInsertRowid, dupResult.embedding);

    return {
      duplicate: false,
      pitchId: ins.lastInsertRowid,
      asanaUrl: asanaResult.url,
      asanaGid: asanaResult.gid,
      researchSummary: `${research.tweetCount} tweets analyzed, ${research.themes.length} themes found`,
      angles: allAngles,
      kbMatches: kbResults.length,
    };
  } finally {
    db.close();
  }
}

module.exports = { runPipeline, initDB };
