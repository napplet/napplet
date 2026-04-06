---
phase: 69-migration-evaluation
plan: 01
subsystem: docs
tags: [migration, evaluation, audit, kehto, nubs, specs, skills]

# Dependency graph
requires:
  - phase: 68-audit-clean
    provides: RUNTIME-SPEC.md, skills, and specs/nubs updated with @kehto references
provides:
  - MIGRATION-EVAL.md with per-item stay/move/split recommendations for all remaining non-package content
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - MIGRATION-EVAL.md
  modified: []

key-decisions:
  - "RUNTIME-SPEC.md stays in @napplet as cross-cutting reference despite documenting mostly @kehto internals"
  - "All 9 specs/nubs/ files should move to github.com/napplet/nubs (aligns with NIP-5D stated governance)"
  - "skills/integrate-shell and skills/add-service should move to @kehto (all imports and APIs are @kehto)"
  - "skills/build-napplet stays in @napplet (teaches napplet-side development)"
  - "specs/NIP-5D.md stays in @napplet until upstream NIP submission"

patterns-established: []

requirements-completed: [MIG-01, MIG-02, MIG-03]

# Metrics
duration: 3min
completed: 2026-04-06
---

# Phase 69 Plan 01: Migration Evaluation Summary

**Structured assessment of all remaining @napplet content with concrete stay/move/split recommendations for @kehto and nubs repo**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-06T21:34:23Z
- **Completed:** 2026-04-06T21:37:32Z
- **Tasks:** 1
- **Files created:** 1

## Accomplishments
- MIGRATION-EVAL.md produced at repo root with 199 lines and 15 explicit Recommendation entries
- Every remaining non-package file evaluated: RUNTIME-SPEC.md, specs/NIP-5D.md, 9 specs/nubs/ files, 3 skills/ directories, README.md, CLAUDE.md
- Summary table provides glanceable overview with Item/Type/Recommendation/Destination/Priority columns
- Action items prioritized: Medium (move NUB specs to nubs repo), Low (move 2 skills to @kehto), None (no-ops)

## Task Commits

Each task was committed atomically:

1. **Task 1: Read all remaining content and write MIGRATION-EVAL.md** - `ec7d173` (docs)

## Files Created/Modified
- `MIGRATION-EVAL.md` - Structured migration assessment with per-item recommendations, evaluation criteria, summary table, and prioritized action items

## Decisions Made
- RUNTIME-SPEC.md stays in @napplet: despite documenting mostly @kehto runtime behavior, it has value as a single-point-of-truth cross-cutting reference. Moving it would orphan protocol-level sections; duplicating creates maintenance burden.
- All 9 specs/nubs/ files move to github.com/napplet/nubs: NIP-5D already states "NUB proposals are maintained at github.com/napplet/nubs." The nubs repo exists but lacks the actual specs.
- skills/integrate-shell and skills/add-service move to @kehto: Phase 68 updated all imports to @kehto; keeping shell-side tutorials in the napplet-side SDK is confusing.
- skills/build-napplet stays: entirely napplet-side, imports only @napplet packages.
- specs/NIP-5D.md stays: foundational protocol spec, natural home until upstream NIP submission.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - this is an analysis-only plan producing a report document.

## Next Phase Readiness
- MIGRATION-EVAL.md provides a clear action list for future milestones
- No code changes were made; all recommendations are documented for human decision

## Self-Check: PASSED

- MIGRATION-EVAL.md exists: VERIFIED
- Task commit ec7d173 exists: VERIFIED
- 15 Recommendation entries (>= 5 required): VERIFIED
- 199 lines (>= 80 required): VERIFIED

---
*Phase: 69-migration-evaluation*
*Completed: 2026-04-06*
