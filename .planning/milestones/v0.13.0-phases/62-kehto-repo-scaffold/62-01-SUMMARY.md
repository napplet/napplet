---
phase: 62-kehto-repo-scaffold
plan: 01
subsystem: infra
tags: [pnpm, turborepo, tsup, typescript, monorepo, kehto]

# Dependency graph
requires: []
provides:
  - "~/Develop/kehto git repo with buildable pnpm monorepo"
  - "@kehto/acl, @kehto/runtime, @kehto/shell, @kehto/services package shells"
  - "Workspace dependency graph: acl -> runtime -> shell|services"
  - "TypeScript strict/ESM-only base config"
  - "Turborepo build pipeline with changeset versioning"
affects: [62-02-kehto-gsd-seed, 63-code-extraction]

# Tech tracking
tech-stack:
  added: [pnpm, turborepo, tsup, typescript, changesets, "@noble/hashes", "@noble/curves"]
  patterns: [pnpm-workspace, turbo-pipeline, esm-only-packages, workspace-star-deps]

key-files:
  created:
    - "~/Develop/kehto/package.json"
    - "~/Develop/kehto/turbo.json"
    - "~/Develop/kehto/tsconfig.json"
    - "~/Develop/kehto/pnpm-workspace.yaml"
    - "~/Develop/kehto/.npmrc"
    - "~/Develop/kehto/.changeset/config.json"
    - "~/Develop/kehto/packages/acl/package.json"
    - "~/Develop/kehto/packages/runtime/package.json"
    - "~/Develop/kehto/packages/shell/package.json"
    - "~/Develop/kehto/packages/services/package.json"
    - "~/Develop/kehto/packages/*/tsconfig.json"
    - "~/Develop/kehto/packages/*/tsup.config.ts"
    - "~/Develop/kehto/packages/*/src/index.ts"
  modified: []

key-decisions:
  - "Added .npmrc with auto-install-peers=false to handle unpublished @napplet/core peer dep"
  - "Mirrored @napplet monorepo conventions exactly (tsup, turbo, TS strict, ESM-only)"

patterns-established:
  - "@kehto packages use workspace:* for internal deps, peerDependencies for @napplet/core"
  - "All packages share identical tsconfig.json extending root, identical tsup.config.ts"
  - "Package shell pattern: empty export {} in src/index.ts, real source comes in Phase 63"

requirements-completed: [KEHTO-01, KEHTO-02]

# Metrics
duration: 3min
completed: 2026-04-06
---

# Phase 62 Plan 01: Kehto Repo Scaffold Summary

**Fully buildable ~/Develop/kehto pnpm monorepo with 4 @kehto package shells (acl, runtime, shell, services), turborepo pipeline, TypeScript strict/ESM config, and workspace dependency graph**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-06T15:58:13Z
- **Completed:** 2026-04-06T16:01:12Z
- **Tasks:** 2
- **Files modified:** 25

## Accomplishments
- Initialized ~/Develop/kehto as a git repo with root monorepo config matching @napplet conventions
- Created 4 package shells (@kehto/acl, @kehto/runtime, @kehto/shell, @kehto/services) with correct workspace dependency graph
- pnpm install, pnpm build, and pnpm type-check all pass cleanly
- Workspace dependencies wired: runtime->acl, shell->runtime, services->runtime
- @napplet/core listed as peerDependency in runtime, shell, and services (not yet on npm)

## Task Commits

Each task was committed atomically in the ~/Develop/kehto repo:

1. **Task 1: Initialize monorepo root** - `af020be` (chore)
2. **Task 2: Create four @kehto package shells** - `554fdf4` (feat)

## Files Created/Modified
- `~/Develop/kehto/package.json` - Root monorepo config (pnpm 10.8.0, turborepo, changesets)
- `~/Develop/kehto/turbo.json` - Turborepo task pipeline (build->type-check->test)
- `~/Develop/kehto/tsconfig.json` - Shared TypeScript config (strict, ES2022, ESNext, bundler)
- `~/Develop/kehto/pnpm-workspace.yaml` - pnpm workspace definition (packages/*)
- `~/Develop/kehto/.gitignore` - Standard ignores (node_modules, dist, .turbo, .claude)
- `~/Develop/kehto/.npmrc` - Relaxed peer dep resolution for unpublished @napplet/core
- `~/Develop/kehto/.changeset/config.json` - Changesets config (public access, main branch)
- `~/Develop/kehto/packages/acl/` - @kehto/acl package shell (zero deps)
- `~/Develop/kehto/packages/runtime/` - @kehto/runtime package shell (depends on acl, peers @napplet/core)
- `~/Develop/kehto/packages/shell/` - @kehto/shell package shell (depends on runtime, peers nostr-tools)
- `~/Develop/kehto/packages/services/` - @kehto/services package shell (depends on runtime)
- `~/Develop/kehto/pnpm-lock.yaml` - Generated lockfile

## Decisions Made
- Added `.npmrc` with `auto-install-peers=false` and `strict-peer-dependencies=false` to prevent pnpm from trying to fetch unpublished @napplet/core from npm registry. Phase 63 will add workspace overrides to link it locally.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added .npmrc for unpublished peer dependency**
- **Found during:** Task 2 (pnpm install)
- **Issue:** pnpm install failed with ERR_PNPM_FETCH_404 because @napplet/core is not yet published to npm, but runtime/shell/services declare it as peerDependency
- **Fix:** Created .npmrc with auto-install-peers=false and strict-peer-dependencies=false
- **Files modified:** ~/Develop/kehto/.npmrc
- **Verification:** pnpm install succeeds, pnpm build succeeds, pnpm type-check succeeds
- **Committed in:** 554fdf4 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for installation to succeed with unpublished peer deps. No scope creep.

## Issues Encountered
None beyond the deviation above.

## Known Stubs
All four packages have `export {};` in src/index.ts -- these are intentional empty barrel exports that will be replaced with real source code in Phase 63 (code extraction).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ~/Develop/kehto repo is fully initialized and buildable
- Ready for Plan 62-02 (GSD seed) to add PROJECT.md and planning context
- Ready for Phase 63 to copy actual source code from @napplet packages

## Self-Check: PASSED

All 15 created files verified present. Both commit hashes (af020be, 554fdf4) confirmed in ~/Develop/kehto git log. SUMMARY.md exists in napplet planning directory.

---
*Phase: 62-kehto-repo-scaffold*
*Completed: 2026-04-06*
