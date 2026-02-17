# Live Demo Agent System — Implementation Spec

> Generated: 2026-02-17 | Status: DRAFT

## 1. Architecture Decision: Option A — Git-Push JSON

**Choice: Agent → JSON → git push → GitHub Pages serves it**

Why:
- Zero external dependencies (no jsonbin accounts to expire)
- Already have SSH deploy key configured (`github-afrexai`)
- 5-10 min delay is fine for a demo — visitors see "last updated 3 min ago", feels live enough
- Git history doubles as an activity audit trail
- Commit spam is manageable: squash to 1 commit per push, force-push a `demo-data` orphan branch or just accept ~150 commits/day on main

**Mitigations for downsides:**
- Push only when data actually changes (diff check before commit)
- Single consolidated JSON file keeps commits atomic
- Add `Last-Modified` timestamp so frontend shows freshness

---

## 2. Data Flow

```
┌─────────────┐    cron 30min    ┌──────────────┐   cron 10min   ┌─────────────┐
│ Demo Agent   │───────────────→│ demo/data/   │──────────────→│ GitHub Pages│
│ (openclaw    │  writes JSON    │ activity.json│  git push      │ serves JSON │
│  cron job)   │                 └──────────────┘                └──────┬──────┘
└─────────────┘                                                        │
                                                                       ▼
                                                              ┌──────────────┐
                                                              │ Frontend JS  │
                                                              │ fetches JSON │
                                                              │ on load+poll │
                                                              └──────────────┘
```

**Two cron jobs:**
1. **Demo agent runner** (every 30 min): Processes sample data, appends to `activity.json`
2. **Git pusher** (every 10 min): If `activity.json` changed, commit + push

---

## 3. Activity Data Format

Single file: `demo/data/activity.json`

```json
{
  "lastUpdated": "2026-02-17T10:35:00Z",
  "companies": {
    "meridian-health": {
      "name": "Meridian Health Partners",
      "tier": "enterprise",
      "vertical": "healthcare",
      "kpis": {
        "tasksCompleted": 2847,
        "hoursSaved": 312,
        "accuracyRate": 99.2,
        "activeSince": "2026-01-15"
      },
      "agents": [
        {
          "id": "patient-coordinator",
          "name": "Patient Coordinator",
          "status": "active",
          "lastActive": "2026-02-17T10:32:15Z",
          "taskCount": 1205
        },
        {
          "id": "compliance-officer",
          "name": "Compliance Officer",
          "status": "active",
          "lastActive": "2026-02-17T10:28:00Z",
          "taskCount": 892
        },
        {
          "id": "records-analyst",
          "name": "Records Analyst",
          "status": "active",
          "lastActive": "2026-02-17T09:45:00Z",
          "taskCount": 750
        }
      ],
      "recentActivity": [
        {
          "ts": "2026-02-17T10:32:15Z",
          "agent": "patient-coordinator",
          "action": "Scheduled follow-up for Maria Santos — Cardiology",
          "type": "scheduling"
        }
      ]
    },
    "pacific-legal": { "..." : "same structure" },
    "buildright": { "..." : "same structure" }
  }
}
```

Keep `recentActivity` to last 50 entries per company (rolling window). KPIs increment over time and persist across runs.

---

## 4. Demo Agent Design

**NOT separate OpenClaw agent instances.** That would mean 7 extra agents on a MacBook already running 9. Instead:

### Single cron script: `demo/agents/run-demo.sh`

A lightweight shell script that invokes `openclaw` CLI (or a Node script) once per run. The script:
1. Reads sample data files
2. Picks a random task from each company's queue
3. "Processes" it (moves from pending → done, generates a realistic log entry)
4. Updates `demo/data/activity.json`
5. Increments KPIs

**This is a simulation with real file operations**, not 7 separate AI agents burning tokens. The demo proves the *platform* works — the agents don't need to actually call GPT to schedule a fake appointment.

### Optional: One REAL agent pass per day

For extra realism, run one actual OpenClaw agent invocation per day (via cron) that:
- Summarises a sample legal document
- Generates a compliance report
- Writes a site report

This creates genuinely AI-generated content in the activity feed. Budget: ~3 invocations/day × $0.02 = $0.06/day.

---

## 5. Sample Data

### File Structure

```
demo/
├── data/
│   └── activity.json          ← live data (git-tracked, auto-pushed)
├── agents/
│   ├── run-demo.sh            ← main cron script
│   ├── push-data.sh           ← git commit+push script
│   └── lib/
│       └── generate.js        ← Node script that does the actual work
└── sample-data/
    ├── meridian-health/
    │   ├── appointments.csv        ← 50 sample appointment requests
    │   ├── patients.csv            ← 100 sample patient names/details
    │   ├── policy-docs/
    │   │   ├── hipaa-policy-v3.txt
    │   │   ├── vendor-baa-list.csv
    │   │   └── access-log-sample.csv
    │   └── records-requests.csv    ← 30 sample records requests
    ├── pacific-legal/
    │   ├── calendar.csv            ← 40 upcoming deadlines/hearings
    │   ├── clients.csv             ← 25 client profiles
    │   ├── documents/
    │   │   ├── sample-contract.txt
    │   │   ├── sample-brief.txt
    │   │   └── sample-deposition.txt
    │   └── follow-ups.csv          ← 20 pending follow-up tasks
    └── buildright/
        ├── projects.csv            ← 5 active construction projects
        ├── daily-logs/
        │   └── template.txt
        ├── milestones.csv          ← project milestones
        └── weather.csv             ← weather conditions by site
```

---

## 6. Generator Logic (`generate.js`)

```javascript
// Pseudocode
const data = readJSON('demo/data/activity.json');

for (const company of ['meridian-health', 'pacific-legal', 'buildright']) {
  const numTasks = randomInt(1, 4); // 1-4 tasks per 30-min run
  for (let i = 0; i < numTasks; i++) {
    const agent = pickRandomAgent(company);
    const task = pickFromSampleData(company, agent);
    const activity = {
      ts: new Date().toISOString(),
      agent: agent.id,
      action: generateActionText(task),
      type: task.type
    };
    data.companies[company].recentActivity.unshift(activity);
    data.companies[company].kpis.tasksCompleted++;
    data.companies[company].kpis.hoursSaved += randomFloat(0.1, 0.5);
    // Update agent lastActive
    agent.lastActive = activity.ts;
    agent.taskCount++;
  }
  // Trim to 50 recent activities
  data.companies[company].recentActivity = 
    data.companies[company].recentActivity.slice(0, 50);
}

data.lastUpdated = new Date().toISOString();
writeJSON('demo/data/activity.json', data);
```

Action text uses the SAME templates already in `index.html` but fills them with real names from sample CSVs.

---

## 7. Frontend Modifications

### index.html changes (minimal):

```javascript
// Add at top of DemoEngine or before it:
let liveData = null;
async function fetchLiveData() {
  try {
    const r = await fetch('data/activity.json?_=' + Date.now());
    if (r.ok) liveData = await r.json();
  } catch(e) { /* fall back to generated */ }
}

// On load:
await fetchLiveData();
setInterval(fetchLiveData, 60000); // poll every 60s
```

Then in the activity feed renderer:
- If `liveData` exists, use `liveData.companies[slug].recentActivity` instead of generating fake entries
- If `liveData` exists, use `liveData.companies[slug].kpis` for the KPI cards
- If `liveData` exists, use `liveData.companies[slug].agents` for agent status dots
- **Fallback**: If fetch fails or data is >1 hour stale, use the existing fake generator (graceful degradation)

### cma.html changes:
Same pattern — fetch live data, fall back to generated.

**Key principle: Don't remove the fake data generator.** Keep it as fallback. The live data is an overlay.

---

## 8. Cron Schedule

```cron
# Demo agent — generate activity every 30 min (6am-midnight)
*/30 6-23 * * * /Users/openclaw/.openclaw/workspace-main/demo/agents/run-demo.sh

# Push data to GitHub Pages every 10 min (only if changed)
*/10 * * * * /Users/openclaw/.openclaw/workspace-main/demo/agents/push-data.sh
```

Using OpenClaw's cron system:
```
openclaw cron add --name "demo-activity" --schedule "*/30 6-23 * * *" --command "node demo/agents/lib/generate.js"
openclaw cron add --name "demo-push" --schedule "*/10 * * * *" --command "demo/agents/push-data.sh"
```

---

## 9. Push Script (`push-data.sh`)

```bash
#!/bin/bash
cd /Users/openclaw/.openclaw/workspace-main
if git diff --quiet demo/data/activity.json 2>/dev/null; then
  exit 0  # no changes
fi
git add demo/data/activity.json
git commit -m "📊 demo data update $(date +%H:%M)"
GIT_SSH_COMMAND="ssh -i ~/.ssh/afrexai-deploy -o IdentitiesOnly=yes" \
  git push github-afrexai main
```

---

## 10. Build Effort Estimate

| Task | Effort | Priority |
|------|--------|----------|
| Create sample data CSVs | 1 hour | P0 |
| Write `generate.js` | 2 hours | P0 |
| Write `push-data.sh` | 15 min | P0 |
| Seed initial `activity.json` | 15 min | P0 |
| Frontend: add fetch + fallback logic | 1 hour | P0 |
| Set up cron jobs | 15 min | P0 |
| Test end-to-end | 30 min | P0 |
| Optional: 1 real AI agent pass/day | 2 hours | P1 |
| **Total** | **~5-6 hours** | |

### Resource Impact
- **CPU/Memory**: Negligible — it's a Node script running for <2 seconds every 30 min
- **Tokens**: Zero (unless using the optional real agent pass)
- **Git**: ~144 commits/day max (acceptable for a demo repo)
- **Disk**: activity.json stays under 100KB

---

## 11. Rollout Plan

1. **Phase 1** (build, ~half day): Sample data + generator + push script + frontend changes
2. **Phase 2** (activate): Enable cron jobs, verify data flows to GitHub Pages
3. **Phase 3** (optional): Add 1 real AI agent pass/day for genuine AI-generated content

---

## Open Questions

- [ ] Should the demo show a "Live" badge with last-updated timestamp?
- [ ] Do we want the activity feed to animate new entries in, or just refresh?
- [ ] Should KPIs reset monthly or grow indefinitely?
- [ ] Git remote name — is it `github-afrexai` or something else? Verify with `git remote -v`
