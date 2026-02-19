/**
 * Fathom Poller - Polls Fathom API for new meeting transcripts.
 * Runs every 5 minutes during business hours.
 * Calendar-aware: waits buffer after meeting ends before checking.
 */
import { getDb, initDb } from './db.js';
import { v4 as uuid } from 'uuid';
import config from './config.json' with { type: 'json' };

// Stub Fathom API client
class FathomClient {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async getRecentMeetings(since) {
    // STUB: Replace with actual Fathom API call
    // GET {baseUrl}/meetings?since={since}
    // Headers: Authorization: Bearer {apiKey}
    console.log(`[fathom] Would fetch meetings since ${since} from ${this.baseUrl}`);
    return [];
  }

  async getTranscript(meetingId) {
    // STUB: GET {baseUrl}/meetings/{meetingId}/transcript
    console.log(`[fathom] Would fetch transcript for ${meetingId}`);
    return null;
  }
}

// Stub calendar checker
async function getRecentlyEndedMeetings() {
  // STUB: Check Google Calendar for meetings that ended > buffer ago
  const bufferMs = config.fathom.bufferAfterMeetingMs;
  const now = Date.now();
  console.log(`[calendar] Would check for meetings ended > ${bufferMs / 1000}s ago`);
  return [];
}

function isBusinessHours() {
  const { start, end, days, timezone } = config.businessHours;
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map(p => [p.type, p.value])
  );
  const hour = parseInt(parts.hour);
  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
  const dayNum = dayMap[parts.weekday] ?? 0;
  return days.includes(dayNum) && hour >= start && hour < end;
}

export async function pollFathom() {
  const db = initDb();
  const client = new FathomClient(config.fathom.apiKey, config.fathom.baseUrl);

  if (!isBusinessHours()) {
    console.log('[fathom-poller] Outside business hours, skipping.');
    db.prepare('INSERT INTO poll_log (status, meetings_found) VALUES (?, ?)').run('skipped_off_hours', 0);
    return { skipped: true, reason: 'off_hours' };
  }

  try {
    // Get last poll time
    const lastPoll = db.prepare('SELECT polled_at FROM poll_log WHERE status = ? ORDER BY polled_at DESC LIMIT 1')
      .get('ok');
    const since = lastPoll?.polled_at || new Date(Date.now() - 3600000).toISOString();

    const meetings = await client.getRecentMeetings(since);

    for (const meeting of meetings) {
      const existing = db.prepare('SELECT id FROM meetings WHERE fathom_id = ?').get(meeting.id);
      if (existing) continue;

      const transcript = await client.getTranscript(meeting.id);
      const meetingId = uuid();

      db.prepare(`INSERT INTO meetings (id, fathom_id, title, started_at, ended_at, transcript)
        VALUES (?, ?, ?, ?, ?, ?)`).run(
        meetingId, meeting.id, meeting.title,
        meeting.startedAt, meeting.endedAt, transcript
      );
    }

    db.prepare('INSERT INTO poll_log (status, meetings_found) VALUES (?, ?)').run('ok', meetings.length);
    return { success: true, meetingsFound: meetings.length };
  } catch (err) {
    db.prepare('INSERT INTO poll_log (status, error) VALUES (?, ?)').run('error', err.message);
    return { success: false, error: err.message };
  }
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  pollFathom().then(r => console.log('[fathom-poller] Result:', r));
}
