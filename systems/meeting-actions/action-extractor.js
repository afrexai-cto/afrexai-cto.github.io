/**
 * Action Extractor - Extracts action items from meeting transcripts.
 * Determines ownership (mine vs theirs) and due dates.
 */
import { getDb, initDb } from './db.js';
import { v4 as uuid } from 'uuid';

// Action item patterns (would be replaced by LLM extraction in production)
const ACTION_PATTERNS = [
  /(?:i'll|i will|i'm going to|let me)\s+(.+?)(?:\.|$)/gi,
  /(?:action item|todo|task):\s*(.+?)(?:\.|$)/gi,
  /(?:can you|could you|please|would you)\s+(.+?)(?:\.|$)/gi,
  /(?:we need to|we should|we must)\s+(.+?)(?:\.|$)/gi,
];

const DUE_PATTERNS = [
  /by\s+(monday|tuesday|wednesday|thursday|friday|end of week|eow|tomorrow|next week)/gi,
  /due\s+(\w+\s+\d+)/gi,
  /deadline[:\s]+(\w+\s+\d+)/gi,
];

/**
 * Extract action items from transcript text.
 * In production, this would call an LLM for intelligent extraction.
 */
export function extractFromTranscript(transcript, attendees) {
  const items = [];

  // Simple pattern-based extraction (stub for LLM)
  for (const pattern of ACTION_PATTERNS) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(transcript)) !== null) {
      const description = match[1].trim();
      if (description.length < 5 || description.length > 200) continue;

      // Determine ownership based on speaker context
      const ownership = match[0].toLowerCase().startsWith('i') ? 'mine' : 'theirs';

      items.push({
        description,
        ownership,
        dueDate: extractDueDate(transcript, match.index),
        priority: 0,
      });
    }
  }

  return deduplicateItems(items);
}

function extractDueDate(transcript, nearIndex) {
  const context = transcript.substring(Math.max(0, nearIndex - 100), nearIndex + 200);
  for (const pattern of DUE_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(context);
    if (match) return match[1];
  }
  return null;
}

function deduplicateItems(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.description.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function saveActionItems(meetingId, items, ownerMap = {}) {
  const db = initDb();
  const saved = [];

  const stmt = db.prepare(`INSERT INTO action_items 
    (id, meeting_id, description, owner_contact_id, ownership, status, due_date, priority)
    VALUES (?, ?, ?, ?, ?, 'pending_approval', ?, ?)`);

  for (const item of items) {
    const id = uuid();
    const ownerId = ownerMap[item.ownership] || null;
    stmt.run(id, meetingId, item.description, ownerId, item.ownership, item.dueDate, item.priority);
    saved.push({ id, ...item });
  }

  // Mark meeting as processed
  db.prepare('UPDATE meetings SET processed_at = datetime(\'now\') WHERE id = ?').run(meetingId);

  return saved;
}

export default { extractFromTranscript, saveActionItems };
