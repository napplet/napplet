---
phase: 63-package-migration
plan: 02
subsystem: infra
tags: [kehto, migration, shell, services, tsup, dom-types]

# Dependency graph
requires:
  - phase: 63-01-package-migration
    provides: "@kehto/acl and @kehto/runtime migrated with cross-repo @napplet/core link"
provides:
  - "@kehto/shell with 10 source files (browser adapter, ACL store, audio manager, registries)"
  - "@kehto/services with 10 source files (audio, notifications, signer, relay pool, cache, coordinated relay)"
  - "Full kehto monorepo builds and type-checks (all 4 packages, 40 source files)"
  - "All @napplet/{acl,runtime,shell,services} imports rewritten to @kehto/*"
  - "All @napplet/core imports preserved unchanged"
affects: [64-kehto-demo-migration, kehto-publish]

# Tech tracking
tech-stack:
  added: [vitest]
  patterns: [DOM lib inclusion for browser-specific packages, nostr-tools as tsup external]

key-files:
  created:
    - /home/sandwich/Develop/kehto/packages/shell/src/shell-bridge.ts
    - /home/sandwich/Develop/kehto/packages/shell/src/hooks-adapter.ts
    - /home/sandwich/Develop/kehto/packages/shell/src/types.ts
    - /home/sandwich/Develop/kehto/packages/shell/src/acl-store.ts
    - /home/sandwich/Develop/kehto/packages/shell/src/audio-manager.ts
    - /home/sandwich/Develop/kehto/packages/shell/src/manifest-cache.ts
    - /home/sandwich/Develop/kehto/packages/shell/src/origin-registry.ts
    - /home/sandwich/Develop/kehto/packages/shell/src/session-registry.ts
    - /home/sandwich/Develop/kehto/packages/shell/src/topics.ts
    - /home/sandwich/Develop/kehto/packages/services/src/audio-service.ts
    - /home/sandwich/Develop/kehto/packages/services/src/cache-service.ts
    - /home/sandwich/Develop/kehto/packages/services/src/coordinated-relay.ts
    - /home/sandwich/Develop/kehto/packages/services/src/notification-service.ts
    - /home/sandwich/Develop/kehto/packages/services/src/notification-service.test.ts
    - /home/sandwich/Develop/kehto/packages/services/src/relay-pool-service.ts
    - /home/sandwich/Develop/kehto/packages/services/src/signer-service.ts
    - /home/sandwich/Develop/kehto/packages/services/src/signer-service.test.ts
    - /home/sandwich/Develop/kehto/packages/services/src/types.ts
  modified:
    - /home/sandwich/Develop/kehto/packages/shell/src/index.ts
    - /home/sandwich/Develop/kehto/packages/shell/tsup.config.ts
    - /home/sandwich/Develop/kehto/packages/shell/tsconfig.json
    - /home/sandwich/Develop/kehto/packages/services/src/index.ts
    - /home/sandwich/Develop/kehto/packages/services/package.json

key-decisions:
  - "Added DOM and DOM.Iterable libs to shell tsconfig.json for browser type availability"
  - "Added vitest to services devDependencies for test file type-checking"

patterns-established:
  - "Browser-specific packages (shell) need DOM libs in tsconfig"
  - "nostr-tools externalized in shell tsup to avoid bundling peer deps"

requirements-completed: [KEHTO-03, KEHTO-07]

# Metrics
duration: 5min
completed: 2026-04-06
---

# Phase 63 Plan 02: Package Migration Summary

**Migrated @kehto/shell (10 files) and @kehto/services (10 files) from @napplet with all imports rewritten; full kehto monorepo (4 packages, 40 files) builds and type-checks clean**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-06T16:29:29Z
- **Completed:** 2026-04-06T16:34:06Z
- **Tasks:** 2
- **Files modified:** 23 (12 Task 1 + 12 Task 2, with pnpm-lock.yaml shared)

## Accomplishments
- Migrated all 10 @kehto/shell source files with @napplet/runtime -> @kehto/runtime and @napplet/shell -> @kehto/shell rewrites
- Migrated all 10 @kehto/services source files with @napplet/runtime -> @kehto/runtime and @napplet/services -> @kehto/services rewrites
- Full kehto monorepo pnpm build and pnpm type-check succeed with zero errors across all 4 packages
- All 40 source files across acl(4) + runtime(16) + shell(10) + services(10) contain correct @kehto/* imports
- Zero stale @napplet/{acl,runtime,shell,services} references anywhere in kehto source
- All @napplet/core imports preserved unchanged (peer dependency)

## Task Commits

Each task was committed atomically (in ~/Develop/kehto):

1. **Task 1: Migrate @kehto/shell source (10 files)** - `a99829a` (feat)
2. **Task 2: Migrate @kehto/services source (10 files)** - `38c7954` (feat)

## Files Created/Modified

### @kehto/shell (10 source files + 2 config)
- `packages/shell/src/index.ts` - Barrel export with @kehto/runtime re-exports
- `packages/shell/src/types.ts` - ShellAdapter and hook interfaces with @kehto/runtime types
- `packages/shell/src/shell-bridge.ts` - Browser adapter over @kehto/runtime
- `packages/shell/src/hooks-adapter.ts` - ShellAdapter-to-RuntimeAdapter bridge
- `packages/shell/src/acl-store.ts` - ACL store with @napplet/core capability imports
- `packages/shell/src/audio-manager.ts` - Audio source registry
- `packages/shell/src/manifest-cache.ts` - NIP-5A manifest cache
- `packages/shell/src/origin-registry.ts` - Window-to-windowId mapping
- `packages/shell/src/session-registry.ts` - Session/pubkey bidirectional registry
- `packages/shell/src/topics.ts` - Topic constant re-exports from @napplet/core
- `packages/shell/tsup.config.ts` - Added external: ['nostr-tools']
- `packages/shell/tsconfig.json` - Added DOM and DOM.Iterable libs

### @kehto/services (10 source files + 1 config)
- `packages/services/src/index.ts` - Barrel export with @kehto/services header
- `packages/services/src/types.ts` - AudioSource, Notification, and option interfaces
- `packages/services/src/audio-service.ts` - Audio service handler with @kehto/runtime import
- `packages/services/src/cache-service.ts` - Cache service handler with @kehto/runtime import
- `packages/services/src/coordinated-relay.ts` - Composite relay+cache handler
- `packages/services/src/notification-service.ts` - Notification state registry handler
- `packages/services/src/notification-service.test.ts` - 14 notification service unit tests
- `packages/services/src/relay-pool-service.ts` - Relay pool service handler
- `packages/services/src/signer-service.ts` - NIP-07 signer proxy handler
- `packages/services/src/signer-service.test.ts` - 13 signer service unit tests
- `packages/services/package.json` - Added vitest devDependency

## Decisions Made
- Added `DOM` and `DOM.Iterable` to shell tsconfig.json `lib` array to match napplet source (shell is browser-specific, uses MessageEvent, Window, localStorage, CustomEvent).
- Added `vitest ^4.1.2` to services devDependencies (same pattern as Plan 01 did for runtime) so test files pass type-checking alongside production source.
- Added `external: ['nostr-tools']` to shell tsup.config.ts to avoid bundling the peer dependency.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added DOM libs to shell tsconfig.json**
- **Found during:** Task 1 (build step)
- **Issue:** Shell source uses browser types (MessageEvent, Window, localStorage) that require DOM lib declarations
- **Fix:** Added `"DOM"` and `"DOM.Iterable"` to tsconfig.json lib array, matching the napplet shell config
- **Files modified:** packages/shell/tsconfig.json
- **Verification:** `pnpm --filter @kehto/shell build` and `type-check` pass with zero errors
- **Committed in:** a99829a (Task 1 commit)

**2. [Rule 3 - Blocking] Added vitest devDependency for test file type-checking**
- **Found during:** Task 2 (type-check step)
- **Issue:** Test files import from 'vitest' which was not a dependency in the kehto services package
- **Fix:** Added vitest ^4.1.2 to services devDependencies
- **Files modified:** packages/services/package.json, pnpm-lock.yaml
- **Verification:** `pnpm --filter @kehto/services type-check` passes with zero errors
- **Committed in:** 38c7954 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for the packages to compile and type-check. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## Known Stubs
None - all source files contain complete implementations copied from @napplet.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four @kehto packages are fully migrated, building, and type-checking
- 40 source files total: acl(4), runtime(16), shell(10), services(10)
- Ready for Phase 64: kehto demo migration or Phase 65: napplet cleanup
- The cross-repo @napplet/core link pattern is established and working across all 4 packages

## Self-Check: PASSED

- All 12 key files verified as present (source + dist)
- Commit a99829a verified in kehto repo (Task 1)
- Commit 38c7954 verified in kehto repo (Task 2)
- All 4 packages build and type-check with zero errors
- Zero stale @napplet/{acl,runtime,shell,services} references
- @napplet/core imports preserved across all packages

---
*Phase: 63-package-migration*
*Completed: 2026-04-06*
