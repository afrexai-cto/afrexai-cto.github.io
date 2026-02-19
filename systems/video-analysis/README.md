# 🎬 Gemini Video Analysis

Analyze videos using Google Gemini's native video understanding. Supports local files, YouTube URLs, and direct video URLs.

## Setup

```bash
cd systems/video-analysis
npm install

# Set your API key
export GEMINI_API_KEY="your-key"
# Or use 1Password: export GEMINI_API_KEY=$(op read "op://AfrexAI/Gemini/api_key")
```

For YouTube support, install [yt-dlp](https://github.com/yt-dlp/yt-dlp):
```bash
brew install yt-dlp
```

## Usage

```bash
# Local file
node analyze.js video.mp4

# YouTube
node analyze.js "https://youtube.com/watch?v=xxx"

# Direct URL
node analyze.js "https://example.com/video.mp4"

# Custom prompt
node analyze.js video.mp4 --prompt "Extract all dialogue with timestamps"

# Keep file in Gemini (don't auto-delete)
node analyze.js video.mp4 --no-cleanup
```

## Output

- **Summary** — What the video is about
- **Key Moments** — Timestamped events `[MM:SS]`
- **Insights** — Themes, patterns, observations
- **Talking Points** — Key takeaways
- **Technical Notes** — Production observations

## Architecture

| File | Purpose |
|------|---------|
| `analyze.js` | CLI entry point |
| `gemini-video-client.js` | Gemini File API upload + generateContent |
| `youtube-downloader.js` | YouTube/URL download via yt-dlp |
| `config.json` | Model, limits, prompt templates |

## How It Works

1. Input is resolved to a local file (downloaded if URL)
2. Video uploaded via Gemini File API (`ai.files.upload`)
3. Polls until file state is `ACTIVE`
4. Sends to `generateContent` with video part + analysis prompt
5. Returns structured analysis, cleans up uploaded file

## Limits

- Max file size: 2GB (Gemini limit)
- Supported: mp4, mov, avi, webm, flv, wmv, 3gp, mpeg
- Processing time depends on video length (Gemini-side)
