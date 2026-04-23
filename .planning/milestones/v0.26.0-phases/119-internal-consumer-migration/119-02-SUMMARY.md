---
phase: 119-internal-consumer-migration
plan: 02
subsystem: infra
tags: [pnpm, workspace, monorepo, dep-graph, lockfile, turbo, dist-verification]

# Dependency graph
requires:
  - phase: 117-napplet-nub-package-foundation
    provides: "@napplet/nub canonical package with 34-entry exports map (9 barrels + 9 types + 8 shim + 8 sdk)"
  - phase: 118-deprecation-re-export-shims
    provides: "9 @napplet/nub-<domain> packages as 1-line re-export shims forwarding to @napplet/nub/<domain>"
  - phase: 119-internal-consumer-migration (plan 01)
    provides: "shim + sdk src re-pointed at @napplet/nub/<domain>* subpaths; @napplet/nub workspace edge already added alongside legacy entries"
provides:
  - "packages/shim/package.json dependencies = {@napplet/core, @napplet/nub} — exactly 2 entries"
  - "packages/sdk/package.json dependencies = {@napplet/core, @napplet/nub} — exactly 2 entries"
  - "pnpm-lock.yaml importer edges: packages/shim + packages/sdk reference link:../core and link:../nub only (0 legacy @napplet/nub-<domain> edges)"
  - "pnpm -r build exits 0 across all 14 workspace packages with emitted dist unchanged from HEAD"
  - "pnpm -r type-check exits 0 across all 14 workspace packages"
  - "packages/shim/dist/index.js references 8 distinct @napplet/nub/<domain>/shim subpaths (1 each) and 0 @napplet/nub- specifiers"
  - "packages/sdk/dist/index.js references all 9 @napplet/nub/<domain> barrels and 0 @napplet/nub- specifiers"
  - "packages/nub/ (canonical) and packages/nubs/ (deprecated) source/metadata trees untouched (empty git diff)"
affects:
  - 120-documentation-migration

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Monorepo dep-shape invariant: internal consumers (@napplet/shim, @napplet/sdk) depend only on {@napplet/core, @napplet/nub}; deprecated @napplet/nub-<domain> packages are never transitively required by first-party code"
    - "Emit-level verification: grep dist/index.js for negative (legacy) and positive (canonical subpath) specifiers as the ground truth that bundler consumers resolve the new paths"
    - "Untouched-tree invariant: consumer migrations must leave packages/nub/ and packages/nubs/ with zero source/metadata diffs"

key-files:
  created:
    - .planning/phases/119-internal-consumer-migration/119-02-SUMMARY.md
  modified:
    - packages/shim/package.json
    - packages/sdk/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Plan-01 auto-fix already added @napplet/nub: workspace:* to both shim + sdk package.json deps. This plan's scope reduces to pure deletion of the 8 + 9 legacy @napplet/nub-<domain> entries — the plan-as-written's 'add @napplet/nub' action was a documented no-op."
  - "Zero non-dep fields changed in either package.json file: name, version, description, type, main, module, types, exports, files, sideEffects, publishConfig, devDependencies, scripts, license, repository, keywords remain byte-identical."
  - "No changeset created for this plan (internal refactor; consumer-facing packages are @napplet/shim + @napplet/sdk but their deps are workspace:* internal edges — no external semver-relevant surface changed)."

patterns-established:
  - "Pattern: consumer manifest slim-down after source migration — Plan 01 migrates source, Plan 02 prunes the now-dead legacy deps in a single atomic commit"
  - "Pattern: verify emit-level specifiers in dist/index.js, not just package.json + src — catches bundler-level specifier leakage that a source/manifest-only check would miss"

requirements-completed:
  - CONS-01
  - CONS-02
  - CONS-03

# Metrics
duration: 3 min
completed: 2026-04-19
---

# Phase 119 Plan 02: Internal Consumer Migration (Dep-Swap) Summary

**Dropped the 8 legacy `@napplet/nub-<domain>: workspace:*` entries from `packages/shim/package.json` and the 9 from `packages/sdk/package.json`, refreshed the lockfile, and proved the monorepo still builds + type-checks green with shim/sdk dist emitting canonical `@napplet/nub/<domain>*` subpaths and zero legacy `@napplet/nub-` references.**

## Performance

- **Duration:** ~3 min (176 seconds)
- **Started:** 2026-04-19T14:15:19Z
- **Completed:** 2026-04-19T14:18:15Z
- **Tasks:** 2 (1 write, 1 verification-only)
- **Files modified:** 3 (2 package.json, 1 lockfile)
- **Commits:** 1 task commit (8f83e14) + 1 metadata commit (this plan's final step)

## Accomplishments

- `packages/shim/package.json` dependencies: 10 → 2 entries (removed 8 `@napplet/nub-<domain>` legacy deps — `relay`, `identity`, `storage`, `ifc`, `keys`, `media`, `notify`, `config`).
- `packages/sdk/package.json` dependencies: 11 → 2 entries (removed 9 `@napplet/nub-<domain>` legacy deps — `relay`, `identity`, `storage`, `ifc`, `theme`, `keys`, `media`, `notify`, `config`).
- Final dep shape for BOTH packages: `{@napplet/core: workspace:*, @napplet/nub: workspace:*}` (2 entries, alphabetically sorted first by scope then by name).
- `pnpm-lock.yaml` refreshed: `packages/shim` and `packages/sdk` importer stanzas now reference `link:../core` and `link:../nub` only — zero `@napplet/nub-<domain>` importer edges for those two importers.
- `pnpm -r build` exits 0 across all 14 workspace packages (1 root workspace + 4 core packages + @napplet/nub + 9 deprecated @napplet/nub-<domain>).
- `pnpm -r type-check` exits 0 across all 14 workspace packages.
- `packages/shim/dist/index.js` emits canonical subpaths: 8 distinct `@napplet/nub/<domain>/shim` references (1 each for `keys`, `media`, `notify`, `storage`, `relay`, `identity`, `ifc`, `config`), 0 `@napplet/nub-` references, 0 `/types` references (the single `IfcEventMessage` type-only import from Plan 01 is erased at build time as expected).
- `packages/sdk/dist/index.js` emits all 9 `@napplet/nub/<domain>` barrel references (`relay`, `identity`, `storage`, `ifc`, `theme`, `keys`, `media`, `notify`, `config`), 0 `@napplet/nub-` references, 0 `theme/shim` or `theme/sdk` (Option A barrel-only for theme honored).
- `packages/nub/` (canonical @napplet/nub) and `packages/nubs/<domain>/` (9 deprecated shims) source + metadata trees untouched — `git diff` returns zero changes.
- `dist/` is gitignored repo-wide; `git status` is clean post-build (turbo cache + identical inputs yield identical outputs).

## Dep-Count Before → After

| File                            | Before | After | Removed |
| ------------------------------- | ------ | ----- | ------- |
| packages/shim/package.json      | 10     | 2     | 8       |
| packages/sdk/package.json       | 11     | 2     | 9       |

(Pre-119-01 counts were 9 and 10 respectively; 119-01 added `@napplet/nub` to each, bringing them to 10 and 11. This plan removed the 8/9 legacy entries, landing at 2 each.)

## Task Commits

Each task was committed atomically:

1. **Task 1: Drop legacy @napplet/nub-<domain> deps from shim + sdk + refresh lockfile** — `8f83e14` (chore)
2. **Task 2: Monorepo build + type-check + dist artifact verification** — verification-only, no source changes, no commit

**Plan metadata:** pending final commit (SUMMARY + STATE + ROADMAP + REQUIREMENTS)

## Files Created/Modified

- `packages/shim/package.json` — removed 8 `@napplet/nub-<domain>: workspace:*` lines from the `dependencies` block. All other top-level fields (name, version, description, type, main, module, types, exports, files, sideEffects, publishConfig, devDependencies, scripts, license, repository, keywords) byte-identical to pre-phase state. Final `dependencies` = `{@napplet/core, @napplet/nub}`.
- `packages/sdk/package.json` — removed 9 `@napplet/nub-<domain>: workspace:*` lines from the `dependencies` block. All other top-level fields byte-identical. Final `dependencies` = `{@napplet/core, @napplet/nub}`.
- `pnpm-lock.yaml` — auto-refreshed by `pnpm install` (fast path — no resolution needed, just edge updates). `packages/shim` importer stanza now has `@napplet/core → link:../core` + `@napplet/nub → link:../nub` as its two dep edges. `packages/sdk` importer stanza identical shape. Both importers lost 8/9 `@napplet/nub-<domain>` edges respectively.

## Verification Counts Captured

**package.json manifest gates:**
- `grep -c "@napplet/nub-" packages/shim/package.json` = 0
- `grep -c "@napplet/nub-" packages/sdk/package.json` = 0
- `Object.keys(shim.dependencies).length` = 2
- `Object.keys(sdk.dependencies).length` = 2
- `Object.keys(shim.dependencies).sort().join(',')` = `@napplet/core,@napplet/nub`
- `Object.keys(sdk.dependencies).sort().join(',')`  = `@napplet/core,@napplet/nub`

**pnpm-lock.yaml importer gates:**
- `packages/shim` stanza contains `'@napplet/nub':` with `link:../nub` — OK
- `packages/sdk`  stanza contains `'@napplet/nub':` with `link:../nub` — OK
- `grep -E "^  (packages/shim|packages/sdk):" -A 20 pnpm-lock.yaml | grep -c "@napplet/nub-"` = 0

**Build + type-check gates (all exit 0):**
- `pnpm -r build` — PASS (14 workspace projects, turbo-parallelized)
- `pnpm -r type-check` — PASS (14 workspace projects)

**Per-package build wall-clock (from turbo streamed output):**

| Package                      | ESM       | DTS         |
| ---------------------------- | --------- | ----------- |
| @napplet/core                | 7 ms      | 300 ms      |
| @napplet/vite-plugin         | 7 ms      | 574 ms      |
| @napplet/nub (canonical)     | 23 ms     | 2092 ms     |
| @napplet/nub-config          | 8 ms      | 480 ms      |
| @napplet/nub-identity        | 9 ms      | 468 ms      |
| @napplet/nub-ifc             | 6 ms      | 450 ms      |
| @napplet/nub-keys            | 7 ms      | 455 ms      |
| @napplet/nub-media           | 6 ms      | 480 ms      |
| @napplet/nub-notify          | 6 ms      | 485 ms      |
| @napplet/nub-relay           | 7 ms      | 514 ms      |
| @napplet/nub-storage         | 6 ms      | 497 ms      |
| @napplet/nub-theme           | 8 ms      | 445 ms      |
| @napplet/shim                | 9 ms      | 552 ms      |
| @napplet/sdk                 | 10 ms     | 595 ms      |

**Turbo cache observation:** No cache hit — this was a fresh full build (plan's Task 1 invalidated the shim + sdk + lockfile inputs). Dist outputs bytewise-identical to the pre-build tracked state (which is gitignored anyway), so `git status` is empty post-build.

**Emit-level gates:**

Shim dist (positive — 8 distinct /shim subpaths, 1 each):
- `@napplet/nub/keys/shim` = 1
- `@napplet/nub/media/shim` = 1
- `@napplet/nub/notify/shim` = 1
- `@napplet/nub/storage/shim` = 1
- `@napplet/nub/relay/shim` = 1
- `@napplet/nub/identity/shim` = 1
- `@napplet/nub/ifc/shim` = 1
- `@napplet/nub/config/shim` = 1

Shim dist (negative):
- `@napplet/nub-` = 0
- All 9 `/types` subpaths = 0 (`IfcEventMessage` type-only import is TypeScript-erased at tsup ESM emit — expected and correct)

SDK dist (positive, double-quoted specifier counts per domain):
- `@napplet/nub/relay` = 3
- `@napplet/nub/identity` = 3
- `@napplet/nub/storage` = 3
- `@napplet/nub/ifc` = 3
- `@napplet/nub/theme` = 1 (barrel-only per Option A — no installer, no SDK helpers re-exported)
- `@napplet/nub/keys` = 3
- `@napplet/nub/media` = 3
- `@napplet/nub/notify` = 3
- `@napplet/nub/config` = 2

SDK dist (negative):
- `@napplet/nub-` = 0
- `@napplet/nub/theme/shim` = 0
- `@napplet/nub/theme/sdk` = 0

**Untouched-tree gates:**
- `git diff --stat packages/nub/{package.json,src/,tsconfig.json,tsup.config.ts}` — empty
- `git diff --stat -- packages/nubs/**/*.json packages/nubs/**/*.ts packages/nubs/**/*.md` — empty
- Post-build `git status --short` — empty (only tracked mods were the 3 intended files; dist/ is gitignored)

**Source-level gate (Plan 01 holds):**
- `grep -rn "@napplet/nub-" packages/shim/src/ packages/sdk/src/` — 0 matches

## Decisions Made

- **Plan scope reduced vs. as-written:** The PLAN.md "BEFORE" blocks assumed the 8 (shim) / 9 (sdk) legacy `@napplet/nub-<domain>` deps plus `@napplet/core` (no `@napplet/nub`). Reality per the 119-01 Rule-3 auto-fix: `@napplet/nub` was already present in both files. The plan's action step listed "add @napplet/nub + remove legacy" — the "add" was a no-op (already there); scope collapsed to pure deletion. The end state matches the plan's AFTER block byte-for-byte.
- **No changeset:** This is a pure internal refactor — `@napplet/shim` and `@napplet/sdk` consumers pull prebuilt dist from npm and never see `workspace:*` specifiers. The deprecated `@napplet/nub-<domain>` packages remain published and functional (Phase 118 shims unchanged), so external consumers pinned to old names still resolve. The next `pnpm version-packages` run picks up Phase 118's existing deprecation changeset.
- **No non-dep field touched:** Per the plan's explicit non-negotiables, description / exports / scripts / license / repository / keywords / sideEffects / publishConfig / devDependencies were left byte-identical. Version stayed at 0.2.1 (release-time bumping via changesets is a separate concern).

## Deviations from Plan

None — plan executed exactly as written once the 119-01 auto-fix context (from the orchestrator's `<important_context>` block) was factored in. The "add `@napplet/nub`" step of the plan was a documented no-op; all other actions matched the plan body verbatim.

## Issues Encountered

None.

## Next Phase Readiness

**Phase 119 complete.** Consumer migration closed end-to-end: source (Plan 01), manifest + lockfile + build emit (Plan 02). Hand-off to Phase 120 (documentation migration) in a cleanly-building state.

**CONS-01, CONS-02, CONS-03 all satisfied:**
- CONS-01 (shim uses `/shim` subpaths for 8 domains + inline theme) — closed: shim dist has 8 `@napplet/nub/<domain>/shim` refs, zero legacy refs.
- CONS-02 (sdk uses `@napplet/nub/<domain>` barrels for all 9 domains) — closed: sdk dist has all 9 barrel refs, zero legacy refs.
- CONS-03 (no in-repo demo/test consumers to migrate) — trivially closed: no demo or test directories exist at the repo top level.

**No blockers.** The deprecated packages at `packages/nubs/<domain>/` (@napplet/nub-*) continue to function as transparent re-export shims for any external consumer pinned to the old names — Phase 120 will document the migration path and Phase 121+ can consider removal.

## Self-Check: PASSED

- [x] `packages/shim/package.json` — exists; dependencies = `{@napplet/core, @napplet/nub}` (2 entries); no `@napplet/nub-` substring anywhere in file.
- [x] `packages/sdk/package.json` — exists; dependencies = `{@napplet/core, @napplet/nub}` (2 entries); no `@napplet/nub-` substring.
- [x] `pnpm-lock.yaml` — shim + sdk importer stanzas each reference `link:../core` + `link:../nub` only; 0 `@napplet/nub-` edges in the shim+sdk importer blocks.
- [x] Commit `8f83e14` (chore: drop legacy deps) — FOUND in `git log --oneline` (verified just prior to this SUMMARY write).
- [x] `pnpm -r build` exited 0 (log: /tmp/119-02-build.log, 360 lines, ends with `packages/sdk build: Done`).
- [x] `pnpm -r type-check` exited 0 (log: /tmp/119-02-typecheck.log, terminal line `packages/shim type-check: Done`).
- [x] `packages/shim/dist/index.js` — 8 granular `/shim` refs (1 each for keys/media/notify/storage/relay/identity/ifc/config), 0 `@napplet/nub-` refs.
- [x] `packages/sdk/dist/index.js` — all 9 `@napplet/nub/<domain>` barrel refs, 0 `@napplet/nub-` refs, 0 theme/shim, 0 theme/sdk.
- [x] `packages/nub/` + `packages/nubs/` source/metadata trees unchanged (both `git diff --stat` calls returned empty output).

---
*Phase: 119-internal-consumer-migration*
*Completed: 2026-04-19*
