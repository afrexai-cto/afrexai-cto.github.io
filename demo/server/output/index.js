'use strict';

/**
 * Output pipeline — routes deliverables to configured destinations.
 * Supports: file (always), email (nodemailer), slack (webhook), pdf (html-to-pdf).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const db = require('../db');

/**
 * Deliver a completed deliverable to all configured outputs for a company
 */
async function deliver(companyId, deliverable) {
  const data = db.read();
  const configs = data.outputConfigs?.[companyId] || [];

  // Always save to file (already done by executor)
  const results = [{ type: 'file', status: 'ok', path: deliverable.artifactPath }];

  for (const config of configs) {
    try {
      switch (config.type) {
        case 'email':
          await deliverEmail(config, deliverable);
          results.push({ type: 'email', status: 'ok', to: config.config.to });
          break;
        case 'slack':
          await deliverSlack(config, deliverable);
          results.push({ type: 'slack', status: 'ok', channel: config.config.channel || 'webhook' });
          break;
        case 'pdf':
          const pdfPath = await deliverPDF(deliverable);
          results.push({ type: 'pdf', status: 'ok', path: pdfPath });
          break;
        default:
          results.push({ type: config.type, status: 'skip', reason: 'unknown type' });
      }
    } catch (err) {
      results.push({ type: config.type, status: 'error', error: err.message });
    }
  }

  // Log delivery results
  db.update(data => {
    if (!data.deliveryLog) data.deliveryLog = [];
    data.deliveryLog.unshift({
      ts: new Date().toISOString(),
      companyId,
      deliverable: deliverable.artifactPath,
      results,
    });
    data.deliveryLog = data.deliveryLog.slice(0, 200);
  });

  return results;
}

/**
 * Email delivery via nodemailer (or SMTP directly)
 */
async function deliverEmail(config, deliverable) {
  const { to, from, subject: subjectTemplate, smtpHost, smtpPort, smtpUser, smtpPass } = config.config;

  if (!to) throw new Error('No email recipient configured');

  // Try nodemailer if available
  let nodemailer;
  try { nodemailer = require('nodemailer'); } catch {}

  if (!nodemailer) {
    // Fallback: write to outbox file for manual sending
    const outboxDir = path.join(db.getDemoDir(), 'data', 'outbox');
    fs.mkdirSync(outboxDir, { recursive: true });
    const slug = new Date().toISOString().replace(/[:.]/g, '-');
    const emailFile = path.join(outboxDir, `email-${slug}.json`);
    fs.writeFileSync(emailFile, JSON.stringify({
      to,
      from: from || 'agents@afrexai.com',
      subject: (subjectTemplate || 'AfrexAI Deliverable: {type}').replace('{type}', deliverable.type),
      body: deliverable.content,
      attachment: deliverable.filePath,
      queuedAt: new Date().toISOString(),
    }, null, 2));
    console.log(`[output] Email queued to outbox: ${emailFile}`);
    return;
  }

  const transport = nodemailer.createTransport({
    host: smtpHost || 'smtp.gmail.com',
    port: smtpPort || 587,
    secure: false,
    auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
  });

  await transport.sendMail({
    from: from || 'agents@afrexai.com',
    to,
    subject: (subjectTemplate || `[AfrexAI] ${deliverable.agentName}: ${deliverable.action}`),
    text: deliverable.content,
    attachments: deliverable.filePath ? [{ path: deliverable.filePath }] : [],
  });

  console.log(`[output] Email sent to ${to}`);
}

/**
 * Slack webhook delivery
 */
async function deliverSlack(config, deliverable) {
  const { webhookUrl } = config.config;
  if (!webhookUrl) throw new Error('No Slack webhook URL configured');

  const payload = JSON.stringify({
    text: `*${deliverable.agentName}* completed: ${deliverable.action}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `📋 ${deliverable.agentName} — ${deliverable.companyName}` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${deliverable.action}*\n\n${deliverable.content.slice(0, 2500)}${deliverable.content.length > 2500 ? '\n\n_...truncated_' : ''}` },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Generated ${new Date().toISOString()} | ${deliverable.artifactPath}` }],
      },
    ],
  });

  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const mod = url.protocol === 'https:' ? https : http;
    const req = mod.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error(`Slack webhook returned ${res.statusCode}: ${body}`));
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * PDF generation — converts markdown to simple HTML, then saves as .html
 * (true PDF requires puppeteer/wkhtmltopdf — we generate downloadable HTML)
 */
async function deliverPDF(deliverable) {
  const demoDir = db.getDemoDir();
  const pdfDir = path.join(demoDir, 'data', 'exports');
  fs.mkdirSync(pdfDir, { recursive: true });

  const slug = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${deliverable.type}-${slug}.html`;
  const filePath = path.join(pdfDir, filename);

  // Simple markdown-to-html (headings, bold, lists, paragraphs)
  let html = deliverable.content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  const doc = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>${deliverable.agentName} — ${deliverable.action}</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }
  h1, h2, h3 { color: #1a1a1a; }
  .header { border-bottom: 2px solid #FFD700; padding-bottom: 10px; margin-bottom: 20px; }
  .meta { color: #666; font-size: 0.9em; }
  @media print { body { margin: 20px; } }
</style>
</head><body>
<div class="header">
  <h1>${deliverable.agentName}</h1>
  <p class="meta">${deliverable.companyName} | ${new Date().toLocaleDateString()} | ${deliverable.type}</p>
</div>
<p>${html}</p>
</body></html>`;

  fs.writeFileSync(filePath, doc);
  console.log(`[output] PDF/HTML export: ${filename}`);
  return `exports/${filename}`;
}

/**
 * Configure output for a company
 */
function addOutputConfig(companyId, config) {
  db.update(data => {
    if (!data.outputConfigs) data.outputConfigs = {};
    if (!data.outputConfigs[companyId]) data.outputConfigs[companyId] = [];
    config.id = `out-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    data.outputConfigs[companyId].push(config);
  });
  return config;
}

function removeOutputConfig(companyId, configId) {
  db.update(data => {
    if (data.outputConfigs?.[companyId]) {
      data.outputConfigs[companyId] = data.outputConfigs[companyId].filter(c => c.id !== configId);
    }
  });
}

function getOutputConfigs(companyId) {
  const data = db.read();
  return data.outputConfigs?.[companyId] || [];
}

module.exports = { deliver, addOutputConfig, removeOutputConfig, getOutputConfigs };
