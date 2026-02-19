/**
 * YouTube Data API v3 Client
 * Endpoints:
 *   GET /youtube/v3/channels?part=statistics&id={channelId}&key={apiKey}
 *   GET /youtube/v3/search?part=snippet&channelId={id}&order=date&type=video&maxResults=50&key={apiKey}
 *   GET /youtube/v3/videos?part=snippet,statistics,contentDetails&id={ids}&key={apiKey}
 */

const config = require('../config.json');

const MOCK_CHANNEL = {
  subscriber_count: 14520,
  total_view_count: 2345000,
  video_count: 87,
};

const MOCK_VIDEOS = [
  { video_id: 'abc123', title: 'How I Built My First SaaS', published_at: '2026-02-10T10:00:00Z', view_count: 12400, like_count: 890, comment_count: 134, favorite_count: 0, duration: 'PT14M32S' },
  { video_id: 'def456', title: 'The Truth About Creator Economy', published_at: '2026-02-14T15:00:00Z', view_count: 8200, like_count: 620, comment_count: 89, favorite_count: 0, duration: 'PT11M05S' },
  { video_id: 'ghi789', title: 'Day in My Life as a Founder', published_at: '2026-02-17T12:00:00Z', view_count: 5100, like_count: 410, comment_count: 52, favorite_count: 0, duration: 'PT8M22S' },
  { video_id: 'jkl012', title: 'Why Most Startups Fail', published_at: '2026-02-05T09:00:00Z', view_count: 31000, like_count: 2100, comment_count: 312, favorite_count: 0, duration: 'PT19M44S' },
  { video_id: 'mno345', title: 'My Setup Tour 2026', published_at: '2026-01-28T14:00:00Z', view_count: 18700, like_count: 1400, comment_count: 198, favorite_count: 0, duration: 'PT12M10S' },
];

async function fetchFromAPI(endpoint) {
  const url = `${config.youtube.baseUrl}${endpoint}&key=${config.youtube.apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getChannelStats() {
  if (config.useMockData) return MOCK_CHANNEL;
  
  const data = await fetchFromAPI(`/channels?part=statistics&id=${config.youtube.channelId}`);
  const stats = data.items?.[0]?.statistics;
  if (!stats) throw new Error('No channel data returned');
  return {
    subscriber_count: parseInt(stats.subscriberCount) || 0,
    total_view_count: parseInt(stats.viewCount) || 0,
    video_count: parseInt(stats.videoCount) || 0,
  };
}

async function getRecentVideos() {
  if (config.useMockData) return MOCK_VIDEOS;

  // Step 1: Get recent video IDs from search
  const searchData = await fetchFromAPI(
    `/search?part=snippet&channelId=${config.youtube.channelId}&order=date&type=video&maxResults=50`
  );
  const videoIds = searchData.items.map(i => i.id.videoId).join(',');
  if (!videoIds) return [];

  // Step 2: Get full stats for each video
  const videosData = await fetchFromAPI(
    `/videos?part=snippet,statistics,contentDetails&id=${videoIds}`
  );

  return videosData.items.map(item => ({
    video_id: item.id,
    title: item.snippet.title,
    published_at: item.snippet.publishedAt,
    view_count: parseInt(item.statistics.viewCount) || 0,
    like_count: parseInt(item.statistics.likeCount) || 0,
    comment_count: parseInt(item.statistics.commentCount) || 0,
    favorite_count: parseInt(item.statistics.favoriteCount) || 0,
    duration: item.contentDetails.duration,
  }));
}

/**
 * Subscriber conversion analysis:
 * Compare today's video views with yesterday's, and correlate with subscriber delta.
 * Videos with high view growth but corresponding sub growth get high conversion scores.
 */
function analyzeSubConversion(db, today, videos) {
  const yesterday = new Date(new Date(today).getTime() - 86400000).toISOString().split('T')[0];
  
  const channelToday = db.prepare('SELECT subscriber_count FROM youtube_channel WHERE snapshot_date = ?').get(today);
  const channelYesterday = db.prepare('SELECT subscriber_count FROM youtube_channel WHERE snapshot_date = ?').get(yesterday);
  
  if (!channelToday || !channelYesterday) return [];

  const subsDelta = channelToday.subscriber_count - channelYesterday.subscriber_count;
  const totalViewsDelta = videos.reduce((sum, v) => {
    const prev = db.prepare('SELECT view_count FROM youtube_videos WHERE snapshot_date = ? AND video_id = ?').get(yesterday, v.video_id);
    return sum + (v.view_count - (prev?.view_count || 0));
  }, 0);

  return videos.map(v => {
    const prev = db.prepare('SELECT view_count FROM youtube_videos WHERE snapshot_date = ? AND video_id = ?').get(yesterday, v.video_id);
    const viewsDelta = v.view_count - (prev?.view_count || 0);
    const viewShare = totalViewsDelta > 0 ? viewsDelta / totalViewsDelta : 0;
    // Attribute subs proportionally to view share, weighted by engagement rate
    const engagementRate = v.view_count > 0 ? (v.like_count + v.comment_count) / v.view_count : 0;
    const conversionScore = viewShare * engagementRate * 1000; // normalized score
    
    return {
      video_id: v.video_id,
      views_delta: viewsDelta,
      subs_delta: Math.round(subsDelta * viewShare),
      conversion_score: Math.round(conversionScore * 100) / 100,
    };
  });
}

async function snapshot(db, date) {
  console.log('  Fetching YouTube channel stats...');
  const channel = await getChannelStats();
  
  db.prepare(`INSERT OR REPLACE INTO youtube_channel (snapshot_date, subscriber_count, total_view_count, video_count)
    VALUES (?, ?, ?, ?)`).run(date, channel.subscriber_count, channel.total_view_count, channel.video_count);

  console.log('  Fetching YouTube videos...');
  const videos = await getRecentVideos();
  
  const insertVideo = db.prepare(`INSERT OR REPLACE INTO youtube_videos 
    (snapshot_date, video_id, title, published_at, view_count, like_count, comment_count, favorite_count, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const v of videos) {
    insertVideo.run(date, v.video_id, v.title, v.published_at, v.view_count, v.like_count, v.comment_count, v.favorite_count, v.duration);
  }

  // Run subscriber conversion analysis
  console.log('  Analyzing subscriber conversion...');
  const conversions = analyzeSubConversion(db, date, videos);
  const insertConv = db.prepare(`INSERT OR REPLACE INTO youtube_sub_conversion
    (snapshot_date, video_id, views_delta, subs_delta, conversion_score)
    VALUES (?, ?, ?, ?, ?)`);
  
  for (const c of conversions) {
    insertConv.run(date, c.video_id, c.views_delta, c.subs_delta, c.conversion_score);
  }

  return { channel, videos: videos.length, conversions: conversions.length };
}

module.exports = { snapshot, getChannelStats, getRecentVideos, analyzeSubConversion };
