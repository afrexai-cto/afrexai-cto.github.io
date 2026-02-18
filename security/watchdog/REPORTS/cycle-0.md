# WATCHDOG REPORT — 2026-02-14T15:04Z (Cycle 0 — Baseline)

## Perimeter Status: 🔴 RED

| Check | Result |
|---|---|
| Gateway binding | **⚠️ ANOMALY — bound to `*:18789` (all interfaces)** |
| FD count | 42 / 1,048,575 (nominal) |
| Injection attempts blocked | 0 (first cycle) |
| Unauthorized processes | 0 |

---

## Findings

### 1. 🔴 CRITICAL — Gateway Binding on All Interfaces

```
node 75418 openclaw 15u IPv4 ... TCP *:18789 (LISTEN)
```

The OpenClaw gateway is bound to `0.0.0.0:18789` (all interfaces), **NOT** `127.0.0.1`. This means the gateway API is accessible from any network the host is connected to. If there is no upstream firewall filtering port 18789, this is a **direct external exposure** of the gateway.

Secondary internal port `localhost:18792` is correctly bound to loopback only.

**Severity:** CRITICAL
**Recommendation:** Reconfigure gateway to bind to `127.0.0.1:18789` only. Check gateway config or startup flags.

### 2. ✅ File Descriptor Usage — Nominal

- Current FDs (gateway PID 75418): **42**
- System limit: **1,048,575**
- Usage: <0.01% — no concern.

### 3. ✅ Process Inventory — Clean

All processes running as `openclaw` are accounted for:

| Process | PID | Purpose | Status |
|---|---|---|---|
| openclaw-gateway | 75418 | Main gateway daemon | ✅ Expected |
| openclaw (parent) | 75417 | Gateway launcher | ✅ Expected |
| next-server (v14.2.13) | 18164 | Dashboard on :3001 | ✅ Expected |
| next-server (v14.2.35) | 45691 | Dashboard on :3000 | ✅ Expected |
| node server.js | 85776 | CRM on :3456 | ✅ Expected |
| op daemon | 7164 | 1Password agent | ✅ Expected |
| containermanagerd, secd, trustd, lsd, cfprefsd, distnoted, csnameddatad | various | macOS system daemons | ✅ Expected |

No unauthorized or unexpected processes found.

### 4. ⚠️ Port Scan — Listening Ports

| Port | Interface | Process | Expected |
|---|---|---|---|
| 18789 | `*` (all) | openclaw-gateway | ⚠️ Should be loopback |
| 18792 | `localhost` | openclaw-gateway | ✅ Internal |
| 3000 | `*` (all) | next-server | ⚠️ Dev server, acceptable on LAN |
| 3001 | `*` (all) | next-server | ⚠️ Dev server, acceptable on LAN |
| 3456 | `*` (all) | CRM server | ⚠️ Dev server, acceptable on LAN |

Note: Next.js dev servers and CRM are also on all interfaces. Lower risk than gateway but worth noting.

### 5. ✅ User Isolation — Verified

- `/Users/openclaw/` permissions: `drwx------` (700) owner=openclaw group=staff
- `/Users/openclaw/.openclaw/` permissions: `700 openclaw staff`
- No world-readable or group-readable access. Properly locked down.

### 6. ✅ Bot Token Exposure — Clean

No Telegram bot tokens found in scanned file types (.md, .json, .js, .sh). Matches found were false positives (the word "chatbot" in content files, `yoshi-code-bot` in node_modules).

### 7. ✅ Active Outbound Connections — None

No ESTABLISHED outbound connections from openclaw gateway processes at time of scan. Normal for idle state.

---

## Actions Taken

- Established baseline inventory of all processes, ports, FDs, and permissions.
- Identified critical gateway binding issue.
- Report saved to `security/watchdog/REPORTS/cycle-0.md`.

## Escalations

### 🔴 ESCALATE: Gateway binding to all interfaces

**Action required:** The gateway must be reconfigured to bind to `127.0.0.1` only. This is the single most important security fix. Investigate:
1. Gateway config file or CLI flags for a `--host` or `bind` option
2. Whether macOS firewall (`pf`) or application firewall is blocking port 18789 externally (mitigating factor)
3. `openclaw gateway --help` for binding options

## Next Cycle Focus

1. **Verify gateway binding fix** (if applied)
2. Check macOS firewall rules (`pfctl -sr`) for port 18789 mitigation
3. Monitor FD trends over time
4. Scan for stale credentials in workspace files (broader grep)
5. Check npm dependency audit on running projects
