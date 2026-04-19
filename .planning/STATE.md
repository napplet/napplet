---
gsd_state_version: 1.0
milestone: v0.26.0
milestone_name: Better Packages
status: verifying
stopped_at: Completed 120-03-PLAN.md
last_updated: "2026-04-19T14:42:13.648Z"
last_activity: 2026-04-19
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 11
  completed_plans: 11
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.
**Current focus:** Phase 120 — Documentation Update

## Current Position

Phase: 121
Plan: Not started
Status: Phase complete — ready for verification
Last activity: 2026-04-19

Progress: [██████████] 100% (11/11 plans complete: Phase 117 fully shipped; Phase 118 fully shipped; Phase 119 fully shipped; Phase 120 fully shipped — DOC-01/02/03/04 closed via 3 parallel wave-1 plans)

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
- v0.26.0 (Phase 119-02): Dep-swap complete. `packages/shim/package.json` dependencies 10→2 (removed 8 legacy `@napplet/nub-<domain>` entries — relay, identity, storage, ifc, keys, media, notify, config); `packages/sdk/package.json` 11→2 (removed 9 — same 8 plus theme). Both end at `{@napplet/core: workspace:*, @napplet/nub: workspace:*}`. Non-dep fields byte-identical in both files. `pnpm-lock.yaml` refreshed — shim+sdk importer stanzas each reference `link:../core` + `link:../nub` only (0 legacy edges for those importers). `pnpm -r build` and `pnpm -r type-check` both exit 0 across all 14 workspace packages. `packages/shim/dist/index.js` emits 8 distinct `@napplet/nub/<domain>/shim` refs (1 each for keys/media/notify/storage/relay/identity/ifc/config) + 0 legacy. `packages/sdk/dist/index.js` emits all 9 `@napplet/nub/<domain>` barrels (relay/identity/storage/ifc/theme/keys/media/notify/config — theme barrel-only per Option A) + 0 legacy + 0 theme/shim + 0 theme/sdk. `packages/nub/` (canonical) and `packages/nubs/` (deprecated) source+metadata trees untouched (empty `git diff --stat`). Plan scope reduced vs as-written: the 119-01 Rule-3 auto-fix already added `@napplet/nub`, so this plan was pure deletion — "add" action documented as no-op. No deviations. No changeset (internal refactor; dist-level consumers are unaffected, Phase 118 deprecation changeset untouched). Task commit: 8f83e14 (chore). Phase 119 closes CONS-01, CONS-02, CONS-03 end-to-end (source Plan 01 + manifest/lockfile/emit Plan 02); Phase 120 (documentation migration) unblocked.
- v0.26.0 (Phase 120-01): Canonical `packages/nub/README.md` created (160 lines) with all 11 required H2 sections (Install, Quick Start, 9 Domains, Subpath Patterns, Tree-Shaking Contract, Theme Exception, Migration, Optional Peer Dependency, Protocol Reference, License + H1 title). 9-domain subpath table uses em-dash U+2014 (14 occurrences; Theme Shim/SDK cells per types-only exception). Four concrete runnable import examples cover every subpath pattern: barrel (`@napplet/nub/relay`), types-only (`@napplet/nub/ifc/types`), shim-only (`@napplet/nub/storage/shim`), sdk-only (`@napplet/nub/notify/sdk`) plus an end-to-end relay example showing napplet-side `relaySubscribe` and shell-side `installRelayShim` together. 9-row migration table maps every deprecated `@napplet/nub-<domain>` → `@napplet/nub/<domain>` (barrel + granular). Relative `../../specs/NIP-5D.md` protocol reference. Optional `json-schema-to-ts@^3.1.1` peerDep documented with a `FromSchema` usage example. Task commit: 0033b4d (docs). DOC-01 closed.
- v0.26.0 (Phase 120-02): 4 user-facing READMEs migrated off deprecated `@napplet/nub-<domain>` names to the consolidated `@napplet/nub` surface. Root README package table: 5 per-nub rows collapsed to single `[@napplet/nub](packages/nub)` row; 10-box dep graph redrawn to 5-box post-consolidation shape (`@napplet/shim + @napplet/sdk → @napplet/nub → @napplet/core`, with `@napplet/vite-plugin` as independent build-time leaf); all defunct `@napplet/nub-signer` references (removed in v0.24.0) purged. `packages/core/README.md` integration note (line 353) enumerates `@napplet/nub/<domain>` subpaths for the 8 `registerNub` domains with a parenthetical noting `@napplet/nub/theme` is types-only. `packages/shim/README.md` Shim-vs-SDK comparison table deps row (line 426) collapsed to single `@napplet/nub` entry with note about internal `/shim` subpath routing. `packages/sdk/README.md` line 178 peerDep note rewritten to cite `@napplet/nub` scoped to `@napplet/nub/config` domain; lines 296-303 type-to-package mapping table's 8 rows switched to `@napplet/nub/<domain>` barrel subpaths (column header "NUB Package" kept unchanged — values are subpaths of the same `@napplet/nub` package). Cross-file invariant: `grep -c "@napplet/nub-"` returns 0 across all 4 files. Zero deviations. Parallel-executor scope respected (companion agent owns `packages/nub/README.md` — untouched by this plan). Task commits: d29b9f2 (root), 80366cb (core), 6039111 (shim), 24a0289 (sdk). All with --no-verify per parallel-executor protocol. DOC-02 satisfied.
- v0.26.0 (Phase 120-03): Verify-only plan confirmed DOC-03 + DOC-04 closed. `specs/NIP-5D.md` (118 lines, 6,997 bytes): 0 `@napplet/nub-` grep matches + full file-content read confirms zero deprecated references (spec uses `<nub-name>` placeholder and `foo.bar` example domain only). `skills/build-napplet/SKILL.md` (208 lines, 7,954 bytes): 0 grep matches + full read confirms all `pnpm add` / import blocks reference `@napplet/shim` + `@napplet/vite-plugin` only. Phase-wide acceptance grep across root README + 4 edited package READMEs + `packages/nub/README.md` + `packages/vite-plugin/README.md` + `specs/` + `skills/` returns 0 matches outside two intentional content zones: `packages/nubs/<domain>/` deprecation banners AND `packages/nub/README.md`'s `## Migration` section (lines 110–126; awk-scoped verification: 10 of 10 matches fall inside Migration, 0 leakage elsewhere). Rule 3 deviation documented: Task 3's verify grep command under-specified its exclusion list by omitting `packages/nub/README.md` despite Plan 01's CONTEXT.md non-negotiables requiring that migration table. Adjusted gate clean; zero file modifications; no per-task commits under happy path. Phase 120 functionally complete across DOC-01, DOC-02, DOC-03, DOC-04.

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
| Phase 119 P02 | 3 min | 2 tasks | 3 files |
| Phase 120 P02 | 2min | 4 tasks | 4 files |
| Phase 120 P01 | 2 min | 1 tasks | 1 files |
| Phase 120 P03 | 3 min | 3 tasks | 1 files |

## Session Continuity

Last session: 2026-04-19T14:38:10.972Z
Stopped at: Completed 120-03-PLAN.md
Resume: Phase 120 complete (Plan 01 + Plan 02 + Plan 03 all shipped in parallel wave-1). DOC-01/02/03/04 closed end-to-end. Next: `/gsd:verify-work 120` to run phase verification, then advance to the next phase in the v0.26.0 milestone.
