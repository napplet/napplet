---
phase: 114-vite-plugin-extension
plan: 01
subsystem: infra
tags: [vite-plugin, nip-5a, json-schema, nub-config, schema-discovery]

# Dependency graph
requires:
  - phase: 111-nub-config-spec
    provides: NUB-CONFIG Core Subset definition + `x-napplet-secret`/`section`/`order` extensions and banned-keyword list ($ref, pattern, secret+default)
  - phase: 112-nub-config-package
    provides: canonical `@types/json-schema@^7.0.15` pin used across the repo
provides:
  - "Nip5aManifestOptions.configSchema?: JSONSchema7 | string option on @napplet/vite-plugin"
  - "discoverConfigSchema(options, root) helper implementing strict 4-step precedence"
  - "resolvedSchema + resolvedSchemaSource plugin-instance closure variables populated in async configResolved hook"
  - "projectRoot closure variable (absolute path from config.root) available to all hooks"
  - "Backward-compat behavior: no schema discovered => schema null, no error"
affects: [114-02-vite-plugin-guards, 114-03-vite-plugin-emit, 115-core-shim-sdk-integration, 116-documentation]

# Tech tracking
tech-stack:
  added:
    - "@types/json-schema@^7.0.15 (devDep on @napplet/vite-plugin)"
  patterns:
    - "Dynamic ESM import of user config files via file:// URL for cross-platform consistency"
    - "Plugin-instance closure variables as the sole contract surface between sibling plans in a phase"
    - "Strict-precedence discovery (no source merging) for extensible input plumbing"

key-files:
  created: []
  modified:
    - packages/vite-plugin/src/index.ts
    - packages/vite-plugin/package.json
    - packages/vite-plugin/tsconfig.json
    - pnpm-lock.yaml

key-decisions:
  - "Kept JSONSchema7 imported directly from 'json-schema' rather than re-exporting from @napplet/nub-config; vite-plugin must not depend on runtime NUB packages (build-time vs runtime layer separation)."
  - "napplet.config.* precedence fixed as ts -> js -> mjs with a single shared try/catch; .ts branch documented as forward-compat (Node 22 --experimental-strip-types) rather than first-class — authors are expected to use .js / .mjs today."
  - "Discovery runs in async configResolved (not config / buildStart) so config.root is authoritative and downstream hooks have a fully-populated closure before transformIndexHtml/closeBundle fire."
  - "mod.configSchema ?? mod.default?.configSchema import shape supports both named-export and default-export authoring styles without adding a required convention."
  - "Missing file advances to next step; parse/import/missing-export is a fatal build error prefixed '[nip5a-manifest]' and naming the offending path. Matches existing plugin logging prefix."

patterns-established:
  - "Async Vite plugin hook: async configResolved(config) awaits a discovery helper before populating closure state — Vite's Plugin type accepts void | Promise<void> so no type coercion needed."
  - "Three-path discovery (inline option + convention file + config module export) as the shape for any future plugin option that needs to accept inline-or-file-or-module input."
  - "Closure-variable hand-off between sibling plans within a phase: 114-01 populates, 114-02 reads, 114-03 reads. No module-scope state; pure closure capture on the factory."

requirements-completed: [VITE-01, VITE-02, VITE-03]

# Metrics
duration: 3min
completed: 2026-04-17
---

# Phase 114 Plan 01: configSchema + Three-Path Schema Discovery Summary

**Added `configSchema?: JSONSchema7 | string` to @napplet/vite-plugin with strict 4-step discovery (inline object → inline path → config.schema.json → napplet.config.{ts,js,mjs}) populating `resolvedSchema` closure state for downstream guards and emission in 114-02/03.**

## Performance

- **Duration:** ~3min
- **Started:** 2026-04-17T13:22:04Z
- **Completed:** 2026-04-17T13:24:55Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `Nip5aManifestOptions` exposes the new optional `configSchema` field accepting inline `JSONSchema7` object, an inline file path string (resolved against Vite project root), or omission (falls back to conventions).
- `discoverConfigSchema(options, root)` helper lands with strict no-merge precedence: inline option → `config.schema.json` → `napplet.config.ts`/`.js`/`.mjs` (reading a `configSchema` named export or `default.configSchema` fallback) → `{ schema: null, source: null }`.
- `configResolved` hook converted to async; captures `config.root` into a `projectRoot` closure var, awaits discovery, populates `resolvedSchema` + `resolvedSchemaSource` closure vars that are the sole contract surface consumed by plans 114-02 (structural guards) and 114-03 (manifest tag + meta injection + aggregateHash).
- `@types/json-schema@^7.0.15` added as devDep (matching the repo-wide pin in `@napplet/nub-config`); `tsconfig.json` `types` array extended to `["node", "json-schema"]`.
- Package build (`tsup`) + standalone type-check (`tsc --noEmit`) + full monorepo `pnpm -r type-check` all green. Emitted `dist/index.d.ts` surfaces `configSchema?: JSONSchema7 | string` so consumers see the option on the published type.
- Backward-compatible: when no schema is declared via any of the three paths, discovery returns null and the plugin emits no extra logging (future plans 02/03 will gate on this null).

## Task Commits

Each task was committed atomically:

1. **Task 1: Add @types/json-schema devDep + tsconfig types array entry** — `3a7d820` (chore)
2. **Task 2: configSchema option + discoverConfigSchema helper + configResolved integration** — `2d0c364` (feat)

Plan metadata commit to follow this summary write.

## Files Created/Modified
- `packages/vite-plugin/package.json` — Added `@types/json-schema@^7.0.15` to `devDependencies`.
- `packages/vite-plugin/tsconfig.json` — Extended `compilerOptions.types` from `["node"]` to `["node", "json-schema"]` so `JSONSchema7` resolves at type-check without triple-slash directives.
- `packages/vite-plugin/src/index.ts` — Added `import type { JSONSchema7 } from 'json-schema'`, extended `Nip5aManifestOptions` with `configSchema?: JSONSchema7 | string`, added ~70-line `discoverConfigSchema(options, root)` helper, added `projectRoot` + `resolvedSchema` + `resolvedSchemaSource` closure variables, converted `configResolved` to async with discovery integration. Existing `walkDir`/`sha256File`/`computeAggregateHash`/`transformIndexHtml`/`closeBundle` behavior left identical.
- `pnpm-lock.yaml` — pnpm updated to record the new @types/json-schema devDep link for @napplet/vite-plugin.

## Decisions Made

- **JSONSchema7 imported directly from `json-schema`, not re-exported from `@napplet/nub-config`.** The vite-plugin is build-time infrastructure; nub-config is a runtime NUB package. Keeping the type relationship structural avoids a circular layering concern and keeps vite-plugin's dependency graph minimal. The devDep version pin (`^7.0.15`) matches nub-config's pin exactly so both packages share the same type definition.
- **napplet.config.* precedence fixed as ts → js → mjs.** The `.ts` branch is present for forward compat (Node 22+ `--experimental-strip-types`), but Node's default ESM loader will throw on raw `.ts` in most environments. Documented via inline comment; phase 116 README will advise authors to use `.js` or `.mjs` today. No `tsx`/`esbuild` shell-out — zero new runtime dependency.
- **`mod.configSchema ?? mod.default?.configSchema` dual shape.** Supports both `export const configSchema = {...}` and `export default { configSchema: {...} }` authoring styles without picking a winner; preferred form will be documented in phase 116.
- **Discovery runs in `configResolved` (not `config` or `buildStart`).** `configResolved(config).root` is the canonical absolute project root; downstream hooks (`transformIndexHtml`, `closeBundle`) fire after it, so `resolvedSchema` is guaranteed populated by the time 114-03's emission hooks read it.
- **File-absent ≠ error; parse/import/missing-export = fatal.** Matches existing plugin behavior of graceful no-ops on missing optional config (e.g., `VITE_DEV_PRIVKEY_HEX` unset) while still surfacing misconfigurations clearly.

## Deviations from Plan

None — plan executed exactly as written. All acceptance greps passed on first run; standalone + monorepo type-check green on first attempt; tsup build clean; emitted `dist/index.d.ts` surfaces the new field unchanged.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **114-02 (structural guards / VITE-07):** Can read `resolvedSchema` directly from the plugin factory closure via adding the `validateConfigSchema()` call in `configResolved` (after discovery) or `buildStart`. The plugin-instance `resolvedSchemaSource` is available for error message provenance ("schema from <source> failed: …").
- **114-03 (manifest tag + meta + aggregateHash / VITE-04/05/06):** Can read `resolvedSchema` in `closeBundle` for the `['config', JSON.stringify(schema)]` tag + synthetic `config:schema` aggregateHash path, and in `transformIndexHtml` for the `<meta name="napplet-config-schema">` injection.
- **Contract surface is frozen:** `resolvedSchema: JSONSchema7 | null` on the plugin closure. Neither sibling plan needs to reimplement discovery or know about the three source paths.

## Self-Check: PASSED

Verified:
- `packages/vite-plugin/src/index.ts` FOUND (modified, ~330 LOC)
- `packages/vite-plugin/package.json` FOUND (contains `@types/json-schema@^7.0.15`)
- `packages/vite-plugin/tsconfig.json` FOUND (contains `"json-schema"`)
- `packages/vite-plugin/dist/index.d.ts` FOUND (surfaces `configSchema?: JSONSchema7 | string`)
- Commit `3a7d820` FOUND (`chore(114-01): add @types/json-schema devDep to @napplet/vite-plugin`)
- Commit `2d0c364` FOUND (`feat(114-01): add configSchema option + three-path schema discovery`)
- `pnpm -r type-check` exit 0 across all 13 packages
- `pnpm --filter @napplet/vite-plugin build` exit 0 (ESM 7.10 KB + DTS 2.66 KB)

---
*Phase: 114-vite-plugin-extension*
*Completed: 2026-04-17*
