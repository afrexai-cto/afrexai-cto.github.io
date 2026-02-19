/**
 * Feedback learning module - tracks accepts/rejects and learns patterns.
 */

/** Update pitch status and log the change */
function updatePitchStatus(db, pitchId, newStatus, reason = null) {
  const pitch = db.prepare('SELECT status FROM pitches WHERE id = ?').get(pitchId);
  if (!pitch) throw new Error(`Pitch ${pitchId} not found`);

  db.prepare('UPDATE pitches SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newStatus, pitchId);

  db.prepare('INSERT INTO feedback_log (pitch_id, old_status, new_status, reason) VALUES (?, ?, ?, ?)')
    .run(pitchId, pitch.status, newStatus, reason);

  return { pitchId, oldStatus: pitch.status, newStatus, reason };
}

/** Get feedback stats */
function getFeedbackStats(db) {
  const stats = db.prepare(`
    SELECT status, COUNT(*) as count FROM pitches GROUP BY status
  `).all();

  const recentFeedback = db.prepare(`
    SELECT fl.*, p.idea FROM feedback_log fl
    JOIN pitches p ON p.id = fl.pitch_id
    ORDER BY fl.created_at DESC LIMIT 20
  `).all();

  const acceptRate = calculateAcceptRate(db);

  return { stats, recentFeedback, acceptRate };
}

/** Calculate accept rate over time */
function calculateAcceptRate(db) {
  const total = db.prepare(`
    SELECT COUNT(*) as n FROM pitches WHERE status IN ('accepted', 'rejected', 'produced')
  `).get().n;

  const accepted = db.prepare(`
    SELECT COUNT(*) as n FROM pitches WHERE status IN ('accepted', 'produced')
  `).get().n;

  return total > 0 ? accepted / total : 0;
}

/**
 * Analyze patterns in accepted vs rejected ideas.
 * Returns common themes/keywords in accepted ideas.
 */
function analyzePatterns(db) {
  const accepted = db.prepare(`
    SELECT idea, suggested_angles FROM pitches WHERE status IN ('accepted', 'produced')
  `).all();

  const rejected = db.prepare(`
    SELECT idea, suggested_angles FROM pitches WHERE status = 'rejected'
  `).all();

  // Simple keyword frequency analysis
  const acceptedWords = wordFrequency(accepted.map(r => r.idea));
  const rejectedWords = wordFrequency(rejected.map(r => r.idea));

  // Find words more common in accepted ideas
  const insights = [];
  for (const [word, freq] of Object.entries(acceptedWords)) {
    const rejFreq = rejectedWords[word] || 0;
    if (freq > rejFreq && freq >= 2) {
      insights.push({ word, acceptedFreq: freq, rejectedFreq: rejFreq });
    }
  }

  return {
    totalAccepted: accepted.length,
    totalRejected: rejected.length,
    acceptRate: calculateAcceptRate(db),
    topInsights: insights.sort((a, b) => b.acceptedFreq - a.acceptedFreq).slice(0, 10),
  };
}

function wordFrequency(texts) {
  const freq = {};
  const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'with', 'this', 'that', 'it']);
  texts.forEach(t => {
    (t || '').toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopwords.has(w))
      .forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  });
  return freq;
}

module.exports = { updatePitchStatus, getFeedbackStats, analyzePatterns };
