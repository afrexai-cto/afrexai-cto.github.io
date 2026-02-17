'use strict';
const { execSync } = require('child_process');
const path = require('path');

module.exports = function push(DEMO, ROOT) {
  console.log('[framework] Committing and pushing demo data...\n');

  const cmds = [
    'git add demo/data/',
    'git commit -m "chore: update demo data [automated]" --allow-empty',
    'git push origin main',
  ];

  for (const cmd of cmds) {
    console.log(`$ ${cmd}`);
    try {
      execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
    } catch (err) {
      console.error(`[framework] Command failed: ${cmd}`);
      process.exit(1);
    }
  }

  console.log('\n[framework] Push complete.');
};
