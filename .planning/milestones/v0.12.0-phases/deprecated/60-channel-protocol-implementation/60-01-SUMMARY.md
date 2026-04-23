---
phase: 60-channel-protocol-implementation
plan: 01
subsystem: specs
tags: [nub, nip-5d, relay, storage, signer, nip-07, nip-01, interface-spec]

# Dependency graph
requires:
  - phase: 58-nip-5d-specification
    provides: NIP-5D v2 core protocol spec referencing NUB extension framework
provides:
  - NUB-RELAY interface specification (NIP-01 relay proxy)
  - NUB-STORAGE interface specification (scoped key-value storage)
  - NUB-SIGNER interface specification (NIP-07 signer proxy)
affects: [60-02, 60-03, nub-implementation, nip-5d-updates]

# Tech tracking
tech-stack:
  added: []
  patterns: [nub-word-template, setext-heading-format, shell-behavior-requirements]

key-files:
  created:
    - specs/nubs/NUB-RELAY.md
    - specs/nubs/NUB-STORAGE.md
    - specs/nubs/NUB-SIGNER.md
  modified: []

key-decisions:
  - "NUB-RELAY documents scoped relay operations (kind 29001 with topic tags) alongside NIP-01 verb forwarding"
  - "NUB-STORAGE includes Response Tags subsection documenting id/found/value/key/error tag semantics"
  - "NUB-SIGNER kept minimal per D-01 -- delegates entirely to NIP-07, adds only proxy shell behavior and consent"

patterns-established:
  - "NUB-WORD spec format: setext heading, draft badge, NUB ID/Namespace/Discovery header, 6 sections"
  - "Shell behavior written as MUST/MAY/SHOULD requirements for implementors"
  - "Implementation links point to specific source files in the monorepo"

requirements-completed: [NUB-02]

# Metrics
duration: 3min
completed: 2026-04-05
---

# Phase 60 Plan 01: Initial NUB Interface Specs Summary

**Three NUB-WORD interface specs (RELAY, STORAGE, SIGNER) documenting the fundamental shell-provided capabilities with full API surfaces, shell behavior requirements, event kinds, and security considerations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T18:17:48Z
- **Completed:** 2026-04-05T18:20:33Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- NUB-RELAY spec with subscribe/publish/query API, NIP-01 verb forwarding, and scoped relay operations
- NUB-STORAGE spec with async localStorage-like API, composite-key scoping, IPC-PEER event routing, and quota enforcement
- NUB-SIGNER spec as minimal NIP-07 delegation with signer proxy behavior, destructive kind consent, and ACL gating

## Task Commits

Each task was committed atomically:

1. **Task 1: Write NUB-RELAY.md** - `fb1881d` (feat)
2. **Task 2: Write NUB-STORAGE.md** - `94a33bb` (feat)
3. **Task 3: Write NUB-SIGNER.md** - `b18dc45` (feat)

## Files Created/Modified
- `specs/nubs/NUB-RELAY.md` - NIP-01 relay proxy interface spec (115 lines)
- `specs/nubs/NUB-STORAGE.md` - Scoped key-value storage interface spec (106 lines)
- `specs/nubs/NUB-SIGNER.md` - NIP-07 signer proxy interface spec (84 lines)

## Decisions Made
- NUB-RELAY documents scoped relay operations (kind 29001 with three topic tags) as a MAY-level feature alongside the core NIP-01 verb forwarding
- NUB-STORAGE includes a Response Tags subsection documenting the id/found/value/key/error tag semantics for the kind 29003 response events
- NUB-SIGNER kept minimal per decision D-01 from context -- no NIP-07 extensions, only documents shell proxy behavior and consent flow

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Three core NUB specs complete, ready for 60-02 (NUB-NOSTRDB, NUB-IPC) and 60-03 (NUB-PIPES)
- Template pattern established for remaining specs

## Self-Check: PASSED

All 3 spec files found. All 3 task commits verified.

---
*Phase: 60-channel-protocol-implementation*
*Completed: 2026-04-05*
