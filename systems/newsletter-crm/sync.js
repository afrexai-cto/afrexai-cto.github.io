#!/usr/bin/env node
// Newsletter & CRM Sync CLI
// Usage: node sync.js [beehiiv|hubspot|all]

const beehiiv = require('./platforms/beehiiv');
const hubspot = require('./platforms/hubspot');

const target = process.argv[2] || 'all';

async function main() {
  console.log(`[sync] Starting sync: ${target}`);
  const t0 = Date.now();

  try {
    if (target === 'beehiiv' || target === 'all') {
      console.log('[sync] Syncing Beehiiv...');
      const r = await beehiiv.syncAll();
      console.log(`  ✓ Subscribers: ${r.subscribers}, Posts: ${r.posts}, Segments: ${r.segments}`);
    }

    if (target === 'hubspot' || target === 'all') {
      console.log('[sync] Syncing HubSpot...');
      const r = await hubspot.syncAll();
      console.log(`  ✓ Deals: ${r.deals}, Contacts: ${r.contacts}, Pipelines: ${r.pipelines}`);
    }

    if (!['beehiiv', 'hubspot', 'all'].includes(target)) {
      console.error(`Unknown target: ${target}. Use: beehiiv, hubspot, or all`);
      process.exit(1);
    }

    console.log(`[sync] Done in ${Date.now() - t0}ms`);
  } catch (e) {
    console.error(`[sync] Error: ${e.message}`);
    process.exit(1);
  }
}

main();
