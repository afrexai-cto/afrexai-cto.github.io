#!/usr/bin/env node
/**
 * Generate an image from a text prompt.
 * Usage: node generate.js "a cat riding a bicycle"
 *        node generate.js "prompt" --model gemini-2.0-flash-exp-image-generation
 *        node generate.js "prompt" --aspect 16:9
 */
import { generateContent, generateImage, saveImages } from './gemini-client.js';

const args = process.argv.slice(2);
if (!args.length || args[0] === '--help') {
  console.log('Usage: node generate.js "prompt" [--aspect 1:1] [--model MODEL] [--imagen]');
  process.exit(0);
}

const prompt = args[0];
const useImagen = args.includes('--imagen');
const aspectIdx = args.indexOf('--aspect');
const aspectRatio = aspectIdx !== -1 ? args[aspectIdx + 1] : '1:1';
const modelIdx = args.indexOf('--model');
const model = modelIdx !== -1 ? args[modelIdx + 1] : undefined;

console.log(`Generating image for: "${prompt}"`);

try {
  let response;
  if (useImagen) {
    response = await generateImage(prompt, { model, aspectRatio });
  } else {
    response = await generateContent([{ text: prompt }], { model });
  }

  const saved = saveImages(response, 'gen');
  if (saved.length) {
    console.log(`Saved ${saved.length} image(s):`);
    saved.forEach(f => console.log(`  ${f}`));
  } else {
    console.log('No images in response.');
    console.log(JSON.stringify(response, null, 2));
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
