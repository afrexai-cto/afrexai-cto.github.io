// HubSpot CRM API v3 Client
// Docs: https://developers.hubspot.com/docs/reference/api
const config = require('../config.json');
const { upsert, logSync } = require('../db');

const BASE = config.hubspot.baseUrl;
const HEADERS = {
  'Authorization': `Bearer ${config.hubspot.apiKey}`,
  'Content-Type': 'application/json',
};

const MOCK = {
  deals: [
    { id: 'deal_001', properties: { dealname: 'Enterprise License - Acme Corp', dealstage: 'contractsent', pipeline: 'default', amount: '48000', closedate: '2026-03-15T00:00:00Z', hubspot_owner_id: 'owner_1', hs_is_closed: 'false', createdate: '2026-01-10T00:00:00Z', hs_lastmodifieddate: '2026-02-15T00:00:00Z' }},
    { id: 'deal_002', properties: { dealname: 'Startup Plan - Beta Inc', dealstage: 'qualifiedtobuy', pipeline: 'default', amount: '12000', closedate: '2026-04-01T00:00:00Z', hubspot_owner_id: 'owner_1', hs_is_closed: 'false', createdate: '2026-02-01T00:00:00Z', hs_lastmodifieddate: '2026-02-18T00:00:00Z' }},
    { id: 'deal_003', properties: { dealname: 'Consulting - Gamma Ltd', dealstage: 'closedwon', pipeline: 'default', amount: '25000', closedate: '2026-01-20T00:00:00Z', hubspot_owner_id: 'owner_2', hs_is_closed: 'true', createdate: '2025-11-05T00:00:00Z', hs_lastmodifieddate: '2026-01-20T00:00:00Z' }},
    { id: 'deal_004', properties: { dealname: 'Annual Subscription - Delta Co', dealstage: 'presentationscheduled', pipeline: 'default', amount: '36000', closedate: '2026-05-01T00:00:00Z', hubspot_owner_id: 'owner_1', hs_is_closed: 'false', createdate: '2026-02-10T00:00:00Z', hs_lastmodifieddate: '2026-02-17T00:00:00Z' }},
  ],
  contacts: [
    { id: 'ct_001', properties: { email: 'john@acme.com', firstname: 'John', lastname: 'Smith', company: 'Acme Corp', lifecyclestage: 'customer', hs_lead_status: 'OPEN', createdate: '2025-10-01T00:00:00Z', lastmodifieddate: '2026-02-10T00:00:00Z' }},
    { id: 'ct_002', properties: { email: 'sarah@beta.io', firstname: 'Sarah', lastname: 'Johnson', company: 'Beta Inc', lifecyclestage: 'opportunity', hs_lead_status: 'IN_PROGRESS', createdate: '2026-01-15T00:00:00Z', lastmodifieddate: '2026-02-18T00:00:00Z' }},
    { id: 'ct_003', properties: { email: 'mike@gamma.co', firstname: 'Mike', lastname: 'Williams', company: 'Gamma Ltd', lifecyclestage: 'customer', hs_lead_status: 'OPEN', createdate: '2025-11-01T00:00:00Z', lastmodifieddate: '2026-01-20T00:00:00Z' }},
    { id: 'ct_004', properties: { email: 'lisa@delta.com', firstname: 'Lisa', lastname: 'Brown', company: 'Delta Co', lifecyclestage: 'lead', hs_lead_status: 'NEW', createdate: '2026-02-10T00:00:00Z', lastmodifieddate: '2026-02-17T00:00:00Z' }},
  ],
  pipelines: [
    { id: 'default', label: 'Sales Pipeline', displayOrder: 0, stages: [
      { id: 'appointmentscheduled', label: 'Appointment Scheduled', displayOrder: 0 },
      { id: 'qualifiedtobuy', label: 'Qualified to Buy', displayOrder: 1 },
      { id: 'presentationscheduled', label: 'Presentation Scheduled', displayOrder: 2 },
      { id: 'decisionmakerboughtin', label: 'Decision Maker Bought-In', displayOrder: 3 },
      { id: 'contractsent', label: 'Contract Sent', displayOrder: 4 },
      { id: 'closedwon', label: 'Closed Won', displayOrder: 5 },
      { id: 'closedlost', label: 'Closed Lost', displayOrder: 6 },
    ]},
  ],
};

async function apiFetch(endpoint, options = {}) {
  if (config.mock) return null;
  const url = `${BASE}${endpoint}`;
  const res = await fetch(url, { headers: HEADERS, ...options });
  if (!res.ok) throw new Error(`HubSpot API ${res.status}: ${await res.text()}`);
  return res.json();
}

// GET /crm/v3/objects/deals with pagination
async function fetchAllDeals() {
  if (config.mock) return MOCK.deals;
  let all = [], after;
  while (true) {
    const params = new URLSearchParams({
      limit: '100',
      properties: 'dealname,dealstage,pipeline,amount,closedate,hubspot_owner_id,hs_is_closed,createdate,hs_lastmodifieddate',
    });
    if (after) params.set('after', after);
    const data = await apiFetch(`/crm/v3/objects/deals?${params}`);
    all.push(...(data.results || []));
    after = data.paging?.next?.after;
    if (!after) break;
  }
  return all;
}

// GET /crm/v3/objects/contacts
async function fetchAllContacts() {
  if (config.mock) return MOCK.contacts;
  let all = [], after;
  while (true) {
    const params = new URLSearchParams({
      limit: '100',
      properties: 'email,firstname,lastname,company,lifecyclestage,hs_lead_status,createdate,lastmodifieddate',
    });
    if (after) params.set('after', after);
    const data = await apiFetch(`/crm/v3/objects/contacts?${params}`);
    all.push(...(data.results || []));
    after = data.paging?.next?.after;
    if (!after) break;
  }
  return all;
}

// GET /crm/v3/pipelines/deals
async function fetchPipelines() {
  if (config.mock) return MOCK.pipelines;
  const data = await apiFetch('/crm/v3/pipelines/deals');
  return data.results || [];
}

async function syncDeals() {
  const start = new Date().toISOString();
  try {
    const deals = await fetchAllDeals();
    for (const d of deals) {
      const p = d.properties || d;
      upsert('deals', {
        id: d.id,
        name: p.dealname,
        stage: p.dealstage,
        pipeline: p.pipeline || 'default',
        amount: parseFloat(p.amount) || 0,
        close_date: p.closedate,
        owner_id: p.hubspot_owner_id,
        is_active: p.hs_is_closed === 'true' ? 0 : 1,
        created_at: p.createdate,
        updated_at: p.hs_lastmodifieddate,
        synced_at: new Date().toISOString(),
      });
    }
    logSync('hubspot', 'deals', deals.length, 'success', null, start);
    return deals.length;
  } catch (e) {
    logSync('hubspot', 'deals', 0, 'error', e.message, start);
    throw e;
  }
}

async function syncContacts() {
  const start = new Date().toISOString();
  try {
    const contacts = await fetchAllContacts();
    for (const c of contacts) {
      const p = c.properties || c;
      upsert('contacts', {
        id: c.id,
        email: p.email,
        first_name: p.firstname,
        last_name: p.lastname,
        company: p.company,
        lifecycle_stage: p.lifecyclestage,
        lead_status: p.hs_lead_status,
        created_at: p.createdate,
        updated_at: p.lastmodifieddate,
        synced_at: new Date().toISOString(),
      });
    }
    logSync('hubspot', 'contacts', contacts.length, 'success', null, start);
    return contacts.length;
  } catch (e) {
    logSync('hubspot', 'contacts', 0, 'error', e.message, start);
    throw e;
  }
}

async function syncPipelines() {
  const start = new Date().toISOString();
  try {
    const pipes = await fetchPipelines();
    for (const p of pipes) {
      upsert('pipelines', {
        id: p.id,
        label: p.label,
        display_order: p.displayOrder,
        stages: JSON.stringify(p.stages || []),
        synced_at: new Date().toISOString(),
      });
    }
    logSync('hubspot', 'pipelines', pipes.length, 'success', null, start);
    return pipes.length;
  } catch (e) {
    logSync('hubspot', 'pipelines', 0, 'error', e.message, start);
    throw e;
  }
}

async function syncAll() {
  const deals = await syncDeals();
  const contacts = await syncContacts();
  const pipelines = await syncPipelines();
  return { deals, contacts, pipelines };
}

// Advisory council data feed
function getAdvisoryData() {
  const { query } = require('../db');
  const activeDeals = query(`SELECT COUNT(*) as count, SUM(amount) as total FROM deals WHERE is_active=1`)[0] || {};
  const wonDeals = query(`SELECT COUNT(*) as count, SUM(amount) as total FROM deals WHERE stage='closedwon'`)[0] || {};
  const dealsByStage = query(`SELECT stage, COUNT(*) as count, SUM(amount) as total FROM deals GROUP BY stage ORDER BY count DESC`);
  const contactsByStage = query(`SELECT lifecycle_stage, COUNT(*) as count FROM contacts GROUP BY lifecycle_stage ORDER BY count DESC`);
  const totalContacts = query(`SELECT COUNT(*) as count FROM contacts`)[0]?.count || 0;

  return {
    platform: 'hubspot',
    summary: {
      activeDeals: activeDeals.count || 0,
      activePipelineValue: activeDeals.total || 0,
      wonDeals: wonDeals.count || 0,
      wonValue: wonDeals.total || 0,
      totalContacts,
    },
    dealsByStage,
    contactsByStage,
  };
}

module.exports = { syncAll, syncDeals, syncContacts, syncPipelines, getAdvisoryData };
