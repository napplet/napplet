---
phase: 87-spec-gap-code-drops
plan: 01
subsystem: core
tags: [typescript, protocol-types, cleanup, topics, constants]

# Dependency graph
requires:
  - phase: 84-spec-gap-audit
    provides: "SPEC-GAPS.md with drop/defer/keep verdicts"
  - phase: 86-milestone-planning
    provides: "v0.19.0 roadmap with spec gap drops queued"
provides:
  - "@napplet/core exports only spec-backed types, constants, and dispatch infrastructure"
  - "Capability type and ALL_CAPABILITIES removed (replaced by NamespacedCapability in v0.18.0)"
  - "13 dropped TOPICS entries removed; 16 deferred entries remain"
  - "constants.ts deleted (PROTOCOL_VERSION, SHELL_BRIDGE_URI, REPLAY_WINDOW_SECONDS)"
affects: [publishing, changelog, downstream-consumers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Delete-only refactoring: remove unspecced exports, delete empty files, update barrel"

key-files:
  created: []
  modified:
    - packages/core/src/types.ts
    - packages/core/src/topics.ts
    - packages/core/src/index.ts
    - packages/core/src/index.test.ts

key-decisions:
  - "Deleted constants.ts entirely rather than leaving empty file"
  - "Kept NamespacedCapability (envelope.ts) -- only legacy Capability type was dropped"

patterns-established:
  - "Spec-backed-only exports: @napplet/core exports nothing without a NIP-5D spec basis"

requirements-completed: [DROP-01, DROP-02, DROP-03, DROP-04, DROP-05, DROP-06, DROP-07, DROP-08, DROP-09]

# Metrics
duration: 3min
completed: 2026-04-09
---

# Phase 87 Plan 01: Spec Gap Code Drops Summary

**Deleted 7 unspecced artifacts from @napplet/core: Capability type, ALL_CAPABILITIES, 13 dropped TOPICS, 3 dead constants, and constants.ts file**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-09T08:58:17Z
- **Completed:** 2026-04-09T09:01:28Z
- **Tasks:** 3
- **Files modified:** 4 (+ 1 deleted)

## Accomplishments
- Removed Capability type union and ALL_CAPABILITIES constant from types.ts (DROP-01)
- Deleted 13 TOPICS entries: 7 superseded (auth/state), 3 config, 3 scoped-relay (DROP-02/03/04)
- Deleted constants.ts file entirely -- all 3 constants removed (DROP-05/06/07)
- Updated index.ts barrel exports and index.test.ts to reflect deletions (DROP-08/09)
- Clean build and type-check across all 9 packages

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete Capability type, ALL_CAPABILITIES, and constants.ts** - `ff22e07` (feat)
2. **Task 2: Delete 13 TOPICS entries and update index.ts exports** - `53ed1da` (feat)
3. **Task 3: Update tests and verify clean build** - `b7b5d9a` (test)

**Plan metadata:** (pending)

## Files Created/Modified
- `packages/core/src/types.ts` - Removed Capability type union and ALL_CAPABILITIES constant
- `packages/core/src/topics.ts` - Removed 13 dropped entries, updated JSDoc example
- `packages/core/src/constants.ts` - Deleted (all 3 constants removed)
- `packages/core/src/index.ts` - Removed constants.js imports, Capability/ALL_CAPABILITIES exports, updated JSDoc
- `packages/core/src/index.test.ts` - Removed tests for deleted exports, updated compile checks

## Decisions Made
- Deleted constants.ts file entirely rather than leaving it empty -- all 3 exports were being dropped
- Kept NamespacedCapability (from envelope.ts) untouched -- only legacy Capability type was dropped

## Deviations from Plan

### Plan Errata

**1. TOPICS count: plan said 15 deferred, actual is 16**
- **Issue:** Plan frontmatter stated "15 deferred TOPICS entries remain" but the actual count after deletions is 16 (3 stream + 1 profile + 6 keybinds + 1 WM + 1 chat + 4 audio = 16). The plan's own keep-list enumerates all 16 correctly; only the count was wrong.
- **Impact:** None -- all 13 correct entries were deleted, all 16 correct entries were kept.

---

**Total deviations:** 0 auto-fixes. 1 plan errata (count typo, no impact).
**Impact on plan:** None -- all deletions correct per SPEC-GAPS.md verdicts.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- @napplet/core now exports only spec-backed artifacts
- Ready for changeset creation and v0.19.0 publish
- Carried blocker: npm publish blocked on human npm auth (PUB-04)

---
## Self-Check: PASSED

All created/modified files verified present. All 3 task commits found. constants.ts confirmed deleted.

---
*Phase: 87-spec-gap-code-drops*
*Completed: 2026-04-09*
