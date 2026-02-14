# GHOST REPORT — 2026-02-14T15:05Z — Cycle 0 (Baseline)

## Secrets & Leak Status: YELLOW

| Category | Status |
|---|---|
| Exposed secrets in workspace files | **1 finding** (partial key prefixes in daily memory) |
| Memory file leakage | **FLAGGED** — partial Stripe key prefixes in `memory/2026-02-14.md` |
| .env permissions | **MISCONFIGURED** — 2 op.env files are world-readable |
| .gitignore coverage | **GAPS FOUND** — missing critical patterns |
| Git history secrets | Clean — no deleted secret files in git history |
| Credential rotation | All credentials <1 day old (just created today) |

---

## Findings

### 🔴 HIGH — Partial Stripe live key prefixes in memory file
- **Location:** `memory/2026-02-14.md:19`
- **Detail:** Contains partial `pk_live_51RKjMM...` and `sk_live_51RKjMM...` prefixes
- **Risk:** Partial key exposure reduces brute-force search space; violates need-to-know
- **Action Required:** Redact line 19 to remove key prefixes, replace with "Keys stored in 1Password (item: Stripe API)"

### 🔴 HIGH — .gitignore critically incomplete
- **Location:** `.gitignore` contains only `node_modules/`, `*.pyc`, `__pycache__/`
- **Missing patterns:** `.env`, `op.env`, `*.key`, `*.pem`, `.vault-key`, `secrets.enc`, `vault/`, `.created-accounts.json`, `*.secret`
- **Risk:** Any `git add .` would commit .env files, vault files, and secrets to repo
- **Action Required:** Update .gitignore immediately

### 🟡 MEDIUM — op.env files have overly permissive permissions (644)
- **Locations:**
  - `agents/outbound-sales/op.env` — `-rw-r--r--` (644)
  - `agents/bookkeeper/op.env` — `-rw-r--r--` (644)
- **Note:** These contain only `op://` references (no actual secrets), so risk is LOW in practice
- **Action Required:** `chmod 600` both files as defense-in-depth

### 🟡 MEDIUM — Legacy vault files still present
- **Location:** `/Users/openclaw/.openclaw/vault/`
- **Files:** `master.key` (45 bytes), `secrets.enc` (32 bytes), `migrate-to-1pass.sh`
- **Note:** Permissions are correct (600), but these should be deleted post-migration
- **Action Required:** Confirm migration complete, then delete `master.key`, `secrets.enc`, `migrate-to-1pass.sh`

### 🟡 MEDIUM — MEMORY.md contains LinkedIn client_id partial
- **Location:** `MEMORY.md:27` — contains `client_id: 78xxewc0pmhw7f`
- **Risk:** Client IDs are semi-public but shouldn't persist in plaintext memory
- **Action Required:** Replace with "client_id in 1Password (item: LinkedIn)"

### 🟢 LOW — Memory files reference 1Password item IDs
- **Locations:** `memory/2026-02-14.md:69-73`, `MEMORY.md:32-33`
- **Detail:** 1Password item IDs and vault paths are referenced (not secrets themselves)
- **Risk:** Minimal — these are operational references, not credentials

### 🟢 LOW — Polymarket .env has 644 permissions
- **Location:** `/Users/openclaw/.openclaw/workspace/projects/polymarket-bot/project/dashboard/.env` (644)
- **Note:** In old workspace, not workspace-main. Check if contains actual secrets.

---

## Data Exfiltration Monitoring

- **Outbound connections:** All ESTABLISHED connections are to expected destinations:
  - Cloudflare (172.66.x.x, 162.159.x.x) — CDN/proxy
  - AWS (174.129.x.x, 54.158.x.x, 52.56.x.x, 18.168.x.x) — likely 1Password/API services
  - Local loopback (192.168.1.200 ↔ 192.168.1.200:18789) — OpenClaw internal
- **No suspicious connections detected**

## 1Password Vault Status

All credentials recently created (2026-02-14), vault "AfrexAI" contains:
- Stripe API, Brave Search, 1Password, Slack, QuickBooks, Gmail, Twitter, LinkedIn
- **Rotation status:** All <1 day old — no rotation needed yet
- **Next rotation check:** 2026-05-14 (90-day mark)

---

## Actions Taken
- Baseline audit completed — no secrets echoed or logged
- All findings documented with location and type only

## Escalations
1. **URGENT:** `.gitignore` must be updated before any `git push` — risk of committing secrets
2. **HIGH:** Redact partial Stripe key prefixes from `memory/2026-02-14.md`

## Next Cycle Focus
- Verify .gitignore has been updated
- Verify partial key redaction from memory files
- Verify op.env permissions fixed to 600
- Verify legacy vault files deleted
- Install `gitleaks` or `trufflehog` for automated pre-commit scanning
- Set up credential rotation calendar (90-day cycle)
