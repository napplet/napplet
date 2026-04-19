# Phase 118: Deprecation Re-Export Shims - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Convert each of the 9 existing `@napplet/nub-<domain>` packages (relay, storage, ifc, keys, theme, media, notify, identity, config) into a 1-line re-export shim that forwards to `@napplet/nub/<domain>`. Each old package keeps its published name + version, so pinned consumers see zero behavioral change. Each old package is flagged `@deprecated` (README banner + `[DEPRECATED]` description prefix). The new `@napplet/nub` added in Phase 117 becomes the canonical location for all 9 domains.

Requirements covered: MIG-01, MIG-02, MIG-03.

No consumer migration (that's phase 119). No documentation updates beyond the per-package deprecation banners + description prefix (broader docs are phase 120).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Guidance:

- **Re-export shape**: Each `packages/nubs/<domain>/src/index.ts` is reduced to a single `export * from '@napplet/nub/<domain>';` line (plus a short `@deprecated` JSDoc block above it referencing the new path). This transparently passes through types, runtime exports, AND the `registerNub` side effect (where present) because `export *` re-imports the source module — the side effect fires once when anything imports the old name.
- **Delete redundant source files**: `packages/nubs/<domain>/src/{types,shim,sdk}.ts` become dead code after the index is re-pointed — delete them. Only `index.ts` stays. Theme already has no shim.ts / sdk.ts — delete only its types.ts (now dead).
- **Add `@napplet/nub` as runtime dep** on each old package: `packages/nubs/<domain>/package.json` gains `"@napplet/nub": "workspace:*"` as a `dependency`. The old `@napplet/core` dep can stay (transitively satisfied via `@napplet/nub`, but harmless as a direct dep during deprecation) or be removed — remove it to reduce dep surface. For `@napplet/nub-config` only, preserve the `json-schema-to-ts` optional peerDep and `@types/json-schema` devDep — those are API-surface contracts even behind the shim.
- **`@deprecated` metadata**:
  - `package.json` `description` field prefixed with literal `[DEPRECATED]` (e.g. `"[DEPRECATED] Use @napplet/nub/relay instead. Relay NUB module."`). This is what npm registry + pnpm / npm clients surface.
  - Top-of-README deprecation banner: markdown block naming the replacement path and the removal milestone target.
  - Optional: `publishConfig.deprecated` field. Not all registries honor this in source; the authoritative deprecation mark happens at `npm deprecate` time against a published version. Out of scope for this phase (PUB-04 blocker) — handled here only via the `[DEPRECATED]` description prefix and README banner.
- **Version bump**: each deprecated package bumps from `0.2.1` → `0.3.0` to signal the shim conversion as a breaking(-in-spirit) internal release, matching the monorepo-wide jump. Alternatively, treat the shim conversion as a 0.2.2 patch — prefer whatever is consistent with the changeset convention the repo uses. Inspect `.changeset/` if present; otherwise pick 0.3.0 for a clear signal.
- **Removal milestone**: the deprecation banner names the intended removal milestone. Use **"a future milestone"** rather than naming a specific version — the Future Requirements section of REQUIREMENTS.md tracks `REMOVE-01..03` without committing to a version.
- **Build must stay green**: `pnpm --filter '@napplet/nub-<domain>'...' build` must exit 0 for all 9 packages after conversion. tsup re-exports the single `index.ts` successfully. The emitted dist surfaces the re-exports as-is — consumers importing from `@napplet/nub-<domain>` transparently get everything `@napplet/nub/<domain>` exports.
- **Preserve CHANGELOG.md**: existing CHANGELOG.md files stay — add one entry per package documenting the deprecation.

### Non-negotiables
- Zero behavioral change for existing consumers of `@napplet/nub-<domain>` package names.
- The existing package names + published identities stay intact.
- `registerNub` side effect still fires when anyone imports the deprecated package name (guaranteed by `export *` re-export semantics).
- `@napplet/nub` is not touched — it's the canonical source now, and its shape is frozen for this phase.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- 9 existing `packages/nubs/<domain>/` package folders with package.json, tsup.config.ts, tsconfig.json, src/, README.md, CHANGELOG.md — keep the package.json metadata (minus the runtime deps rewrite) and the build config; only the src/ gets reduced.
- `@napplet/nub` from Phase 117 — already exposes `./<domain>`, `./<domain>/types`, `./<domain>/shim` (8 domains), `./<domain>/sdk` (8 domains).

### Established Patterns
- Each NUB package follows the same layout + build pipeline — mechanical, 9-way parallel work per file type.
- `export *` preserves both types AND runtime exports; TypeScript's `verbatimModuleSyntax: true` does not interfere.

### Integration Points
- No dependency graph changes for phase 119: `@napplet/shim` + `@napplet/sdk` still import from `@napplet/nub-<domain>` until 119 migrates them.
- Root pnpm-workspace.yaml already picks up `packages/nubs/*` — unchanged.

</code_context>

<specifics>
## Specific Ideas

- **Theme special case**: `packages/nubs/theme/` already has only `index.ts` + `types.ts`. Post-conversion it keeps only `index.ts` (re-exports `@napplet/nub/theme`). The old `types.ts` gets deleted.
- **Config special case**: `packages/nubs/config/` has the optional `json-schema-to-ts` peerDep + `@types/json-schema` devDep. Both MUST carry over onto the old package.json after conversion — otherwise the `FromSchema` type surface breaks for anyone pinning `@napplet/nub-config`.
- The deprecated README banner format (template to reuse across all 9):
  ```markdown
  > ⚠️ **DEPRECATED** — This package is a re-export shim for backwards compatibility.
  > **Migrate to `@napplet/nub/<domain>`** — all types, shim installers, and SDK
  > helpers are now exported from there. This package will be removed in a future
  > milestone.
  ```
- Old `tsup.config.ts` can be simplified: `entry: ['src/index.ts']` stays — no change needed, just builds the one-line re-export.

</specifics>

<deferred>
## Deferred Ideas

- Actually deleting the old packages from the repo — deferred to Future Requirements (REMOVE-01..03).
- Running `npm deprecate` against published versions — blocked on PUB-04 (human npm auth).
- Flipping internal `@napplet/shim` / `@napplet/sdk` imports to the new paths — phase 119.
- Updating any external documentation, NIP-5D examples, or the `skills/` directory — phase 120.

</deferred>
