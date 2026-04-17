---
phase: 112-nub-config-package-scaffold
plan: 01
subsystem: infra
tags: [tsup, tsconfig, pnpm-workspace, turborepo, json-schema, nub-config]

# Dependency graph
requires:
  - phase: 111-nub-config-spec
    provides: "NUB-CONFIG wire contract (napplet/nubs#13) that dictates the DOMAIN = 'config' constant and the 6 wire messages that land in plan 02"
provides:
  - "packages/nubs/config/ directory with package.json, tsconfig.json, tsup.config.ts, src/index.ts"
  - "@napplet/nub-config@0.2.0 workspace package, resolvable via pnpm --filter and discoverable by turborepo"
  - "DOMAIN = 'config' as const stub export (moves to src/types.ts in plan 02)"
  - "Dependency edges: @napplet/core workspace:* runtime; @types/json-schema@^7.0.15 dev; json-schema-to-ts@^3.1.1 optional peer"
  - "Built artifacts: dist/index.js (93B), dist/index.d.ts (331B), with sourcemap"
affects: [112-02, 113, 114, 115, 116]

# Tech tracking
tech-stack:
  added:
    - "@types/json-schema@^7.0.15 (devDep — for JSONSchema7 type alias landing in plan 02)"
    - "json-schema-to-ts@^3.1.1 (optional peerDep — for author-side FromSchema<typeof schema> inference)"
  patterns:
    - "Optional peerDependency + peerDependenciesMeta.optional: true — for heavy type-only deps that authors should opt into"
    - "NUB scaffold template: copy packages/nubs/identity/{package.json,tsconfig.json,tsup.config.ts} verbatim, rename name/description/keywords/repository.directory"

key-files:
  created:
    - "packages/nubs/config/package.json — NUB package manifest, JSON Schema dep declarations"
    - "packages/nubs/config/tsconfig.json — extends root, dist/src roots, ES2022+DOM libs"
    - "packages/nubs/config/tsup.config.ts — ESM-only, dts + sourcemap + clean"
    - "packages/nubs/config/src/index.ts — stub barrel exporting DOMAIN constant"
  modified:
    - "pnpm-lock.yaml — resolved @napplet/nub-config workspace link and @types/json-schema"

key-decisions:
  - "json-schema-to-ts declared as optional peerDependency (not devDep) — authors who don't want FromSchema<> inference skip the ~1.5MB transitive install; declared with peerDependenciesMeta.optional: true so pnpm doesn't warn consumers"
  - "@types/json-schema as devDep only — JSONSchema7 type alias compiles into dist/*.d.ts (types-only, zero runtime cost); consumers don't need @types/json-schema in their own graph because tsup inlines .d.ts"
  - "DOMAIN constant temporarily lives in src/index.ts rather than src/types.ts — plan 02 moves it to types.ts to match the identity NUB pattern exactly (see packages/nubs/identity/src/types.ts line 19 convention)"
  - "No registerNub(DOMAIN, ...) call in barrel yet — that's phase 115's job (core/shim integration); plan 112 is pure package scaffold"
  - "No README.md in this plan — phase 116 owns docs; keeping scaffold purely infrastructural"

patterns-established:
  - "JSON Schema optional peerDep pattern: peerDependencies + peerDependenciesMeta.optional: true for type-only utility libs that authors opt into per-package"
  - "Stub barrel → full barrel two-step: plan N-01 scaffolds a DOMAIN-only barrel so the package builds green; plan N-02 replaces it with the full type surface. Unblocks build/type-check gating for future plans"

requirements-completed: [NUB-01, NUB-06]

# Metrics
duration: 2min
completed: 2026-04-17
---

# Phase 112 Plan 01: NUB Config Package Scaffold Summary

**Scaffolded `@napplet/nub-config` — 13th package, 9th NUB — mirroring the identity NUB template exactly, plus JSON Schema dep edges (`@types/json-schema` devDep + optional `json-schema-to-ts` peerDep) so plan 02 can land `src/types.ts` against a resolved, buildable package.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-17T11:15:14Z
- **Completed:** 2026-04-17T11:17:08Z
- **Tasks:** 2
- **Files created:** 4
- **Files modified:** 1 (pnpm-lock.yaml)

## Accomplishments

- `packages/nubs/config/` directory exists with all four expected files (package.json, tsconfig.json, tsup.config.ts, src/index.ts).
- `@napplet/nub-config@0.2.0` is resolvable as a pnpm workspace package — `pnpm --filter @napplet/nub-config ...` works; turborepo picks it up automatically via the existing `packages/nubs/*` glob.
- Dependency edges correct per NUB-06 / STACK.md: `@napplet/core` as the only runtime dep (`workspace:*`), `@types/json-schema@^7.0.15` as devDep (alphabetized before tsup), `json-schema-to-ts@^3.1.1` as optional peerDep (flagged `peerDependenciesMeta."json-schema-to-ts".optional: true`).
- `pnpm --filter @napplet/nub-config build` produces `dist/index.js` (93B) + `dist/index.d.ts` (331B) + sourcemap.
- `pnpm --filter @napplet/nub-config type-check` exits 0.
- Stub barrel exports `DOMAIN = 'config' as const` — plan 02 moves it to `src/types.ts` and adds the full 6-message type surface + `NappletConfigSchema` / `ConfigValues` / `x-napplet-*` potentiality types.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create package.json + tsconfig.json + tsup.config.ts** — `d2ea20a` (chore)
2. **Task 2: Stub barrel index.ts + pnpm install + build + type-check gate** — `cba9fdf` (feat)

## Files Created/Modified

- `packages/nubs/config/package.json` — @napplet/nub-config manifest; `@napplet/core: workspace:*` runtime dep; `@types/json-schema@^7.0.15` devDep; `json-schema-to-ts@^3.1.1` optional peerDep; standard build/type-check scripts
- `packages/nubs/config/tsconfig.json` — extends `../../../tsconfig.json`; `outDir: dist`, `rootDir: src`, ES2022+DOM+DOM.Iterable libs
- `packages/nubs/config/tsup.config.ts` — ESM-only entry=`src/index.ts`, `dts: true`, `sourcemap: true`, `clean: true` (verbatim identity copy)
- `packages/nubs/config/src/index.ts` — stub barrel exporting `DOMAIN = 'config' as const` + package-level JSDoc
- `pnpm-lock.yaml` — updated to register the new workspace link and `@types/json-schema@7.0.15`

## Decisions Made

- **Optional peerDep for `json-schema-to-ts`.** Authors who want `FromSchema<typeof schema>` inference opt in; everyone else pays zero install cost. The `peerDependenciesMeta."json-schema-to-ts".optional: true` flag suppresses pnpm warnings for consumers who omit it. This matches the STACK.md recommendation for per-package opt-in tooling.
- **`@types/json-schema` as devDep only.** The `JSONSchema7` alias compiles into the emitted `.d.ts`, so downstream packages don't need `@types/json-schema` in their own graph — tsup effectively inlines the type contract.
- **DOMAIN constant in `src/index.ts` (stub), not `src/types.ts`.** Plan 02 moves it to types.ts alongside the full message surface and re-exports from the barrel, matching the identity NUB convention. For this plan, keeping DOMAIN in the barrel keeps the stub minimal and the dep graph clean.
- **No `registerNub(DOMAIN, ...)` call yet.** The identity barrel registers its domain at import time, but core/shim integration is phase 115's job. This scaffold intentionally stops short of side-effecting imports.
- **No README in this plan.** Phase 116 owns documentation; the scaffold plan is purely infrastructural to avoid rework when the shim + SDK land in phase 113.

## Deviations from Plan

None — plan executed exactly as written. All success criteria met on first pass; no Rule 1/2/3 auto-fixes needed; no Rule 4 architectural questions triggered.

## Issues Encountered

- `pnpm install --filter @napplet/nub-config...` emitted a benign informational warning (`node_modules is present. Lockfile only installation will make it out-of-date`) — this is normal for a monorepo that already has resolved deps; lockfile was updated correctly in the same step, no impact on build.

## Authentication Gates

None — no external services, no credentials required. Pure local workspace scaffolding.

## Next Plan Readiness

- **Plan 02 (`112-02-PLAN.md`) unblocked.** Can now write `src/types.ts` importing `type { JSONSchema7 } from 'json-schema'` against a resolved, buildable package.
- **Handoff note to plan 02:** The 6 wire-message interfaces + `NappletConfigSchema` / `ConfigValues` type aliases + `x-napplet-*` potentiality types go in `src/types.ts`. Move `DOMAIN = 'config' as const` from `src/index.ts` → `src/types.ts` and re-export from the barrel (matches identity NUB pattern at `packages/nubs/identity/src/types.ts` line 19).
- **Plan 113 readiness:** Package scaffold is stable; shim.ts / sdk.ts can land later without any package.json changes. If plan 113 needs additional runtime deps, add them in that plan (none are anticipated per STACK.md).
- **No blockers** for downstream phases (113 shim/SDK, 114 vite-plugin, 115 integration).

## Self-Check: PASSED

All claims verified:

- `packages/nubs/config/package.json` — FOUND
- `packages/nubs/config/tsconfig.json` — FOUND
- `packages/nubs/config/tsup.config.ts` — FOUND
- `packages/nubs/config/src/index.ts` — FOUND
- `packages/nubs/config/dist/index.js` — FOUND (build artifact, gitignored)
- `packages/nubs/config/dist/index.d.ts` — FOUND (build artifact, gitignored)
- Commit `d2ea20a` (Task 1 — chore) — FOUND in git log
- Commit `cba9fdf` (Task 2 — feat) — FOUND in git log
- `pnpm --filter @napplet/nub-config build` — exit 0, dist produced
- `pnpm --filter @napplet/nub-config type-check` — exit 0

---
*Phase: 112-nub-config-package-scaffold*
*Completed: 2026-04-17*
