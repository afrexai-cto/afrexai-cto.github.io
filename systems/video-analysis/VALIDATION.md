# Validation — Gemini Video Analysis

## API Research ✅
- Confirmed `@google/genai` SDK: `ai.files.upload()`, `ai.files.get()`, `ai.models.generateContent()`
- Uses `createPartFromUri` + `createUserContent` for multimodal content
- File states: PROCESSING → ACTIVE/FAILED (must poll)
- Source: https://ai.google.dev/gemini-api/docs/video-understanding

## Components ✅
- [x] `analyze.js` — CLI with help, input routing, error handling
- [x] `gemini-video-client.js` — Upload, poll, analyze, cleanup
- [x] `youtube-downloader.js` — yt-dlp integration + direct URL fetch
- [x] `config.json` — Model, MIME types, prompts, limits
- [x] `package.json` — Dependencies: `@google/genai`, `yt-dlp-exec`
- [x] `README.md` — Setup, usage, architecture docs

## Input Types ✅
- [x] Local file (path resolution + existence check)
- [x] YouTube URL (regex detection, yt-dlp download)
- [x] Direct video URL (fetch + save to temp)

## To Test
```bash
npm install
export GEMINI_API_KEY="..."
node analyze.js --help                    # Should show usage
node analyze.js sample.mp4               # Local file analysis
node analyze.js "https://youtu.be/xxx"   # YouTube download + analysis
```

## Known Considerations
- YouTube downloads require `yt-dlp` installed (brew install yt-dlp)
- Large videos take time to process on Gemini's side (polling with 5s interval)
- Temp files auto-cleaned after analysis; use `--no-cleanup` to keep Gemini-side file
- Uses ESM (`import`); requires Node 18+ with `type: "module"` or `.mjs` extension
