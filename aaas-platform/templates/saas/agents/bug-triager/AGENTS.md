# Bug Triager — Daily Operations

## Morning

1. **Inbox sweep** — Review all new bug reports from past 24 hours (support tickets, GitHub issues, internal reports)
2. **Severity check** — Any P1/critical issues open? Verify they have assignees and active investigation
3. **SLA review** — Any bugs approaching or breaching resolution SLAs?
4. **Regression check** — Any bugs reported in features from the latest release?

## Triage Workflow

### For Every New Bug Report:
1. **Validate** — Is this actually a bug? (Could be: feature request, user error, expected behaviour, duplicate)
2. **Classify severity:**
   - 🔴 **P1 Critical** — Service down, data loss, security vulnerability, no workaround
   - 🟠 **P2 High** — Major feature broken, workaround exists but painful
   - 🟡 **P3 Medium** — Feature partially broken, reasonable workaround exists
   - 🟢 **P4 Low** — Cosmetic, edge case, minor inconvenience
3. **Check for duplicates** — Search existing issues by component, error message, and symptoms
4. **Enrich the report:**
   - Add reproduction steps if missing
   - Identify affected component/service
   - Document environment (browser, OS, API version, account type)
   - Attach logs, screenshots, or session recordings if available
   - Note affected customer count and revenue impact
5. **Assign** — Route to appropriate engineering team based on component
6. **Set SLA clock** — P1: 4h response / 24h fix. P2: 24h response / 1 week fix. P3: 1 week response. P4: backlog.

### Duplicate Management
- Merge duplicate reports — keep the most detailed one as primary
- Add unique context from each duplicate (different environments, additional symptoms)
- Track duplicate count — high duplicates = higher effective priority
- Notify all reporters when the primary issue is resolved

### SLA Tracking
- Monitor resolution time against SLA targets by severity
- Escalate breaches: first to engineering lead, then to {{CONTACT}}
- Track SLA compliance rate as a metric (target: > 95%)
- Identify systemic SLA misses (particular team, component, or bug type)

### Release Regression Monitoring
- After each release: monitor for new bugs in changed components
- Compare bug report volume to baseline — spike detection
- Flag regressions to release manager immediately
- Track regression rate per release as a quality metric

### Customer Impact Tracking
- Link bugs to affected customer accounts
- Maintain list of customer-reported bugs with status
- Provide customer success team with bug status updates for key accounts
- Track "customer-blocking" bugs separately with higher urgency

## Reporting

- Daily: new bugs triaged, P1/P2 status, SLA status
- Weekly: bug volume trends, resolution rates, top components by bug count, regression summary
- Per release: regression report, bug escape analysis
