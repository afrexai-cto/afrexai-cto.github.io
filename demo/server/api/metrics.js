'use strict';
const router = require('express').Router();
const metricsModule = require('../metrics');
const db = require('../db');

// GET /api/metrics — global metrics
router.get('/', (req, res) => {
  res.json(metricsModule.getMetrics());
});

// GET /api/metrics/:companyId — company-specific metrics
router.get('/:companyId', (req, res) => {
  res.json(metricsModule.getMetrics(req.params.companyId));
});

// GET /api/metrics/:companyId/roi — ROI calculation
router.get('/:companyId/roi', (req, res) => {
  const roi = metricsModule.getROI(req.params.companyId);
  if (!roi) return res.status(404).json({ error: 'Company not found' });
  res.json(roi);
});

// GET /api/metrics/delivery/log — delivery log
router.get('/delivery/log', (req, res) => {
  const data = db.read();
  const log = data.deliveryLog || [];
  const limit = parseInt(req.query.limit) || 50;
  res.json({ log: log.slice(0, limit) });
});

module.exports = router;
