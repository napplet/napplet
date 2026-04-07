---
phase: 76-core-envelope-types
plan: 01
subsystem: core
tags: [dispatch, nub, registration, message-routing, factory-pattern]

# Dependency graph
requires:
  - phase: 75-package-architecture
    provides: envelope.ts base types (NappletMessage, NubDomain, NUB_DOMAINS)
provides:
  - NubHandler type for domain message callbacks
  - createDispatch() factory for isolated NUB registries
  - registerNub/dispatch/getRegisteredDomains singleton API
  - NubDispatch interface for dispatch instance shape
affects: [77-nub-module-scaffold, 78-shim-sdk-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [factory-with-singleton dispatch, domain-prefix message routing]

key-files:
  created:
    - packages/core/src/dispatch.ts
    - packages/core/src/dispatch.test.ts
  modified:
    - packages/core/src/index.ts

key-decisions:
  - "Used vitest instead of node:test for dispatch tests (matching existing core test convention)"
  - "Factory + module-level singleton pattern: createDispatch() for isolation, named exports for convenience"
  - "Domain extraction via first dot in message.type; empty prefix or no dot returns false"

patterns-established:
  - "NUB registration pattern: registerNub(domain, handler) stores callback; dispatch(message) routes by type prefix"
  - "Factory isolation pattern: createDispatch() returns fresh registry for testing; singleton for production use"

requirements-completed: [CORE-01, CORE-02]

# Metrics
duration: 3min
completed: 2026-04-07
---

# Phase 76 Plan 01: Core Envelope Types Summary

**NUB dispatch infrastructure with factory-isolated registries, domain-prefix routing, and 12-test conformance suite**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-07T11:14:08Z
- **Completed:** 2026-04-07T11:17:21Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- NUB registration and message dispatch system in @napplet/core
- createDispatch() factory enabling isolated registries for testing and multi-instance use
- 12 vitest tests covering all dispatch behaviors (registration, routing, error cases, factory isolation)
- Barrel exports updated with dispatch infrastructure and legacy constants marked @deprecated
- Full monorepo build (8 packages) and type-check (9 tasks) green

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dispatch.ts with NUB registration and message dispatch** (TDD)
   - `ea122db` (test) - Add failing tests for NUB dispatch infrastructure
   - `ebbc083` (feat) - Implement NUB dispatch infrastructure
2. **Task 2: Update barrel exports and verify full build** - `1e8e333` (feat)

## Files Created/Modified
- `packages/core/src/dispatch.ts` - NubHandler type, createDispatch factory, registerNub/dispatch/getRegisteredDomains
- `packages/core/src/dispatch.test.ts` - 12 vitest tests covering all dispatch behaviors
- `packages/core/src/index.ts` - Barrel exports for dispatch infrastructure, @deprecated JSDoc on legacy section

## Decisions Made
- Used vitest instead of node:test for dispatch tests -- plan specified node:test but core's tsconfig has no Node.js types (`lib: ["ES2022"]` only), and existing index.test.ts uses vitest. Matching project convention avoids type-check failures.
- Factory + singleton dual API: createDispatch() for isolated testing, module-level named exports for convenience imports.
- Domain extraction uses indexOf('.') returning false for dotIndex <= 0, which handles both no-dot and empty-prefix cases cleanly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched from node:test to vitest for dispatch tests**
- **Found during:** Task 2 (barrel exports + build verification)
- **Issue:** Plan specified `node:test` + `node:assert` but core package's tsconfig has `lib: ["ES2022"]` with no Node.js type declarations. `tsc --noEmit` fails with `Cannot find module 'node:test'`.
- **Fix:** Rewrote dispatch.test.ts to use vitest (describe/it/expect), matching the existing index.test.ts pattern.
- **Files modified:** packages/core/src/dispatch.test.ts
- **Verification:** `npx vitest run` passes 12/12 tests; `pnpm type-check` passes all 9 tasks
- **Committed in:** 1e8e333 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to pass type-check. No scope creep -- identical test coverage with vitest assertions.

## Issues Encountered
None beyond the test framework deviation above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all exports are fully implemented with no placeholder data.

## Next Phase Readiness
- @napplet/core now exports the dispatch infrastructure NUB modules need to register
- Phase 77 (NUB Module Scaffold) can import registerNub/NubHandler from @napplet/core
- Phase 77 is BLOCKED awaiting NUB specs from nubs repo -- not a code dependency

## Self-Check: PASSED

- All 3 created/modified files exist on disk
- All 3 task commits (ea122db, ebbc083, 1e8e333) found in git log
- Build and type-check green
- 12/12 vitest tests pass

---
*Phase: 76-core-envelope-types*
*Completed: 2026-04-07*
