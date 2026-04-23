---
phase: 137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled
plan: "01"
subsystem: spec-authoring
tags: [nubs, napplet-nubs, git, branch-setup, merge, NUB-IDENTITY, NUB-CLASS-1, cross-repo]

# Dependency graph
requires:
  - phase: 135-first-party-types-sdk-plumbing
    provides: IdentityDecryptErrorCode 8-value union, Rumor type, IdentityDecryptMessage triad (wire vocabulary the amendment ratifies)
  - phase: 136-empirical-csp-injection-block-verification
    provides: 136-PHASE-NOTES.md with 7 literal-string grep-verified observations (violatedDirective='script-src-elem', documentURI='data' scheme-only quirk, sourceFile=null inline-injection quirk) — substrate for Security Considerations prose on waves 2+

provides:
  - Local branch `nub-identity-decrypt` on `~/Develop/nubs` with both `NUB-IDENTITY.md` (212 lines) and `NUB-CLASS-1.md` (60 lines) present as unchanged source-of-truth copies
  - Merge commit `031c7fa` bundling the two draft-branch tips per CLASS1-03
  - Clean working tree on the amendment branch ready for waves 2-4 amendment authoring
  - Zero push / zero PR (human gated per `feedback_no_private_refs_commits`)

affects:
  - 137-02 (NUB-IDENTITY amendment body authoring — decrypt triad + Security Considerations)
  - 137-03 (NUB-CLASS-1 amendment body authoring — report-to SHOULD + violation-correlation MUST)
  - 137-04 (hygiene grep gate + merge-commit-SHA traceability)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-draft-branch bundling pattern: `git checkout -b <bundle> <branchA> && git merge --no-ff <branchB>` when master has neither file and both draft branches touch disjoint file sets"
    - "--no-ff merge over rebase when the history should reflect BOTH source branches as reachable parents (auditability over linearity)"
    - "Plan-time snapshot verification: `git ls-tree <branch> -- <files>` pre-flight gate that catches drift between planning state and execution state before any mutation"

key-files:
  created:
    - "/home/sandwich/Develop/nubs/NUB-CLASS-1.md (60 lines) — brought onto amendment branch via merge; blob SHA e1b3023d unchanged from nub-class-1 tip"
    - ".planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-01-SUMMARY.md"
  modified:
    - "/home/sandwich/Develop/nubs/README.md (registry-table row added via merge; preserves both NUB-IDENTITY + NUB-CLASS-1 rows)"
  # NUB-IDENTITY.md already present via branch-from-nub-identity; blob SHA 7859ee7e unchanged — NOT listed as created/modified.

key-decisions:
  - "Bundle strategy executed via merge-based approach (not rebase): `git merge --no-ff nub-class-1` preserves both source branches' commits as reachable parents of the amendment branch, so the eventual PR reads as 'amendment to both specs' rather than 'rewrite of one draft with the other appended'"
  - "Branch base = `nub-identity` (not `nub-class-1`, not `master`): order is arbitrary given both are draft branches, but nub-identity was chosen as the base since NUB-IDENTITY is the primary amendment target (decrypt triad = the load-bearing new surface; NUB-CLASS-1 amendment is smaller — 2 rows)"
  - "Zero conflict resolution needed: the two draft branches touch disjoint file sets at the NUB spec level. README.md registry-row changes from both sides composed cleanly via 3-way merge"
  - "Merge commit message `chore: bundle nub-identity + nub-class-1 branches for Phase 137 amendment` — no `spec:` / `docs:` prefix since the merge adds zero spec content; chore: truthfully describes the operation"
  - "Hygiene verified on the branch commit graph ahead of master: zero `@napplet/*` / `kehto` / `hyprgate` matches in 6 commit messages AND in the entire diff vs master (3 files: NUB-CLASS-1.md, NUB-IDENTITY.md, README.md)"

patterns-established:
  - "Amendment-branch setup pattern: when master has neither file and two draft branches host them, `checkout -b <bundle> <primary-draft>` then `merge --no-ff <secondary-draft>` is the minimal-history-preserving move. Reusable for future CLASS1-03-style bundled amendments"
  - "Public-repo no-push discipline: execute all git operations locally, verify `git config --get branch.<name>.remote` returns empty (NO_REMOTE_CONFIGURED) before reporting complete. Remote push is a separate human-gated action"

requirements-completed:
  - NUB-IDENTITY-07
  - CLASS1-03

# Metrics
duration: 3min
completed: 2026-04-23
---

# Phase 137 Plan 01: Amendment-Branch Setup Summary

**Local branch `nub-identity-decrypt` on `~/Develop/nubs` created by merging `nub-class-1` into `nub-identity`, producing a clean merge base with BOTH spec files present and zero amendment content yet — ready for waves 2-4.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-23T14:19:35Z (from STATE.md Phase 137 kickoff)
- **Completed:** 2026-04-23T14:21:13Z
- **Tasks:** 1
- **Files modified in `~/Develop/nubs`:** 3 (NUB-CLASS-1.md added, NUB-IDENTITY.md present-unchanged, README.md registry row merged)
- **Files created in napplet planning:** 1 (this SUMMARY.md)

## Accomplishments

- Created local branch `nub-identity-decrypt` on `~/Develop/nubs` based from `nub-identity` (verified starting state: nub-media checked out, clean working tree, two draft branches unchanged, master has NEITHER NUB file)
- Merged `nub-class-1` into `nub-identity-decrypt` via `--no-ff` merge, producing merge commit `031c7fa` with subject `chore: bundle nub-identity + nub-class-1 branches for Phase 137 amendment`
- Zero merge conflicts — draft branches touch disjoint NUB files; README.md registry-row edits composed cleanly via 3-way merge
- Verified both `NUB-IDENTITY.md` (212 lines, blob `7859ee7e`) and `NUB-CLASS-1.md` (60 lines, blob `e1b3023d`) are present on the amendment branch as byte-identical copies of their draft-branch originals
- Verified both source draft branches remain unchanged — `nub-identity` still has only NUB-IDENTITY.md; `nub-class-1` still has only NUB-CLASS-1.md
- Confirmed zero push and zero PR: branch has no remote tracking configured (`git config --get branch.nub-identity-decrypt.remote` → NO_REMOTE_CONFIGURED); `gh pr list --head nub-identity-decrypt --repo napplet/nubs --state all` returns empty
- Hygiene grep on the full 3-file diff vs master: zero matches for `@napplet/`, `kehto`, `hyprgate` (exit 0 from `grep -iE`)

## Task Commits

Task 1 executes on `~/Develop/nubs` (the public nubs repo), NOT on `~/Develop/napplet`. The per-task commit landed on the `~/Develop/nubs` `nub-identity-decrypt` branch, not on napplet.

1. **Task 1: Create nub-identity-decrypt branch with both NUB files present** — `~/Develop/nubs` `031c7fa` (chore — merge commit)

Commits on `nub-identity-decrypt` ahead of `master` (6 total, all inherited from the two draft branches except the merge commit itself):

- `031c7fa` — chore: bundle nub-identity + nub-class-1 branches for Phase 137 amendment (THIS PLAN; merge commit)
- `abcccf3` — docs: clarify picture/banner URLs flow through NUB-RESOURCE (inherited from nub-identity)
- `31c89af` — fix: update NUB-CLASS-1 registry link to PR #17 (inherited from nub-class-1)
- `9bf7437` — docs: add NUB-CLASS-1 spec (strict baseline posture) (inherited from nub-class-1)
- `d05c19e` — Merge branch 'master' into nub-identity (inherited from nub-identity)
- `56795c9` — spec: add NUB-IDENTITY -- read-only user identity queries (inherited from nub-identity)

**Plan metadata commit** lands on `~/Develop/napplet` (THIS repo) after SUMMARY.md + STATE.md + ROADMAP.md updates, per plan-metadata commit protocol.

## Files Created/Modified

### On `~/Develop/nubs` (public repo, branch `nub-identity-decrypt`)

- `NUB-IDENTITY.md` (212 lines, blob `7859ee7e`) — present from branch-from-nub-identity; byte-identical to `nub-identity` tip. Untouched.
- `NUB-CLASS-1.md` (60 lines, blob `e1b3023d`) — brought onto branch via merge; byte-identical to `nub-class-1` tip. First appearance on this branch.
- `README.md` — registry-row composition via 3-way merge; preserves the NUB-IDENTITY row from the `nub-identity` branch side and adds the NUB-CLASS-1 row from the `nub-class-1` branch side.

### On `~/Develop/napplet` (this repo, napplet planning)

- `.planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-01-SUMMARY.md` (this file) — plan-completion record.

## Decisions Made

All decisions were executed per the plan's locked directives; zero craft-call divergences from the plan body.

Plan-executed locked decisions (re-stated here for traceability):

- **Branch-base = `nub-identity`, merge-in = `nub-class-1`** — locked in plan Step 3/4. Executed verbatim.
- **Merge strategy = `--no-ff`** — locked in plan Step 4 ("merge commit is explicit in history"). Executed verbatim.
- **Merge commit subject = "chore: bundle nub-identity + nub-class-1 branches for Phase 137 amendment"** — locked in plan Step 4. Executed verbatim.
- **Zero push / zero PR — human gated** — locked in plan Step 8 and phase success criteria. Executed verbatim (no `git push` command run; no `gh pr create` command run).

## Deviations from Plan

**None — plan executed exactly as written.**

No Rule 1 (bug), Rule 2 (missing critical), Rule 3 (blocking), or Rule 4 (architectural) triggers fired. The plan body directly mapped to 8 git/filesystem operations, all of which executed first-try without conflict or error.

## Issues Encountered

**None.**

## User Setup Required

**None.** This plan touches only local git state on `~/Develop/nubs` and produces one local planning artifact on `~/Develop/napplet`. No environment variables, no external service configuration.

## Push + PR Gate (Human Action)

Per `feedback_no_private_refs_commits` + CLASS1-03 + NUB-IDENTITY-07: this phase ships "diff authored and hygiene-clean on a local branch." The following actions are **NOT PERFORMED** by this plan and remain human-gated as shared-state writes:

```bash
# NOT RUN — human-gated. Listed here for the human who will open the PR:
git -C /home/sandwich/Develop/nubs push origin nub-identity-decrypt
gh pr create --repo napplet/nubs --base master --head nub-identity-decrypt \
  --title "NUB-IDENTITY: identity.decrypt + NUB-CLASS-1: report-to / violation-correlation (bundled per CLASS1-03)" \
  --body "<authored on wave 4 with final hygiene-clean body>"
```

Wave 4 (`137-04`) will stage the PR body text as a local artifact; the human runs the push and PR-create when ready.

## Next Phase Readiness

- **Wave 2 (137-02: NUB-IDENTITY amendment body) READY** — the amendment branch has `NUB-IDENTITY.md` in place for in-place editing with the decrypt triad + Security Considerations prose. All locked inputs from CONTEXT.md Decisions apply: DEC-02 return shape, DEC-04 8-code vocabulary, NUB-IDENTITY-05 three Security concerns, filename citation discipline for `NUB-CLASS-1.md`.
- **Wave 2 (137-03: NUB-CLASS-1 amendment body) READY** — the amendment branch has `NUB-CLASS-1.md` in place for in-place editing with the SHOULD `report-to` row + MUST violation-correlation row. CLASS1-01/02 locked; 136-PHASE-NOTES.md supplies empirical literal strings for the correlation prose.
- **No blockers** — working tree clean, branch local, both source drafts unchanged, hygiene pre-verified on the baseline (no amendment content yet = nothing to hygiene-fail on).

## Self-Check

Automated verification of SUMMARY claims:

```bash
# Branch exists and is checked out
git -C /home/sandwich/Develop/nubs rev-parse --abbrev-ref HEAD → nub-identity-decrypt ✓
# Both files present on branch
test -f /home/sandwich/Develop/nubs/NUB-IDENTITY.md ✓ FOUND (10015 bytes, 212 lines)
test -f /home/sandwich/Develop/nubs/NUB-CLASS-1.md ✓ FOUND (5160 bytes, 60 lines)
# Merge commit at HEAD with 'bundle' in subject
git -C /home/sandwich/Develop/nubs log --oneline -1 HEAD → 031c7fa chore: bundle ... ✓
# Source branches unchanged (blob SHA invariance)
nub-identity NUB-IDENTITY.md blob = 7859ee7e (same as amendment branch) ✓
nub-class-1  NUB-CLASS-1.md  blob = e1b3023d (same as amendment branch) ✓
# Zero push
git config --get branch.nub-identity-decrypt.remote → NO_REMOTE_CONFIGURED ✓
# Zero PR
gh pr list --head nub-identity-decrypt --repo napplet/nubs --state all → empty ✓
# Hygiene clean across branch commits ahead of master
git log master..nub-identity-decrypt --format='%H %s%n%b' | grep -iE '@napplet/|kehto|hyprgate' → HYGIENE_CLEAN (no matches) ✓
# Hygiene clean across diff vs master (3 files)
git diff master..nub-identity-decrypt | grep -iE '@napplet/|kehto|hyprgate' → exit 0, zero matches ✓
# SUMMARY.md file created
test -f .planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-01-SUMMARY.md ✓ (this file)
```

## Self-Check: PASSED

All 10 verification claims validated against git state and filesystem. No missing artifacts, no drift from plan-stated outcomes.

---
*Phase: 137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled*
*Plan: 01 — Amendment-branch setup*
*Completed: 2026-04-23*
