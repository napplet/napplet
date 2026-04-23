---
phase: 129-central-sdk-integration
verified: 2026-04-20T20:52:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 129: Central SDK Integration Verification Report

**Phase Goal:** Bundler consumers that import from `@napplet/sdk` get the resource namespace, the domain constant, and all resource type re-exports without reaching into `@napplet/nub` subpaths.
**Verified:** 2026-04-20T20:52:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Bundler consumers can `import { resource } from '@napplet/sdk'` and call `resource.bytes(url)` / `resource.bytesAsObjectURL(url)` without reaching into `@napplet/nub` subpaths | VERIFIED | `export const resource = { bytes, bytesAsObjectURL }` at line 758 of `packages/sdk/src/index.ts`; both methods call `requireNapplet().resource.*` lazily; Node smoke confirms `typeof m.resource.bytes === 'function'` and `typeof m.resource.bytesAsObjectURL === 'function'` |
| 2 | Bundler consumers can `import { RESOURCE_DOMAIN } from '@napplet/sdk'` and the value equals the literal string `'resource'` | VERIFIED | Line 1006: `export { DOMAIN as RESOURCE_DOMAIN } from '@napplet/nub/resource'`; Node smoke confirms `m.RESOURCE_DOMAIN === 'resource'`; grep in dist/index.js returns 1 occurrence |
| 3 | Bundler consumers can `import type { ResourceBytesMessage, ... }` (all 11 names) from `@napplet/sdk` and all resolve under `tsc --isolatedModules` | VERIFIED | `// Resource NUB` block at lines 980-993 re-exports all 11 type names from `@napplet/nub/resource`; `pnpm --filter @napplet/sdk type-check` exits 0; type-only consumer round-trip via `__type-check__.ts` fixture passed (fixture deleted pre-commit) |
| 4 | Workspace-wide `pnpm -r build` and `pnpm -r type-check` continue to exit 0 across all 14 packages (DEF-125-01 stays closed) | VERIFIED | Both commands run and exit 0; all 14 packages (including nubs: relay, identity, storage, ifc, keys, media, notify, config, theme; plus core, shim, sdk, vite-plugin, nub) type-check and build clean |
| 5 | `@napplet/sdk` builds (tsup) without errors and emits the `resource` namespace + `RESOURCE_DOMAIN` const into `dist/index.js` | VERIFIED | `pnpm --filter @napplet/sdk build` exits 0; `grep -c "RESOURCE_DOMAIN" dist/index.js` returns 1; Node smoke against built `dist/index.js` confirms 7/7 surface assertions pass |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/sdk/src/index.ts` | Resource namespace export, RESOURCE_DOMAIN re-export, full resource type re-export block | VERIFIED | Contains `export const resource = {` (1), `DOMAIN as RESOURCE_DOMAIN` (1), `// Resource NUB` block (1), 11 type names, `installResourceShim` (1), `resourceBytes, resourceBytesAsObjectURL` (1); all 4 re-export lines source from `@napplet/nub/resource` barrel |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/sdk/src/index.ts` `export const resource` | `window.napplet.resource` (`NappletGlobal['resource']`) | `requireNapplet().resource.bytes` / `.bytesAsObjectURL` — lazy call-time delegation | WIRED | Lines 765 and 775 confirmed: `return requireNapplet().resource.bytes(url)` and `return requireNapplet().resource.bytesAsObjectURL(url)`. `NappletGlobal.resource` confirmed in `packages/core/src/types.ts` line 570. |
| `packages/sdk/src/index.ts` `export { DOMAIN as RESOURCE_DOMAIN }` | `packages/nub/src/resource/types.ts` (`export const DOMAIN = 'resource' as const`) | Barrel re-export from `@napplet/nub/resource` | WIRED | Line 1006: `export { DOMAIN as RESOURCE_DOMAIN } from '@napplet/nub/resource'`; barrel at `packages/nub/src/resource/index.ts` line 21 exports DOMAIN from types.js |
| `packages/sdk/src/index.ts` (type re-export block) | `packages/nub/src/resource/types.ts` (11 exported types) | Type-only re-export from `@napplet/nub/resource` | WIRED | Lines 981-993: all 11 type names re-exported; nub barrel confirms all 11 types in its type block (lines 25-37) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `export const resource = { bytes, bytesAsObjectURL }` | `window.napplet.resource` (accessed at call time) | `requireNapplet()` — validates `window.napplet` is installed, throws `NappletNotInstalledError` if not | Yes (runtime delegation; no static/empty return; correct lazy pattern matching established 9-NUB recipe) | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `m.resource` is object in built dist | `node --input-type=module -e "import('./packages/sdk/dist/index.js').then(m => { process.exit(typeof m.resource === 'object' ? 0 : 1) })"` | PASS | PASS |
| `m.resource.bytes` is function | Node smoke (typeof) | PASS | PASS |
| `m.resource.bytesAsObjectURL` is function | Node smoke (typeof) | PASS | PASS |
| `m.RESOURCE_DOMAIN === 'resource'` | Node smoke (strict eq) | PASS | PASS |
| `m.resourceBytes` is function | Node smoke (typeof) | PASS | PASS |
| `m.resourceBytesAsObjectURL` is function | Node smoke (typeof) | PASS | PASS |
| `m.installResourceShim` is function | Node smoke (typeof) | PASS | PASS |
| `pnpm -r type-check` exits 0 | Workspace-wide tsc | exit 0 | PASS |
| `pnpm -r build` exits 0 | Workspace-wide tsup | exit 0 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SDK-01 | 129-01-PLAN.md | Resource namespace + named exports accessible from `@napplet/sdk` | SATISFIED | Edit 1 (namespace const at line 758) + Edit 4 (SDK helper re-exports at line 1031); Node smoke confirms `m.resource.bytes`, `m.resource.bytesAsObjectURL`, `m.resourceBytes`, `m.resourceBytesAsObjectURL` all function-typed |
| SDK-02 | 129-01-PLAN.md | `RESOURCE_DOMAIN` re-exported from `@napplet/sdk` resolving to `'resource'` | SATISFIED | Edit 3 (line 1006); Node smoke confirms `m.RESOURCE_DOMAIN === 'resource'`; dist/index.js contains RESOURCE_DOMAIN |
| SDK-03 | 129-01-PLAN.md | All 11 resource NUB types re-exported from `@napplet/sdk` (round-trip under `tsc --isolatedModules`) | SATISFIED | Edit 2 (`// Resource NUB` block lines 980-993); `pnpm -r type-check` exits 0 across all 14 packages; type-only consumer round-trip fixture passed pre-commit |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | No TODO/FIXME/PLACEHOLDER/stub patterns found in the 56 inserted lines | — | — |

No anti-patterns detected. The resource namespace methods are not stubs — they are eager-defined method bodies that lazily delegate to `requireNapplet().resource.*` per call, which is the canonical pattern for all 9 prior NUBs.

### Human Verification Required

None. All success criteria are programmatically verifiable and all checks passed.

### Gaps Summary

No gaps. All 5 must-have truths verified, all 3 required artifacts pass all four levels (exists, substantive, wired, data-flowing), all 3 key links confirmed wired, all 3 requirement IDs satisfied, workspace-wide build and type-check green.

## Additional Verification Notes

- **Commit scope:** Commit `79feb90` modifies exactly 1 file (`packages/sdk/src/index.ts`, +56 lines, 0 deletions). No other files changed.
- **Temp fixture cleanup:** `packages/sdk/src/__type-check__.ts` does not exist in the working tree (deleted pre-commit as required).
- **Barrel source discipline:** All 4 re-export lines in `packages/sdk/src/index.ts` use `from '@napplet/nub/resource'` (the barrel), not `/types`, `/sdk`, or `/shim` subpaths. Matches the established 9-NUB convention.
- **Non-exported items correctly absent:** `hydrateResourceCache`, bare `bytes`, bare `bytesAsObjectURL` are NOT re-exported from `@napplet/sdk` — correct per plan hard rules (relay-shim-internal helper and bare names excluded per precedent).
- **installResourceShim present:** Re-exported at line 1019, completing the 10-NUB shim installer block.

---

_Verified: 2026-04-20T20:52:00Z_
_Verifier: Claude (gsd-verifier)_
