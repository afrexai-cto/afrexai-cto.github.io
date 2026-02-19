-- Social Media Tracker Schema

-- YouTube Videos
CREATE TABLE IF NOT EXISTS youtube_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT,
  published_at TEXT,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  duration TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(snapshot_date, video_id)
);

-- YouTube Channel Stats (for subscriber tracking)
CREATE TABLE IF NOT EXISTS youtube_channel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL UNIQUE,
  subscriber_count INTEGER DEFAULT 0,
  total_view_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- YouTube Subscriber Conversion Analysis
-- Tracks delta between snapshots to correlate video performance with sub growth
CREATE TABLE IF NOT EXISTS youtube_sub_conversion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL,
  video_id TEXT NOT NULL,
  views_delta INTEGER DEFAULT 0,
  subs_delta INTEGER DEFAULT 0,
  conversion_score REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(snapshot_date, video_id)
);

-- Instagram Posts
CREATE TABLE IF NOT EXISTS instagram_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL,
  media_id TEXT NOT NULL,
  media_type TEXT,
  caption TEXT,
  permalink TEXT,
  like_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  saved INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(snapshot_date, media_id)
);

-- Instagram Account
CREATE TABLE IF NOT EXISTS instagram_account (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL UNIQUE,
  followers_count INTEGER DEFAULT 0,
  follows_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- X/Twitter Posts
CREATE TABLE IF NOT EXISTS twitter_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL,
  tweet_id TEXT NOT NULL,
  text TEXT,
  created_tweet_at TEXT,
  impression_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  retweet_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  quote_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(snapshot_date, tweet_id)
);

-- X/Twitter Account
CREATE TABLE IF NOT EXISTS twitter_account (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL UNIQUE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  tweet_count INTEGER DEFAULT 0,
  listed_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- TikTok Account
CREATE TABLE IF NOT EXISTS tiktok_account (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL UNIQUE,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_yt_videos_date ON youtube_videos(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_ig_posts_date ON instagram_posts(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_tw_posts_date ON twitter_posts(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_yt_sub_conv_date ON youtube_sub_conversion(snapshot_date);
