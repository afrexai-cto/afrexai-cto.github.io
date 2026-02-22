'use strict';
const router = require('express').Router();
const db = require('../db');

router.get('/', (req, res) => {
  const data = db.read();
  const companyCount = Object.keys(data.companies || {}).length;
  res.json({
    status: 'ok',
    version: '2.0.0',
    uptime: process.uptime(),
    lastUpdated: data.lastUpdated,
    companies: companyCount,
    taskRuns: (data.taskRuns || []).length,
    schedules: (data.schedules || []).length,
  });
});

module.exports = router;
