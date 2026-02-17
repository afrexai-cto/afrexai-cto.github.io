# Demo Files — QA Test Report

**Date:** 2026-02-17  
**Tester:** QA Subagent  

---

## index.html (Managed Agents Demo)

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | HTML validity | ✅ PASS | All tags properly closed, JS syntax valid |
| 2 | CSS variables | ✅ PASS | `--bg:#0a0a0a`, `--gold:#FFD700` correct |
| 3 | Calendly link | ✅ PASS | `https://calendly.com/cbeckford-afrexai/30min` — appears in CTA bar and upgrade CTA |
| 4 | Activity simulation | ✅ PASS | `ActivitySimulator` class with `setTimeout` (3–8s random), random agent/template selection, DOM prepend, KPI bumping every 10th item, status cycling via `setInterval` |
| 5 | Mobile responsive | ✅ PASS | Media query `@media(max-width:768px)` — hides sidebar, shows bottom nav, single-column grids |
| 6 | No external deps | ✅ PASS | Zero CDN links, all CSS/JS inline |
| 7 | 3 companies in data | ✅ PASS | Meridian Health Partners, Pacific Legal Group, BuildRight Construction |
| 8 | No localhost/test URLs | ✅ PASS | No hardcoded localhost or test URLs found |

### Bug Found & Fixed

- **Bottom nav mobile**: `Agents` button had `class="active"` alongside `Dashboard` on init — two buttons active simultaneously. **Fixed:** removed `class="active"` from Agents button.

---

## cma.html (Customer Managed Demo)

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | HTML validity | ✅ PASS | All tags properly closed, JS syntax valid |
| 2 | CSS variables | ✅ PASS | `--bg:#0a0a0a`, `--gold:#FFD700` correct |
| 3 | Calendly link | ✅ PASS | `https://calendly.com/cbeckford-afrexai/30min` in sidebar footer |
| 4 | Activity simulation | ✅ PASS | `setInterval(addFeedItem, 7000)` cycles through 20 feed items, ROI hours increment every 30s |
| 5 | Mobile responsive | ✅ PASS | Media query `@media(max-width:768px)` — sidebar off-screen with hamburger toggle, mobile bottom bar, single-column grids |
| 6 | No external deps | ✅ PASS | Zero CDN links, all CSS/JS inline |
| 7 | Skill library ~10 skills | ✅ PASS | Exactly 10 skills (6 installed + 4 available): Email Triager, Prospect Researcher, Invoice Processor, Meeting Scheduler, Competitor Intel, Weekly Reporter, Document Analyst, Client Health Monitor, Content Writer, SOW Generator |
| 8 | No localhost/test URLs | ✅ PASS | External links (`clawhub.com`, `openclaw.ai`) are product domains, not test URLs |

### No bugs found.

---

## Summary

| File | Checks | Passed | Failed | Bugs Fixed |
|------|--------|--------|--------|------------|
| index.html | 8 | 8 | 0 | 1 |
| cma.html | 8 | 8 | 0 | 0 |

**Overall: ✅ ALL CHECKS PASS**
