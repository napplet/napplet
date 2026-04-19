---
phase: 117-napplet-nub-package-foundation
verified: 2026-04-19T00:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification: null
gaps: []
human_verification: []
---

# Phase 117: @napplet/nub Package Foundation Verification Report

**Phase Goal:** A single `@napplet/nub` package exists at `packages/nub/`, contains all 9 domain subdirectories as source, builds cleanly, and exposes all entry points (barrels + granular) through a `package.json` `exports` map with types + import conditions. This is the load-bearing foundation — nothing downstream can migrate until `@napplet/nub/<domain>` paths are real and resolvable from inside the monorepo.
**Verified:** 2026-04-19
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Context Note: 34 vs 36 Entry Points

The ROADMAP and REQUIREMENTS.md were authored before execution discovered that the `theme` NUB ships only `index.ts` + `types.ts` upstream (no `shim.ts`, no `sdk.ts`). The user selected Option A during a Plan 117-02 checkpoint: drop the two phantom theme entries. The authoritative shape is **34 entry points** (9 barrels + 9 types + 8 shim + 8 sdk). All requirements against "36" are evaluated against 34 with the theme deviation noted as an approved, documented deviation — not a scope cut.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | `packages/nub/src/` has 9 subdirectories with 34 source files (theme: 2, others: 4 each), byte-identical to upstream | VERIFIED | `find packages/nub/src -name '*.ts' \| wc -l` = 34; all 9 dirs present; `diff -q` across all 34 pairs = 0 mismatches |
| 2 | `package.json` declares `@napplet/core` as sole runtime dep and `json-schema-to-ts` as optional peerDep | VERIFIED | `dependencies: {"@napplet/core": "workspace:*"}` only; `peerDependenciesMeta.json-schema-to-ts.optional: true` confirmed |
| 3 | `package.json` has `"sideEffects": false` | VERIFIED | `sideEffects: false` present at root of package.json |
| 4 | Exports map has 9 domain barrel subpaths, each with `types` + `import` conditions pointing to correct dist paths | VERIFIED | 9 barrel keys confirmed; every entry has both conditions; 0 missing |
| 5 | Exports map has 25 granular subpaths (9 types + 8 shim + 8 sdk, no theme/shim or theme/sdk) | VERIFIED | `types: 9, shim: 8, sdk: 8 = 25`; `./theme/shim` and `./theme/sdk` absent |
| 6 | Every exports entry has both `types` and `import` conditions | VERIFIED | Script check: 0 entries missing conditions across all 34 |
| 7 | No `.` root key; no top-level `main`/`module`/`types` fields | VERIFIED | `'.' in exports: false`; top-level banned fields: 0 |
| 8 | `pnpm --filter @napplet/nub build` exits 0; emits 34 `.js` + 34 `.d.ts` files | VERIFIED | Build exit 0; `find dist -name '*.js' ! -name 'chunk-*'` = 34; `.d.ts` = 34 |
| 9 | `pnpm --filter @napplet/nub type-check` exits 0; all 34 export entries have on-disk `.d.ts` | VERIFIED | `tsc --noEmit` exit 0; per-entry existence check: `exports: 34 missing: 0` |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/nub/package.json` | Full metadata, 34-entry exports map, sideEffects:false, deps | VERIFIED | All fields confirmed via node inspection |
| `packages/nub/tsup.config.ts` | 34 entry keys, format:esm, dts:true, sourcemap:true, clean:true | VERIFIED | 34 keys counted via grep; no phantom theme/shim or theme/sdk |
| `packages/nub/src/<9 domains>` | 34 .ts source files across 9 dirs (theme: 2, others: 4 each) | VERIFIED | `find` = 34 files; all 9 subdirs present |
| `packages/nub/dist/<domain>/<file>.js` | 34 entry-point JS files | VERIFIED | 34 .js files (excluding chunk-*) in correct domain/file layout |
| `packages/nub/dist/<domain>/<file>.d.ts` | 34 co-located declaration files | VERIFIED | 34 .d.ts files; 0 exports entries without matching disk file |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `package.json` exports | `dist/<domain>/<file>.js` | import condition | WIRED | All 34 `.import` paths resolve to existing files |
| `package.json` exports | `dist/<domain>/<file>.d.ts` | types condition | WIRED | All 34 `.types` paths resolve to existing files |
| `tsup.config.ts` entry keys | `src/<domain>/<file>.ts` | source path | WIRED | All 34 tsup source paths exist on disk |
| `src/<domain>/*.ts` | `@napplet/core` | import | WIRED | All runtime imports correctly go to core; 0 actual cross-NUB imports |
| `dist/<domain>/index.js` (8 of 9) | `registerNub(DOMAIN, ...)` | side effect | WIRED | 8 barrels register: identity, ifc, keys, media, notify, relay, storage, theme |
| `dist/config/index.js` | no `registerNub` | absence | WIRED | Config barrel correctly abstains from registration |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase produces a TypeScript library package, not a component that renders dynamic data. The relevant "data flow" is build-time: source → tsup → dist, verified via file-count and per-entry disk existence checks.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build exits 0 | `pnpm --filter @napplet/nub build` | exit 0; "ESM Build success" | PASS |
| Type-check exits 0 | `pnpm --filter @napplet/nub type-check` | exit 0; zero diagnostics | PASS |
| 34 entry .js files emitted | `find dist -name '*.js' ! -name 'chunk-*' ! -name '*.map'` | 34 | PASS |
| 34 .d.ts files emitted | `find dist -name '*.d.ts'` | 34 | PASS |
| All exports resolve to disk | node script: 34 entries, 0 missing | `exports: 34 missing: 0` | PASS |
| registerNub asymmetry | grep across 9 dist/*/index.js | 8 register, 1 (config) does not | PASS |
| types.js files runtime-pure | grep for @napplet/core runtime import | 0 hits across all 9 domains | PASS |
| No root dot export | `'.' in exports` | false | PASS |
| No phantom theme/shim or theme/sdk | grep package.json + tsup.config.ts | 0 matches | PASS |
| No top-level main/module/types | node field check | 0 banned fields | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| PKG-01 | 117-02 | `packages/nub/` with 9 domain subdirs, source files | SATISFIED | 9 dirs, 34 source files, byte-identical copies |
| PKG-02 | 117-01 | `@napplet/core` sole runtime dep; `json-schema-to-ts` optional peerDep | SATISFIED | package.json deps + peerDependenciesMeta confirmed |
| PKG-03 | 117-01 | `sideEffects: false` | SATISFIED | Present in package.json root |
| EXP-01 | 117-01 | 9 domain barrel subpaths in exports map | SATISFIED | 9 barrel entries; all with types+import conditions |
| EXP-02 | 117-01 | Granular subpaths (types/shim/sdk) per domain | SATISFIED* | 25 granular entries (not 27 as originally written); theme correctly contributes only 1 granular entry (`./theme/types`) per Option A |
| EXP-03 | 117-01 | All entries have `types` + `import` conditions | SATISFIED | 0 entries missing conditions |
| EXP-04 | 117-01 | No root `.` export | SATISFIED | `'.' in exports: false`; no top-level main/module/types; root import fails with ERR_MODULE_NOT_FOUND from repo root (ERR_PACKAGE_PATH_NOT_EXPORTED confirmed from consumer context per 117-03 SUMMARY) |
| BUILD-01 | 117-03 | `tsup` build exits 0; 34 .js + 34 .d.ts emitted | SATISFIED | Build exit 0; counts confirmed |
| BUILD-02 | 117-03 | Zero TypeScript errors; every subpath has .d.ts | SATISFIED | type-check exit 0; 0 missing .d.ts files |

*EXP-02 note: REQUIREMENTS.md was authored before the theme audit. The original text says "27 granular entry points total" (9 domains × 3 surfaces). The actual count is 25 (theme contributes only `./theme/types`, not `./theme/shim` or `./theme/sdk`). This is a user-approved, documented deviation (Option A from 117-02 checkpoint). The intent of EXP-02 — individually importable granular subpaths — is fully satisfied for all surfaces that exist upstream.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/*/index.ts` (all 9) | various | JSDoc `@example` blocks reference old `@napplet/nub-<domain>` import paths | Info | Informational only — these are string literals inside JSDoc, not actual import statements. Type-check passes. Deferred to Phase 120 per the byte-identical copy rule. |

No blockers. No warnings. The JSDoc references are inert.

---

### Human Verification Required

None. All invariants for this infrastructure phase are verifiable programmatically. The one item that required a real consumer context (EXP-04: `ERR_PACKAGE_PATH_NOT_EXPORTED` vs `ERR_MODULE_NOT_FOUND`) was demonstrated by the Plan 117-03 executor using a `/tmp/nub-exp04-probe/` consumer with a `file:` dependency — this is captured in the 117-03-SUMMARY.md. From the repo root, `ERR_MODULE_NOT_FOUND` is observed (package not linked into root node_modules), which is also an accepted outcome since the root `.` key is absent from `exports` either way.

---

### Gaps Summary

No gaps. All 9 observable truths are verified. All 9 requirement IDs (PKG-01..03, EXP-01..04, BUILD-01..02) are satisfied. The 34-entry shape is the correct, approved implementation — the ROADMAP and REQUIREMENTS.md references to "36" are stale pre-execution artifacts, not requirements that were missed.

The package is a clean, load-bearing foundation:

- Source: 34 TypeScript files across 9 domain subdirectories, byte-identical to upstream NUB packages
- Config: 34-entry tsup config and exports map, no phantom entries, no root export
- Build: exits 0, emits 34 .js + 34 .d.ts entry-point files plus 25 shared code-split chunks
- Types: type-check exits 0, every exports entry has a matching .d.ts on disk
- Invariants: registerNub asymmetry preserved (8/9 register; config abstains), types.js files runtime-pure, no cross-NUB actual imports

Phase 118 (Deprecation Re-Export Shims) is unblocked.

---

_Verified: 2026-04-19_
_Verifier: Claude (gsd-verifier)_
