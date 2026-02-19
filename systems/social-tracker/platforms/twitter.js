/**
 * X/Twitter API v2 Client
 * Endpoints:
 *   GET /2/users/{id}?user.fields=public_metrics  (Bearer token auth)
 *   GET /2/users/{id}/tweets?tweet.fields=created_at,public_metrics,non_public_metrics&max_results=100
 *   public_metrics: retweet_count, reply_count, like_count, quote_count, bookmark_count, impression_count
 *   non_public_metrics: impression_count, url_link_clicks, user_profile_clicks (OAuth 2.0 user context only)
 */

const config = require('../config.json');

const MOCK_ACCOUNT = {
  followers_count: 3240,
  following_count: 891,
  tweet_count: 1452,
  listed_count: 34,
};

const MOCK_TWEETS = [
  { tweet_id: 'tw_001', text: 'Just shipped v2.0 of our product. Months of work, finally live. Here\'s what we learned 🧵', created_tweet_at: '2026-02-18T14:30:00Z', impression_count: 45200, like_count: 312, retweet_count: 89, reply_count: 34, quote_count: 12, bookmark_count: 67 },
  { tweet_id: 'tw_002', text: 'Hot take: most "growth hacks" are just good marketing with a fancy name', created_tweet_at: '2026-02-17T09:15:00Z', impression_count: 28400, like_count: 567, retweet_count: 134, reply_count: 78, quote_count: 23, bookmark_count: 45 },
  { tweet_id: 'tw_003', text: 'The best advice I got as a founder: your first 100 users matter more than your next 10,000', created_tweet_at: '2026-02-16T11:00:00Z', impression_count: 67800, like_count: 1240, retweet_count: 345, reply_count: 89, quote_count: 56, bookmark_count: 189 },
  { tweet_id: 'tw_004', text: 'Building in public update: MRR just hit $12k 📈', created_tweet_at: '2026-02-15T16:45:00Z', impression_count: 34500, like_count: 890, retweet_count: 156, reply_count: 67, quote_count: 34, bookmark_count: 98 },
  { tweet_id: 'tw_005', text: 'What\'s one tool you can\'t live without as a creator? I\'ll go first: Notion', created_tweet_at: '2026-02-14T10:00:00Z', impression_count: 19800, like_count: 234, retweet_count: 45, reply_count: 156, quote_count: 8, bookmark_count: 23 },
];

async function fetchFromAPI(endpoint) {
  const url = `${config.twitter.baseUrl}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${config.twitter.bearerToken}` },
  });
  if (!res.ok) throw new Error(`X API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getAccountStats() {
  if (config.useMockData) return MOCK_ACCOUNT;

  const data = await fetchFromAPI(`/users/${config.twitter.userId}?user.fields=public_metrics`);
  const m = data.data?.public_metrics;
  if (!m) throw new Error('No user metrics returned');
  return {
    followers_count: m.followers_count,
    following_count: m.following_count,
    tweet_count: m.tweet_count,
    listed_count: m.listed_count,
  };
}

async function getRecentTweets() {
  if (config.useMockData) return MOCK_TWEETS;

  const data = await fetchFromAPI(
    `/users/${config.twitter.userId}/tweets?tweet.fields=created_at,public_metrics&max_results=100`
  );

  return (data.data || []).map(tweet => ({
    tweet_id: tweet.id,
    text: tweet.text?.substring(0, 280),
    created_tweet_at: tweet.created_at,
    impression_count: tweet.public_metrics?.impression_count || 0,
    like_count: tweet.public_metrics?.like_count || 0,
    retweet_count: tweet.public_metrics?.retweet_count || 0,
    reply_count: tweet.public_metrics?.reply_count || 0,
    quote_count: tweet.public_metrics?.quote_count || 0,
    bookmark_count: tweet.public_metrics?.bookmark_count || 0,
  }));
}

async function snapshot(db, date) {
  console.log('  Fetching X/Twitter account stats...');
  const account = await getAccountStats();

  db.prepare(`INSERT OR REPLACE INTO twitter_account
    (snapshot_date, followers_count, following_count, tweet_count, listed_count)
    VALUES (?, ?, ?, ?, ?)`).run(date, account.followers_count, account.following_count, account.tweet_count, account.listed_count);

  console.log('  Fetching X/Twitter tweets...');
  const tweets = await getRecentTweets();

  const insertTweet = db.prepare(`INSERT OR REPLACE INTO twitter_posts
    (snapshot_date, tweet_id, text, created_tweet_at, impression_count, like_count, retweet_count, reply_count, quote_count, bookmark_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const t of tweets) {
    insertTweet.run(date, t.tweet_id, t.text, t.created_tweet_at,
      t.impression_count, t.like_count, t.retweet_count, t.reply_count, t.quote_count, t.bookmark_count);
  }

  return { account, tweets: tweets.length };
}

module.exports = { snapshot, getAccountStats, getRecentTweets };
