---
phase: quick-260803-qdc
plan: "01"
subsystem: cli-release
tags: [deno, jsr, standalone-binary, compatibility]
requires:
  - quick-260803-f6z
  - quick-260803-ogn
provides:
  - "JSR-safe CLI exports with no unpublished workspace-package dependencies."
  - "Resolver-free standalone binaries built from a distribution-only entrypoint."
  - "Restored runPackageCli compatibility and complete shared skills help."
affects: [version-packages, publish-jsr, cli-consumers]
tech-stack:
  added: []
  patterns:
    - "Keep workspace-only imports in a publish-excluded standalone entrypoint and inject their runners into the public dispatcher."
    - "Render runtime-specific CLI adapters from one shared help contract."
key-files:
  created:
    - packages/cli/src/standalone.ts
    - packages/skills/src/cli-help.ts
  modified:
    - packages/cli/src/cli.ts
    - packages/cli/deno.json
    - packages/cli/tests/cli_test.ts
    - packages/cli/tests/resolver_free_test.ts
    - packages/skills/src/cli.ts
    - packages/skills/src/deno-cli.ts
    - packages/skills/src/cli.test.ts
    - .changeset/resolver-free-standalone-cli.md
key-decisions:
  - "The public JSR CLI retains npx-based package dispatch while release binaries inject bundled package runners."
  - "The standalone entrypoint is checked and compiled but explicitly excluded from JSR publication."
  - "The existing unreleased changeset describes the compatibility fix without adding a second patch bump."
patterns-established:
  - "Distribution-only dependency graphs belong in explicit publish-excluded entrypoints."
requirements-completed: [QUICK-260803-qdc]
coverage:
  - id: D1
    description: "Public JSR exports remain isolated from workspace-only package imports."
    requirement: QUICK-260803-qdc
    verification:
      - kind: integration
        ref: "npx jsr publish --dry-run --allow-slow-types --allow-dirty"
        status: pass
      - kind: unit
        ref: "packages/cli/tests/cli_test.ts#published CLI entrypoint excludes standalone-only workspace imports"
        status: pass
    human_judgment: false
  - id: D2
    description: "Standalone binaries execute bundled create and skills commands without a resolver."
    requirement: QUICK-260803-qdc
    verification:
      - kind: integration
        ref: "packages/cli/tests/resolver_free_test.ts"
        status: pass
    human_judgment: false
duration: 35min
completed: 2026-08-03
status: complete
---

# Quick Task 260803-qdc: CLI Release Compatibility Summary

**The CLI release now separates its JSR-safe public dispatcher from its resolver-free standalone dependency graph, preserving both distribution contracts.**

## Performance

- **Duration:** 35 min
- **Tasks:** 3/3
- **Must-haves:** 4/4 independently verified

## Accomplishments

- Restored the public `runPackageCli` API and default npm package dispatch used by `@napplet/cli/cli` consumers.
- Added a publish-excluded `standalone.ts` entrypoint that injects the boilerplate and skills runners into all five compiled release binaries.
- Unified Node and Deno skills help rendering so bundled binaries retain install options, targets, and examples.
- Added regression coverage for JSR graph isolation, Windows argv forwarding, runner injection, offline compiled behavior, and help completeness.

## Task Commits

1. **Task 1 RED: distribution compatibility contracts** - `a7b10030` (`test`)
2. **Tasks 2-3 GREEN: entrypoint isolation and compatibility restoration** - `53fc550f` (`fix`)

## Decisions Made

- Keep direct workspace-package imports out of the public JSR graph instead of publishing boilerplate to a registry it does not currently target.
- Preserve the existing JSR behavior and API while using dependency injection only for standalone compilation.
- Share the complete skills help renderer rather than maintaining runtime-specific copies.

## Deviations from Plan

None - plan executed as written. The initial parity test was narrowed to the shared renderer because importing the Deno adapter into the Node TypeScript project violated that package's runtime boundary; compiled-binary integration verifies the Deno output directly.

## Verification

- Independent GSD verification: 4/4 must-haves, no gaps
- `pnpm type-check`
- `pnpm test`
- `pnpm build` — all five CLI release targets
- `node scripts/sync-jsr-versions.mjs`
- `pnpm check:jsr`
- `npx jsr publish --dry-run --allow-slow-types --allow-dirty`
- `pnpm dlx aislop scan --changes --base origin/main .` — 100/100; one pre-existing file-size warning
- `git diff --check`

## Next Phase Readiness

The compatibility fix is ready for upstream review. Once merged, Version Packages PR #202 can regenerate against the corrected CLI distribution graph and resume publish validation.

## Self-Check: PASSED

- Plan, summary, and verification artifacts exist at the required paths.
- Both TDD commits exist and the implementation commit contains no planning artifacts.
- Independent verification found no gaps.
