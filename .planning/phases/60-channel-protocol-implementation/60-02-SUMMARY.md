---
phase: 60-channel-protocol-implementation
plan: 02
subsystem: specs
tags: [nub, nostrdb, ipc, interface-spec, nip-5d]

# Dependency graph
requires:
  - phase: 58-nip5d-spec
    provides: NIP-5D v2 core protocol spec that NUBs extend
provides:
  - NUB-NOSTRDB interface spec (local event database proxy API)
  - NUB-IPC interface spec (inter-napplet pub/sub API)
affects: [60-03-PLAN, nub-implementation, spec-review]

# Tech tracking
tech-stack:
  added: []
  patterns: [NUB-WORD template format for interface specs, setext heading convention]

key-files:
  created:
    - specs/nubs/NUB-NOSTRDB.md
    - specs/nubs/NUB-IPC.md
  modified: []

key-decisions:
  - "NUB-NOSTRDB documents all 7 methods from nipdb-shim.ts including the AsyncGenerator subscribe pattern"
  - "NUB-IPC includes built-in topics table referencing @napplet/core TOPICS constant"
  - "Both specs include NUB-PIPES relationship note for IPC vs pipes distinction"

patterns-established:
  - "NUB-WORD spec depth: existing NIPs get full API surface + shell behavior + event kinds + security"
  - "Request/response tag tables supplement the event kinds table for complex protocols"

requirements-completed: [NUB-02]

# Metrics
duration: 2min
completed: 2026-04-05
---

# Phase 60 Plan 02: NUB-NOSTRDB and NUB-IPC Interface Specs Summary

**Two NUB-WORD interface specs documenting the local event database proxy (query/add/event/replaceable/count/subscribe over kind 29006/29007) and inter-napplet topic-based pub/sub (emit/on over kind 29003 IPC_PEER)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T18:17:52Z
- **Completed:** 2026-04-05T18:20:15Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- NUB-NOSTRDB.md created with full 7-method API surface (query, add, event, replaceable, count, supports, subscribe), NIPDB_REQUEST/RESPONSE event kinds (29006/29007), request/response tag tables, and security considerations for shared database access
- NUB-IPC.md created with emit/on pub/sub API, topic prefix conventions (shell:*, napplet:*, {domain}:*), built-in topics table, IPC_PEER event kind (29003), sender exclusion behavior, and relationship to NUB-PIPES

## Task Commits

Each task was committed atomically:

1. **Task 1: Write NUB-NOSTRDB.md** - `205d48e` (feat)
2. **Task 2: Write NUB-IPC.md** - `c3e6c60` (feat)

## Files Created/Modified
- `specs/nubs/NUB-NOSTRDB.md` - NUB-WORD interface spec for the local event database proxy (window.nostrdb)
- `specs/nubs/NUB-IPC.md` - NUB-WORD interface spec for inter-napplet pub/sub (window.napplet.ipc)

## Decisions Made
- NUB-NOSTRDB includes detailed request/response tag tables beyond the basic event kinds table, since the NIPDB protocol uses correlation IDs and subscription IDs that are critical for implementors
- NUB-IPC includes a built-in topics table derived from `@napplet/core` TOPICS constant, since the topic conventions are central to understanding IPC usage patterns
- Both specs reference NUB-PIPES as the alternative for high-frequency communication, establishing the IPC-for-commands-pipes-for-streams distinction

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - both specs are complete documents with no placeholder content.

## Next Phase Readiness
- NUB-NOSTRDB and NUB-IPC complete, ready for 60-03 (NUB-PIPES)
- All 6 NUB-WORD specs from the phase scope will be covered across plans 01-03

## Self-Check: PASSED

- FOUND: specs/nubs/NUB-NOSTRDB.md
- FOUND: specs/nubs/NUB-IPC.md
- FOUND: 60-02-SUMMARY.md
- FOUND: commit 205d48e (Task 1)
- FOUND: commit c3e6c60 (Task 2)

---
*Phase: 60-channel-protocol-implementation*
*Completed: 2026-04-05*
