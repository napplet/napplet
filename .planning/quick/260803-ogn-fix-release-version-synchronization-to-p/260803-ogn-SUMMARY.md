---
phase: quick-260803-ogn
plan: "01"
subsystem: release-tooling
tags: [node-test, jsr, npm-exports, changesets]
requires: []
provides:
  - "JSR version synchronization ignores npm-only wildcard asset exports while validating concrete source modules."
  - "Fixture-backed release-tooling regression coverage runs from the root test command."
affects: [version-packages, publish-jsr, ci]
tech-stack:
  added: []
  patterns:
    - "Use isolated temporary package trees to verify release metadata transformations."
key-files:
  created:
    - scripts/sync-jsr-versions.test.mjs
  modified:
    - scripts/sync-jsr-versions.mjs
    - package.json
key-decisions:
  - "Treat wildcard npm exports as asset patterns, never as JSR source-module targets."
  - "Keep concrete dist-to-src existence validation fail-closed."
patterns-established:
  - "Root release tooling exports its synchronizer behind an ESM direct-execution guard for fixture tests."
requirements-completed: [QUICK-260803-ogn]
coverage:
  - id: D1
    description: "Release synchronization preserves npm wildcard assets without fabricating JSR exports."
    requirement: QUICK-260803-ogn
    verification:
      - kind: unit
        ref: "scripts/sync-jsr-versions.test.mjs#syncs concrete exports while preserving npm-only wildcard assets"
        status: pass
      - kind: integration
        ref: "pnpm test:release-tooling && node scripts/sync-jsr-versions.mjs && pnpm check:jsr"
        status: pass
    human_judgment: false
duration: 15min
completed: 2026-08-03
status: complete
---

# Quick Task 260803-ogn: JSR Wildcard Export Synchronization Summary

**Release metadata synchronization now preserves npm-only `./skills/*` assets while regenerating and strictly validating concrete JSR source exports.**

## Performance

- **Duration:** 15 min
- **Tasks:** 1/1
- **Files modified:** 3

## Accomplishments

- Exported `syncJsrVersions()` for isolated fixtures while preserving the existing direct Node CLI behavior.
- Omitted only wildcard npm export patterns from regenerated JSR exports before path translation or source checks.
- Added root-wired regression coverage for concrete export conversion, wildcard preservation, internal import/version rewrites, Deno-first sync, and missing-source failure.

## Task Commits

1. **Task 1 RED: release-tooling regression** - `f0af9a52` (`test`)
2. **Task 1 GREEN: wildcard export synchronization** - `15783676` (`fix`)

## Files Created/Modified

- `scripts/sync-jsr-versions.mjs` - Importable, directly executable synchronizer that skips npm wildcard asset patterns.
- `scripts/sync-jsr-versions.test.mjs` - Temporary-workspace regression fixtures and strict missing-source coverage.
- `package.json` - Root `test:release-tooling` command included in `pnpm test`.

## Decisions Made

- Skip a mapping when either its npm subpath or selected `import`/`default` target contains `*`; retain all concrete source translation and existence checks.
- Do not add a changeset because only private root release tooling and tests changed.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `pnpm test:release-tooling`
- `node scripts/sync-jsr-versions.mjs`
- `pnpm check:jsr`
- `pnpm test`
- `pnpm type-check`
- `pnpm build`
- `pnpm dlx aislop@0.12.0 scan --changes --base origin/main .` — 100/100; one non-blocking function-length warning
- `git diff --check`

## Next Phase Readiness

`pnpm version-packages` and JSR publishing can process the existing `@napplet/skills` wildcard asset export without creating a fictitious source module.

## Self-Check: PASSED

- Quick summary exists at the required path.
- Both TDD commits (`f0af9a52`, `15783676`) exist and the green commit has no unintended deletions.
