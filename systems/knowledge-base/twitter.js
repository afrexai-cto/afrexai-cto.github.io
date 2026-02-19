// Twitter/X thread extraction
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const TWITTER_REGEX = /(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/;

export function isTwitterUrl(url) {
  return TWITTER_REGEX.test(url);
}

export function extractTweetInfo(url) {
  const m = url.match(TWITTER_REGEX);
  return m ? { username: m[1], tweetId: m[2] } : null;
}

export async function fetchTweetData(url) {
  const info = extractTweetInfo(url);
  if (!info) throw new Error(`Invalid Twitter URL: ${url}`);

  // Use nitter or similar public instance for scraping, fallback to basic fetch
  // Note: Twitter's anti-scraping is aggressive; for production use the API
  let content = '';
  let title = '';
  let linkedUrls = [];

  try {
    // Try fetching via publish.twitter.com oEmbed (public, no auth)
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
    const res = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' }
    });
    if (res.ok) {
      const data = await res.json();
      const $ = cheerio.load(data.html);
      content = $.text().trim();
      title = `Tweet by ${data.author_name} (@${info.username})`;

      // Extract linked URLs from tweet content
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.includes('twitter.com') && !href.includes('x.com') && !href.includes('t.co')) {
          linkedUrls.push(href);
        }
      });
    }
  } catch (e) {
    console.warn(`oEmbed fetch failed: ${e.message}`);
  }

  if (!content) {
    content = `Tweet by @${info.username} (ID: ${info.tweetId}). Content could not be extracted - Twitter requires authentication for full access. Consider using browser automation.`;
    title = `Tweet by @${info.username}`;
  }

  return {
    type: 'twitter',
    title,
    author: `@${info.username}`,
    url,
    content,
    metadata: { tweetId: info.tweetId, username: info.username, linkedUrls },
    linkedUrls  // Exposed for cross-ingestion
  };
}
