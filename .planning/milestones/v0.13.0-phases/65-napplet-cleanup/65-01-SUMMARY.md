---
phase: 65-napplet-cleanup
plan: 01
subsystem: infra
tags: [monorepo, cleanup, pnpm, turborepo, workspace]

requires:
  - phase: 64-kehto-tests
    provides: Migrated tests and demo to kehto repo
provides:
  - Clean 4-package monorepo (core, shim, sdk, vite-plugin)
  - Updated workspace config for pnpm and vitest
  - Removed all extracted packages, demo, and test infrastructure
affects: [66-publish, CLAUDE.md update]

tech-stack:
  added: []
  patterns:
    - 4-package monorepo structure (core, shim, sdk, vite-plugin)

key-files:
  created: []
  modified:
    - pnpm-workspace.yaml
    - vitest.config.ts
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "Removed @playwright/test and @vitest/coverage-v8 from root devDependencies (no e2e tests remain)"
  - "Simplified test script to just turbo run test:unit (no playwright, no test:build chain)"

patterns-established:
  - "4-package monorepo: core, shim, sdk, vite-plugin -- all other packages live in @kehto"

requirements-completed: [CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04]

duration: 2min
completed: 2026-04-06
---

# Phase 65 Plan 01: Napplet Cleanup Summary

**Deleted 4 extracted packages (acl, runtime, shell, services), demo app, and test infrastructure; updated workspace/vitest/package.json for clean 4-package monorepo**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-06T17:27:51Z
- **Completed:** 2026-04-06T17:30:05Z
- **Tasks:** 2
- **Files modified:** 157 (153 deleted + 4 modified)

## Accomplishments
- Deleted packages/acl, packages/runtime, packages/shell, packages/services (migrated to @kehto)
- Deleted apps/demo, tests/, and playwright.config.ts
- Updated pnpm-workspace.yaml, vitest.config.ts, and root package.json for 4-package monorepo
- Verified pnpm build, type-check, and test:unit all pass with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete extracted packages, demo, and tests** - `ef67c53` (chore)
2. **Task 2: Update config files and verify clean build** - `4f279e2` (chore)

## Files Created/Modified
- `pnpm-workspace.yaml` - Reduced to single `packages/*` entry
- `vitest.config.ts` - Removed aliases for acl, runtime, services, shell; removed tests/ include/exclude
- `package.json` - Removed test:e2e, test:build, test:serve scripts; removed @playwright/test and @vitest/coverage-v8 devDeps
- `pnpm-lock.yaml` - Regenerated without deleted workspace packages

## Deleted (153 files)
- `packages/acl/` - 6 files (migrated to @kehto/acl)
- `packages/runtime/` - 16 files (migrated to @kehto/runtime)
- `packages/shell/` - 12 files (migrated to @kehto/shell)
- `packages/services/` - 11 files (migrated to @kehto/services)
- `apps/demo/` - 36 files (migrated to kehto demo)
- `tests/` - 71 files (unit, e2e, fixtures, harness -- migrated to kehto)
- `playwright.config.ts` - 1 file (no e2e tests remain)

## Decisions Made
- Removed @playwright/test and @vitest/coverage-v8 from root devDependencies since no e2e tests remain
- Simplified `test` script to just `turbo run test:unit` (was chaining test:build + test:unit + playwright)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Clean 4-package monorepo ready for Phase 66 (npm publish)
- .changeset/ preserved for publishing workflow
- .github/ preserved for CI updates
- 13 core unit tests passing

## Self-Check: PASSED

- SUMMARY.md: FOUND
- Task 1 commit ef67c53: FOUND
- Task 2 commit 4f279e2: FOUND
- pnpm-workspace.yaml: FOUND
- vitest.config.ts: FOUND
- package.json: FOUND
- Packages: core, sdk, shim, vite-plugin (4 of 4)

---
*Phase: 65-napplet-cleanup*
*Completed: 2026-04-06*
