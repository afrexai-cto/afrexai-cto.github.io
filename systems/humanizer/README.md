# AI Writing Humanizer

Strips common AI writing patterns from text. Based on Wikipedia's "Signs of AI writing."

## Usage

```bash
# Direct argument
node humanize.js "Let us delve into the evolving landscape of technology."

# Pipe
cat draft.md | node humanize.js

# As module
const { humanize } = require('./humanize');
console.log(humanize(text));
```

## What it catches

- **AI vocabulary**: delve, landscape, tapestry, leverage, robust, comprehensive, streamline, foster, utilize, facilitate, multifaceted, paradigm, pivotal, synergy
- **Stock phrases**: "it's worth noting", "at the end of the day", "in today's world", "in conclusion", "stands as a testament", "only time will tell", "cannot be overstated"
- **Hedging**: However/Moreover/Furthermore/Additionally/Nevertheless → simpler connectors
- **Structural**: em-dash overuse → commas
- **Performed authenticity**: "plays a crucial role", "not without challenges", "raises important questions", "sheds light on", "paves the way"

## Adding patterns

Edit `patterns.json`. Each pattern has:
- `id`: unique name
- `category`: grouping
- `find`: regex string
- `replace`: replacement (can be empty to remove)
- `flags`: regex flags (default: `gi`)

Run `node test.js` after changes to verify.

## Tests

```bash
node test.js
```
