'use strict';
const router = require('express').Router();
const scheduler = require('../scheduler');

// GET /api/scheduler — list all schedules
router.get('/', (req, res) => {
  const schedules = scheduler.listSchedules(req.query.company);
  res.json({ schedules });
});

// POST /api/scheduler — add a schedule
router.post('/', (req, res) => {
  const { companyId, taskId, cron, label } = req.body;
  if (!companyId || !taskId || !cron) {
    return res.status(400).json({ error: 'Required: companyId, taskId, cron' });
  }
  const schedule = scheduler.addSchedule({ companyId, taskId, cron, label });
  res.json(schedule);
});

// PATCH /api/scheduler/:id — update a schedule
router.patch('/:id', (req, res) => {
  scheduler.updateSchedule(req.params.id, req.body);
  res.json({ ok: true });
});

// DELETE /api/scheduler/:id — remove a schedule
router.delete('/:id', (req, res) => {
  scheduler.removeSchedule(req.params.id);
  res.json({ ok: true });
});

// POST /api/scheduler/seed — seed default schedules
router.post('/seed', (req, res) => {
  scheduler.seedDefaults();
  const schedules = scheduler.listSchedules();
  res.json({ schedules });
});

module.exports = router;
