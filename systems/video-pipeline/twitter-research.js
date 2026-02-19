/**
 * X/Twitter research module.
 * Uses Twitter API v2 recent search to find what people are saying about a topic.
 */
const config = require('./config.json');

const TWITTER_BASE = 'https://api.twitter.com/2';

async function twitterFetch(endpoint, params = {}) {
  const url = new URL(`${TWITTER_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const resp = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN || config.twitter.bearerToken}`,
    },
  });
  
  if (!resp.ok) {
    throw new Error(`Twitter API ${resp.status}: ${await resp.text()}`);
  }
  return resp.json();
}

/**
 * Search recent tweets about a topic.
 * Returns { tweets, themes, angles }
 */
async function researchTopic(topic) {
  // Clean topic for search query
  const query = topic.replace(/[^\w\s]/g, '').split(/\s+/).slice(0, 8).join(' ');
  
  const data = await twitterFetch('/tweets/search/recent', {
    query: `${query} -is:retweet lang:en`,
    max_results: String(config.pipeline.maxResearchTweets),
    'tweet.fields': 'public_metrics,created_at,author_id,context_annotations',
    expansions: 'author_id',
    'user.fields': 'name,username,verified',
  });

  const tweets = (data.data || []).map(t => ({
    id: t.id,
    text: t.text,
    metrics: t.public_metrics,
    created_at: t.created_at,
  }));

  // Extract themes from context annotations
  const themes = new Set();
  (data.data || []).forEach(t => {
    (t.context_annotations || []).forEach(a => {
      if (a.entity?.name) themes.add(a.entity.name);
    });
  });

  // Extract common angles from tweet text
  const angles = extractAngles(tweets);

  return {
    tweets,
    themes: [...themes],
    angles,
    tweetCount: tweets.length,
    topTweet: tweets.sort((a, b) =>
      (b.metrics?.like_count || 0) - (a.metrics?.like_count || 0)
    )[0] || null,
  };
}

/** Extract common angles/sentiments from tweets */
function extractAngles(tweets) {
  const angles = [];
  const texts = tweets.map(t => t.text.toLowerCase()).join(' ');

  const patterns = [
    { re: /\bhow to\b/i, angle: 'Tutorial/How-to' },
    { re: /\bwhy\b.*\b(fail|wrong|bad|problem)\b/i, angle: 'Problem analysis' },
    { re: /\b(compare|vs|versus|better)\b/i, angle: 'Comparison' },
    { re: /\b(future|trend|predict|2026)\b/i, angle: 'Trend/Future outlook' },
    { re: /\b(beginner|start|learn|intro)\b/i, angle: 'Beginner guide' },
    { re: /\b(myth|misconception|wrong|actually)\b/i, angle: 'Myth-busting' },
    { re: /\b(review|opinion|think|experience)\b/i, angle: 'Review/Opinion' },
    { re: /\b(top \d|best|worst|list)\b/i, angle: 'Listicle' },
  ];

  patterns.forEach(({ re, angle }) => {
    if (re.test(texts)) angles.push(angle);
  });

  return angles.length > 0 ? angles : ['General overview', 'Deep dive analysis'];
}

module.exports = { researchTopic, extractAngles };
