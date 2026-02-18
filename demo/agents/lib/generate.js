#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { randomInt } = require('crypto');

// ---------------------------------------------------------------------------
// Paths (relative to repo root = process.cwd())
// ---------------------------------------------------------------------------
const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, 'demo/data/activity.json');
const SAMPLE_DIR = path.join(ROOT, 'demo/sample-data');

// ---------------------------------------------------------------------------
// CSV parser — no deps
// ---------------------------------------------------------------------------
function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pick(arr) { return arr[randomInt(arr.length)]; }
function randFloat(min, max) { return Math.round((min + Math.random() * (max - min)) * 100) / 100; }

function loadCSV(company, file) {
  return parseCSV(path.join(SAMPLE_DIR, company, file));
}

// ---------------------------------------------------------------------------
// Activity generators per company/agent
// ---------------------------------------------------------------------------

function meridianActivity(agent) {
  const patients = loadCSV('meridian-health', 'patients.csv');
  const appts = loadCSV('meridian-health', 'appointments.csv');
  const compliance = loadCSV('meridian-health', 'compliance.csv');
  const records = loadCSV('meridian-health', 'records-requests.csv');

  const p = pick(patients);
  const a = pick(appts);
  const c = pick(compliance);
  const r = pick(records);

  const templates = {
    'patient-coordinator': [
      () => ({ action: `Scheduled ${a.type} appointment for ${p.name} — ${a.specialty}`, type: 'scheduling' }),
      () => ({ action: `Sent appointment reminder to ${p.name}`, type: 'notification' }),
      () => ({ action: `Processed referral from ${p.primary_physician} → ${a.specialty}`, type: 'referral' }),
      () => ({ action: `Updated intake forms for ${p.name}`, type: 'documentation' }),
      () => ({ action: `Confirmed insurance eligibility for ${p.name} (${p.insurance})`, type: 'verification' }),
      () => ({ action: `Rescheduled ${p.name} to ${a.time}`, type: 'scheduling' }),
    ],
    'compliance-officer': [
      () => ({ action: `Completed HIPAA training verification — ${c.staff}`, type: 'compliance' }),
      () => ({ action: `Flagged expired BAA with ${c.vendor}`, type: 'compliance' }),
      () => ({ action: `Generated monthly compliance report`, type: 'reporting' }),
      () => ({ action: `Verified access log audit — ${c.department}`, type: 'audit' }),
      () => ({ action: `Reviewed ${c.staff}'s access to ${c.record_type} — authorized`, type: 'audit' }),
    ],
    'records-analyst': [
      () => ({ action: `Processed records request from ${r.requesting_facility} for ${r.patient_name}`, type: 'records' }),
      () => ({ action: `Flagged incomplete chart for ${p.primary_physician}`, type: 'quality' }),
      () => ({ action: `Archived ${5 + randomInt(20)} inactive patient records`, type: 'maintenance' }),
      () => ({ action: `Sent records to ${r.requesting_facility} via secure transfer`, type: 'records' }),
      () => ({ action: `Completed chart review — ${c.department}`, type: 'quality' }),
    ],
  };

  const t = templates[agent];
  return t ? pick(t)() : { action: 'Processed task', type: 'general' };
}

function pacificActivity(agent) {
  const clients = loadCSV('pacific-legal', 'clients.csv');
  const cal = loadCSV('pacific-legal', 'calendar.csv');
  const followups = loadCSV('pacific-legal', 'follow-ups.csv');

  const cl = pick(clients);
  const ev = pick(cal);
  const fu = pick(followups);

  const templates = {
    'legal-ea': [
      () => ({ action: `Filed motion in ${ev.case_name}`, type: 'filing' }),
      () => ({ action: `Calendared deadline: ${ev.event_type} — ${ev.case_name} on ${ev.date}`, type: 'scheduling' }),
      () => ({ action: `Prepared conference agenda for ${cl.attorney_assigned}`, type: 'preparation' }),
      () => ({ action: `Sent court appearance reminder — ${ev.court_or_location}`, type: 'notification' }),
      () => ({ action: `Scheduled client meeting: ${cl.name} re: ${cl.matter_type}`, type: 'scheduling' }),
    ],
    'document-analyst': [
      () => ({ action: `Reviewed contract for ${cl.name} (${4 + randomInt(20)} pages)`, type: 'review' }),
      () => ({ action: `Flagged non-standard clause in ${fu.matter}`, type: 'review' }),
      () => ({ action: `Summarised deposition transcript — ${ev.case_name}`, type: 'analysis' }),
      () => ({ action: `Completed due diligence review for ${cl.name}`, type: 'review' }),
    ],
    'client-followup': [
      () => ({ action: `Sent case status update to ${cl.name}`, type: 'communication' }),
      () => ({ action: `Scheduled consultation with ${cl.name}`, type: 'scheduling' }),
      () => ({ action: `Followed up on outstanding invoice — ${cl.name}`, type: 'billing' }),
      () => ({ action: `Sent ${fu.priority} reminder: ${fu.action_needed} for ${fu.client_name}`, type: 'follow-up' }),
    ],
  };

  const t = templates[agent];
  return t ? pick(t)() : { action: 'Processed task', type: 'general' };
}

function buildrightActivity(agent) {
  const projects = loadCSV('buildright', 'projects.csv');
  const weather = loadCSV('buildright', 'weather.csv');
  const milestones = loadCSV('buildright', 'milestones.csv');

  const pr = pick(projects);
  const w = pick(weather);
  const ms = pick(milestones);

  const templates = {
    'site-reporter': [
      () => ({ action: `Generated daily report — ${pr.name}`, type: 'reporting' }),
      () => ({ action: `Logged weather delay at ${w.site_name}: ${w.condition} — ${w.work_impact}`, type: 'delay' }),
      () => ({ action: `Updated milestone: ${ms.milestone} at ${pr.name}`, type: 'milestone' }),
      () => ({ action: `Compiled weekly progress summary for ${pr.name}`, type: 'reporting' }),
      () => ({ action: `Flagged schedule variance — ${pr.name} (${pr.status})`, type: 'alert' }),
    ],
  };

  const t = templates[agent];
  return t ? pick(t)() : { action: 'Processed task', type: 'general' };
}

// ---------------------------------------------------------------------------
// NovaCRM (SaaS)
// ---------------------------------------------------------------------------
function novacrmActivity(agent) {
  const customers = loadCSV('novacrm', 'customers.csv');
  const tickets = loadCSV('novacrm', 'tickets.csv');
  const onboarding = loadCSV('novacrm', 'onboarding.csv');

  const cu = pick(customers);
  const tk = pick(tickets);
  const ob = pick(onboarding);

  const templates = {
    'churn-analyst': [
      () => ({ action: `Calculated health score for ${cu.company_name} — ${cu.health_score}/100`, type: 'analysis' }),
      () => ({ action: `Flagged churn risk: ${cu.company_name} (${cu.plan}, $${cu.mrr}/mo) — score dropped below 50`, type: 'alert' }),
      () => ({ action: `Generated weekly churn risk report — ${2 + randomInt(4)} accounts at risk`, type: 'reporting' }),
      () => ({ action: `Detected usage decline at ${cu.company_name} — active users down ${10 + randomInt(40)}%`, type: 'analysis' }),
      () => ({ action: `Triggered re-engagement sequence for ${cu.company_name}`, type: 'automation' }),
    ],
    'onboarding-specialist': [
      () => ({ action: `Advanced ${ob.customer} to ${ob.stage} stage (${ob.progress_pct}% complete)`, type: 'onboarding' }),
      () => ({ action: `Sent onboarding checklist to ${cu.company_name}`, type: 'communication' }),
      () => ({ action: `Scheduled kickoff call with ${cu.company_name} — ${cu.csm_assigned}`, type: 'scheduling' }),
      () => ({ action: `Completed data import for ${ob.customer} — ${1000 + randomInt(5000)} records migrated`, type: 'onboarding' }),
      () => ({ action: `Generated onboarding pipeline status report`, type: 'reporting' }),
    ],
    'support-triage': [
      () => ({ action: `Auto-triaged ticket ${tk.ticket_id}: ${tk.subject} — routed to ${tk.category}`, type: 'triage' }),
      () => ({ action: `Escalated ${tk.priority} priority ticket for ${tk.customer}`, type: 'escalation' }),
      () => ({ action: `Resolved ticket ${tk.ticket_id} — ${tk.category} issue for ${tk.customer}`, type: 'resolution' }),
      () => ({ action: `SLA check: ${tk.ticket_id} — ${tk.sla_hours}h SLA, on track`, type: 'monitoring' }),
      () => ({ action: `Categorised ${3 + randomInt(8)} new tickets — ${2 + randomInt(3)} auto-resolved`, type: 'triage' }),
    ],
  };

  const t = templates[agent];
  return t ? pick(t)() : { action: 'Processed task', type: 'general' };
}

// ---------------------------------------------------------------------------
// Atlas Wealth Advisors (Financial Services)
// ---------------------------------------------------------------------------
function atlasActivity(agent) {
  const clients = loadCSV('atlas-wealth', 'clients.csv');
  const compliance = loadCSV('atlas-wealth', 'compliance.csv');
  const filings = loadCSV('atlas-wealth', 'filings.csv');

  const cl = pick(clients);
  const cm = pick(compliance);
  const fl = pick(filings);

  const templates = {
    'compliance-monitor': [
      () => ({ action: `Completed ${cm.check_type} check — ${cm.regulation} — ${cm.status}`, type: 'compliance' }),
      () => ({ action: `Flagged overdue ${cm.check_type} for ${cm.entity}`, type: 'alert' }),
      () => ({ action: `Reviewed personal trading pre-clearance — ${3 + randomInt(10)} requests, no violations`, type: 'compliance' }),
      () => ({ action: `Generated weekly compliance review — ${1 + randomInt(3)} action items`, type: 'reporting' }),
      () => ({ action: `Verified Reg BI best interest documentation for ${cl.name}`, type: 'compliance' }),
    ],
    'portfolio-reviewer': [
      () => ({ action: `Completed quarterly portfolio review for ${cl.name} ($${cl.aum} AUM)`, type: 'review' }),
      () => ({ action: `Flagged rebalancing needed — ${cl.name} (${cl.risk_profile} profile)`, type: 'alert' }),
      () => ({ action: `Prepared client review materials for ${cl.name} — meeting ${cl.next_review}`, type: 'preparation' }),
      () => ({ action: `Calculated RMD for ${cl.name} — distribution schedule updated`, type: 'analysis' }),
      () => ({ action: `Generated performance attribution report for ${cl.name}`, type: 'reporting' }),
    ],
    'filing-coordinator': [
      () => ({ action: `Updated ${fl.form} filing progress — ${fl.status}`, type: 'filing' }),
      () => ({ action: `Deadline alert: ${fl.form} (${fl.description}) due ${fl.deadline}`, type: 'alert' }),
      () => ({ action: `Submitted ${fl.form} to SEC EDGAR — ${fl.entity}`, type: 'filing' }),
      () => ({ action: `Generated regulatory filing status report — ${1 + randomInt(3)} filings due this month`, type: 'reporting' }),
      () => ({ action: `Prepared ${fl.form} draft for CCO review`, type: 'preparation' }),
    ],
  };

  const t = templates[agent];
  return t ? pick(t)() : { action: 'Processed task', type: 'general' };
}

// ---------------------------------------------------------------------------
// Company configs
// ---------------------------------------------------------------------------
const COMPANIES = {
  'meridian-health': {
    name: 'Meridian Health Partners',
    tier: 'enterprise',
    vertical: 'healthcare',
    agents: [
      { id: 'patient-coordinator', name: 'Patient Coordinator' },
      { id: 'compliance-officer', name: 'Compliance Officer' },
      { id: 'records-analyst', name: 'Records Analyst' },
    ],
    generator: meridianActivity,
    seedKPIs: { tasksCompleted: 2847, hoursSaved: 312.5, accuracyRate: 99.2, activeSince: '2026-01-15' },
  },
  'pacific-legal': {
    name: 'Pacific Legal Group',
    tier: 'professional',
    vertical: 'legal',
    agents: [
      { id: 'legal-ea', name: 'Legal EA' },
      { id: 'document-analyst', name: 'Document Analyst' },
      { id: 'client-followup', name: 'Client Follow-up' },
    ],
    generator: pacificActivity,
    seedKPIs: { tasksCompleted: 2031, hoursSaved: 234.8, accuracyRate: 98.7, activeSince: '2026-01-20' },
  },
  'buildright': {
    name: 'BuildRight Construction',
    tier: 'starter',
    vertical: 'construction',
    agents: [
      { id: 'site-reporter', name: 'Site Reporter' },
    ],
    generator: buildrightActivity,
    seedKPIs: { tasksCompleted: 423, hoursSaved: 68.3, accuracyRate: 97.5, activeSince: '2026-02-01' },
  },
  'novacrm': {
    name: 'NovaCRM',
    tier: 'professional',
    vertical: 'saas',
    agents: [
      { id: 'churn-analyst', name: 'Churn Analyst' },
      { id: 'onboarding-specialist', name: 'Onboarding Specialist' },
      { id: 'support-triage', name: 'Support Triage' },
    ],
    generator: novacrmActivity,
    seedKPIs: { tasksCompleted: 1876, hoursSaved: 198.4, accuracyRate: 98.9, activeSince: '2026-01-10' },
  },
  'atlas-wealth': {
    name: 'Atlas Wealth Advisors',
    tier: 'enterprise',
    vertical: 'financial-services',
    agents: [
      { id: 'compliance-monitor', name: 'Compliance Monitor' },
      { id: 'portfolio-reviewer', name: 'Portfolio Reviewer' },
      { id: 'filing-coordinator', name: 'Filing Coordinator' },
    ],
    generator: atlasActivity,
    seedKPIs: { tasksCompleted: 2234, hoursSaved: 267.2, accuracyRate: 99.4, activeSince: '2026-01-05' },
  },
};

// ---------------------------------------------------------------------------
// Seed initial data
// ---------------------------------------------------------------------------
function createSeedData() {
  const now = Date.now();
  const data = { lastUpdated: new Date(now).toISOString(), companies: {} };

  for (const [slug, cfg] of Object.entries(COMPANIES)) {
    const agents = cfg.agents.map(a => ({
      id: a.id,
      name: a.name,
      status: 'active',
      lastActive: new Date(now).toISOString(),
      taskCount: Math.floor(cfg.seedKPIs.tasksCompleted / cfg.agents.length),
    }));

    // Generate 30 historical activities spanning last 7 days
    const activities = [];
    for (let i = 0; i < 30; i++) {
      const agentDef = agents[randomInt(agents.length)];
      const offsetMs = randomInt(7 * 24 * 60 * 60 * 1000);
      const ts = new Date(now - offsetMs);
      const entry = cfg.generator(agentDef.id);
      activities.push({ ts: ts.toISOString(), agent: agentDef.id, action: entry.action, type: entry.type });
    }
    activities.sort((a, b) => b.ts.localeCompare(a.ts));

    data.companies[slug] = {
      name: cfg.name,
      tier: cfg.tier,
      vertical: cfg.vertical,
      kpis: { ...cfg.seedKPIs },
      agents,
      recentActivity: activities,
    };
  }
  return data;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  // Load or create
  let data;
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    console.log('No existing activity.json — creating seed data');
    data = createSeedData();
  }

  const now = new Date();

  for (const [slug, cfg] of Object.entries(COMPANIES)) {
    const company = data.companies[slug];
    if (!company) continue;

    const numTasks = randomInt(1, 5); // 1-4 tasks
    for (let i = 0; i < numTasks; i++) {
      // Pick random agent
      const agentDef = pick(cfg.agents);
      const entry = cfg.generator(agentDef.id);

      // Stagger timestamps slightly so they're not all identical
      const ts = new Date(now.getTime() - randomInt(0, 15 * 60 * 1000));

      company.recentActivity.unshift({
        ts: ts.toISOString(),
        agent: agentDef.id,
        action: entry.action,
        type: entry.type,
      });

      // Update KPIs
      company.kpis.tasksCompleted++;
      company.kpis.hoursSaved = Math.round((company.kpis.hoursSaved + randFloat(0.1, 0.5)) * 100) / 100;

      // Update agent
      const agentObj = company.agents.find(a => a.id === agentDef.id);
      if (agentObj) {
        agentObj.lastActive = ts.toISOString();
        agentObj.taskCount++;
      }
    }

    // Trim to 50
    company.recentActivity = company.recentActivity.slice(0, 50);
  }

  data.lastUpdated = now.toISOString();

  // Ensure directory exists
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated activity.json — ${now.toISOString()}`);
}

main();
