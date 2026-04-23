---
phase: 17-shell-export-cleanup
plan: 01
subsystem: api
tags: [typescript, exports, shell, runtime, refactor]

# Dependency graph
requires:
  - phase: 14-shell-adapter-shim-rewire
    provides: Runtime package with enforce.ts, nappKeyRegistry, aclState
provides:
  - Clean shell public API surface with no dead exports
  - Enforce functions re-exported from @napplet/runtime (not local duplicate)
  - All consumers updated to use runtime-backed accessors
affects: [npm-publish, downstream-integrators]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shell re-exports enforce functions from @napplet/runtime for backwards compatibility"
    - "Consumers access nappKeyRegistry and aclState via relay.runtime accessor"

key-files:
  created: []
  modified:
    - packages/shell/src/index.ts
    - tests/e2e/shell-host.html
    - apps/demo/src/shell-host.ts

key-decisions:
  - "Remove all singleton exports (nappKeyRegistry, aclStore) from shell -- consumers use relay.runtime accessor"
  - "Re-export enforce functions from @napplet/runtime for backwards compatibility rather than requiring direct import"

patterns-established:
  - "Runtime-backed accessor pattern: relay.runtime.nappKeyRegistry, relay.runtime.aclState"
  - "Backwards-compatible re-exports from @napplet/runtime through @napplet/shell"

requirements-completed: [CLEAN-01, CLEAN-02, CLEAN-03]

# Metrics
duration: 3min
completed: 2026-03-31
---

# Phase 17 Plan 01: Shell Export Cleanup Summary

**Removed 8 dead exports from @napplet/shell, deleted duplicate enforce.ts, re-pointed enforce re-exports to @napplet/runtime**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-31T13:23:09Z
- **Completed:** 2026-03-31T13:26:30Z
- **Tasks:** 3
- **Files modified:** 3 (plus 1 deleted)

## Accomplishments
- Cleaned shell public API: removed handleStateRequest, cleanupNappState, nappKeyRegistry, aclStore, DEFAULT_STATE_QUOTA, PendingUpdate exports
- Deleted packages/shell/src/enforce.ts (211-line duplicate of runtime's enforce.ts)
- Re-pointed enforce re-exports (createEnforceGate, resolveCapabilities, formatDenialReason + types) to @napplet/runtime
- Updated e2e test host: createPseudoRelay -> createShellBridge, standalone nappKeyRegistry -> relay.runtime.nappKeyRegistry
- Updated demo shell-host: removed aclStore/nappKeyRegistry imports, all ACL and registry calls go through relay.runtime
- All 148 tests pass (26 unit + 122 e2e), build and type-check clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Clean shell/src/index.ts export surface** - `81299d7` (refactor)
2. **Task 2: Delete enforce.ts duplicate and update consumers** - `aa79b0e` (refactor)
3. **Task 3: Verify build, type-check, and test suite** - verification only, no commit

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified
- `packages/shell/src/index.ts` - Cleaned export surface: removed 8 dead exports, re-pointed enforce to @napplet/runtime
- `packages/shell/src/enforce.ts` - DELETED (211-line duplicate of runtime's enforce.ts)
- `tests/e2e/shell-host.html` - Fixed: createPseudoRelay -> createShellBridge, nappKeyRegistry -> relay.runtime.nappKeyRegistry
- `apps/demo/src/shell-host.ts` - Fixed: removed nappKeyRegistry/aclStore imports, use relay.runtime accessors

## Decisions Made
- Remove all singleton exports (nappKeyRegistry, aclStore) from shell -- consumers must use relay.runtime accessor. This enforces the runtime-owns-state architecture established in Phase 14.
- Re-export enforce functions from @napplet/runtime rather than requiring direct import. This preserves backwards compatibility for any code importing from @napplet/shell.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Shell public API is clean and ready for npm publish
- All consumers updated to use runtime-backed accessors
- No remaining dead exports or duplicate code in @napplet/shell

## Self-Check: PASSED

All files verified present. All commits verified in git log. enforce.ts confirmed deleted.

---
*Phase: 17-shell-export-cleanup*
*Completed: 2026-03-31*
