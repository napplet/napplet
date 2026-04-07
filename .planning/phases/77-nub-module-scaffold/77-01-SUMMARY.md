---
phase: 77-nub-module-scaffold
plan: 01
subsystem: protocol
tags: [nub, relay, signer, typescript, discriminated-union, wire-format]

requires:
  - phase: 76-core-envelope-types
    provides: NappletMessage base type, registerNub dispatch, NostrEvent/NostrFilter/EventTemplate types
provides:
  - 9 relay message types as discriminated union (RelayNubMessage)
  - 14 signer message types as discriminated union (SignerNubMessage)
  - DESTRUCTIVE_KINDS set for consent-gated signing
  - Both domains registered with core dispatch on import
affects: [77-02-PLAN, 78-shim-sdk-integration]

tech-stack:
  added: []
  patterns: [NUB domain registration via module-level registerNub side-effect, discriminated union on type field, request/result correlation via id field]

key-files:
  created: []
  modified:
    - packages/nubs/relay/src/types.ts
    - packages/nubs/relay/src/index.ts
    - packages/nubs/signer/src/types.ts
    - packages/nubs/signer/src/index.ts

key-decisions:
  - "No-op handler for registerNub -- shell/shim provide real handlers at runtime; registration only claims the domain"
  - "DESTRUCTIVE_KINDS as Set (not array) for O(1) lookup in signer consent gating"

patterns-established:
  - "NUB module pattern: types.ts defines discriminated union, index.ts re-exports types and registers domain"
  - "Request/result pairing: each napplet->shell request has a matching shell->napplet *.result type with same correlation id"

requirements-completed: [NUB-01, NUB-02]

duration: 2min
completed: 2026-04-07
---

# Phase 77 Plan 01: Relay + Signer NUB Typed Messages Summary

**Relay (9 messages) and signer (14 messages) NUB modules with full discriminated unions and core dispatch registration**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-07T12:20:19Z
- **Completed:** 2026-04-07T12:22:33Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Relay NUB: 9 concrete message types (subscribe, close, publish, query, event, eose, closed, publish.result, query.result) + 3 union types
- Signer NUB: 14 concrete message types (7 NIP-07 request methods + 7 result types) + 3 union types + DESTRUCTIVE_KINDS set
- Both modules register their domain with core dispatch singleton on import
- Full monorepo build and type-check pass across all 8 packages

## Task Commits

Each task was committed atomically:

1. **Task 1: Relay NUB typed messages and domain registration** - `3253565` (feat)
2. **Task 2: Signer NUB typed messages and domain registration** - `6f0b1f7` (feat)

## Files Created/Modified
- `packages/nubs/relay/src/types.ts` - 9 relay message interfaces + 3 discriminated union types
- `packages/nubs/relay/src/index.ts` - Barrel exports + relay domain registration
- `packages/nubs/signer/src/types.ts` - 14 signer message interfaces + 3 discriminated union types + DESTRUCTIVE_KINDS
- `packages/nubs/signer/src/index.ts` - Barrel exports + signer domain registration

## Decisions Made
- No-op handler for registerNub -- shell/shim provide real handlers at runtime; registration only claims the domain slot
- DESTRUCTIVE_KINDS as Set for O(1) lookup in consent gating logic

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Relay and signer NUB modules ready for shim/SDK integration (Phase 78)
- Plan 77-02 (storage + ifc NUB modules) can proceed in parallel

---
*Phase: 77-nub-module-scaffold*
*Completed: 2026-04-07*
