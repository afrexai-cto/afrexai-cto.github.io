# Prompt Engineering Toolkit

Practical guide and automated linter for writing effective Claude Opus 4.6 prompts.

## Contents

- **GUIDE.md** — Comprehensive prompt engineering guide with principles, examples, and patterns
- **lint.js** — Automated linter that checks prompts against the principles
- **rules.json** — Machine-readable rule definitions
- **examples/** — Before/after pairs for each principle

## Quick Start

```bash
# Lint a prompt file
node lint.js prompt.md

# Lint multiple files
node lint.js system-prompt.md tool-desc.md

# JSON output
node lint.js --json prompt.md
```

## Rules

| ID | Severity | What it catches |
|----|----------|----------------|
| `no-caps-urgency` | warning | ALL-CAPS words like MUST, NEVER, CRITICAL |
| `no-if-in-doubt` | warning | "if unsure" / "if in doubt" fallback triggers |
| `no-anti-patterns` | warning | Examples of what NOT to do shown to the model |
| `vague-persona` | info | "You are a friendly, helpful assistant" |
| `negation-heavy` | info | Too many "don't" / "do not" instructions |
| `too-many-rules` | info | More than ~10 distinct behavioral rules |
| `explain-why` | info | Short rules without reasoning |
