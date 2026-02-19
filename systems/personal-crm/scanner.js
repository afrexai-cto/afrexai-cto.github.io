#!/usr/bin/env node
// Gmail Scanner - discovers contacts from email history
// Uses Gmail API via OAuth (or IMAP as fallback)
// Credentials from 1Password vault AfrexAI

import { google } from 'googleapis';
import { execSync } from 'child_process';
import { getDb, isNoiseSender, float32ToBlob } from './db.js';
import { getEmbedding } from './embeddings.js';

// --- Auth ---
async function getGmailClient() {
  // Load OAuth creds from 1Password
  const clientId = execSync('op read "op://AfrexAI/Gmail OAuth/client_id"', { encoding: 'utf8' }).trim();
  const clientSecret = execSync('op read "op://AfrexAI/Gmail OAuth/client_secret"', { encoding: 'utf8' }).trim();
  const refreshToken = execSync('op read "op://AfrexAI/Gmail OAuth/refresh_token"', { encoding: 'utf8' }).trim();

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });

  return google.gmail({ version: 'v1', auth: oauth2 });
}

// --- Parsing ---
function parseEmailAddress(raw) {
  if (!raw) return { name: null, email: null };
  const match = raw.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+@[^>]+)>?$/);
  if (!match) return { name: null, email: raw.toLowerCase().trim() };
  return {
    name: match[1]?.trim() || null,
    email: match[2].toLowerCase().trim(),
  };
}

function getHeader(headers, name) {
  return headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || null;
}

// --- Main scan ---
async function scan() {
  const db = getDb();
  const gmail = await getGmailClient();

  // Get last scan page token
  const stateRow = db.prepare('SELECT value FROM scan_state WHERE key = ?').get('gmail_page_token');
  let pageToken = stateRow?.value || undefined;

  const upsertContact = db.prepare(`
    INSERT INTO contacts (email, name, is_noise) VALUES (?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      name = COALESCE(NULLIF(excluded.name, ''), contacts.name),
      updated_at = datetime('now')
    RETURNING id
  `);

  const insertInteraction = db.prepare(`
    INSERT OR IGNORE INTO interactions (contact_id, type, direction, subject, snippet, message_id, occurred_at)
    VALUES (?, 'email', ?, ?, ?, ?, ?)
  `);

  const savePageToken = db.prepare(`
    INSERT INTO scan_state (key, value) VALUES ('gmail_page_token', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  let totalProcessed = 0;
  let totalContacts = 0;
  const maxPages = parseInt(process.env.CRM_SCAN_PAGES || '5', 10);

  console.log(`📧 Starting Gmail scan (max ${maxPages} pages)...`);

  for (let page = 0; page < maxPages; page++) {
    const listResp = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      pageToken,
    });

    const messages = listResp.data.messages || [];
    if (!messages.length) break;

    for (const msg of messages) {
      try {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date'],
        });

        const headers = detail.data.payload?.headers || [];
        const from = parseEmailAddress(getHeader(headers, 'From'));
        const subject = getHeader(headers, 'Subject') || '';
        const date = getHeader(headers, 'Date');
        const snippet = detail.data.snippet || '';

        if (!from.email) continue;

        const noise = isNoiseSender(from.email) ? 1 : 0;
        const row = upsertContact.get(from.email, from.name, noise);
        if (row) {
          totalContacts++;
          insertInteraction.run(
            row.id, 'inbound', subject, snippet.slice(0, 500),
            msg.id, date ? new Date(date).toISOString() : new Date().toISOString()
          );
        }

        // Also capture To addresses as outbound contacts
        const toRaw = getHeader(headers, 'To');
        if (toRaw) {
          for (const addr of toRaw.split(',')) {
            const to = parseEmailAddress(addr.trim());
            if (to.email && !isNoiseSender(to.email)) {
              const toRow = upsertContact.get(to.email, to.name, 0);
              // We don't create interaction for To here to avoid duplicates
            }
          }
        }

        totalProcessed++;
      } catch (e) {
        // Skip individual message errors
        if (!e.message?.includes('404')) console.error(`  ⚠ ${msg.id}: ${e.message}`);
      }
    }

    pageToken = listResp.data.nextPageToken;
    if (pageToken) savePageToken.run(pageToken);
    else break;

    console.log(`  Page ${page + 1}: processed ${messages.length} messages`);
  }

  // Generate embeddings for new contacts without them
  console.log(`\n🧠 Generating embeddings for new contacts...`);
  const needEmbedding = db.prepare(`
    SELECT c.id, c.email, c.name, c.company, c.role, c.how_known
    FROM contacts c
    WHERE c.is_noise = 0 AND c.merged_into IS NULL
    AND c.id NOT IN (SELECT contact_id FROM embeddings)
    LIMIT 50
  `).all();

  for (const contact of needEmbedding) {
    const text = [
      contact.name, contact.email, contact.company, contact.role, contact.how_known
    ].filter(Boolean).join(' | ');
    try {
      const vec = await getEmbedding(text);
      db.prepare('INSERT INTO embeddings (contact_id, text, vector) VALUES (?, ?, ?)')
        .run(contact.id, text, float32ToBlob(vec));
    } catch (e) {
      console.error(`  ⚠ Embedding failed for ${contact.email}: ${e.message}`);
    }
  }

  const stats = db.prepare('SELECT COUNT(*) as total, SUM(is_noise) as noise FROM contacts').get();
  console.log(`\n✅ Scan complete:`);
  console.log(`   Messages processed: ${totalProcessed}`);
  console.log(`   Total contacts: ${stats.total} (${stats.noise} noise filtered)`);
  console.log(`   Embeddings generated: ${needEmbedding.length}`);
}

scan().catch(e => {
  console.error('❌ Scan failed:', e.message);
  process.exit(1);
});
