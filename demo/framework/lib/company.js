'use strict';
const fs = require('fs');
const path = require('path');

module.exports = function company(DEMO, ROOT, args) {
  if (!args.add) {
    console.error('Usage: company --add --id <id> --name <name> --vertical <vertical> --tier <tier>');
    process.exit(1);
  }

  if (!args.id || !args.name) {
    console.error('Required: --id and --name');
    process.exit(1);
  }

  const id = args.id;
  const name = args.name;
  const vertical = args.vertical || 'general';
  const tier = args.tier || 'starter';

  console.log(`[framework] Scaffolding company: ${name} (${id})\n`);

  // 1. Create sample-data directory
  const sampleDir = path.join(DEMO, 'sample-data', id);
  fs.mkdirSync(sampleDir, { recursive: true });

  // Create placeholder CSV
  const placeholderCSV = 'name,type,status\nExample Item,default,active\n';
  fs.writeFileSync(path.join(sampleDir, 'data.csv'), placeholderCSV);
  console.log(`  Created: sample-data/${id}/data.csv`);

  // 2. Create task definition
  const tasksDir = path.join(DEMO, 'agents/tasks');
  fs.mkdirSync(tasksDir, { recursive: true });

  const defaultAgent = `${id}-assistant`;
  const tasks = [
    {
      id: `${id}-general-task`,
      company: id,
      companyName: name,
      agent: defaultAgent,
      agentName: `${name} Assistant`,
      prompt: `You are an AI assistant for ${name}. Process the following task.\n\n{name}: {type} — Status: {status}\n\nProduce a professional summary.`,
      data_source: `sample-data/${id}/data.csv`,
      prepare: 'random-row',
      output_type: 'task-summary',
      output_format: 'markdown',
      actionTemplate: `Processed task for {name}`,
      activityType: 'documentation',
    },
  ];

  fs.writeFileSync(path.join(tasksDir, `${id}-tasks.json`), JSON.stringify(tasks, null, 2));
  console.log(`  Created: agents/tasks/${id}-tasks.json`);

  // 3. Create deliverables directory
  const delivDir = path.join(DEMO, 'data/deliverables', id);
  fs.mkdirSync(delivDir, { recursive: true });
  console.log(`  Created: data/deliverables/${id}/`);

  // 4. Add to activity.json
  const dataFile = path.join(DEMO, 'data/activity.json');
  let data = {};
  try { data = JSON.parse(fs.readFileSync(dataFile, 'utf-8')); } catch {}
  if (!data.companies) data.companies = {};

  if (data.companies[id]) {
    console.warn(`  ⚠ Company "${id}" already exists in activity.json — skipping`);
  } else {
    data.companies[id] = {
      name,
      tier,
      vertical,
      kpis: {
        tasksCompleted: 0,
        hoursSaved: 0,
        accuracyRate: 0,
        activeSince: new Date().toISOString().split('T')[0],
      },
      agents: [
        {
          id: defaultAgent,
          name: `${name} Assistant`,
          status: 'active',
          lastActive: new Date().toISOString(),
          taskCount: 0,
        },
      ],
      recentActivity: [],
    };

    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    console.log(`  Added to activity.json`);
  }

  console.log(`\n[framework] Company "${name}" scaffolded successfully.`);
  console.log(`\nNext steps:`);
  console.log(`  1. Add real data to sample-data/${id}/`);
  console.log(`  2. Edit agents/tasks/${id}-tasks.json with actual task definitions`);
  console.log(`  3. Run: node cli.js generate --company ${id}`);
};
