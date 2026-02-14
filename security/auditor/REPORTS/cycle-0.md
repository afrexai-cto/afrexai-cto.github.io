# AUDITOR REPORT — 2026-02-14T15:04Z

## Supply Chain Status: 🟡 YELLOW

- **Framework version:** OpenClaw 2026.2.9
- **Skills integrity:** 52 skills inventoried, all hashed — baseline established (no prior hashes to compare)
- **Dependencies:** 223 total (82 crm + 53 agent-account-creator + 88 outbound), 0 vulnerabilities across all projects

---

### Skills Inventory

**Location:** `/usr/local/lib/node_modules/openclaw/skills/` (52 skills)
**User overrides:** `/Users/openclaw/.openclaw/skills/` — empty (all skills are stock)

Skills list: 1password, apple-notes, apple-reminders, bear-notes, blogwatcher, blucli, bluebubbles, camsnap, canvas, clawhub, coding-agent, discord, eightctl, food-order, gemini, gifgrep, github, gog, goplaces, healthcheck, himalaya, imsg, local-places, mcporter, model-usage, nano-banana-pro, nano-pdf, notion, obsidian, openai-image-gen, openai-whisper, openai-whisper-api, openhue, oracle, ordercli, peekaboo, sag, session-logs, sherpa-onnx-tts, skill-creator, slack, songsee, sonoscli, spotify-player, summarize, things-mac, tmux, trello, video-frames, voice-call, wacli, weather

### Hash Registry

**Created:** `security/auditor/HASH-REGISTRY.json`
- 60 files hashed (SKILL.md, reference .md, .sh scripts)
- Baseline cycle — all hashes are reference values for future drift detection

### npm Audit Results

| Project | Dependencies | Vulnerabilities |
|---------|-------------|----------------|
| crm/ | 82 (prod) | 0 |
| agent-account-creator/ | 53 (prod) | 0 |
| outbound/ | 88 (prod) | 0 |

**Status: All clean.** No known CVEs in any dependency tree.

### Skill File Analysis

All 52 SKILL.md files reference CLI tools via shell commands — this is expected and by design. Skills are documentation-only (markdown instructions for the agent), not executable code.

**Scripts found (4 total):**
- `video-frames/scripts/frame.sh` — frame extraction script
- `tmux/scripts/wait-for-text.sh` — tmux helper
- `tmux/scripts/find-sessions.sh` — tmux helper
- `openai-whisper-api/scripts/transcribe.sh` — audio transcription

**Assessment:** All scripts are utility helpers for their respective skills. No obfuscated code, no embedded prompt injections, no suspicious outbound network calls beyond expected API endpoints.

### Git Repo Integrity

- **Remote:** `origin` → `github.com/afrexai-cto/afrexai-cto.github.io.git`
- **Last 10 commits:** All appear legitimate (AfrexAI website content)
- **Latest:** `e1c110c` — Add 7 new pages

### Auto-Update Cron

- No crontab entries found
- No OpenClaw-related launchctl services detected
- **No automatic update mechanisms in place** — manual updates only

### CVE Alerts

None. All dependency trees clean as of this scan.

---

## 🚨 CRITICAL FINDING

### Exposed GitHub Personal Access Token

**Severity: CRITICAL**

The git remote URL for the workspace repo contains an embedded GitHub PAT in plaintext:

```
origin https://ghp_KWPM****1VAM@github.com/afrexai-cto/afrexai-cto.github.io.git
```

**Risks:**
1. Any process that reads git config can extract this token
2. Token is visible in `git remote -v` output, process lists, logs
3. If workspace is ever shared/committed elsewhere, token leaks
4. Token provides push access to the afrexai-cto GitHub org

**Recommended remediation:**
1. Rotate this PAT immediately on GitHub
2. Use SSH keys or credential helper instead: `git remote set-url origin git@github.com:afrexai-cto/afrexai-cto.github.io.git`
3. Audit GitHub token scopes and access logs for unauthorized use

---

### Actions Taken

1. ✅ Full skills inventory completed (52 skills)
2. ✅ SHA-256 hash registry created (60 files baselined)
3. ✅ npm audit run on all 3 projects (0 vulnerabilities)
4. ✅ Skill file content analysis (no suspicious patterns)
5. ✅ OpenClaw version recorded (2026.2.9)
6. ✅ Git integrity checked
7. ✅ Dependency tree scanned
8. ✅ Cron/auto-update check completed
9. 🚨 Identified exposed GitHub PAT in git remote URL

### Escalations

- **ESCALATE TO HUMAN:** GitHub PAT exposed in plaintext in git remote config. Requires immediate rotation.

### Next Cycle Focus

1. **Verify PAT remediation** — confirm token was rotated and remote URL updated
2. **Hash drift detection** — compare against baseline hashes from this cycle
3. **OpenClaw version check** — verify framework is up to date
4. **Deep script audit** — manual review of the 4 shell scripts for any changes
5. **npm audit re-run** — check for newly disclosed CVEs
