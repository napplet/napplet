---
phase: 75-package-architecture
plan: 01
subsystem: core
tags: [envelope, nub, json-wire-format, nip-5d, types, legacy]

# Dependency graph
requires: []
provides:
  - NappletMessage base type for JSON envelope wire format
  - NubDomain literal union and NUB_DOMAINS constant for 4 NUB domains
  - ShellSupports interface for shell.supports() capability queries
  - NappletGlobalShell type for window.napplet.shell namespace
  - legacy.ts module isolating deprecated NIP-01 bus constants
affects: [75-02-nubs-scaffold, shim, sdk, runtime, shell]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JSON envelope base types with type discriminant field"
    - "legacy.ts pattern for deprecated constants with @deprecated JSDoc"
    - "NappletGlobal.shell namespace for capability queries"

key-files:
  created:
    - packages/core/src/envelope.ts
    - packages/core/src/legacy.ts
  modified:
    - packages/core/src/constants.ts
    - packages/core/src/types.ts
    - packages/core/src/index.ts
    - packages/shim/src/index.ts

key-decisions:
  - "PROTOCOL_VERSION bumped to 4.0.0 for JSON envelope era"
  - "AUTH_KIND and VERB_REGISTER/VERB_IDENTITY moved to legacy.ts alongside BusKind"
  - "shell.supports() stub returns false by default -- actual wiring deferred to future plan"

patterns-established:
  - "legacy.ts: deprecated NIP-01 era constants live here until consumers migrate to JSON envelopes"
  - "envelope.ts: JSON envelope base types are the foundation for NUB-specific message types"

requirements-completed: [CORE-01, CORE-02]

# Metrics
duration: 3min
completed: 2026-04-07
---

# Phase 75 Plan 01: Core Envelope Types Summary

**JSON envelope base types (NappletMessage, NubDomain, ShellSupports) added to @napplet/core with NIP-01 bus constants isolated in legacy.ts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-07T10:52:27Z
- **Completed:** 2026-04-07T10:55:21Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created envelope.ts with NappletMessage, NubDomain, NUB_DOMAINS, ShellSupports, and NappletGlobalShell types
- Moved BusKind, BusKindValue, DESTRUCTIVE_KINDS, AUTH_KIND, VERB_REGISTER, VERB_IDENTITY to legacy.ts with @deprecated markers
- Bumped PROTOCOL_VERSION from 2.0.0 to 4.0.0 (JSON envelope era)
- Added NappletGlobal.shell property for capability queries
- All 15 packages build and type-check cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create envelope.ts with JSON envelope base types** - `b74444e` (feat)
2. **Task 2: Reorganize constants -- legacy.ts + update barrel exports** - `fbe99d2` (refactor)

## Files Created/Modified
- `packages/core/src/envelope.ts` - JSON envelope base types: NappletMessage, NubDomain, NUB_DOMAINS, ShellSupports, NappletGlobalShell
- `packages/core/src/legacy.ts` - Deprecated NIP-01 bus constants: BusKind, BusKindValue, DESTRUCTIVE_KINDS, AUTH_KIND, VERB_REGISTER, VERB_IDENTITY
- `packages/core/src/constants.ts` - Cleaned to envelope-era only: PROTOCOL_VERSION (4.0.0), SHELL_BRIDGE_URI, REPLAY_WINDOW_SECONDS
- `packages/core/src/types.ts` - Added NappletGlobalShell import and shell property to NappletGlobal
- `packages/core/src/index.ts` - Updated barrel with envelope exports and legacy re-exports
- `packages/shim/src/index.ts` - Added shell.supports() stub to window.napplet installation

## Decisions Made
- **PROTOCOL_VERSION bumped to 4.0.0**: Marks the JSON envelope wire format era per NIP-5D v4 (was 2.0.0)
- **AUTH_KIND and handshake verbs moved to legacy.ts**: These are NIP-01 era constants alongside BusKind -- cleaner separation
- **shell.supports() stub returns false**: The actual wiring happens when the shell populates the namespace during IDENTITY handshake (future plan scope)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added shell.supports() stub to shim**
- **Found during:** Task 2 (build verification)
- **Issue:** Adding `shell: NappletGlobalShell` to NappletGlobal caused @napplet/shim to fail type-check because the window.napplet object literal was missing the new `shell` property
- **Fix:** Added a `shell: { supports() { return false; } }` stub to the shim's window.napplet installation
- **Files modified:** packages/shim/src/index.ts
- **Verification:** pnpm build && pnpm type-check both pass (15/15 packages)
- **Committed in:** fbe99d2 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to maintain type safety across the monorepo. The stub is the correct minimal implementation -- actual shell capability queries will be wired in a future plan.

## Known Stubs

| File | Line | Stub | Reason |
|------|------|------|--------|
| packages/shim/src/index.ts | ~358 | `shell.supports()` returns `false` | Shell capability queries not yet wired; future plan will populate from IDENTITY handshake |

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Envelope base types are in place for Plan 02 (NUB scaffold)
- All existing consumers compile unchanged via legacy re-exports
- NappletGlobal.shell ready for future capability query wiring

---
*Phase: 75-package-architecture*
*Completed: 2026-04-07*
