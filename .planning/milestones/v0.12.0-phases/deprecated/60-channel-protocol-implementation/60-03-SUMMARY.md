---
phase: 60-channel-protocol-implementation
plan: 03
subsystem: specs
tags: [nub, pipes, wire-format, ipc, point-to-point, postMessage]

# Dependency graph
requires:
  - phase: 59-nip-simplification-nub-framework
    provides: NUB governance doc (README.md), TEMPLATE-WORD.md, TEMPLATE-NN.md, dual-track model
provides:
  - NUB-PIPES.md -- full wire format spec for authenticated point-to-point connections
  - README.md registry updated with markdown links to all 6 NUB-WORD specs
affects: [pipe-implementation, nub-message-protocols, shim-pipes-api]

# Tech tracking
tech-stack:
  added: []
  patterns: [nub-word-spec-format, pipe-wire-verbs, auth-on-open]

key-files:
  created:
    - specs/nubs/NUB-PIPES.md
  modified:
    - specs/nubs/README.md

key-decisions:
  - "NUB-PIPES uses 7 wire verbs (PIPE_OPEN, PIPE_ACK, PIPE, PIPE_CLOSE, PIPE_CLOSED, PIPE_ERROR, PIPE_BROADCAST) -- PIPE_ERROR added for explicit error signaling"
  - "Pipe payloads are opaque to the shell -- no parsing, validation, or transformation"
  - "Auth-on-open reuses existing REGISTER/IDENTITY/AUTH session -- no new auth flow"

patterns-established:
  - "NUB-WORD spec depth: unimplemented protocols get full treatment (wire format, lifecycle diagram, state machine, security, future extensions)"
  - "Wire verb naming: VERB_NOUN for control (PIPE_OPEN, PIPE_CLOSE), plain VERB for data (PIPE)"

requirements-completed: [NUB-01, NUB-02, NUB-03]

# Metrics
duration: 3min
completed: 2026-04-05
---

# Phase 60 Plan 03: NUB-PIPES Spec Summary

**Full wire format spec for authenticated point-to-point pipe connections (7 verbs, lifecycle diagram, state machine) with NUB registry updated to link all 6 interface specs**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T18:18:04Z
- **Completed:** 2026-04-05T18:21:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created NUB-PIPES.md as the most detailed NUB-WORD spec (369 lines) with full wire format for PIPE_OPEN/PIPE_ACK/PIPE/PIPE_CLOSE/PIPE_CLOSED/PIPE_ERROR/PIPE_BROADCAST
- Documented API surface (NappletPipes + PipeHandle interfaces), shell behavior (MUST/MAY/SHOULD), state machine, sequence diagram, security considerations, NUB-IPC comparison table, and future extensions (MessagePort upgrade, Transferable ArrayBuffers)
- Updated README.md registry table with markdown links to all 6 NUB-WORD spec files

## Task Commits

Each task was committed atomically:

1. **Task 1: Write NUB-PIPES.md** - `d3a33b0` (feat)
2. **Task 2: Verify NUB governance artifacts and update README.md registry** - `10ece37` (docs)

## Files Created/Modified
- `specs/nubs/NUB-PIPES.md` - Full wire format spec for authenticated point-to-point pipe connections (369 lines)
- `specs/nubs/README.md` - Registry table updated with markdown links to all 6 NUB-WORD spec files

## Decisions Made
- Added PIPE_ERROR verb beyond the 5 verbs from Phase 59 design (PIPE_OPEN/PIPE_ACK/PIPE/PIPE_CLOSE/PIPE_BROADCAST) -- explicit error signaling for target-not-found, ACL-denied, unknown-pipe, and not-authenticated conditions
- Added PIPE_CLOSED as distinct from PIPE_CLOSE -- PIPE_CLOSE is the request (napplet -> shell), PIPE_CLOSED is the notification (shell -> napplet) with reason string
- Included comparison table with NUB-IPC to clarify when to use pub/sub vs pipes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - spec-only plan with no code artifacts.

## Next Phase Readiness
- NUB-PIPES.md is ready for review and future implementation
- All 6 NUB-WORD interface specs are listed in the registry
- Pipe implementation deferred to a future milestone after spec stabilizes

## Self-Check: PASSED

- specs/nubs/NUB-PIPES.md: FOUND
- specs/nubs/README.md: FOUND
- 60-03-SUMMARY.md: FOUND
- d3a33b0 (Task 1 commit): FOUND
- 10ece37 (Task 2 commit): FOUND

---
*Phase: 60-channel-protocol-implementation*
*Completed: 2026-04-05*
