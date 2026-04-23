---
phase: 21-shim-discovery-api
plan: 01
subsystem: api
tags: [nostr, service-discovery, typescript, shim, kind-29010]

requires:
  - phase: 20-shell-service-registry
    provides: BusKind.SERVICE_DISCOVERY (29010) constant in @napplet/core
  - phase: 19-service-discovery-protocol
    provides: kind 29010 s/v/d tag schema (SPEC.md 11.2)

provides:
  - packages/shim/src/discovery-shim.ts with ServiceInfo type
  - discoverServices(), hasService(), hasServiceVersion() typed API
  - Session-scoped module-level cache for discovery results

affects: [21-02, shim-public-api]

tech-stack:
  added: []
  patterns:
    - Session-scoped module-level cache (null = never queried, [] = queried with no results)
    - Tag parsing pattern for kind 29010 s/v/d tags
    - delegate pattern: hasService/hasServiceVersion both call discoverServices() for cache reuse

key-files:
  created:
    - packages/shim/src/discovery-shim.ts
  modified: []

key-decisions:
  - "parseServiceEvent() returns null for events missing s or v tag — malformed events silently dropped"
  - "Cache initialized as null not [] to distinguish never-queried from queried-empty"
  - "BusKind.SERVICE_DISCOVERY imported from types.js (which re-exports from @napplet/core)"

patterns-established:
  - "Discovery functions delegate to discoverServices() for unified cache access"
  - "NostrEvent imported as type from types.js, BusKind as value"

requirements-completed: [SHIM-01, SHIM-02, SHIM-03]

duration: 5min
completed: 2026-03-31
---

# Plan 21-01: Create Discovery Shim Module Summary

**Kind 29010 service discovery module with typed ServiceInfo, session cache, and three query helpers**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-31
- **Completed:** 2026-03-31
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `discovery-shim.ts` with `ServiceInfo` interface and three exported async functions
- Session-scoped module-level cache prevents duplicate REQs on repeated calls
- `parseServiceEvent()` safely handles malformed events (missing s or v tag → null)

## Task Commits

1. **Task 1: Create discovery-shim.ts** - `0bc0673` (feat)

## Files Created/Modified
- `packages/shim/src/discovery-shim.ts` — ServiceInfo type, discoverServices(), hasService(), hasServiceVersion(), session cache

## Decisions Made
- Cache starts as `null` (not `[]`) to distinguish "never queried" from "queried with zero results"
- `parseServiceEvent()` returns null (not throws) for malformed events — fail-silent for protocol resilience
- Both `hasService()` and `hasServiceVersion()` delegate through `discoverServices()` for cache reuse

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
- `discovery-shim.ts` is ready for Plan 21-02 to import and wire into `index.ts`
- `ServiceInfo` type and all three functions are exported and ready for public API surface

---
*Phase: 21-shim-discovery-api*
*Completed: 2026-03-31*
