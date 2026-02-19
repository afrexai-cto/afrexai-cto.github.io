/**
 * drive.js — Google Drive integration
 *
 * Commands:
 *   node drive.js upload <file> [folder]  # Upload file (encrypts if .tar.gz/.zip)
 *   node drive.js list [query]            # List files
 *   node drive.js download <fileId> <out> # Download file
 *   node drive.js mkdir <name>            # Create folder
 */

import { google } from 'googleapis';
import { getAuthClient } from './auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createReadStream } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

async function getDrive() {
  const auth = await getAuthClient();
  return google.drive({ version: 'v3', auth });
}

function isBackupFile(filePath) {
  return /\.(tar\.gz|tgz|zip|7z|bak)$/i.test(filePath);
}

function encryptFile(filePath) {
  const encPath = filePath + '.enc';
  try {
    const key = execSync(`op read "${config.encryptionKeyRef}"`, { encoding: 'utf8' }).trim();
    execSync(`openssl enc -aes-256-cbc -salt -pbkdf2 -in "${filePath}" -out "${encPath}" -pass pass:"${key}"`, {
      stdio: 'pipe',
    });
    console.log(`🔒 Encrypted: ${path.basename(encPath)}`);
    return encPath;
  } catch (err) {
    console.warn('⚠️  Encryption skipped (key not available). Uploading plaintext.');
    return filePath;
  }
}

async function upload(filePath, folderId) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  let uploadPath = filePath;
  let encrypted = false;
  if (isBackupFile(filePath)) {
    uploadPath = encryptFile(filePath);
    encrypted = uploadPath !== filePath;
  }

  const drive = await getDrive();
  const fileMetadata = {
    name: path.basename(uploadPath),
    ...(folderId && { parents: [folderId] }),
  };

  const media = {
    body: createReadStream(uploadPath),
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, webViewLink, size',
  });

  console.log(`\n✅ Uploaded: ${res.data.name}`);
  console.log(`   ID: ${res.data.id}`);
  console.log(`   Link: ${res.data.webViewLink || 'N/A'}`);
  if (encrypted) console.log('   🔒 File was encrypted before upload');

  // Clean up temp encrypted file
  if (encrypted && uploadPath !== filePath) {
    fs.unlinkSync(uploadPath);
  }

  return res.data;
}

async function list(query) {
  const drive = await getDrive();
  const q = query ? `name contains '${query}' and trashed = false` : 'trashed = false';
  const res = await drive.files.list({
    q,
    pageSize: 30,
    fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
    orderBy: 'modifiedTime desc',
  });

  const files = res.data.files || [];
  console.log(`\n📁 ${files.length} files${query ? ` matching "${query}"` : ''}\n`);

  for (const f of files) {
    const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
    const icon = isFolder ? '📂' : '📄';
    const size = f.size ? `(${(parseInt(f.size) / 1024).toFixed(1)}KB)` : '';
    console.log(`  ${icon} ${f.name} ${size}`);
    console.log(`     ID: ${f.id}`);
  }
  return files;
}

async function download(fileId, outputPath) {
  const drive = await getDrive();
  const dest = fs.createWriteStream(outputPath);

  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
  await new Promise((resolve, reject) => {
    res.data.on('end', resolve).on('error', reject).pipe(dest);
  });

  console.log(`✅ Downloaded to: ${outputPath}`);
}

async function mkdir(name, parentId) {
  const drive = await getDrive();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId && { parents: [parentId] }),
    },
    fields: 'id, name, webViewLink',
  });

  console.log(`📂 Folder created: ${res.data.name}`);
  console.log(`   ID: ${res.data.id}`);
  return res.data;
}

// CLI
const cmd = process.argv[2];
switch (cmd) {
  case 'upload': await upload(process.argv[3], process.argv[4]); break;
  case 'list': await list(process.argv[3]); break;
  case 'download': await download(process.argv[3], process.argv[4]); break;
  case 'mkdir': await mkdir(process.argv[3], process.argv[4]); break;
  default:
    console.log('Usage: node drive.js <upload|list|download|mkdir>');
}
