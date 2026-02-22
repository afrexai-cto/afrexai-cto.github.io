'use strict';
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const db = require('../db');
const connectors = require('../connectors');
const csvConnector = require('../connectors/csv');

// Multer-free file upload (reads raw body)
function handleUpload(req) {
  if (!req.body?.filename || !req.body?.content) {
    throw new Error('Provide filename and content (base64 or text)');
  }

  const uploadDir = path.join(__dirname, '..', 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });

  const safeName = req.body.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = path.join(uploadDir, `${Date.now()}-${safeName}`);

  let content = req.body.content;
  if (req.body.encoding === 'base64') {
    content = Buffer.from(content, 'base64').toString('utf-8');
  }

  fs.writeFileSync(filePath, content);
  return filePath;
}

// GET /api/data-sources/types — list available connector types
router.get('/types', (req, res) => {
  res.json({ types: connectors.listConnectorTypes() });
});

// GET /api/data-sources/:companyId — list data sources for a company
router.get('/:companyId', (req, res) => {
  const data = db.read();
  const sources = data.dataSources?.[req.params.companyId] || [];

  // Also list built-in CSV files from sample-data
  const demoDir = db.getDemoDir();
  const sampleDir = path.join(demoDir, 'sample-data', req.params.companyId);
  const builtIn = [];
  if (fs.existsSync(sampleDir)) {
    for (const f of fs.readdirSync(sampleDir)) {
      if (f.endsWith('.csv')) {
        const fp = path.join(sampleDir, f);
        builtIn.push({
          id: `builtin-${f}`,
          type: 'csv',
          name: f,
          builtIn: true,
          config: { path: `sample-data/${req.params.companyId}/${f}` },
          meta: csvConnector.getHeaders(fp).length ? {
            headers: csvConnector.getHeaders(fp),
            rows: csvConnector.rowCount(fp),
          } : null,
        });
      }
    }
  }

  res.json({ sources: [...builtIn, ...sources] });
});

// POST /api/data-sources/:companyId/upload — upload a CSV file
router.post('/:companyId/upload', (req, res, next) => {
  try {
    const filePath = handleUpload(req);
    const headers = csvConnector.getHeaders(filePath);
    const rows = csvConnector.rowCount(filePath);

    const source = {
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'upload',
      name: req.body.filename,
      config: { uploadPath: filePath },
      createdAt: new Date().toISOString(),
    };

    db.update(data => {
      if (!data.dataSources) data.dataSources = {};
      if (!data.dataSources[req.params.companyId]) data.dataSources[req.params.companyId] = [];
      data.dataSources[req.params.companyId].push(source);
    });

    res.json({ source, meta: { headers, rows } });
  } catch (err) {
    next(err);
  }
});

// POST /api/data-sources/:companyId/connect — add an API connector
router.post('/:companyId/connect', (req, res) => {
  const { type, name, config } = req.body;
  if (!type || !connectors.connectors[type]) {
    return res.status(400).json({ error: `Unknown connector type: ${type}` });
  }

  const source = {
    id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    name: name || type,
    config: config || {},
    createdAt: new Date().toISOString(),
  };

  db.update(data => {
    if (!data.dataSources) data.dataSources = {};
    if (!data.dataSources[req.params.companyId]) data.dataSources[req.params.companyId] = [];
    data.dataSources[req.params.companyId].push(source);
  });

  // Test the connection
  const connector = connectors.connectors[type];
  const testResult = connector.fetch(source.config, db.getDemoDir());

  res.json({ source, test: testResult });
});

// GET /api/data-sources/:companyId/:sourceId/query — query a data source
router.get('/:companyId/:sourceId/query', (req, res, next) => {
  try {
    const result = connectors.queryData(req.params.companyId, req.params.sourceId, {
      where: req.query.where ? JSON.parse(req.query.where) : undefined,
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/data-sources/:companyId/:sourceId
router.delete('/:companyId/:sourceId', (req, res) => {
  db.update(data => {
    if (data.dataSources?.[req.params.companyId]) {
      data.dataSources[req.params.companyId] = data.dataSources[req.params.companyId]
        .filter(s => s.id !== req.params.sourceId);
    }
  });
  res.json({ ok: true });
});

module.exports = router;
