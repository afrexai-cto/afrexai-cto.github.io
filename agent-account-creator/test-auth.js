#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getAdminClient } = require('./auth');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

async function test() {
  console.log(chalk.blue('\n🔐 Testing Google Workspace Admin API authentication...\n'));

  try {
    const admin = getAdminClient(config);
    const res = await admin.users.list({
      domain: config.domain,
      maxResults: 5,
      orderBy: 'email',
    });

    console.log(chalk.green('✅ Authentication successful!\n'));
    console.log(chalk.gray(`Found ${res.data.users?.length || 0} users (showing up to 5):`));
    for (const user of res.data.users || []) {
      console.log(chalk.gray(`  - ${user.primaryEmail} (${user.name?.fullName})`));
    }
  } catch (err) {
    console.error(chalk.red('❌ Authentication failed:'), err.message);
    if (err.message.includes('Not Authorized')) {
      console.log(chalk.yellow('\nCommon fixes:'));
      console.log('  1. Ensure domain-wide delegation is enabled for the service account');
      console.log('  2. Ensure the admin email in config.json is a super admin');
      console.log('  3. Check the OAuth scopes in Google Admin Console');
    }
    process.exit(1);
  }
}

test();
