'use strict';
const fs = require('fs');
const path = require('path');

module.exports = function deliverable(DEMO, ROOT, args) {
  if (args.list) return listDeliverables(DEMO);
  if (args.add) return addDeliverable(DEMO, args);
  if (args.company && args.task) return createPrompt(DEMO, args);

  console.error('Usage:');
  console.error('  deliverable --list');
  console.error('  deliverable --company <id> --task <task-id>');
  console.error('  deliverable --add --company <id> --agent <id> --type <type> --file <path>');
  process.exit(1);
};

function listDeliverables(DEMO) {
  const baseDir = path.join(DEMO, 'data/deliverables');
  if (!fs.existsSync(baseDir)) {
    console.log('No deliverables found.');
    return;
  }

  console.log('\n  Deliverables\n  ────────────\n');

  let total = 0;
  for (const company of fs.readdirSync(baseDir).sort()) {
    const dir = path.join(baseDir, company);
    if (!fs.statSync(dir).isDirectory()) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
    if (!files.length) continue;

    console.log(`  ${company}/ (${files.length} files)`);
    for (const f of files) {
      const stat = fs.statSync(path.join(dir, f));
      const size = stat.size < 1024 ? `${stat.size}B` : `${(stat.size / 1024).toFixed(1)}KB`;
      const date = stat.mtime.toISOString().slice(0, 16);
      console.log(`    ${f}  ${size}  ${date}`);
    }
    total += files.length;
    console.log();
  }
  console.log(`  Total: ${total} deliverables\n`);
}

function createPrompt(DEMO, args) {
  const tasksDir = path.join(DEMO, 'agents/tasks');
  const pendingDir = path.join(DEMO, 'agents/pending');
  fs.mkdirSync(pendingDir, { recursive: true });

  // Find matching task
  let matchedTask = null;
  for (const file of fs.readdirSync(tasksDir).filter(f => f.endsWith('.json'))) {
    const tasks = JSON.parse(fs.readFileSync(path.join(tasksDir, file), 'utf-8'));
    for (const t of tasks) {
      if (t.company === args.company && (t.id === args.task || t.output_type === args.task)) {
        matchedTask = t;
        break;
      }
    }
    if (matchedTask) break;
  }

  if (!matchedTask) {
    console.error(`Task "${args.task}" not found for company "${args.company}".`);
    console.log('\nAvailable tasks:');
    for (const file of fs.readdirSync(tasksDir).filter(f => f.endsWith('.json'))) {
      const tasks = JSON.parse(fs.readFileSync(path.join(tasksDir, file), 'utf-8'));
      for (const t of tasks) {
        console.log(`  ${t.company} / ${t.id} (${t.output_type})`);
      }
    }
    process.exit(1);
  }

  // Write prompt file using real-agent-runner's prepareData logic
  const runner = path.join(DEMO, 'agents/real-agent-runner.js');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').replace(/Z$/, '');
  const filename = `${ts}-${matchedTask.id}.prompt`;

  // Inline prompt generation (simplified — uses the task's prompt template)
  const metadata = {
    company: matchedTask.company,
    companyName: matchedTask.companyName,
    agent: matchedTask.agent,
    agentName: matchedTask.agentName,
    outputType: matchedTask.output_type,
    activityType: matchedTask.activityType,
    action: matchedTask.actionTemplate,
    createdAt: new Date().toISOString(),
  };

  const fileContent = `---METADATA---\n${JSON.stringify(metadata, null, 2)}\n---PROMPT---\n${matchedTask.prompt}`;
  const promptPath = path.join(pendingDir, filename);
  fs.writeFileSync(promptPath, fileContent);

  console.log(`[framework] Created prompt: pending/${filename}`);
  console.log(`\n--- Prompt for agent ---\n`);
  console.log(matchedTask.prompt);
  console.log(`\n--- End prompt ---\n`);
}

function addDeliverable(DEMO, args) {
  if (!args.company || !args.agent || !args.type || !args.file) {
    console.error('Required: --company <id> --agent <id> --type <type> --file <path>');
    process.exit(1);
  }

  if (!fs.existsSync(args.file)) {
    console.error(`File not found: ${args.file}`);
    process.exit(1);
  }

  const content = fs.readFileSync(args.file, 'utf-8');
  const ts = new Date();
  const slug = ts.toISOString().replace(/[:.]/g, '-').replace(/Z$/, '');

  // Read activity.json to get company name
  const dataFile = path.join(DEMO, 'data/activity.json');
  let data = {};
  try { data = JSON.parse(fs.readFileSync(dataFile, 'utf-8')); } catch {}

  const companyData = (data.companies || {})[args.company];
  const companyName = companyData ? companyData.name : args.company;
  const agentName = companyData
    ? (companyData.agents.find(a => a.id === args.agent) || {}).name || args.agent
    : args.agent;

  // Write deliverable with frontmatter
  const dir = path.join(DEMO, 'data/deliverables', args.company);
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${args.type}-${slug}.md`;
  const frontmatter = [
    '---',
    `agent: ${agentName}`,
    `company: ${companyName}`,
    `task: ${args.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
    `generated: ${ts.toISOString()}`,
    '---',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(dir, filename), frontmatter + content);

  // Update activity.json
  const artifactPath = `deliverables/${args.company}/${filename}`;
  if (!data.recentActivity) data.recentActivity = [];
  data.recentActivity.unshift({
    ts: ts.toISOString(),
    agent: args.agent,
    action: `Generated ${args.type.replace(/-/g, ' ')}`,
    type: 'documentation',
    artifact: artifactPath,
    real: true,
  });
  data.recentActivity = data.recentActivity.slice(0, 200);
  data.lastUpdated = ts.toISOString();

  // Update company activity too
  if (companyData) {
    companyData.recentActivity.unshift({
      ts: ts.toISOString(),
      agent: args.agent,
      action: `Generated ${args.type.replace(/-/g, ' ')}`,
      type: 'documentation',
      artifact: artifactPath,
      real: true,
    });
    companyData.recentActivity = companyData.recentActivity.slice(0, 50);
    companyData.kpis.tasksCompleted++;
    const agentObj = companyData.agents.find(a => a.id === args.agent);
    if (agentObj) {
      agentObj.lastActive = ts.toISOString();
      agentObj.taskCount++;
    }
  }

  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  console.log(`[framework] Added deliverable: ${artifactPath}`);
}
