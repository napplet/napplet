---
phase: 91-sdk-wrappers
plan: 01
subsystem: sdk
tags: [typescript, sdk, keys, nub, keyboard]

# Dependency graph
requires:
  - phase: 90-shim-implementation
    provides: window.napplet.keys API that SDK wraps
  - phase: 88-nub-type-package
    provides: "@napplet/nub-keys message types re-exported by SDK"
provides:
  - "keys namespace on @napplet/sdk wrapping window.napplet.keys"
  - "register() convenience combining registerAction + onAction + cleanup"
  - "All 13 @napplet/nub-keys type re-exports from @napplet/sdk"
  - "KEYS_DOMAIN constant re-export"
affects: [92-documentation]

# Tech tracking
tech-stack:
  added: []
  patterns: ["SDK convenience method pattern: register() auto-wires listener + returns cleanup handle"]

key-files:
  created: []
  modified:
    - packages/sdk/src/index.ts

key-decisions:
  - "Added register() as separate convenience on keys object rather than overloading registerAction -- keeps 1:1 API parity with window.napplet.keys while offering ergonomic shortcut"

patterns-established:
  - "SDK convenience pattern: combine related calls into single method returning cleanup handle"

requirements-completed: [SDK-01, SDK-02, SDK-03]

# Metrics
duration: 1min
completed: 2026-04-09
---

# Phase 91 Plan 01: SDK Wrappers Summary

**keys namespace wrapper with register() convenience and full nub-keys type re-exports in @napplet/sdk**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-09T11:10:54Z
- **Completed:** 2026-04-09T11:12:18Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Verified existing SDK keys wrappers (registerAction, unregisterAction, onAction) match NappletGlobal.keys signatures from core/types.ts (SDK-01)
- Added register() convenience method that calls registerAction + onAction and returns a combined cleanup handle (SDK-02)
- Confirmed all 13 @napplet/nub-keys types and KEYS_DOMAIN constant are re-exported (SDK-03)
- Build and type-check pass across all 10 packages

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify SDK keys wrappers and add register() convenience** - `5394243` (feat)

## Files Created/Modified
- `packages/sdk/src/index.ts` - Added register() convenience method to keys namespace (38 lines added)

## Decisions Made
- Added `register()` as a new method on the `keys` object rather than modifying `registerAction()` -- this keeps the SDK's 1:1 wrapping pattern intact while offering an ergonomic shortcut for the common pattern of register + listen + cleanup

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added register() convenience method (SDK-02)**
- **Found during:** Task 1 (verification)
- **Issue:** Cross-phase commit 4e798d0 implemented SDK-01 and SDK-03 but omitted the SDK-02 convenience method
- **Fix:** Added `keys.register(action, handler)` returning `{ actionId, binding?, close() }` with full JSDoc
- **Files modified:** packages/sdk/src/index.ts
- **Verification:** pnpm build && pnpm type-check pass
- **Committed in:** 5394243

---

**Total deviations:** 1 auto-fixed (1 missing critical functionality)
**Impact on plan:** Expected -- plan anticipated this addition might be needed

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SDK is complete -- Phase 92 (Documentation) can proceed
- All 13 nub-keys types accessible via `import { ... } from '@napplet/sdk'`
- keys.register() convenience ready for README examples

## Self-Check: PASSED

- FOUND: packages/sdk/src/index.ts
- FOUND: commit 5394243
- FOUND: .planning/phases/91-sdk-wrappers/91-01-SUMMARY.md

---
*Phase: 91-sdk-wrappers*
*Completed: 2026-04-09*
