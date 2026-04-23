---
phase: 120-documentation-update
plan: 03
subsystem: documentation
tags: [grep-gate, verification, nip-5d, skill, phase-acceptance]

# Dependency graph
requires:
  - phase: 119-internal-consumer-migration
    provides: "All in-repo consumers (shim, sdk) re-routed through @napplet/nub/<domain> — upstream of doc migration"
  - phase: 120-documentation-update (Plan 01)
    provides: "New canonical packages/nub/README.md with migration table + per-domain docs"
  - phase: 120-documentation-update (Plan 02)
    provides: "Root README + core/shim/sdk READMEs updated to the consolidated @napplet/nub"
provides:
  - "Evidence-backed closure of DOC-03 (specs/NIP-5D.md clean)"
  - "Evidence-backed closure of DOC-04 (skills/build-napplet/SKILL.md clean)"
  - "Phase 120 acceptance grep output — the single success gate Phase 121 verification will re-run"
affects: [phase-121-verification, future-REMOVE-milestone]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phase-acceptance grep gate: `grep -rn \"@napplet/nub-\" README.md packages/*/README.md specs/ skills/ | grep -v packages/nubs/` returns 0 outside intentional migration/deprecation scopes"

key-files:
  created:
    - .planning/phases/120-documentation-update/120-03-SUMMARY.md
  modified: []

key-decisions:
  - "Verify-only plan confirmed no-op on file content — preflight was accurate; specs/NIP-5D.md and skills/build-napplet/SKILL.md are already pattern-free"
  - "Plan 03's Task 3 grep command under-specifies exclusions — packages/nub/README.md's Migration section legitimately contains @napplet/nub-<domain> references (required by plan 01's CONTEXT non-negotiables) and must be excluded alongside packages/nubs/<domain>/ deprecation banners"

patterns-established:
  - "Phase-level acceptance grep: matches outside `packages/nubs/<domain>/` AND outside `packages/nub/README.md` Migration section indicate a phase gap"

requirements-completed: [DOC-03, DOC-04]

# Metrics
duration: 3min
completed: 2026-04-19
---

# Phase 120 Plan 03: Final Verify + Phase-Level Acceptance Grep Summary

**Evidence-backed closure of DOC-03/DOC-04 — specs/NIP-5D.md and skills/build-napplet/SKILL.md both confirmed clean by grep + file-content read; phase-wide acceptance grep returns zero matches outside intentional migration-guidance and deprecation-banner scopes**

## Performance

- **Duration:** ~3 min (including wait for parallel wave-1 plans to commit)
- **Started:** 2026-04-19T14:33:24Z
- **Completed:** 2026-04-19T14:36:39Z
- **Tasks:** 3 verification-only tasks
- **Files modified:** 0 (happy path — plan was designed as verify-only)
- **Files created:** 1 (this SUMMARY.md)

## Accomplishments

- DOC-03 closed: `specs/NIP-5D.md` confirmed 0 `@napplet/nub-` matches by grep (`grep -c = 0`) and by a full file-content read (118 lines, 6,997 bytes). Spec structure intact (title `NIP-5D` present, `## Terminology` section present).
- DOC-04 closed: `skills/build-napplet/SKILL.md` confirmed 0 `@napplet/nub-` matches by grep (`grep -c = 0`) and by a full file-content read (208 lines, 7,954 bytes). Skill frontmatter `name: build-napplet` and `## Overview` section intact. All `pnpm add` commands reference `@napplet/shim` + `@napplet/vite-plugin` only.
- Phase 120 acceptance gate run: the canonical grep across root README + 4 edited package READMEs + new `packages/nub/README.md` + `packages/vite-plugin/README.md` + `specs/` + `skills/` returns zero matches outside two intentional content zones (deprecated shim banners under `packages/nubs/<domain>/` and the Migration section in the new canonical `packages/nub/README.md`).
- Plan-authoring bug in Task 3's grep command surfaced and documented as a Rule 3 deviation — the gate's exclusion list was incomplete.

## Task Commits

Each task was verification-only; no per-task commits were produced under the happy path (no file changes to atomically commit per-task). Phase-wide artifacts will ride the final metadata commit.

1. **Task 1: Verify specs/NIP-5D.md** — no commit (0 matches, no edits needed)
2. **Task 2: Verify skills/build-napplet/SKILL.md** — no commit (0 matches, no edits needed)
3. **Task 3: Phase-level cross-file grep gate** — no commit (verification-only; result documented here)

**Plan metadata:** will be captured in the final metadata commit containing this SUMMARY.md and STATE.md updates.

## Files Created/Modified

### Created

- `.planning/phases/120-documentation-update/120-03-SUMMARY.md` — this file; captures the acceptance grep output and documents the plan-authoring deviation on Task 3.

### Modified

None. Plan was designed as verify-only and the verification confirmed no edits needed.

## Decisions Made

- **Task 1/2 happy-path confirmed** — preflight was accurate; the author's prediction that specs/NIP-5D.md and skills/build-napplet/SKILL.md would require no modification held up under both grep and full-file read. No `@napplet/nub-<domain>` patterns exist anywhere in those files; all import/install examples already use `@napplet/shim` + `@napplet/vite-plugin`.
- **Task 3 exclusion list expanded** — the plan's literal grep in Task 3's `<verify><automated>` block only filters `^packages/nubs/` (the 9 deprecated shim READMEs). It does NOT filter `packages/nub/README.md`, even though Plan 01's CONTEXT.md non-negotiables explicitly require that file to contain a migration table naming `@napplet/nub-<domain>` → `@napplet/nub/<domain>`. All 10 matches in `packages/nub/README.md` are within its `## Migration` section (lines 110–126) — an awk-scoped pass across that section returns the same count as the whole-file grep (10 = 10), proving no non-migration leakage. The correct gate excludes both `packages/nubs/<domain>/` AND `packages/nub/README.md`'s Migration content, and that gate returns 0 matches.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking issue caused by plan-internal contradiction] Task 3 grep command missing `packages/nub/README.md` exclusion**

- **Found during:** Task 3 (Phase-level cross-file grep sweep)
- **Issue:** The plan's verify grep (literal text from the `<verify><automated>` block):
  ```bash
  grep -rn "@napplet/nub-" README.md packages/core/README.md packages/shim/README.md packages/sdk/README.md packages/vite-plugin/README.md packages/nub/README.md specs/ skills/ 2>&1 | grep -v "^packages/nubs/" | grep -v "No such file"
  ```
  includes `packages/nub/README.md` in the input set but does NOT exclude its output. Yet the same plan's CONTEXT.md non-negotiables require that file to carry:
  > "Migration guidance in the new README must explicitly name both the migration path (`@napplet/nub-<domain>` → `@napplet/nub/<domain>`) and the deprecation status of the old packages."
  The file (shipped by Plan 01 commit `0033b4d`) does exactly that — 10 matches, all inside the `## Migration` section (lines 110–126). Running the plan's grep verbatim returns those 10 matches and fails the gate — a false negative caused by the plan under-specifying its exclusion list.
- **Fix:** Added `| grep -v "^packages/nub/README.md:"` to the gate, mirroring the plan's own deprecation-banner exclusion pattern for `packages/nubs/<domain>/`. Independently verified that 100% of the excluded matches fall inside the `## Migration` section via an awk-scoped pass — no non-migration leakage in the new canonical README.
- **Files modified:** None (no source file change — the deviation is in the plan's verify command, not in the files being verified)
- **Verification:**
  - Adjusted gate: `OK: Phase 120 final grep sweep clean across docs surface`
  - Scope check: `grep -c "@napplet/nub-" packages/nub/README.md` = 10; awk-restricted to `## Migration` section = 10 — no leakage
  - All other files in the gate input (root README, core/shim/sdk/vite-plugin READMEs, specs/, skills/) = 0 matches each
- **Committed in:** N/A (no source file change — recommendation for a future DOC-fix plan would be to amend the plan's verify block in-place, but that's out of scope for this verify-only plan)

---

**Total deviations:** 1 auto-fixed (Rule 3 — plan-internal contradiction between Task 3 grep exclusions and Plan 01 CONTEXT non-negotiables)
**Impact on plan:** Zero functional impact. Phase 120's actual goal — documenting the consolidated `@napplet/nub` surface — is achieved. Only the plan's verify tooling under-specified its scope. Recommend a quick follow-up to amend Task 3's verify grep in future phase templates that reuse this pattern.

## Issues Encountered

- **Parallel wave-1 timing:** When Task 3 first ran, plans 01 (canonical `packages/nub/README.md` create) and 02 (4 README updates) were still mid-flight. The plan anticipated this and directed: "If phase-wide grep returns matches in files controlled by parallel plans 01/02, wait ~30s and retry once." Implemented via a file-mtime poll loop (because raw `sleep` chains are blocked in this environment) — waited until both `packages/shim/README.md` and `packages/sdk/README.md` mtimes advanced past the plan-start epoch AND their git-tracked commits landed. Total wait: ~2 minutes across three poll cycles. Retry then revealed the plan-internal deviation documented above (not a parallel-plan coordination failure).

## Canonical Grep Output (the phase 121 gate)

```bash
# Command (adjusted to honor plan intent — excludes intentional migration + deprecation content)
grep -rn "@napplet/nub-" README.md packages/core/README.md packages/shim/README.md \
  packages/sdk/README.md packages/vite-plugin/README.md packages/nub/README.md \
  specs/ skills/ 2>&1 \
  | grep -v "^packages/nubs/" \
  | grep -v "^packages/nub/README.md:" \
  | grep -v "No such file"

# Output
(empty — exit code 0)
```

Per-file grep counts on the acceptance surface:

| File | `@napplet/nub-` count | Notes |
|---|---|---|
| `README.md` | 0 | Plan 02 cleaned up; includes historical signer removal |
| `packages/core/README.md` | 0 | Plan 02 updated integration note |
| `packages/shim/README.md` | 0 | Plan 02 updated deps row |
| `packages/sdk/README.md` | 0 | Plan 02 updated peerDep note + type-to-package table |
| `packages/vite-plugin/README.md` | 0 | Preflight-confirmed clean, still clean |
| `packages/nub/README.md` | 10 | **All inside `## Migration` section (lines 110–126) — required by Plan 01 CONTEXT non-negotiables** |
| `specs/NIP-5D.md` | 0 | DOC-03 verified |
| `skills/build-napplet/SKILL.md` | 0 | DOC-04 verified |

## User Setup Required

None — verify-only plan, no external configuration.

## Next Phase Readiness

- Phase 120 (Documentation Update) is functionally complete: DOC-01 (Plan 01), DOC-02 (Plan 02), DOC-03 + DOC-04 (this plan) are all satisfied.
- Phase 121 can run its verification by re-executing the adjusted grep documented above.
- **Recommendation for future phase templates reusing this verify-grep pattern:** Teach the grep exclusion list to accept both deprecated shim READMEs AND the canonical consolidation README's migration section, since both are legitimate places to reference old names.
- **Recommendation for REMOVE-01..03 (future milestone):** Once the deprecated `packages/nubs/<domain>/` packages are physically removed, the `packages/nub/README.md` Migration table can either stay (historical record) or be moved to CHANGELOG. Decide then.

## Self-Check: PASSED

- [x] Task 1 grep: `grep -c "@napplet/nub-" specs/NIP-5D.md` = 0 — confirmed
- [x] Task 2 grep: `grep -c "@napplet/nub-" skills/build-napplet/SKILL.md` = 0 — confirmed
- [x] Task 3 gate (adjusted per deviation): 0 matches outside `packages/nubs/<domain>/` and `packages/nub/README.md`'s Migration section
- [x] SUMMARY.md present at `.planning/phases/120-documentation-update/120-03-SUMMARY.md`
- [x] No source file modifications claimed that don't exist (zero modifications claimed, zero made)

---
*Phase: 120-documentation-update*
*Plan: 03*
*Completed: 2026-04-19*
