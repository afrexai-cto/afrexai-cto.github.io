#!/usr/bin/env node
'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.AFREX_PORT || 3700;
const DEMO = path.resolve(__dirname, '..');
const ROOT = path.resolve(DEMO, '..');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS for local dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Root redirect
app.get('/', (req, res) => res.redirect('/demo/'));

// Static files (existing demo HTML)
app.use('/demo', express.static(DEMO, { extensions: ['html'] }));

// API routes
app.use('/api/companies', require('./api/companies'));
app.use('/api/agents', require('./api/agents'));
app.use('/api/tasks', require('./api/tasks'));
app.use('/api/deliverables', require('./api/deliverables'));
app.use('/api/data-sources', require('./api/data-sources'));
app.use('/api/scheduler', require('./api/scheduler'));
app.use('/api/metrics', require('./api/metrics'));
app.use('/api/output', require('./api/output'));
app.use('/api/health', require('./api/health'));

// Upload directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handler
app.use((err, req, res, _next) => {
  console.error(`[API Error] ${req.method} ${req.path}:`, err.message);
  res.status(err.status || 500).json({ error: err.message });
});

// Initialize subsystems
const scheduler = require('./scheduler');
const metrics = require('./metrics');
const db = require('./db');

db.init(DEMO);
metrics.init(DEMO);
scheduler.init(DEMO);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AfrexAI Server] Running on http://0.0.0.0:${PORT}`);
  console.log(`[AfrexAI Server] API: http://localhost:${PORT}/api/health`);
  console.log(`[AfrexAI Server] Demo: http://localhost:${PORT}/demo/`);
});

module.exports = app;
