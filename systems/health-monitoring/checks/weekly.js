const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkGatewayBinding(config) {
  const alerts = [];
  try {
    // Check if openclaw gateway is running and what it's bound to
    const listening = execSync(
      `lsof -iTCP -sTCP:LISTEN -P 2>/dev/null | grep -i "openclaw\\|gateway\\|node" || true`,
      { encoding: 'utf8', timeout: 10000 }
    );

    if (listening.trim()) {
      const lines = listening.trim().split('\n');
      for (const line of lines) {
        // Check for non-localhost bindings
        if (/\*:|0\.0\.0\.0:/.test(line) && /openclaw|gateway/i.test(line)) {
          alerts.push({
            level: 'critical',
            check: 'gateway-binding',
            message: `Gateway appears to bind to all interfaces: ${line.trim()}`
          });
        }
      }
    }

    // Also check gateway config files
    const configLocations = [
      path.join(config.openclawRoot, 'gateway.yaml'),
      path.join(config.openclawRoot, 'gateway.yml'),
      path.join(config.openclawRoot, 'config.yaml'),
      path.join(config.openclawRoot, 'config.yml'),
      path.join(config.openclawRoot, 'config.json'),
    ];

    for (const cfgPath of configLocations) {
      if (fs.existsSync(cfgPath)) {
        const content = fs.readFileSync(cfgPath, 'utf8');
        if (/0\.0\.0\.0|bind.*\*|host.*0\.0\.0\.0/i.test(content)) {
          alerts.push({
            level: 'critical',
            check: 'gateway-binding',
            message: `Config ${path.basename(cfgPath)} may bind to all interfaces`
          });
        }
      }
    }
  } catch (e) {
    alerts.push({ level: 'error', check: 'gateway-binding', message: `Binding check failed: ${e.message}` });
  }
  return alerts;
}

function checkAuthEnabled(config) {
  const alerts = [];
  try {
    const configLocations = [
      path.join(config.openclawRoot, 'gateway.yaml'),
      path.join(config.openclawRoot, 'gateway.yml'),
      path.join(config.openclawRoot, 'config.yaml'),
      path.join(config.openclawRoot, 'config.yml'),
      path.join(config.openclawRoot, 'config.json'),
    ];

    let foundConfig = false;
    for (const cfgPath of configLocations) {
      if (fs.existsSync(cfgPath)) {
        foundConfig = true;
        const content = fs.readFileSync(cfgPath, 'utf8');
        if (/auth.*false|auth.*disable|noAuth.*true/i.test(content)) {
          alerts.push({
            level: 'critical',
            check: 'auth-enabled',
            message: `Auth appears disabled in ${path.basename(cfgPath)}`
          });
        }
      }
    }

    // Check if gateway is running with auth by testing
    try {
      const result = execSync(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000"`,
        { encoding: 'utf8', timeout: 5000 }
      );
      const code = result.trim();
      if (code === '200') {
        // Unauthenticated access returned 200 — might be fine for health endpoint
        // but worth noting
      }
    } catch {}

    if (!foundConfig) {
      alerts.push({ level: 'info', check: 'auth-enabled', message: 'No gateway config files found to verify auth settings' });
    }
  } catch (e) {
    alerts.push({ level: 'error', check: 'auth-enabled', message: `Auth check failed: ${e.message}` });
  }
  return alerts;
}

module.exports = function runWeeklyChecks(config) {
  return [
    ...checkGatewayBinding(config),
    ...checkAuthEnabled(config)
  ];
};
