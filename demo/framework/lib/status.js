'use strict';
const fs = require('fs');
const path = require('path');

module.exports = function status(DEMO) {
  const dataFile = path.join(DEMO, 'data/activity.json');
  if (!fs.existsSync(dataFile)) {
    console.log('No activity.json found. Run "generate" first.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  const updated = new Date(data.lastUpdated);
  const ago = Math.round((Date.now() - updated.getTime()) / 60000);

  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║       AfrexAI Demo System Status             ║`);
  console.log(`╚══════════════════════════════════════════════╝\n`);
  console.log(`Last updated: ${data.lastUpdated} (${ago}m ago)\n`);

  const companies = Object.entries(data.companies || {});
  console.log(`Companies: ${companies.length}\n`);

  for (const [id, co] of companies) {
    const delivDir = path.join(DEMO, 'data/deliverables', id);
    let delivCount = 0;
    try { delivCount = fs.readdirSync(delivDir).filter(f => f.endsWith('.md')).length; } catch {}

    const realCount = (co.recentActivity || []).filter(a => a.real).length;
    const lastAgent = co.agents.reduce((a, b) => a.lastActive > b.lastActive ? a : b);

    console.log(`  ${co.name} [${id}]`);
    console.log(`    Tier: ${co.tier} | Vertical: ${co.vertical}`);
    console.log(`    Tasks: ${co.kpis.tasksCompleted} | Hours saved: ${co.kpis.hoursSaved} | Accuracy: ${co.kpis.accuracyRate}%`);
    console.log(`    Agents: ${co.agents.map(a => `${a.name}(${a.status})`).join(', ')}`);
    console.log(`    Deliverables: ${delivCount} files | Real artifacts: ${realCount}`);
    console.log(`    Last active: ${lastAgent.name} @ ${lastAgent.lastActive}`);
    console.log();
  }

  // Pending prompts
  const pendingDir = path.join(DEMO, 'agents/pending');
  let pending = 0;
  try { pending = fs.readdirSync(pendingDir).filter(f => f.endsWith('.prompt')).length; } catch {}
  console.log(`Pending prompts: ${pending}`);

  // Global recent activity
  const globalRecent = (data.recentActivity || []).slice(0, 5);
  if (globalRecent.length) {
    console.log(`\nRecent global activity:`);
    for (const a of globalRecent) {
      console.log(`  [${a.ts}] ${a.agent}: ${a.action}${a.real ? ' ★' : ''}`);
    }
  }
  console.log();
};
