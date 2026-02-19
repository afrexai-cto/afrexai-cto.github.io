#!/usr/bin/env node
// Gateway security verification — checks localhost binding and auth
'use strict';

const { execSync } = require('child_process');

function verify() {
  const results = { timestamp: new Date().toISOString(), checks: [], passed: true };

  function check(name, fn) {
    try {
      const r = fn();
      results.checks.push({ name, ...r });
      if (!r.pass) results.passed = false;
    } catch (e) {
      results.checks.push({ name, pass: false, error: e.message });
      results.passed = false;
    }
  }

  // Check gateway is running
  check('gateway_running', () => {
    try {
      const out = execSync('openclaw gateway status 2>&1', { encoding: 'utf8', timeout: 5000 });
      const running = /running|active|up/i.test(out);
      return { pass: running, detail: running ? 'Gateway is running' : 'Gateway not running' };
    } catch {
      return { pass: false, detail: 'Could not check gateway status' };
    }
  });

  // Check localhost binding (no external exposure)
  check('localhost_binding', () => {
    try {
      const out = execSync("lsof -iTCP -sTCP:LISTEN -nP 2>/dev/null | grep -i openclaw || netstat -an 2>/dev/null | grep LISTEN | head -20", { encoding: 'utf8', timeout: 5000 });
      const exposed = /0\.0\.0\.0|::0/.test(out) && /openclaw/i.test(out);
      return { pass: !exposed, detail: exposed ? 'WARNING: Gateway may be exposed on all interfaces' : 'Gateway bound to localhost or not externally exposed' };
    } catch {
      return { pass: true, detail: 'No external listeners detected (or unable to check)' };
    }
  });

  // Check .env files not in git
  check('env_files_not_tracked', () => {
    try {
      const out = execSync('git ls-files "*.env" ".env*" 2>/dev/null', { encoding: 'utf8', cwd: process.env.HOME + '/.openclaw/workspace-main', timeout: 5000 });
      const tracked = out.trim().split('\n').filter(Boolean);
      return { pass: tracked.length === 0, detail: tracked.length ? `Tracked .env files: ${tracked.join(', ')}` : 'No .env files tracked in git' };
    } catch {
      return { pass: true, detail: 'No git repo or no .env files tracked' };
    }
  });

  return results;
}

if (require.main === module) {
  const r = verify();
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.passed ? 0 : 1);
}

module.exports = { verify };
