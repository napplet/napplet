---
phase: 137-nub-connect-and-nub-class-subpath-scaffolds
verified: 2026-04-21T14:15:00Z
status: passed
score: 7/7 must-haves verified
re_verification:
  enabled: false
---

# Phase 137: `@napplet/nub/connect` + `@napplet/nub/class` Subpath Scaffolds Verification Report

**Phase Goal:** Two new NUB subpaths exist — `@napplet/nub/connect` (4 files, with shared `normalizeConnectOrigin`) and `@napplet/nub/class` (4 files, with `installClassShim` wire-handler) — fully tree-shakable and ready for central shim/SDK integration.
**Verified:** 2026-04-21T14:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| - | ----- | ------ | -------- |
| 1 | 8 source files exist (4 connect + 4 class) | VERIFIED | All 8 `.ts` files present in `packages/nub/src/{connect,class}/` (types/shim/sdk/index each) |
| 2 | `connect/types.ts` exports DOMAIN + NappletConnect + normalizeConnectOrigin | VERIFIED | Line 22 (`DOMAIN = 'connect' as const`), lines 39-42 (`NappletConnect` readonly interface), line 84 (`normalizeConnectOrigin`) |
| 3 | `class/types.ts` exports DOMAIN + ClassAssignedMessage + ClassMessage + NappletClass + ClassNubMessage | VERIFIED | Line 24 DOMAIN; lines 32-35 ClassMessage; lines 63-69 ClassAssignedMessage with `type: 'class.assigned'`, `id: string`, `class: number` |
| 4 | `installConnectShim` reads `<meta name="napplet-connect-granted">` meta tag | VERIFIED | `connect/shim.ts` line 17 `GRANTED_META_NAME`, line 36 `document.querySelector`, lines 75-115 installer with readonly getters on window.napplet.connect |
| 5 | `installClassShim` + `handleClassMessage` handle `class.assigned` wire envelope | VERIFIED | `class/shim.ts` line 37 `handleClassMessage`, line 38 routes `type !== 'class.assigned'`, lines 42-48 integer validation + module-local write, lines 80-108 installer mounts `window.napplet.class` getter |
| 6 | Barrel index.ts files register their domains via registerNub | VERIFIED | `connect/index.ts` line 52 `registerNub(DOMAIN, (_msg) => { ... })` noop; `class/index.ts` line 68 `registerNub(DOMAIN, handleClassMessage as unknown as NubHandler)` |
| 7 | Build + type-check green; 46 subpath exports; tree-shake prerequisite satisfied | VERIFIED | package.json exports count = 46; tsup entry count = 46; `pnpm --filter @napplet/nub build` + `type-check` both exit 0; 16 dist artifacts emitted; `dist/{connect,class}/types.js` contain zero installer/registerNub references |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `packages/nub/src/connect/types.ts` | DOMAIN, NappletConnect, normalizeConnectOrigin | VERIFIED (exists + substantive + wired) | 198 lines, zero imports, pure types + pure function; referenced by `connect/{shim,index}.ts` and by tsup entry `connect/types` |
| `packages/nub/src/connect/shim.ts` | installConnectShim, meta-tag reader | VERIFIED | 115 lines, imports type NappletConnect from './types.js', reads `napplet-connect-granted` meta tag, mounts window.napplet.connect via Object.defineProperty; re-exported by `connect/index.ts` |
| `packages/nub/src/connect/sdk.ts` | connectGranted, connectOrigins | VERIFIED | 63 lines, `requireConnect()` guard throws if shim not installed; re-exported by `connect/index.ts` |
| `packages/nub/src/connect/index.ts` | barrel + registerNub side-effect | VERIFIED | 54 lines, re-exports DOMAIN/NappletConnect (type)/normalizeConnectOrigin/installConnectShim/connectGranted/connectOrigins; `registerNub(DOMAIN, noop)` at module eval |
| `packages/nub/src/class/types.ts` | DOMAIN, ClassAssignedMessage, ClassMessage, NappletClass, ClassNubMessage | VERIFIED | 93 lines, single `import type { NappletMessage }` from @napplet/core, wire shape matches NUB-CLASS draft |
| `packages/nub/src/class/shim.ts` | installClassShim, handleClassMessage | VERIFIED | 108 lines, dispatcher-compatible handler signature, integer validation, Object.defineProperty getter on window.napplet.class with `configurable: true` |
| `packages/nub/src/class/sdk.ts` | getClass | VERIFIED | 42 lines, tolerant of missing `window.napplet` (returns undefined, no throw); graceful-degradation per CLASS-04 |
| `packages/nub/src/class/index.ts` | barrel + registerNub(DOMAIN, handleClassMessage) | VERIFIED | 68 lines, re-exports full surface; `registerNub(DOMAIN, handleClassMessage as unknown as NubHandler)` with rationale comment on contravariance bridge |
| `packages/nub/package.json` | 46 subpath exports, sideEffects:false | VERIFIED | `node -e "console.log(Object.keys(require('./packages/nub/package.json').exports).length)"` → 46; `sideEffects: false` preserved (line 195) |
| `packages/nub/tsup.config.ts` | 46 entry points matching exports | VERIFIED | `grep -cE "^    '[a-z]+/(index\|types\|shim\|sdk)': 'src/"` → 46; all 8 new entries present (lines 43-50) |
| `packages/nub/dist/connect/` | 4 .js + 4 .d.ts (+ .js.map) | VERIFIED | index/types/shim/sdk × {js, d.ts, js.map} = 12 files emitted |
| `packages/nub/dist/class/` | 4 .js + 4 .d.ts (+ .js.map) | VERIFIED | index/types/shim/sdk × {js, d.ts, js.map} = 12 files emitted |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `connect/types.ts` | `packages/core/src/types.ts NappletGlobal['connect']` | Structural shape: `readonly granted: boolean; readonly origins: readonly string[]` | WIRED | Both files carry identical shape; tsc parameter assignability check passes (enforced by connect/shim.ts `api: NappletConnect = ...` which is then assigned to `window.napplet.connect`) |
| `class/types.ts` | `@napplet/core envelope NappletMessage` | `import type { NappletMessage }`; ClassAssignedMessage.type = 'class.assigned' in NubDomain 'class' | WIRED | Type-only import resolved cleanly; Phase 136 added 'class' to NubDomain |
| `connect/shim.ts` | DOM `<meta name="napplet-connect-granted">` | `document.querySelector('meta[name="napplet-connect-granted"]')` at line 36 | WIRED | Meta name matches Q3 lock + NUB-CONNECT spec; parser splits on `/\s+/` |
| `class/shim.ts` | `class/types.ts ClassAssignedMessage` | `import type { ClassAssignedMessage } from './types.js'` | WIRED | Type-only import; handler narrows `msg as unknown as ClassAssignedMessage` after type guard |
| `connect/index.ts` | `@napplet/core registerNub` | `import { registerNub }` + call with noop handler | WIRED | Line 43 import, line 52 registration; noop justified by NUB-CONNECT zero-wire lock |
| `class/index.ts` | `@napplet/core registerNub` + `class/shim.ts handleClassMessage` | `import { registerNub, type NubHandler }` + `import { handleClassMessage }` + `registerNub(DOMAIN, handleClassMessage as unknown as NubHandler)` | WIRED | Line 48 imports, line 68 registration; `as unknown as NubHandler` cast bridges contravariance gap (documented in 137-02 SUMMARY deviation) |
| `package.json exports` | `dist/connect/*` + `dist/class/*` | 8 subpath export entries with `types`/`import` dual-field shape | WIRED | All 8 entries present; paths match tsup output locations |
| `tsup.config.ts entry` | `src/connect/*.ts` + `src/class/*.ts` | 8 new entry keys producing dist outputs | WIRED | All 8 entries present at lines 43-50 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `window.napplet.connect.granted` | `currentGranted` (connect/shim.ts) | `parseOrigins(readGrantedMeta()).length > 0` at install time | Yes — populated from real DOM meta tag read synchronously | FLOWING |
| `window.napplet.connect.origins` | `currentOrigins` (connect/shim.ts) | `parseOrigins()` split on whitespace, frozen array | Yes — real shell-injected origin list | FLOWING |
| `window.napplet.class` | `currentClass` (class/shim.ts) | `handleClassMessage({type: 'class.assigned', class: N})` dispatcher write | Yes — central dispatcher routes via `registerNub(DOMAIN, handleClassMessage)` side-effect in class/index.ts (wired) | FLOWING |
| `connectGranted()` / `connectOrigins()` | delegates to `window.napplet.connect.*` | `requireConnect()` guard, throws if not installed | Yes — reads live window state | FLOWING |
| `getClass()` | delegates to `window.napplet.class` | Optional chaining, tolerant of missing shim | Yes — reads live window state, returns undefined gracefully | FLOWING |
| `normalizeConnectOrigin(origin)` | Pure function, no state | — | Yes — 28/28 smoke tests passed in Plan 01 SUMMARY (7 accept, 21 reject) | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| `@napplet/nub` package builds | `pnpm --filter @napplet/nub build` | ESM 28ms, DTS emits all 12 `dist/connect/*` + 12 `dist/class/*` files; exit 0 | PASS |
| `@napplet/nub` type-checks | `pnpm --filter @napplet/nub type-check` | Clean output, exit 0 | PASS |
| package.json has 46 exports | `node -e "console.log(Object.keys(require('./packages/nub/package.json').exports).length)"` | `46` | PASS |
| tsup.config.ts has 46 entries | `grep -cE "^    '[a-z]+/(index\|types\|shim\|sdk)': 'src/"` | `46` | PASS |
| `dist/connect/types.js` tree-shake clean | Inspect emitted ESM | 155 bytes, only re-exports DOMAIN + normalizeConnectOrigin from shared chunk; no `installConnectShim` or `registerNub(` | PASS |
| `dist/class/types.js` tree-shake clean | Inspect emitted ESM | 103 bytes, only re-exports DOMAIN from shared chunk; no `installClassShim` or `registerNub(` | PASS |
| All 16 dist artifacts present | `ls packages/nub/dist/{connect,class}/` | 12 files per subpath (.js + .d.ts + .js.map × 4 entries) | PASS |
| connect commits exist | `git log 98012f7 1067509 37558f2 e732c41 4ef2f01 918f2e6` | All 6 task commits present in history | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| NUB-01 | 137-01 | connect/types.ts with DOMAIN + NappletConnect + normalizeConnectOrigin | SATISFIED | connect/types.ts lines 22, 39-42, 84-198; commit 98012f7 |
| NUB-02 | 137-02 | connect/shim.ts with installConnectShim reading meta tag | SATISFIED | connect/shim.ts lines 75-115; commit 37558f2 |
| NUB-03 | 137-02 | connect/sdk.ts with connectGranted/connectOrigins | SATISFIED | connect/sdk.ts lines 41-63; commit 37558f2 |
| NUB-04 | 137-02 | connect/index.ts barrel + registerNub side-effect | SATISFIED | connect/index.ts line 52; commit 37558f2 |
| NUB-05 | 137-03 | 4 connect subpath exports in package.json | SATISFIED | package.json lines 159-174; commit 4ef2f01 |
| NUB-06 | 137-03 | 4 connect entry points in tsup.config.ts | SATISFIED | tsup.config.ts lines 43-46; commit 918f2e6 |
| NUB-07 | 137-03 | Tree-shake contract: connect/types.js emits zero runtime | SATISFIED | dist/connect/types.js = 155 B, re-exports only DOMAIN + pure normalizer; no installer/registerNub references |
| CLASS-01 | 137-01 | class/types.ts with DOMAIN + ClassAssignedMessage + NappletClass | SATISFIED | class/types.ts lines 24, 32-35, 63-69, 85-88, 93; commit 1067509 |
| CLASS-02 | 137-02 | class/shim.ts with installClassShim + handleClassMessage | SATISFIED | class/shim.ts lines 37-49, 80-108; commit e732c41 |
| CLASS-03 | 137-02 | class/sdk.ts with getClass | SATISFIED | class/sdk.ts lines 39-42; commit e732c41 |
| CLASS-04 | 137-02 | class/index.ts barrel + registerNub(DOMAIN, handleClassMessage) | SATISFIED | class/index.ts line 68; commit e732c41 |
| CLASS-05 | 137-03 | 4 class subpath exports in package.json + 4 tsup entries | SATISFIED | package.json lines 175-190; tsup.config.ts lines 47-50; commits 4ef2f01, 918f2e6 |
| CLASS-06 | 137-03 | Tree-shake contract: class/types.js emits zero runtime | SATISFIED | dist/class/types.js = 103 B, re-exports only DOMAIN; no installer/registerNub references |

All 13 requirements marked [x] in REQUIREMENTS.md (lines 33-48) and all satisfied by implementation evidence.

### Anti-Patterns Found

None — no blocker-level anti-patterns. Notes:
- Source files contain zero TODO/FIXME/placeholder strings (inspected in-line).
- `as unknown as` cast in class/index.ts is documented with rationale JSDoc (contravariance bridge, sound at runtime, alternative rejected as out-of-scope Phase 139/v0.30.0 concern).
- Silent `catch { /* best-effort */ }` in class/shim.ts cleanup matches project convention for storage-related teardown paths.
- `eslint-disable-next-line @typescript-eslint/no-explicit-any` on window access — consistent with resource/shim.ts + config/shim.ts precedent.

### Human Verification Required

None. All phase acceptance criteria are programmatically verifiable (file existence, grep patterns, build + type-check exit codes, tree-shake dist artifact inspection, REQ checkbox mapping). No visual/UX/real-time behaviors are in scope for this phase — all consumers (Phase 138 vite-plugin, Phase 139 central shim) will verify their own end-to-end flows in subsequent phases.

### Gaps Summary

No gaps. Phase 137 achieves its stated goal:

1. Both NUB subpaths exist at `packages/nub/src/{connect,class}/` with the full 4-file scaffold (types/shim/sdk/index).
2. `normalizeConnectOrigin` is the shared pure validator (no side effects, no state) that Phase 138 vite-plugin will import from `@napplet/nub/connect/types`.
3. `installClassShim` + `handleClassMessage` wire `class.assigned` envelopes through the central dispatcher via `registerNub(DOMAIN, handleClassMessage as unknown as NubHandler)` at module evaluation time.
4. Package is fully tree-shakable: `dist/connect/types.js` (155 B) and `dist/class/types.js` (103 B) emit zero installer / registerNub runtime references, satisfying NUB-07 and CLASS-06 at the dist-artifact level (full bundler harness proof deferred to Phase 142 VER-03 per plan contract).
5. package.json + tsup.config.ts have 46 matching subpath exports / entry points (38 existing + 8 new).
6. `pnpm --filter @napplet/nub build` and `type-check` both exit 0.
7. All 13 phase requirements (NUB-01..07 + CLASS-01..06) marked complete in REQUIREMENTS.md with corresponding implementation evidence in the codebase.

**Note on `pnpm -r type-check`:** As noted in the verification prompt and in 137-01/02/03 SUMMARYs, the monorepo-wide type-check fails on `@napplet/shim` with TS2741 (missing `connect` property on NappletGlobal). This was introduced by Phase 136 CORE-02 and is the designated responsibility of Phase 139 SHIM-01/SHIM-02 (not a Phase 137 gap). Package-scoped `pnpm --filter @napplet/nub type-check` on the package this phase modifies passes clean.

---

*Verified: 2026-04-21T14:15:00Z*
*Verifier: Claude (gsd-verifier)*
