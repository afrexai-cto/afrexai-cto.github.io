// YouTube transcript extraction
import fetch from 'node-fetch';

const YT_ID_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;

export function extractVideoId(url) {
  const m = url.match(YT_ID_REGEX);
  return m ? m[1] : null;
}

export function isYouTubeUrl(url) {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

export async function fetchYouTubeData(url) {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error(`Invalid YouTube URL: ${url}`);

  // Fetch page to get title and attempt transcript
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' }
  });
  const html = await pageRes.text();

  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : `Video ${videoId}`;

  // Extract author
  const authorMatch = html.match(/"ownerChannelName":"([^"]+)"/);
  const author = authorMatch ? authorMatch[1] : null;

  // Try to get captions/transcript from the page data
  let transcript = '';
  try {
    // Extract captions URL from ytInitialPlayerResponse
    const captionsMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (captionsMatch) {
      const tracks = JSON.parse(captionsMatch[1]);
      const enTrack = tracks.find(t => t.languageCode === 'en') || tracks[0];
      if (enTrack?.baseUrl) {
        const captionRes = await fetch(enTrack.baseUrl);
        const captionXml = await captionRes.text();
        // Parse XML captions
        transcript = captionXml
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
  } catch (e) {
    console.warn(`Could not extract transcript for ${videoId}: ${e.message}`);
  }

  // Extract description
  const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  const description = descMatch
    ? descMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
    : '';

  return {
    type: 'youtube',
    title,
    author,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    content: transcript || description || `YouTube video: ${title}`,
    metadata: { videoId, hasTranscript: !!transcript, description: description.slice(0, 500) }
  };
}
