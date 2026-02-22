'use strict';
const router = require('express').Router();
const db = require('../db');
const metrics = require('../metrics');

// GET /api/companies — list all companies
router.get('/', (req, res) => {
  const data = db.read();
  const companies = Object.entries(data.companies || {}).map(([id, co]) => ({
    id,
    ...co,
    metrics: data.metrics?.byCompany?.[id] || {},
  }));
  res.json({ companies });
});

// GET /api/companies/:id — single company detail
router.get('/:id', (req, res) => {
  const data = db.read();
  const co = data.companies?.[req.params.id];
  if (!co) return res.status(404).json({ error: 'Company not found' });

  const roi = metrics.getROI(req.params.id);
  const schedules = (data.schedules || []).filter(s => s.companyId === req.params.id);
  const runs = (data.taskRuns || []).filter(r => r.companyId === req.params.id).slice(0, 50);
  const dataSources = data.dataSources?.[req.params.id] || [];
  const outputConfigs = data.outputConfigs?.[req.params.id] || [];

  res.json({
    id: req.params.id,
    ...co,
    roi,
    schedules,
    recentRuns: runs,
    dataSources,
    outputConfigs,
  });
});

// GET /api/companies/:id/activity — live activity feed
router.get('/:id/activity', (req, res) => {
  const data = db.read();
  const co = data.companies?.[req.params.id];
  if (!co) return res.status(404).json({ error: 'Company not found' });

  const since = req.query.since;
  let activity = co.recentActivity || [];
  if (since) {
    activity = activity.filter(a => a.ts > since);
  }

  const limit = parseInt(req.query.limit) || 50;
  res.json({ activity: activity.slice(0, limit) });
});

module.exports = router;
