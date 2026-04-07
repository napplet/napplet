---
phase: 63-package-migration
plan: 01
subsystem: infra
tags: [kehto, migration, acl, runtime, pnpm-overrides, cross-repo-link]

# Dependency graph
requires:
  - phase: 62-kehto-repo-scaffold
    provides: kehto monorepo with package stubs (acl, runtime, shell, services)
provides:
  - "@kehto/acl with 4 source files (types, check, mutations, index)"
  - "@kehto/runtime with 16 source files (full protocol engine)"
  - "@napplet/core linked as cross-repo dependency via pnpm"
  - "All @napplet/acl imports rewritten to @kehto/acl"
  - "All @napplet/runtime and @napplet/shell comment references rewritten"
  - "All @napplet/core imports preserved unchanged"
affects: [63-02-package-migration, kehto-shell, kehto-services]

# Tech tracking
tech-stack:
  added: [vitest]
  patterns: [cross-repo pnpm link for @napplet/core peer dep]

key-files:
  created:
    - /home/sandwich/Develop/kehto/packages/acl/src/types.ts
    - /home/sandwich/Develop/kehto/packages/acl/src/check.ts
    - /home/sandwich/Develop/kehto/packages/acl/src/mutations.ts
    - /home/sandwich/Develop/kehto/packages/runtime/src/runtime.ts
    - /home/sandwich/Develop/kehto/packages/runtime/src/acl-state.ts
    - /home/sandwich/Develop/kehto/packages/runtime/src/enforce.ts
    - /home/sandwich/Develop/kehto/packages/runtime/src/types.ts
  modified:
    - /home/sandwich/Develop/kehto/package.json
    - /home/sandwich/Develop/kehto/packages/acl/src/index.ts
    - /home/sandwich/Develop/kehto/packages/runtime/src/index.ts
    - /home/sandwich/Develop/kehto/packages/runtime/package.json

key-decisions:
  - "Used devDependency link for @napplet/core in runtime package.json (satisfies peer dep during dev)"
  - "Added vitest to runtime devDependencies for test file type-checking"

patterns-established:
  - "Cross-repo link pattern: devDependency link + pnpm.overrides for @napplet/core"
  - "Import rewrite rules: @napplet/core stays, @napplet/{acl,runtime,shell} become @kehto/*"

requirements-completed: [KEHTO-03]

# Metrics
duration: 8min
completed: 2026-04-06
---

# Phase 63 Plan 01: Package Migration Summary

**Migrated @kehto/acl (4 files) and @kehto/runtime (16 files) from @napplet with cross-repo @napplet/core link, all imports rewritten, both packages building and type-checking clean**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-06T16:18:04Z
- **Completed:** 2026-04-06T16:26:25Z
- **Tasks:** 2
- **Files modified:** 25 (7 Task 1 + 18 Task 2)

## Accomplishments
- Linked @napplet/core as a cross-repo dependency in kehto via pnpm devDependency link + overrides
- Copied and rewritten all 4 @kehto/acl source files with zero @napplet/acl references
- Copied and rewritten all 16 @kehto/runtime source files with @napplet/acl -> @kehto/acl, @napplet/runtime -> @kehto/runtime, while preserving all @napplet/core imports
- Both packages build with tsup and type-check with tsc (zero errors)

## Task Commits

Each task was committed atomically (in ~/Develop/kehto):

1. **Task 1: Link @napplet/core and migrate @kehto/acl source** - `0685f05` (feat)
2. **Task 2: Migrate @kehto/runtime source (16 files)** - `a24d4ff` (feat)

## Files Created/Modified

### @kehto/acl (4 source files)
- `packages/acl/src/index.ts` - Barrel export with all public API (@kehto/acl header)
- `packages/acl/src/types.ts` - ACL type definitions and capability bit constants
- `packages/acl/src/check.ts` - Pure check function with @kehto/acl JSDoc examples
- `packages/acl/src/mutations.ts` - ACL state mutation functions with @kehto/shell reference

### @kehto/runtime (16 source files)
- `packages/runtime/src/index.ts` - Runtime barrel export (@kehto/runtime header)
- `packages/runtime/src/types.ts` - RuntimeAdapter interfaces (@kehto/shell, @kehto/runtime comments)
- `packages/runtime/src/runtime.ts` - createRuntime factory (@kehto/runtime JSDoc example)
- `packages/runtime/src/acl-state.ts` - ACL state container (imports from @kehto/acl)
- `packages/runtime/src/enforce.ts` - Enforcement gate (@kehto/acl comments)
- `packages/runtime/src/event-buffer.ts` - Ring buffer and subscription delivery
- `packages/runtime/src/key-derivation.ts` - Deterministic keypair derivation
- `packages/runtime/src/manifest-cache.ts` - NIP-5A manifest cache
- `packages/runtime/src/replay.ts` - Replay detection
- `packages/runtime/src/service-discovery.ts` - Kind 29010 discovery synthesis
- `packages/runtime/src/service-dispatch.ts` - Service topic-prefix routing
- `packages/runtime/src/session-registry.ts` - Session registry (windowId <-> pubkey)
- `packages/runtime/src/state-handler.ts` - Napplet state request handler
- `packages/runtime/src/test-utils.ts` - Mock RuntimeAdapter for testing
- `packages/runtime/src/dispatch.test.ts` - Unit tests for message dispatch
- `packages/runtime/src/discovery.test.ts` - Unit tests for service discovery

### Configuration
- `package.json` - Added pnpm.overrides for @napplet/core link
- `packages/runtime/package.json` - Added @napplet/core devDependency link + vitest

## Decisions Made
- Used `devDependency: "link:/home/sandwich/Develop/napplet/packages/core"` in the runtime package.json to satisfy the @napplet/core peer dep during development. The pnpm override at root level provides an additional resolution path.
- Added vitest as a runtime devDependency so test files (dispatch.test.ts, discovery.test.ts) pass type-checking alongside the production source.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added vitest devDependency for test file type-checking**
- **Found during:** Task 2 (type-check step)
- **Issue:** Test files import from 'vitest' which was not a dependency in the kehto runtime package
- **Fix:** Added vitest ^4.1.2 to runtime devDependencies
- **Files modified:** packages/runtime/package.json, pnpm-lock.yaml
- **Verification:** `pnpm --filter @kehto/runtime type-check` passes with zero errors
- **Committed in:** a24d4ff (Task 2 commit)

**2. [Rule 3 - Blocking] Used direct link instead of pnpm override alone for @napplet/core**
- **Found during:** Task 1 (pnpm install step)
- **Issue:** pnpm.overrides with `link:` protocol did not install @napplet/core into node_modules when it was only a peer dep (auto-install-peers=false in .npmrc)
- **Fix:** Added @napplet/core as a devDependency with direct link path in runtime/package.json
- **Files modified:** packages/runtime/package.json
- **Verification:** `ls packages/runtime/node_modules/@napplet/core/dist/index.js` exists
- **Committed in:** 0685f05 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for the packages to resolve dependencies and type-check. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## Known Stubs
None - all source files contain complete implementations copied from @napplet.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- @kehto/acl and @kehto/runtime are fully migrated and building
- Ready for Plan 02: migrate @kehto/shell and @kehto/services
- The @napplet/core cross-repo link pattern is established and proven

## Self-Check: PASSED

- All 10 key files verified as present
- Commit 0685f05 verified in kehto repo (Task 1)
- Commit a24d4ff verified in kehto repo (Task 2)
- Both packages build and type-check with zero errors
- Zero stale @napplet/acl or @napplet/runtime references
- 20 @napplet/core import statements preserved across 12 files

---
*Phase: 63-package-migration*
*Completed: 2026-04-06*
