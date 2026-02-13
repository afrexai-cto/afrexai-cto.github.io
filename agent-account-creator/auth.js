const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Create an authenticated Admin SDK client using a service account
 * with domain-wide delegation.
 */
function getAdminClient(config) {
  const credPath = path.resolve(__dirname, config.credentialsFile);

  if (!fs.existsSync(credPath)) {
    throw new Error(
      `Credentials file not found: ${credPath}\n` +
      `Download your service account key JSON and save it as credentials.json\n` +
      `See setup-guide.md for instructions.`
    );
  }

  const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.user',
      'https://www.googleapis.com/auth/admin.directory.orgunit',
    ],
    subject: config.adminEmail, // impersonate the admin
  });

  return google.admin({ version: 'directory_v1', auth });
}

/**
 * Generate a secure random password.
 */
function generatePassword(length = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

module.exports = { getAdminClient, generatePassword };
