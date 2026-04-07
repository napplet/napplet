---
phase: 65-napplet-cleanup
verified: 2026-04-06T19:29:50Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 65: Napplet Cleanup Verification Report

**Phase Goal:** The @napplet monorepo contains only the 4 portable SDK packages and builds cleanly
**Verified:** 2026-04-06T19:29:50Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                          | Status     | Evidence                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| 1   | Only packages/core, packages/shim, packages/sdk, packages/vite-plugin exist under packages/                   | ✓ VERIFIED | `ls packages/` returns exactly: core, sdk, shim, vite-plugin (4 entries) |
| 2   | No apps/, tests/, or demo/ directories exist at repo root                                                      | ✓ VERIFIED | `ls repo root` confirms all three absent; playwright.config.ts also gone  |
| 3   | pnpm build succeeds with zero errors                                                                           | ✓ VERIFIED | `pnpm build` → "4 successful, 4 total" all via turbo cache; exit 0        |
| 4   | pnpm type-check succeeds with zero errors                                                                      | ✓ VERIFIED | `pnpm type-check` → "5 successful, 5 total" (includes build dep); exit 0  |
| 5   | No source file in kept packages imports from @napplet/acl, @napplet/runtime, @napplet/shell, or @napplet/services | ✓ VERIFIED | Single grep hit in packages/core/src/types.ts:53 is a JSDoc comment only  |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact              | Expected                                             | Status     | Details                                                                        |
| --------------------- | ---------------------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `pnpm-workspace.yaml` | Workspace config for 4 packages only                 | ✓ VERIFIED | Contains exactly `packages: - packages/*` — no apps, tests, or fixture entries |
| `vitest.config.ts`    | Vitest config for @napplet/core test only            | ✓ VERIFIED | Only @napplet/core and @napplet/shim aliases; no deleted-package aliases       |
| `package.json`        | Root scripts without test:build, test:e2e, test:serve | ✓ VERIFIED | Scripts: build, test, test:unit, lint, type-check, version-packages, publish-packages only |

### Key Link Verification

| From                  | To                                                  | Via              | Status     | Details                                                   |
| --------------------- | --------------------------------------------------- | ---------------- | ---------- | --------------------------------------------------------- |
| `pnpm-workspace.yaml` | packages/core, packages/shim, packages/sdk, vite-plugin | `packages/*` glob | ✓ WIRED | Single `packages/*` entry; confirmed 4 packages present    |
| `package.json`        | turbo.json                                          | `turbo run build` | ✓ WIRED  | Root scripts delegate to turbo; turbo.json generic tasks  |

### Data-Flow Trace (Level 4)

Not applicable — this phase contains no components or dynamic data renderers. All artifacts are config files and tooling.

### Behavioral Spot-Checks

| Behavior                     | Command           | Result                                                  | Status  |
| ---------------------------- | ----------------- | ------------------------------------------------------- | ------- |
| pnpm build succeeds          | `pnpm build`      | 4 successful, 4 total, FULL TURBO, exit 0               | ✓ PASS  |
| pnpm type-check succeeds     | `pnpm type-check` | 5 successful, 5 total, FULL TURBO, exit 0               | ✓ PASS  |
| pnpm test:unit passes        | `pnpm test:unit`  | 13 tests passed (core), shim/vite-plugin echo "no unit tests", exit 0 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description                                                  | Status      | Evidence                                                             |
| ----------- | ----------- | ------------------------------------------------------------ | ----------- | -------------------------------------------------------------------- |
| CLEAN-01    | 65-01       | Delete packages/acl, packages/runtime, packages/shell, packages/services | ✓ SATISFIED | Commit ef67c53 deleted all 4; `ls packages/` confirms only 4 remain |
| CLEAN-02    | 65-01       | Delete apps/demo and test infrastructure (tests/, playwright.config.ts) | ✓ SATISFIED | apps/, tests/, playwright.config.ts all absent from filesystem      |
| CLEAN-03    | 65-01       | Update pnpm-workspace.yaml, vitest.config.ts, package.json for 4-package monorepo | ✓ SATISFIED | All 3 files updated per plan; workspace = packages/* only; no deleted aliases/scripts |
| CLEAN-04    | 65-01       | pnpm build and pnpm type-check succeed with 4-package monorepo | ✓ SATISFIED | Both commands exit 0 with zero errors; unit tests also pass (13/13) |

### Anti-Patterns Found

| File          | Line | Pattern                       | Severity  | Impact                                                           |
| ------------- | ---- | ----------------------------- | --------- | ---------------------------------------------------------------- |
| `turbo.json`  | 15   | Dead `test:e2e` task definition | ℹ️ Info   | No package implements this script; task is never invoked; no impact on build or test |

The single grep match on `@napplet/acl` in `packages/core/src/types.ts:53` is a JSDoc comment (`* Note: The @napplet/acl package uses bitfield constants...`), not a runtime import. Not a stub.

### Human Verification Required

None. All success criteria are programmatically verifiable and confirmed passing.

### Gaps Summary

No gaps. All 5 observable truths verified, all 4 requirements satisfied, build and type-check pass cleanly. The only minor finding is a dead `test:e2e` task in `turbo.json` with no implementations — informational only, does not affect any workflow.

---

_Verified: 2026-04-06T19:29:50Z_
_Verifier: Claude (gsd-verifier)_
