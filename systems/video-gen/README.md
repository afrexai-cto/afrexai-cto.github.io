# Video Generation — Google Veo 3

Generate short video clips (4-8s) from text prompts or images using Google's Veo 3 model via the Vertex AI GenAI SDK.

## Setup

```bash
npm install
```

### Authentication

**Option A — Vertex AI (recommended):**
```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_LOCATION=us-central1   # or global
export GOOGLE_GENAI_USE_VERTEXAI=True
gcloud auth application-default login
```

**Option B — API Key (AI Studio):**
```bash
export GOOGLE_API_KEY=your-api-key
```

Edit `config.json` to set your `projectId` and preferred defaults.

## Usage

```bash
# Text to video
node generate.js "a drone shot flying over mountains at sunset"

# Image to video
node generate.js --image input.png "animate this scene with gentle camera movement"

# Fast model, portrait, 4 seconds
node generate.js --fast --aspect 9:16 --duration 4 "a cat playing piano"

# Multiple outputs with seed
node generate.js --count 2 --seed 42 "ocean waves crashing on rocks"

# Mock mode (testing, no API call)
node generate.js --mock "test prompt"
```

## Options

| Flag | Short | Description |
|------|-------|-------------|
| `--image <path>` | `-i` | Input image for image-to-video |
| `--fast` | `-f` | Use fast model (`veo-3.0-fast-generate-001`) |
| `--aspect <ratio>` | `-a` | `16:9` (default) or `9:16` |
| `--duration <sec>` | `-d` | `4`, `6`, or `8` (default: 8) |
| `--count <n>` | `-c` | Number of videos: 1-4 |
| `--resolution <res>` | `-r` | `720p` or `1080p` |
| `--negative <text>` | `-n` | Negative prompt |
| `--seed <number>` | `-s` | Seed for reproducibility |
| `--mock` | | Mock mode for testing |

## Models

| Model ID | Type |
|----------|------|
| `veo-3.0-generate-001` | Standard (default) |
| `veo-3.0-fast-generate-001` | Fast |
| `veo-3.0-generate-preview` | Preview |
| `veo-3.0-fast-generate-preview` | Fast Preview |

## Output

Videos are saved to `./output/` with timestamped filenames:
```
output/veo3-2026-02-19T03-01-23_a_drone_shot_flying_over_mountains_0.mp4
```

## Specs

- **Formats:** MP4 (video/mp4)
- **Framerate:** 24 FPS
- **Resolutions:** 720p, 1080p
- **Aspect ratios:** 16:9, 9:16
- **Duration:** 4, 6, or 8 seconds
- **Audio:** Generated automatically (Veo 3)

## Tests

```bash
npm test
```
