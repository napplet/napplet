---
phase: 115-core-shim-sdk-integration
plan: 01
subsystem: infra
tags: [nub-config, monorepo-wiring, nub-integration, typescript, pnpm-workspaces]

# Dependency graph
requires:
  - phase: 112-nub-config-package-scaffold
    provides: "@napplet/nub-config package scaffold + src/types.ts (17 type symbols + DOMAIN)"
  - phase: 113-nub-config-shim-sdk
    provides: "installConfigShim + handleConfigMessage + bare-name SDK wrappers (get/subscribe/openSettings/registerSchema/onSchemaError)"
  - phase: 114-vite-plugin-extension
    provides: "configSchema option, manifest tag, aggregateHash contribution, napplet-config-schema meta injection"
provides:
  - "'config' as 9th NubDomain literal + 9th NUB_DOMAINS entry in @napplet/core"
  - "NappletGlobal.config inline structural namespace in @napplet/core (no @napplet/nub-config dep — core stays decoupled)"
  - "@napplet/shim mounts window.napplet.config at install + routes config.* messages to handleConfigMessage"
  - "@napplet/sdk re-exports config namespace + 17 Config NUB types + CONFIG_DOMAIN + installConfigShim"
  - "shell.supports('config') and shell.supports('nub:config') type-check as valid NamespacedCapability (CAP-01)"
affects: [116-documentation, future-nub-integrations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline structural types in @napplet/core NappletGlobal namespaces — zero NUB package deps (identity/media/notify/config all follow this)"
    - "Shim object-literal placeholder + installXShim overwrite — enables type-safe window.napplet assembly while still letting the NUB installer own its own schema/accessor properties (config.schema: null placeholder → Object.defineProperty getter after installConfigShim runs)"
    - "Bare-prefix domain routing for NUBs with non-.result shell-to-napplet messages — config.* uses `type.startsWith('config.')` (not `.endsWith('.result')`) because handleConfigMessage internally dispatches values/schemaError pushes alongside registerSchema.result"

key-files:
  created: []
  modified:
    - "packages/core/src/envelope.ts"
    - "packages/core/src/types.ts"
    - "packages/shim/package.json"
    - "packages/shim/src/index.ts"
    - "packages/sdk/package.json"
    - "packages/sdk/src/index.ts"

key-decisions:
  - "Core stays decoupled from @napplet/nub-config — NappletGlobal.config uses inline Record<string, unknown> for schema/values instead of importing NappletConfigSchema/ConfigValues types. Matches identity/media/notify precedent and lets NUB packages ship ahead of core."
  - "config.* routing uses bare prefix (not `.endsWith('.result')` like identity). handleConfigMessage dispatches three shell→napplet types (registerSchema.result, values dual-use, schemaError) — requires raw prefix match so non-result pushes reach the handler."
  - "Approach 1 for window.napplet.config mount — populate in object literal with 5 methods + schema: null placeholder, then let installConfigShim() overwrite the entire config property with its shim-managed api (which replaces schema: null with a getter via Object.defineProperty). Preserves type-safety of object literal assignment while letting the installer own the getter semantics."
  - "SDK `config` namespace uses explicit wrapper (not `export * as config from '@napplet/nub-config'`) — mirrors identity/media/notify precedent so the public API surface stays curated and doesn't leak internal exports like installConfigShim or handleConfigMessage into the namespace."
  - "onSchemaError typed as `() => void` return (not Subscription) in NappletGlobal.config and SDK wrapper — matches Phase 113 lock-in where the shim actually returns a plain teardown function."

patterns-established:
  - "Pattern: Record<string, unknown> as decoupled-type placeholder — when a core namespace needs a type that would otherwise require importing a NUB package, use Record<string, unknown> as the structural approximation. The NUB package's concrete type (NappletConfigSchema, ConfigValues) widens cleanly to this at the integration boundary."
  - "Pattern: placeholder-then-overwrite for window.napplet installer-owned accessors. Object literal gets a writable placeholder (schema: null); installXShim() reassigns the whole namespace property with its own object that has Object.defineProperty-based accessors. Type-system satisfied both times, runtime semantics come from the installer."
  - "Pattern: stale-dist detection during integration — when shim/sdk type-check fails on an added-to-core type before core's dist is rebuilt, run `pnpm --filter @napplet/core build` first, then retry. Sibling packages consume @napplet/core via dist/index.d.ts, not src/."

requirements-completed: [WIRE-01, WIRE-02, WIRE-03, WIRE-04, WIRE-05, WIRE-06, CORE-01, CORE-02, SHIM-01, SDK-01, CAP-01]

# Metrics
duration: 4m17s
completed: 2026-04-17
---

# Phase 115 Plan 01: Core / Shim / SDK Integration Summary

**'config' wired as a first-class NubDomain across @napplet/core, @napplet/shim, and @napplet/sdk — window.napplet.config mounted at install, config.* envelopes routed to @napplet/nub-config, bundler consumers can `import { config, CONFIG_DOMAIN, installConfigShim } from '@napplet/sdk'`.**

## Performance

- **Duration:** 4m 17s
- **Started:** 2026-04-17T13:47:34Z
- **Completed:** 2026-04-17T13:51:57Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments

- `'config'` is the 9th NubDomain literal + 9th NUB_DOMAINS runtime constant entry; NamespacedCapability template types automatically admit `'config'` and `'nub:config'` (CAP-01 satisfied structurally).
- `NappletGlobal.config` inline namespace added to `@napplet/core/types.ts` — 5 methods (registerSchema/get/subscribe/openSettings/onSchemaError) + readonly `schema` accessor. Zero imports from `@napplet/nub-config` (core stays dependency-free of NUB packages).
- `@napplet/shim` imports `installConfigShim` + `handleConfigMessage` + 5 method aliases from `@napplet/nub-config`, adds a `config.*` routing branch to `handleEnvelopeMessage` (bare prefix, not `.result` suffix — covers registerSchema.result, values dual-use, schemaError), populates `config: {...}` in the window.napplet object literal, and calls `installConfigShim()` at the bottom of the Initialize section to overwrite with the shim-managed api object (which installs the `schema` accessor via Object.defineProperty).
- `@napplet/sdk` adds an explicit `config` namespace wrapper (matching identity/media/notify precedent), re-exports all 17 Config NUB type symbols (NappletConfigSchema, ConfigSchema, ConfigValues, ConfigSchemaErrorCode, NappletConfigSchemaExtensions, ConfigMessage + 5 request messages + 3 result/push messages + 3 discriminated unions), `CONFIG_DOMAIN`, and `installConfigShim`.
- Full monorepo `pnpm build` + `pnpm type-check` exit 0 across all 13 packages (23/23 turbo tasks). WIRE-01..06 round-trip semantics verified via type-check (shim call path reaches @napplet/nub-config wire-sending code, handleConfigMessage dispatcher handles all 3 shell→napplet types). CAP-01 verified via standalone type-check — `nub:unknown` correctly rejected, `config` / `nub:config` / `perm:*` accepted.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 'config' to NubDomain union + NUB_DOMAINS array** — `1e1489a` (feat)
2. **Task 2: Add NappletGlobal.config inline namespace** — `9688a6b` (feat)
3. **Task 3: Wire @napplet/nub-config into @napplet/shim** — `26d8d2f` (feat)
4. **Task 4: Re-export config surface from @napplet/sdk + final build gate** — `de89150` (feat)

## Files Created/Modified

- `packages/core/src/envelope.ts` — added `'config'` 9th literal to NubDomain union, 9th entry to NUB_DOMAINS array, JSDoc row in domain table.
- `packages/core/src/types.ts` — added `config: {}` inline namespace to NappletGlobal with 5 methods + readonly schema accessor (+77 lines).
- `packages/shim/package.json` — added `@napplet/nub-config: workspace:*` dep.
- `packages/shim/src/index.ts` — imported `installConfigShim` + `handleConfigMessage` + 5 SDK method aliases, added `type.startsWith('config.')` routing branch in handleEnvelopeMessage (before ifc.event branch), populated `config: {...}` in window.napplet literal (between identity and shell), added `installConfigShim()` invocation at end of Initialize section.
- `packages/sdk/package.json` — added `@napplet/nub-config: workspace:*` dep.
- `packages/sdk/src/index.ts` — added `export const config = {}` namespace wrapper (6 methods including readonly getter `schema`), added 17 Config NUB type re-exports, added `CONFIG_DOMAIN` constant re-export, added `installConfigShim` re-export (+114 lines).
- `pnpm-lock.yaml` — reflects new workspace deps (touched by `pnpm install`).

## Decisions Made

- **Core stays decoupled from @napplet/nub-config:** NappletGlobal.config uses inline `Record<string, unknown>` for schema/values types rather than importing `NappletConfigSchema`/`ConfigValues` from `@napplet/nub-config`. Rationale: mirrors identity/media/notify precedent; keeps core as a single foundational package that never depends on NUB packages; structural compatibility means assignment from nub-config surfaces widens cleanly.
- **Bare-prefix domain routing for config:** Used `type.startsWith('config.')` instead of identity's `startsWith('identity.') && endsWith('.result')` pattern. Rationale: config has three shell→napplet message types (registerSchema.result for positive-ACK, values for both correlated responses and push updates, schemaError for uncorrelated error pushes). handleConfigMessage dispatches these internally by exact type; a `.result` suffix filter would drop values/schemaError pushes.
- **Approach 1 for window.napplet.config mount:** Object literal populates 5 methods + schema: null placeholder; installConfigShim() called AFTER the literal overwrites the whole `config` property with its shim-managed api (which supplies the `schema` accessor via Object.defineProperty). Rationale: matches the explicit-literal pattern used for identity/media/notify (type-safety at literal construction); the reassignment is safe because the 5 method references are identical on both sides, and the Object.defineProperty schema getter is the only functional difference (desired).
- **SDK config namespace uses explicit wrapper, not `export * as config`:** Mirrors identity/media/notify precedent. Rationale: explicit wrapper keeps the public surface curated — it would otherwise leak `config.installConfigShim`, `config.handleConfigMessage`, and type-only exports under the namespace which is noisy. CONFIG_DOMAIN and installConfigShim re-export at top level alongside the other NUBs.
- **onSchemaError typed as `() => void`:** Matches Phase 113 lock-in (nub-config's shim returns plain teardown, not Subscription). Propagated identically through NappletGlobal.config (core) and SDK wrapper.

## Deviations from Plan

None - plan executed exactly as written.

One incidental build-system step required during Task 3: after adding the `config` field to NappletGlobal in Task 2 (core/src/types.ts), @napplet/shim's type-check initially failed because @napplet/core/dist/index.d.ts was stale (predated the Task 2 edit). Ran `pnpm --filter @napplet/core build` to refresh dist, then shim built + type-checked cleanly. This is an environmental refresh, not a plan deviation — the plan's Task 3 verify step includes `pnpm install && pnpm --filter @napplet/shim build` which would have triggered the refresh via turbo's dependency graph on first invocation. (Noted for pattern library.)

## Issues Encountered

None beyond the stale-dist refresh noted above.

## Self-Check: PASSED

Verified all claims in this SUMMARY:

**Files exist:**
- `packages/core/src/envelope.ts` — FOUND (contains 'config' in NubDomain union + NUB_DOMAINS array + JSDoc table row)
- `packages/core/src/types.ts` — FOUND (contains `config: {` NappletGlobal namespace + `readonly schema: Record<string, unknown> | null`)
- `packages/shim/package.json` — FOUND (contains `@napplet/nub-config`)
- `packages/shim/src/index.ts` — FOUND (contains `installConfigShim`, `handleConfigMessage`, `type.startsWith('config.')`, `config: {`, `installConfigShim();`)
- `packages/sdk/package.json` — FOUND (contains `@napplet/nub-config`)
- `packages/sdk/src/index.ts` — FOUND (contains `export const config = {`, `CONFIG_DOMAIN`, `ConfigValuesMessage`, `export { installConfigShim } from '@napplet/nub-config'`)

**Commits exist (verified via git log):**
- `1e1489a` — FOUND (Task 1)
- `9688a6b` — FOUND (Task 2)
- `26d8d2f` — FOUND (Task 3)
- `de89150` — FOUND (Task 4)

**Build gates:**
- `pnpm build` exit 0 — VERIFIED (13/13 packages built, 23/23 turbo tasks successful)
- `pnpm type-check` exit 0 — VERIFIED (all 13 packages type-check clean)
- CAP-01 standalone NamespacedCapability type-check — VERIFIED (`config`, `nub:config`, `perm:custom` accepted; `nub:unknown`, `unknown` rejected via @ts-expect-error)

## Next Phase Readiness

- Phase 115 COMPLETE — all 11 requirements satisfied (WIRE-01..06, CORE-01, CORE-02, SHIM-01, SDK-01, CAP-01).
- Phase 116 (Documentation) can begin: nub-config README, NIP-5D Known NUBs table row, core/shim/SDK/vite-plugin README updates (DOC-01..06).
- v0.25.0 milestone closes out once Phase 116 ships. All code surface for NUB-CONFIG is now live; only docs remain.

---
*Phase: 115-core-shim-sdk-integration*
*Completed: 2026-04-17*
