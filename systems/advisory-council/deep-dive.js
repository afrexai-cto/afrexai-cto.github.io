import { getDb } from './db.js';

/**
 * Generate a deep dive for a recommendation by number or ID.
 * Usage: node deep-dive.js <session_id> <number>
 */
export function deepDive(sessionId, number) {
  const db = getDb();
  const rec = db.prepare('SELECT * FROM recommendations WHERE session_id = ? AND number = ?').get(sessionId, number);

  if (!rec) return `No recommendation #${number} found in session ${sessionId}.`;

  const analysis = generateDeepDive(rec);

  db.prepare('INSERT INTO deep_dives (recommendation_id, content) VALUES (?, ?)').run(rec.id, analysis);

  return analysis;
}

function generateDeepDive(rec) {
  const sections = [
    `# Deep Dive: #${rec.number} — ${rec.title}`,
    `**Persona:** ${rec.persona} | **Priority:** ${rec.priority} | **Confidence:** ${(rec.confidence * 100).toFixed(0)}%`,
    '',
    '## Summary',
    rec.body,
    '',
    '## Root Cause Analysis',
    generateRCA(rec),
    '',
    '## Recommended Actions',
    generateActions(rec),
    '',
    '## Impact if Ignored',
    generateImpact(rec),
    '',
    '## Metrics to Track',
    generateMetrics(rec),
  ];
  return sections.join('\n');
}

function generateRCA(rec) {
  const templates = {
    critical: `This is a critical issue that likely stems from systemic factors. The ${rec.category || 'domain'} area has been under-resourced or neglected. Immediate investigation needed.`,
    high: `Multiple contributing factors in ${rec.category || 'this area'}. Likely a combination of growth outpacing processes and insufficient monitoring.`,
    medium: `This represents a moderate risk. Likely caused by prioritization trade-offs that deferred attention to ${rec.category || 'this area'}.`,
    low: `Low-priority observation. Healthy baseline but opportunities exist for incremental improvement.`,
  };
  return templates[rec.priority] || templates.medium;
}

function generateActions(rec) {
  return [
    `1. **Immediate (this week):** Assess current state of ${rec.category || rec.title.toLowerCase()}`,
    `2. **Short-term (30 days):** Implement first corrective measures`,
    `3. **Medium-term (90 days):** Establish monitoring and review cadence`,
    `4. **Long-term:** Build systematic prevention into processes`,
  ].join('\n');
}

function generateImpact(rec) {
  const severity = { critical: 'Severe business impact within weeks. Revenue loss, customer attrition, or system failure likely.',
    high: 'Significant impact within 1-3 months. Competitive disadvantage and growing technical/operational debt.',
    medium: 'Gradual degradation over 3-6 months. Missed opportunities and accumulating inefficiency.',
    low: 'Minimal near-term impact. Opportunity cost only.' };
  return severity[rec.priority] || severity.medium;
}

function generateMetrics(rec) {
  return [
    `- Primary: Track ${rec.category || 'relevant'} KPI weekly`,
    '- Secondary: Compare month-over-month trend',
    '- Alert threshold: Set automated alerts for regression',
  ].join('\n');
}

// CLI mode
if (process.argv[1]?.endsWith('deep-dive.js') && process.argv[2]) {
  const sessionId = parseInt(process.argv[2]);
  const number = parseInt(process.argv[3]);
  console.log(deepDive(sessionId, number));
}
