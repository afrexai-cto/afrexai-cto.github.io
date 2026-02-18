#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getAdminClient, generatePassword } = require('./auth');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

program
  .name('create-agent')
  .description('Create a single agent email account on Google Workspace')
  .requiredOption('--email <email>', 'Email address for the agent (e.g. ea@afrexai.com)')
  .requiredOption('--name <name>', 'Display name / role (e.g. "Executive Assistant")')
  .option('--domain <domain>', 'Google Workspace domain', config.domain)
  .option('--password <password>', 'Set a specific password (otherwise auto-generated)')
  .option('--org-unit <path>', 'Organizational unit path', config.orgUnitPath)
  .option('--first-name <name>', 'First name (derived from --name if omitted)')
  .option('--last-name <name>', 'Last name (derived from --name if omitted)')
  .option('--dry-run', 'Print what would be created without calling the API')
  .parse(process.argv);

const opts = program.opts();

async function createUser() {
  const nameParts = opts.name.split(' ');
  const firstName = opts.firstName || nameParts[0];
  const lastName = opts.lastName || nameParts.slice(1).join(' ') || 'Agent';
  const password = opts.password || config.defaultPassword || generatePassword();

  const userPayload = {
    primaryEmail: opts.email,
    name: {
      givenName: firstName,
      familyName: lastName,
    },
    password,
    changePasswordAtNextLogin: config.changePasswordAtNextLogin,
    orgUnitPath: opts.orgUnit,
  };

  if (opts.dryRun) {
    console.log(chalk.yellow('\n🔍 DRY RUN — would create:\n'));
    console.log(JSON.stringify(userPayload, null, 2));
    console.log(chalk.yellow(`\nPassword: ${password}`));
    return;
  }

  try {
    const admin = getAdminClient(config);

    console.log(chalk.blue(`\nCreating user ${opts.email}...`));

    const res = await admin.users.insert({ requestBody: userPayload });

    console.log(chalk.green(`✅ Created: ${res.data.primaryEmail}`));
    console.log(chalk.gray(`   Name: ${firstName} ${lastName}`));
    console.log(chalk.gray(`   Org Unit: ${opts.orgUnit}`));
    console.log(chalk.gray(`   Password: ${password}`));
    console.log(chalk.yellow(`\n⚠️  Save this password — it won't be shown again.`));

    // Save credentials to a local file for reference
    const credsLog = path.join(__dirname, '.created-accounts.json');
    let existing = [];
    if (fs.existsSync(credsLog)) {
      existing = JSON.parse(fs.readFileSync(credsLog, 'utf8'));
    }
    existing.push({
      email: opts.email,
      password,
      role: opts.name,
      createdAt: new Date().toISOString(),
    });
    fs.writeFileSync(credsLog, JSON.stringify(existing, null, 2));
    console.log(chalk.gray(`   Credentials saved to .created-accounts.json`));

  } catch (err) {
    if (err.code === 409) {
      console.log(chalk.yellow(`⚠️  User ${opts.email} already exists.`));
    } else {
      console.error(chalk.red(`❌ Error creating ${opts.email}:`), err.message);
      if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
      process.exit(1);
    }
  }
}

createUser();
