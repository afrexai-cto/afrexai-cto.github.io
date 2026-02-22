'use strict';

/**
 * Real agent task executor. Calls the LLM API (Anthropic Claude) with
 * actual data from connectors, produces real deliverables, routes to output pipeline.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const db = require('../db');
const metrics = require('../metrics');
const output = require('../output');
const connectors = require('../connectors');
const csv = require('../connectors/csv');

// Cost per token (Claude Sonnet 3.5 pricing approximation)
const INPUT_COST_PER_1K = 0.003;
const OUTPUT_COST_PER_1K = 0.015;

/**
 * Get API key from 1Password or environment
 */
function getApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    return execSync('op read "op://AfrexAI/Anthropic/api_key"', { encoding: 'utf-8' }).trim();
  } catch {
    try {
      // Fallback to vault file
      const envFile = path.join(process.env.HOME, '.openclaw/vault/anthropic.env');
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf-8');
        const match = content.match(/ANTHROPIC_API_KEY=(.+)/);
        if (match) return match[1].trim();
      }
    } catch {}
  }
  return null;
}

/**
 * Call Anthropic Claude API
 */
async function callLLM(systemPrompt, userPrompt, { maxTokens = 2000, model = 'claude-sonnet-4-20250514' } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No ANTHROPIC_API_KEY available');

  const https = require('https');
  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey.startsWith('sk-ant-oat')
          ? { 'Authorization': `Bearer ${apiKey}`, 'anthropic-beta': 'oauth-2025-04-20' }
          : { 'x-api-key': apiKey }),
        'anthropic-version': '2023-06-01',
      },
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const text = parsed.content?.[0]?.text || '';
          resolve({
            text,
            inputTokens: parsed.usage?.input_tokens || 0,
            outputTokens: parsed.usage?.output_tokens || 0,
          });
        } catch (e) {
          reject(new Error(`LLM parse error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Load task definition by ID
 */
function loadTask(taskId) {
  const demoDir = db.getDemoDir();
  const tasksDir = path.join(demoDir, 'agents/tasks');
  for (const file of fs.readdirSync(tasksDir).filter(f => f.endsWith('.json'))) {
    const tasks = JSON.parse(fs.readFileSync(path.join(tasksDir, file), 'utf-8'));
    const found = tasks.find(t => t.id === taskId);
    if (found) return found;
  }
  return null;
}

/**
 * Prepare data for a task — uses real connectors
 */
function prepareTaskData(task) {
  const demoDir = db.getDemoDir();

  if (task.prepare === 'random-row') {
    const rows = csv.parseCSV(path.join(demoDir, task.data_source));
    if (!rows.length) throw new Error(`No data in ${task.data_source}`);
    const row = rows[Math.floor(Math.random() * rows.length)];
    return { data: row, prompt: fillTemplate(task.prompt, row) };
  }

  if (task.prepare === 'full-file') {
    const fp = path.join(demoDir, task.data_source);
    const text = fs.readFileSync(fp, 'utf-8');
    const data = { contract_text: text, brief_text: text, access_log_entries: text };
    return { data, prompt: fillTemplate(task.prompt, data) };
  }

  if (task.prepare === 'merge-patient-appointment') {
    const patients = csv.parseCSV(path.join(demoDir, task.data_sources.patients));
    const appts = csv.parseCSV(path.join(demoDir, task.data_sources.appointments));
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const appt = appts[Math.floor(Math.random() * appts.length)];
    const futureDate = new Date(Date.now() + (3 + Math.floor(Math.random() * 14)) * 86400000);
    const merged = {
      ...appt,
      patient_name: patient.name,
      date: futureDate.toISOString().split('T')[0],
      notes: `Insurance: ${patient.insurance}. Primary: ${patient.primary_physician}`,
    };
    return { data: merged, prompt: fillTemplate(task.prompt, merged) };
  }

  if (task.prepare === 'merge-project-weather') {
    const projects = csv.parseCSV(path.join(demoDir, task.data_sources.projects));
    const weather = csv.parseCSV(path.join(demoDir, task.data_sources.weather));
    const project = projects[Math.floor(Math.random() * projects.length)];
    const wx = weather.length ? weather[Math.floor(Math.random() * weather.length)]
      : { condition: 'clear', high_temp: '55', low_temp: '42', work_impact: 'none' };
    const merged = { ...project, ...wx, date: new Date().toISOString().split('T')[0] };
    return { data: merged, prompt: fillTemplate(task.prompt, merged) };
  }

  // Custom data from connector
  if (task.prepare === 'connector') {
    const rows = connectors.fetchData(task.company, task.dataSourceId);
    if (Array.isArray(rows) && rows.length) {
      const row = rows[Math.floor(Math.random() * rows.length)];
      return { data: row, prompt: fillTemplate(task.prompt, row) };
    }
    throw new Error(`No data from connector ${task.dataSourceId}`);
  }

  throw new Error(`Unknown prepare type: ${task.prepare}`);
}

function fillTemplate(template, data) {
  return template.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? `{${key}}`);
}

/**
 * Execute a task — the main entry point
 */
async function executeTask(taskId, { dryRun = false } = {}) {
  const task = loadTask(taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);

  const startTime = Date.now();
  const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Record start
  db.update(data => {
    if (!data.taskRuns) data.taskRuns = [];
    data.taskRuns.unshift({
      id: runId,
      companyId: task.company,
      taskId: task.id,
      agentId: task.agent,
      agentName: task.agentName,
      status: 'running',
      startedAt: new Date().toISOString(),
    });
    data.taskRuns = data.taskRuns.slice(0, 500);
  });

  try {
    // 1. Prepare data from real sources
    const { data: rowData, prompt } = prepareTaskData(task);

    if (dryRun) {
      db.update(data => {
        const run = data.taskRuns.find(r => r.id === runId);
        if (run) { run.status = 'dry-run'; run.prompt = prompt.slice(0, 500); }
      });
      return { runId, status: 'dry-run', prompt };
    }

    // 2. Call LLM
    const systemPrompt = `You are ${task.agentName}, an AI agent at ${task.companyName}. Produce professional, actionable deliverables. Use markdown formatting. Be specific and detailed.`;
    const result = await callLLM(systemPrompt, prompt);

    // 3. Calculate cost
    const cost = (result.inputTokens / 1000 * INPUT_COST_PER_1K) + (result.outputTokens / 1000 * OUTPUT_COST_PER_1K);
    const durationMs = Date.now() - startTime;

    // 4. Save deliverable
    const demoDir = db.getDemoDir();
    const ts = new Date();
    const delivDir = path.join(demoDir, 'data/deliverables', task.company);
    fs.mkdirSync(delivDir, { recursive: true });

    const slug = ts.toISOString().replace(/[:.]/g, '-').replace(/Z$/, 'Z');
    const filename = `${task.output_type}-${slug}.md`;
    const frontmatter = [
      '---',
      `agent: ${task.agentName}`,
      `company: ${task.companyName}`,
      `task: ${task.output_type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
      `generated: ${ts.toISOString()}`,
      `run_id: ${runId}`,
      `tokens: ${result.inputTokens + result.outputTokens}`,
      `cost: $${cost.toFixed(4)}`,
      `duration_ms: ${durationMs}`,
      '---',
      '',
    ].join('\n');

    const delivPath = path.join(delivDir, filename);
    fs.writeFileSync(delivPath, frontmatter + result.text);

    const artifactPath = `deliverables/${task.company}/${filename}`;
    const action = fillTemplate(task.actionTemplate, rowData);

    // 5. Update database
    db.update(data => {
      // Update run
      const run = data.taskRuns.find(r => r.id === runId);
      if (run) {
        run.status = 'completed';
        run.completedAt = ts.toISOString();
        run.cost = cost;
        run.tokens = result.inputTokens + result.outputTokens;
        run.durationMs = durationMs;
        run.deliverablePath = artifactPath;
      }

      // Update company activity
      const company = data.companies[task.company];
      if (company) {
        company.recentActivity = company.recentActivity || [];
        company.recentActivity.unshift({
          ts: ts.toISOString(),
          agent: task.agent,
          action,
          type: task.activityType,
          artifact: artifactPath,
          real: true,
          runId,
        });
        company.recentActivity = company.recentActivity.slice(0, 50);

        company.kpis.tasksCompleted++;
        const agentObj = company.agents.find(a => a.id === task.agent);
        if (agentObj) {
          agentObj.lastActive = ts.toISOString();
          agentObj.taskCount++;
        }
      }

      // Global activity
      if (!data.recentActivity) data.recentActivity = [];
      data.recentActivity.unshift({
        ts: ts.toISOString(),
        agent: task.agent,
        action,
        type: task.activityType,
        artifact: artifactPath,
        real: true,
        runId,
      });
      data.recentActivity = data.recentActivity.slice(0, 200);
    });

    // 6. Record metrics
    const estimatedHoursSaved = durationMs < 60000 ? 0.25 : 0.5; // conservative estimate
    metrics.recordTask(task.company, {
      tokens: result.inputTokens + result.outputTokens,
      cost,
      durationMs,
      hoursSaved: estimatedHoursSaved,
    });

    // 7. Route to output pipeline
    await output.deliver(task.company, {
      type: task.output_type,
      content: result.text,
      filePath: delivPath,
      artifactPath,
      agentName: task.agentName,
      companyName: task.companyName,
      action,
    });

    return {
      runId,
      status: 'completed',
      deliverablePath: artifactPath,
      cost,
      tokens: result.inputTokens + result.outputTokens,
      durationMs,
    };
  } catch (err) {
    db.update(data => {
      const run = data.taskRuns.find(r => r.id === runId);
      if (run) {
        run.status = 'failed';
        run.error = err.message;
        run.completedAt = new Date().toISOString();
      }
    });
    throw err;
  }
}

/**
 * List all available tasks across all companies
 */
function listTasks(companyId) {
  const demoDir = db.getDemoDir();
  const tasksDir = path.join(demoDir, 'agents/tasks');
  const allTasks = [];
  for (const file of fs.readdirSync(tasksDir).filter(f => f.endsWith('.json'))) {
    const tasks = JSON.parse(fs.readFileSync(path.join(tasksDir, file), 'utf-8'));
    allTasks.push(...tasks);
  }
  if (companyId) return allTasks.filter(t => t.company === companyId);
  return allTasks;
}

module.exports = { executeTask, listTasks, loadTask, callLLM };
