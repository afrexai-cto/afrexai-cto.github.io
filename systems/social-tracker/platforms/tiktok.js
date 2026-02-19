/**
 * TikTok Research API Client
 * Endpoints:
 *   POST /v2/research/user/info/?fields=display_name,follower_count,following_count,likes_count,video_count
 *     Header: Authorization: bearer {access_token}
 *     Body: { "username": "example_username" }
 */

const config = require('../config.json');

const MOCK_ACCOUNT = {
  follower_count: 5670,
  following_count: 234,
  likes_count: 89400,
  video_count: 43,
};

async function getAccountStats() {
  if (config.useMockData) return MOCK_ACCOUNT;

  const url = `${config.tiktok.baseUrl}/research/user/info/?fields=display_name,follower_count,following_count,likes_count,video_count`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${config.tiktok.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: config.tiktok.username }),
  });

  if (!res.ok) throw new Error(`TikTok API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  
  if (data.error?.code !== 'ok' && data.error?.code) {
    throw new Error(`TikTok API error: ${data.error.message}`);
  }

  return {
    follower_count: data.data?.follower_count || 0,
    following_count: data.data?.following_count || 0,
    likes_count: data.data?.likes_count || 0,
    video_count: data.data?.video_count || 0,
  };
}

async function snapshot(db, date) {
  console.log('  Fetching TikTok account stats...');
  const account = await getAccountStats();

  db.prepare(`INSERT OR REPLACE INTO tiktok_account
    (snapshot_date, follower_count, following_count, likes_count, video_count)
    VALUES (?, ?, ?, ?, ?)`).run(date, account.follower_count, account.following_count, account.likes_count, account.video_count);

  return { account };
}

module.exports = { snapshot, getAccountStats };
