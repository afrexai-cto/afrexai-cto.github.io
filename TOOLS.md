# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Secrets — 1Password CLI

- **All credentials** go in 1Password vault "AfrexAI"
- Use `op read "op://AfrexAI/<Item>/<field>"` to inject at runtime
- Use `op run --env-file=op.env -- <command>` for multi-secret commands
- **NEVER** echo, cat, print, or log secret values
- **NEVER** store secrets in plain files
- Agent op.env files contain references only (e.g., `STRIPE_SK=op://AfrexAI/Stripe/secret_key`)
- Full guide: `docs/security/VAULT-GUIDE.md`
- Old vault files at `/Users/openclaw/.openclaw/vault/` — migrate to 1Password and delete

## Known Issues
- **Brave Search API** — Free tier quota exhausted (2000/2000). `web_search` tool returns 429. Use `web_fetch` as workaround or upgrade plan.

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
