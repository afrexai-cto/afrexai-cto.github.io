#!/usr/bin/env node
// Relationship health score calculator
// Scores contacts 0-100 based on recency, frequency, and reciprocity

import { getDb } from './db.js';

function computeScores() {
  const db = getDb();

  const contacts = db.prepare(`
    SELECT c.id, c.email, c.name, c.company
    FROM contacts c
    WHERE c.is_noise = 0 AND c.merged_into IS NULL
  `).all();

  const upsertScore = db.prepare(`
    INSERT INTO health_scores (contact_id, score, factors) VALUES (?, ?, ?)
    ON CONFLICT DO NOTHING
  `);

  // Delete old scores and recompute
  db.prepare('DELETE FROM health_scores').run();

  const now = Date.now();
  let stale = [];

  for (const contact of contacts) {
    const interactions = db.prepare(`
      SELECT direction, occurred_at FROM interactions
      WHERE contact_id = ? ORDER BY occurred_at DESC
    `).all(contact.id);

    if (interactions.length === 0) {
      const score = 5;
      upsertScore.run(contact.id, score, JSON.stringify({ reason: 'no interactions' }));
      stale.push({ ...contact, score, days_since: null });
      continue;
    }

    // Recency score (0-40): how recent was last interaction
    const lastDate = new Date(interactions[0].occurred_at);
    const daysSince = (now - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    let recency;
    if (daysSince < 7) recency = 40;
    else if (daysSince < 30) recency = 30;
    else if (daysSince < 90) recency = 20;
    else if (daysSince < 180) recency = 10;
    else recency = 0;

    // Frequency score (0-30): interaction volume in last 90 days
    const recent = interactions.filter(i => {
      const d = new Date(i.occurred_at);
      return (now - d.getTime()) < 90 * 24 * 60 * 60 * 1000;
    });
    const frequency = Math.min(30, recent.length * 3);

    // Reciprocity score (0-30): balance of inbound vs outbound
    const inbound = interactions.filter(i => i.direction === 'inbound').length;
    const outbound = interactions.filter(i => i.direction === 'outbound').length;
    const total = inbound + outbound;
    let reciprocity = 0;
    if (total > 0) {
      const ratio = Math.min(inbound, outbound) / Math.max(inbound, outbound, 1);
      reciprocity = Math.round(ratio * 30);
    }

    const score = recency + frequency + reciprocity;
    const factors = { recency, frequency, reciprocity, daysSince: Math.round(daysSince), totalInteractions: interactions.length };

    upsertScore.run(contact.id, score, JSON.stringify(factors));

    if (score < 30) {
      stale.push({ ...contact, score, days_since: Math.round(daysSince) });
    }
  }

  // Report
  console.log(`\n📊 Health scores computed for ${contacts.length} contacts\n`);

  // Top healthy
  const healthy = db.prepare(`
    SELECT c.name, c.email, c.company, h.score, h.factors
    FROM health_scores h JOIN contacts c ON c.id = h.contact_id
    ORDER BY h.score DESC LIMIT 10
  `).all();

  console.log('💚 Healthiest relationships:');
  for (const h of healthy) {
    console.log(`  ${h.score.toString().padStart(3)} | ${h.name || h.email} ${h.company ? '@ ' + h.company : ''}`);
  }

  // Stale
  stale.sort((a, b) => a.score - b.score);
  if (stale.length > 0) {
    console.log(`\n⚠️  Stale relationships (score < 30): ${stale.length}`);
    for (const s of stale.slice(0, 15)) {
      console.log(`  ${(s.score || 0).toString().padStart(3)} | ${s.name || s.email} ${s.days_since != null ? `(${s.days_since} days)` : '(never)'}`);
    }
  }

  console.log(`\n  Run: node reminders.js create <contact_id> "Follow up" "2025-02-28" to set reminders`);
}

computeScores();
