#!/usr/bin/env node
// Security Council - File Scanner
// Collects codebase files for analysis

import { readFileSync, writeFileSync, statSync, readdirSync } from 'fs';
import { join, extname, relative } from 'path';

const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url), 'utf8'));

function shouldExclude(name, isDir) {
  if (isDir) return config.excludeDirs.includes(name);
  return config.excludeFiles.includes(name);
}

function scanDir(dir, root, results = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  
  for (const entry of entries) {
    if (shouldExclude(entry.name, entry.isDirectory())) continue;
    const full = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDir(full, root, results);
    } else if (config.scanExtensions.includes(extname(entry.name))) {
      try {
        const stat = statSync(full);
        if (stat.size > config.maxFileSizeKb * 1024) continue;
        const content = readFileSync(full, 'utf8');
        results.push({
          path: relative(root, full),
          size: stat.size,
          content
        });
      } catch { /* skip unreadable */ }
    }
  }
  return results;
}

const files = scanDir(config.scanRoot, config.scanRoot);

// Write scan manifest
const manifest = {
  scannedAt: new Date().toISOString(),
  root: config.scanRoot,
  fileCount: files.length,
  totalSize: files.reduce((s, f) => s + f.size, 0),
  files
};

writeFileSync(
  new URL('./scan-data.json', import.meta.url),
  JSON.stringify(manifest, null, 2)
);

console.log(`✅ Scanned ${files.length} files (${(manifest.totalSize / 1024).toFixed(1)} KB)`);
