---
phase: 142-verification-milestone-close
plan: 01
subsystem: infra
tags: [verification, build-gate, type-check, changeset, doc-check, zero-grep]

# Dependency graph
requires:
  - phase: 136-core-type-surface
    provides: NubDomain + NappletGlobal extensions (connect, class) that must type-check
  - phase: 137-nub-connect-class-subpaths
    provides: @napplet/nub/connect + @napplet/nub/class 4-file subpaths whose build+types must resolve cleanly
  - phase: 138-vite-plugin-strict-csp-removal
    provides: strictCsp deprecation + connect option + inline-script diagnostic under test in the changeset text
  - phase: 139-central-shim-sdk-integration
    provides: window.napplet.connect + window.napplet.class bootstrap (whose type-check must be green)
  - phase: 140-shell-policy-documents
    provides: SHELL-CONNECT-POLICY.md + SHELL-CLASS-POLICY.md referenced from the changeset migration path
  - phase: 141-documentation-sweep
    provides: README updates + skill updates whose v0.29.0 posture must match the changeset wording
  - phase: 135-cross-repo-spec-work
    provides: 4 draft spec files (NUB-CONNECT, NUB-CLASS, NUB-CLASS-1, NUB-CLASS-2) that VER-08 re-verifies

provides:
  - "VER-01 build gate pass — pnpm -r build exit 0 across all 14 workspace packages"
  - "VER-02 type-check gate pass — pnpm -r type-check exit 0 across all 14 workspace packages"
  - "VER-08 cross-repo zero-grep audit clean — 0 matches for @napplet/|kehto|hyprgate|packages/(nub|shim|sdk|vite-plugin) across 4 draft specs"
  - "VER-09 changeset authored — .changeset/v0.29.0-nub-connect-class.md with 5 first-party minor bumps and loud breaking-change prose"
  - "VER-10 PROJECT.md doc-check pass — v0.29.0 milestone block + Option B + downstream shell references all present"

affects: [142-02-nub-shim-tests, 142-03-milestone-close]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mechanical VER gates emit /tmp/ evidence logs per AGENTS.md no-home-dir-pollution rule"
    - "Changeset frontmatter bumps ONLY first-party packages; deprecated re-export shims inherit via transitive dep (matches v0.26.0 precedent)"
    - "VER-08 re-verification as a separate gate (independent of Phase 135 authorship sweep) so stale/modified drafts are caught"

key-files:
  created:
    - .changeset/v0.29.0-nub-connect-class.md
    - /tmp/napplet-ver-01.log
    - /tmp/napplet-ver-08-zerogrep.log
    - /tmp/napplet-ver-10-doc-check.log
    - .planning/phases/142-verification-milestone-close/142-01-SUMMARY.md
  modified: []

key-decisions:
  - "Changeset bumps 5 first-party packages (core, nub, sdk, shim, vite-plugin) minor — deprecated @napplet/nub-<domain> shims inherit transitively per v0.26.0 precedent"
  - "Evidence logs live in /tmp/ not the repo (AGENTS.md no-home-dir-pollution); changeset is the only committed artifact"
  - "VER-08 grep counter uses `grep -cE … || true` + `tr -d '[:space:]'` to avoid grep's dual-exit-path output (the `|| echo 0` form observed in the plan text double-prints on empty files)"

patterns-established:
  - "VER gate scripts write single-file summary log with KEY=VALUE lines that downstream verifier scripts grep for"
  - "Changeset prose front-loads breaking-change section, then new surface, then guidance, then migration path (4 numbered steps)"

requirements-completed: [VER-01, VER-02, VER-08, VER-09, VER-10]

# Metrics
duration: ~4min
completed: 2026-04-21
---

# Phase 142 Plan 01: Terminal Gates Summary

**Five VER gates closed mechanically — workspace build + type-check green across 14 packages, 4-file zero-grep audit clean, v0.29.0 changeset authored with 5 first-party minor bumps and loud breaking-change prose, PROJECT.md downstream-shell doc-check pass.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-21T18:26:38Z (plan created)
- **Completed:** 2026-04-21T18:30:00Z
- **Tasks:** 3
- **Files modified:** 1 (the changeset)

## Accomplishments

- **VER-01 + VER-02 (build + type-check):** `pnpm -r build` and `pnpm -r type-check` both exit 0 across all 14 workspace packages (5 first-party + 9 deprecated re-export shims). Evidence at `/tmp/napplet-ver-01.log` with `BUILD_EXIT=0`, `TC_EXIT=0`, `PACKAGE_COUNT=14`.
- **VER-08 (cross-repo zero-grep):** All 4 draft specs in `.planning/phases/135-cross-repo-spec-work/drafts/` (NUB-CONNECT.md, NUB-CLASS.md, NUB-CLASS-1.md, NUB-CLASS-2.md) report 0 matches for the union pattern `@napplet/|kehto|hyprgate|packages/(nub|shim|sdk|vite-plugin)`. Evidence at `/tmp/napplet-ver-08-zerogrep.log` with `TOTAL=0` and `VER08_EXIT=0`.
- **VER-09 (changeset):** `.changeset/v0.29.0-nub-connect-class.md` authored — 37 lines, 5 package-bump frontmatter lines (`@napplet/core`, `@napplet/nub`, `@napplet/sdk`, `@napplet/shim`, `@napplet/vite-plugin` each minor), loud call-out of strictCsp deprecation, inline-script ban, new connect option, new class runtime state, 4-step migration path from v0.28.0.
- **VER-10 (PROJECT.md doc-check):** All three required markers present — v0.29.0 milestone block, "Option B" reference, "downstream shell" reference. Evidence at `/tmp/napplet-ver-10-doc-check.log` with `PASS` and `VER10_EXIT=0`.

## Task Commits

1. **Task 1: VER-01 + VER-02 workspace build + type-check** — no commit (evidence-only; /tmp/ logs outside repo)
2. **Task 2: VER-09 changeset authoring** — `3d22a10` (docs)
3. **Task 3: VER-08 + VER-10 zero-grep + doc-check** — no commit (evidence-only; /tmp/ logs outside repo)

**Plan metadata commit:** pending (will include SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md)

## Files Created/Modified

- `.changeset/v0.29.0-nub-connect-class.md` — v0.29.0 changeset (5 first-party minor bumps, breaking-change callouts, migration path)
- `/tmp/napplet-ver-01.log` — VER-01 + VER-02 evidence (`BUILD_EXIT=0 TC_EXIT=0 PACKAGE_COUNT=14`)
- `/tmp/napplet-ver-01-build.log` — full `pnpm -r build` output
- `/tmp/napplet-ver-01-typecheck.log` — full `pnpm -r type-check` output
- `/tmp/napplet-ver-08-zerogrep.log` — VER-08 zero-grep sweep (`TOTAL=0 VER08_EXIT=0`)
- `/tmp/napplet-ver-10-doc-check.log` — VER-10 PROJECT.md doc-check (`PASS VER10_EXIT=0`)
- `.planning/phases/142-verification-milestone-close/142-01-SUMMARY.md` — this file

## Decisions Made

- **Changeset frontmatter scope:** Bump only the 5 first-party packages (`@napplet/core`, `@napplet/nub`, `@napplet/sdk`, `@napplet/shim`, `@napplet/vite-plugin`). The 9 deprecated `@napplet/nub-<domain>` re-export shims are not bumped — they are 1-line `export * from '@napplet/nub/<domain>'` pass-throughs whose API surface is unchanged, inheriting the subpath changes transitively. Matches the v0.26.0 precedent at `.changeset/deprecate-nub-domain-packages.md` where the shims were bumped only when their source changed (their conversion event).
- **Evidence location:** Per AGENTS.md no-home-dir-pollution rule, all verifier-script output logs live under `/tmp/` and are NOT committed. The only repo-committed artifact is `.changeset/v0.29.0-nub-connect-class.md`.
- **Grep-counter hardening:** The plan text's `COUNT=$(grep -cE "$PATTERN" "$FPATH" 2>/dev/null || echo 0)` form double-prints on zero-match (because `grep -c` prints `0\n` AND exits 1, triggering `|| echo 0` to print ANOTHER `0`). Swapped to `grep -cE … 2>/dev/null; true` + `tr -d '[:space:]'` trim. Tracked as a minor Rule-3 correction (see Deviations).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed grep -c exit-code-vs-stdout dual-path bug in VER-08 counter script**

- **Found during:** Task 3 (VER-08 zero-grep sweep)
- **Issue:** The plan text specified `COUNT=$(grep -cE "$PATTERN" "$FPATH" 2>/dev/null || echo 0)`. But `grep -c` with 0 matches prints `0\n` to stdout AND exits with code 1 — which then triggers `|| echo 0` to print a SECOND `0`. The captured `COUNT` variable became `0\n0` (multi-line), and `TOTAL=$((TOTAL + COUNT))` failed with `bad math expression: operator expected at '0'`.
- **Fix:** Replaced with `COUNT=$(grep -cE … 2>/dev/null; true)` (suppress the non-zero exit without adding stdout), followed by `COUNT=$(echo "$COUNT" | tr -d '[:space:]')` to trim any trailing whitespace. Equivalent observable behavior: single integer captured, no multi-line contamination.
- **Files modified:** none — the fix was applied in-bash during Task 3; the plan text was not edited (the plan is historical).
- **Verification:** Re-ran the sweep; output now shows clean `NUB-CONNECT.md: 0 / NUB-CLASS.md: 0 / NUB-CLASS-1.md: 0 / NUB-CLASS-2.md: 0 / TOTAL=0`.
- **Committed in:** N/A (bash-session fix only; no source change; /tmp/ log contains the working output).

---

**Total deviations:** 1 auto-fixed (Rule 3 blocking — shell script correctness).
**Impact on plan:** Zero — the fix is a local bash-session correction to the verifier script; the observable behavior of VER-08 matches the plan's intent (TOTAL=0 across 4 drafts). No file ownership drift; the changeset file (the plan's only source-change) is byte-identical to the planned content.

## Issues Encountered

- The initial VER-08 script invocation failed with a `bad math expression` error caused by the dual-output behavior of `grep -c` + `|| echo 0`. Resolved by swapping to `; true` + whitespace-trim (documented in Deviations). No other issues; VER-01, VER-02, VER-09, VER-10 passed on first attempt.

## Known Stubs

None. All five VER gates produced real evidence:
- VER-01 + VER-02: observed live `pnpm -r build` + `pnpm -r type-check` runs with exit 0 and all 14 packages processed.
- VER-08: live grep of 4 real files in the drafts directory.
- VER-09: a genuine @changesets-format file committed to the repo, 37 lines of prose + 5 package bumps.
- VER-10: live grep of PROJECT.md for 3 required markers.

## User Setup Required

None — no external services or dashboard configuration needed.

## Next Phase Readiness

- **For Plan 142-02 (in-repo tests, parallel Wave-1):** Build + type-check are known green; no build-time regression risk from new test files. File ownership is disjoint (Plan 02 touches `packages/nub/src/{connect,class}/` test files; Plan 01 touched `.changeset/` only). Plan 02 may proceed without conflict.
- **For Plan 142-03 (documented fixtures + milestone close, Wave-2):** The v0.29.0 changeset now exists and will be consumed by `pnpm version-packages` at milestone close. `REQUIREMENTS.md` VER-01/02/08/09/10 are ready to be checked off. PROJECT.md already contains the Option B + downstream-shell references Plan 03 will rely on; no edits needed upstream.
- **Blockers:** None.

## Self-Check: PASSED

- `.changeset/v0.29.0-nub-connect-class.md` — FOUND
- `/tmp/napplet-ver-01.log` — FOUND (`BUILD_EXIT=0`, `TC_EXIT=0`, `PACKAGE_COUNT=14`)
- `/tmp/napplet-ver-08-zerogrep.log` — FOUND (`TOTAL=0`, `VER08_EXIT=0`)
- `/tmp/napplet-ver-10-doc-check.log` — FOUND (`PASS`, `VER10_EXIT=0`)
- Commit `3d22a10` — FOUND in `git log`
- Plan-level one-shot verification command prints `Plan 142-01 VER gates (01, 02, 08, 09, 10): ALL PASS`

---
*Phase: 142-verification-milestone-close*
*Completed: 2026-04-21*
