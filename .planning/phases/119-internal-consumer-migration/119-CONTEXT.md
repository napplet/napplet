# Phase 119: Internal Consumer Migration - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Migrate every internal consumer in this monorepo from the deprecated `@napplet/nub-<domain>` package names to the new `@napplet/nub/<domain>` subpaths. Scope:

- `@napplet/shim` — imports installers and runtime helpers; use the `/shim` granular subpaths. 8 domains have shim subpaths (`@napplet/nub/<domain>/shim`); theme has no shim subpath and the shim currently integrates theme inline, so theme continues to use its barrel or type-only path.
- `@napplet/sdk` — imports from domain barrels to preserve its `export * as <domain>` pattern for types + `DOMAIN` constants + installers + bare-name SDK helpers. Uses `@napplet/nub/<domain>` (barrel) where it re-exports multiple concerns; may use granular subpaths where it only needs types.

After this phase: zero occurrences of `@napplet/nub-<domain>` in first-party code under `packages/shim/src/` and `packages/sdk/src/` (the old package names remain only inside the deprecated `packages/nubs/<domain>/` shims themselves).

Requirements covered: CONS-01, CONS-02, CONS-03.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Guidance:

- **`@napplet/shim` migration**: Each import line in `packages/shim/src/index.ts` that imports from `@napplet/nub-<domain>` must be re-pointed at `@napplet/nub/<domain>/shim` (for 8 domains with real shim subpaths) or `@napplet/nub/<domain>` barrel (for theme, which has no shim subpath). The existing import list (verified from grep):
  - `@napplet/nub-keys` (installer + handlers) → `@napplet/nub/keys/shim`
  - `@napplet/nub-media` (installer + handlers) → `@napplet/nub/media/shim`
  - `@napplet/nub-notify` (installer + handlers) → `@napplet/nub/notify/shim`
  - `@napplet/nub-storage` (installer + nappletStorage) → `@napplet/nub/storage/shim`
  - `@napplet/nub-relay` (subscribe/publish/query helpers) → `@napplet/nub/relay/shim`
  - `@napplet/nub-identity` (installer + handlers) → `@napplet/nub/identity/shim`
  - `@napplet/nub-ifc` (installer + emit/on + handlers) → `@napplet/nub/ifc/shim`
  - `@napplet/nub-config` (installer + handlers) → `@napplet/nub/config/shim`
  - Type imports (e.g., `IfcEventMessage`) → `@napplet/nub/ifc/types`
  - Shim package.json `dependencies`: replace all 8 `@napplet/nub-<domain>: workspace:*` entries with a single `@napplet/nub: workspace:*`. Keep `@napplet/core: workspace:*` (shim needs it directly too).

- **`@napplet/sdk` migration**: Each re-export block that currently sources from `@napplet/nub-<domain>` must be re-pointed at `@napplet/nub/<domain>` (the barrel — preserves existing `export * as <domain>` pattern and keeps types + runtime together). 9 domains all via barrel:
  - 9 `export type { ... } from '@napplet/nub/<domain>'` type re-export blocks
  - 9 `export { DOMAIN as <DOMAIN>_DOMAIN } from '@napplet/nub/<domain>'` constant re-exports
  - 8 `export { install<Domain>Shim } from '@napplet/nub/<domain>'` (theme has no installer; match whatever sdk currently re-exports for theme)
  - Bare-name SDK helper re-exports (relaySubscribe, identityGet*, storageGetItem, etc.) → `@napplet/nub/<domain>` (barrel includes SDK surface)
  - SDK package.json `dependencies`: replace all 9 `@napplet/nub-<domain>: workspace:*` entries with a single `@napplet/nub: workspace:*`. Keep `@napplet/core: workspace:*`.

- **JSDoc example blocks**: `packages/sdk/src/index.ts` header JSDoc shows example imports like `import { relaySubscribe } from '@napplet/nub-relay';`. Update these example paths to `@napplet/nub/relay` (or appropriate subpath). These are string literals inside JSDoc comments, not actual imports, but they're consumer-facing.

- **Build green contract**: After the migration, `pnpm -r build` + `pnpm -r type-check` both exit 0 across the full monorepo. Additionally the deprecated `@napplet/nub-<domain>` packages still build (they re-export `@napplet/nub/<domain>` from Phase 118).

- **Runtime behavior unchanged**: The `window.napplet` shape and the JSON envelope wire format are completely unchanged. This is purely an import-path refactor.

### Non-negotiables
- Zero remaining `@napplet/nub-<domain>` import specifiers in `packages/shim/src/` and `packages/sdk/src/`.
- `packages/shim/package.json` and `packages/sdk/package.json` lose all 9 (or 8+9=varies) `@napplet/nub-<domain>` dependency entries, gain a single `@napplet/nub: workspace:*`.
- Deprecated packages under `packages/nubs/<domain>/` are UNTOUCHED this phase (they self-reference `@napplet/nub/<domain>` from Phase 118 — do not re-migrate them).
- No behavioral change to the shim's runtime logic, the sdk's re-export surface, or the `window.napplet` shape.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 117 shipped 34 subpath entries on `@napplet/nub` — all imports we need exist and resolve.
- Phase 118 left the deprecated packages as transparent re-exports; if a shim/sdk migration step is missed, builds still work because the old name still resolves.

### Established Patterns
- `packages/shim/src/index.ts` is the single source file for the shim package — 61 references total across shim + sdk per preflight scan.
- `packages/sdk/src/index.ts` follows the existing `export * as <domain>` pattern with per-domain type/installer/helper re-exports.

### Integration Points
- `packages/shim/package.json` dependencies: currently has 8 `@napplet/nub-<domain>` deps (all except theme, which shim handles inline) + `@napplet/core`. Phase 119 reduces deps to `@napplet/nub` + `@napplet/core`.
- `packages/sdk/package.json` dependencies: currently has 9 `@napplet/nub-<domain>` deps + `@napplet/core`. Phase 119 reduces deps to `@napplet/nub` + `@napplet/core`.
- No demo / test / fixture directories exist at the repo top level (verified via `ls`). CONS-03 (demo/test consumers) is therefore satisfied trivially — no consumers to migrate.

</code_context>

<specifics>
## Specific Ideas

- **Use `@napplet/nub/<domain>/shim` for the shim migration, not the barrel**: the barrel pulls in types + sdk helpers the shim doesn't need. Granular `/shim` subpath keeps the shim's import graph narrow.
- **Use barrels for the sdk**: sdk's job is aggregation — re-export types + installers + helpers together. Barrel is the natural fit.
- **Theme exception**: theme has no `/shim` and no `/sdk` subpath. The shim's theme integration is inline (see `packages/shim/src/index.ts:859` from prior scan — but that line is a comment, re-verify during planning). If the shim imports any theme types, use `@napplet/nub/theme/types`. If sdk re-exports theme, use `@napplet/nub/theme` barrel.
- **Single atomic import swap per file**: this is a mechanical find-replace, but the swap must happen in full per file (don't leave a file half-migrated). Build + type-check are the safety net.
- **No `IfcEventMessage` from shim**: the shim imports `IfcEventMessage` from `@napplet/nub-ifc` — that's a type-only import, route it to `@napplet/nub/ifc/types`.

</specifics>

<deferred>
## Deferred Ideas

- Updating the deprecated packages' re-exports to a different path — NOT needed; Phase 118 already points them at `@napplet/nub/<domain>`.
- Changing the `window.napplet` shape or anything about the runtime protocol — out of scope.
- Documentation updates (READMEs, NIP-5D) — Phase 120.
- Deleting the deprecated packages — future milestone (REMOVE-01..03).

</deferred>
