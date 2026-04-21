---
phase: 139-central-shim-sdk-integration
plan: 01
subsystem: shim + sdk
tags: [shim, sdk, nub-connect, nub-class, window-napplet, ts2741-closure]

# Dependency graph
requires:
  - phase: 136-core-type-surface
    provides: "NappletGlobal.connect required field + class?: number optional field in packages/core/src/types.ts"
  - phase: 137-nub-connect-class-subpaths
    provides: "installConnectShim, installClassShim, handleClassMessage, NappletConnect, ClassAssignedMessage, normalizeConnectOrigin, connectGranted, connectOrigins, getClass exports from @napplet/nub/{connect,class}/*"
provides:
  - "window.napplet.connect = {granted, origins} mount on the shim global literal"
  - "window.napplet.class readonly getter mount (via defineProperty in installClassShim)"
  - "Central shim class.* envelope routing branch in handleEnvelopeMessage"
  - "installConnectShim() + installClassShim() calls in the shim init sequence"
  - "@napplet/sdk re-exports for connect + class (types, domain consts, installers, helpers)"
affects:
  - "140-shell-deployer-policy-docs (can reference live SDK surface in SHELL-CLASS-POLICY.md)"
  - "141-documentation-sweep (READMEs document window.napplet.{connect,class} surface)"
  - "142-verification-milestone-close (VER-01/02 workspace-wide type-check + build now green; VER-11/12/13 consume window.napplet.class + window.napplet.connect)"
closes_carry: "Phase 136-to-138 TS2741 gap — workspace-wide pnpm -r type-check now green across all 14 packages; first time since Phase 136"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "State-only NUBs integrate via SDK helper re-exports only (no `export const X = {...}` namespace block)"
    - "Barrel side-effect dispatch registration — importing @napplet/nub/class registers the class.assigned handler transparently"
    - "Literal defaults ALWAYS satisfy the NappletGlobal type slot even when the installer replaces them at runtime (graceful-degradation two-layer guarantee)"

key-files:
  created: []
  modified:
    - "packages/shim/src/index.ts (+16 lines: 2 imports, 4-line class.* routing branch, 4-line connect literal mount, 6-line install-sequence addition)"
    - "packages/sdk/src/index.ts (+19 lines across 5 surgical edits: Connect NUB type block, Class NUB type block, CONNECT_DOMAIN/CLASS_DOMAIN constants, installer re-exports, helper re-exports)"

key-decisions:
  - "No `export const connect = {...}` or `export const class = {...}` namespace in @napplet/sdk — both NUBs are state-only (no method surface), and `class` is a reserved identifier. Helper function re-exports (`connectGranted`, `connectOrigins`, `getClass`) are the consumer-facing API."
  - "normalizeConnectOrigin re-exported in the SDK Helper block (grouping per-NUB exports together) rather than a hypothetical utilities block — matches the 10-NUB precedent."
  - "handleClassMessage NOT re-exported from @napplet/sdk — it is shim-internal (called by handleEnvelopeMessage in packages/shim/src/index.ts, not a consumer API). Consistent with Phase 128 not re-exporting handleResourceMessage."
  - "Literal's `connect: { granted: false, origins: [] }` preserved even though installConnectShim overwrites it at runtime: this satisfies TS2741 at type-check and provides an authoritative graceful-degradation default if the installer never runs (SDK-only consumers)."
  - "No `class:` field added to the shim literal — the installer mounts `class` via `Object.defineProperty`. The optional `class?: number` field on NappletGlobal permits the literal to omit it; adding it as `class: undefined` then having the installer redefine would introduce unnecessary descriptor churn."

patterns-established:
  - "State-only NUB SDK re-export shape: types + DOMAIN-aliased-constant + installer + helper getters, no namespace const object"
  - "Dual-layer graceful-degradation: literal default + installer default, both agreeing on {granted: false, origins: []} for connect; defineProperty-over-undefined-module-state for class"

requirements-completed: [SHIM-01, SHIM-02, SHIM-03, SHIM-04, SDK-01, SDK-02]

# Metrics
duration: ~5min (continuation; Task 1 pre-completed in prior session at 69814ae)
completed: 2026-04-21
---

# Phase 139 Plan 01: Central Shim + SDK Integration Summary

**Wired installConnectShim + installClassShim into @napplet/shim and re-exported both NUB surfaces from @napplet/sdk, closing the Phase 136-carried TS2741 gap (`pnpm -r type-check` now green across all 14 packages).**

## Performance

- **Duration:** ~5 min (continuation — Task 1 landed in a prior session at commit 69814ae before an Anthropic usage limit)
- **Started (continuation):** 2026-04-21 (exact resume time)
- **Completed:** 2026-04-21
- **Tasks:** 3 (Task 1 pre-completed; Tasks 2 + 3 in this session)
- **Files modified:** 2

## Accomplishments

- @napplet/shim now mounts both `window.napplet.connect = {granted: false, origins: []}` and (via defineProperty) `window.napplet.class` on every shim-installed napplet, with both graceful-degradation defaults guaranteed at two layers (literal + installer).
- Central `handleEnvelopeMessage` dispatcher routes `class.*` envelopes (currently `class.assigned`) to `handleClassMessage`; NUB-CONNECT has no wire-routing entry (per-spec — grant flow is pure CSP + meta tag).
- @napplet/sdk re-exports parallel surfaces for bundler consumers: `NappletConnect`, `ClassMessage`, `ClassAssignedMessage`, `NappletClass`, `ClassNubMessage` types; `CONNECT_DOMAIN` + `CLASS_DOMAIN` constants; `installConnectShim` + `installClassShim`; helper functions `connectGranted`, `connectOrigins`, `normalizeConnectOrigin`, `getClass`.
- **TS2741 carry closed:** `pnpm -r type-check` exits 0 across all 14 workspace packages — first time since Phase 136 introduced the planned carry.
- `pnpm -r build` exits 0 across all 14 packages.
- End-to-end smoke test against the built `@napplet/shim` entry point verifies all four SHIM requirements live: connect defaults, class default, class.assigned routing, invalid envelope drop.

## Task Commits

1. **Task 1: Integrate connect + class NUBs into central shim (SHIM-01..04)** — `69814ae` (feat) — *pre-completed in prior session*
2. **Task 2: Mirror connect + class NUBs in @napplet/sdk barrel (SDK-01..02)** — `6214702` (feat)
3. **Task 3: End-to-end smoke test** — *no commit (verification-only per plan)*

## Files Created/Modified

- `packages/shim/src/index.ts` — +16 lines across 4 surgical edits: (a) 2-line import block for `installConnectShim` + `installClassShim`/`handleClassMessage`; (b) 4-line `class.*` routing branch in `handleEnvelopeMessage`; (c) 4-line `connect: { granted: false, origins: [] }` mount in the `window.napplet` literal; (d) 6-line `installClassShim()` + `installConnectShim()` calls in init sequence. Zero deletions, zero modifications to existing lines.
- `packages/sdk/src/index.ts` — +19 lines across 5 surgical edits: Connect NUB type block, Class NUB type block, CONNECT_DOMAIN + CLASS_DOMAIN constants, installConnectShim + installClassShim re-exports, helper function re-exports (connectGranted, connectOrigins, normalizeConnectOrigin, getClass). Zero deletions, zero modifications.

## Verification Evidence

### Source-level grep (all pass)

```
OK // Connect NUB
OK // Class NUB
OK CONNECT_DOMAIN
OK CLASS_DOMAIN
OK installConnectShim
OK installClassShim
OK connect helpers
OK getClass
count no namespace const: 0
```

### Per-package gating signals

- `pnpm --filter @napplet/sdk type-check` — exits 0
- `pnpm --filter @napplet/sdk build` — exits 0 (ESM 17.31 KB, DTS 24.47 KB, build success in 9ms + 494ms)

### Workspace-wide type-check (TS2741 closure, load-bearing)

- `pnpm -r type-check` — all 14 packages exit 0: core, nub, nubs/{config,identity,ifc,keys,media,notify,relay,storage,theme}, sdk, shim, vite-plugin

### Workspace-wide build

- `pnpm -r build` — all 14 packages exit 0

### SDK dist contains new constants

- `grep -qE "CONNECT_DOMAIN|CLASS_DOMAIN" packages/sdk/dist/index.js` — OK

### End-to-end smoke test (against built @napplet/shim entry point)

```
PASS [Test 1]: SHIM-02 connect defaults verified
PASS [Test 2]: SHIM-04 class default verified
PASS [Test 3]: SHIM-03 class.assigned routing verified
PASS [Test 4]: invalid class.assigned dropped; class remains 2

ALL PASS — Phase 139 central shim integration verified at the napplet entry point
  SHIM-01: installConnectShim imported + called (connect mount verified via Test 1 defaults)
  SHIM-02: window.napplet.connect defaults to {granted: false, origins: []} on absent meta tag
  SHIM-03: class.* envelopes routed by handleEnvelopeMessage to handleClassMessage (end-to-end)
  SHIM-04: window.napplet.class defaults to undefined before class.assigned arrives
```

Temp file `/tmp/139-shim-smoke.mjs` cleaned up per project AGENTS.md no-temp-file-pollution rule.

## Decisions Made

Followed plan as specified; all executor-latitude decisions matched the plan's recommended path (no namespace const, barrel imports for SDK, defineProperty-over-undefined for class). No novel decisions beyond what the plan pre-locked.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added document.addEventListener no-op stub to smoke test harness**

- **Found during:** Task 3 (initial smoke test run)
- **Issue:** The smoke test's `globalThis.document` stub only implemented `querySelector` per the PLAN's snippet, but `installKeysShim` (called transitively via the shim bootstrap) attaches a `keydown` listener on `document` via `document.addEventListener(...)`. First run threw `TypeError: document.addEventListener is not a function` in `chunk-2GE57WLT.js:153`, blocking the smoke test from reaching any of the 4 SHIM assertions.
- **Fix:** Added `addEventListener(_ev, _fn, _opts) { /* no-op */ }` and `removeEventListener(...)` methods plus `visibilityState: 'visible'` and `hidden: false` to the `globalThis.document` stub in `/tmp/139-shim-smoke.mjs`. Test-harness-only fix — the `@napplet/shim` production code is unchanged (all 10 existing NUBs including keys already assumed a DOM with `document.addEventListener`; the smoke test stub was the gap). No production code touched.
- **Files modified:** `/tmp/139-shim-smoke.mjs` (ephemeral test harness, deleted after run per project no-temp-file rule)
- **Verification:** Smoke test re-run printed all 4 PASS lines and exited 0.
- **Committed in:** *not committed — /tmp harness file only, no production code changed*

---

**Total deviations:** 1 auto-fixed (1 Rule 3 blocking in test harness)
**Impact on plan:** Zero impact on deliverables. The production shim + SDK code matches the plan byte-for-byte. Only the ephemeral test harness needed a more-complete DOM stub to drive the 10 pre-existing NUB installers the shim bootstrap triggers.

## Issues Encountered

None — the executor continuation from commit `69814ae` was clean: Task 1's shim edits were intact, no drift in surrounding code, both connect + class NUB dist artifacts from Phase 137 were present, and workspace state was ready for Task 2's SDK edits.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Phase 140 (Shell-Connect/Class Policy Docs):** Ready. Can reference the live SDK surface — `window.napplet.connect.granted`, `window.napplet.class`, `CONNECT_DOMAIN`, `CLASS_DOMAIN`, `installConnectShim`, `installClassShim`, `normalizeConnectOrigin` — in `specs/SHELL-CONNECT-POLICY.md` and `specs/SHELL-CLASS-POLICY.md`.
- **Phase 141 (Documentation Sweep):** Ready. `packages/shim/README.md` can document `window.napplet.connect` + `window.napplet.class` surface with graceful-degradation defaults. `packages/sdk/README.md` can document `CONNECT_DOMAIN` / `CLASS_DOMAIN` constants, `installConnectShim` / `installClassShim`, and helper function re-exports.
- **Phase 142 (Verification):** Ready. VER-01 (`pnpm -r build`) + VER-02 (`pnpm -r type-check`) are now expected-green baselines. VER-11 (Playwright class wire smoke), VER-12 (Playwright class graceful-degradation), VER-13 (cross-NUB invariant) can now assume the shim + SDK surfaces are in place.

**TS2741 carry closed.** v0.29.0 downstream phases are no longer blocked on shim type-check regressions.

## Self-Check: PASSED

- `packages/shim/src/index.ts` exists and contains Task 1 edits (connect import, class import, class.* routing branch, connect literal mount, installer calls) — FOUND
- `packages/sdk/src/index.ts` exists and contains all 5 Task 2 edits (Connect NUB block, Class NUB block, CONNECT_DOMAIN, CLASS_DOMAIN, installers, helpers) — FOUND
- Commit 69814ae (Task 1 shim integration) — FOUND in git log
- Commit 6214702 (Task 2 SDK re-exports) — FOUND in git log
- Temp smoke test file /tmp/139-shim-smoke.mjs — deleted as required

---
*Phase: 139-central-shim-sdk-integration*
*Completed: 2026-04-21*
