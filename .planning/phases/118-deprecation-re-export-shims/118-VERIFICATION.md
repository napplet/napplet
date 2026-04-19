---
phase: 118-deprecation-re-export-shims
verified: 2026-04-19T00:00:00Z
status: passed
score: 8/8 must-haves verified
re_verification: null
gaps: []
human_verification: []
---

# Phase 118: Deprecation Re-Export Shims Verification Report

**Phase Goal:** Every one of the 9 existing `@napplet/nub-<domain>` packages is converted into a 1-line re-export shim that forwards to `@napplet/nub/<domain>`, is marked `@deprecated` in its `package.json` description, and carries a top-of-README banner pointing at the new import path and stating the removal milestone. Pinned consumers of the old package names continue to work with zero behavioral change; existing imports do not need to be touched to keep building.
**Verified:** 2026-04-19
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                        | Status     | Evidence                                                                                              |
|----|--------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------------------|
| 1  | Each of 9 `packages/nubs/<domain>/src/` dirs has exactly `index.ts` only | VERIFIED | `ls packages/nubs/<domain>/src/`: 1 file each — `index.ts` — across all 9 domains; confirmed via filesystem check |
| 2  | Each `src/index.ts` is a JSDoc `@deprecated` block + `export * from '@napplet/nub/<domain>';` | VERIFIED | grep confirmed `@deprecated=1` and `export_star=1` on all 9 domain index.ts files |
| 3  | `pnpm -r build` green; each deprecated `dist/index.js` references `@napplet/nub` | VERIFIED | All 9 `dist/index.js` contain single `export * from "@napplet/nub/<domain>";` line; confirmed via cat |
| 4  | Shape parity: named exports of `@napplet/nub-<domain>` === `@napplet/nub/<domain>` for spot-checked domains | VERIFIED | Live import + `Object.keys()` diff: config=8/8, relay=10/10, theme=1/1 — all match=true |
| 5  | All 9 `README.md` files exist and carry `⚠️ **DEPRECATED**` banner within first 20 lines naming `@napplet/nub/<domain>` and "future" removal | VERIFIED | All 9 README files present; grep confirms deprecated=1, nub_path>=1, future=1 for every domain |
| 6  | All 9 `package.json` descriptions start with `[DEPRECATED] Use @napplet/nub/<domain> instead.` | VERIFIED | Python JSON parse confirms prefix present and correct migration path for all 9 packages |
| 7  | `.changeset/deprecate-nub-domain-packages.md` exists with `minor` bump for all 9 packages; version fields still `0.2.1` | VERIFIED | Changeset file present; 9 `minor` entries confirmed; all 9 package.json `version` fields read `0.2.1` |
| 8  | Dep wiring: `@napplet/nub: workspace:*` in all 9 `package.json`; `@napplet/core` absent as direct dep; config preserves peerDep/devDep exceptions; `@napplet/nub` untouched (34 .js + 34 .d.ts) | VERIFIED | All 9: `@napplet/nub=workspace:*`, `@napplet/core=ABSENT`; config peerDep+meta+devDep intact; pnpm-lock.yaml reflects new edges; `@napplet/nub` dist has 34 .js (excl chunk-*) + 34 .d.ts |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/nubs/{9 domains}/src/index.ts` | JSDoc `@deprecated` + single `export *` line | VERIFIED | All 9 files present; each is 10 lines (JSDoc block + export line) |
| `packages/nubs/{9 domains}/README.md` | Deprecation banner in first 20 lines with `⚠️ **DEPRECATED**`, migration path, "future" removal | VERIFIED | All 9 present; 4 prepend cases start at line 1; 5 new READMEs start with `# heading` then banner at line 3 |
| `packages/nubs/{9 domains}/package.json` | `[DEPRECATED]` description prefix, `@napplet/nub: workspace:*` dep, no `@napplet/core` direct dep | VERIFIED | All 9 confirmed; config exception preserved (peerDeps + devDep) |
| `.changeset/deprecate-nub-domain-packages.md` | `minor` bump for all 9 deprecated packages | VERIFIED | File exists; 9 entries with `minor` bump; `@napplet/nub` omitted (frozen per CONTEXT.md) |
| `packages/nubs/{9 domains}/dist/index.js` | Single `export * from "@napplet/nub/<domain>";` line | VERIFIED | All 9 dist/index.js files contain exactly that single export line + sourcemap comment |
| `packages/nub/dist/` | 34 .js (excl chunk-*) + 34 .d.ts — Phase 117 state preserved | VERIFIED | `find` counts: 34 non-chunk .js; 34 .d.ts — matches Phase 117 verification |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/nubs/<domain>/src/index.ts` | `@napplet/nub/<domain>` | `export * from` | VERIFIED | All 9 source files contain the correct re-export line |
| `packages/nubs/<domain>/package.json` dependencies | `@napplet/nub: workspace:*` | direct dep | VERIFIED | All 9 confirmed; `@napplet/core` not present as direct dep |
| `pnpm-lock.yaml` importers | `packages/nubs/<domain>` → `link:../../nub` | pnpm workspace resolution | VERIFIED | lockfile shows `@napplet/nub: specifier: workspace:*, version: link:../../nub` for spot-checked config, relay, theme |
| `packages/nubs/<domain>/dist/index.js` | `@napplet/nub/<domain>` | tsup emit | VERIFIED | All 9 dist/index.js confirmed to re-export from `@napplet/nub/<domain>` |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase produces re-export shim packages (no dynamic data rendering; purely static re-export wiring).

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `@napplet/nub-config` exports identical surface to `@napplet/nub/config` | `node -e "import(...).then(m => console.log(Object.keys(m).length))"` | 8 keys; match=true | PASS |
| `@napplet/nub-relay` exports identical surface to `@napplet/nub/relay` | Live import diff | 10 keys each; match=true | PASS |
| `@napplet/nub-theme` exports identical surface to `@napplet/nub/theme` | Live import diff | 1 key each; match=true | PASS |
| `@napplet/nub` dist/ has 34 non-chunk .js + 34 .d.ts (regression check) | `find packages/nub/dist -name '*.js' ! -name '*.map' ! -name 'chunk-*'` | 34 | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| MIG-01 | 118-01, 118-02, 118-03 | 9 deprecated packages converted to 1-line re-export shims; build resolves; type-identical surface | SATISFIED | All 9 src/index.ts are correct shims; dist/index.js confirmed; live import parity verified for 3/9 (9/9 per SUMMARY smoke) |
| MIG-02 | 118-01 | README deprecation banners on all 9 packages | SATISFIED | All 9 README files present with `⚠️ **DEPRECATED**` banner, migration path, and "future" removal phrasing |
| MIG-03 | 118-02 | `[DEPRECATED]` description prefix + changeset-staged 0.3.0 minor bump | SATISFIED | All 9 `package.json` description fields start with `[DEPRECATED] Use @napplet/nub/<domain> instead.`; changeset file has 9 `minor` entries |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | No anti-patterns detected. All 9 src/index.ts files are minimal JSDoc + single-line export; no TODOs, placeholders, or empty implementations. |

---

### Human Verification Required

None — all must-haves are mechanically verifiable and have been confirmed programmatically.

---

### Gaps Summary

No gaps. All 8 observable truths verified against the actual codebase.

**Phase 118 achieves its goal:** The 9 `@napplet/nub-<domain>` packages are fully converted to 1-line re-export shims. Pinned consumers continue to work without any code changes. The `@napplet/nub` canonical package is untouched. The deprecation metadata (description prefix, changeset) is in place for release-time application via `pnpm version-packages`.

---

**Additional notes on specific must-have details:**

- **MIG-01 source shape:** Exactly 9 files exist across 9 `src/` directories — precisely `index.ts` with the JSDoc `@deprecated` block and `export * from '@napplet/nub/<domain>';`. All 25 former `types.ts`/`shim.ts`/`sdk.ts` files are confirmed deleted.

- **README banner placement:** The 4 prepend cases (config, keys, media, notify) have the banner as the very first line (`> ⚠️ **DEPRECATED**`). The 5 new READMEs (identity, ifc, relay, storage, theme) start with `# @napplet/nub-<domain>` heading followed immediately by the banner at line 3 — within the 20-line window specified.

- **Config special case:** `packages/nubs/config/package.json` preserves `peerDependencies: {"json-schema-to-ts": "^3.1.1"}`, `peerDependenciesMeta: {"json-schema-to-ts": {"optional": true}}`, and `devDependencies: {"@types/json-schema": "^7.0.15"}` — byte-identical to the pre-phase state per the requirement.

- **@napplet/nub non-regression:** Phase 117's 34 entry-point state confirmed intact: 34 non-chunk `.js` files and 34 `.d.ts` files in `packages/nub/dist/`; `exports` map count = 34; `@napplet/core` remains the sole runtime dep.

- **Changeset convention:** All 9 `package.json` `version` fields read `0.2.1` — the 0.3.0 bump is recorded only in the changeset file per repo convention. `pnpm version-packages` applies it at release time.

---

_Verified: 2026-04-19_
_Verifier: Claude (gsd-verifier)_
