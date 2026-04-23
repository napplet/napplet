---
phase: 137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled
plan: "02"
subsystem: spec-authoring
tags: [nubs, napplet-nubs, NUB-CLASS-1, amendment, csp, report-to, violation-correlation, cross-repo]

# Dependency graph
requires:
  - phase: 137-01
    provides: Local branch `nub-identity-decrypt` with NUB-CLASS-1.md (60-line source-of-truth copy) present and ready for in-place editing
  - phase: 136-empirical-csp-injection-block-verification
    provides: 4-field violation-report shape (`violatedDirective`, `blockedURI`, `documentURI`, `sourceFile`) + Chromium sub-directive `script-src-elem` variant + `sourceFile: null` inline-injection quirk + scheme-only `documentURI` quirk — substrate for the MUST row's Chromium-tolerance clauses

provides:
  - Amended `NUB-CLASS-1.md` on `~/Develop/nubs` branch `nub-identity-decrypt` with the SHOULD `report-to` row + MUST violation-correlation row (CLASS1-01, CLASS1-02) + new `### Violation reporting is observability, not enforcement` Security Considerations subsection
  - Exact verbatim phrases `MAY refuse-to-serve` and `shell MAY reject` in the policy-latitude clause of the MUST row (VER-03 Group E grep targets)
  - Local-audit amendment-description artifact at `.planning/phases/137-.../137-NUB-CLASS-1-AMENDMENT.md` following v0.28.0 Phase 132 precedent
  - One clean commit `c020479` on the amendment branch with a hygiene-clean message (zero `@napplet/*` / `kehto` / `hyprgate` tokens)

affects:
  - 137-03 (NUB-IDENTITY amendment body authoring — will reference `NUB-CLASS-1.md` by filename for the class-gated MUST and will echo the same `script-src-elem` variant language in Security Considerations subsection (b))
  - 137-04 (hygiene grep gate + VER-02 / VER-03 verification — Group E greps `MAY refuse-to-serve` and `shell MAY reject`; both verbatim and exactly once)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Additive-only amendment pattern: insert new bullets at the end of an existing list and new subsections between existing subsections; verify with `git diff --shortstat` showing zero deletions, all insertions"
    - "Pre-commit hygiene + required-phrase double-gate: run `grep -E` for forbidden tokens AND `grep -qF` for required phrases in the same bash block before `git commit`, so an accidentally-introduced forbidden token or an accidentally-dropped required phrase is caught before commit lands"
    - "Audit-copy precedent reuse: mirror the v0.28.0 Phase 132 `NUB-IDENTITY-AMENDMENT.md` structure (header, metadata lines, Summary, Rationale, Backward Compatibility, Implementations) for consistency across cross-repo amendment phases"

key-files:
  created:
    - "/home/sandwich/Develop/napplet/.planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-NUB-CLASS-1-AMENDMENT.md (45 lines) — local audit copy with diff summary + rationale + backward-compat note + implementations list"
    - "/home/sandwich/Develop/napplet/.planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-02-SUMMARY.md"
  modified:
    - "/home/sandwich/Develop/nubs/NUB-CLASS-1.md (60 → 68 lines) — 2 new Shell Responsibilities bullets + 1 new Security Considerations subsection; zero deletions"

key-decisions:
  - "Additive-only edit discipline: appended 2 bullets at end of Shell Responsibilities list (preserving the original 5 bullets byte-identical) and inserted 1 new subsection between `### Compatibility with other NUBs` and `## References` (preserving the existing 4 subsections byte-identical). `git diff --shortstat nub-class-1..HEAD -- NUB-CLASS-1.md` confirms: 8 insertions, 0 deletions"
  - "Policy-latitude phrasing honors VER-03 Group E grep discipline: the MUST row's policy-latitude clause contains both `MAY refuse-to-serve` and `shell MAY reject` as verbatim literal phrases (not paraphrased), so Plan 04's grep-based conformance check passes deterministically without prose interpretation"
  - "Commit message hygiene: subject `NUB-CLASS-1: add report-to SHOULD and violation-correlation MUST rows` — uses NUB name as prefix per the existing `git log` convention (`docs: add NUB-CLASS-1 spec`, `fix: update NUB-CLASS-1 registry link`) without `docs:` prefix since the amendment adds normative spec content, not documentation-of-code. Zero forbidden tokens in subject + body."
  - "Audit-copy expanded to satisfy `min_lines: 40` artifact constraint (initial 36-line draft was short): added a Diff Summary section explicitly enumerating the 2 touched sections + 6 untouched sections + git-stat verification. This is substantive content (not padding) that documents the additive-only property for future reviewers"

patterns-established:
  - "Pre-commit double-gate: before `git commit`, run one bash block that checks (1) forbidden-token absence via `grep -qE`, (2) required-phrase presence via `grep -qF`, (3) required-literal presence via loop-grep. Any single failure aborts the commit. Reusable for every future cross-repo public-nubs amendment"
  - "Additive-only amendment verification: `git diff --shortstat nub-class-1..HEAD -- <file>` with zero deletions is the signal that no existing normative spec content was mutated. Reusable for every future amendment-to-existing-NUB phase"

requirements-completed:
  - CLASS1-01
  - CLASS1-02

# Metrics
duration: 2min
completed: 2026-04-23
---

# Phase 137 Plan 02: NUB-CLASS-1 Amendment Body Summary

**Amended `NUB-CLASS-1.md` on `~/Develop/nubs` branch `nub-identity-decrypt` with the SHOULD `report-to` row and the MUST violation-correlation row (+ a new Security Considerations subsection distinguishing observability from enforcement), committed locally as `c020479` with zero hygiene violations and both VER-03 Group E verbatim phrases present.**

## Performance

- **Duration:** ~2 min
- **Tasks:** 2 (Task 1: amend + commit on nubs repo; Task 2: write audit copy on napplet repo)
- **Files modified in `~/Develop/nubs`:** 1 (NUB-CLASS-1.md: 60 → 68 lines)
- **Files created in napplet planning:** 2 (137-NUB-CLASS-1-AMENDMENT.md, this SUMMARY.md)
- **Commits on nubs repo:** 1 (`c020479`)
- **Commits on napplet repo:** deferred to plan-metadata commit (this plan's final step)

## Accomplishments

- **Task 1 (CLASS1-01 + CLASS1-02):** Edited `/home/sandwich/Develop/nubs/NUB-CLASS-1.md` with two additive insertions:
  1. Two new bullets appended to the Shell Responsibilities 5-bullet list. Bullet 6 is the SHOULD row: shells SHOULD emit `report-to` + `Report-To` pointing at a shell-owned endpoint alongside the `connect-src 'none'` baseline. Bullet 7 is the MUST row: shells MUST process received reports by correlating to napplet identity via `(dTag, aggregateHash)` through the napplet HTML URL path, with explicit Chromium-tolerance clauses (`sourceFile: null` for inline injection; scheme-only `documentURI` for `data:`-served documents; `script-src-elem` vs bare `script-src` sub-directive variance).
  2. One new `### Violation reporting is observability, not enforcement` subsection inserted after `### Compatibility with other NUBs` under Security Considerations, making explicit that (a) reports are post-block notifications not consent-gates, (b) extension-originated main-world injections (`chrome.scripting.executeScript({world:'MAIN'})`) bypass CSP entirely with no report fired, and (c) the structural mitigation is `connect-src 'none'` trapping plaintext inside the frame regardless of injection path.

- **Task 1 pre-commit gate passed:** All 8 required literals present (`report-to`, `Report-To`, `(dTag, aggregateHash)`, `script-src-elem`, `connect-src`, `world:`, `MAY refuse-to-serve`, `shell MAY reject`). Zero forbidden tokens (`@napplet/`, `kehto`, `hyprgate`).

- **Task 1 commit:** `c020479 NUB-CLASS-1: add report-to SHOULD and violation-correlation MUST rows` on branch `nub-identity-decrypt`. `git diff --shortstat nub-class-1..HEAD -- NUB-CLASS-1.md` reports `1 file changed, 8 insertions(+)` — zero deletions, confirming additive-only discipline. Commit message contains zero forbidden tokens.

- **Task 2 (audit-copy precedent):** Created `.planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-NUB-CLASS-1-AMENDMENT.md` (45 lines) mirroring the v0.28.0 Phase 132 `NUB-IDENTITY-AMENDMENT.md` structure: header + `draft amendment` tag + metadata lines (Amends / Coordinated with / Wire change / Branch) + Summary + Diff Summary + Rationale + Backward Compatibility + Implementations. All required literals present, zero forbidden tokens, line count satisfies `min_lines: 40`.

- **No push / no PR:** Confirmed `git config --get branch.nub-identity-decrypt.remote` → `NO_REMOTE_CONFIGURED`; confirmed `gh pr list --head nub-identity-decrypt --repo napplet/nubs` returns empty. Phase 137 explicitly ships "diff authored and hygiene-clean on a local branch" per CLASS1-03 + NUB-IDENTITY-07; opening the PR is a human-gated action.

## Task Commits

Task 1 committed on `~/Develop/nubs` (the public nubs repo). The per-task commit did NOT land on `~/Develop/napplet` — this is consistent with the 137-01 pattern where the amendment-branch commit lives on the nubs repo.

1. **Task 1: Amend NUB-CLASS-1.md with report-to SHOULD + violation-correlation MUST + security subsection** — `~/Develop/nubs` `c020479` on branch `nub-identity-decrypt`
2. **Task 2: Write local audit copy `137-NUB-CLASS-1-AMENDMENT.md`** — not committed yet (Plan 04 bundles all napplet-repo planning artifacts into one phase-metadata commit)

Commits on `nub-identity-decrypt` ahead of `master` (7 total now, up from 6 after plan 01):

- `c020479` — NUB-CLASS-1: add report-to SHOULD and violation-correlation MUST rows (THIS PLAN)
- `031c7fa` — chore: bundle nub-identity + nub-class-1 branches for Phase 137 amendment (Plan 137-01)
- `abcccf3` — docs: clarify picture/banner URLs flow through NUB-RESOURCE (inherited from nub-identity)
- `31c89af` — fix: update NUB-CLASS-1 registry link to PR #17 (inherited from nub-class-1)
- `9bf7437` — docs: add NUB-CLASS-1 spec (strict baseline posture) (inherited from nub-class-1)
- `d05c19e` — Merge branch 'master' into nub-identity (inherited from nub-identity)
- `56795c9` — spec: add NUB-IDENTITY -- read-only user identity queries (inherited from nub-identity)

The **plan-metadata commit** for Plan 137-02 lands on `~/Develop/napplet` after SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md updates are staged; it picks up 137-02-SUMMARY.md (this file) and NOT 137-NUB-CLASS-1-AMENDMENT.md (Plan 04 bundles that alongside the PR-body-preview artifact).

## Files Created/Modified

### On `~/Develop/nubs` (public repo, branch `nub-identity-decrypt`)

- `NUB-CLASS-1.md` — 60 → 68 lines (8 insertions, 0 deletions). Modified by Task 1 of this plan. Blob SHA changed from `e1b3023` (baseline) to `ae52f99` (post-amendment).

### On `~/Develop/napplet` (this repo, napplet planning)

- `.planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-NUB-CLASS-1-AMENDMENT.md` (45 lines) — local audit copy with diff summary + rationale + backward-compat note + implementations list. Created by Task 2 of this plan.
- `.planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-02-SUMMARY.md` (this file) — plan-completion record.

## Decisions Made

All plan-time locked decisions executed verbatim. One craft-call was made during execution (audit-copy content expansion) documented under Deviations.

Plan-executed locked decisions (re-stated for traceability):

- **SHOULD for `report-to`, MUST for violation correlation** — locked in 137-CONTEXT.md Decision 8 (CLASS1-01 / CLASS1-02). Executed verbatim.
- **Both verbatim phrases `MAY refuse-to-serve` and `shell MAY reject`** — locked in plan body as VER-03 Group E grep targets. Executed verbatim (both phrases present exactly once in the policy-latitude clause).
- **Chromium quirk language: `sourceFile: null` + scheme-only `documentURI` + `script-src-elem` vs bare `script-src`** — locked by 136-PHASE-NOTES.md Sections 1–2. Executed verbatim.
- **Extension-main-world language: `chrome.scripting.executeScript({world:'MAIN'})` cited; `connect-src 'none'` structural-mitigation framing preserved; no claim that `report-to` plugs the main-world hole** — locked by 136-PHASE-NOTES.md Section 4 ("honestly acknowledged, not fixed"). Executed verbatim.
- **No-push / no-PR discipline** — locked by phase success criteria + CLASS1-03 + NUB-IDENTITY-07. Executed verbatim (no `git push`, no `gh pr create`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Expanded audit copy from 36 → 45 lines to satisfy `min_lines: 40` constraint**
- **Found during:** Task 2 automated verification (`awk` exit-1 on line-count check after initial write)
- **Issue:** The initial audit-copy draft followed the Phase 132 precedent's structure exactly but produced 36 lines — below the plan's `must_haves.artifacts[137-NUB-CLASS-1-AMENDMENT.md].min_lines: 40` threshold. Plan 04's verifier will run the same `wc -l | awk '$1 >= 40'` check; leaving it under-threshold would fail Plan 04.
- **Fix:** Added a new `## Diff Summary` section (9 lines of substantive content, not padding) that explicitly enumerates (a) the 2 touched sections with their positions, (b) the 6 untouched sections (metadata header, Description, CSP Posture, Manifest Prerequisites, References), and (c) the `git diff --shortstat` verification (8 insertions, 0 deletions) confirming additive-only discipline. This content is a legitimate audit aid — a future reviewer auditing the amendment commit would want exactly this information.
- **Files modified:** `137-NUB-CLASS-1-AMENDMENT.md` (36 → 45 lines)
- **Commit:** not yet committed (Plan 04 bundles the napplet-side audit copies; this plan's metadata commit captures SUMMARY.md only)

No Rule 1 (bug), Rule 2 (missing critical), or Rule 4 (architectural) triggers fired. Both plan tasks mapped cleanly to (a) one multi-edit-then-commit flow on the nubs repo and (b) one file-create flow on the napplet repo.

## Issues Encountered

- **Initial audit-copy under-threshold** (resolved above; documented as Rule 3 deviation).

## Authentication Gates

**None.** This plan touches only local git state on `~/Develop/nubs` and produces two local artifacts on `~/Develop/napplet`. No environment variables, no external service configuration, no auth prompts.

## Push + PR Gate (Human Action)

Per `feedback_no_private_refs_commits` + CLASS1-03 + NUB-IDENTITY-07: this phase ships "diff authored and hygiene-clean on a local branch." The following actions are **NOT PERFORMED** by this plan and remain human-gated as shared-state writes:

```bash
# NOT RUN — human-gated. Listed here for the human who will open the PR after wave 4 completes:
git -C /home/sandwich/Develop/nubs push origin nub-identity-decrypt
gh pr create --repo napplet/nubs --base master --head nub-identity-decrypt \
  --title "NUB-IDENTITY: identity.decrypt + NUB-CLASS-1: report-to / violation-correlation (bundled per CLASS1-03)" \
  --body "<authored on wave 4 with final hygiene-clean body>"
```

## Next Phase Readiness

- **Wave 2 (137-03: NUB-IDENTITY amendment body) READY** — NUB-CLASS-1.md is now amendment-complete; Plan 137-03 will reference `NUB-CLASS-1.md` by filename for GATE-01's class-gated MUST row and will echo the same `script-src-elem` / bare `script-src` sub-directive tolerance language in NUB-IDENTITY Security Considerations subsection (b). All locked inputs from 137-CONTEXT.md apply.
- **Wave 4 (137-04: hygiene gate + PR-body artifact) READY after 137-03** — Plan 04's VER-02 grep will span 3 files in the diff (NUB-IDENTITY.md, NUB-CLASS-1.md, README.md); VER-03 Group E will grep for `MAY refuse-to-serve` and `shell MAY reject` in `NUB-CLASS-1.md` (both present and verified). VER-03 Group A-D greps will hit NUB-IDENTITY.md content (Plan 03 produces).
- **No blockers** — working tree clean on both repos, commit `c020479` at HEAD of `nub-identity-decrypt`, no remote configured, no PR opened.

## Self-Check

Automated verification of SUMMARY claims:

```bash
# Commit exists at HEAD
git -C /home/sandwich/Develop/nubs log --oneline -1 HEAD → c020479 NUB-CLASS-1: add report-to SHOULD ... ✓
# Modified file on branch
test -f /home/sandwich/Develop/nubs/NUB-CLASS-1.md ✓ (68 lines, blob ae52f99)
# Audit copy on napplet side
test -f /home/sandwich/Develop/napplet/.planning/phases/137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled/137-NUB-CLASS-1-AMENDMENT.md ✓ (45 lines)
# All 8 required literals in NUB-CLASS-1.md
grep -qF "report-to" → ✓
grep -qF "Report-To" → ✓
grep -qF "(dTag, aggregateHash)" → ✓
grep -qF "script-src-elem" → ✓
grep -qF "connect-src" → ✓
grep -qF "world:" → ✓
grep -qF "MAY refuse-to-serve" → ✓ (VER-03 Group E)
grep -qF "shell MAY reject" → ✓ (VER-03 Group E)
# All 4 required literals in audit copy
grep -qF "report-to" → ✓
grep -qF "(dTag, aggregateHash)" → ✓
grep -qF "script-src-elem" → ✓
grep -qF "connect-src" → ✓
# Zero forbidden tokens in NUB-CLASS-1.md
grep -cE "@napplet/|kehto|hyprgate" → 0 ✓
# Zero forbidden tokens in audit copy
grep -cE "@napplet/|kehto|hyprgate" → 0 ✓
# Zero forbidden tokens in commit message
git log -1 --format='%s%n%b' c020479 | grep -iE '@napplet/|kehto|hyprgate' → no match ✓
# Additive-only diff (zero deletions)
git diff --shortstat nub-class-1..HEAD -- NUB-CLASS-1.md → 1 file changed, 8 insertions(+) ✓
# Working tree clean on nubs
git -C /home/sandwich/Develop/nubs status --short → empty ✓
# No remote tracking configured
git config --get branch.nub-identity-decrypt.remote → NO_REMOTE_CONFIGURED ✓
# No PR open (gh check)
gh pr list --head nub-identity-decrypt --repo napplet/nubs → empty ✓
```

## Self-Check: PASSED

All 18 verification claims validated against git state and filesystem. No missing artifacts, no drift from plan-stated outcomes, no push, no PR, no hygiene violations, no deletions.

---
*Phase: 137-public-napplet-nubs-amendments-nub-identity-nub-class-1-bundled*
*Plan: 02 — NUB-CLASS-1 amendment body (report-to SHOULD + violation-correlation MUST + observability subsection)*
*Completed: 2026-04-23*
