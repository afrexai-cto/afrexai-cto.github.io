/**
 * Instagram Graph API Client
 * Endpoints:
 *   GET /{account-id}?fields=followers_count,follows_count,media_count&access_token={token}
 *   GET /{account-id}/insights?metric=impressions,reach,profile_views&period=day&access_token={token}
 *   GET /{account-id}/media?fields=id,caption,media_type,permalink,like_count,comments_count,timestamp&access_token={token}
 *   GET /{media-id}/insights?metric=impressions,reach,engagement,saved&access_token={token}
 */

const config = require('../config.json');

const MOCK_ACCOUNT = {
  followers_count: 8430,
  follows_count: 412,
  media_count: 156,
  impressions: 12400,
  reach: 8900,
  profile_views: 320,
};

const MOCK_POSTS = [
  { media_id: 'ig_001', media_type: 'IMAGE', caption: 'Behind the scenes of our latest project 🚀', permalink: 'https://instagram.com/p/abc', like_count: 342, comments_count: 28, impressions: 4200, reach: 3100, saved: 45, engagement: 415 },
  { media_id: 'ig_002', media_type: 'CAROUSEL_ALBUM', caption: 'Top 5 lessons from building a startup', permalink: 'https://instagram.com/p/def', like_count: 567, comments_count: 42, impressions: 6800, reach: 5200, saved: 89, engagement: 698 },
  { media_id: 'ig_003', media_type: 'REELS', caption: 'Day in my life as a founder', permalink: 'https://instagram.com/p/ghi', like_count: 890, comments_count: 67, impressions: 15200, reach: 11400, saved: 120, engagement: 1077 },
  { media_id: 'ig_004', media_type: 'IMAGE', caption: 'New office vibes ✨', permalink: 'https://instagram.com/p/jkl', like_count: 234, comments_count: 19, impressions: 3100, reach: 2400, saved: 22, engagement: 275 },
];

async function fetchFromAPI(endpoint) {
  const url = `${config.instagram.baseUrl}${endpoint}`;
  const separator = endpoint.includes('?') ? '&' : '?';
  const fullUrl = `${url}${separator}access_token=${config.instagram.accessToken}`;
  const res = await fetch(fullUrl);
  if (!res.ok) throw new Error(`Instagram API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getAccountStats() {
  if (config.useMockData) return MOCK_ACCOUNT;

  const [profile, insights] = await Promise.all([
    fetchFromAPI(`/${config.instagram.accountId}?fields=followers_count,follows_count,media_count`),
    fetchFromAPI(`/${config.instagram.accountId}/insights?metric=impressions,reach,profile_views&period=day`),
  ]);

  const metricsMap = {};
  for (const m of insights.data) metricsMap[m.name] = m.values?.[0]?.value || 0;

  return {
    followers_count: profile.followers_count,
    follows_count: profile.follows_count,
    media_count: profile.media_count,
    impressions: metricsMap.impressions || 0,
    reach: metricsMap.reach || 0,
    profile_views: metricsMap.profile_views || 0,
  };
}

async function getRecentPosts() {
  if (config.useMockData) return MOCK_POSTS;

  const mediaList = await fetchFromAPI(
    `/${config.instagram.accountId}/media?fields=id,caption,media_type,permalink,like_count,comments_count,timestamp&limit=25`
  );

  const posts = [];
  for (const media of mediaList.data) {
    let insights = { impressions: 0, reach: 0, saved: 0, engagement: 0 };
    try {
      const insightsData = await fetchFromAPI(
        `/${media.id}/insights?metric=impressions,reach,saved,engagement`
      );
      for (const m of insightsData.data) insights[m.name] = m.values?.[0]?.value || 0;
    } catch (e) {
      // Some media types don't support all insights
    }
    posts.push({
      media_id: media.id,
      media_type: media.media_type,
      caption: (media.caption || '').substring(0, 200),
      permalink: media.permalink,
      like_count: media.like_count || 0,
      comments_count: media.comments_count || 0,
      ...insights,
    });
  }
  return posts;
}

async function snapshot(db, date) {
  console.log('  Fetching Instagram account stats...');
  const account = await getAccountStats();

  db.prepare(`INSERT OR REPLACE INTO instagram_account 
    (snapshot_date, followers_count, follows_count, media_count, impressions, reach, profile_views)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    date, account.followers_count, account.follows_count, account.media_count,
    account.impressions, account.reach, account.profile_views
  );

  console.log('  Fetching Instagram posts...');
  const posts = await getRecentPosts();

  const insertPost = db.prepare(`INSERT OR REPLACE INTO instagram_posts
    (snapshot_date, media_id, media_type, caption, permalink, like_count, comments_count, impressions, reach, saved, engagement)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const p of posts) {
    insertPost.run(date, p.media_id, p.media_type, p.caption, p.permalink,
      p.like_count, p.comments_count, p.impressions, p.reach, p.saved, p.engagement);
  }

  return { account, posts: posts.length };
}

module.exports = { snapshot, getAccountStats, getRecentPosts };
