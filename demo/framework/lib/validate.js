'use strict';
const fs = require('fs');
const path = require('path');

module.exports = function validate(DEMO) {
  let errors = 0;
  let warnings = 0;

  function err(msg) { console.error(`  ✗ ${msg}`); errors++; }
  function warn(msg) { console.warn(`  ⚠ ${msg}`); warnings++; }
  function ok(msg) { console.log(`  ✓ ${msg}`); }

  console.log('\n  Validation\n  ──────────\n');

  // 1. activity.json exists and is valid JSON
  const dataFile = path.join(DEMO, 'data/activity.json');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    ok('activity.json is valid JSON');
  } catch (e) {
    err(`activity.json: ${e.message}`);
    return;
  }

  // 2. Required fields
  if (!data.lastUpdated) err('activity.json missing lastUpdated');
  if (!data.companies || !Object.keys(data.companies).length) err('activity.json has no companies');

  // 3. Check each company
  for (const [id, co] of Object.entries(data.companies || {})) {
    if (!co.name) err(`${id}: missing name`);
    if (!co.tier) warn(`${id}: missing tier`);
    if (!co.vertical) warn(`${id}: missing vertical`);
    if (!co.agents || !co.agents.length) err(`${id}: no agents defined`);
    if (!co.kpis) warn(`${id}: missing kpis`);

    // Check agents have required fields
    for (const agent of (co.agents || [])) {
      if (!agent.id || !agent.name) err(`${id}: agent missing id or name`);
    }
  }

  // 4. Check artifact paths resolve
  const allActivities = [
    ...(data.recentActivity || []),
    ...Object.values(data.companies || {}).flatMap(c => c.recentActivity || []),
  ];

  let artifactCount = 0;
  let missingArtifacts = 0;
  for (const a of allActivities) {
    if (!a.artifact) continue;
    artifactCount++;
    const full = path.join(DEMO, 'data', a.artifact);
    if (!fs.existsSync(full)) {
      warn(`Missing artifact: ${a.artifact}`);
      missingArtifacts++;
    }
  }
  if (artifactCount) {
    ok(`${artifactCount - missingArtifacts}/${artifactCount} artifact paths resolve`);
  }

  // 5. Check deliverables have frontmatter
  const delivDir = path.join(DEMO, 'data/deliverables');
  if (fs.existsSync(delivDir)) {
    let checked = 0, noFrontmatter = 0;
    for (const company of fs.readdirSync(delivDir)) {
      const dir = path.join(delivDir, company);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
        checked++;
        const content = fs.readFileSync(path.join(dir, f), 'utf-8');
        if (!content.startsWith('---\n')) {
          warn(`${company}/${f}: missing YAML frontmatter`);
          noFrontmatter++;
        }
      }
    }
    if (checked) ok(`${checked - noFrontmatter}/${checked} deliverables have frontmatter`);
  }

  // 6. Check for orphaned deliverable files (not referenced in activity)
  const referencedArtifacts = new Set(allActivities.filter(a => a.artifact).map(a => a.artifact));
  if (fs.existsSync(delivDir)) {
    let orphaned = 0;
    for (const company of fs.readdirSync(delivDir)) {
      const dir = path.join(delivDir, company);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
        const rel = `deliverables/${company}/${f}`;
        if (!referencedArtifacts.has(rel)) {
          warn(`Orphaned: ${rel}`);
          orphaned++;
        }
      }
    }
    if (!orphaned) ok('No orphaned deliverable files');
  }

  // 7. Task definitions
  const tasksDir = path.join(DEMO, 'agents/tasks');
  if (fs.existsSync(tasksDir)) {
    for (const file of fs.readdirSync(tasksDir).filter(f => f.endsWith('.json'))) {
      try {
        const tasks = JSON.parse(fs.readFileSync(path.join(tasksDir, file), 'utf-8'));
        ok(`${file}: ${tasks.length} tasks valid`);
      } catch (e) {
        err(`${file}: invalid JSON — ${e.message}`);
      }
    }
  }

  console.log(`\n  Result: ${errors} errors, ${warnings} warnings\n`);
  if (errors) process.exit(1);
};
