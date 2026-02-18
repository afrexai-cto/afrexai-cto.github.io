#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getAdminClient, generatePassword } = require('./auth');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

program
  .name('create-agents')
  .description('Batch-create all agent email accounts from config.json')
  .option('--all', 'Create all agents defined in config.json')
  .option('--dry-run', 'Print what would be created without calling the API')
  .option('--ensure-org-unit', 'Create the org unit if it does not exist', true)
  .parse(process.argv);

const opts = program.opts();

if (!opts.all) {
  console.log(chalk.yellow('Use --all to create all agent accounts.'));
  program.help();
}

async function ensureOrgUnit(admin) {
  try {
    await admin.orgunits.get({
      customerId: 'my_customer',
      orgUnitPath: config.orgUnitPath.replace(/^\//, ''),
    });
    console.log(chalk.gray(`  Org unit ${config.orgUnitPath} exists.`));
  } catch (err) {
    if (err.code === 404) {
      console.log(chalk.blue(`  Creating org unit ${config.orgUnitPath}...`));
      const name = config.orgUnitPath.split('/').filter(Boolean).pop();
      await admin.orgunits.insert({
        customerId: 'my_customer',
        requestBody: {
          name,
          parentOrgUnitPath: '/',
        },
      });
      console.log(chalk.green(`  ✅ Org unit created.`));
    } else {
      console.warn(chalk.yellow(`  ⚠️  Could not check org unit: ${err.message}`));
    }
  }
}

async function run() {
  const agents = config.agents;
  console.log(chalk.blue(`\n🚀 Creating ${agents.length} agent accounts on ${config.domain}\n`));

  if (opts.dryRun) {
    console.log(chalk.yellow('DRY RUN MODE\n'));
    for (const agent of agents) {
      const pw = generatePassword();
      console.log(`  ${agent.email} — ${agent.role} (pw: ${pw})`);
    }
    return;
  }

  const admin = getAdminClient(config);

  if (opts.ensureOrgUnit) {
    await ensureOrgUnit(admin);
  }

  const results = { created: [], skipped: [], failed: [] };
  const credentials = [];

  for (const agent of agents) {
    const password = generatePassword();
    try {
      console.log(chalk.blue(`  Creating ${agent.email}...`));
      await admin.users.insert({
        requestBody: {
          primaryEmail: agent.email,
          name: {
            givenName: agent.firstName,
            familyName: agent.lastName,
          },
          password,
          changePasswordAtNextLogin: config.changePasswordAtNextLogin,
          orgUnitPath: config.orgUnitPath,
        },
      });
      console.log(chalk.green(`  ✅ ${agent.email}`));
      results.created.push(agent.email);
      credentials.push({ email: agent.email, password, role: agent.role, createdAt: new Date().toISOString() });
    } catch (err) {
      if (err.code === 409) {
        console.log(chalk.yellow(`  ⚠️  ${agent.email} already exists — skipping`));
        results.skipped.push(agent.email);
      } else {
        console.log(chalk.red(`  ❌ ${agent.email}: ${err.message}`));
        results.failed.push(agent.email);
      }
    }
  }

  // Save credentials
  if (credentials.length > 0) {
    const credsLog = path.join(__dirname, '.created-accounts.json');
    let existing = [];
    if (fs.existsSync(credsLog)) {
      existing = JSON.parse(fs.readFileSync(credsLog, 'utf8'));
    }
    existing.push(...credentials);
    fs.writeFileSync(credsLog, JSON.stringify(existing, null, 2));
  }

  // Summary
  console.log(chalk.blue('\n📊 Summary:'));
  console.log(chalk.green(`  Created: ${results.created.length}`));
  console.log(chalk.yellow(`  Skipped (existing): ${results.skipped.length}`));
  console.log(chalk.red(`  Failed: ${results.failed.length}`));

  if (credentials.length > 0) {
    console.log(chalk.gray(`\n  Credentials saved to .created-accounts.json`));
    console.log(chalk.yellow(`  ⚠️  Store this file securely and delete after use.`));
  }
}

run();
