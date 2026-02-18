'use strict';
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = function generate(DEMO, ROOT, args) {
  const generateScript = path.join(DEMO, 'agents/lib/generate.js');

  if (!fs.existsSync(generateScript)) {
    console.error('Generator script not found:', generateScript);
    process.exit(1);
  }

  const company = args.company;
  console.log(`[framework] Running activity generator${company ? ` for ${company}` : ' for all companies'}...`);

  try {
    execSync(`node "${generateScript}"`, { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    console.error('[framework] Generator failed:', err.message);
    process.exit(1);
  }

  // If company filter specified, verify it exists
  if (company) {
    const dataFile = path.join(DEMO, 'data/activity.json');
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    if (!data.companies[company]) {
      console.warn(`[framework] Warning: company "${company}" not found in activity.json`);
    }
  }

  console.log('[framework] Generation complete.');
};
