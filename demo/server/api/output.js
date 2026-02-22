'use strict';
const router = require('express').Router();
const output = require('../output');

// GET /api/output/:companyId — list output configs
router.get('/:companyId', (req, res) => {
  res.json({ configs: output.getOutputConfigs(req.params.companyId) });
});

// POST /api/output/:companyId — add output config
router.post('/:companyId', (req, res) => {
  const { type, config } = req.body;
  if (!type) return res.status(400).json({ error: 'Required: type (email|slack|pdf)' });
  const result = output.addOutputConfig(req.params.companyId, { type, config: config || {} });
  res.json(result);
});

// DELETE /api/output/:companyId/:configId
router.delete('/:companyId/:configId', (req, res) => {
  output.removeOutputConfig(req.params.companyId, req.params.configId);
  res.json({ ok: true });
});

module.exports = router;
