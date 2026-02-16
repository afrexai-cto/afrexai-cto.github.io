---
name: afrexai-skill-publisher
description: Autonomously structure, validate, and publish OpenClaw skills to ClawHub. Use this skill when you need to create a new skill from content, publish an existing skill directory, or manage the skill lifecycle.
metadata:
  {
    "openclaw":
      {
        "emoji": "🚀",
        "category": "automation",
        "version": "1.0.0",
        "author": "AfrexAI",
        "requires": { "bins": ["clawhub"] },
        "install": [
          {
            "id": "clawhub",
            "kind": "node",
            "package": "clawhub",
            "bins": ["clawhub"],
            "label": "Install ClawHub CLI"
          }
        ]
      }
  }
---

# AfrexAI Skill Publisher

Autonomously create, validate, and publish OpenClaw skills to ClawHub.

## Quick Reference

### Publish an existing skill directory

```bash
clawhub publish ./path/to/skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

### Convert content to a skill then publish

```bash
bash workflows/step1-skills/content-to-skill.sh \
  --input content.md \
  --name my-skill \
  --category productivity \
  --publish
```

### Scaffold, validate, and publish a new skill

```bash
bash workflows/step1-skills/skill-publish-pipeline.sh \
  --name my-skill \
  --display-name "My Skill" \
  --description "What it does" \
  --category productivity \
  --version 1.0.0
```

Add `--dry-run` to validate without publishing.

## Skill Directory Structure

Every ClawHub skill MUST have this structure:

```
my-skill/
├── SKILL.md          # Required — frontmatter + instructions
├── README.md         # Recommended — install docs
├── scripts/          # Optional — executable scripts
│   └── main.sh
├── assets/           # Optional — images, configs
└── docs/             # Optional — extended documentation
    └── source.md
```

## SKILL.md Format

The SKILL.md file is the skill definition. It MUST contain YAML frontmatter:

```markdown
---
name: my-skill
description: Short description (under 200 chars)
metadata:
  {
    "openclaw":
      {
        "emoji": "🔧",
        "category": "productivity",
        "version": "1.0.0",
        "author": "AfrexAI"
      }
  }
---

# Display Name

Description paragraph.

## Usage

How to use this skill.

## Configuration

Any required setup.
```

### Required frontmatter fields
- `name` — lowercase slug matching directory name (e.g. `my-skill`)
- `description` — short text, max 200 characters

### Valid categories
productivity, automation, integration, analytics, communication, devops, finance, marketing, other

## Validation Checklist

Before publishing, verify:

1. `SKILL.md` exists with valid YAML frontmatter
2. `name` field matches directory name
3. `description` is non-empty and under 200 chars
4. Version is valid semver (X.Y.Z)
5. Category is from the valid list above
6. No secrets or API keys in any files

## Authentication

```bash
clawhub login    # Interactive login
clawhub whoami   # Verify auth
```

## Workflow Scripts

All scripts are in `workflows/step1-skills/`:

| Script | Purpose |
|--------|---------|
| `skill-publish-pipeline.sh` | Scaffold → validate → publish |
| `content-to-skill.sh` | Convert markdown → skill structure |
| `customer-onboard-cma.sh` | Onboard a CMA customer with recommended skills |
| `skill-analytics.sh` | Pull install/rating stats from ClawHub |

## Publishing Workflow (Step by Step)

1. **Prepare content** — Write or gather the skill content
2. **Structure** — Use `content-to-skill.sh` or manually create the directory
3. **Edit SKILL.md** — Refine instructions, add examples
4. **Validate** — Run pipeline with `--dry-run` to check structure
5. **Publish** — Run pipeline without `--dry-run` or use `clawhub publish` directly
6. **Verify** — Run `clawhub search <name>` to confirm listing

## Tips

- Keep SKILL.md focused — it's loaded into agent context, so brevity matters
- Put extended docs in `docs/` subdirectory
- Use `scripts/` for any executable automation the skill provides
- Test locally by symlinking into your OpenClaw skills directory
