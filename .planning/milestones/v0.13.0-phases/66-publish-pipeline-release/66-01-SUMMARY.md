---
phase: 66-publish-pipeline-release
plan: 01
subsystem: infra
tags: [github-actions, ci, changesets, npm-publish, workflows]

requires: []
provides:
  - CI workflow running type-check, build, test on every PR
  - Publish workflow using changesets/action for automated npm publish
  - Clean changeset state with no stale references
  - All 4 packages at consistent v0.1.0 versions
affects: [66-02 (npm auth and first publish)]

tech-stack:
  added: [changesets/action@v1, pnpm/action-setup@v4]
  patterns: [concurrency group on publish workflow, frozen-lockfile in CI]

key-files:
  created:
    - .github/workflows/publish.yml
  modified:
    - .github/workflows/ci.yml
    - packages/shim/package.json
    - packages/vite-plugin/package.json

key-decisions:
  - "type-check before build in CI for fail-fast on type errors"
  - "concurrency group with cancel-in-progress: false to prevent parallel publish stomping"
  - "No replacement changeset created -- first publish triggered by fresh changeset after PUB-04 auth"

patterns-established:
  - "Publish workflow pattern: checkout, pnpm, node, install, build, changesets/action"
  - "CI workflow pattern: type-check first, then build, then test"

requirements-completed: [PUB-01, PUB-02, PUB-03]

duration: 1min
completed: 2026-04-06
---

# Phase 66 Plan 01: Publish Pipeline & Changeset Cleanup Summary

**CI and publish GitHub Actions workflows with stale changeset removal and version normalization to v0.1.0**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-06T17:42:59Z
- **Completed:** 2026-04-06T17:44:22Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Deleted stale changeset referencing @napplet/shell (no longer in this repo after kehto extraction)
- Normalized @napplet/shim and @napplet/vite-plugin from 0.1.0-alpha.1 to 0.1.0
- Updated CI workflow: renamed job to `ci`, reordered type-check before build for fail-fast
- Created publish workflow with changesets/action, concurrency group, and NPM_TOKEN secret

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix changeset artifacts and normalize versions** - `ff5b15f` (chore)
2. **Task 2: Update CI workflow and create publish workflow** - `d8b50f8` (feat)

## Files Created/Modified
- `.changeset/initial-release.md` - Deleted (referenced @napplet/shell which no longer exists)
- `.github/workflows/ci.yml` - Updated: renamed job, type-check before build
- `.github/workflows/publish.yml` - Created: automated npm publish via changesets
- `packages/shim/package.json` - Version normalized to 0.1.0
- `packages/vite-plugin/package.json` - Version normalized to 0.1.0

## Decisions Made
- type-check runs before build in CI for fail-fast on type errors
- Publish workflow uses `cancel-in-progress: false` to prevent mid-publish cancellation
- No replacement changeset created -- first publish will be triggered by a fresh changeset after human npm auth (PUB-04)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - NPM_TOKEN secret setup is handled in Plan 02 (PUB-04).

## Next Phase Readiness
- CI and publish workflows ready for use
- All packages at consistent v0.1.0
- Changesets config clean and correct
- NPM_TOKEN secret must be set by user before publish workflow can succeed (Plan 02)

## Self-Check: PASSED

All files verified present, deleted file confirmed removed, both commit hashes found in git log.

---
*Phase: 66-publish-pipeline-release*
*Completed: 2026-04-06*
