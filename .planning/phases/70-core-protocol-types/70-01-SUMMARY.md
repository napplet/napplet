---
phase: 70-core-protocol-types
plan: 01
subsystem: core
tags: [typescript, protocol-types, wire-protocol, esm]

# Dependency graph
requires: []
provides:
  - Clean @napplet/core with zero handshake exports (RegisterPayload, IdentityPayload, AUTH_KIND, VERB_REGISTER, VERB_IDENTITY, BusKind.REGISTRATION all removed)
  - EventTemplate JSDoc documenting unsigned-message contract
  - Protocol version bumped to 3.0.0
  - Downstream packages using local deprecated constants for AUTH code
affects: [71-shim-auth-removal, runtime, shell]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Handshake constants moved from shared core to consuming packages (runtime, shim, shell) as local deprecated definitions"
    - "Protocol version bump (2.0.0 -> 3.0.0) signals no-AUTH wire protocol"

key-files:
  created: []
  modified:
    - packages/core/src/types.ts
    - packages/core/src/constants.ts
    - packages/core/src/index.ts
    - packages/core/src/index.test.ts
    - packages/shim/src/types.ts
    - packages/shell/src/types.ts
    - packages/shell/src/index.ts
    - packages/runtime/src/runtime.ts
    - packages/runtime/src/discovery.test.ts
    - packages/runtime/src/dispatch.test.ts
    - tests/unit/shell-runtime-integration.test.ts

key-decisions:
  - "Handshake constants defined locally in each consuming package (runtime, shim, shell) rather than a shared internal package -- keeps them co-located with the code that will be deleted in Phase 71"
  - "BusKind.REGISTRATION removed from delegated-key allowlist in runtime since registration events are no longer a bus kind"
  - "Shell re-exports AUTH_KIND as deprecated local constant for backward compatibility"

patterns-established:
  - "Deprecated constant migration: removed from core, defined locally with @deprecated JSDoc in consumers, scheduled for removal in next phase"

requirements-completed: [WIRE-01, WIRE-02, WIRE-03, WIRE-04, RT-01, RT-02, RT-03, RT-04]

# Metrics
duration: 6min
completed: 2026-04-07
---

# Phase 70 Plan 01: Core Protocol Types Summary

**Removed AUTH/handshake types and constants from @napplet/core, bumped protocol to v3.0.0, and updated EventTemplate to document unsigned-message contract**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-07T08:35:23Z
- **Completed:** 2026-04-07T08:41:33Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- @napplet/core exports zero handshake-related types or constants (RegisterPayload, IdentityPayload, AUTH_KIND, VERB_REGISTER, VERB_IDENTITY, BusKind.REGISTRATION all removed)
- EventTemplate JSDoc documents the unsigned-message contract (napplets send templates, shell stamps identity)
- PROTOCOL_VERSION bumped from 2.0.0 to 3.0.0
- All downstream packages (shim, shell, runtime, sdk, services, demo) build and type-check clean (15/15 build, 16/16 type-check)
- Core unit tests updated and passing (14 tests)
- Runtime unit tests passing (46 tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove handshake types and constants from @napplet/core** - `752461a` (feat)
2. **Task 2: Fix downstream imports and update core test suite** - `e0de1c3` (feat)

## Files Created/Modified
- `packages/core/src/types.ts` - Removed RegisterPayload, IdentityPayload; updated EventTemplate JSDoc for unsigned-message contract
- `packages/core/src/constants.ts` - Removed AUTH_KIND, VERB_REGISTER, VERB_IDENTITY, BusKind.REGISTRATION; bumped PROTOCOL_VERSION to 3.0.0
- `packages/core/src/index.ts` - Removed handshake types and constants from barrel exports
- `packages/core/src/index.test.ts` - Removed AUTH_KIND test, added removed-exports verification tests
- `packages/shim/src/types.ts` - Local deprecated AUTH_KIND, VERB_REGISTER, VERB_IDENTITY constants
- `packages/shell/src/types.ts` - Local deprecated AUTH_KIND constant
- `packages/shell/src/index.ts` - Re-exports AUTH_KIND from local shell/types.ts instead of @napplet/core
- `packages/runtime/src/runtime.ts` - Local handshake constants and type definitions; removed BusKind.REGISTRATION from delegated-key allowlist
- `packages/runtime/src/discovery.test.ts` - Local AUTH_KIND constant replacing core import
- `packages/runtime/src/dispatch.test.ts` - Local AUTH_KIND constant replacing core import
- `tests/unit/shell-runtime-integration.test.ts` - Local AUTH_KIND constant replacing core import

## Decisions Made
- Handshake constants defined locally in each consuming package (runtime, shim, shell) rather than a shared internal package -- keeps them co-located with the code that will be deleted in Phase 71
- BusKind.REGISTRATION removed from runtime's delegated-key allowlist since registration events are no longer a core bus kind
- Shell re-exports AUTH_KIND as a deprecated local constant to maintain backward compatibility for external consumers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed additional downstream imports not covered by plan**
- **Found during:** Task 2 (Fix downstream imports)
- **Issue:** Plan only specified fixing shim/types.ts and core/index.test.ts, but shell/types.ts, shell/index.ts, runtime/runtime.ts, runtime/discovery.test.ts, runtime/dispatch.test.ts, and tests/unit/shell-runtime-integration.test.ts also imported AUTH_KIND, VERB_REGISTER, VERB_IDENTITY, RegisterPayload, or IdentityPayload from @napplet/core
- **Fix:** Applied same pattern as shim -- defined constants locally in each file with @deprecated JSDoc. Removed BusKind.REGISTRATION reference from runtime delegated-key allowlist.
- **Files modified:** packages/shell/src/types.ts, packages/shell/src/index.ts, packages/runtime/src/runtime.ts, packages/runtime/src/discovery.test.ts, packages/runtime/src/dispatch.test.ts, tests/unit/shell-runtime-integration.test.ts
- **Verification:** pnpm build (15/15), pnpm type-check (16/16), core tests (14/14), runtime tests (46/46)
- **Committed in:** e0de1c3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Additional downstream imports were necessary to fix for build success. Same pattern applied consistently. No scope creep.

## Issues Encountered
None

## Known Stubs
None - all changes are complete removals and local constant definitions.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- @napplet/core is now free of handshake types and constants
- Ready for Phase 71: shim AUTH/handshake code removal
- Deprecated local constants in shim, shell, and runtime are flagged for Phase 71 cleanup

## Self-Check: PASSED

All 11 modified files exist. Both task commits (752461a, e0de1c3) verified in git log. SUMMARY file exists at expected path.

---
*Phase: 70-core-protocol-types*
*Completed: 2026-04-07*
