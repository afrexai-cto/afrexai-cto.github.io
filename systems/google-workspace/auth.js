/**
 * auth.js — OAuth2 CLI flow for Google Workspace APIs
 *
 * Credentials loaded from 1Password via `op` CLI.
 * Tokens stored in tokens/token.json (.gitignored).
 *
 * Usage:
 *   node auth.js          # Run interactive OAuth flow
 *   node auth.js status   # Check if authenticated
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const TOKEN_PATH = path.resolve(__dirname, config.tokenPath);
const REDIRECT_PORT = 3891;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth2callback`;

function loadCredentials() {
  try {
    const raw = execSync(`op read "${config.credentialsSource}"`, { encoding: 'utf8' }).trim();
    return JSON.parse(raw);
  } catch {
    console.error('❌ Failed to load credentials from 1Password.');
    console.error(`   Ensure item exists: ${config.credentialsSource}`);
    console.error('   Store your Google OAuth client JSON there.');
    process.exit(1);
  }
}

function createOAuth2Client(creds) {
  const { client_id, client_secret } = creds.installed || creds.web || creds;
  return new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);
}

function loadToken() {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
}

function saveToken(token) {
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), { mode: 0o600 });
}

async function runOAuthFlow(oauth2Client) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: config.scopes,
    prompt: 'consent',
  });

  console.log('\n🔐 Google Workspace OAuth Flow');
  console.log('━'.repeat(50));
  console.log('Opening browser for authorization...\n');

  const open = (await import('open')).default;

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      if (url.pathname !== '/oauth2callback') return;

      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>Authorization denied</h1><p>You can close this tab.</p>');
        server.close();
        reject(new Error(`Auth error: ${error}`));
        return;
      }

      try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        saveToken(tokens);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>✅ Authorized!</h1><p>You can close this tab and return to the terminal.</p>');
        console.log('✅ Authorization successful! Token saved.');
        server.close();
        resolve(oauth2Client);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>Error</h1><p>Token exchange failed.</p>');
        server.close();
        reject(err);
      }
    });

    server.listen(REDIRECT_PORT, () => {
      open(authUrl).catch(() => {
        console.log('Could not open browser. Visit this URL manually:');
        console.log(`\n${authUrl}\n`);
      });
    });
  });
}

/**
 * Get an authenticated OAuth2 client. Used by all other modules.
 * Automatically refreshes expired tokens.
 */
export async function getAuthClient() {
  const creds = loadCredentials();
  const oauth2Client = createOAuth2Client(creds);
  const token = loadToken();

  if (!token) {
    throw new Error('Not authenticated. Run: node auth.js');
  }

  oauth2Client.setCredentials(token);

  // Auto-refresh and save new tokens
  oauth2Client.on('tokens', (newTokens) => {
    const merged = { ...token, ...newTokens };
    saveToken(merged);
  });

  return oauth2Client;
}

// CLI entry point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2];

  if (cmd === 'status') {
    const token = loadToken();
    if (!token) {
      console.log('❌ Not authenticated. Run: node auth.js');
      process.exit(1);
    }
    const expiry = token.expiry_date ? new Date(token.expiry_date) : null;
    console.log('✅ Authenticated');
    if (expiry) console.log(`   Token expires: ${expiry.toISOString()}`);
    console.log(`   Has refresh token: ${!!token.refresh_token}`);
  } else {
    const creds = loadCredentials();
    const oauth2Client = createOAuth2Client(creds);
    await runOAuthFlow(oauth2Client);
  }
}
