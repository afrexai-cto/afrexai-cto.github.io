/**
 * Message Router: routes messages to the correct Telegram topic.
 * Enforces content-type isolation — no cross-posting.
 */

import { readFileSync, writeFileSync } from 'fs';
import TelegramClient from './telegram-client.js';

const CONFIG_PATH = new URL('./config.json', import.meta.url).pathname;

// Content type → topic mapping (strict, no cross-posting)
const CONTENT_TYPE_MAP = {
  'daily-brief':      ['daily-brief', 'morning-summary', 'daily-report'],
  'crm':              ['crm', 'contact', 'lead', 'deal', 'pipeline'],
  'email':            ['email', 'inbox', 'mail'],
  'knowledge-base':   ['knowledge', 'kb', 'wiki', 'reference', 'doc'],
  'meta-analysis':    ['meta', 'analysis', 'insight', 'pattern'],
  'video-ideas':      ['video', 'youtube', 'content-idea', 'thumbnail'],
  'earnings':         ['earnings', 'revenue', 'income', 'payout'],
  'cron-updates':     ['cron', 'cron-failure', 'job-failure', 'scheduler'],
  'financials':       ['financial', 'bank', 'investment', 'portfolio', 'tax'],
  'health':           ['health', 'workout', 'sleep', 'nutrition', 'medical'],
  'security':         ['security', 'alert', 'breach', 'auth', 'access'],
  'advisory-council': ['advisory', 'council', 'strategy', 'decision'],
  'action-items':     ['action', 'todo', 'task', 'followup', 'reminder']
};

export class MessageRouter {
  constructor() {
    this.config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    this.telegram = new TelegramClient();
    this._buildReverseMap();
  }

  _buildReverseMap() {
    this._typeToTopic = {};
    for (const [topic, types] of Object.entries(CONTENT_TYPE_MAP)) {
      for (const type of types) {
        this._typeToTopic[type] = topic;
      }
    }
  }

  /**
   * Resolve a content type or topic name to the canonical topic key.
   */
  resolve(typeOrTopic) {
    const key = typeOrTopic.toLowerCase().trim();
    // Direct topic match
    if (this.config.telegram.topics[key]) return key;
    // Content type match
    if (this._typeToTopic[key]) return this._typeToTopic[key];
    return null;
  }

  /**
   * Route a message to the correct topic.
   * Enforces: cron-updates only receives failures.
   * Enforces: financials is locked (require explicit override).
   */
  async route(typeOrTopic, message, opts = {}) {
    const topicKey = this.resolve(typeOrTopic);
    if (!topicKey) throw new Error(`Cannot route: unknown type/topic "${typeOrTopic}"`);

    const topicCfg = this.config.telegram.topics[topicKey];

    // Cron-updates: failures only
    if (topicKey === 'cron-updates' && topicCfg.filter === 'failures-only') {
      if (!opts.isFailure && !message.toLowerCase().includes('fail') && !message.toLowerCase().includes('error')) {
        console.log(`[Router] Skipping cron-updates: not a failure.`);
        return null;
      }
    }

    // Financials: locked, require explicit unlock or send via DM
    if (topicKey === 'financials' && topicCfg.locked && !opts.unlocked) {
      throw new Error('Topic "financials" is locked. Pass { unlocked: true } or send via DM.');
    }

    const threadId = topicCfg.threadId;
    if (!threadId) throw new Error(`Topic "${topicKey}" has no threadId. Run setup-topics.js first.`);

    // Send file or text
    if (opts.filePath) {
      return this.telegram.sendDocument(threadId, opts.filePath, message || '');
    }
    return this.telegram.sendMessage(threadId, message, opts);
  }

  /**
   * List all available topics and their content types.
   */
  listTopics() {
    return Object.entries(CONTENT_TYPE_MAP).map(([topic, types]) => ({
      topic,
      name: this.config.telegram.topics[topic]?.name || topic,
      contentTypes: types,
      threadId: this.config.telegram.topics[topic]?.threadId,
      ready: !!this.config.telegram.topics[topic]?.threadId
    }));
  }
}

export default MessageRouter;
