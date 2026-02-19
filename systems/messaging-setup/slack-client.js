/**
 * Slack client: mention-only mode, user allowlist, auto-reaction, single-message responses.
 * No "thinking..." intermediates — one complete message per response.
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const CONFIG_PATH = new URL('./config.json', import.meta.url).pathname;

function loadConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}

function resolveSecret(ref) {
  if (!ref || !ref.startsWith('op://')) return ref;
  return execSync(`op read "${ref}"`, { encoding: 'utf8' }).trim();
}

export class SlackClient {
  constructor(overrides = {}) {
    const cfg = loadConfig().slack;
    this.token = overrides.botToken || resolveSecret(cfg.botToken);
    this.mode = cfg.mode;                       // "mention-only"
    this.allowlist = cfg.userAllowlist || [];    // allowed user IDs
    this.autoReactEmoji = cfg.autoReactEmoji;    // "eyes"
    this.maxMessages = cfg.maxMessagesPerTask;   // 2
    this._taskMessageCount = new Map();          // channel -> count
  }

  async api(method, body = {}) {
    const res = await fetch(`https://slack.com/api/${method}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
    return data;
  }

  /**
   * Check if an incoming event should be processed.
   * Returns false for non-mentions or non-allowlisted users.
   */
  shouldProcess(event) {
    // Mention-only mode: ignore messages that don't mention the bot
    if (this.mode === 'mention-only') {
      const isMention = event.type === 'app_mention';
      const hasDirectMention = event.text && event.text.includes(`<@${event.bot_id || ''}`);
      if (!isMention && !hasDirectMention) return false;
    }

    // User allowlist (empty = allow all)
    if (this.allowlist.length > 0 && !this.allowlist.includes(event.user)) {
      return false;
    }

    return true;
  }

  /**
   * Auto-react with 👀 (eyes) to acknowledge receipt.
   */
  async acknowledgeReceipt(channel, timestamp) {
    return this.api('reactions.add', {
      channel,
      timestamp,
      name: this.autoReactEmoji
    });
  }

  /**
   * Send a single complete message. No intermediates.
   * Enforces max 2 messages per task per channel.
   */
  async sendMessage(channel, text, opts = {}) {
    const count = this._taskMessageCount.get(channel) || 0;
    if (count >= this.maxMessages) {
      console.warn(`[SlackClient] Max messages (${this.maxMessages}) reached for ${channel}, skipping.`);
      return null;
    }

    const result = await this.api('chat.postMessage', {
      channel,
      text,
      thread_ts: opts.threadTs || undefined,
      unfurl_links: false,
      unfurl_media: false
    });

    this._taskMessageCount.set(channel, count + 1);
    return result;
  }

  /**
   * Upload a file to a channel (sends actual file, not link).
   */
  async uploadFile(channel, filePath, opts = {}) {
    const fileData = readFileSync(filePath);
    const fileName = opts.filename || filePath.split('/').pop();

    const form = new FormData();
    form.append('token', this.token);
    form.append('channels', channel);
    form.append('file', new Blob([fileData]), fileName);
    if (opts.title) form.append('title', opts.title);
    if (opts.comment) form.append('initial_comment', opts.comment);

    const res = await fetch('https://slack.com/api/files.upload', {
      method: 'POST',
      body: form
    });
    return res.json();
  }

  /**
   * Handle an incoming event end-to-end:
   * 1. Check allowlist + mention mode
   * 2. React with 👀
   * 3. Return true if should continue processing
   */
  async handleIncoming(event) {
    if (!this.shouldProcess(event)) return false;

    // Auto-react with eyes
    try {
      await this.acknowledgeReceipt(event.channel, event.ts);
    } catch (e) {
      // Non-fatal: reaction may already exist
      console.warn(`[SlackClient] React failed: ${e.message}`);
    }

    return true;
  }

  /** Reset per-task message counter (call between tasks). */
  resetTaskCounter(channel) {
    this._taskMessageCount.delete(channel);
  }
}

export default SlackClient;
