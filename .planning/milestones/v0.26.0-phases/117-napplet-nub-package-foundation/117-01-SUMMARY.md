---
phase: 117-napplet-nub-package-foundation
plan: 01
subsystem: infra
tags: [packaging, pnpm, tsup, typescript, exports-map, esm, monorepo, workspace]

# Dependency graph
requires: []
provides:
  - packages/nub/ directory with scaffold files (package.json, tsconfig.json, tsup.config.ts, src/.gitkeep)
  - 36-entry exports map (9 barrels + 27 granular per 9 NUB domains) with no root '.' entry
  - tsup configuration enumerating all 36 build entry points keyed <domain>/<file>
  - @napplet/nub@0.2.1 registered as 15th pnpm workspace package
affects:
  - 117-02 (source copy into packages/nub/src/<domain>/)
  - 117-03 (first build of @napplet/nub via tsup)
  - 118 (re-export shim migration of @napplet/nub-*)
  - 119 (flip @napplet/shim and @napplet/sdk to import from @napplet/nub)
  - 120 (documentation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Subpath exports map with 9 barrels + 27 granular entries keyed by (domain, surface) where domain in {relay,storage,ifc,keys,theme,media,notify,identity,config} and surface in {index,types,shim,sdk}"
    - "No root '.' export — consumers MUST use domain subpath (EXP-04)"
    - "Paired types + import conditions on every exports entry"
    - "tsup entry object mirroring exports map keys, one JS + one .d.ts per entry"
    - "Optional peerDependency declared via peerDependenciesMeta.<name>.optional = true (no pnpm warning for consumers missing json-schema-to-ts)"

key-files:
  created:
    - packages/nub/package.json
    - packages/nub/tsconfig.json
    - packages/nub/tsup.config.ts
    - packages/nub/src/.gitkeep
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "EXP-04 enforced by omission: no '.' key in exports, and no top-level main/module/types fields that would imply a root entry point"
  - "tsconfig extends path is '../../tsconfig.json' (2 levels up) — this package sits at packages/nub/, not packages/nubs/<domain>/ (3 levels)"
  - "@napplet/core is the sole runtime dependency; json-schema-to-ts is optional peerDep carrying peerDependenciesMeta.<name>.optional: true"
  - "sideEffects: false at the package root — bundlers drop unused subpath entries wholesale; per-entry registerNub side effects still fire only when their entry is imported"
  - "No source files written this plan — src/ only contains .gitkeep; Plan 02 populates per-domain sources, Plan 03 runs the first build"

patterns-established:
  - "Subpath-only package resolution: 9 barrels (./{domain}) + 27 granular (./{domain}/{types,shim,sdk}), no root import"
  - "tsup multi-entry-object pattern for packages with many subpath exports, each entry producing dist/<domain>/<file>.{js,d.ts}"

requirements-completed:
  - PKG-02
  - PKG-03
  - EXP-01
  - EXP-02
  - EXP-03
  - EXP-04

# Metrics
duration: 1 min
completed: 2026-04-19
---

# Phase 117 Plan 01: @napplet/nub Package Foundation Summary

**Scaffolded @napplet/nub package at packages/nub/ with a 36-entry subpath exports map (9 barrels + 27 granular), matching tsup entry object, and no root '.' export — zero source code, zero build yet.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-19T12:41:55Z
- **Completed:** 2026-04-19T12:43:52Z
- **Tasks:** 1
- **Files created:** 4 (packages/nub/package.json, tsconfig.json, tsup.config.ts, src/.gitkeep)
- **Files modified:** 1 (pnpm-lock.yaml)

## Accomplishments

- New workspace package @napplet/nub@0.2.1 exists and is recognized by pnpm (15th workspace project, up from 14)
- package.json carries the full 36-entry exports map (9 × 4 = 36) with NO root '.' entry, enforcing EXP-04 by omission + absence of top-level main/module/types fields
- Every exports entry pairs "types" + "import" conditions against dist/<domain>/<file>.d.ts and dist/<domain>/<file>.js
- tsup.config.ts has an `entry` object of 36 keys (`<domain>/<file>` → `src/<domain>/<file>.ts`) in the canonical domain order (relay, storage, ifc, keys, theme, media, notify, identity, config) × (index, types, shim, sdk)
- @napplet/core declared as the sole runtime dep (workspace:*); json-schema-to-ts declared as an **optional** peerDependency via peerDependenciesMeta
- sideEffects: false set at the package root
- tsconfig.json extends `../../tsconfig.json` (two levels up from packages/nub/ to the repo root) — deliberately distinct from the three-level path used by packages/nubs/<domain>/
- src/ directory tracked via empty .gitkeep; contains zero source files or subdirectories (Plan 02's scope is untouched)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold packages/nub/ with package.json + tsconfig.json + tsup.config.ts + empty src/** — `e3867ae` (feat)

## Files Created/Modified

- `packages/nub/package.json` — Full metadata, @napplet/core workspace dep, optional json-schema-to-ts peerDep, 36-entry exports map, sideEffects:false
- `packages/nub/tsconfig.json` — Extends ../../tsconfig.json with outDir:dist / rootDir:src / lib:[ES2022,DOM,DOM.Iterable]
- `packages/nub/tsup.config.ts` — defineConfig with entry object of 36 keys, format:['esm'], dts:true, sourcemap:true, clean:true
- `packages/nub/src/.gitkeep` — Empty placeholder keeping src/ tracked
- `pnpm-lock.yaml` — Regenerated to register packages/nub importer with its deps/devDeps/peerDeps

## Decisions Made

- **EXP-04 enforcement strategy:** Omit the '.' key entirely AND omit top-level `main`/`module`/`types` fields. Any of those top-level fields would imply a root entry point; removing all four surfaces makes a root import unresolvable by design, not by accident.
- **tsconfig extends depth:** Two levels up (`../../tsconfig.json`) because packages/nub/ sits directly under packages/, unlike packages/nubs/<domain>/ which is three deep.
- **sideEffects:false at root + side-effecting entries:** Bundlers that respect sideEffects:false drop unused subpath entries wholesale. The per-entry `registerNub(...)` side effects still fire only for entries the consumer actually imports — matching the posture already shipped by the existing @napplet/nub-* packages.
- **No source files this plan:** Plan 117-01 is metadata-only. Source copy is Plan 117-02, build is Plan 117-03. src/ is tracked via a zero-byte .gitkeep.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for 117-02:** Source copy from packages/nubs/<domain>/src/* into packages/nub/src/<domain>/* for all 9 domains. tsup entry map already expects those exact paths; no further config work needed before the copy.
- **Plan 117-03** will exercise `pnpm --filter @napplet/nub build`; the exports map is authored to match the exact dist layout tsup will produce.
- **No blockers.** Any missing source file at build time will surface as a tsup entry-not-found error and be caught in Plan 03.

## Self-Check

- packages/nub/package.json: FOUND
- packages/nub/tsconfig.json: FOUND
- packages/nub/tsup.config.ts: FOUND
- packages/nub/src/.gitkeep: FOUND
- Commit e3867ae: FOUND
- Exports count: 36 (expected 36)
- Root '.' entry present: false (EXP-04 satisfied)
- pnpm workspace recognizes @napplet/nub@0.2.1: YES

## Self-Check: PASSED

---
*Phase: 117-napplet-nub-package-foundation*
*Completed: 2026-04-19*
