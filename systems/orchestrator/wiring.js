/**
 * Wiring — Data flow connections between systems.
 * Each pipe defines: source system, target system, what data flows, and a transform function.
 */

import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SYSTEMS = resolve(__dirname, '..');

// ── Data Pipes ──────────────────────────────────────────────────────────

export const pipes = [
  {
    id: 'crm-to-briefing',
    from: 'personal-crm',
    to: 'daily-briefing',
    description: 'Attendee context for today\'s meetings',
    async pull() {
      const { getDb } = await import(join(SYSTEMS, 'personal-crm/db.js'));
      const db = getDb();
      const rows = db.prepare(`
        SELECT c.name, c.company, c.role, c.relationship_score,
               i.type AS last_type, i.date AS last_date, i.summary AS last_summary
        FROM contacts c
        LEFT JOIN interactions i ON i.contact_id = c.id
          AND i.date = (SELECT MAX(date) FROM interactions WHERE contact_id = c.id)
        WHERE c.next_meeting_date = date('now')
        ORDER BY c.name
      `).all();
      return { attendees: rows };
    }
  },
  {
    id: 'crm-to-meeting-actions',
    from: 'personal-crm',
    to: 'meeting-actions',
    description: 'Attendee matching for action item ownership',
    async pull() {
      const { getDb } = await import(join(SYSTEMS, 'personal-crm/db.js'));
      const db = getDb();
      const contacts = db.prepare('SELECT id, name, company, email FROM contacts').all();
      return { contacts };
    }
  },
  {
    id: 'social-to-briefing',
    from: 'social-tracker',
    to: 'daily-briefing',
    description: 'Yesterday\'s social media performance',
    async pull() {
      const { execSync } = await import('child_process');
      try {
        const out = execSync(`node ${join(SYSTEMS, 'social-tracker/report.js')} yesterday`, {
          encoding: 'utf8', timeout: 30000
        });
        return { socialReport: out };
      } catch (e) {
        return { socialReport: null, error: e.message };
      }
    }
  },
  {
    id: 'social-to-advisory',
    from: 'social-tracker',
    to: 'advisory-council',
    description: 'Content performance data for advisory analysis',
    async pull() {
      const { execSync } = await import('child_process');
      try {
        const out = execSync(`node ${join(SYSTEMS, 'social-tracker/report.js')} today`, {
          encoding: 'utf8', timeout: 30000
        });
        return { contentData: out };
      } catch (e) {
        return { contentData: null, error: e.message };
      }
    }
  },
  {
    id: 'meeting-actions-to-briefing',
    from: 'meeting-actions',
    to: 'daily-briefing',
    description: 'Open action items and waiting-on items',
    async pull() {
      const { getDb, initDb } = await import(join(SYSTEMS, 'meeting-actions/db.js'));
      try {
        const db = getDb();
        const myActions = db.prepare(`
          SELECT title, due_date, meeting_title, status
          FROM action_items WHERE owner = 'mine' AND status != 'done'
          ORDER BY due_date ASC LIMIT 20
        `).all();
        const waitingOn = db.prepare(`
          SELECT title, due_date, meeting_title, assignee, status
          FROM action_items WHERE owner = 'theirs' AND status != 'done'
          ORDER BY due_date ASC LIMIT 20
        `).all();
        return { myActions, waitingOn };
      } catch (e) {
        return { myActions: [], waitingOn: [], error: e.message };
      }
    }
  },
  {
    id: 'newsletter-to-advisory',
    from: 'newsletter-crm',
    to: 'advisory-council',
    description: 'Subscriber counts and deal pipeline for strategy',
    async pull() {
      try {
        const { getDb } = await import(join(SYSTEMS, 'newsletter-crm/db.js'));
        const db = getDb();
        const stats = db.prepare('SELECT COUNT(*) as total FROM subscribers').get();
        const deals = db.prepare('SELECT * FROM deals WHERE status = \'active\' ORDER BY value DESC LIMIT 10').all();
        return { subscriberCount: stats?.total || 0, activeDeals: deals || [] };
      } catch (e) {
        return { subscriberCount: 0, activeDeals: [], error: e.message };
      }
    }
  },
  {
    id: 'asana-to-advisory',
    from: 'asana-integration',
    to: 'advisory-council',
    description: 'Task status and project progress',
    async pull() {
      const { execSync } = await import('child_process');
      try {
        const out = execSync(`node ${join(SYSTEMS, 'asana-integration/sync.js')} --summary`, {
          encoding: 'utf8', timeout: 30000
        });
        return { taskSummary: out };
      } catch (e) {
        return { taskSummary: null, error: e.message };
      }
    }
  },
  {
    id: 'kb-to-video-pipeline',
    from: 'knowledge-base',
    to: 'video-pipeline',
    description: 'Related content search for video ideas',
    async pull(query = '') {
      try {
        const { getDb } = await import(join(SYSTEMS, 'knowledge-base/db.js'));
        const db = getDb();
        const results = db.prepare(
          'SELECT title, summary, source FROM documents ORDER BY created_at DESC LIMIT 20'
        ).all();
        return { relatedContent: results };
      } catch (e) {
        return { relatedContent: [], error: e.message };
      }
    }
  },
  {
    id: 'platform-health-to-advisory',
    from: 'platform-health',
    to: 'advisory-council',
    description: 'Tech health data for advisory analysis',
    async pull() {
      const { execSync } = await import('child_process');
      try {
        const out = execSync(`node ${join(SYSTEMS, 'platform-health/health-check.js')} --json`, {
          encoding: 'utf8', timeout: 60000
        });
        return { platformHealth: out };
      } catch (e) {
        return { platformHealth: null, error: e.message };
      }
    }
  }
];

// ── Topic routing for security-related systems ──────────────────────────

export const securitySystems = ['security-council', 'security-safety', 'health-monitoring'];

// ── Helper: pull all pipes for a given target system ────────────────────

export async function pullDataFor(targetSystem) {
  const relevant = pipes.filter(p => p.to === targetSystem);
  const results = {};
  const errors = [];

  await Promise.all(relevant.map(async (pipe) => {
    try {
      const data = await pipe.pull();
      results[pipe.id] = data;
    } catch (e) {
      errors.push({ pipe: pipe.id, error: e.message });
      results[pipe.id] = { error: e.message };
    }
  }));

  return { data: results, errors };
}

// ── Helper: get all pipe definitions ────────────────────────────────────

export function getPipes() {
  return pipes.map(p => ({
    id: p.id,
    from: p.from,
    to: p.to,
    description: p.description
  }));
}

export default { pipes, pullDataFor, getPipes, securitySystems };
