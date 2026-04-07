---
phase: 67-cross-repo-wiring-docs
plan: 01
subsystem: docs
tags: [readme, cross-repo, kehto, documentation]

requires:
  - phase: 63-kehto-source-migration
    provides: "@kehto packages with @napplet/core peerDependency declarations"
  - phase: 65-napplet-cleanup
    provides: "4-package @napplet monorepo (core, shim, sdk, vite-plugin)"
provides:
  - "Root README describing 4-package @napplet SDK with @kehto cross-references"
  - "Package READMEs directing users to @kehto for runtime/shell integration"
  - "Verified @kehto peerDependency declarations for @napplet/core"
affects: []

tech-stack:
  added: []
  patterns:
    - "@kehto cross-reference pattern in documentation"

key-files:
  created: []
  modified:
    - README.md
    - packages/core/README.md
    - packages/shim/README.md
    - packages/sdk/README.md
    - packages/vite-plugin/README.md

key-decisions:
  - "@kehto/acl does not import @napplet/core -- no peerDependency needed (zero-dep by design)"
  - "Removed 7-package architecture diagram, replaced with 4-package graph"
  - "Fixed incorrect hasService named import in vite-plugin README (shim has no named exports)"

patterns-established:
  - "Cross-repo documentation: @napplet READMEs link to @kehto GitHub for shell-side packages"

requirements-completed: [KEHTO-04, DOC-01, DOC-02]

duration: 3min
completed: 2026-04-06
---

# Phase 67 Plan 01: Cross-Repo Wiring & Docs Summary

**4-package @napplet SDK README rewrite with @kehto cross-references and verified peerDependency declarations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-06T17:57:52Z
- **Completed:** 2026-04-06T18:00:54Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Verified @kehto peerDependency declarations are correct (runtime, shell, services have @napplet/core; acl does not need it)
- Root README rewritten for 4-package SDK (core, shim, sdk, vite-plugin) with @kehto cross-references
- All 5 package READMEs updated to redirect runtime/shell references to @kehto
- Fixed incorrect `import { hasService } from '@napplet/shim'` in vite-plugin README (shim has no named exports)

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify and complete @kehto peerDependency declarations** - no commit (verification-only; all declarations already correct)
2. **Task 2: Update all @napplet READMEs for the 4-package SDK** - `4c3c7d0` (docs)

## Files Created/Modified
- `README.md` - Rewritten for 4-package SDK with @kehto cross-references in package table, dependency graph, communication diagram, origin, and related sections
- `packages/core/README.md` - Integration Note updated to reference @kehto consumers; @napplet/acl reference changed to @kehto/acl
- `packages/shim/README.md` - Prerequisites redirected from @napplet/runtime to @kehto/shell
- `packages/sdk/README.md` - Prerequisites redirected from @napplet/runtime to @kehto/shell
- `packages/vite-plugin/README.md` - "testing locally with @napplet/shell" changed to @kehto/shell; hasService import fixed to window.napplet.services.has() pattern

## Decisions Made
- @kehto/acl does not import @napplet/core, so no peerDependency declaration is needed -- acl is zero-dep by design
- Removed the "Runtime Communication Flow" diagram showing @napplet/shell internals and replaced with a simplified napplet-side-only communication diagram
- Fixed the `import { hasService } from '@napplet/shim'` code example in vite-plugin README -- @napplet/shim has zero named exports per v0.8.0 design rule

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stale @napplet/acl reference in core README**
- **Found during:** Task 2 (README updates)
- **Issue:** The Capability type description referenced `@napplet/acl` which is now `@kehto/acl`
- **Fix:** Changed to `@kehto/acl` with GitHub link
- **Files modified:** packages/core/README.md
- **Verification:** Stale reference check passes
- **Committed in:** 4c3c7d0 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary to eliminate all stale package references. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All @napplet documentation is current for the 4-package SDK
- @kehto peerDependency declarations are complete
- npm publish remains blocked on human npm auth (PUB-04)

## Self-Check: PASSED

All files verified present. Commit 4c3c7d0 confirmed in git log.

---
*Phase: 67-cross-repo-wiring-docs*
*Completed: 2026-04-06*
