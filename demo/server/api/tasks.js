'use strict';
const router = require('express').Router();
const executor = require('../agents/executor');
const db = require('../db');

// GET /api/tasks — list all task definitions
router.get('/', (req, res) => {
  const tasks = executor.listTasks(req.query.company);
  res.json({ tasks });
});

// GET /api/tasks/:id — single task definition
router.get('/:id', (req, res) => {
  const task = executor.loadTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// POST /api/tasks/:id/run — execute a task NOW
router.post('/:id/run', async (req, res, next) => {
  try {
    const dryRun = req.body.dryRun === true;
    const result = await executor.executeTask(req.params.id, { dryRun });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/runs — list recent task runs
router.get('/runs/list', (req, res) => {
  const data = db.read();
  let runs = data.taskRuns || [];
  if (req.query.company) runs = runs.filter(r => r.companyId === req.query.company);
  if (req.query.status) runs = runs.filter(r => r.status === req.query.status);
  const limit = parseInt(req.query.limit) || 50;
  res.json({ runs: runs.slice(0, limit) });
});

module.exports = router;
