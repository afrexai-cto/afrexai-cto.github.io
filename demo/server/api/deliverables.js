'use strict';
const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

// GET /api/deliverables — list deliverables
router.get('/', (req, res) => {
  const demoDir = db.getDemoDir();
  const delivDir = path.join(demoDir, 'data/deliverables');
  if (!fs.existsSync(delivDir)) return res.json({ deliverables: [] });

  const deliverables = [];
  const companyFilter = req.query.company;

  for (const company of fs.readdirSync(delivDir)) {
    if (companyFilter && company !== companyFilter) continue;
    const dir = path.join(delivDir, company);
    if (!fs.statSync(dir).isDirectory()) continue;

    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().reverse()) {
      const stat = fs.statSync(path.join(dir, f));
      // Parse frontmatter
      const content = fs.readFileSync(path.join(dir, f), 'utf-8');
      const meta = {};
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch) {
        fmMatch[1].split('\n').forEach(line => {
          const [k, ...v] = line.split(': ');
          if (k && v.length) meta[k.trim()] = v.join(': ').trim();
        });
      }

      deliverables.push({
        company,
        filename: f,
        path: `deliverables/${company}/${f}`,
        size: stat.size,
        created: stat.mtime.toISOString(),
        ...meta,
      });
    }
  }

  const limit = parseInt(req.query.limit) || 100;
  res.json({ deliverables: deliverables.slice(0, limit), total: deliverables.length });
});

// GET /api/deliverables/:company/:filename — get deliverable content
router.get('/:company/:filename', (req, res) => {
  const demoDir = db.getDemoDir();
  const filePath = path.join(demoDir, 'data/deliverables', req.params.company, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });

  const content = fs.readFileSync(filePath, 'utf-8');

  if (req.query.format === 'raw') {
    res.type('text/markdown').send(content);
  } else {
    // Strip frontmatter for clean content
    const body = content.replace(/^---\n[\s\S]*?\n---\n*/, '');
    const meta = {};
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      fmMatch[1].split('\n').forEach(line => {
        const [k, ...v] = line.split(': ');
        if (k && v.length) meta[k.trim()] = v.join(': ').trim();
      });
    }
    res.json({ meta, content: body });
  }
});

// GET /api/deliverables/:company/:filename/download — download as file
router.get('/:company/:filename/download', (req, res) => {
  const demoDir = db.getDemoDir();
  const filePath = path.join(demoDir, 'data/deliverables', req.params.company, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.download(filePath);
});

module.exports = router;
