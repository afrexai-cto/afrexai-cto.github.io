'use strict';

const fs = require('fs');
const path = require('path');

/**
 * CSV connector — reads local CSV files or uploaded CSVs.
 * Handles quoted fields properly.
 */

function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8').trim();
  if (!content) return [];

  const lines = content.split('\n');
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  }).filter(row => Object.values(row).some(v => v));
}

function parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function getHeaders(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const first = fs.readFileSync(filePath, 'utf-8').split('\n')[0];
  return parseLine(first || '');
}

function rowCount(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  return fs.readFileSync(filePath, 'utf-8').trim().split('\n').length - 1;
}

function query(filePath, { where, limit, offset = 0 } = {}) {
  let rows = parseCSV(filePath);
  if (where) {
    rows = rows.filter(row => {
      return Object.entries(where).every(([k, v]) => {
        if (typeof v === 'string') return row[k]?.toLowerCase().includes(v.toLowerCase());
        return row[k] === String(v);
      });
    });
  }
  const total = rows.length;
  if (offset) rows = rows.slice(offset);
  if (limit) rows = rows.slice(0, limit);
  return { rows, total };
}

module.exports = { parseCSV, getHeaders, rowCount, query };
