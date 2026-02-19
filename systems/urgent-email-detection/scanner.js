#!/usr/bin/env node
// Gmail scanner - fetches unread emails and runs classification pipeline
import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { classifyEmail, preClassifyNoise, isWithinWakingHours, formatAlert } from './classifier.js';
import { getDb, insertClassification, markAlerted, getUnalerted, isAlreadyClassified, updateSenderReputation, getSenderReputation, logScan, closeDb } from './db.js';
import config from './config.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));

async function getGmailClient() {
  const credPath = join(__dirname, config.gmail.credentialsPath);
  const tokenPath = join(__dirname, config.gmail.tokenPath);
  
  if (!existsSync(credPath) || !existsSync(tokenPath)) {
    throw new Error('Gmail credentials/token not found. Set up OAuth2 first.');
  }
  
  const credentials = JSON.parse(readFileSync(credPath, 'utf-8'));
  const token = JSON.parse(readFileSync(tokenPath, 'utf-8'));
  
  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;
  const oauth2 = new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0]);
  oauth2.setCredentials(token);
  
  return google.gmail({ version: 'v1', auth: oauth2 });
}

function extractHeader(headers, name) {
  const h = headers?.find(h => h.name.toLowerCase() === name.toLowerCase());
  return h?.value || '';
}

function extractSender(from) {
  const match = from.match(/<(.+?)>/);
  return match ? match[1].toLowerCase() : from.toLowerCase().trim();
}

async function fetchEmails(gmail) {
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: config.gmail.query,
    maxResults: config.gmail.maxResults
  });
  
  if (!res.data.messages?.length) return [];
  
  const emails = [];
  for (const msg of res.data.messages) {
    const full = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
    const headers = full.data.payload?.headers || [];
    const from = extractHeader(headers, 'From');
    const sender = extractSender(from);
    const domain = sender.split('@')[1] || '';
    
    // Get body snippet
    let body = full.data.snippet || '';
    const parts = full.data.payload?.parts || [];
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        break;
      }
    }
    
    emails.push({
      message_id: msg.id,
      thread_id: msg.threadId,
      subject: extractHeader(headers, 'Subject'),
      sender,
      sender_domain: domain,
      snippet: full.data.snippet || '',
      body,
      received_at: extractHeader(headers, 'Date'),
      raw_headers: JSON.stringify(headers)
    });
  }
  return emails;
}

async function processEmails(emails) {
  const alerts = [];
  let classified = 0;
  
  for (const email of emails) {
    if (await isAlreadyClassified(email.message_id)) continue;
    
    // Pre-filter noise
    if (preClassifyNoise(email, config.noiseSenders, config.noiseDomains)) {
      await insertClassification({ ...email, urgency_score: 0.0, urgency_label: 'low', reasoning: 'Pre-filtered: known noise sender' });
      await updateSenderReputation(email.sender, email.sender_domain, 0.0, true);
      classified++;
      continue;
    }
    
    // AI classification
    try {
      const rep = await getSenderReputation(email.sender);
      const result = await classifyEmail(email, rep);
      
      const record = {
        ...email,
        urgency_score: result.urgency_score,
        urgency_label: result.urgency_label,
        reasoning: result.reasoning
      };
      
      await insertClassification(record);
      await updateSenderReputation(email.sender, email.sender_domain, result.urgency_score);
      classified++;
      
      // Check if alert-worthy
      const labelOrder = ['critical', 'high', 'medium', 'low'];
      const minIdx = labelOrder.indexOf(config.classification.alertMinimumLabel);
      if (labelOrder.indexOf(result.urgency_label) <= minIdx) {
        alerts.push(formatAlert(record));
        await markAlerted(email.message_id);
      }
    } catch (err) {
      console.error(`Failed to classify ${email.message_id}:`, err.message);
    }
  }
  
  return { classified, alerts };
}

async function run() {
  // Time gate check
  if (!isWithinWakingHours()) {
    console.log('Outside waking hours. Skipping scan.');
    return;
  }
  
  console.log(`[${new Date().toISOString()}] Starting email scan...`);
  
  try {
    const gmail = await getGmailClient();
    const emails = await fetchEmails(gmail);
    console.log(`Found ${emails.length} unread emails`);
    
    const { classified, alerts } = await processEmails(emails);
    await logScan(emails.length, classified, alerts.length);
    
    console.log(`Classified: ${classified}, Alerts: ${alerts.length}`);
    
    // Output alerts as JSON for downstream consumption
    if (alerts.length > 0) {
      console.log('\n--- ALERTS ---');
      for (const alert of alerts) {
        console.log(JSON.stringify(alert));
      }
    }
  } catch (err) {
    console.error('Scan failed:', err.message);
  } finally {
    closeDb();
  }
}

// Run if called directly
run();
