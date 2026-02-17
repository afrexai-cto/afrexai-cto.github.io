#!/usr/bin/env node
'use strict';

const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const DEMO = path.join(ROOT, 'demo');

const commands = {
  status: () => require('./lib/status')(DEMO, ROOT),
  generate: () => require('./lib/generate')(DEMO, ROOT, parseArgs()),
  deliverable: () => require('./lib/deliverable')(DEMO, ROOT, parseArgs()),
  push: () => require('./lib/push')(DEMO, ROOT),
  validate: () => require('./lib/validate')(DEMO, ROOT),
  company: () => require('./lib/company')(DEMO, ROOT, parseArgs()),
};

function parseArgs() {
  const args = process.argv.slice(3);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result[key] = args[++i];
      } else {
        result[key] = true;
      }
    }
  }
  return result;
}

const cmd = process.argv[2];
if (!cmd || !commands[cmd]) {
  console.log(`
AfrexAI Demo Framework CLI

Usage: node cli.js <command> [options]

Commands:
  status                              Show current system state
  generate [--company <id>]           Run activity generator
  deliverable --list                  List all deliverables
  deliverable --company <id> --task <task>  Create pending prompt
  deliverable --add --company <id> --agent <id> --type <type> --file <path>
                                      Add a pre-generated deliverable
  push                                Commit and push to GitHub Pages
  validate                            Run self-validation checks
  company --add --id <id> --name <name> --vertical <v> --tier <t>
                                      Scaffold a new demo company
`);
  process.exit(cmd ? 1 : 0);
}

try {
  commands[cmd]();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
