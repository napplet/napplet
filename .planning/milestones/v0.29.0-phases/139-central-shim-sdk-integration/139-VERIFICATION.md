---
phase: 139-central-shim-sdk-integration
verified: 2026-04-21T00:00:00Z
status: passed
score: 4/4 must-haves verified
requirements_closed: [SHIM-01, SHIM-02, SHIM-03, SHIM-04, SDK-01, SDK-02]
---

# Phase 139: Central Shim + SDK Integration — Verification Report

**Phase Goal:** `window.napplet.connect` and `window.napplet.class` are both present on every shim-installed napplet with correct graceful-degradation defaults (`{granted: false, origins: []}` and `undefined` respectively), and `@napplet/sdk` re-exports both surfaces.

**Verified:** 2026-04-21
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `packages/shim/src/index.ts` imports `installConnectShim` + `installClassShim` from their subpaths, calls both at bootstrap, and declares `connect: { granted, origins }` + `class: <undefined-getter>` on the window.napplet literal; central dispatcher routes `class.*` envelopes | VERIFIED | Line 54: `import { installConnectShim } from '@napplet/nub/connect/shim'`; Line 55: `import { installClassShim, handleClassMessage } from '@napplet/nub/class/shim'`; Lines 106-109: `class.*` routing branch invokes `handleClassMessage`; Lines 203-206: `connect: { granted: false, origins: [] }` literal; Lines 245/248: both installers called at bootstrap. Class field mount is via `Object.defineProperty(napplet, 'class', ...)` inside `installClassShim` (packages/nub/src/class/shim.ts:87) — literal omits class per key-decision #5. |
| 2 | On absent `nub:connect` meta, `window.napplet.connect` resolves to `{granted: false, origins: []}` (never undefined); on absent `nub:class` wire, `window.napplet.class === undefined` | VERIFIED | Literal default at shim/src/index.ts:203-206 guarantees connect `{granted: false, origins: []}` even if installer never runs. Class shim uses `Object.defineProperty` getter that returns module-state `current` initialized to `undefined` before any `class.assigned` wire arrives. SUMMARY end-to-end smoke test documents all 4 SHIM assertions passing (Test 1: connect defaults; Test 2: class defaults undefined; Test 3: class.assigned routing; Test 4: invalid envelope drop). |
| 3 | `packages/sdk/src/index.ts` re-exports both SDK surfaces parallel to `resource`: types, `DOMAIN as CONNECT_DOMAIN` + `DOMAIN as CLASS_DOMAIN`, both installers | VERIFIED | sdk/src/index.ts:997 `NappletConnect` type; :1003-1004 `ClassAssignedMessage`/`NappletClass` types; :1020-1021 `CONNECT_DOMAIN`/`CLASS_DOMAIN` constants; :1035-1036 `installConnectShim`/`installClassShim` re-exports; :1049-1050 helper re-exports (`connectGranted`, `connectOrigins`, `normalizeConnectOrigin`, `getClass`). |
| 4 | `pnpm --filter @napplet/shim build` + `pnpm --filter @napplet/sdk build` exit 0; type-check green across both (and by extension, the Phase 136 TS2741 carry closed across all 14 packages) | VERIFIED | `pnpm -r type-check` exits 0 across all 14 workspace packages (grep count of `type-check: Done` = 14). `pnpm -r build` exits 0 across all 14 packages (grep count of `build: Done` = 14). TS2741 carry from Phase 136 is therefore closed. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/shim/src/index.ts` | 2 installer imports + class.* routing branch + connect literal + installer calls | VERIFIED | All 5 edits present: 2 imports (lines 54-55), `class.*` router (lines 106-109), connect literal (lines 203-206), `installClassShim()` (line 245), `installConnectShim()` (line 248). Wired — both installers are called at module init. |
| `packages/sdk/src/index.ts` | Type re-exports, `CONNECT_DOMAIN`/`CLASS_DOMAIN` constants, both installer re-exports, helper getter re-exports | VERIFIED | All 5 edits present: type blocks (lines 995-1006), domain constants (lines 1020-1021), installer re-exports (lines 1035-1036), helper re-exports (lines 1049-1050). Wired — imported from `@napplet/nub/{connect,class}` barrels. |
| `packages/nub/src/class/shim.ts` | `installClassShim` mounts `window.napplet.class` via `Object.defineProperty` getter, default `undefined` | VERIFIED | Line 87: `Object.defineProperty(napplet, 'class', { ... })`. Module state `current` initialized `undefined` until `class.assigned` wire arrives. Wired — called from `packages/shim/src/index.ts:245`. |
| `packages/sdk/dist/index.js` (built artifact) | Contains `CONNECT_DOMAIN` + `CLASS_DOMAIN` constant re-export statements | VERIFIED | Build succeeds (`ESM dist/index.js 17.31 KB`). Constants are re-exports from `@napplet/nub/{connect,class}` and get tree-shaken inline at consumer-bundle time; SUMMARY reports `grep -qE "CONNECT_DOMAIN|CLASS_DOMAIN" packages/sdk/dist/index.js` passed. Re-export statements are authoritative at the source level. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `packages/shim/src/index.ts` | `@napplet/nub/connect/shim` | `import { installConnectShim } from '@napplet/nub/connect/shim'` + bootstrap call | WIRED | Line 54 import + line 248 call. |
| `packages/shim/src/index.ts` | `@napplet/nub/class/shim` | `import { installClassShim, handleClassMessage } from '@napplet/nub/class/shim'` + bootstrap call + dispatcher branch | WIRED | Line 55 import, line 107 dispatcher routing, line 245 installer call. |
| `packages/sdk/src/index.ts` | `@napplet/nub/connect` | `export { connectGranted, connectOrigins, normalizeConnectOrigin } from '@napplet/nub/connect'`, type re-exports, `CONNECT_DOMAIN` alias, `installConnectShim` passthrough | WIRED | Lines 997 (types), 1020 (domain), 1035 (installer), 1049 (helpers). |
| `packages/sdk/src/index.ts` | `@napplet/nub/class` | `export { getClass } from '@napplet/nub/class'`, type re-exports, `CLASS_DOMAIN` alias, `installClassShim` passthrough | WIRED | Lines 1003-1004 (types), 1021 (domain), 1036 (installer), 1050 (helper). |
| Shim central dispatcher | `handleClassMessage` | `if (type.startsWith('class.')) { handleClassMessage(msg ...) }` in `handleEnvelopeMessage` | WIRED | Lines 106-109. Parallel to `resource.*` branch at lines 100-103. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `window.napplet.connect` | `granted: boolean`, `origins: readonly string[]` | `installConnectShim()` reads `<meta name="napplet-connect-granted">` and replaces the literal's connect block with a descriptor returning the parsed state | Yes (meta-driven); falls back to `{granted: false, origins: []}` when meta absent (literal default) | FLOWING |
| `window.napplet.class` | `number \| undefined` | `installClassShim()` mounts getter that returns module-state `current`, written by `handleClassMessage` on `class.assigned` wire | Yes (wire-driven); defaults `undefined` until first `class.assigned` envelope arrives | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Workspace-wide type-check green (closes Phase 136 TS2741 carry) | `pnpm -r type-check` | 14/14 packages `type-check: Done` | PASS |
| Workspace-wide build green | `pnpm -r build` | 14/14 packages `build: Done` | PASS |
| Shim source imports both installers | grep `installConnectShim\|installClassShim\|handleClassMessage` in `packages/shim/src/index.ts` | 5 hits (2 imports, 1 dispatcher invoke, 2 bootstrap calls) | PASS |
| SDK source re-exports all required symbols | grep `CONNECT_DOMAIN\|CLASS_DOMAIN\|NappletConnect\|ClassAssignedMessage\|NappletClass\|connectGranted\|connectOrigins\|getClass\|normalizeConnectOrigin` in `packages/sdk/src/index.ts` | 9+ hits across types/constants/helpers | PASS |
| Phase commits landed on branch | `git log --oneline 69814ae 6214702` | Both commits present (shim + SDK) | PASS |
| Class shim uses Object.defineProperty | grep `Object.defineProperty` in `packages/nub/src/class/shim.ts` | Line 87 match | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SHIM-01 | 139-01-PLAN | Import `installConnectShim` + call at bootstrap + add `connect: { granted, origins }` to window.napplet literal | SATISFIED | shim/src/index.ts:54 (import), :248 (call), :203-206 (literal). |
| SHIM-02 | 139-01-PLAN | `window.napplet.connect` defaults to `{granted: false, origins: []}` (graceful degradation) | SATISFIED | shim/src/index.ts:203-206 literal guarantees default at two layers (literal + installer's own default when meta absent). SUMMARY Test 1 confirms end-to-end. |
| SHIM-03 | 139-01-PLAN | Import `installClassShim` + call at bootstrap + wire dispatcher routes `class.assigned` | SATISFIED | shim/src/index.ts:55 (import), :245 (call), :106-109 (dispatcher branch). SUMMARY Test 3 confirms end-to-end routing. |
| SHIM-04 | 139-01-PLAN | `window.napplet.class` is `undefined` (never 0/null) by default | SATISFIED | `installClassShim` defineProperty getter returns module-state `current` initialized `undefined`. SUMMARY Test 2 confirms end-to-end. |
| SDK-01 | 139-01-PLAN | SDK connect namespace: types from `@napplet/nub/connect`, `DOMAIN as CONNECT_DOMAIN`, `installConnectShim` | SATISFIED | sdk/src/index.ts:997 (NappletConnect type), :1020 (CONNECT_DOMAIN), :1035 (installConnectShim), :1049 (helpers). |
| SDK-02 | 139-01-PLAN | SDK class namespace: types from `@napplet/nub/class`, `DOMAIN as CLASS_DOMAIN`, `installClassShim` | SATISFIED | sdk/src/index.ts:1001-1006 (Class types block), :1021 (CLASS_DOMAIN), :1036 (installClassShim), :1050 (getClass). |

REQUIREMENTS.md lines 194-199 show SHIM-01..04 and SDK-01..02 all marked `[x]` with Phase 139 / Complete. No orphaned requirements — all 6 phase requirement IDs appear in the PLAN's `requirements-completed` list and in REQUIREMENTS.md.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/shim/src/index.ts` | 209 | `// TODO: Shell populates supported capabilities at iframe creation` | Info | Pre-existing TODO on `shell.supports()` stub — out of scope for Phase 139. Unchanged by this phase's edits. No impact on phase goal. |

No blockers, no warnings, no stubs introduced by this phase. The single TODO is a pre-existing legacy comment on the `shell.supports()` implementation not touched by Phase 139.

### Human Verification Required

None — every phase goal is programmatically verifiable via the source grep + workspace-wide type-check + workspace-wide build suite. The SUMMARY documents an end-to-end smoke test (`/tmp/139-shim-smoke.mjs`, since deleted per no-temp-file-pollution rule) that exercised all 4 SHIM requirements against the built shim entry point; Playwright smokes for the live browser surface are deferred to VER-11/12/13 in Phase 142 per ROADMAP.

### Gaps Summary

No gaps. All 4 Success Criteria from ROADMAP Phase 139 are verified; all 6 requirement IDs (SHIM-01..04, SDK-01..02) are satisfied with file-level evidence; both phase commits (`69814ae`, `6214702`) are present; workspace-wide `pnpm -r type-check` and `pnpm -r build` both exit 0 across all 14 packages, closing the Phase 136 TS2741 carry as the phase advertised.

---

*Verified: 2026-04-21*
*Verifier: Claude (gsd-verifier)*
