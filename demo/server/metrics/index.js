'use strict';

const db = require('../db');

let DEMO_DIR;

function init(demoDir) {
  DEMO_DIR = demoDir;
  // Ensure metrics structure exists
  db.update(data => {
    if (!data.metrics) {
      data.metrics = { totalCost: 0, totalTokens: 0, totalTasks: 0, totalHoursSaved: 0, byCompany: {} };
    }
  });
}

/**
 * Record a completed task run's metrics
 */
function recordTask(companyId, { tokens = 0, cost = 0, durationMs = 0, hoursSaved = 0 }) {
  db.update(data => {
    const m = data.metrics;
    m.totalCost = Math.round((m.totalCost + cost) * 10000) / 10000;
    m.totalTokens += tokens;
    m.totalTasks++;
    m.totalHoursSaved = Math.round((m.totalHoursSaved + hoursSaved) * 100) / 100;

    if (!m.byCompany[companyId]) {
      m.byCompany[companyId] = { cost: 0, tokens: 0, tasks: 0, hoursSaved: 0, avgDurationMs: 0 };
    }
    const c = m.byCompany[companyId];
    c.cost = Math.round((c.cost + cost) * 10000) / 10000;
    c.tokens += tokens;
    c.tasks++;
    c.hoursSaved = Math.round((c.hoursSaved + hoursSaved) * 100) / 100;
    // Rolling average duration
    c.avgDurationMs = Math.round(((c.avgDurationMs * (c.tasks - 1)) + durationMs) / c.tasks);
  });
}

function getMetrics(companyId) {
  const data = db.read();
  if (companyId) {
    return data.metrics?.byCompany?.[companyId] || { cost: 0, tokens: 0, tasks: 0, hoursSaved: 0 };
  }
  return data.metrics || {};
}

function getROI(companyId) {
  const data = db.read();
  const company = data.companies?.[companyId];
  if (!company) return null;

  const m = data.metrics?.byCompany?.[companyId] || { cost: 0, hoursSaved: 0, tasks: 0 };
  
  // Estimate: average worker costs $35/hr
  const HOURLY_RATE = 35;
  const laborSaved = m.hoursSaved * HOURLY_RATE;
  const roi = m.cost > 0 ? ((laborSaved - m.cost) / m.cost * 100) : 0;

  return {
    companyId,
    companyName: company.name,
    agentCost: m.cost,
    hoursSaved: m.hoursSaved,
    laborCostSaved: laborSaved,
    netSavings: Math.round((laborSaved - m.cost) * 100) / 100,
    roi: Math.round(roi * 10) / 10,
    tasksCompleted: m.tasks,
    avgCostPerTask: m.tasks > 0 ? Math.round(m.cost / m.tasks * 10000) / 10000 : 0,
    avgDurationMs: m.avgDurationMs || 0,
  };
}

module.exports = { init, recordTask, getMetrics, getROI };
