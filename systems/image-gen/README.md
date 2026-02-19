# Image Generation System (Gemini Imagen)

Generate, edit, and compose images using Google's Gemini 2.0 Flash and Imagen 3 APIs.

## Setup

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Set it: `export GEMINI_API_KEY=your_key` (or edit `config.json`)

## Usage

### Generate from text prompt
```bash
node generate.js "a futuristic city at sunset"
node generate.js "portrait of a cat" --aspect 16:9
node generate.js "abstract art" --imagen          # Use Imagen 3 endpoint
node generate.js "landscape" --model gemini-2.0-flash-exp-image-generation
```

### Edit an existing image
```bash
node edit.js photo.png "make it look like a watercolor painting"
node edit.js input.jpg "remove the background and replace with mountains"
```

### Compose multiple images (up to 14)
```bash
node compose.js left.png right.png "merge into a panorama"
node compose.js a.png b.png c.png "create a triptych collage"
```

## Output

All images saved to `output/` with timestamped filenames:
- `gen_2026-02-19_03-02-00.png`
- `edit_2026-02-19_03-02-00.png`
- `compose_2026-02-19_03-02-00.png`

## Models

| Model | Use Case |
|-------|----------|
| `gemini-2.0-flash-exp-image-generation` | Default. Text+image in, image out. Editing & composition. |
| `imagen-3.0-generate-002` | Dedicated image gen. Higher quality, text-to-image only. |

## Config

`config.json` — API key, model names, output directory, default dimensions.

## Architecture

- `gemini-client.js` — API client (generateContent + Imagen predict endpoints)
- `generate.js` — Text-to-image CLI
- `edit.js` — Image editing CLI
- `compose.js` — Multi-image composition CLI

No external dependencies. Uses Node.js built-in `fetch` (v18+).
