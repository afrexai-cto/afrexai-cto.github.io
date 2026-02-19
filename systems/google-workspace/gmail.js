/**
 * gmail.js — Gmail integration
 *
 * Commands:
 *   node gmail.js scan                   # Scan recent emails, flag urgent
 *   node gmail.js contacts               # List Google contacts
 *   node gmail.js urgent                  # Show only urgent emails
 *   node gmail.js briefing               # Generate email briefing context
 *   node gmail.js draft "to" "subj" "body"  # Create draft (for approval)
 *   node gmail.js send-draft <draftId>   # Send an approved draft
 */

import { google } from 'googleapis';
import { getAuthClient } from './auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

async function getGmail() {
  const auth = await getAuthClient();
  return google.gmail({ version: 'v1', auth });
}

async function getPeople() {
  const auth = await getAuthClient();
  return google.people({ version: 'v1', auth });
}

function classifyUrgent(headers, snippet) {
  const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
  const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
  const text = `${subject} ${snippet}`.toLowerCase();

  const keywordMatch = config.urgentKeywords.some(kw => text.includes(kw.toLowerCase()));
  const senderMatch = config.urgentSenders.some(s => from.toLowerCase().includes(s.toLowerCase()));

  return { isUrgent: keywordMatch || senderMatch, reason: keywordMatch ? 'keyword' : senderMatch ? 'sender' : null };
}

function formatMessage(msg) {
  const headers = msg.payload?.headers || [];
  const get = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
  const urgency = classifyUrgent(headers, msg.snippet || '');

  return {
    id: msg.id,
    threadId: msg.threadId,
    from: get('From'),
    to: get('To'),
    subject: get('Subject'),
    date: get('Date'),
    snippet: msg.snippet,
    labels: msg.labelIds,
    isUrgent: urgency.isUrgent,
    urgencyReason: urgency.reason,
    isUnread: msg.labelIds?.includes('UNREAD'),
  };
}

async function scan(maxResults = 20) {
  const gmail = await getGmail();
  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    labelIds: ['INBOX'],
  });

  if (!res.data.messages?.length) {
    console.log('📭 No messages in inbox.');
    return [];
  }

  const messages = await Promise.all(
    res.data.messages.map(async (m) => {
      const full = await gmail.users.messages.get({ userId: 'me', id: m.id });
      return formatMessage(full.data);
    })
  );

  console.log(`📬 ${messages.length} messages scanned\n`);
  for (const m of messages) {
    const flags = [m.isUnread ? '🆕' : '  ', m.isUrgent ? '🔴' : '  '].join('');
    console.log(`${flags} ${m.date}`);
    console.log(`   From: ${m.from}`);
    console.log(`   Subject: ${m.subject}`);
    if (m.isUrgent) console.log(`   ⚠️  URGENT (${m.urgencyReason})`);
    console.log();
  }

  return messages;
}

async function contacts() {
  const people = await getPeople();
  const res = await people.people.connections.list({
    resourceName: 'people/me',
    pageSize: 100,
    personFields: 'names,emailAddresses,phoneNumbers,organizations',
  });

  const connections = res.data.connections || [];
  console.log(`👥 ${connections.length} contacts\n`);

  for (const person of connections) {
    const name = person.names?.[0]?.displayName || 'Unknown';
    const email = person.emailAddresses?.[0]?.value || '';
    const org = person.organizations?.[0]?.name || '';
    console.log(`  ${name} ${email ? `<${email}>` : ''} ${org ? `(${org})` : ''}`);
  }

  return connections;
}

async function urgent() {
  const messages = await scan(50);
  const urgentMsgs = messages.filter(m => m.isUrgent);
  if (!urgentMsgs.length) {
    console.log('✅ No urgent emails detected.');
  }
  return urgentMsgs;
}

async function briefing() {
  const messages = await scan(30);
  const unread = messages.filter(m => m.isUnread);
  const urgentMsgs = messages.filter(m => m.isUrgent);

  const summary = {
    totalInbox: messages.length,
    unreadCount: unread.length,
    urgentCount: urgentMsgs.length,
    urgentEmails: urgentMsgs.map(m => ({ from: m.from, subject: m.subject, snippet: m.snippet })),
    recentSenders: [...new Set(messages.slice(0, 10).map(m => m.from))],
    generatedAt: new Date().toISOString(),
  };

  console.log('\n📋 Email Briefing');
  console.log('━'.repeat(40));
  console.log(`  Inbox: ${summary.totalInbox} | Unread: ${summary.unreadCount} | Urgent: ${summary.urgentCount}`);
  if (summary.urgentEmails.length) {
    console.log('\n  🔴 Urgent:');
    for (const u of summary.urgentEmails) {
      console.log(`    - ${u.subject} (from ${u.from})`);
    }
  }

  return summary;
}

async function draft(to, subject, body) {
  const gmail = await getGmail();
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
  ).toString('base64url');

  const res = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: { message: { raw } },
  });

  console.log(`📝 Draft created (ID: ${res.data.id})`);
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log('   ⏳ Awaiting approval. Send with: node gmail.js send-draft ' + res.data.id);
  return res.data;
}

async function sendDraft(draftId) {
  const gmail = await getGmail();
  const res = await gmail.users.drafts.send({
    userId: 'me',
    requestBody: { id: draftId },
  });
  console.log(`✅ Draft ${draftId} sent! Message ID: ${res.data.id}`);
  return res.data;
}

// CLI
const cmd = process.argv[2];
switch (cmd) {
  case 'scan': await scan(parseInt(process.argv[3]) || 20); break;
  case 'contacts': await contacts(); break;
  case 'urgent': await urgent(); break;
  case 'briefing': await briefing(); break;
  case 'draft': await draft(process.argv[3], process.argv[4], process.argv[5]); break;
  case 'send-draft': await sendDraft(process.argv[3]); break;
  default:
    console.log('Usage: node gmail.js <scan|contacts|urgent|briefing|draft|send-draft>');
}
