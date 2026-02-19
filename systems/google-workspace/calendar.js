/**
 * calendar.js — Google Calendar integration
 *
 * Commands:
 *   node calendar.js today               # Show today's events
 *   node calendar.js upcoming [days]      # Events in next N days (default 7)
 *   node calendar.js next                 # Next upcoming event
 *   node calendar.js check "time" "dur"   # Double-booking detection
 *   node calendar.js attendees <eventId>  # Attendee context for event
 *   node calendar.js ending [minutes]     # Events ending within N minutes
 */

import { google } from 'googleapis';
import { getAuthClient } from './auth.js';

async function getCal() {
  const auth = await getAuthClient();
  return google.calendar({ version: 'v3', auth });
}

function eventSummary(event) {
  const start = event.start?.dateTime || event.start?.date || '';
  const end = event.end?.dateTime || event.end?.date || '';
  const startTime = start.includes('T') ? new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All day';
  const endTime = end.includes('T') ? new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return {
    id: event.id,
    summary: event.summary || '(No title)',
    start, end, startTime, endTime,
    location: event.location || '',
    status: event.status,
    attendees: (event.attendees || []).map(a => ({
      email: a.email,
      name: a.displayName || '',
      response: a.responseStatus,
      self: a.self || false,
    })),
    meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || '',
    organizer: event.organizer?.email || '',
    description: event.description || '',
  };
}

async function listEvents(timeMin, timeMax, maxResults = 50) {
  const cal = await getCal();
  const res = await cal.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return (res.data.items || []).map(eventSummary);
}

function printEvents(events, title) {
  console.log(`\n📅 ${title}`);
  console.log('━'.repeat(40));
  if (!events.length) { console.log('  No events.'); return; }

  for (const e of events) {
    console.log(`  ${e.startTime}${e.endTime ? '–' + e.endTime : ''} │ ${e.summary}`);
    if (e.location) console.log(`    📍 ${e.location}`);
    if (e.meetLink) console.log(`    🔗 ${e.meetLink}`);
    if (e.attendees.length) console.log(`    👥 ${e.attendees.length} attendees`);
  }
}

async function today() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const events = await listEvents(start, end);
  printEvents(events, `Today (${start.toLocaleDateString()})`);
  return events;
}

async function upcoming(days = 7) {
  const now = new Date();
  const end = new Date(now); end.setDate(end.getDate() + days);
  const events = await listEvents(now, end);
  printEvents(events, `Next ${days} days`);
  return events;
}

async function next() {
  const now = new Date();
  const end = new Date(now); end.setDate(end.getDate() + 30);
  const events = await listEvents(now, end, 1);
  if (events.length) {
    const e = events[0];
    console.log(`\n⏭️  Next: ${e.summary}`);
    console.log(`   ${e.startTime}–${e.endTime}`);
    if (e.location) console.log(`   📍 ${e.location}`);
    if (e.meetLink) console.log(`   🔗 ${e.meetLink}`);
  } else {
    console.log('No upcoming events.');
  }
  return events[0] || null;
}

async function checkDoubleBooking(startStr, durationMin = 60) {
  const start = new Date(startStr);
  const end = new Date(start.getTime() + durationMin * 60000);
  const events = await listEvents(start, end);

  if (events.length) {
    console.log(`\n⚠️  Conflict detected! ${events.length} event(s) overlap:`);
    for (const e of events) {
      console.log(`   ${e.startTime}–${e.endTime} │ ${e.summary}`);
    }
  } else {
    console.log(`\n✅ No conflicts for ${start.toLocaleString()} (${durationMin}min)`);
  }
  return events;
}

async function attendees(eventId) {
  const cal = await getCal();
  const res = await cal.events.get({ calendarId: 'primary', eventId });
  const event = eventSummary(res.data);

  console.log(`\n👥 Attendees for: ${event.summary}`);
  console.log('━'.repeat(40));
  for (const a of event.attendees) {
    const status = { accepted: '✅', declined: '❌', tentative: '❓', needsAction: '⏳' }[a.response] || '?';
    console.log(`  ${status} ${a.name || a.email} ${a.name ? `<${a.email}>` : ''}`);
  }
  return event;
}

async function ending(withinMinutes = 5) {
  const now = new Date();
  const soon = new Date(now.getTime() + withinMinutes * 60000);
  // Look at events from the past few hours that end soon
  const lookback = new Date(now.getTime() - 12 * 3600000);
  const events = await listEvents(lookback, soon);
  const endingSoon = events.filter(e => {
    if (!e.end || !e.end.includes('T')) return false;
    const endTime = new Date(e.end);
    return endTime >= now && endTime <= soon;
  });

  if (endingSoon.length) {
    console.log(`\n🔔 ${endingSoon.length} event(s) ending within ${withinMinutes} minutes:`);
    for (const e of endingSoon) {
      console.log(`   ${e.endTime} │ ${e.summary}`);
    }
  } else {
    console.log(`No events ending within ${withinMinutes} minutes.`);
  }
  return endingSoon;
}

// CLI
const cmd = process.argv[2];
switch (cmd) {
  case 'today': await today(); break;
  case 'upcoming': await upcoming(parseInt(process.argv[3]) || 7); break;
  case 'next': await next(); break;
  case 'check': await checkDoubleBooking(process.argv[3], parseInt(process.argv[4]) || 60); break;
  case 'attendees': await attendees(process.argv[3]); break;
  case 'ending': await ending(parseInt(process.argv[3]) || 5); break;
  default:
    console.log('Usage: node calendar.js <today|upcoming|next|check|attendees|ending>');
}
