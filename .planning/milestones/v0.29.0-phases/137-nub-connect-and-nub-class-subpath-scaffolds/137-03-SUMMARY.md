---
phase: 137-nub-connect-and-nub-class-subpath-scaffolds
plan: 03
subsystem: nub-packaging
tags: [nub, connect, class, package-json, tsup, subpath-exports, tree-shake, build, type-check]

requires:
  - phase: 137-01
    provides: "packages/nub/src/connect/types.ts + packages/nub/src/class/types.ts (2 files)"
  - phase: 137-02
    provides: "packages/nub/src/connect/{shim,sdk,index}.ts + packages/nub/src/class/{shim,sdk,index}.ts (6 files)"

provides:
  - "packages/nub/package.json exports map extended from 38 → 46 subpath entries (+8: connect × 4, class × 4)"
  - "packages/nub/tsup.config.ts entry map extended from 38 → 46 entry points (+8 matching 1:1)"
  - "packages/nub/dist/connect/{index,types,shim,sdk}.{js,d.ts} — 8 new build artifacts (8 .js + 8 .d.ts)"
  - "packages/nub/dist/class/{index,types,shim,sdk}.{js,d.ts} — 8 new build artifacts"
  - "Tree-shake prerequisite proof at dist-artifact level: connect/types.js and class/types.js emit zero installer / registerNub references"

affects: [phase-138, phase-139, phase-142]

tech-stack:
  added: []
  patterns:
    - "Subpath-export wiring pattern (4-entries-per-NUB): ./<nub>, ./<nub>/types, ./<nub>/shim, ./<nub>/sdk each with {types, import} dual-field shape — matches resource (v0.28.0) / identity / config precedents exactly"
    - "Tsup-entry + package.json-export 1:1 correspondence invariant: 46 exports ↔ 46 entry points (count-equality is a lint-style check for any future subpath addition)"
    - "Dist-artifact tree-shake prerequisite verification: grep for installer-symbol / registerNub in dist/<nub>/types.js as a cheap source-of-truth check before Phase 142 full bundler harness"

key-files:
  created: []
  modified:
    - packages/nub/package.json
    - packages/nub/tsup.config.ts

key-decisions:
  - "Entry-ordering: append connect + class blocks after resource (file-order convention — every prior NUB was appended in insertion order; preserve that)"
  - "No description-field update in package.json — Phase 141 Documentation Sweep owns the string listing all NUBs; keep diff minimal to the exports map only"
  - "Build order: tsup runs clean:true so dist/ is rebuilt from scratch; no stale artifact risk from prior plans"
  - "Tree-shake verification scope: prerequisite (types.js artifact-level grep) only; full bundler-side proof deferred to Phase 142 VER-03 per plan contract"
  - "46-exports invariant locked as the new baseline for v0.29.0 — Phase 142 VER-02 can grep-check this count as a milestone gate"

patterns-established:
  - "46-entries-each baseline for @napplet/nub package.json exports + tsup.config.ts entry map. Future NUB additions in v0.30.0+ should preserve the 1:1 count correspondence."
  - "Appended-in-insertion-order convention for both files: relay → storage → ifc → keys → theme → media → notify → identity → config → resource → connect → class. This is the canonical walking order; README table in Phase 141 should mirror it."

requirements-completed: [NUB-05, NUB-06, NUB-07, CLASS-05, CLASS-06]

duration: 2min
completed: 2026-04-21
---

# Phase 137 Plan 03: Package Wiring — Connect + Class Subpath Exports Summary

**8 new subpath exports added to `packages/nub/package.json` (38 → 46 entries) and 8 matching tsup entry points added to `packages/nub/tsup.config.ts` (1:1 correspondence preserved). Build and type-check both green. All 16 new dist artifacts (8 .js + 8 .d.ts) emitted under `dist/connect/` and `dist/class/`. Tree-shake prerequisite verified at dist-artifact level — both `dist/connect/types.js` and `dist/class/types.js` contain zero installer / `registerNub(` references, satisfying NUB-07 and CLASS-06 source-contract gates (full bundler-harness proof deferred to Phase 142 VER-03). Phase 137 is now terminal-complete: all 13 REQs (NUB-01..07 + CLASS-01..06) satisfied.**

## Performance

- **Duration:** ~2 min (84 s)
- **Started:** 2026-04-21T13:56:59Z
- **Completed:** 2026-04-21T13:58:23Z (pre-summary)
- **Tasks:** 2 / 2
- **Files modified:** 2 (package.json + tsup.config.ts)
- **Dist artifacts emitted:** 16 new (8 .js + 8 .d.ts under dist/connect/ and dist/class/)

## Accomplishments

### Task 1 — package.json subpath exports (NUB-05, CLASS-05)

Added 8 new entries to `packages/nub/package.json` exports map, appended after the resource block:

```json
"./connect":        { "types": "./dist/connect/index.d.ts",  "import": "./dist/connect/index.js" },
"./connect/types":  { "types": "./dist/connect/types.d.ts",  "import": "./dist/connect/types.js" },
"./connect/shim":   { "types": "./dist/connect/shim.d.ts",   "import": "./dist/connect/shim.js" },
"./connect/sdk":    { "types": "./dist/connect/sdk.d.ts",    "import": "./dist/connect/sdk.js" },
"./class":          { "types": "./dist/class/index.d.ts",    "import": "./dist/class/index.js" },
"./class/types":    { "types": "./dist/class/types.d.ts",    "import": "./dist/class/types.js" },
"./class/shim":     { "types": "./dist/class/shim.d.ts",     "import": "./dist/class/shim.js" },
"./class/sdk":      { "types": "./dist/class/sdk.d.ts",      "import": "./dist/class/sdk.js" }
```

- Total exports: **38 → 46** (matches v0.29.0 CONTEXT locked count).
- `sideEffects: false` preserved (tree-shake contract prerequisite from v0.26.0 Phase 117).
- `version`, `description`, `dependencies`, `devDependencies`, `peerDependencies`, `peerDependenciesMeta`, `scripts`, `files`, `license`, `repository`, `keywords` — all byte-identical to pre-plan state (minimal diff surface).
- JSON validity verified via `node -e "require('./packages/nub/package.json')"`.

### Task 2 — tsup.config.ts entries + build + type-check + tree-shake prerequisite (NUB-06, NUB-07, CLASS-06)

Added 8 new entry points to `packages/nub/tsup.config.ts` entry map, appended after the resource entries:

```typescript
'connect/index': 'src/connect/index.ts',
'connect/types': 'src/connect/types.ts',
'connect/shim':  'src/connect/shim.ts',
'connect/sdk':   'src/connect/sdk.ts',
'class/index':   'src/class/index.ts',
'class/types':   'src/class/types.ts',
'class/shim':    'src/class/shim.ts',
'class/sdk':     'src/class/sdk.ts',
```

- Total entries: **38 → 46** (1:1 with package.json exports).
- `format: ['esm']`, `dts: true`, `sourcemap: true`, `clean: true` — all untouched.
- `pnpm --filter @napplet/nub build` exit code: **0**. ESM build success in 28 ms; DTS build success in 2626 ms.
- `pnpm --filter @napplet/nub type-check` exit code: **0** (no output — clean).

### Dist artifact inventory (16 new files)

| Path                              | Size (bytes) | Kind |
| --------------------------------- | ------------ | ---- |
| `dist/connect/index.js`           | 455          | ESM  |
| `dist/connect/index.d.ts`         | 184          | DTS  |
| `dist/connect/types.js`           | 155          | ESM  |
| `dist/connect/types.d.ts`         | 3,395        | DTS  |
| `dist/connect/shim.js`            | 126          | ESM  |
| `dist/connect/shim.d.ts`          | 799          | DTS  |
| `dist/connect/sdk.js`             | 153          | ESM  |
| `dist/connect/sdk.d.ts`           | 1,368        | DTS  |
| `dist/class/index.js`             | 398          | ESM  |
| `dist/class/index.d.ts`           | 231          | DTS  |
| `dist/class/types.js`             | 103          | ESM  |
| `dist/class/types.d.ts`           | 3,232        | DTS  |
| `dist/class/shim.js`              | 166          | ESM  |
| `dist/class/shim.d.ts`            | 1,695        | DTS  |
| `dist/class/sdk.js`               | 105          | ESM  |
| `dist/class/sdk.d.ts`             | 1,302        | DTS  |

Total new ESM: **1,661 bytes** across 8 files. Shared chunks (via tsup's code-splitting) live in `dist/chunk-*.js` and are already accounted for by pre-existing NUB subpaths. Sourcemaps (.js.map) also emitted for each (8 files, ~71 bytes each except index chunks which aggregate 2.7–3.3 KB).

These sizes are the **v0.29.0 baseline** for Phase 142 VER-03 tree-shake harness extension — a types-only consumer should produce a bundle delta ≤ `types.js` size (155 bytes for connect, 103 bytes for class) when tree-shake is active and the consumer only uses `import type`.

### Tree-shake contract prerequisite (NUB-07, CLASS-06)

Verified at the dist-artifact level that both types.js files re-export only their DOMAIN constant (plus the pure `normalizeConnectOrigin` function for connect) with zero installer / registerNub emission:

**`dist/connect/types.js` (155 bytes):**
```javascript
import { DOMAIN, normalizeConnectOrigin } from "../chunk-IT23U3K7.js";
export { DOMAIN, normalizeConnectOrigin };
```

**`dist/class/types.js` (103 bytes):**
```javascript
import { DOMAIN } from "../chunk-YEF6MTAA.js";
export { DOMAIN };
```

Both grep checks (`installConnectShim` / `installClassShim` / `registerNub(`) return negative on the types.js files. This satisfies the source-contract prerequisite for NUB-07 (`@napplet/nub/connect/types` consumed via `import type` emits zero runtime code) and CLASS-06 (same contract for class).

**Note on `normalizeConnectOrigin` in connect/types.js:** This function is a pure validator (no side effects, no state) and is the single source of truth for connect-origin normalization (shared between Phase 138 vite-plugin build-side and Phase 139+ shell runtime). A consumer that does only `import type { NappletConnect } from '@napplet/nub/connect/types'` will have TypeScript elide the import entirely at emit (`verbatimModuleSyntax: true` is enforced at tsconfig level). A consumer that also uses `normalizeConnectOrigin` will pay its ~500-byte minified cost — which is the intended trade-off (one-time pure-function payload for the shared contract).

**Full bundler-harness proof (not in scope for this plan):** Phase 142 VER-03 will extend the existing v0.26.0/v0.28.0 tree-shake test harness (at `.planning/verification/tree-shake-smoke/` or equivalent) with two new types-only consumer fixtures — one each for `@napplet/nub/connect/types` and `@napplet/nub/class/types`. This plan produces the artifact sizes the harness will assert against.

## Task Commits

1. **Task 1: Add 8 subpath exports to packages/nub/package.json (NUB-05, CLASS-05)** — `4ef2f01` (feat)
2. **Task 2: Add 8 tsup entries + build + type-check + tree-shake prerequisite (NUB-06, NUB-07, CLASS-06)** — `918f2e6` (feat)

_Final docs commit (this SUMMARY + STATE.md + ROADMAP.md + REQUIREMENTS.md) follows._

## Files Modified

- `packages/nub/package.json` — +32 lines (8 new exports × 4 lines each including block-spacing), 0 lines removed; all non-exports fields byte-identical.
- `packages/nub/tsup.config.ts` — +8 lines (8 new entries, single-line each), 0 lines removed; all defineConfig options unchanged.

## Phase-Level Verification (all green)

```
node -e "console.log(Object.keys(require('./packages/nub/package.json').exports).length)"
→ 46

grep -c "'.*': 'src/" packages/nub/tsup.config.ts
→ 46

pnpm --filter @napplet/nub build
→ exit 0; ESM 28ms, DTS 2626ms; emits 8 new connect/*.{js,d.ts} + 8 new class/*.{js,d.ts}

pnpm --filter @napplet/nub type-check
→ exit 0 (clean)

grep -l "installConnectShim\|registerNub(" packages/nub/dist/connect/types.js
→ (empty — no match)

grep -l "installClassShim\|registerNub(" packages/nub/dist/class/types.js
→ (empty — no match)
```

## Deviations from Plan

**None.** Plan executed exactly as written. Zero deviations. Zero auto-fixes. Zero blockers.

Every automated verify-block check passed on first run:
- Task 1: `node -e` exports count + required-keys check → green.
- Task 2: 8-way grep of tsup entry strings → green; build → green; type-check → green; 16-file `test -f` check → green; 2 tree-shake grep assertions → green.

## Issues Encountered

**None.**

### Pre-existing `@napplet/shim` Type Error (carried forward — still Phase 139 scope)

Identical disclosure to 137-01 and 137-02 SUMMARY: `pnpm -r type-check` at the monorepo level fails on `packages/shim/src/index.ts(130,1)` — TS2741 for missing `connect` property on `NappletGlobal`. Introduced by Phase 136 CORE-02; resolved by Phase 139 SHIM-01/SHIM-02. Package-scoped check on `@napplet/nub` (the package this plan modifies) passes clean. Not a 137-03 deviation.

## Phase 137 Completion Summary

This plan is **terminal for Phase 137**. All 13 phase requirements satisfied:

| REQ       | Plan   | Commit(s) |
| --------- | ------ | --------- |
| NUB-01    | 137-01 | (see 137-01 SUMMARY) |
| NUB-02    | 137-02 | 37558f2 |
| NUB-03    | 137-02 | 37558f2 |
| NUB-04    | 137-02 | 37558f2 |
| NUB-05    | 137-03 | 4ef2f01 |
| NUB-06    | 137-03 | 918f2e6 |
| NUB-07    | 137-03 | 918f2e6 |
| CLASS-01  | 137-01 | (see 137-01 SUMMARY) |
| CLASS-02  | 137-02 | e732c41 |
| CLASS-03  | 137-02 | e732c41 |
| CLASS-04  | 137-02 | e732c41 |
| CLASS-05  | 137-03 | 4ef2f01 |
| CLASS-06  | 137-03 | 918f2e6 |

## Downstream Phase Readiness

### Phase 138 (`@napplet/vite-plugin` surgery) — unblocked

Importable now:
```typescript
import { normalizeConnectOrigin } from '@napplet/nub/connect/types';
// Pure validator. Throws with [@napplet/nub/connect]-prefixed messages on any of
// 21 rule violations. 28/28 smoke tests passed in Phase 137-01.
```

`packages/nub/dist/connect/types.js` is emitted and resolvable via the `./connect/types` subpath export.

### Phase 139 (central shim + SDK integration) — unblocked

Importable now:
```typescript
import { installConnectShim, connectGranted, connectOrigins } from '@napplet/nub/connect';
import { installClassShim, handleClassMessage, getClass } from '@napplet/nub/class';
```

Both subpath barrels also trigger `registerNub('connect', noop)` and `registerNub('class', handleClassMessage)` as module-evaluation side effects. Central shim can rely on both domains being registered after the imports are evaluated. This resolves the pending `@napplet/shim` type error (packages/shim/src/index.ts:130 — missing `connect` default block) via the SHIM-01/SHIM-02 integration.

### Phase 142 (Verification & Milestone Close) — baseline established

- 46-exports invariant can be asserted with `node -e` one-liner.
- 46-entries invariant can be asserted with `grep -c`.
- Tree-shake harness fixtures can assert against the recorded baseline sizes (connect/types.js 155 B, class/types.js 103 B).

## Self-Check: PASSED

- `packages/nub/package.json` exports key count `46` — FOUND (verified via node -e)
- `packages/nub/tsup.config.ts` entry count `46` — FOUND (verified via grep -c)
- `packages/nub/dist/connect/index.js` — FOUND (455 B)
- `packages/nub/dist/connect/index.d.ts` — FOUND (184 B)
- `packages/nub/dist/connect/types.js` — FOUND (155 B)
- `packages/nub/dist/connect/types.d.ts` — FOUND (3,395 B)
- `packages/nub/dist/connect/shim.js` — FOUND (126 B)
- `packages/nub/dist/connect/shim.d.ts` — FOUND (799 B)
- `packages/nub/dist/connect/sdk.js` — FOUND (153 B)
- `packages/nub/dist/connect/sdk.d.ts` — FOUND (1,368 B)
- `packages/nub/dist/class/index.js` — FOUND (398 B)
- `packages/nub/dist/class/index.d.ts` — FOUND (231 B)
- `packages/nub/dist/class/types.js` — FOUND (103 B)
- `packages/nub/dist/class/types.d.ts` — FOUND (3,232 B)
- `packages/nub/dist/class/shim.js` — FOUND (166 B)
- `packages/nub/dist/class/shim.d.ts` — FOUND (1,695 B)
- `packages/nub/dist/class/sdk.js` — FOUND (105 B)
- `packages/nub/dist/class/sdk.d.ts` — FOUND (1,302 B)
- commit `4ef2f01` (Task 1) — FOUND in git log
- commit `918f2e6` (Task 2) — FOUND in git log
- `pnpm --filter @napplet/nub build` — exits 0
- `pnpm --filter @napplet/nub type-check` — exits 0
- Tree-shake prerequisites: `dist/connect/types.js` and `dist/class/types.js` — FREE of installer / registerNub references

---
*Phase: 137-nub-connect-and-nub-class-subpath-scaffolds*
*Plan 03 of 3 — TERMINAL for Phase 137*
*Completed: 2026-04-21*
