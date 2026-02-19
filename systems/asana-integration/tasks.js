#!/usr/bin/env node
/**
 * tasks.js — CLI for Asana task management.
 * 
 * Usage:
 *   node tasks.js list [--project "Name"] [--section "Name"] [--mock]
 *   node tasks.js create "Title" --project "Video Pipeline" [--section "Research"] [--notes "..."] [--due "2026-03-01"] [--mock]
 *   node tasks.js comment <task-gid> "Comment text" [--mock]
 *   node tasks.js view <task-gid> [--mock]
 *   node tasks.js search "query" [--mock]
 */

const fs = require('fs');
const path = require('path');
const AsanaClient = require('./asana-client');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// ── Arg parsing ──
function parseArgs(argv) {
  const args = { _: [], flags: {} };
  let i = 2; // skip node + script
  while (i < argv.length) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        args.flags[key] = argv[++i];
      } else {
        args.flags[key] = true;
      }
    } else {
      args._.push(argv[i]);
    }
    i++;
  }
  return args;
}

// ── Mock store for testing ──
const MOCK_FILE = path.join(__dirname, 'data', 'sync-latest.json');

function loadMockData() {
  if (!fs.existsSync(MOCK_FILE)) {
    console.error('❌ No sync data found. Run `node sync.js --mock` first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MOCK_FILE, 'utf8'));
}

// ── Commands ──
async function cmdList(args) {
  const useMock = args.flags.mock !== undefined;
  const projectFilter = args.flags.project || config.asana.defaultProjectName;
  const sectionFilter = args.flags.section;

  if (useMock) {
    const data = loadMockData();
    const proj = data.projects.find(p => p.name.toLowerCase() === projectFilter.toLowerCase());
    if (!proj) { console.log(`No project "${projectFilter}" found.`); return; }

    let tasks = proj.tasks;
    if (sectionFilter) {
      tasks = tasks.filter(t => t.section.toLowerCase() === sectionFilter.toLowerCase());
    }

    console.log(`📋 ${proj.name} — ${tasks.length} task(s)\n`);
    for (const t of tasks) {
      const status = t.completed ? '✅' : '⬜';
      const due = t.due_on ? ` (due ${t.due_on})` : '';
      console.log(`  ${status} [${t.gid}] ${t.name}${due} — ${t.section}`);
    }
  } else {
    const client = new AsanaClient();
    await client.resolveWorkspace();
    const proj = await client.findProjectByName(projectFilter);
    if (!proj) { console.log(`No project "${projectFilter}" found.`); return; }

    let tasks = await client.getTasksForProject(proj.gid);
    if (sectionFilter) {
      tasks = tasks.filter(t => {
        const sec = t.memberships?.[0]?.section?.name || '';
        return sec.toLowerCase() === sectionFilter.toLowerCase();
      });
    }

    console.log(`📋 ${proj.name} — ${tasks.length} task(s)\n`);
    for (const t of tasks) {
      const status = t.completed ? '✅' : '⬜';
      const due = t.due_on ? ` (due ${t.due_on})` : '';
      const sec = t.memberships?.[0]?.section?.name || 'Uncategorized';
      console.log(`  ${status} [${t.gid}] ${t.name}${due} — ${sec}`);
    }
  }
}

async function cmdCreate(args) {
  const title = args._[1];
  if (!title) { console.error('Usage: node tasks.js create "Title" --project "Name"'); process.exit(1); }

  const projectName = args.flags.project || config.asana.defaultProjectName;
  const sectionName = args.flags.section;
  const notes = args.flags.notes || '';
  const dueOn = args.flags.due;
  const useMock = args.flags.mock !== undefined;

  if (useMock) {
    const data = loadMockData();
    const proj = data.projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
    if (!proj) { console.log(`No project "${projectName}" found.`); return; }

    const newTask = {
      gid: `task_${Date.now()}`,
      name: title,
      completed: false,
      due_on: dueOn || null,
      notes,
      assignee: null,
      section: sectionName || 'Inbox',
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
    };
    proj.tasks.push(newTask);
    fs.writeFileSync(MOCK_FILE, JSON.stringify(data, null, 2));
    console.log(`✅ Created task [${newTask.gid}]: ${title}`);
    console.log(`   Project: ${proj.name} → Section: ${newTask.section}`);
  } else {
    const client = new AsanaClient();
    await client.resolveWorkspace();
    const proj = await client.findProjectByName(projectName);
    if (!proj) { console.error(`No project "${projectName}" found.`); process.exit(1); }

    let sectionGid;
    if (sectionName) {
      const sec = await client.findSectionByName(proj.gid, sectionName);
      sectionGid = sec?.gid;
    }

    const task = await client.createTask({
      name: title,
      notes,
      projectGid: proj.gid,
      sectionGid,
      dueOn,
    });
    console.log(`✅ Created task [${task.gid}]: ${task.name}`);
  }
}

async function cmdComment(args) {
  const taskGid = args._[1];
  const text = args._[2];
  if (!taskGid || !text) {
    console.error('Usage: node tasks.js comment <task-gid> "Comment text"');
    process.exit(1);
  }

  const useMock = args.flags.mock !== undefined;

  if (useMock) {
    // Simulate adding a comment by appending to a comments file
    const commentsFile = path.join(__dirname, 'data', 'comments.json');
    let comments = [];
    if (fs.existsSync(commentsFile)) {
      comments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
    }
    const comment = {
      gid: `story_${Date.now()}`,
      task_gid: taskGid,
      text,
      type: 'comment',
      created_at: new Date().toISOString(),
      created_by: { name: 'System' },
    };
    comments.push(comment);
    fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2));
    console.log(`💬 Comment added to [${taskGid}]: "${text}"`);
    console.log(`   (History preserved — description untouched)`);
  } else {
    const client = new AsanaClient();
    const story = await client.addComment(taskGid, text);
    console.log(`💬 Comment added [${story.gid}] to task [${taskGid}]`);
  }
}

async function cmdView(args) {
  const taskGid = args._[1];
  if (!taskGid) { console.error('Usage: node tasks.js view <task-gid>'); process.exit(1); }

  const useMock = args.flags.mock !== undefined;

  if (useMock) {
    const data = loadMockData();
    let task;
    for (const p of data.projects) {
      task = p.tasks.find(t => t.gid === taskGid);
      if (task) break;
    }
    if (!task) { console.log(`Task ${taskGid} not found.`); return; }

    console.log(`📌 ${task.name}`);
    console.log(`   GID: ${task.gid}`);
    console.log(`   Section: ${task.section}`);
    console.log(`   Status: ${task.completed ? 'Completed' : 'Open'}`);
    console.log(`   Due: ${task.due_on || 'None'}`);
    console.log(`   Notes:\n${task.notes.split('\n').map(l => '     ' + l).join('\n')}`);

    // Show comments if any
    const commentsFile = path.join(__dirname, 'data', 'comments.json');
    if (fs.existsSync(commentsFile)) {
      const comments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'))
        .filter(c => c.task_gid === taskGid);
      if (comments.length) {
        console.log(`\n   💬 Comments (${comments.length}):`);
        for (const c of comments) {
          console.log(`     [${c.created_at}] ${c.created_by.name}: ${c.text}`);
        }
      }
    }
  } else {
    const client = new AsanaClient();
    const task = await client.getTask(taskGid);
    console.log(`📌 ${task.name}`);
    console.log(`   GID: ${task.gid}`);
    console.log(`   Status: ${task.completed ? 'Completed' : 'Open'}`);
    console.log(`   Due: ${task.due_on || 'None'}`);
    console.log(`   Notes:\n${(task.notes || '').split('\n').map(l => '     ' + l).join('\n')}`);

    const stories = await client.getStories(taskGid);
    const comments = stories.filter(s => s.resource_subtype === 'comment_added');
    if (comments.length) {
      console.log(`\n   💬 Comments (${comments.length}):`);
      for (const c of comments) {
        console.log(`     [${c.created_at}] ${c.created_by?.name}: ${c.text}`);
      }
    }
  }
}

async function cmdSearch(args) {
  const query = args._[1];
  if (!query) { console.error('Usage: node tasks.js search "query"'); process.exit(1); }

  const useMock = args.flags.mock !== undefined;

  if (useMock) {
    const data = loadMockData();
    const q = query.toLowerCase();
    const results = [];
    for (const p of data.projects) {
      for (const t of p.tasks) {
        if (t.name.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q)) {
          results.push({ ...t, project: p.name });
        }
      }
    }
    console.log(`🔍 "${query}" — ${results.length} result(s)\n`);
    for (const r of results) {
      console.log(`  [${r.gid}] ${r.name} (${r.project} → ${r.section})`);
    }
  } else {
    const client = new AsanaClient();
    await client.resolveWorkspace();
    const results = await client.searchTasks(query);
    console.log(`🔍 "${query}" — ${results.length} result(s)\n`);
    for (const t of results) {
      console.log(`  [${t.gid}] ${t.name}${t.completed ? ' ✅' : ''}`);
    }
  }
}

// ── Main ──
async function main() {
  const args = parseArgs(process.argv);
  const command = args._[0];

  switch (command) {
    case 'list': return cmdList(args);
    case 'create': return cmdCreate(args);
    case 'comment': return cmdComment(args);
    case 'view': return cmdView(args);
    case 'search': return cmdSearch(args);
    default:
      console.log(`Asana Task Manager

Usage:
  node tasks.js list [--project "Name"] [--section "Name"] [--mock]
  node tasks.js create "Title" --project "Video Pipeline" [--notes "..."] [--due "2026-03-01"] [--mock]
  node tasks.js comment <task-gid> "Comment text" [--mock]
  node tasks.js view <task-gid> [--mock]
  node tasks.js search "query" [--mock]`);
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
