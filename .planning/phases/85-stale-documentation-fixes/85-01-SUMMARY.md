---
phase: 85-stale-documentation-fixes
plan: 01
subsystem: docs
tags: [readme, jsdoc, nip-5d, shell-supports, nub-domain, theme]

requires:
  - phase: 81-dead-code-legacy-removal
    provides: services namespace removal, namespaced shell.supports() API
provides:
  - All READMEs, JSDoc, and NIP-5D spec accurately reflect current codebase
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - packages/sdk/README.md
    - packages/vite-plugin/README.md
    - packages/core/README.md
    - packages/core/src/envelope.ts
    - specs/NIP-5D.md

key-decisions:
  - "No new decisions -- pure documentation corrections to match existing code"

patterns-established: []

requirements-completed: [DOC-01, DOC-02, DOC-03, DOC-04, DOC-05]

duration: 3min
completed: 2026-04-08
---

# Phase 85 Plan 01: Fix Stale Documentation References Summary

**Removed stale services.has() API, added missing theme NUB domain, and fixed D-02/D-03 decision ID artifacts across 5 files**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-08T14:51:52Z
- **Completed:** 2026-04-08T14:54:30Z
- **Tasks:** 5
- **Files modified:** 5

## Accomplishments
- Removed stale "services" namespace reference from SDK README (DOC-01)
- Replaced all `services.has()` / `discoverServices()` calls with `shell.supports('svc:...')` in vite-plugin README and NIP-5D spec (DOC-02, DOC-05)
- Added missing `theme` domain to NubDomain type, table, and NUB_DOMAINS array in core README (DOC-03)
- Fixed envelope.ts JSDoc: added theme row, removed internal D-02/D-03 decision ID references (DOC-04)
- Added namespaced capability prefix table (nub:/perm:/svc:) to NIP-5D Runtime Capability Query section

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove services namespace from SDK README** - `feae3d0` (docs)
2. **Task 2: Replace services.has() in vite-plugin README** - `70da23d` (docs)
3. **Task 3: Add theme to NubDomain table in core README** - `2725955` (docs)
4. **Task 4: Fix envelope.ts JSDoc** - `3503fa1` (docs)
5. **Task 5: Replace services.has() in NIP-5D** - `3771092` (docs)

## Files Created/Modified
- `packages/sdk/README.md` - Removed "services" from How It Works import list
- `packages/vite-plugin/README.md` - Replaced discoverServices()/services.has() with shell.supports(), updated prose
- `packages/core/README.md` - Added theme domain to type definition, table, NUB_DOMAINS array, domain prefix list
- `packages/core/src/envelope.ts` - Added theme to JSDoc table, removed D-02/D-03 parenthetical references
- `specs/NIP-5D.md` - Replaced services.has() with namespaced shell.supports(), added capability prefix table

## Decisions Made
None - followed plan as specified. All changes were direct text replacements with no judgment calls needed.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All documentation now accurately reflects the current codebase
- No stale `services.has()` references remain in packages/ or specs/
- No `D-02`/`D-03` internal decision ID artifacts remain
- NubDomain consistently shows 5 domains (relay, signer, storage, ifc, theme) everywhere
- Build and type-check pass cleanly

## Self-Check: PASSED

All 5 modified files exist. All 5 task commits verified in git log.

---
*Phase: 85-stale-documentation-fixes*
*Completed: 2026-04-08*
