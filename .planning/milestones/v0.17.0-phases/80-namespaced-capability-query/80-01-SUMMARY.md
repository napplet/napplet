---
phase: 80-namespaced-capability-query
plan: 01
subsystem: api
tags: [typescript, template-literals, type-safety, capability-query]

# Dependency graph
requires:
  - phase: 76-core-envelope-types
    provides: ShellSupports interface and NubDomain type in @napplet/core
provides:
  - NamespacedCapability union type with nub:/perm:/svc: prefixes
  - Type-safe ShellSupports.supports() signature
  - Type-level compile tests for all four capability forms
affects: [shell-runtime, napplet-consumers]

# Tech tracking
tech-stack:
  added: []
  patterns: [template-literal-union-types-for-capability-namespacing]

key-files:
  created: []
  modified:
    - packages/core/src/envelope.ts
    - packages/core/src/types.ts
    - packages/core/src/index.ts
    - packages/core/src/index.test.ts
    - packages/sdk/src/index.ts

key-decisions:
  - "NamespacedCapability exported as public type (not kept inline)"
  - "SDK re-exports NamespacedCapability for consumer access (Rule 2 deviation)"

patterns-established:
  - "Namespaced capability prefixes: nub: for NUB domains, perm: for permissions, svc: for services"
  - "Bare NUB domain strings remain valid as shorthand (backward compatible)"

requirements-completed: [CAP-01, CAP-02, CAP-03]

# Metrics
duration: 3min
completed: 2026-04-08
---

# Phase 80 Plan 01: Namespaced Capability Query Summary

**NamespacedCapability template literal union type replacing flat NubDomain|string with structured nub:/perm:/svc: prefixes on ShellSupports.supports()**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-07T23:55:36Z
- **Completed:** 2026-04-07T23:59:02Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- ShellSupports.supports() now accepts structured NamespacedCapability instead of NubDomain|string
- NamespacedCapability type distinguishes NUB domains, permissions, and services via prefixes
- 5 type-level tests verify all four capability forms compile correctly
- All JSDoc examples updated with namespaced forms across core and types
- SDK re-exports NamespacedCapability for downstream consumer access

## Task Commits

Each task was committed atomically:

1. **Task 1: Update ShellSupports type and JSDoc in core** - `a413a46` (feat)
2. **Task 2: Update shim stub and add type-level tests** - `3704b2f` (test)
3. **Deviation: SDK re-export** - `339bb39` (feat)

## Files Created/Modified
- `packages/core/src/envelope.ts` - NamespacedCapability type, updated ShellSupports and NappletGlobalShell
- `packages/core/src/types.ts` - Updated JSDoc on NappletGlobal.shell with namespaced examples
- `packages/core/src/index.ts` - Added NamespacedCapability to barrel export
- `packages/core/src/index.test.ts` - 5 new type-level tests for namespaced capabilities
- `packages/sdk/src/index.ts` - Added NamespacedCapability to SDK re-exports

## Decisions Made
- NamespacedCapability exported as a public type alias (plan gave discretion) -- makes it importable for downstream consumers
- SDK re-export added via deviation Rule 2 -- consumers of ShellSupports need the parameter type

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added NamespacedCapability to SDK re-exports**
- **Found during:** Post-task verification
- **Issue:** SDK re-exports ShellSupports but not its parameter type NamespacedCapability -- consumers couldn't type-annotate capability strings
- **Fix:** Added NamespacedCapability to SDK barrel export from @napplet/core
- **Files modified:** packages/sdk/src/index.ts
- **Verification:** pnpm type-check passes
- **Committed in:** 339bb39

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for SDK consumers to use the new type. No scope creep.

## Issues Encountered
- 2 pre-existing test failures in `removed handshake exports` suite (BusKind.REGISTRATION still exists in legacy.ts but tests assert it's removed) -- unrelated to this plan's changes, not fixed per scope boundary rule

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Shell runtime (separate repo) can implement supports() with NamespacedCapability parsing
- Bare NUB domain shorthand preserved for backward compatibility
- Pre-existing test failures in legacy BusKind suite should be addressed in a future cleanup

## Self-Check: PASSED

All 5 files exist. All 3 commits verified (a413a46, 3704b2f, 339bb39).

---
*Phase: 80-namespaced-capability-query*
*Completed: 2026-04-08*
