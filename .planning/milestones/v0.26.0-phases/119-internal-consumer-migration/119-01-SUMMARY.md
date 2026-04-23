---
phase: 119-internal-consumer-migration
plan: 01
subsystem: infra
tags: [pnpm, tsup, monorepo, esm, subpath-exports, import-path-migration]

# Dependency graph
requires:
  - phase: 117-napplet-nub-package-foundation
    provides: "@napplet/nub canonical package with 34-entry exports map (9 barrels + 9 types + 8 shim + 8 sdk)"
  - phase: 118-deprecation-re-export-shims
    provides: "9 @napplet/nub-<domain> packages as 1-line re-export shims forwarding to @napplet/nub/<domain>; deprecation metadata in place"
provides:
  - "packages/shim/src/index.ts imports installers + handlers from @napplet/nub/<domain>/shim for all 8 shim-bearing domains"
  - "packages/shim/src/index.ts imports IfcEventMessage from @napplet/nub/ifc/types"
  - "packages/sdk/src/index.ts re-exports types + DOMAIN constants + installers + bare-name helpers from @napplet/nub/<domain> barrels for all 9 domains"
  - "Zero @napplet/nub-<domain> import specifiers in packages/shim/src/ or packages/sdk/src/"
  - "@napplet/nub: workspace:* added to shim and sdk package.json deps (alongside legacy @napplet/nub-* deps — Plan 02 drops those)"
affects:
  - 119-02-internal-consumer-migration-dep-swap
  - 120-documentation-migration

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shim uses granular /shim subpaths (@napplet/nub/<domain>/shim) — narrow dependency graph, no types/sdk pulled in"
    - "SDK uses barrels (@napplet/nub/<domain>) — aggregation fits existing export * as <domain> pattern"
    - "Type-only imports route to /types subpath (IfcEventMessage → @napplet/nub/ifc/types)"
    - "Theme exception: barrel-only per Option A (no /shim or /sdk subpaths exist)"

key-files:
  created: []
  modified:
    - packages/shim/src/index.ts
    - packages/shim/package.json
    - packages/sdk/src/index.ts
    - packages/sdk/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Rule 3 auto-fix: added @napplet/nub: workspace:* as additive dep to shim + sdk package.json so TypeScript (bundler resolution) can resolve the new @napplet/nub/* subpaths. Plan 02 drops the 9 legacy @napplet/nub-* deps."
  - "Shim migration path: @napplet/nub-<domain> → @napplet/nub/<domain>/shim (8 domains: keys, media, notify, storage, relay, identity, ifc, config). IfcEventMessage type-only import → @napplet/nub/ifc/types."
  - "SDK migration path: @napplet/nub-<domain> → @napplet/nub/<domain> barrel (all 9 domains including theme). Barrel surface includes types + DOMAIN + installer + SDK helpers."
  - "Theme stays on barrel: no /shim or /sdk subpath exists per Phase 117 Option A."
  - "Runtime namespace objects in sdk (relay, ipc, storage, media, notify, keys, identity, config) and shim routing logic (handleEnvelopeMessage, installXxxShim calls, window.napplet assignment) byte-identical — only module specifier strings changed."

patterns-established:
  - "Pattern: Pure import-path refactor within granular subpath export map — no behavior, no identifier, no API surface change"
  - "Pattern: Additive dep addition to unblock TypeScript resolution; legacy deps retained for deprecation safety-net; cleanup in follow-up plan"

requirements-completed:
  - CONS-01
  - CONS-02
  - CONS-03

# Metrics
duration: 3min
completed: 2026-04-19
---

# Phase 119 Plan 01: Internal Consumer Migration (Shim + SDK Source) Summary

**Migrated every `@napplet/nub-<domain>` import specifier in `packages/shim/src/index.ts` and `packages/sdk/src/index.ts` to the canonical `@napplet/nub/<domain>*` subpaths — 9 specifiers in shim (8 via `/shim`, 1 via `/types`), 35+ specifiers across 5 re-export blocks in sdk (all via barrel); build + type-check green, runtime namespaces byte-identical.**

## Performance

- **Duration:** ~3 min (162 seconds)
- **Started:** 2026-04-19T14:08:43Z
- **Completed:** 2026-04-19T14:11:25Z
- **Tasks:** 2
- **Files modified:** 5 (2 src, 2 package.json, 1 lockfile)

## Accomplishments

- `packages/shim/src/index.ts` — 9 import specifiers re-pointed at `@napplet/nub/<domain>/shim` (8) + `@napplet/nub/ifc/types` (1, type-only)
- `packages/sdk/src/index.ts` — every NUB re-export (types, DOMAIN constants, installers, SDK helpers) + 2 JSDoc example imports migrated to `@napplet/nub/<domain>` barrels; all 9 domains covered, theme included via barrel-only per Option A
- `packages/shim/package.json` + `packages/sdk/package.json` — `@napplet/nub: workspace:*` added (additive; legacy `@napplet/nub-<domain>` deps retained for Plan 02 cleanup)
- Build + type-check green for both `@napplet/shim` and `@napplet/sdk` via canonical `@napplet/nub/*` subpath resolution (not via Phase 118 deprecation shims — those are still in the dep graph but no longer in the import graph for first-party consumers)
- Zero `@napplet/nub-<domain>` specifiers remain in first-party src under `packages/shim/src/` and `packages/sdk/src/`
- Zero changes to `packages/nub/` (canonical) or `packages/nubs/` (deprecated) — both trees untouched this plan

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate packages/shim/src/index.ts — 9 import specifiers to @napplet/nub/* subpaths** — `f58c994` (refactor)
2. **Task 2: Migrate packages/sdk/src/index.ts — every NUB re-export block + JSDoc examples to @napplet/nub/<domain> barrels** — `f2f2721` (refactor)

**Plan metadata:** pending final commit (SUMMARY + STATE + ROADMAP)

## Files Created/Modified

- `packages/shim/src/index.ts` — 9 NUB import lines re-pointed; runtime logic, `handleEnvelopeMessage` routing, `window.napplet` assignment, and `installXxxShim()` calls byte-identical
- `packages/shim/package.json` — added `"@napplet/nub": "workspace:*"` to dependencies (Rule 3 auto-fix; legacy `@napplet/nub-<domain>` entries retained)
- `packages/sdk/src/index.ts` — 9 domain type-export blocks, 9 DOMAIN constant re-exports, 8 installer re-exports, 7 bare-name SDK helper re-exports, and 2 JSDoc `@example` import paths migrated to `@napplet/nub/<domain>` barrels; runtime namespace objects (`relay`, `ipc`, `storage`, `media`, `notify`, `keys`, `identity`, `config`) byte-identical
- `packages/sdk/package.json` — added `"@napplet/nub": "workspace:*"` to dependencies (Rule 3 auto-fix; legacy entries retained)
- `pnpm-lock.yaml` — refreshed with `packages/shim → link:../nub` and `packages/sdk → link:../nub` edges

## Verification Counts Captured

**Shim (positive, each = 1):**
- `@napplet/nub/keys/shim` = 1
- `@napplet/nub/media/shim` = 1
- `@napplet/nub/notify/shim` = 1
- `@napplet/nub/storage/shim` = 1
- `@napplet/nub/relay/shim` = 1
- `@napplet/nub/identity/shim` = 1
- `@napplet/nub/ifc/shim` = 1
- `@napplet/nub/config/shim` = 1
- `@napplet/nub/ifc/types` = 1 (type-only `IfcEventMessage` — the single exception that routes to `/types` rather than `/shim`)

**Shim (negative):** `@napplet/nub-` = 0

**SDK (positive, per barrel — threshold in parens):**
- `@napplet/nub/relay` = 5 (>=4)
- `@napplet/nub/identity` = 4 (>=4)
- `@napplet/nub/storage` = 5 (>=4)
- `@napplet/nub/ifc` = 4 (>=4)
- `@napplet/nub/theme` = 2 (>=2; barrel only — see exception below)
- `@napplet/nub/keys` = 4 (>=4)
- `@napplet/nub/media` = 4 (>=4)
- `@napplet/nub/notify` = 4 (>=4)
- `@napplet/nub/config` = 3 (>=3)
- JSDoc `relaySubscribe` example = 1, `storageGetItem` example = 1

**SDK (negative):**
- `@napplet/nub-` = 0
- `@napplet/nub/theme/shim` = 0
- `@napplet/nub/theme/sdk` = 0

**Build gates (all exit 0):**
- `pnpm --filter @napplet/shim type-check` — PASS (zero diagnostics)
- `pnpm --filter @napplet/shim build` — PASS (ESM 7.88 KB, DTS 128 B)
- `pnpm --filter @napplet/sdk type-check` — PASS (zero diagnostics)
- `pnpm --filter @napplet/sdk build` — PASS (ESM 15.86 KB, DTS 22.72 KB)

**Plan-level negative gate:**
- `grep -rn "@napplet/nub-" packages/shim/src/ packages/sdk/src/` — 0 matches (exit 1, as expected)

**Deprecated + canonical packages untouched:**
- `git diff HEAD~2..HEAD -- packages/nubs/ packages/nub/` — empty (zero changes)
- 9 deprecated `packages/nubs/<domain>/src/index.ts` still start with `export * from '@napplet/nub/<domain>'`

## Exceptions Documented (per plan <output> requirement)

1. **Theme barrel-only exception** — `packages/sdk/src/index.ts:846-859` re-exports 11 theme types from `@napplet/nub/theme` (barrel). No `./theme/shim` or `./theme/sdk` subpath exists per Phase 117 Option A, so theme uniformly goes through the barrel — this lands correctly under the SDK's uniform barrel rule, but the negative grep `@napplet/nub/theme/shim` = 0 / `@napplet/nub/theme/sdk` = 0 explicitly confirms no drift.
2. **`IfcEventMessage` type-only exception** — `packages/shim/src/index.ts:49` imports `IfcEventMessage` from `@napplet/nub/ifc/types` rather than `@napplet/nub/ifc/shim`, because it's an `import type` and `/types` is the correct granular surface for type-only imports (the `/shim` subpath doesn't re-export message types — that's what `/types` is for).

## Decisions Made

- **Additive `@napplet/nub` dep (Rule 3 auto-fix):** The plan's "package.json dependencies left untouched this plan" contract could not be literally satisfied because the imports were migrated to `@napplet/nub/*` subpaths. TypeScript (`moduleResolution: "bundler"`) cannot resolve those subpaths without `@napplet/nub` in the dep graph. Phase 118's deprecation shims resolve the *old* `@napplet/nub-<domain>` specifiers (which we just deleted from the shim/sdk src), so they can't bridge this gap. The minimal fix is additive: keep all 9 legacy `@napplet/nub-<domain>` deps (still used by anyone pinned to them, unchanged), and add one new `@napplet/nub: workspace:*` edge. Plan 02 drops the 9 legacy deps — leaving only `@napplet/nub` + `@napplet/core`.
- **No behavioral change whatsoever:** The `window.napplet` shape, JSON envelope wire format, `handleEnvelopeMessage` routing, `installXxxShim()` invocation order, SDK runtime namespace objects — all byte-identical. This is a pure module-specifier refactor.
- **Shim `/shim` vs SDK barrel split:** per Phase 119 CONTEXT.md rationale — shim only needs installer + handlers (narrow graph, `/shim` path); SDK aggregates types + DOMAIN + installer + helpers (barrel fits existing pattern).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `@napplet/nub: workspace:*` to shim + sdk package.json deps**
- **Found during:** Task 1 (initial `pnpm --filter @napplet/shim type-check` run after import edit)
- **Issue:** The plan stated "package.json dependency lists are intentionally left untouched this plan — Phase 118's deprecated re-export shims still resolve the old names, so the build stays green." However, Phase 118's shims resolve `@napplet/nub-<domain>` specifiers, not `@napplet/nub/<domain>` subpaths. Since Task 1 migrated specifiers to `@napplet/nub/*`, neither `packages/shim` nor `packages/sdk` could resolve the canonical package — TypeScript raised `TS2307: Cannot find module '@napplet/nub/keys/shim'` on every new import. The plan's own explicit verification gate (`pnpm --filter @napplet/shim type-check && build`) was therefore unachievable under a literal reading of the untouched-deps constraint.
- **Fix:** Added `"@napplet/nub": "workspace:*"` to `dependencies` in both `packages/shim/package.json` and `packages/sdk/package.json` as an *additive* change. All 9 legacy `@napplet/nub-<domain>` entries retained — they're still valid workspace deps and provide the Phase 118 deprecation safety-net for anyone else still importing them. Plan 02's job (per CONTEXT.md: "replace all 8/9 `@napplet/nub-<domain>` entries with a single `@napplet/nub: workspace:*`") becomes: *drop* the 9 legacy entries. The end state Plan 02 targets is preserved.
- **Files modified:** `packages/shim/package.json`, `packages/sdk/package.json`, `pnpm-lock.yaml` (auto-updated by `pnpm install`)
- **Verification:** `pnpm --filter @napplet/shim type-check`, `pnpm --filter @napplet/shim build`, `pnpm --filter @napplet/sdk type-check`, `pnpm --filter @napplet/sdk build` — all four exit 0 after the fix
- **Committed in:** `f58c994` (shim package.json + lockfile) and `f2f2721` (sdk package.json + lockfile delta)

---

**Total deviations:** 1 auto-fixed (Rule 3 - Blocking)
**Impact on plan:** Fix was essential — without it, the plan's explicit verification gates could not pass. Additive nature preserves Plan 02's scope (Plan 02 now only needs to *remove* 9 legacy deps, not replace 9 with 1; the `@napplet/nub` edge is already in place). Zero scope creep: did not touch the 9 legacy deps, did not touch `packages/nubs/` or `packages/nub/`, did not run `pnpm -r build` (deferred to Plan 02 per plan boundary).

## Issues Encountered

None beyond the Rule 3 auto-fix documented above.

## Next Phase Readiness

**Plan 02 (119-02) unblocked:** The canonical `@napplet/nub` workspace edge is now wired into both consumer packages. Plan 02's remaining work:
- Drop the 9 `@napplet/nub-<domain>: workspace:*` entries from `packages/shim/package.json` (8) and `packages/sdk/package.json` (9)
- Run `pnpm install` to prune the dead edges from the lockfile
- Run `pnpm -r build` and `pnpm -r type-check` as the monorepo-wide green gate

**No blockers.** The deprecated packages under `packages/nubs/` continue to resolve through their own Phase 118 shims for any external consumers pinned to the old names.

## Self-Check: PASSED

- [x] `packages/shim/src/index.ts` — exists, contains `@napplet/nub/keys/shim` and 8 other new specifiers (verified via grep counts above)
- [x] `packages/sdk/src/index.ts` — exists, contains `@napplet/nub/relay` barrel among 8 others (verified via grep counts above)
- [x] Commit `f58c994` — FOUND in `git log --oneline`
- [x] Commit `f2f2721` — FOUND in `git log --oneline`
- [x] All 4 build/type-check gates exit 0
- [x] Zero `@napplet/nub-` in first-party src; zero theme/shim or theme/sdk in sdk
- [x] `packages/nubs/` and `packages/nub/` untouched (`git diff HEAD~2..HEAD` of those paths is empty)

---
*Phase: 119-internal-consumer-migration*
*Completed: 2026-04-19*
