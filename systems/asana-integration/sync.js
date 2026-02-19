#!/usr/bin/env node
/**
 * sync.js — Sync Asana workspace data locally and export for advisory council.
 * 
 * Usage: node sync.js [--mock]
 * 
 * Pulls all projects and their tasks, stores as JSON.
 * Exports structured status data for advisory council consumption.
 */

const fs = require('fs');
const path = require('path');
const AsanaClient = require('./asana-client');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const DATA_DIR = path.resolve(__dirname, config.sync.outputDir || './data');
const EXPORT_FILE = path.resolve(__dirname, config.sync.exportFile || './data/advisory-council-export.json');

// ── Mock data for testing without API access ──
function getMockData() {
  return {
    workspace: { gid: 'ws_mock_001', name: 'Creator Studio' },
    projects: [
      {
        gid: 'proj_001', name: 'Video Pipeline', archived: false,
        sections: [
          { gid: 'sec_001', name: 'Inbox' },
          { gid: 'sec_002', name: 'Research' },
          { gid: 'sec_003', name: 'Scripting' },
          { gid: 'sec_004', name: 'Production' },
          { gid: 'sec_005', name: 'Published' },
        ],
        tasks: [
          {
            gid: 'task_001', name: 'AI Agents Explained — Deep Dive',
            completed: false, due_on: '2026-03-01',
            notes: 'Research angles:\n- History of AI agents\n- Current landscape\n- Where we\'re headed\n\nSources:\n- Anthropic blog\n- OpenAI docs\n- Academic papers',
            assignee: { name: 'Kalin' },
            section: 'Research',
            created_at: '2026-02-10T10:00:00Z',
            modified_at: '2026-02-18T15:30:00Z',
          },
          {
            gid: 'task_002', name: 'Why Everyone\'s Wrong About AGI',
            completed: false, due_on: '2026-03-15',
            notes: 'Contrarian take on AGI timelines.\n\nAngles:\n- Overhyped predictions\n- What "general" actually means\n- Hardware bottlenecks',
            assignee: { name: 'Kalin' },
            section: 'Inbox',
            created_at: '2026-02-15T09:00:00Z',
            modified_at: '2026-02-17T11:00:00Z',
          },
          {
            gid: 'task_003', name: 'Building a Second Brain with AI Tools',
            completed: false, due_on: '2026-02-25',
            notes: 'Practical tutorial format.\n\nSources:\n- Tiago Forte\'s methodology\n- Notion/Obsidian workflows\n- AI-augmented PKM',
            assignee: { name: 'Kalin' },
            section: 'Scripting',
            created_at: '2026-02-01T08:00:00Z',
            modified_at: '2026-02-19T01:00:00Z',
          },
          {
            gid: 'task_004', name: 'The Creator Economy is Broken',
            completed: true, due_on: '2026-02-10',
            notes: 'Published Feb 10. Strong performance.',
            assignee: { name: 'Kalin' },
            section: 'Published',
            created_at: '2026-01-20T10:00:00Z',
            modified_at: '2026-02-10T18:00:00Z',
          },
        ],
      },
      {
        gid: 'proj_002', name: 'Channel Operations', archived: false,
        sections: [{ gid: 'sec_010', name: 'Tasks' }],
        tasks: [
          {
            gid: 'task_010', name: 'Update channel branding',
            completed: false, due_on: '2026-03-01',
            notes: 'New colour palette and thumbnails',
            assignee: null,
            section: 'Tasks',
            created_at: '2026-02-18T12:00:00Z',
            modified_at: '2026-02-18T12:00:00Z',
          },
        ],
      },
    ],
  };
}

// ── Live sync ──
async function syncLive(client) {
  const wsGid = await client.resolveWorkspace();
  const workspaces = await client.getWorkspaces();
  const workspace = workspaces.find(w => w.gid === wsGid) || workspaces[0];

  const projects = await client.getProjects(wsGid);
  const result = { workspace: { gid: wsGid, name: workspace.name }, projects: [] };

  for (const proj of projects) {
    if (proj.archived) continue;
    const sections = await client.getSections(proj.gid);
    const tasks = await client.getTasksForProject(proj.gid);

    const enrichedTasks = tasks.map(t => ({
      gid: t.gid,
      name: t.name,
      completed: t.completed,
      due_on: t.due_on,
      notes: t.notes || '',
      assignee: t.assignee,
      section: t.memberships?.[0]?.section?.name || 'Uncategorized',
      created_at: t.created_at,
      modified_at: t.modified_at,
    }));

    result.projects.push({
      gid: proj.gid,
      name: proj.name,
      archived: proj.archived,
      sections: sections.map(s => ({ gid: s.gid, name: s.name })),
      tasks: enrichedTasks,
    });
  }

  return result;
}

// ── Export for advisory council ──
function buildAdvisoryExport(data) {
  const now = new Date().toISOString();
  const pipelineProject = data.projects.find(p => p.name === config.asana.defaultProjectName);

  const summary = {
    exportedAt: now,
    workspace: data.workspace.name,
    totalProjects: data.projects.length,
    totalTasks: data.projects.reduce((sum, p) => sum + p.tasks.length, 0),
    completedTasks: data.projects.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0),
    projects: data.projects.map(p => ({
      name: p.name,
      taskCount: p.tasks.length,
      completedCount: p.tasks.filter(t => t.completed).length,
      overdue: p.tasks.filter(t => !t.completed && t.due_on && new Date(t.due_on) < new Date()).length,
    })),
  };

  if (pipelineProject) {
    const sectionCounts = {};
    for (const t of pipelineProject.tasks) {
      const sec = t.section || 'Uncategorized';
      sectionCounts[sec] = (sectionCounts[sec] || 0) + 1;
    }
    summary.pipeline = {
      projectName: pipelineProject.name,
      sectionBreakdown: sectionCounts,
      upcomingDeadlines: pipelineProject.tasks
        .filter(t => !t.completed && t.due_on)
        .sort((a, b) => new Date(a.due_on) - new Date(b.due_on))
        .slice(0, 5)
        .map(t => ({ name: t.name, due: t.due_on, section: t.section })),
      cards: pipelineProject.tasks.map(t => ({
        gid: t.gid,
        title: t.name,
        status: t.completed ? 'completed' : t.section,
        due: t.due_on,
        assignee: t.assignee?.name || null,
        lastModified: t.modified_at,
      })),
    };
  }

  return summary;
}

// ── Main ──
async function main() {
  const useMock = process.argv.includes('--mock');

  console.log(`🔄 Asana Sync — ${useMock ? 'MOCK MODE' : 'LIVE MODE'}`);
  console.log(`   ${new Date().toISOString()}\n`);

  fs.mkdirSync(DATA_DIR, { recursive: true });

  let data;
  if (useMock) {
    data = getMockData();
    console.log('📦 Using mock data');
  } else {
    const client = new AsanaClient();
    data = await syncLive(client);
    console.log(`📡 Fetched from workspace: ${data.workspace.name}`);
  }

  // Save raw sync data
  const syncFile = path.join(DATA_DIR, 'sync-latest.json');
  fs.writeFileSync(syncFile, JSON.stringify(data, null, 2));
  console.log(`💾 Saved sync data → ${syncFile}`);

  // Build and save advisory council export
  const advisory = buildAdvisoryExport(data);
  fs.writeFileSync(EXPORT_FILE, JSON.stringify(advisory, null, 2));
  console.log(`📊 Advisory export → ${EXPORT_FILE}`);

  // Summary
  console.log(`\n── Summary ──`);
  console.log(`   Projects: ${data.projects.length}`);
  console.log(`   Total tasks: ${advisory.totalTasks}`);
  console.log(`   Completed: ${advisory.completedTasks}`);
  if (advisory.pipeline) {
    console.log(`   Pipeline sections: ${JSON.stringify(advisory.pipeline.sectionBreakdown)}`);
  }
  console.log('\n✅ Sync complete');
}

main().catch(err => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
