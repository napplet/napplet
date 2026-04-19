---
phase: 117-napplet-nub-package-foundation
plan: 02
subsystem: infra
tags: [packaging, monorepo, typescript, nub, esm, copy, exports-map, tsup]

# Dependency graph
requires:
  - phase: 117-01
    provides: packages/nub/ scaffold (package.json + tsconfig.json + tsup.config.ts + .gitkeep) with exports map + tsup entry object
provides:
  - packages/nub/src/ populated with 34 TypeScript source files across 9 domain subdirectories (byte-identical copies of packages/nubs/<domain>/src/)
  - 8 of 9 domain barrels preserve their registerNub(DOMAIN, ...) side effect (relay, storage, ifc, keys, media, notify, identity, theme)
  - config barrel remains side-effect-free (matches existing @napplet/nub-config pattern)
  - Exports map + tsup entry object amended to 34 entries — phantom ./theme/shim + ./theme/sdk entries removed (theme ships types-only today)
affects:
  - 117-03 (first build of @napplet/nub via tsup — now has real sources + correct 34-entry config)
  - 118 (re-export shim migration — existing packages/nubs/<domain>/ remain intact this phase, ready for conversion)
  - 119 (flip @napplet/shim + @napplet/sdk to import from @napplet/nub)
  - 120 (documentation — @napplet/nub-<domain> JSDoc docstrings still reference old import paths, deferred)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Byte-identical verbatim copy across monorepo domains — preserves all import paths, JSDoc, side-effect posture"
    - "Asymmetric barrel registration: 8/9 domain barrels call registerNub(DOMAIN, ...) at module load; 1 (config) is side-effect-free by design"
    - "Phase-boundary rule: source copied, not moved — packages/nubs/<domain>/ continues to build from its own sources this phase"
    - "Plan amendment recorded inside the single atomic implementation commit (not a separate docs commit) — keeps Plan 117-01's phantom entries from ever hitting a green build"

key-files:
  created:
    - packages/nub/src/relay/{index,types,shim,sdk}.ts
    - packages/nub/src/storage/{index,types,shim,sdk}.ts
    - packages/nub/src/ifc/{index,types,shim,sdk}.ts
    - packages/nub/src/keys/{index,types,shim,sdk}.ts
    - packages/nub/src/media/{index,types,shim,sdk}.ts
    - packages/nub/src/notify/{index,types,shim,sdk}.ts
    - packages/nub/src/identity/{index,types,shim,sdk}.ts
    - packages/nub/src/config/{index,types,shim,sdk}.ts
    - packages/nub/src/theme/{index,types}.ts  # NO shim.ts, NO sdk.ts — theme ships types-only today
  modified:
    - packages/nub/package.json  # dropped phantom ./theme/shim + ./theme/sdk exports (36 -> 34 entries)
    - packages/nub/tsup.config.ts  # dropped phantom 'theme/shim' + 'theme/sdk' entry keys (36 -> 34 keys)
  deleted:
    - packages/nub/src/.gitkeep  # placeholder from Plan 117-01 removed now that real source exists

key-decisions:
  - "Option A (34 entries, not 36): drop phantom ./theme/shim and ./theme/sdk from exports map + tsup config. Matches upstream reality — theme NUB ships index.ts + types.ts only today — and preserves Phase 117's 'no behavioral migration' boundary. Theme shim/sdk extraction from central @napplet/shim and @napplet/sdk is deferred to a later phase."
  - "Plan 117-01's package.json + tsup.config.ts were amended inside the SAME atomic commit as the 34-file source copy. Rationale: Plan 117-01's 36-entry count was based on a pre-copy assumption that theme would have all 4 files; correcting it at copy time (rather than shipping an intermediate 'correct the exports map' commit) keeps the phantom entries from ever being reachable by a green build."
  - "registerNub asymmetry preserved exactly as upstream: 8 of 9 barrels (identity, ifc, keys, media, notify, relay, storage, theme) call registerNub(DOMAIN, ...) at module load; config stays side-effect-free (registration happens in the central shim per @napplet/nub-config pattern)."
  - "@napplet/nub-<domain> strings in JSDoc docstrings left as-is (byte-identical copy rule). These are informational file headers, not import paths. Phase 120 handles doc updates. Verified via grep: zero ACTUAL import/from statements reference @napplet/nub-<other> — all imports go to @napplet/core or json-schema."

patterns-established:
  - "Types-only NUB subpath shape: domain barrel (./theme) + granular types (./theme/types) = 2 entries per domain when the NUB has no shim.ts/sdk.ts yet. Full NUBs contribute 4 entries each (barrel + types + shim + sdk)."

requirements-completed:
  - PKG-01

# Metrics
duration: 1 min
completed: 2026-04-19
---

# Phase 117 Plan 02: @napplet/nub Source Population Summary

**34 TypeScript source files copied byte-identical from packages/nubs/<domain>/src/ into packages/nub/src/<domain>/ across 9 domains; theme ships types-only so exports map + tsup config corrected from 36 → 34 entries in the same atomic commit.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-19T13:03:42Z
- **Completed:** 2026-04-19T13:05:02Z
- **Tasks:** 1 (atomic: source copy + exports map amendment + tsup config amendment)
- **Files created:** 34 TypeScript sources under packages/nub/src/
- **Files modified:** 2 (packages/nub/package.json, packages/nub/tsup.config.ts)
- **Files deleted:** 1 (packages/nub/src/.gitkeep)

## Accomplishments

- packages/nub/src/ now contains all 9 NUB domains as real source trees, each byte-identical to its packages/nubs/<domain>/src/ counterpart (verified via `diff -q` across every pair — zero mismatches)
- Eight domains (config, identity, ifc, keys, media, notify, relay, storage) each ship 4 files (index, types, shim, sdk); theme ships 2 (index, types only)
- registerNub(DOMAIN, ...) side-effect asymmetry preserved exactly: 8 barrels register (identity, ifc, keys, media, notify, relay, storage, theme), config stays side-effect-free
- Exports map amended to 34 entries (9 barrels + 24 granular from full NUBs + 1 granular theme/types = 34). Zero phantom theme/shim or theme/sdk entries. Still no root `.` entry (EXP-04 preserved).
- tsup.config.ts entry object amended to 34 keys (same shape). `pnpm --filter @napplet/nub type-check` exits 0 against the new source layout.
- packages/nubs/<domain>/ untouched — `git status packages/nubs/` clean, `git diff --stat packages/nubs/` empty. Those packages still build from their own sources this phase. Phase 118 is responsible for converting them into re-export shims.

## Task Commits

Single atomic commit covering all 37 file operations (34 adds + 2 mods + 1 delete):

1. **Task 1: Populate packages/nub/src with 34 byte-identical domain copies + amend exports map + tsup config** — `cf2ef93` (feat)

**Plan metadata commit:** forthcoming (SUMMARY.md + STATE.md + ROADMAP.md).

## Files Created/Modified

### Created (34)

- `packages/nub/src/relay/{index,types,shim,sdk}.ts` — Relay NUB domain sources (4 files)
- `packages/nub/src/storage/{index,types,shim,sdk}.ts` — Storage NUB domain sources (4 files)
- `packages/nub/src/ifc/{index,types,shim,sdk}.ts` — IFC NUB domain sources (4 files)
- `packages/nub/src/keys/{index,types,shim,sdk}.ts` — Keys NUB domain sources (4 files)
- `packages/nub/src/media/{index,types,shim,sdk}.ts` — Media NUB domain sources (4 files)
- `packages/nub/src/notify/{index,types,shim,sdk}.ts` — Notify NUB domain sources (4 files)
- `packages/nub/src/identity/{index,types,shim,sdk}.ts` — Identity NUB domain sources (4 files)
- `packages/nub/src/config/{index,types,shim,sdk}.ts` — Config NUB domain sources (4 files, side-effect-free barrel)
- `packages/nub/src/theme/{index,types}.ts` — Theme NUB domain sources (2 files — NO shim.ts, NO sdk.ts upstream)

### Modified (2)

- `packages/nub/package.json` — Dropped two phantom keys from `exports`: `./theme/shim` and `./theme/sdk`. Final count: 34 entries (9 barrels + 24 granular from 8 full NUBs + 1 granular `./theme/types` from the types-only theme NUB).
- `packages/nub/tsup.config.ts` — Dropped two phantom keys from `entry`: `'theme/shim'` and `'theme/sdk'`. Final count: 34 keys.

### Deleted (1)

- `packages/nub/src/.gitkeep` — Placeholder from Plan 117-01 removed now that real source populates src/.

## Decisions Made

- **Option A selected at checkpoint (34 entries, not 36).** The prior executor (Plan 117-02 first attempt) detected that packages/nubs/theme/src/ ships only index.ts + types.ts — no shim.ts, no sdk.ts — and paused with three options. User selected Option A: drop phantom ./theme/shim and ./theme/sdk entries. This matches reality, preserves Phase 117's "copy, no behavioral migration" boundary, and leaves theme shim/sdk extraction as deferred work.
- **Plan 117-01's exports map and tsup config were amended IN THE SAME COMMIT as the 34-file source copy.** Rationale: Plan 117-01's 36-entry assumption was based on the pre-audit model that theme would have all 4 files. Shipping a separate "amend exports" commit before the source copy would create a brief window where the package.json advertises exports that have no corresponding sources. Bundling the correction with the source copy keeps the exports map consistent at every commit boundary.
- **JSDoc `@napplet/nub-<domain>` strings left unchanged.** These are informational file docstrings, not import paths. Every actual import/export statement resolves to `@napplet/core` (or `json-schema` for config's JSONSchema7 type). Phase 120 owns the doc rewrite.

## Deviations from Plan

The plan's stated scope — "36 files across 9 domains" — was rewritten to "34 files across 9 domains (theme contributes 2, not 4)" based on the checkpoint decision. This is the only deviation.

### Auto-fixed Issues

**1. [Checkpoint Deviation] Theme NUB ships types-only today (no shim.ts, no sdk.ts)**
- **Found during:** Prior executor run of Task 1 (source discovery before copy)
- **Issue:** Plan 117-02 and Plan 117-01 both assumed every domain contributes 4 files (index, types, shim, sdk). `ls packages/nubs/theme/src/` returned only 2 files: index.ts, types.ts. Attempting to copy 4 theme files would fail; shipping the planned 36-entry exports map against a 34-file src/ tree would break the tsup build.
- **Fix:** Amended the copy loop to copy theme's 2 files and the other 8 domains' 4 files each (total 34). Amended package.json `exports` to drop `./theme/shim` + `./theme/sdk`. Amended tsup.config.ts `entry` to drop `'theme/shim'` + `'theme/sdk'`.
- **Files modified:** packages/nub/package.json, packages/nub/tsup.config.ts
- **Verification:** `node -e "const p=require('./packages/nub/package.json'); console.log(Object.keys(p.exports).length)"` prints 34. `grep -cE "^\s+'[a-z]+/[a-z]+':" packages/nub/tsup.config.ts` prints 34. `pnpm --filter @napplet/nub type-check` exits 0. `grep -E "theme/(shim|sdk)" packages/nub/package.json packages/nub/tsup.config.ts` returns nothing.
- **Committed in:** cf2ef93 (single atomic commit)
- **Decision authority:** User selected Option A at the checkpoint raised by the prior executor.

---

**Total deviations:** 1 (checkpoint-resolved — 34 entries instead of 36)
**Impact on plan:** Amendment matches upstream reality and preserves the "no behavioral migration" boundary Phase 117 was designed around. No scope creep. Theme shim/sdk extraction is deferred but not blocked — Phase 118 or later can ship them by adding 2 source files + 2 exports entries + 2 tsup keys when needed.

## Issues Encountered

None during this continuation pass. The prior executor's checkpoint on theme file count was resolved by the user's Option A decision; all post-decision execution was mechanical and verified.

## Verification

Every success criterion from the amended plan was checked:

1. **34 TS files under packages/nub/src/** — `find packages/nub/src -type f -name '*.ts' | wc -l` → 34. PASS.
2. **9 domain directories exist** — `ls packages/nub/src/` → config, identity, ifc, keys, media, notify, relay, storage, theme. PASS.
3. **Theme has exactly 2 files** — `ls packages/nub/src/theme/` → index.ts, types.ts. PASS.
4. **Each of the 8 full domains has exactly 4 files** — `ls packages/nub/src/<domain>/` → index.ts, sdk.ts, shim.ts, types.ts for each of {config, identity, ifc, keys, media, notify, relay, storage}. PASS.
5. **Byte-equality with upstream** — `diff -q packages/nubs/<domain>/src/<file>.ts packages/nub/src/<domain>/<file>.ts` for all 34 pairs → zero mismatches. PASS.
6. **registerNub asymmetry preserved** — 8 of 9 barrels contain `registerNub(DOMAIN`: identity, ifc, keys, media, notify, relay, storage, theme. Config does NOT contain `registerNub`. PASS.
7. **exports map = 34 entries, no phantom theme, no root `.`** — `node -e "const p=require('./packages/nub/package.json'); const n=Object.keys(p.exports).length; console.log(n, './theme/shim' in p.exports, './theme/sdk' in p.exports, '.' in p.exports)"` → `34 false false false`. PASS.
8. **tsup entry = 34 keys, no phantom theme** — entry key count = 34; `grep -E "theme/(shim|sdk)" packages/nub/tsup.config.ts` returns nothing. PASS.
9. **Type-check passes** — `pnpm --filter @napplet/nub type-check` → exit 0. PASS.
10. **packages/nubs/ untouched** — `git diff --stat packages/nubs/` → empty. PASS.
11. **No actual cross-NUB imports** — `grep -rE "^\s*(import|export).*from\s+['\"]@napplet/nub-" packages/nub/src/` → empty. All runtime imports go to `@napplet/core` or `json-schema`. PASS. (JSDoc docstring mentions are informational and preserved verbatim per the byte-identical copy rule — Phase 120 handles doc rewrites.)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for 117-03:** `pnpm --filter @napplet/nub build` will now find 34 real source files at the 34 paths the tsup entry object expects. The exports map has 34 matching entries pointing at the dist/ paths tsup will produce.
- **Amended expected dist/ shape for Plan 117-03:** 34 `.js` files + 34 `.d.ts` files under dist/, organized as 8 full domains × 4 files + 1 types-only domain × 2 files.
- **No blockers.** The prior "36 vs 34 file mismatch between plan and upstream reality" is resolved; config/tsup/sources are now consistent.
- **Phase 118 note:** Theme's future shim.ts + sdk.ts will need to be ADDED (not extracted from central shim/sdk) since no upstream source exists yet. Other 8 domains can convert in place.

## Self-Check

- packages/nub/src/ (directory, 34 .ts files): FOUND
- packages/nub/src/relay/index.ts: FOUND (byte-identical to packages/nubs/relay/src/index.ts)
- packages/nub/src/relay/types.ts: FOUND
- packages/nub/src/relay/shim.ts: FOUND
- packages/nub/src/relay/sdk.ts: FOUND
- packages/nub/src/storage/index.ts: FOUND
- packages/nub/src/storage/types.ts: FOUND
- packages/nub/src/storage/shim.ts: FOUND
- packages/nub/src/storage/sdk.ts: FOUND
- packages/nub/src/ifc/index.ts: FOUND
- packages/nub/src/ifc/types.ts: FOUND
- packages/nub/src/ifc/shim.ts: FOUND
- packages/nub/src/ifc/sdk.ts: FOUND
- packages/nub/src/keys/index.ts: FOUND
- packages/nub/src/keys/types.ts: FOUND
- packages/nub/src/keys/shim.ts: FOUND
- packages/nub/src/keys/sdk.ts: FOUND
- packages/nub/src/theme/index.ts: FOUND
- packages/nub/src/theme/types.ts: FOUND
- packages/nub/src/theme/shim.ts: CORRECTLY ABSENT (types-only NUB)
- packages/nub/src/theme/sdk.ts: CORRECTLY ABSENT (types-only NUB)
- packages/nub/src/media/index.ts: FOUND
- packages/nub/src/media/types.ts: FOUND
- packages/nub/src/media/shim.ts: FOUND
- packages/nub/src/media/sdk.ts: FOUND
- packages/nub/src/notify/index.ts: FOUND
- packages/nub/src/notify/types.ts: FOUND
- packages/nub/src/notify/shim.ts: FOUND
- packages/nub/src/notify/sdk.ts: FOUND
- packages/nub/src/identity/index.ts: FOUND
- packages/nub/src/identity/types.ts: FOUND
- packages/nub/src/identity/shim.ts: FOUND
- packages/nub/src/identity/sdk.ts: FOUND
- packages/nub/src/config/index.ts: FOUND (side-effect-free, no registerNub call)
- packages/nub/src/config/types.ts: FOUND
- packages/nub/src/config/shim.ts: FOUND
- packages/nub/src/config/sdk.ts: FOUND
- packages/nub/src/.gitkeep: CORRECTLY ABSENT (removed)
- Commit cf2ef93: FOUND
- exports count: 34 (expected 34)
- tsup entry count: 34 (expected 34)
- Phantom ./theme/shim or ./theme/sdk in package.json: CORRECTLY ABSENT
- Phantom theme/shim or theme/sdk in tsup.config.ts: CORRECTLY ABSENT
- Root `.` entry in exports: CORRECTLY ABSENT (EXP-04 preserved)
- `pnpm --filter @napplet/nub type-check`: PASS (exit 0)
- packages/nubs/ git diff: EMPTY (untouched)

## Self-Check: PASSED

---
*Phase: 117-napplet-nub-package-foundation*
*Completed: 2026-04-19*
