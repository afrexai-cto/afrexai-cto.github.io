#!/usr/bin/env node
/**
 * Social Media Report Generator
 * Usage: node report.js [yesterday|today|YYYY-MM-DD]
 * Outputs a structured summary suitable for daily briefing and advisory council.
 */

const { DB } = require('./db');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

function getDB() {
  const dbPath = path.resolve(__dirname, config.database.path);
  if (!fs.existsSync(dbPath)) {
    console.error('Database not found. Run snapshot.js first.');
    process.exit(1);
  }
  return new DB(dbPath);
}

function resolveDate(input) {
  if (!input || input === 'yesterday') {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
  if (input === 'today') return new Date().toISOString().split('T')[0];
  return input; // assume YYYY-MM-DD
}

function getPreviousDate(date) {
  const d = new Date(date); d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function delta(current, previous) {
  if (previous == null) return { value: current, change: null };
  const diff = current - previous;
  const pct = previous > 0 ? ((diff / previous) * 100).toFixed(1) : '∞';
  return { value: current, change: diff, pct: `${diff >= 0 ? '+' : ''}${pct}%` };
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function generateReport(db, date) {
  const prev = getPreviousDate(date);
  const report = { date, platforms: {} };

  // YouTube
  const ytChannel = db.prepare('SELECT * FROM youtube_channel WHERE snapshot_date = ?').get(date);
  const ytChannelPrev = db.prepare('SELECT * FROM youtube_channel WHERE snapshot_date = ?').get(prev);
  const ytVideos = db.prepare('SELECT * FROM youtube_videos WHERE snapshot_date = ? ORDER BY view_count DESC').all(date);
  const ytConversions = db.prepare('SELECT * FROM youtube_sub_conversion WHERE snapshot_date = ? ORDER BY conversion_score DESC').all(date);

  if (ytChannel) {
    report.platforms.youtube = {
      subscribers: delta(ytChannel.subscriber_count, ytChannelPrev?.subscriber_count),
      totalViews: delta(ytChannel.total_view_count, ytChannelPrev?.total_view_count),
      topVideos: ytVideos.slice(0, 5).map(v => ({
        title: v.title,
        views: formatNumber(v.view_count),
        likes: formatNumber(v.like_count),
        comments: v.comment_count,
        engagementRate: v.view_count > 0 ? ((v.like_count + v.comment_count) / v.view_count * 100).toFixed(2) + '%' : '0%',
      })),
      subConversion: ytConversions.slice(0, 3).map(c => ({
        videoId: c.video_id,
        viewsDelta: c.views_delta,
        subsDelta: c.subs_delta,
        conversionScore: c.conversion_score,
      })),
    };
  }

  // Instagram
  const igAccount = db.prepare('SELECT * FROM instagram_account WHERE snapshot_date = ?').get(date);
  const igAccountPrev = db.prepare('SELECT * FROM instagram_account WHERE snapshot_date = ?').get(prev);
  const igPosts = db.prepare('SELECT * FROM instagram_posts WHERE snapshot_date = ? ORDER BY engagement DESC').all(date);

  if (igAccount) {
    report.platforms.instagram = {
      followers: delta(igAccount.followers_count, igAccountPrev?.followers_count),
      impressions: formatNumber(igAccount.impressions),
      reach: formatNumber(igAccount.reach),
      profileViews: igAccount.profile_views,
      topPosts: igPosts.slice(0, 3).map(p => ({
        type: p.media_type,
        caption: p.caption?.substring(0, 60) + (p.caption?.length > 60 ? '...' : ''),
        likes: p.like_count,
        comments: p.comments_count,
        saves: p.saved,
        reach: formatNumber(p.reach),
      })),
    };
  }

  // Twitter
  const twAccount = db.prepare('SELECT * FROM twitter_account WHERE snapshot_date = ?').get(date);
  const twAccountPrev = db.prepare('SELECT * FROM twitter_account WHERE snapshot_date = ?').get(prev);
  const twPosts = db.prepare('SELECT * FROM twitter_posts WHERE snapshot_date = ? ORDER BY impression_count DESC').all(date);

  if (twAccount) {
    const totalImpressions = twPosts.reduce((s, t) => s + t.impression_count, 0);
    const totalEngagement = twPosts.reduce((s, t) => s + t.like_count + t.retweet_count + t.reply_count + t.bookmark_count, 0);

    report.platforms.twitter = {
      followers: delta(twAccount.followers_count, twAccountPrev?.followers_count),
      totalImpressions: formatNumber(totalImpressions),
      totalEngagement: formatNumber(totalEngagement),
      engagementRate: totalImpressions > 0 ? (totalEngagement / totalImpressions * 100).toFixed(2) + '%' : '0%',
      topTweets: twPosts.slice(0, 3).map(t => ({
        text: t.text?.substring(0, 80) + (t.text?.length > 80 ? '...' : ''),
        impressions: formatNumber(t.impression_count),
        likes: t.like_count,
        retweets: t.retweet_count,
        bookmarks: t.bookmark_count,
      })),
    };
  }

  // TikTok
  const ttAccount = db.prepare('SELECT * FROM tiktok_account WHERE snapshot_date = ?').get(date);
  const ttAccountPrev = db.prepare('SELECT * FROM tiktok_account WHERE snapshot_date = ?').get(prev);

  if (ttAccount) {
    report.platforms.tiktok = {
      followers: delta(ttAccount.follower_count, ttAccountPrev?.follower_count),
      likes: delta(ttAccount.likes_count, ttAccountPrev?.likes_count),
      videos: ttAccount.video_count,
    };
  }

  return report;
}

function printReport(report) {
  console.log(`\n📊 Social Media Report — ${report.date}`);
  console.log('='.repeat(50));

  const p = report.platforms;

  if (p.youtube) {
    console.log('\n🎬 YouTube');
    console.log(`  Subscribers: ${formatNumber(p.youtube.subscribers.value)} ${p.youtube.subscribers.pct || ''}`);
    console.log(`  Total Views: ${formatNumber(p.youtube.totalViews.value)} ${p.youtube.totalViews.pct || ''}`);
    if (p.youtube.topVideos.length) {
      console.log('  Top Videos:');
      for (const v of p.youtube.topVideos) {
        console.log(`    • ${v.title} — ${v.views} views, ${v.engagementRate} engagement`);
      }
    }
    if (p.youtube.subConversion.length) {
      console.log('  Sub Conversion Leaders:');
      for (const c of p.youtube.subConversion) {
        console.log(`    • ${c.videoId}: +${c.viewsDelta} views → ~${c.subsDelta} subs (score: ${c.conversionScore})`);
      }
    }
  }

  if (p.instagram) {
    console.log('\n📸 Instagram');
    console.log(`  Followers: ${formatNumber(p.instagram.followers.value)} ${p.instagram.followers.pct || ''}`);
    console.log(`  Impressions: ${p.instagram.impressions} | Reach: ${p.instagram.reach} | Profile Views: ${p.instagram.profileViews}`);
    if (p.instagram.topPosts.length) {
      console.log('  Top Posts:');
      for (const post of p.instagram.topPosts) {
        console.log(`    • [${post.type}] ${post.caption} — ${post.likes} ❤️  ${post.saves} 💾  ${post.reach} reach`);
      }
    }
  }

  if (p.twitter) {
    console.log('\n🐦 X/Twitter');
    console.log(`  Followers: ${formatNumber(p.twitter.followers.value)} ${p.twitter.followers.pct || ''}`);
    console.log(`  Impressions: ${p.twitter.totalImpressions} | Engagement: ${p.twitter.totalEngagement} (${p.twitter.engagementRate})`);
    if (p.twitter.topTweets.length) {
      console.log('  Top Tweets:');
      for (const t of p.twitter.topTweets) {
        console.log(`    • "${t.text}" — ${t.impressions} imp, ${t.likes} ❤️, ${t.bookmarks} 🔖`);
      }
    }
  }

  if (p.tiktok) {
    console.log('\n🎵 TikTok');
    console.log(`  Followers: ${formatNumber(p.tiktok.followers.value)} ${p.tiktok.followers.pct || ''}`);
    console.log(`  Likes: ${formatNumber(p.tiktok.likes.value)} ${p.tiktok.likes.pct || ''}`);
    console.log(`  Videos: ${p.tiktok.videos}`);
  }

  console.log('\n' + '='.repeat(50));
}

// Export for advisory council integration
function getReportJSON(dateInput) {
  const db = getDB();
  const date = resolveDate(dateInput);
  const report = generateReport(db, date);
  db.close();
  return report;
}

// CLI
const dateArg = process.argv[2] || 'yesterday';
const db = getDB();
const date = resolveDate(dateArg);
const report = generateReport(db, date);
db.close();

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printReport(report);
}

module.exports = { getReportJSON, generateReport };
