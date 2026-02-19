// Beehiiv API v2 Client
// Docs: https://developers.beehiiv.com/api-reference
const config = require('../config.json');
const { upsert, logSync } = require('../db');

const BASE = config.beehiiv.baseUrl;
const PUB = config.beehiiv.publicationId;
const HEADERS = {
  'Authorization': `Bearer ${config.beehiiv.apiKey}`,
  'Content-Type': 'application/json',
};

// Mock data for development/testing
const MOCK = {
  subscriptions: [
    { id: 'sub_001', email: 'alice@example.com', status: 'active', created_at: '2025-11-01T10:00:00Z', utm_source: 'twitter', utm_medium: 'social', tags: ['early-adopter'], custom_fields: {} },
    { id: 'sub_002', email: 'bob@example.com', status: 'active', created_at: '2025-12-15T08:00:00Z', utm_source: 'google', utm_medium: 'organic', tags: ['premium'], custom_fields: {} },
    { id: 'sub_003', email: 'charlie@example.com', status: 'active', created_at: '2026-01-05T12:00:00Z', utm_source: 'referral', utm_medium: 'email', tags: [], custom_fields: {} },
    { id: 'sub_004', email: 'diana@example.com', status: 'inactive', created_at: '2025-10-20T09:00:00Z', utm_source: 'twitter', utm_medium: 'social', tags: ['churned'], custom_fields: {} },
    { id: 'sub_005', email: 'eve@example.com', status: 'active', created_at: '2026-02-01T14:00:00Z', utm_source: 'linkedin', utm_medium: 'social', tags: ['early-adopter', 'premium'], custom_fields: {} },
  ],
  posts: [
    { id: 'post_001', title: 'Welcome to Our Newsletter', slug: 'welcome', status: 'confirmed', publish_date: '2025-11-15T10:00:00Z', audience: 'free', web_url: 'https://newsletter.example.com/p/welcome', stats: { recipients: 120, opens: 96, clicks: 34, open_rate: 0.80, click_rate: 0.28 } },
    { id: 'post_002', title: 'Q4 Market Review', slug: 'q4-review', status: 'confirmed', publish_date: '2026-01-10T10:00:00Z', audience: 'both', web_url: 'https://newsletter.example.com/p/q4-review', stats: { recipients: 250, opens: 175, clicks: 62, open_rate: 0.70, click_rate: 0.25 } },
    { id: 'post_003', title: 'Feb Strategy Update', slug: 'feb-strategy', status: 'confirmed', publish_date: '2026-02-10T10:00:00Z', audience: 'premium', web_url: 'https://newsletter.example.com/p/feb-strategy', stats: { recipients: 180, opens: 144, clicks: 72, open_rate: 0.80, click_rate: 0.40 } },
  ],
  segments: [
    { id: 'seg_001', name: 'Early Adopters', subscriber_count: 45 },
    { id: 'seg_002', name: 'Premium Tier', subscriber_count: 28 },
    { id: 'seg_003', name: 'Engaged (>50% open rate)', subscriber_count: 112 },
  ],
};

async function apiFetch(endpoint, params = {}) {
  if (config.mock) return null; // handled by mock paths
  const url = new URL(`${BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Beehiiv API ${res.status}: ${await res.text()}`);
  return res.json();
}

// Paginated fetch for subscriptions
// Real endpoint: GET /v2/publications/{pubId}/subscriptions?expand=stats,custom_fields,tags
async function fetchAllSubscriptions() {
  if (config.mock) return MOCK.subscriptions;

  let all = [], page = 1;
  while (true) {
    const data = await apiFetch(`/publications/${PUB}/subscriptions`, {
      expand: 'stats,custom_fields,tags',
      limit: 100,
      page,
    });
    all.push(...(data.data || []));
    if (!data.data?.length || data.data.length < 100) break;
    page++;
  }
  return all;
}

// Real endpoint: GET /v2/publications/{pubId}/posts
async function fetchAllPosts() {
  if (config.mock) return MOCK.posts;

  let all = [], page = 1;
  while (true) {
    const data = await apiFetch(`/publications/${PUB}/posts`, {
      expand: 'stats',
      status: 'confirmed',
      limit: 50,
      page,
    });
    all.push(...(data.data || []));
    if (!data.data?.length || data.data.length < 50) break;
    page++;
  }
  return all;
}

// Real endpoint: GET /v2/publications/{pubId}/segments
async function fetchSegments() {
  if (config.mock) return MOCK.segments;
  const data = await apiFetch(`/publications/${PUB}/segments`);
  return data.data || [];
}

async function syncSubscriptions() {
  const start = new Date().toISOString();
  try {
    const subs = await fetchAllSubscriptions();
    for (const s of subs) {
      upsert('subscribers', {
        id: s.id,
        email: s.email,
        status: s.status || 'active',
        created_at: s.created_at,
        utm_source: s.utm_source || null,
        utm_medium: s.utm_medium || null,
        utm_campaign: s.utm_campaign || null,
        referral_code: s.referral_code || null,
        tags: JSON.stringify(s.tags || []),
        custom_fields: JSON.stringify(s.custom_fields || {}),
        synced_at: new Date().toISOString(),
      });
    }
    logSync('beehiiv', 'subscribers', subs.length, 'success', null, start);
    return subs.length;
  } catch (e) {
    logSync('beehiiv', 'subscribers', 0, 'error', e.message, start);
    throw e;
  }
}

async function syncPosts() {
  const start = new Date().toISOString();
  try {
    const posts = await fetchAllPosts();
    for (const p of posts) {
      const stats = p.stats || {};
      upsert('posts', {
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        publish_date: p.publish_date,
        audience: p.audience || 'free',
        web_url: p.web_url,
        stats_opens: stats.opens || 0,
        stats_clicks: stats.clicks || 0,
        stats_recipients: stats.recipients || 0,
        stats_open_rate: stats.open_rate || 0,
        stats_click_rate: stats.click_rate || 0,
        synced_at: new Date().toISOString(),
      });
    }
    logSync('beehiiv', 'posts', posts.length, 'success', null, start);
    return posts.length;
  } catch (e) {
    logSync('beehiiv', 'posts', 0, 'error', e.message, start);
    throw e;
  }
}

async function syncSegments() {
  const start = new Date().toISOString();
  try {
    const segs = await fetchSegments();
    for (const s of segs) {
      upsert('subscriber_segments', {
        id: s.id,
        name: s.name,
        subscriber_count: s.subscriber_count || 0,
        synced_at: new Date().toISOString(),
      });
    }
    logSync('beehiiv', 'segments', segs.length, 'success', null, start);
    return segs.length;
  } catch (e) {
    logSync('beehiiv', 'segments', 0, 'error', e.message, start);
    throw e;
  }
}

async function syncAll() {
  const subs = await syncSubscriptions();
  const posts = await syncPosts();
  const segs = await syncSegments();
  return { subscribers: subs, posts: posts, segments: segs };
}

// Advisory council data feed
function getAdvisoryData() {
  const { query } = require('../db');
  const totalSubs = query(`SELECT COUNT(*) as count FROM subscribers WHERE status='active'`)[0]?.count || 0;
  const churnedSubs = query(`SELECT COUNT(*) as count FROM subscribers WHERE status='inactive'`)[0]?.count || 0;
  const totalAll = query(`SELECT COUNT(*) as count FROM subscribers`)[0]?.count || 0;
  const churnRate = totalAll > 0 ? (churnedSubs / totalAll * 100).toFixed(1) : '0.0';

  const recentPosts = query(`SELECT title, stats_open_rate, stats_click_rate, stats_recipients FROM posts ORDER BY publish_date DESC LIMIT 5`);
  const segments = query(`SELECT name, subscriber_count FROM subscriber_segments ORDER BY subscriber_count DESC`);

  // Growth: subscribers created in last 30 days
  const newSubs = query(`SELECT COUNT(*) as count FROM subscribers WHERE created_at >= datetime('now', '-30 days')`)[0]?.count || 0;

  return {
    platform: 'beehiiv',
    summary: {
      activeSubscribers: totalSubs,
      churnRate: parseFloat(churnRate),
      newLast30Days: newSubs,
      totalSubscribers: totalAll,
    },
    recentPosts,
    segments,
  };
}

module.exports = { syncAll, syncSubscriptions, syncPosts, syncSegments, getAdvisoryData };
