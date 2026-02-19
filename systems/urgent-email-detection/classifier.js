// AI-powered email urgency classifier using Anthropic Claude API
import { execSync } from 'child_process';
import { getSenderReputation } from './db.js';
import config from './config.json' with { type: 'json' };

function getApiKey() {
  // Try op CLI (requires 1Password desktop app integration or service account)
  try {
    const key = execSync('op read "op://AfrexAI/Anthropic/api_key" 2>/dev/null', { encoding: 'utf-8', env: { ...process.env } }).trim();
    if (key && key.startsWith('sk-ant-api')) return key;
    if (key) return key;
  } catch { /* fall through */ }
  // Fall back to env var (must be a real Anthropic API key, not an OAT)
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-api')) {
    return process.env.ANTHROPIC_API_KEY;
  }
  throw new Error('No API key available. Ensure 1Password CLI can read op://AfrexAI/Anthropic/api_key, or set ANTHROPIC_API_KEY env var.');
}

const SYSTEM_PROMPT = `You are an email urgency classifier. Analyze the email and return a JSON object with:
- "urgency_score": float 0.0-1.0 (0=spam/noise, 1=drop-everything urgent)
- "urgency_label": one of "low", "medium", "high", "critical"
- "reasoning": brief explanation (1-2 sentences)

Classification guide:
- CRITICAL (0.9-1.0): Security breaches, server down, legal deadlines, health emergencies, payment failures for production services
- HIGH (0.7-0.89): Client requests needing same-day response, important deadlines within 24h, direct requests from key contacts
- MEDIUM (0.4-0.69): Useful info needing action within a few days, meeting requests, non-urgent client updates
- LOW (0.0-0.39): Newsletters, notifications, marketing, social media, automated reports, FYI-only

Consider sender reputation data when provided. Return ONLY valid JSON, no markdown.`;

export async function classifyEmail(email, senderReputation = null) {
  const apiKey = getApiKey();
  
  let context = `Subject: ${email.subject}\nFrom: ${email.sender}\nDate: ${email.received_at}\n\nSnippet: ${email.snippet}`;
  
  if (email.body) {
    context += `\n\nBody (first 2000 chars):\n${email.body.substring(0, 2000)}`;
  }
  
  if (senderReputation) {
    context += `\n\nSender reputation: ${senderReputation.total_emails} emails seen, avg urgency ${senderReputation.avg_urgency.toFixed(2)}, ${senderReputation.urgent_count} urgent, ${senderReputation.noise_count} noise`;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.classification.model,
      max_tokens: config.classification.maxTokens,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: context }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content[0].text.trim();
  
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(`Failed to parse classifier response: ${text}`);
  }
}

// Classify without API call - rule-based pre-filter
export function preClassifyNoise(email, noiseList, noiseDomains) {
  const sender = (email.sender || '').toLowerCase();
  const domain = sender.split('@')[1] || '';
  
  for (const pattern of noiseList) {
    if (pattern.includes('@')) {
      if (sender.includes(pattern.toLowerCase())) return true;
    } else {
      if (sender.startsWith(pattern.toLowerCase())) return true;
    }
  }
  
  for (const d of noiseDomains) {
    if (domain === d.toLowerCase()) return true;
  }
  
  return false;
}

export function isWithinWakingHours(date = new Date()) {
  // Convert to London time
  const london = new Date(date.toLocaleString('en-US', { timeZone: config.scanning.timezone }));
  const hour = london.getHours();
  const day = london.getDay(); // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6;
  
  const { start, end } = isWeekend 
    ? config.scanning.wakingHours.weekend 
    : config.scanning.wakingHours.weekday;
  
  return hour >= start && hour < end;
}

export function formatAlert(classification) {
  const emoji = { critical: '🚨', high: '⚠️', medium: 'ℹ️', low: '📩' };
  return {
    text: `${emoji[classification.urgency_label] || '📧'} **${classification.urgency_label.toUpperCase()}** email\n**From:** ${classification.sender}\n**Subject:** ${classification.subject}\n**Score:** ${classification.urgency_score}\n**Why:** ${classification.reasoning}`,
    urgency_label: classification.urgency_label,
    urgency_score: classification.urgency_score,
    message_id: classification.message_id,
    sender: classification.sender,
    subject: classification.subject
  };
}
