#!/usr/bin/env node
/**
 * Edit an existing image with a text instruction.
 * Usage: node edit.js input.png "make the sky purple"
 */
import { generateContent, saveImages, imageToBase64, mimeFromPath } from './gemini-client.js';

const args = process.argv.slice(2);
if (args.length < 2 || args[0] === '--help') {
  console.log('Usage: node edit.js <input.png> "edit instruction" [--model MODEL]');
  process.exit(0);
}

const inputPath = args[0];
const instruction = args[1];
const modelIdx = args.indexOf('--model');
const model = modelIdx !== -1 ? args[modelIdx + 1] : undefined;

console.log(`Editing "${inputPath}" with: "${instruction}"`);

const parts = [
  { text: instruction },
  {
    inlineData: {
      mimeType: mimeFromPath(inputPath),
      data: imageToBase64(inputPath)
    }
  }
];

try {
  const response = await generateContent(parts, { model });
  const saved = saveImages(response, 'edit');
  if (saved.length) {
    console.log(`Saved ${saved.length} edited image(s):`);
    saved.forEach(f => console.log(`  ${f}`));
  } else {
    console.log('No images in response.');
    console.log(JSON.stringify(response, null, 2));
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
