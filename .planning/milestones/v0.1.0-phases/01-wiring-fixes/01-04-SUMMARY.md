---
phase: 01-wiring-fixes
plan: 04
subsystem: auth
tags: [AUTH, security, race-condition, queue-cleanup, NIP-42]

requires:
  - phase: 01-wiring-fixes
    provides: napplet namespace (plan 01-03 renamed error messages)
provides:
  - Complete AUTH rejection handling with queue cleanup on all 5 paths
affects: [03-core-protocol-tests]

tech-stack:
  added: []
  patterns: [rejectAuth() unified helper for all AUTH failure paths]

key-files:
  created: []
  modified:
    - packages/shell/src/pseudo-relay.ts

key-decisions:
  - "None - followed plan as specified"

patterns-established:
  - "AUTH rejection pattern: all rejection paths go through rejectAuth() which clears queue, sends OK failure, and sends NOTICE about dropped messages"

requirements-completed: [FIX-01]

duration: 2min
completed: 2026-03-30
---

# Plan 01-04: AUTH Queue Cleanup Summary

**Added unified rejectAuth() helper to clear pending message queue and send NOTICE on all 5 AUTH rejection paths, fixing security race condition**

## Performance

- **Duration:** 2 min
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created rejectAuth() helper that handles queue cleanup, OK failure, and NOTICE in one place
- All 5 rejection paths (wrong kind, challenge mismatch, wrong relay, timestamp, invalid sig) now clear the queue
- NOTICE message informs napplet about dropped queued messages per CONTEXT.md D-06
- Eliminated security race where pre-AUTH messages from a failed attempt could execute under a later successful AUTH

## Task Commits

1. **Task 1: Add queue cleanup to all AUTH rejection paths** - `386c4a2` (fix)

## Files Created/Modified
- `packages/shell/src/pseudo-relay.ts` - Added rejectAuth() helper, replaced sendOkFail calls on rejection paths

## Decisions Made
None - followed plan as specified

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AUTH rejection handling is complete and secure
- Ready for AUTH rejection test scenarios in Phase 3

---
*Phase: 01-wiring-fixes*
*Completed: 2026-03-30*
