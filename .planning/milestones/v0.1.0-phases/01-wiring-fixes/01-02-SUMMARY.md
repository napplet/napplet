---
phase: 01-wiring-fixes
plan: 02
subsystem: storage
tags: [storage, NIP-tags, wire-format, serialization]

requires:
  - phase: none
    provides: n/a
provides:
  - Comma-safe storage key serialization using repeated NIP tags
affects: [02-test-infrastructure, 04-capability-tests]

tech-stack:
  added: []
  patterns: [repeated NIP ['key', value] tags for list serialization]

key-files:
  created: []
  modified:
    - packages/shell/src/storage-proxy.ts
    - packages/shim/src/storage-shim.ts

key-decisions:
  - "None - followed plan as specified"

patterns-established:
  - "NIP tag list pattern: use repeated ['key', name] tags instead of comma-joined strings for wire format lists"

requirements-completed: [FIX-03]

duration: 2min
completed: 2026-03-30
---

# Plan 01-02: Storage Key Serialization Fix Summary

**Replaced comma-joined storage key serialization with repeated NIP ['key', name] tags to prevent data corruption on keys containing commas**

## Performance

- **Duration:** 2 min
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Shell storage-proxy now sends one ['key', name] tag per key instead of comma-joined ['keys', 'a,b,c']
- Shim storage-shim now filters for key tags and maps to extract names
- Wire format is now consistent with NIP tag conventions

## Task Commits

1. **Task 1-2: Update shell and shim key serialization** - `17b4892` (fix)

## Files Created/Modified
- `packages/shell/src/storage-proxy.ts` - Changed sendResponse to use userKeys.map(k => ['key', k])
- `packages/shim/src/storage-shim.ts` - Changed keys() to filter/map repeated key tags

## Decisions Made
None - followed plan as specified

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Storage key serialization is comma-safe
- Ready for storage isolation tests in Phase 4

---
*Phase: 01-wiring-fixes*
*Completed: 2026-03-30*
