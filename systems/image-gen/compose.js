#!/usr/bin/env node
/**
 * Compose multiple images (up to 14) with a text instruction.
 * Usage: node compose.js img1.png img2.png "merge these into a collage"
 *        node compose.js img1.png img2.png img3.png "combine with smooth transitions"
 */
import { generateContent, saveImages, imageToBase64, mimeFromPath } from './gemini-client.js';

const args = process.argv.slice(2);
if (args.length < 2 || args[0] === '--help') {
  console.log('Usage: node compose.js <img1> [img2] ... [img14] "instruction" [--model MODEL]');
  console.log('The last non-flag argument is the text instruction. Up to 14 images supported.');
  process.exit(0);
}

const modelIdx = args.indexOf('--model');
const model = modelIdx !== -1 ? args[modelIdx + 1] : undefined;
const filteredArgs = args.filter((a, i) => a !== '--model' && (modelIdx === -1 || i !== modelIdx + 1));

// Last arg is the instruction, rest are image paths
const instruction = filteredArgs[filteredArgs.length - 1];
const imagePaths = filteredArgs.slice(0, -1);

if (imagePaths.length === 0) {
  console.error('Error: provide at least one image file.');
  process.exit(1);
}
if (imagePaths.length > 14) {
  console.error('Error: maximum 14 images supported.');
  process.exit(1);
}

console.log(`Composing ${imagePaths.length} image(s) with: "${instruction}"`);

const parts = [{ text: instruction }];
for (const imgPath of imagePaths) {
  parts.push({
    inlineData: {
      mimeType: mimeFromPath(imgPath),
      data: imageToBase64(imgPath)
    }
  });
}

try {
  const response = await generateContent(parts, { model });
  const saved = saveImages(response, 'compose');
  if (saved.length) {
    console.log(`Saved ${saved.length} composed image(s):`);
    saved.forEach(f => console.log(`  ${f}`));
  } else {
    console.log('No images in response.');
    console.log(JSON.stringify(response, null, 2));
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
