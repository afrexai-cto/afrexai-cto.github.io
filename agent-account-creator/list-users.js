#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getAdminClient } = require('./auth');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

async function list() {
  const admin = getAdminClient(config);
  const res = await admin.users.list({
    domain: config.domain,
    maxResults: 100,
    orderBy: 'email',
  });

  console.log(chalk.blue(`\n📋 Users on ${config.domain}:\n`));
  for (const user of res.data.users || []) {
    const status = user.suspended ? chalk.red('suspended') : chalk.green('active');
    console.log(`  ${user.primaryEmail} — ${user.name?.fullName} [${status}]`);
  }
  console.log(chalk.gray(`\nTotal: ${res.data.users?.length || 0}`));
}

list().catch(err => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
