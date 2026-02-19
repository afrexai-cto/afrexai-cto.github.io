/**
 * docs.js — Google Docs, Sheets, Slides integration
 *
 * Commands:
 *   node docs.js create "Title"                    # Create Google Doc
 *   node docs.js sheet "Title"                     # Create Google Sheet
 *   node docs.js slides "Title"                    # Create Google Slides
 *   node docs.js share <fileId> <email> [role]     # Share (reader|writer|commenter)
 *   node docs.js write <docId> "content"           # Append text to Doc
 */

import { google } from 'googleapis';
import { getAuthClient } from './auth.js';

async function getClients() {
  const auth = await getAuthClient();
  return {
    docs: google.docs({ version: 'v1', auth }),
    sheets: google.sheets({ version: 'v4', auth }),
    slides: google.slides({ version: 'v1', auth }),
    drive: google.drive({ version: 'v3', auth }),
  };
}

async function createDoc(title) {
  const { docs } = await getClients();
  const res = await docs.documents.create({ requestBody: { title } });

  console.log(`📄 Document created: ${res.data.title}`);
  console.log(`   ID: ${res.data.documentId}`);
  console.log(`   URL: https://docs.google.com/document/d/${res.data.documentId}/edit`);
  return res.data;
}

async function createSheet(title) {
  const { sheets } = await getClients();
  const res = await sheets.spreadsheets.create({
    requestBody: { properties: { title } },
  });

  console.log(`📊 Spreadsheet created: ${res.data.properties.title}`);
  console.log(`   ID: ${res.data.spreadsheetId}`);
  console.log(`   URL: ${res.data.spreadsheetUrl}`);
  return res.data;
}

async function createSlides(title) {
  const { slides } = await getClients();
  const res = await slides.presentations.create({
    requestBody: { title },
  });

  console.log(`📽️  Presentation created: ${res.data.title}`);
  console.log(`   ID: ${res.data.presentationId}`);
  console.log(`   URL: https://docs.google.com/presentation/d/${res.data.presentationId}/edit`);
  return res.data;
}

async function share(fileId, email, role = 'reader') {
  const { drive } = await getClients();
  await drive.permissions.create({
    fileId,
    requestBody: {
      type: 'user',
      role,
      emailAddress: email,
    },
    sendNotificationEmail: true,
  });

  console.log(`🔗 Shared ${fileId} with ${email} as ${role}`);
}

async function writeToDoc(docId, content) {
  const { docs } = await getClients();

  // Get current doc to find end index
  const doc = await docs.documents.get({ documentId: docId });
  const endIndex = doc.data.body.content.slice(-1)[0]?.endIndex || 1;

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [{
        insertText: {
          location: { index: endIndex - 1 },
          text: content + '\n',
        },
      }],
    },
  });

  console.log(`✏️  Text appended to document ${docId}`);
}

// CLI
const cmd = process.argv[2];
switch (cmd) {
  case 'create': await createDoc(process.argv[3]); break;
  case 'sheet': await createSheet(process.argv[3]); break;
  case 'slides': await createSlides(process.argv[3]); break;
  case 'share': await share(process.argv[3], process.argv[4], process.argv[5] || 'reader'); break;
  case 'write': await writeToDoc(process.argv[3], process.argv[4]); break;
  default:
    console.log('Usage: node docs.js <create|sheet|slides|share|write>');
}
