/**
 * Telegram Bot API client for forum-based topic messaging.
 * Supports: text messages, file uploads, topic creation.
 * Uses message_thread_id to route messages to specific forum topics.
 */

import { readFileSync } from 'fs';
import { basename } from 'path';
import { execSync } from 'child_process';

const CONFIG_PATH = new URL('./config.json', import.meta.url).pathname;

function loadConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}

function resolveSecret(ref) {
  if (!ref || !ref.startsWith('op://')) return ref;
  return execSync(`op read "${ref}"`, { encoding: 'utf8' }).trim();
}

export class TelegramClient {
  constructor(overrides = {}) {
    const cfg = loadConfig().telegram;
    this.token = overrides.botToken || resolveSecret(cfg.botToken);
    this.chatId = overrides.chatId || resolveSecret(cfg.chatId);
    this.apiBase = cfg.apiBase;
    this.topics = cfg.topics;
  }

  get baseUrl() {
    return `${this.apiBase}/bot${this.token}`;
  }

  async api(method, body, formData = null) {
    const url = `${this.baseUrl}/${method}`;
    const opts = {};

    if (formData) {
      // Use native fetch with FormData (Node 18+)
      opts.method = 'POST';
      opts.body = formData;
    } else if (body) {
      opts.method = 'POST';
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(url, opts);
    const data = await res.json();
    if (!data.ok) throw new Error(`Telegram API error: ${data.description} (${data.error_code})`);
    return data.result;
  }

  /**
   * Create a forum topic in the supergroup.
   * Returns { message_thread_id, name, icon_color }
   */
  async createForumTopic(name, iconColor = 7322096) {
    return this.api('createForumTopic', {
      chat_id: this.chatId,
      name,
      icon_color: iconColor
    });
  }

  /**
   * Send a text message to a specific topic.
   */
  async sendMessage(threadId, text, opts = {}) {
    return this.api('sendMessage', {
      chat_id: this.chatId,
      message_thread_id: threadId,
      text,
      parse_mode: opts.parseMode || 'Markdown',
      disable_notification: opts.silent || false
    });
  }

  /**
   * Send a file (document) to a specific topic.
   * Sends the actual file, not a link.
   */
  async sendDocument(threadId, filePath, caption = '') {
    const fileData = readFileSync(filePath);
    const fileName = basename(filePath);

    const form = new FormData();
    form.append('chat_id', this.chatId.toString());
    form.append('message_thread_id', threadId.toString());
    form.append('document', new Blob([fileData]), fileName);
    if (caption) form.append('caption', caption);

    return this.api('sendDocument', null, form);
  }

  /**
   * Send a photo to a specific topic.
   */
  async sendPhoto(threadId, filePath, caption = '') {
    const fileData = readFileSync(filePath);
    const fileName = basename(filePath);

    const form = new FormData();
    form.append('chat_id', this.chatId.toString());
    form.append('message_thread_id', threadId.toString());
    form.append('photo', new Blob([fileData]), fileName);
    if (caption) form.append('caption', caption);

    return this.api('sendPhoto', null, form);
  }

  /**
   * Get the thread ID for a named topic from config.
   * Returns null if topic not yet created (run setup-topics.js first).
   */
  getThreadId(topicKey) {
    const topic = this.topics[topicKey];
    if (!topic) throw new Error(`Unknown topic: ${topicKey}`);
    if (!topic.threadId) throw new Error(`Topic "${topicKey}" has no threadId. Run setup-topics.js first.`);
    return topic.threadId;
  }
}

export default TelegramClient;
