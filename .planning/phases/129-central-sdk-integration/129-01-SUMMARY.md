---
phase: 129-central-sdk-integration
plan: 01
subsystem: sdk
tags: [sdk, nub, resource, barrel, type-reexport, bundler]

# Dependency graph
requires:
  - phase: 126-resource-nub-scaffold
    provides: "@napplet/nub/resource barrel exporting DOMAIN, 11 types, installResourceShim, bytes/bytesAsObjectURL shim helpers, resourceBytes/resourceBytesAsObjectURL SDK helpers"
  - phase: 128-central-shim-integration
    provides: "window.napplet.resource runtime mount (NappletGlobal['resource'] populated by central shim)"
provides:
  - "@napplet/sdk: resource namespace export ({ bytes, bytesAsObjectURL })"
  - "@napplet/sdk: RESOURCE_DOMAIN const re-export ('resource')"
  - "@napplet/sdk: 11 resource type re-exports (ResourceErrorCode, ResourceScheme, ResourceMessage, ResourceBytesMessage, ResourceCancelMessage, ResourceBytesResultMessage, ResourceBytesErrorMessage, ResourceSidecarEntry, ResourceRequestMessage, ResourceResultMessage, ResourceNubMessage)"
  - "@napplet/sdk: installResourceShim re-export (matches Phase 128 central-shim integration pattern)"
  - "@napplet/sdk: resourceBytes / resourceBytesAsObjectURL SDK helper re-exports (prefixed names per notifySend / configRegisterSchema precedent)"
affects:
  - phase 130 (vite-plugin) — can import resource types from @napplet/sdk
  - phase 133 (docs) — documentation sweep can reference resource off @napplet/sdk
  - downstream shells / future demo napplets — bundler-friendly resource import surface

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "10-NUB central SDK integration pattern locked: 4 surgical edits (namespace const → type-reexport block → DOMAIN const re-export → shim installer + SDK helper re-exports), all sourced from @napplet/nub/<domain> barrel"
    - "Resource namespace mirrors the established 9-NUB recipe; bytes / bytesAsObjectURL eager-defined methods that lazily call requireNapplet() per-invocation"
    - "Prefixed SDK helper names (resourceBytes / resourceBytesAsObjectURL) avoid collisions with future NUBs that might define bare bytes() — matches notifySend / configRegisterSchema precedent"

key-files:
  created: []
  modified:
    - packages/sdk/src/index.ts (4 surgical insertions; +56 lines net)

key-decisions:
  - "Used '@napplet/nub/resource' barrel for all 4 re-export sources (NOT /types or /sdk or /shim subpaths) — matches the 9-NUB convention and the consolidated @napplet/nub package model from v0.26.0"
  - "Prefixed SDK helpers (resourceBytes / resourceBytesAsObjectURL) over bare names — avoids future NUB collision risk in the central SDK file"
  - "installResourceShim re-exported alongside the other 8 install*Shim functions — matches Phase 128 central-shim integration pattern (install* is part of the public SDK surface so consumers can compose custom shims if needed)"
  - "hydrateResourceCache deliberately NOT re-exported — relay-shim-internal helper for sidecar cache seeding, not for SDK consumers (cross-NUB borrow-don't-own pattern from Phase 127)"
  - "Bare bytes / bytesAsObjectURL shim helpers also NOT re-exported — would collide with future bare-name additions; the namespace.bytes() and prefixed resourceBytes() are the two supported surfaces"

patterns-established:
  - "10-NUB central SDK integration: identical 4-section recipe (namespace const → type re-export block → DOMAIN const re-export → shim installer + SDK helper re-exports) replicates cleanly from the 9-NUB precedent"
  - "Type-only consumer round-trip verification via temporary __type-check__.ts fixture: writes an import-type smoke against the package's own tsconfig, runs pnpm --filter @napplet/sdk type-check, deletes pre-commit. Lightweight and self-contained vs spawning a separate consumer harness."

requirements-completed: [SDK-01, SDK-02, SDK-03]

# Metrics
duration: 3 min
completed: 2026-04-20
---

# Phase 129 Plan 1: Central SDK Integration Summary

**Resource NUB exposed through @napplet/sdk via 4 surgical edits — namespace, domain const, 11 type re-exports, shim installer + SDK helper — completing the v0.28.0 SDK-side seam that mirrors Phase 128's central-shim integration.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-20T18:41:41Z
- **Completed:** 2026-04-20T18:44:37Z
- **Tasks:** 1
- **Files modified:** 1 (packages/sdk/src/index.ts)
- **Net diff:** +56 lines (4 insertions, 0 deletions to existing code)

## Accomplishments

- Resource namespace (`export const resource = { bytes, bytesAsObjectURL }`) added to `@napplet/sdk`, delegating to `window.napplet.resource.*` at call time
- `RESOURCE_DOMAIN` const re-exported (value: `'resource'`) alongside the other 9 NUB domain constants
- All 11 resource NUB types re-exported under one `// Resource NUB` block — bundler consumers can `import type { ResourceBytesMessage, ... } from '@napplet/sdk'` without reaching into `@napplet/nub/resource` subpaths
- `installResourceShim` re-exported in the shim installer block (matches Phase 128 central-shim integration pattern; SDK consumers can compose custom shims if needed)
- Prefixed SDK helpers `resourceBytes` / `resourceBytesAsObjectURL` re-exported (matches `notifySend` / `configRegisterSchema` precedent — avoids future NUB collision risk on bare names)
- Workspace-wide `pnpm -r build` and `pnpm -r type-check` exit 0 across all 14 packages — DEF-125-01 stays closed
- Built `dist/index.js` carries `RESOURCE_DOMAIN`, namespace `bytes` methods, prefixed helpers, and installer; Node smoke against built entry point confirms 7/7 surface assertions

## Task Commits

1. **Task 1: Add resource NUB to @napplet/sdk barrel (4 sections)** — `79feb90` (feat)

_Plan metadata commit will follow this summary file._

## Files Created/Modified

- `packages/sdk/src/index.ts` — 4 surgical insertions:
  1. **Edit 1 (namespace, after line 739):** `export const resource = { bytes, bytesAsObjectURL }` block (39 lines) inserted between the Config namespace and the `// ─── Type re-exports from @napplet/core` divider
  2. **Edit 2 (type re-export block, after line 940):** `// Resource NUB` block re-exporting all 11 types (15 lines) inserted between the Config NUB block and the `// ─── NUB Domain Constants` divider
  3. **Edit 3 (domain constant, after line 952):** `export { DOMAIN as RESOURCE_DOMAIN } from '@napplet/nub/resource';` (1 line) appended to the NUB Domain Constants block
  4. **Edit 4 (shim installer + SDK helper, after lines 964 and 975):** `export { installResourceShim } from '@napplet/nub/resource';` and `export { resourceBytes, resourceBytesAsObjectURL } from '@napplet/nub/resource';` (1 line each) appended to their respective blocks

  All 4 re-export sources use the `@napplet/nub/resource` barrel — NOT `/types`, `/sdk`, or `/shim` subpaths — matching the 9-NUB convention and the consolidated v0.26.0 `@napplet/nub` package model.

## Decisions Made

- **Used `@napplet/nub/resource` barrel for all 4 re-exports** — matches the 9-NUB convention. The barrel is the single source of truth; subpath imports would diverge from the established pattern.
- **Prefixed SDK helpers (`resourceBytes` / `resourceBytesAsObjectURL`)** — bare `bytes` / `bytesAsObjectURL` would collide with future NUBs that might define their own bare-name primitives. Prefixed names align with `notifySend` / `configRegisterSchema` precedent.
- **`installResourceShim` re-exported** — matches Phase 128 central-shim integration (which calls `installResourceShim()` in its init sequence). All 8 other `install*Shim` functions are re-exported from `@napplet/sdk`; resource joins them.
- **`hydrateResourceCache` NOT re-exported** — it's a relay-shim-internal helper used to seed the cache from sidecar events (cross-NUB borrow-don't-own pattern from Phase 127). Not part of the SDK consumer surface.
- **Bare `bytes` / `bytesAsObjectURL` shim helpers NOT re-exported** — would collide with the prefixed helpers and risk shadowing in consumer code. Only `resource.bytes()` (namespace method) and `resourceBytes()` (prefixed helper) are the supported surfaces.

## Verification Results

All 15 acceptance criteria from the plan PASS:

| # | Criterion | Result |
|---|-----------|--------|
| 1 | `^export const resource = {` count | `1` |
| 2 | `DOMAIN as RESOURCE_DOMAIN` count | `1` |
| 3 | `^// Resource NUB$` count | `1` |
| 4 | 11 type names appear (any of) | `11` matches |
| 5 | `installResourceShim` count | `1` |
| 6 | `resourceBytes, resourceBytesAsObjectURL` count | `1` |
| 7 | `from '@napplet/nub/resource'` count (>=4) | `4` |
| 8 | `pnpm --filter @napplet/sdk build` | exit 0 |
| 9 | `pnpm --filter @napplet/sdk type-check` | exit 0 |
| 10 | `pnpm -r type-check` (all 14 packages) | exit 0 |
| 11 | `pnpm -r build` (all 14 packages) | exit 0 |
| 12 | `RESOURCE_DOMAIN` in dist/index.js | `1` occurrence |
| 13 | namespace methods in dist (`bytes` word boundary) | `5` occurrences |
| 14 | Node smoke against built dist | 7/7 surface assertions PASS |
| 15 | Type-only consumer round-trip via __type-check__.ts | exit 0; fixture deleted pre-commit |

**DEF-125-01 status:** Remains CLOSED. Workspace-wide `pnpm -r type-check` exits 0 across all 14 packages.

**Node smoke detail (criterion 14):**
```
PASS: m.resource is object
PASS: m.resource.bytes is function
PASS: m.resource.bytesAsObjectURL is function
PASS: m.RESOURCE_DOMAIN === resource
PASS: m.resourceBytes is function
PASS: m.resourceBytesAsObjectURL is function
PASS: m.installResourceShim is function
EXIT: 0
```

## REQ Traceability

| REQ | Where addressed | How verified |
|-----|-----------------|--------------|
| **SDK-01** (resource namespace + named exports) | Edit 1 (`export const resource = { bytes, bytesAsObjectURL }`) + Edit 4 (`resourceBytes` / `resourceBytesAsObjectURL` SDK helper re-exports) | Acceptance criteria 1, 5, 6, 14 |
| **SDK-02** (RESOURCE_DOMAIN re-export) | Edit 3 (`export { DOMAIN as RESOURCE_DOMAIN } from '@napplet/nub/resource'`) | Acceptance criteria 2, 12, 14 |
| **SDK-03** (all resource NUB types re-exported) | Edit 2 (`// Resource NUB` block with 11 type names) | Acceptance criteria 3, 4, 9, 10, 15 |

## Deviations from Plan

None — plan executed exactly as written. All 4 surgical edits applied to the specified insertion points; line-number references in the plan matched the file state at execution time. No deviation rules triggered.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Phase 130 (Vite-Plugin Strict CSP):** independent of this phase; can execute in parallel. May choose to import resource types from `@napplet/sdk` (now available) or directly from `@napplet/nub/resource` (already available).
- **Phase 131 (NIP-5D In-Repo Spec Amendment):** gated on Phase 126 + Phase 130; SDK surface lockdown for v0.28.0 is now complete.
- **Phase 133 (Documentation + Demo Coordination):** SDK README sweep can reference `import { resource } from '@napplet/sdk'` as the bundler-friendly entry point.
- **Downstream shells / future demo napplets:** can now adopt the v0.28.0 resource API through one canonical SDK surface.

**v0.28.0 progress:** 5/10 phases plan-complete (125, 126, 127, 128, 129). DEF-125-01 closed. SDK seam closed. Next executable phases: 130 (independent), then 131 once 130 lands.

## Self-Check: PASSED

- `packages/sdk/src/index.ts` exists and contains all 4 edits (verified via grep counts above).
- Commit `79feb90` exists in git history (`git log --oneline | grep 79feb90` returns the feat commit).
- `packages/sdk/src/__type-check__.ts` does NOT exist (deleted pre-commit per plan's hard rule).
- All 15 acceptance criteria + workspace-wide verification PASS.
- No stubs detected in modified files (no TODO/FIXME/placeholder/"not available"/"coming soon" patterns in `packages/sdk/src/index.ts`).

---
*Phase: 129-central-sdk-integration*
*Completed: 2026-04-20*
