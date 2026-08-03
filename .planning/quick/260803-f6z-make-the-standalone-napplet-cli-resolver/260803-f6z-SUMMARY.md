---
phase: quick-260803-f6z
plan: 01
subsystem: cli
tags: [deno, standalone-binary, workspace, cli]
requires: []
provides:
  - "Import-safe callable boilerplate and skills CLI entry points"
  - "Resolver-free standalone create and skills commands with embedded skill assets"
affects: [cli-packaging, package-release]
tech-stack:
  added: []
  patterns:
    - "Package CLI dispatch functions return numeric statuses and guard executable-only process state."
    - "Deno standalone compile commands explicitly include non-code runtime assets."
key-files:
  created:
    - packages/cli/tests/resolver_free_test.ts
    - deno.json
  modified:
    - packages/cli/src/cli.ts
    - packages/boilerplate/src/index.ts
    - packages/skills/src/cli.ts
key-decisions:
  - "Keep package CLIs as the single implementation source and call their exported runCli functions from the dispatcher."
  - "Use Deno workspace checks for source correctness but compile with a resolver-free graph and explicit skills asset inclusion."
patterns-established:
  - "CLI package imports must not terminate an importing process; return status values instead."
requirements-completed: [QUICK-260803-f6z]
coverage:
  - id: D1
    description: "Direct, status-preserving dispatch from napplet create and napplet skills to maintained package CLIs."
    requirement: QUICK-260803-f6z
    verification:
      - kind: unit
        ref: "packages/cli/tests/cli_test.ts#main dispatches create and skills through the imported package CLIs"
        status: pass
      - kind: unit
        ref: "packages/skills/src/cli.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Relocated compiled executable scaffolds locally and reads embedded skills with no package resolver or network."
    requirement: QUICK-260803-f6z
    verification:
      - kind: integration
        ref: "packages/cli/tests/resolver_free_test.ts#compiled napplet creates and installs skills without a package resolver"
        status: pass
    human_judgment: false
  - id: D3
    description: "Release builds use checked-out workspace dependencies and package metadata exposes the callable APIs."
    requirement: QUICK-260803-f6z
    verification:
      - kind: other
        ref: "pnpm build && pnpm check:jsr"
        status: pass
    human_judgment: false
  - id: D4
    description: "Package and website docs plus three-package patch release metadata describe the resolver-free contract."
    requirement: QUICK-260803-f6z
    verification:
      - kind: other
        ref: "pnpm --filter docs build"
        status: pass
    human_judgment: false
duration: 25min
completed: 2026-08-03
status: complete
---

# Phase quick-260803-f6z Plan 01: Resolver-free standalone CLI Summary

**The standalone napplet binary now calls maintained boilerplate and skills packages directly, including real skill assets, without runtime Node.js or package-resolver commands.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-03T10:07:49Z
- **Completed:** 2026-08-03T10:32:22Z
- **Tasks:** 3/3
- **Files modified:** 24

## Accomplishments

- Added import-safe numeric `runCli` contracts for boilerplate and skills, then routed `napplet create` and `napplet skills` to them without shell parsing.
- Added an offline compiled-binary integration test that relocates the executable, clears executable lookup, disables proxies, scaffolds from a local template, and installs a real shipped skill.
- Added Deno workspace/release-matrix wiring, explicit embedded skill assets, synchronized package/site docs, and patch changesets for all three changed packages.

## Task Commits

1. **Task 1: Route one real create/skills command path through import-safe package CLIs** - `43ab2fd6` (test), `1eff53a2` (feat)
2. **Task 2: Prove compiled binaries stay offline and make release builds reproduce that graph** - `a3b9b0f5` (test), `1be1a126` (feat), `257343b0` (fix), `37509d77` (fix)
3. **Task 3: Publish the resolver-free contract with synchronized docs and changesets** - `a95c69b4` (docs)

## Files Created/Modified

- `packages/boilerplate/src/index.ts` - Exposes the import-safe boilerplate CLI status contract.
- `packages/skills/src/cli.ts` - Exposes and guards the skills CLI status contract.
- `packages/cli/src/cli.ts` - Directly dispatches create and skills through workspace package imports.
- `packages/cli/tests/resolver_free_test.ts` - Proves compiled offline operation and embedded skill access.
- `packages/cli/deno.json` - Produces lean resolver-free binaries with explicit skill asset inclusion.
- `.github/workflows/publish-jsr.yml` - Builds workspace dependencies before the CLI target matrix.
- `.changeset/resolver-free-standalone-cli.md` - Records patch releases for CLI, boilerplate, and skills.

## Decisions Made

- Kept the maintained packages as the only command implementations; the CLI dispatcher merely forwards argv arrays and returns their statuses.
- Used a root Deno workspace for source checking and `--node-modules-dir=none` only for compilation so the executable does not recursively embed the entire workspace.
- Explicitly included `packages/skills/skills` in compile commands because those Markdown files are runtime data required by `skills list` and `skills install`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking build configuration] Separated Deno-only adapter type checking from Node package type checking.**
- **Found during:** Task 2
- **Issue:** TypeScript rejected the Deno-only `.ts` import specifiers required by the workspace source adapters, while Deno needed those adapters to compile package workspace imports.
- **Fix:** Excluded the Deno-only adapter files from package `tsc` projects, retained Deno `check` coverage, committed the root Deno lock, and compiled with a resolver-free dependency graph.
- **Files modified:** `deno.lock`, `packages/boilerplate/tsconfig.json`, `packages/skills/tsconfig.json`, `packages/cli/deno.json`, `packages/cli/tests/resolver_free_test.ts`
- **Verification:** `pnpm type-check`, `pnpm build`, and the compiled-binary integration test passed.
- **Committed in:** `257343b0`

**2. [Rule 1 - Quality bug] Removed an unused import from the Deno skills adapter.**
- **Found during:** Task 3 verification
- **Issue:** The exact AI-slop scan reported the unused `TARGETS` import as both a lint warning and an AI-slop warning.
- **Fix:** Removed the unused import without changing the adapter's command behavior.
- **Files modified:** `packages/skills/src/deno-cli.ts`
- **Verification:** Deno check, compiled-binary integration test, and `pnpm dlx aislop scan --changes --base origin/main .` passed at 100/100.
- **Committed in:** `37509d77`

---

**Total deviations:** 2 auto-fixed (1 Rule 1, 1 Rule 3)
**Impact on plan:** The change was required for Deno 2.5 workspace compilation and preserves the intended package contracts without adding protocol surface.

## Issues Encountered

None remaining. The exact AI-slop command was available through `pnpm dlx` and passed cleanly after the inline cleanup.

## Known Stubs

None found in the files created or modified by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The standalone binary and release matrix share a reviewed workspace graph; no protocol behavior changed.

## Self-Check: PASSED

- Found the summary file and all seven task commits: `43ab2fd6`, `1eff53a2`, `a3b9b0f5`, `1be1a126`, `257343b0`, `a95c69b4`, and `37509d77`.

---
*Phase: quick-260803-f6z*
*Completed: 2026-08-03*
