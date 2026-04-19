---
gsd_state_version: 1.0
milestone: v0.26.0
milestone_name: Better Packages
status: executing
stopped_at: Completed 119-01-PLAN.md
last_updated: "2026-04-19T14:13:50.894Z"
last_activity: 2026-04-19
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 8
  completed_plans: 7
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 119 — Internal Consumer Migration

## Current Position

Phase: 119 (Internal Consumer Migration) — EXECUTING
Plan: 2 of 2
Status: Ready to execute
Last activity: 2026-04-19

Progress: [█████████░] 88% (7/8 plans complete: Phase 117 fully shipped; Phase 118 fully shipped; Phase 119 Plan 01 complete — Phase 119 Plan 02 remaining)

## Accumulated Context

### Decisions (carried from prior milestones)

- v0.25.0: NUB-CONFIG is per-napplet schema-driven config (inverts the dropped v0.19.0 shell:config-* topics)
- v0.25.0: Schema format = JSON Schema (draft-07+)
- v0.25.0: Shell is sole writer; napplet reads/subscribes/requests-settings-open only
- v0.25.0: Value access pattern = subscribe-live (initial snapshot + push updates)
- v0.25.0: Schema declaration = manifest (authoritative, via vite-plugin) + runtime config.registerSchema (escape hatch)
- v0.25.0: Standardized JSON Schema extensions as potentialities: `x-napplet-secret`, `x-napplet-section`, `x-napplet-order`
- v0.25.0: MUST-level guarantees: values validate, defaults apply, storage scoped by (dTag, aggregateHash), shell is sole writer
- PRINCIPLE: NUBs define protocol surface + potentialities; implementation UX is a shell concern
- PRINCIPLE: NUB packages own ALL logic (types, shim installers, SDK helpers); central shim/sdk are thin hosts
- PRINCIPLE: `@napplet/*` is private; never listed as implementations in public specs/docs
- v0.26.0: Consolidate 9 `@napplet/nub-*` packages into single `@napplet/nub` with 36 subpath exports (9 barrels + 27 granular)
- v0.26.0: No root `@napplet/nub` import — consumers MUST use a domain subpath (prevents whole-tree imports)
- v0.26.0: Deprecated packages ship as 1-line re-export shims for one release cycle (removal deferred to later milestone)
- v0.26.0 (Phase 117-01): Enforce EXP-04 by omitting `.` from exports AND omitting top-level main/module/types fields — belt-and-suspenders making root import unresolvable by design
- v0.26.0 (Phase 117-01): `@napplet/nub` tsconfig extends `../../tsconfig.json` (2 levels), not `../../../` — packages/nub/ sits directly under packages/, unlike packages/nubs/<domain>/ which is 3 levels deep
- v0.26.0 (Phase 117-02): Theme NUB is types-only today (index.ts + types.ts only). Total @napplet/nub exports = 34, not 36. Phantom `./theme/shim` and `./theme/sdk` entries removed from Plan 117-01's package.json + tsup.config.ts in the same commit as the 34-file source copy. Option A selected at checkpoint — matches upstream reality, preserves Phase 117 "no behavioral migration" boundary. Supersedes the earlier v0.26.0 "36 subpath exports" decision above.
- v0.26.0 (Phase 117-02): registerNub asymmetry preserved — 8/9 domain barrels call `registerNub(DOMAIN, ...)` (identity, ifc, keys, media, notify, relay, storage, theme); config stays side-effect-free (integration happens in central shim per @napplet/nub-config pattern). Theme barrel registers normally.
- v0.26.0 (Phase 117-03): @napplet/nub initial tsup build green — 68 primary emitted files (34 .js + 34 .d.ts) plus 25 shared `chunk-*.js` files from tsup code-splitting. Root `@napplet/nub` import fails with `ERR_PACKAGE_PATH_NOT_EXPORTED` (EXP-04 runtime-verified from a real consumer context, not just by package.json inspection). All 9 `<domain>/types.js` emits are free of runtime `@napplet/core` imports (`import type` erased as expected). registerNub asymmetry preserved at runtime: 8 domains register (identity, ifc, keys, media, notify, relay, storage, theme), config does not. Theme/shim + theme/sdk correctly fail to resolve per Option A. Phase 117 is complete; ready for Phase 118 (deprecation re-export shims).
- v0.26.0 (Phase 118-01): Deprecated nub-* package src/ trees reduced to single-file index.ts re-export shim (`export * from '@napplet/nub/<domain>'`); 24 stale types/shim/sdk files removed from 8 domains plus theme's sole types.ts; src/ .ts count 34 -> 9. `export *` semantics preserve types, runtime exports, AND the registerNub side effect via the canonical @napplet/nub/<domain> module. Build/type-check verification deferred to Plan 03; package.json + [DEPRECATED] description updates deferred to Plan 02.
- v0.26.0 (Phase 118-01): Uniform deprecation banner applied to all 9 deprecated package READMEs — prepended above original content for the 4 that shipped a README previously (config, keys, media, notify); 5 new READMEs created with banner + migration snippet (identity, ifc, relay, storage, theme). Every banner names `@napplet/nub/<domain>` as the migration target and cites "a future milestone" as the removal window.
- v0.26.0 (Phase 118-02): All 9 deprecated `packages/nubs/<domain>/package.json` files carry `[DEPRECATED] Use @napplet/nub/<domain> instead. ` description prefix + sole `@napplet/nub: workspace:*` runtime dep (`@napplet/core` dropped — transitively satisfied). Config special case preserves `json-schema-to-ts` peerDep at `^3.1.1`, `peerDependenciesMeta.json-schema-to-ts.optional: true`, and `@types/json-schema@^7.0.15` devDep byte-identical. Other 8 packages remain free of peerDependencies/peerDependenciesMeta. Version field untouched at 0.2.1 everywhere; `.changeset/deprecate-nub-domain-packages.md` records a `minor` bump (0.2.1 → 0.3.0) across all 9 deprecated packages. Root `@napplet/nub` intentionally excluded from the changeset (frozen this phase). Release-time `pnpm version-packages` applies the bump; Plan 02 only records intent. MIG-01 (runtime wiring) + MIG-03 (@deprecated metadata surface) satisfied; Plan 03 unblocked.
- v0.26.0 (Phase 118-03): Monorepo build gate GREEN — `pnpm -r build` and `pnpm -r type-check` both exit 0 across all 14 workspace packages (@napplet/core, @napplet/nub, @napplet/shim, @napplet/sdk, @napplet/vite-plugin + 9 deprecated @napplet/nub-<domain>). All 9 deprecated packages emit `dist/index.{js,d.ts}` referencing @napplet/nub. Runtime `Object.keys()` shape parity verified 9/9 domains (config 8, identity 21, ifc 7, keys 10, media 17, notify 21, relay 10, storage 7, theme 1 — 102 total named exports identical between `@napplet/nub-<domain>` and `@napplet/nub/<domain>`). Shape-parity smoke harness at `/tmp/napplet-mig01-smoke` with file: deps (plan's fallback env) — packages/shim can't serve as harness because it lacks @napplet/nub in its node_modules until Phase 119. Phase 117 canonical @napplet/nub dist/ unregressed. pnpm-lock.yaml refreshed with 9 @napplet/core→@napplet/nub dep edge swaps (commit 5cc2809 — only artifact produced by Plan 03). Versions still 0.2.1; changeset idle; `pnpm version-packages` / `pnpm publish-packages` NOT run. MIG-01 closed end-to-end (source→manifest→build emit→runtime surface). Phase 118 ships MIG-01, MIG-02, MIG-03 in practice; Phase 119 consumer migration unblocked.
- v0.26.0 (Phase 119-01): Shim + SDK source-level import migration complete. `packages/shim/src/index.ts` routes 9 specifiers through `@napplet/nub/<domain>/shim` (8 domains: keys, media, notify, storage, relay, identity, ifc, config) plus `@napplet/nub/ifc/types` for the single type-only `IfcEventMessage` import. `packages/sdk/src/index.ts` routes every type re-export block (9), DOMAIN constant re-export (9), installer re-export (8), SDK helper re-export (7), and 2 JSDoc `@example` imports through `@napplet/nub/<domain>` barrels — all 9 domains covered including theme (barrel-only per Option A; zero theme/shim or theme/sdk refs). Runtime namespaces (relay, ipc, storage, media, notify, keys, identity, config) and shim routing logic byte-identical. Zero `@napplet/nub-<domain>` specifiers remain in first-party src under `packages/shim/src/` or `packages/sdk/src/`. `packages/nubs/` (deprecated) and `packages/nub/` (canonical) untouched. Rule 3 auto-fix: added `@napplet/nub: workspace:*` as an additive dep to both `packages/shim/package.json` and `packages/sdk/package.json` — the plan's literal "deps untouched" reading was unachievable because Phase 118 shims resolve old `@napplet/nub-<domain>` names (which were deleted from the src), not the new `@napplet/nub/<domain>` subpaths. All 9 legacy deps retained alongside the new edge; Plan 02 drops them. Build + type-check green for @napplet/shim (ESM 7.88 KB) and @napplet/sdk (ESM 15.86 KB). Task commits: f58c994 (shim), f2f2721 (sdk). CONS-01, CONS-02, CONS-03 satisfied (CONS-03 trivially — no demo/test consumers exist in repo).

### Blockers/Concerns

- CARRIED: npm publish blocked on human npm auth (PUB-04).
- CARRIED: NIP number conflict with Scrolls PR#2281 (RES-01) — unresolved.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260419-i6c | Republish napplet packages as 0.2.1 with resolved workspace:* deps | 2026-04-19 | ec677fb | [260419-i6c-republish-napplet-packages-as-0-2-1-with](./quick/260419-i6c-republish-napplet-packages-as-0-2-1-with/) |

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 118   | 01   | 2 min    | 2     | 22    |
| 118   | 02   | 2 min    | 2     | 10    |
| Phase 118 P03 | 3 min | 2 tasks | 1 files |
| Phase 119 P01 | 3 min | 2 tasks | 5 files |

## Session Continuity

Last session: 2026-04-19T14:13:50.891Z
Stopped at: Completed 119-01-PLAN.md
Resume: Phase 119 Plan 01 complete. Next: execute 119-02-PLAN.md (monorepo-wide dep swap — drop the 9 legacy `@napplet/nub-<domain>: workspace:*` entries from `packages/shim/package.json` and `packages/sdk/package.json` now that `@napplet/nub: workspace:*` is already wired in both; run `pnpm install` to prune dead edges, then `pnpm -r build` + `pnpm -r type-check` as the monorepo-wide green gate).
