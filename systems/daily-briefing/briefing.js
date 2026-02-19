import { readFile, writeFile } from 'fs/promises';
import { getEvents } from './sources/calendar.js';
import { enrichAttendees } from './sources/crm.js';
import { getTasks } from './sources/tasks.js';
import { getPerformance } from './sources/social.js';
import { getRelatedThreads, getUnreadThreads } from './sources/email.js';

const config = JSON.parse(await readFile(new URL('./config.json', import.meta.url), 'utf8'));
const dateArg = process.argv.find(a => a.startsWith('--date='))?.split('=')[1];
const targetDate = dateArg ? new Date(dateArg + 'T00:00:00Z') : new Date();
const dateStr = targetDate.toISOString().slice(0, 10);
const dayName = targetDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

const lines = [];
const h = (n, t) => lines.push(`${'#'.repeat(n)} ${t}`, '');
const p = t => lines.push(t, '');
const bullet = (items, fn) => { items.forEach(i => lines.push(`- ${fn(i)}`)); lines.push(''); };

h(1, `☀️ Daily Briefing — ${dayName}`);

// === CALENDAR ===
if (config.sources.calendar.enabled) {
  h(2, '📅 Today\'s Schedule');
  const events = await getEvents(config.sources.calendar, targetDate);
  if (!events.length) { p('_No events today._'); }
  for (const evt of events) {
    const time = new Date(evt.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const endTime = new Date(evt.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    h(3, `${time}–${endTime} · ${evt.title}`);
    p(`📍 ${evt.location}${evt.description ? ` · _${evt.description}_` : ''}`);

    // CRM enrichment
    if (config.sources.crm.enabled) {
      const people = await enrichAttendees(config.sources.crm, evt.attendees);
      if (people.length) {
        p('**Attendees:**');
        for (const c of people) {
          if (c.unknown) { lines.push(`- **${c.email}** — _No CRM record_`); continue; }
          lines.push(`- **${c.name}** · ${c.title} @ ${c.company}`);
          if (c.dealStage) lines.push(`  - Deal: ${c.dealStage} · ${c.dealValue}`);
          if (c.lastInteractionNote) lines.push(`  - Last (${c.lastInteraction}): ${c.lastInteractionNote}`);
          if (c.notes) lines.push(`  - 💡 ${c.notes}`);
        }
        lines.push('');
      }
    }

    // Related emails
    if (config.sources.email.enabled) {
      const threads = await getRelatedThreads(config.sources.email, evt.id);
      if (threads.length) {
        p('**Related Email Threads:**');
        for (const t of threads) {
          lines.push(`- ${t.unread ? '🔴' : '⚪'} **${t.subject}** — "${t.snippet}"`);
        }
        lines.push('');
      }
    }
  }
}

// === TASKS ===
if (config.sources.tasks.enabled) {
  h(2, '✅ Action Items');
  const { pending, overdue, waiting, upcoming } = await getTasks(config.sources.tasks, targetDate);

  if (overdue.length) {
    p('**🔴 Overdue:**');
    bullet(overdue, t => `~~${t.due}~~ **${t.title}** [${t.priority}]`);
  }
  if (pending.length) {
    p('**📌 Due Today:**');
    bullet(pending, t => `**${t.title}** [${t.priority}]`);
  }
  if (waiting.length) {
    p('**⏳ Waiting On:**');
    bullet(waiting, t => `**${t.title}** — waiting on _${t.waitingOn}_ (due ${t.due}) [${t.priority}]`);
  }
  if (upcoming.length) {
    p('**📆 Coming Up (next 3 days):**');
    bullet(upcoming, t => `${t.due}: **${t.title}** [${t.priority}]`);
  }
}

// === SOCIAL ===
if (config.sources.social.enabled) {
  const social = await getPerformance(config.sources.social, targetDate);
  if (social) {
    h(2, `📊 Yesterday's Content Performance (${social.date})`);
    for (const [platform, data] of Object.entries(social.platforms)) {
      h(3, `${platform.charAt(0).toUpperCase() + platform.slice(1)} (${data.followersDelta} followers)`);
      for (const post of data.posts) {
        const metrics = Object.entries(post).filter(([k]) => !['id','text','postedAt'].includes(k)).map(([k,v]) => `${k}: ${v.toLocaleString()}`).join(' · ');
        lines.push(`- "${post.text.slice(0, 60)}..." → ${metrics}`);
      }
      lines.push('');
    }
    if (social.topPerformer) {
      p(`🏆 **Top performer:** ${social.topPerformer.platform} post (${social.topPerformer.metric}: ${social.topPerformer.value.toLocaleString()})`);
    }
  }
}

// === UNREAD EMAILS ===
if (config.sources.email.enabled) {
  const unread = await getUnreadThreads(config.sources.email);
  if (unread.length) {
    h(2, '📬 Unread Emails');
    bullet(unread, t => `**${t.subject}** — "${t.snippet.slice(0, 80)}..."`);
  }
}

// === OUTPUT ===
const output = lines.join('\n');
const outPath = new URL(`./${config.output.file}`, import.meta.url);
await writeFile(outPath, output);
console.log(output);
console.log(`\n---\nBriefing written to ${config.output.file}`);
