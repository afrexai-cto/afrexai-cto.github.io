# Linter Validation Results

**Date:** 2026-02-19  
**Files scanned:** 34 (AGENTS.md, TOOLS.md, SOUL.md, 9 agent SOUL.md files, 22 skill SKILL.md files)  
**Total issues found:** 116

## Summary by Rule

| Rule | Count | Severity | Description |
|------|-------|----------|-------------|
| `no-caps-urgency` | 52 | warning | ALL-CAPS urgency markers (NEVER, ALWAYS, MUST, etc.) |
| `too-many-rules` | 31 | info | Files with >10 distinct rule-like items |
| `explain-why` | 23 | info | Short rules without visible reasoning |
| `negation-heavy` | 6 | info | Files with 5+ negation instructions |
| `no-if-in-doubt` | 4 | warning | "If in doubt" / "when unsure" fallback triggers |

## Coverage

- **33 of 34 files** had at least one issue
- Only 1 file passed clean

## Key Findings

### Most Common: ALL-CAPS Urgency (52 instances)
The most widespread pattern across the workspace. Words like "Never", "Always", "NEVER", "MUST" appear in nearly every agent SOUL.md and many SKILL.md files. These should be rewritten as calm instructions with reasoning.

### Too Many Rules (31 instances)
Many agent definitions pack in 15-25+ bullet points of behavioral rules. The model loses track after ~10. These should be consolidated — group related rules, remove redundant ones, and prioritize the most important behaviors.

### Missing Reasoning (23 instances)
Many rules are stated as bare imperatives ("Don't do X", "Always do Y") without explaining why. Adding a brief reason after each rule helps the model generalize to edge cases.

### "If In Doubt" Defaults (4 instances)
Found in AGENTS.md, SOUL.md, and bookkeeper SOUL.md. These broad fallback triggers cause over-triggering. Replace with specific conditions.

## Top Files to Improve

| File | Issues | Top problem |
|------|--------|-------------|
| `AGENTS.md` | 7 | Negation-heavy, caps urgency, too many rules |
| `SOUL.md` | 7 | Caps urgency, "if in doubt", negation-heavy |
| `agents/executive-assistant/SOUL.md` | 6 | Caps urgency, too many rules |
| `TOOLS.md` | 4 | Caps urgency (NEVER) |
| `agents/bookkeeper/SOUL.md` | 3 | Caps urgency, "if in doubt" |
| `agents/coo/SOUL.md` | 3 | Caps urgency, too many rules |

## Recommendation

Start with the highest-severity warnings (caps urgency and "if in doubt" defaults), then consolidate rules in the most bloated files. The guide at `GUIDE.md` has before/after examples for each pattern.
