# VALIDATION.md — Image Generation System

## Structure Validation

- [x] `generate.js` — text-to-image CLI
- [x] `edit.js` — image editing CLI  
- [x] `compose.js` — multi-image composition CLI (up to 14 images)
- [x] `gemini-client.js` — shared API client
- [x] `config.json` — configuration with API key placeholder
- [x] `output/.gitkeep` — output directory
- [x] `package.json` — project manifest
- [x] `README.md` — documentation

## API Integration

- [x] Gemini `generateContent` endpoint: `POST /v1beta/models/{model}:generateContent`
- [x] Imagen 3 `predict` endpoint: `POST /v1beta/models/{model}:predict`
- [x] `responseModalities: ["IMAGE", "TEXT"]` for image output
- [x] `inlineData` with base64-encoded images for editing/composition
- [x] API key via env var `GEMINI_API_KEY` or `config.json`
- [x] Fallback from Imagen to generateContent if predict endpoint unavailable

## Features

- [x] Text-to-image generation
- [x] Image editing with text instructions
- [x] Multi-image composition (up to 14 images)
- [x] Timestamped output filenames (`prefix_YYYY-MM-DD_HH-MM-SS.ext`)
- [x] Aspect ratio control (`--aspect 16:9`)
- [x] Model selection (`--model`)
- [x] Imagen 3 toggle (`--imagen`)
- [x] Zero external dependencies (Node.js 18+ built-in fetch)

## Syntax Validation

```bash
node --check generate.js && echo "✓ generate.js"
node --check edit.js && echo "✓ edit.js"
node --check compose.js && echo "✓ compose.js"
node --check gemini-client.js && echo "✓ gemini-client.js"
```

## Test Commands (require valid API key)

```bash
export GEMINI_API_KEY=your_key
node generate.js "a red balloon floating over a green field"
node edit.js output/gen_*.png "add clouds to the sky"
node compose.js img1.png img2.png "blend together seamlessly"
```
