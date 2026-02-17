#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const DEMO = path.join(ROOT, 'demo');
const TASKS_DIR = path.join(DEMO, 'agents/tasks');
const PENDING_DIR = path.join(DEMO, 'agents/pending');
const COMPLETED_DIR = path.join(DEMO, 'agents/completed');
const DATA_FILE = path.join(DEMO, 'data/activity.json');
const DELIVERABLES_DIR = path.join(DEMO, 'data/deliverables');
const MAX_DELIVERABLES = 50;

// Ensure directories exist
[PENDING_DIR, COMPLETED_DIR, DELIVERABLES_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function fillTemplate(template, data) {
  return template.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? `{${key}}`);
}

function tsSlug(d) {
  return d.toISOString().replace(/[:.]/g, '-').replace(/Z$/, '');
}

// ---------------------------------------------------------------------------
// Data preparation per task type
// ---------------------------------------------------------------------------

function prepareData(task) {
  if (task.prepare === 'random-row') {
    const rows = parseCSV(path.join(DEMO, task.data_source));
    if (!rows.length) throw new Error(`No data in ${task.data_source}`);
    const row = pick(rows);
    return { promptData: row, prompt: fillTemplate(task.prompt, row), row };
  }

  if (task.prepare === 'full-file') {
    const fp = path.join(DEMO, task.data_source);
    const text = fs.readFileSync(fp, 'utf-8');
    const data = { contract_text: text, brief_text: text, access_log_entries: text };
    return { promptData: data, prompt: fillTemplate(task.prompt, data), row: data };
  }

  if (task.prepare === 'merge-patient-appointment') {
    const patients = parseCSV(path.join(DEMO, task.data_sources.patients));
    const appts = parseCSV(path.join(DEMO, task.data_sources.appointments));
    const patient = pick(patients);
    const appt = pick(appts);
    const now = new Date();
    const futureDate = new Date(now.getTime() + (3 + Math.floor(Math.random() * 14)) * 86400000);
    const merged = {
      ...appt,
      patient_name: patient.name,
      date: futureDate.toISOString().split('T')[0],
      notes: `Insurance: ${patient.insurance}. Primary: ${patient.primary_physician}`,
    };
    return { promptData: merged, prompt: fillTemplate(task.prompt, merged), row: merged };
  }

  if (task.prepare === 'merge-project-weather') {
    const projects = parseCSV(path.join(DEMO, task.data_sources.projects));
    const weather = parseCSV(path.join(DEMO, task.data_sources.weather));
    const project = pick(projects);
    const wx = weather.length ? pick(weather) : { condition: 'clear', high_temp: '55', low_temp: '42', work_impact: 'none' };
    const merged = { ...project, ...wx, date: new Date().toISOString().split('T')[0] };
    return { promptData: merged, prompt: fillTemplate(task.prompt, merged), row: merged };
  }

  throw new Error(`Unknown prepare type: ${task.prepare}`);
}

// ---------------------------------------------------------------------------
// Deliverable management
// ---------------------------------------------------------------------------

function saveDeliverable(company, outputType, agentName, companyName, content, ts) {
  const dir = path.join(DELIVERABLES_DIR, company);
  fs.mkdirSync(dir, { recursive: true });

  const slug = tsSlug(ts);
  const filename = `${outputType}-${slug}.md`;
  const frontmatter = [
    '---',
    `agent: ${agentName}`,
    `company: ${companyName}`,
    `task: ${outputType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
    `generated: ${ts.toISOString()}`,
    '---',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(dir, filename), frontmatter + content);

  // Rotate: keep last MAX_DELIVERABLES
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
  if (files.length > MAX_DELIVERABLES) {
    for (const old of files.slice(0, files.length - MAX_DELIVERABLES)) {
      fs.unlinkSync(path.join(dir, old));
    }
  }

  return `deliverables/${company}/${filename}`;
}

function updateActivity(agent, action, activityType, artifactPath, ts) {
  let data = {};
  if (fs.existsSync(DATA_FILE)) {
    try { data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); } catch {}
  }
  if (!data.recentActivity) data.recentActivity = [];

  data.recentActivity.unshift({
    ts: ts.toISOString(),
    agent,
    action,
    type: activityType,
    artifact: artifactPath,
    real: true,
  });

  data.recentActivity = data.recentActivity.slice(0, 200);
  data.lastUpdated = ts.toISOString();

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// Mode: --generate  (Part A: pick tasks, write .prompt files)
// ---------------------------------------------------------------------------

function modeGenerate() {
  console.log('[real-agent-runner] --generate: Creating pending prompts...');

  const allTasks = [];
  for (const file of fs.readdirSync(TASKS_DIR).filter(f => f.endsWith('.json'))) {
    const tasks = JSON.parse(fs.readFileSync(path.join(TASKS_DIR, file), 'utf-8'));
    allTasks.push(...tasks);
  }

  console.log(`[real-agent-runner] Loaded ${allTasks.length} task definitions`);

  const count = 1 + Math.floor(Math.random() * 2);
  const shuffled = [...allTasks].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  for (const task of selected) {
    const ts = new Date();
    try {
      const { prompt, row } = prepareData(task);
      const action = fillTemplate(task.actionTemplate, row);

      const metadata = {
        company: task.company,
        companyName: task.companyName,
        agent: task.agent,
        agentName: task.agentName,
        outputType: task.output_type,
        activityType: task.activityType,
        action,
        createdAt: ts.toISOString(),
      };

      const fileContent = `---METADATA---\n${JSON.stringify(metadata, null, 2)}\n---PROMPT---\n${prompt}`;
      const filename = `${tsSlug(ts)}-${task.id}.prompt`;
      fs.writeFileSync(path.join(PENDING_DIR, filename), fileContent);
      console.log(`[real-agent-runner] Created: pending/${filename}`);
    } catch (err) {
      console.error(`[real-agent-runner] Error preparing ${task.id}:`, err.message);
    }
  }
}

// ---------------------------------------------------------------------------
// Mode: --process  (Part B: move completed deliverables into activity.json)
// ---------------------------------------------------------------------------

function modeProcess() {
  console.log('[real-agent-runner] --process: Checking for completed deliverables...');

  const doneFiles = fs.readdirSync(COMPLETED_DIR).filter(f => f.endsWith('.done'));
  if (!doneFiles.length) {
    console.log('[real-agent-runner] No completed deliverables found.');
    return;
  }

  for (const file of doneFiles) {
    try {
      const raw = fs.readFileSync(path.join(COMPLETED_DIR, file), 'utf-8');
      const metaMatch = raw.match(/---METADATA---\n([\s\S]*?)\n---CONTENT---\n([\s\S]*)/);
      if (!metaMatch) {
        console.error(`[real-agent-runner] Bad format in ${file}, skipping`);
        continue;
      }

      const meta = JSON.parse(metaMatch[1]);
      const content = metaMatch[2];
      const ts = new Date();

      const artifactPath = saveDeliverable(
        meta.company, meta.outputType, meta.agentName, meta.companyName, content, ts
      );
      updateActivity(meta.agent, meta.action, meta.activityType, artifactPath, ts);

      fs.unlinkSync(path.join(COMPLETED_DIR, file));
      console.log(`[real-agent-runner] Processed: ${file} -> ${artifactPath}`);
    } catch (err) {
      console.error(`[real-agent-runner] Error processing ${file}:`, err.message);
    }
  }
}

// ---------------------------------------------------------------------------
// Mode: --direct  (pipe content from stdin, save as deliverable)
// Usage: echo "content" | node real-agent-runner.js --direct --company X --agent Y --type Z
// ---------------------------------------------------------------------------

function modeDirect() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
  };

  const company = getArg('company');
  const agent = getArg('agent');
  const type = getArg('type');
  const action = getArg('action') || `Generated ${(type || 'deliverable').replace(/-/g, ' ')}`;
  const activityType = getArg('activity-type') || 'documentation';
  const companyName = getArg('company-name') || company;
  const agentName = getArg('agent-name') || agent;

  if (!company || !agent || !type) {
    console.error('Usage: ... | node real-agent-runner.js --direct --company X --agent Y --type Z [--action "..." --activity-type "..." --company-name "..." --agent-name "..."]');
    process.exit(1);
  }

  const content = fs.readFileSync(0, 'utf-8'); // read stdin
  if (!content.trim()) {
    console.error('[real-agent-runner] --direct: No content on stdin');
    process.exit(1);
  }

  const ts = new Date();
  const artifactPath = saveDeliverable(company, type, agentName, companyName, content, ts);
  updateActivity(agent, action, activityType, artifactPath, ts);
  console.log(`[real-agent-runner] --direct: Saved ${artifactPath}`);
}

// ---------------------------------------------------------------------------
// Main dispatch
// ---------------------------------------------------------------------------

const mode = process.argv[2];

if (mode === '--generate') {
  modeGenerate();
} else if (mode === '--process') {
  modeProcess();
} else if (mode === '--direct') {
  modeDirect();
} else {
  console.log('Usage: node real-agent-runner.js [--generate | --process | --direct ...]');
  console.log('  --generate              Pick random tasks, write .prompt files to pending/');
  console.log('  --process               Move completed .done files into deliverables + activity.json');
  console.log('  --direct --company X --agent Y --type Z   Read stdin, save as deliverable');
  process.exit(1);
}
