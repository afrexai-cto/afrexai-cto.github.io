'use strict';
const router = require('express').Router();
const db = require('../db');

// GET /api/agents — all agents across companies
router.get('/', (req, res) => {
  const data = db.read();
  const agents = [];
  for (const [companyId, co] of Object.entries(data.companies || {})) {
    for (const agent of co.agents || []) {
      agents.push({ ...agent, companyId, companyName: co.name });
    }
  }
  res.json({ agents });
});

// GET /api/agents/:companyId/:agentId — specific agent
router.get('/:companyId/:agentId', (req, res) => {
  const data = db.read();
  const co = data.companies?.[req.params.companyId];
  if (!co) return res.status(404).json({ error: 'Company not found' });

  const agent = co.agents?.find(a => a.id === req.params.agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  // Get agent's recent activity
  const activity = (co.recentActivity || []).filter(a => a.agent === req.params.agentId);
  const runs = (data.taskRuns || []).filter(r => r.agentId === req.params.agentId).slice(0, 20);

  res.json({
    ...agent,
    companyId: req.params.companyId,
    companyName: co.name,
    recentActivity: activity,
    recentRuns: runs,
  });
});

module.exports = router;
