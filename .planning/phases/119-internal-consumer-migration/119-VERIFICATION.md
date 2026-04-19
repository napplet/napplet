---
phase: 119-internal-consumer-migration
verified: 2026-04-19T15:00:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
gaps: []
human_verification: []
---

# Phase 119: Internal Consumer Migration Verification Report

**Phase Goal:** Every internal consumer inside this monorepo — `@napplet/shim`, `@napplet/sdk`, and any demo/test code — imports from the new `@napplet/nub/<domain>` paths instead of the deprecated `@napplet/nub-<domain>` package names. The shim uses `/shim` granular subpaths; the SDK uses domain barrels to preserve its `export * as <domain>` pattern. After this phase, no first-party code depends on the deprecated package names.
**Verified:** 2026-04-19T15:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                          | Status     | Evidence                                                                                                     |
|----|--------------------------------------------------------------------------------|------------|--------------------------------------------------------------------------------------------------------------|
| 1  | `packages/shim/src/index.ts` uses `@napplet/nub/<domain>/shim` for 8 domains  | VERIFIED   | Lines 7,8,21,23,24,37,38,47: keys/shim, media/shim, notify/shim, storage/shim, relay/shim, identity/shim, ifc/shim, config/shim |
| 2  | `IfcEventMessage` uses `@napplet/nub/ifc/types` (type-only)                   | VERIFIED   | Line 49: `import type { IfcEventMessage } from '@napplet/nub/ifc/types'`                                     |
| 3  | Zero `@napplet/nub-` specifiers in `packages/shim/src/`                       | VERIFIED   | `grep -rn "@napplet/nub-" packages/shim/src/` → 0 matches                                                   |
| 4  | `packages/sdk/src/index.ts` re-exports from `@napplet/nub/<domain>` barrels for all 9 domains | VERIFIED | Lines 774,804,820,844,859,876,896,919,940 (types); 944–952 (DOMAIN constants); 957–964 (shim installers); 969–975 (SDK helpers); JSDoc lines 17–18 |
| 5  | Zero `@napplet/nub-` specifiers in `packages/sdk/src/`                        | VERIFIED   | `grep -rn "@napplet/nub-" packages/sdk/src/` → 0 matches                                                    |
| 6  | Theme uses barrel-only (no `@napplet/nub/theme/shim` or `/sdk`)               | VERIFIED   | sdk/src/index.ts line 859: `from '@napplet/nub/theme'` barrel only; grep confirms 0 theme/shim or theme/sdk  |
| 7  | CONS-03 (demo/test consumers) trivially satisfied                              | VERIFIED   | No demo/ or test/ directories exist at repo top level; grep of first-party code outside nubs/nub trees shows 0 import-specifier matches |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact                              | Expected                                           | Status      | Details                                                              |
|---------------------------------------|----------------------------------------------------|-------------|----------------------------------------------------------------------|
| `packages/shim/src/index.ts`          | 8 `/shim` subpath imports + 1 `/types` import      | VERIFIED    | 9 canonical specifiers found, 0 legacy specifiers found              |
| `packages/sdk/src/index.ts`           | 9 barrel re-export blocks + JSDoc examples updated | VERIFIED    | 9 domains via barrels; 2 JSDoc examples at lines 17–18 migrated      |
| `packages/shim/package.json`          | `dependencies = {@napplet/core, @napplet/nub}` only | VERIFIED   | 2 deps: `@napplet/core: workspace:*`, `@napplet/nub: workspace:*`   |
| `packages/sdk/package.json`           | `dependencies = {@napplet/core, @napplet/nub}` only | VERIFIED   | 2 deps: `@napplet/core: workspace:*`, `@napplet/nub: workspace:*`   |
| `packages/shim/dist/index.js`         | 8 `@napplet/nub/<domain>/shim` refs, 0 `@napplet/nub-` refs | VERIFIED | All 8 domains present (1 each), 0 legacy refs                  |
| `packages/sdk/dist/index.js`          | 9 `@napplet/nub/<domain>` barrel refs, 0 `@napplet/nub-` refs | VERIFIED | All 9 domains present, 0 legacy refs, 0 theme/shim, 0 theme/sdk |

---

### Key Link Verification

| From                              | To                              | Via                          | Status   | Details                                                           |
|-----------------------------------|---------------------------------|------------------------------|----------|-------------------------------------------------------------------|
| `packages/shim/src/index.ts`      | `@napplet/nub` package          | `workspace:*` dep            | WIRED    | `packages/shim/package.json` dep entry present + lockfile link   |
| `packages/sdk/src/index.ts`       | `@napplet/nub` package          | `workspace:*` dep            | WIRED    | `packages/sdk/package.json` dep entry present + lockfile link    |
| shim imports → keys/shim          | `@napplet/nub/keys/shim`        | subpath export               | WIRED    | Imported line 7; resolved by Phase 117 exports map               |
| shim imports → media/shim         | `@napplet/nub/media/shim`       | subpath export               | WIRED    | Imported line 8                                                  |
| shim imports → notify/shim        | `@napplet/nub/notify/shim`      | subpath export               | WIRED    | Imported line 21                                                 |
| shim imports → storage/shim       | `@napplet/nub/storage/shim`     | subpath export               | WIRED    | Imported line 23                                                 |
| shim imports → relay/shim         | `@napplet/nub/relay/shim`       | subpath export               | WIRED    | Imported line 24                                                 |
| shim imports → identity/shim      | `@napplet/nub/identity/shim`    | subpath export               | WIRED    | Imported line 37                                                 |
| shim imports → ifc/shim           | `@napplet/nub/ifc/shim`         | subpath export               | WIRED    | Imported line 38                                                 |
| shim imports → config/shim        | `@napplet/nub/config/shim`      | subpath export               | WIRED    | Imported line 47                                                 |
| shim imports → ifc/types          | `@napplet/nub/ifc/types`        | subpath export (type-only)   | WIRED    | `import type { IfcEventMessage }` line 49                        |
| sdk re-exports → 9 domain barrels | `@napplet/nub/<domain>`         | barrel subpath exports       | WIRED    | All 9 domains: relay, identity, storage, ifc, theme, keys, media, notify, config |

---

### Data-Flow Trace (Level 4)

Not applicable. This phase is a pure import-path refactor producing TypeScript packages with no runtime data rendering (no components, no pages, no data fetching). All artifacts export functions and types; there is no dynamic data flow to trace.

---

### Behavioral Spot-Checks

| Behavior                            | Command                                               | Result                               | Status  |
|-------------------------------------|-------------------------------------------------------|--------------------------------------|---------|
| Full monorepo build exits 0         | `pnpm -r build`                                       | All 14 packages: Done                | PASS    |
| Full monorepo type-check exits 0    | `pnpm -r type-check`                                  | All 14 packages: Done                | PASS    |
| shim dist has 8 granular /shim refs | grep canonical subpaths in dist/index.js              | 8 refs (1 each for all 8 domains)    | PASS    |
| shim dist has 0 legacy `@napplet/nub-` refs | grep legacy in shim dist/index.js             | 0 matches                            | PASS    |
| sdk dist has 9 barrel refs          | grep canonical barrels in dist/index.js               | 9 refs across all domains            | PASS    |
| sdk dist has 0 legacy `@napplet/nub-` refs  | grep legacy in sdk dist/index.js              | 0 matches                            | PASS    |
| sdk dist has 0 theme granular refs  | grep theme/shim + theme/sdk in sdk dist/index.js      | 0 matches                            | PASS    |

---

### Requirements Coverage

| Requirement | Source Plan | Description                                                                                         | Status    | Evidence                                                                     |
|-------------|-------------|-----------------------------------------------------------------------------------------------------|-----------|------------------------------------------------------------------------------|
| CONS-01     | 119-01      | `@napplet/shim` imports from `@napplet/nub/<domain>/shim` for all 8 shim domains                   | SATISFIED | 8 `/shim` subpath imports confirmed in src + dist; 0 legacy specifiers       |
| CONS-02     | 119-01      | `@napplet/sdk` re-exports from `@napplet/nub/<domain>` barrels for all 9 domains                   | SATISFIED | 9 barrel imports confirmed in src + dist; JSDoc examples migrated; 0 legacy  |
| CONS-03     | 119-01      | No `@napplet/nub-` references in first-party demo/test consumers                                    | SATISFIED | No demo/test dirs exist; grep of first-party src/config outside nubs/nub trees returns 0 import-specifier hits |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/shim/src/index.ts` | 181 | `// TODO: Shell populates supported capabilities at iframe creation` | Info | Pre-existing stub in `shell.supports()` — not introduced by this phase; not a migration concern |

No migration-related anti-patterns found. The `shell.supports()` TODO is pre-existing and out of scope for this phase.

---

### Human Verification Required

None. All verification criteria for this phase are amenable to automated checking (import specifiers, manifest dep counts, build + type-check exit codes, dist artifact content). No visual or real-time behavior is involved.

---

### Gaps Summary

No gaps. All 7 must-have truths verified, all 6 artifacts pass all applicable levels, all key links confirmed wired, both build gates pass, both dep graphs are correct, and the dist artifacts emit canonical subpaths with zero legacy references.

The only non-trivial observation is the pre-existing `shell.supports()` TODO stub at shim line 181, which is not introduced by this phase and is not a migration concern.

---

_Verified: 2026-04-19T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
