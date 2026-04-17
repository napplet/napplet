---
phase: 113-nub-config-shim-sdk
plan: 02
subsystem: sdk
tags: [nub-config, sdk, window.napplet, barrel-export, tsup, esm, json-schema]

# Dependency graph
requires:
  - phase: 112-nub-config-package-scaffold
    provides: "@napplet/nub-config package scaffold + src/types.ts (DOMAIN, 8 wire-message interfaces, NappletConfigSchema, ConfigValues, ConfigSchemaErrorCode)"
  - phase: 113-01
    provides: "@napplet/nub-config src/shim.ts (installConfigShim, handleConfigMessage, 5 public API functions) — the surface the SDK wrappers delegate to at runtime"
provides:
  - "packages/nubs/config/src/sdk.ts (157 LOC): five bare-name SDK wrappers (get, subscribe, openSettings, registerSchema, onSchemaError) over a shared requireNapplet() guard; local structural ConfigNamespace type decouples guard return type from phase-115's NappletGlobal extension"
  - "packages/nubs/config/src/index.ts expanded from plan-112 types-only barrel to full barrel re-exporting DOMAIN + 15 types + 2 shim exports + 5 SDK wrappers"
  - "Built ESM + .d.ts + sourcemap distributables in packages/nubs/config/dist/ (index.js 5.4KB, index.d.ts 13.8KB, index.js.map 33.7KB)"
  - "Full package-local build + type-check gate green; monorepo-wide type-check green across all 13 packages (22/22 turbo tasks)"
affects: [115, config-sdk, napplet-shim-entry, napplet-sdk-entry, nub-config-public-surface]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bare-name SDK wrappers for single-NUB cherry-pick imports; namespaced re-export (under `config`) deferred to phase 115's @napplet/sdk central wiring — avoids cross-NUB collision (get/subscribe are not unique to config)"
    - "Local structural namespace type in sdk.ts decoupled from @napplet/core's NappletGlobal — lets the SDK wrap window.napplet.config before phase 115 adds the `config` field to NappletGlobal"
    - "Side-effect-free barrel: no registerNub() call at module load time — NUB domain registration is the central shim's responsibility in phase 115, preserving `sideEffects: false` in package.json"

key-files:
  created:
    - "packages/nubs/config/src/sdk.ts"
  modified:
    - "packages/nubs/config/src/index.ts"

key-decisions:
  - "Bare names (get, subscribe, openSettings, registerSchema, onSchemaError) match the merged NUB-CONFIG spec's API surface AND the plan's CONTEXT.md explicit instruction — unlike nub-identity which prefixes (identityGetPublicKey etc.) to avoid collisions with other identity-like domains; the collision risk is addressed at phase-115's @napplet/sdk aggregation via a `config` namespace re-export, not at this package level"
  - "Local ConfigNamespace structural interface (rather than extending @napplet/core's NappletGlobal) — @napplet/core has no `config` field in NappletGlobal yet (phase 115 adds it). Declaring the guard's return type locally keeps this package shippable today and avoids a circular upgrade between core and nub-config"
  - "Side-effect-free barrel: identity's index.ts ends with a `registerNub(DOMAIN, noop)` block that tags the domain in core's dispatch registry — I intentionally did NOT mirror that here, per plan Task 2 action spec. Phase 115 will wire domain registration via the central shim entry (explicit call), preserving `sideEffects: false` in package.json so tree-shakers can drop the whole package when consumers cherry-pick only types"
  - "No re-export from './shim.js' of the five public API functions (registerSchema/get/etc.) — they exist as top-level exports in shim.ts for phase-115 manual wire integration, but only the SDK-wrapped versions from sdk.js are exposed through the barrel to avoid double-export collisions and to ensure consumers always go through the requireNapplet() guard"

patterns-established:
  - "Bare-name SDK wrappers: works at the single-NUB package level when NUB action names are domain-specific OR when the aggregating central SDK namespaces them. Precedent: nub-keys (bare: registerAction, onAction) vs nub-identity (prefixed: identityGetPublicKey). Config follows the keys pattern + spec mandate"
  - "Local-struct guard type to decouple NUB packages from @napplet/core extensions: allows NUB packages to ship the full shim+SDK surface before phase 115 updates NappletGlobal in @napplet/core"

requirements-completed: [NUB-04]

# Metrics
duration: 2min
completed: 2026-04-17
---

# Phase 113 Plan 02: NUB Config SDK + Barrel Summary

**Five bare-name SDK wrappers (get, subscribe, openSettings, registerSchema, onSchemaError) over a shared requireNapplet() guard, plus full-surface barrel re-exporting types + shim + SDK; @napplet/nub-config now ships a complete NUB implementation ready for phase-115 central-shim wiring.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-17T11:41:52Z
- **Completed:** 2026-04-17T11:43:45Z
- **Tasks:** 3 (1 file created, 1 modified, 1 verification-only)
- **Files modified:** 2

## Accomplishments

- Shipped `packages/nubs/config/src/sdk.ts` (157 LOC, exceeds ≥80 minimum) — five stateless named wrappers over `window.napplet.config`, each with JSDoc `@example`, delegating through one shared `requireNapplet()` guard that throws a clear "import @napplet/shim first" error when the global is absent.
- Expanded `packages/nubs/config/src/index.ts` barrel from the plan-112 types-only surface to a full surface: DOMAIN constant + 15 types (preserved verbatim) + `installConfigShim` + `handleConfigMessage` from shim.js + 5 SDK wrappers from sdk.js. Side-effect-free — no `registerNub()` call (deferred to phase 115's central dispatcher).
- Build + type-check gate green: `pnpm --filter @napplet/nub-config build` produces `dist/index.{js,d.ts,js.map}` (5.4KB ESM + 13.8KB dts + 33.7KB sourcemap) and `pnpm --filter @napplet/nub-config type-check` exits 0.
- Monorepo-wide `pnpm type-check` green: 22/22 turbo tasks successful across all 13 packages — phase 113 introduced no regressions.
- Full surface now exported from `@napplet/nub-config`: DOMAIN + NappletConfigSchema + ConfigSchema + ConfigValues + ConfigSchemaErrorCode + NappletConfigSchemaExtensions + ConfigMessage + 5 request messages + 3 result messages + 3 discriminated unions + installConfigShim + handleConfigMessage + get + subscribe + openSettings + registerSchema + onSchemaError.

## Task Commits

1. **Task 1: Write packages/nubs/config/src/sdk.ts with five bare-name wrappers + shared guard** — `79692cd` (feat)
2. **Task 2: Expand packages/nubs/config/src/index.ts barrel to re-export shim + SDK** — `d3e98eb` (feat)
3. **Task 3: Final build + type-check gate (package + monorepo)** — no-op commit (verification-only; dist/ is .gitignore'd)

## Files Created/Modified

- `packages/nubs/config/src/sdk.ts` (created, 157 LOC) — SDK wrappers:
  - `requireNapplet(): ConfigNamespace` — private guard; throws `Error('window.napplet.config not installed -- import @napplet/shim first')` on missing mount
  - `get(): Promise<ConfigValues>` — one-shot snapshot
  - `subscribe(cb): Subscription` — live push stream with initial snapshot
  - `openSettings(options?: { section? }): void` — request shell settings UI
  - `registerSchema(schema, version?): Promise<void>` — runtime schema registration escape hatch
  - `onSchemaError(cb): () => void` — listen for uncorrelated shell-pushed errors
  - Each wrapper body: single delegation line, `requireNapplet().foo(...)`
  - Local structural `ConfigNamespace` interface mirrors the shape installed by `installConfigShim` — keeps the guard's return type decoupled from phase-115's NappletGlobal extension
- `packages/nubs/config/src/index.ts` (modified, 32 lines added / 15 lines removed) — barrel:
  - Preserved `export { DOMAIN }` and all 15 type re-exports from plan 112 verbatim
  - Added `export { installConfigShim, handleConfigMessage } from './shim.js'`
  - Added `export { get, subscribe, openSettings, registerSchema, onSchemaError } from './sdk.js'`
  - No `registerNub()` call — side-effect-free, per plan Task 2 action spec

## Decisions Made

- **Bare names for SDK wrappers** — `get`, `subscribe`, `openSettings`, `registerSchema`, `onSchemaError`. Spec-mandated (NUB-CONFIG's API surface uses bare names) AND CONTEXT.md explicit. Precedent: nub-keys (bare `registerAction`/`onAction`) vs nub-identity (prefixed `identityGet*`). Identity prefixes because multiple NUBs could define `getProfile` etc.; config's names are collision-prone at the @napplet/sdk aggregation tier, which phase 115 resolves via namespaced re-export (`import { config } from '@napplet/sdk'` → `config.get()`).
- **Local `ConfigNamespace` structural type instead of extending `NappletGlobal`** — `@napplet/core`'s `NappletGlobal` interface does not (yet) include a `config` field. Phase 115 adds it. Declaring the guard's return type locally avoids a chicken-and-egg upgrade: this package ships functional today; phase 115's NappletGlobal extension is structurally compatible (same method signatures), so no refactor needed there.
- **Side-effect-free barrel (no `registerNub()` call)** — nub-identity's index.ts ends with `registerNub(DOMAIN, noop)` to register the domain with @napplet/core's dispatcher singleton on import. I deliberately did NOT mirror that: plan Task 2 action spec explicitly instructs "Do NOT add a registerNub(DOMAIN, ...) side-effect block". Phase 115 will wire domain registration explicitly via the central shim entry, preserving `sideEffects: false` in package.json for tree-shakers.
- **Barrel does NOT re-export the five raw functions from shim.js** — shim.ts has top-level `export function registerSchema(...)` etc. (by the same names as the SDK wrappers). If the barrel re-exported from both shim.js AND sdk.js, the same names would collide. Only the SDK-wrapped versions are exposed through the barrel, so consumers always go through the `requireNapplet()` guard. The raw shim exports remain reachable for phase-115 internal wiring (which can use them via the package's subpath if needed, or directly import `installConfigShim` and let the mount do the work).
- **`onSchemaError` returns `() => void`** (not `Subscription`) — matches the plan-01 shim surface and the plan's interfaces block. The merged spec's TS sketch says `Subscription`, but plan 113-01 locked `() => void` and plan 113-02's interfaces block re-confirms it. Phase 115 can harmonize with the spec if integration friction emerges.

## Deviations from Plan

None — plan executed exactly as written. All acceptance grep checks pass, line-count floor (≥80 LOC) exceeded (157), 5 exported functions (exactly the required minimum), build + type-check + monorepo-wide type-check all green.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Phase 113 complete.** Both plans shipped: shim.ts (371 LOC) + sdk.ts (157 LOC) + full barrel. NUB-03 + NUB-04 requirements satisfied.
- **Ready for phase 114 (Vite-Plugin Extension)** — can proceed in parallel with phase 115 since vite-plugin only touches build-time manifest injection and does not depend on central shim wiring.
- **Ready for phase 115 (Core / Shim / SDK Integration + Wire)** — the four-point central integration is mechanically straightforward from this surface:
  1. `NubDomain` in `@napplet/core` gains `'config'` (add to existing union)
  2. `NappletGlobal` in `@napplet/core` gains a `config?: { ... }` field (shape matches `ConfigNamespace` in sdk.ts — consider whether to import from nub-config or redefine; precedent is to redefine to avoid the core→nub dependency direction)
  3. Central `@napplet/shim` entry imports and calls `installConfigShim()` at startup
  4. Central dispatcher routes inbound `config.*` messages via `handleConfigMessage` (mirrors identity wiring in `packages/shim/src/index.ts`)
  5. `@napplet/sdk` re-exports the 5 wrappers under a `config` namespace: `export * as config from '@napplet/nub-config'` (or a curated subset pattern if `installConfigShim` etc. should remain internal)
- **No blockers.** Publish-blocked items (PUB-04 npm auth, RES-01 NIP number conflict) are pre-existing and unrelated to phase 113.

## Self-Check: PASSED

- File exists: `packages/nubs/config/src/sdk.ts` — FOUND (157 LOC)
- File modified: `packages/nubs/config/src/index.ts` — FOUND
- Commit exists: `79692cd` (Task 1 feat) — FOUND on main
- Commit exists: `d3e98eb` (Task 2 feat) — FOUND on main
- Task 1 acceptance (requireNapplet + 5 named exports + ≥80 LOC + JSDoc @example) — ALL PASS
- Task 2 acceptance (shim + sdk re-exports, DOMAIN preserved, no registerNub) — ALL PASS
- Task 3 acceptance (package build green, type-check green, monorepo type-check green 22/22, dist/ artifacts with all symbols) — ALL PASS
- Built dist exports `installConfigShim`, `handleConfigMessage`, `registerSchema`, and all 5 SDK wrappers — VERIFIED via grep

---
*Phase: 113-nub-config-shim-sdk*
*Completed: 2026-04-17*
