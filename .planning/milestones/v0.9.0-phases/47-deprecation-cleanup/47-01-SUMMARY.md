---
phase: 47-deprecation-cleanup
plan: 01
subsystem: api
tags: [typescript, types, deprecation, breaking-change]

requires:
  - phase: 37-api-alignment
    provides: RuntimeAdapter/ShellAdapter canonical names with deprecated aliases
provides:
  - RuntimeHooks type alias permanently removed from @napplet/runtime
  - ShellHooks type alias permanently removed from @napplet/shell
  - createMockRuntimeHooks test utility permanently removed
  - All internal code uses canonical RuntimeAdapter/ShellAdapter names exclusively
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - packages/runtime/src/types.ts
    - packages/runtime/src/index.ts
    - packages/runtime/src/test-utils.ts
    - packages/runtime/src/dispatch.test.ts
    - packages/runtime/src/discovery.test.ts
    - packages/runtime/README.md
    - packages/shell/src/types.ts
    - packages/shell/src/index.ts
    - packages/shell/src/hooks-adapter.ts
    - packages/shell/README.md
    - packages/services/README.md
    - apps/demo/src/shell-host.ts
    - tests/unit/shell-runtime-integration.test.ts
    - tests/helpers/mock-hooks.ts
    - tests/e2e/harness/harness.ts

key-decisions:
  - "Also cleaned stale RuntimeRelayPoolHooks/RuntimeCacheHooks names from shell README (renamed to RelayPoolAdapter/CacheAdapter in v0.7.0)"

patterns-established: []

requirements-completed: [DEP-03, DEP-04]

duration: 5min
completed: 2026-04-02
---

# Plan 47-01: Remove RuntimeHooks and ShellHooks Deprecated Aliases Summary

**Deleted RuntimeHooks/ShellHooks deprecated type aliases and createMockRuntimeHooks test utility across 15 files; importing the old names now fails at compile time**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-02T15:51:00Z
- **Completed:** 2026-04-02T15:56:00Z
- **Tasks:** 15
- **Files modified:** 15

## Accomplishments
- Deleted `RuntimeHooks` type alias from `@napplet/runtime` (types.ts definition + index.ts re-export)
- Deleted `ShellHooks` type alias from `@napplet/shell` (types.ts definition + index.ts re-export)
- Deleted `createMockRuntimeHooks` deprecated test utility wrapper
- Updated all 15 internal files (tests, demo, helpers, READMEs, JSDoc) to use canonical names
- Fixed stale `RuntimeRelayPoolHooks`/`RuntimeCacheHooks` names in shell README (bonus cleanup)
- Verified `pnpm build` (15 packages) and `pnpm type-check` (16 tasks) pass clean
- Verified zero remaining occurrences of deprecated names in all `.ts` and `.md` files

## Task Commits

All 15 tasks committed atomically in a single commit (pure renaming with no behavioral changes):

1. **Task 1-15: Delete deprecated aliases and update all references** - `369fbcb` (refactor)

## Files Created/Modified
- `packages/runtime/src/types.ts` - Removed RuntimeHooks type alias
- `packages/runtime/src/index.ts` - Removed RuntimeHooks from re-export list
- `packages/runtime/src/test-utils.ts` - Removed createMockRuntimeHooks wrapper
- `packages/runtime/src/dispatch.test.ts` - 10 call sites updated to createMockRuntimeAdapter
- `packages/runtime/src/discovery.test.ts` - 7 call sites updated to createMockRuntimeAdapter
- `packages/runtime/README.md` - All RuntimeHooks references updated to RuntimeAdapter
- `packages/shell/src/types.ts` - Removed ShellHooks type alias
- `packages/shell/src/index.ts` - Removed ShellHooks from re-export list
- `packages/shell/src/hooks-adapter.ts` - JSDoc updated from ShellHooks/RuntimeHooks
- `packages/shell/README.md` - All ShellHooks/RuntimeHooks references updated
- `packages/services/README.md` - RuntimeHooks.services references updated
- `apps/demo/src/shell-host.ts` - ShellHooks import and annotations updated
- `tests/unit/shell-runtime-integration.test.ts` - RuntimeHooks import and call sites updated
- `tests/helpers/mock-hooks.ts` - ShellHooks import and annotations updated
- `tests/e2e/harness/harness.ts` - JSDoc comment updated

## Decisions Made
- Combined all 15 tasks into a single atomic commit since they are all part of one coherent rename operation with no behavioral changes
- Also fixed stale `RuntimeRelayPoolHooks`/`RuntimeCacheHooks` type names in shell README that were left over from v0.7.0 rename

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 47 complete, deprecated aliases permanently removed
- Phase 48 (Specification & Documentation) can proceed independently

---
*Phase: 47-deprecation-cleanup*
*Completed: 2026-04-02*
