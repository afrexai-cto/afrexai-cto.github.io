#!/usr/bin/env node
// Feedback system - correct classifications and update sender reputation
import { getDb, closeDb, getClassificationByMessageId, insertFeedback, getSenderReputation, getFeedbackStatsFromDb, getReputationReportFromDb, saveDb } from './db.js';

export async function submitFeedback(messageId, correctLabel, note = '') {
  const cls = await getClassificationByMessageId(messageId);
  if (!cls) throw new Error(`Classification not found for message_id: ${messageId}`);
  
  await insertFeedback(cls.id, correctLabel, note);
  
  // Update sender reputation based on correction
  const rep = await getSenderReputation(cls.sender);
  if (rep) {
    const labelScores = { critical: 0.95, high: 0.8, medium: 0.5, low: 0.1 };
    const correctScore = labelScores[correctLabel] || 0.5;
    const newAvg = ((rep.avg_urgency * rep.total_emails) - cls.urgency_score + correctScore) / rep.total_emails;
    const isNoise = correctLabel === 'low' ? rep.noise_count + 1 : rep.noise_count;
    const isUrgent = ['high', 'critical'].includes(correctLabel) ? rep.urgent_count + 1 : rep.urgent_count;
    
    const db = await getDb();
    db.run(`UPDATE sender_reputation SET avg_urgency=?, noise_count=?, urgent_count=?, updated_at=datetime('now') WHERE sender=?`,
      [Math.max(0, Math.min(1, newAvg)), isNoise, isUrgent, cls.sender]);
    saveDb();
  }
  
  return { original: cls.urgency_label, corrected: correctLabel, sender: cls.sender };
}

export async function getFeedbackStats() {
  return getFeedbackStatsFromDb();
}

export async function getReputationReport() {
  return getReputationReportFromDb();
}

// CLI interface
const cmd = process.argv[2];
if (cmd) {
  try {
    if (cmd === 'correct' && process.argv[3] && process.argv[4]) {
      const result = await submitFeedback(process.argv[3], process.argv[4], process.argv[5] || '');
      console.log('Feedback recorded:', result);
    } else if (cmd === 'stats') {
      console.log(JSON.stringify(await getFeedbackStats(), null, 2));
    } else if (cmd === 'reputation') {
      console.log(JSON.stringify(await getReputationReport(), null, 2));
    } else {
      console.log('Usage:\n  node feedback.js correct <message_id> <low|medium|high|critical> [note]\n  node feedback.js stats\n  node feedback.js reputation');
    }
  } finally {
    closeDb();
  }
}
