# Phase 117: @napplet/nub Package Foundation - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Stand up a single `@napplet/nub` package at `packages/nub/` that houses source for all 9 NUB domains (relay, storage, ifc, keys, theme, media, notify, identity, config) and exposes 36 subpath entry points (9 barrels + 27 granular: types, shim, sdk per domain) through a `package.json` `exports` map. The package must declare `@napplet/core` as its sole runtime dep, keep `json-schema-to-ts` as an optional peerDep, set `sideEffects: false`, build clean with tsup, and forbid a root `.` export so consumers must use a domain subpath. No behavioral migration of the existing 9 `@napplet/nub-*` packages yet — that's phase 118.

Requirements covered: PKG-01, PKG-02, PKG-03, EXP-01, EXP-02, EXP-03, EXP-04, BUILD-01, BUILD-02.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Guidance:

- **Source layout**: mirror the existing `packages/nubs/<domain>/src/{types,shim,sdk,index}.ts` shape under `packages/nub/src/<domain>/`. Each domain's `index.ts` becomes the barrel (re-exports `./types`, `./shim`, `./sdk`).
- **Code source**: copy the current, shipping source out of `packages/nubs/<domain>/src/*` into `packages/nub/src/<domain>/*` verbatim. No logic changes this phase. Rewrite only the cross-file imports that point at `@napplet/nub-<otherdomain>` (none currently exist; each NUB is self-contained).
- **tsup config**: single `tsup.config.ts` with an `entry` object mapping all 36 entry points; format `['esm']`, `dts: true`, `sourcemap: true`, `clean: true`. Preserves the established pattern from existing NUB packages.
- **exports map shape**: `{ "./<domain>": { types: "./dist/<domain>/index.d.ts", import: "./dist/<domain>/index.js" }, "./<domain>/types": { ... }, "./<domain>/shim": { ... }, "./<domain>/sdk": { ... } }` for each of the 9 domains. No `.` entry.
- **Domain registration call**: the existing per-NUB `index.ts` files call `registerNub(DOMAIN, noop)` as a side effect. Barrel subpaths (`@napplet/nub/<domain>`) MUST preserve that registration call so `shell.supports('nub:<domain>')` keeps working when consumers import the barrel. The granular `/types` subpath MUST NOT register (types-only, tree-shakable from runtime code). The granular `/shim` and `/sdk` subpaths MAY register since anyone importing those wants the domain wired anyway — matching the existing behavior.
- **tsconfig**: extend the repo root `tsconfig.json` like the existing NUB packages do, `rootDir: "src"`, `outDir: "dist"`, `lib: ["ES2022", "DOM", "DOM.Iterable"]`.
- **Package metadata**: `version: 0.2.1` to match the current monorepo-wide version, `license: MIT`, `sideEffects: false`, `publishConfig.access: public`, keywords `["nostr","napplet","nub"]`, repository directory `packages/nub`.

### Non-negotiables
- No root `.` export (EXP-04 is enforceable by omitting the entry from the exports map).
- `@napplet/core` is the ONLY runtime dep.
- `json-schema-to-ts` peerDep must carry `peerDependenciesMeta.<name>.optional: true` so consumers without it get no pnpm warnings.
- `sideEffects: false` at the package root, even though the barrel + shim + sdk entry points have the `registerNub()` side effect. Bundlers that respect `sideEffects: false` will drop unused entry points wholesale; the side effect only fires for entry points that are actually imported. This is the same posture the existing NUB packages already ship.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- 9 existing `packages/nubs/<domain>/src/{types,shim,sdk,index}.ts` file sets — source is copied into the new package verbatim.
- Root `tsconfig.json` — new package extends it.
- Existing NUB `package.json` template (see `packages/nubs/relay/package.json`) — shape and metadata copied with name/exports changes.

### Established Patterns
- Each NUB package is `type: module`, `sideEffects: false`, ESM-only, builds with tsup, extends the root tsconfig.
- Barrel `index.ts` pattern: explicit `export type { ... }` blocks + explicit `export { ... }` for runtime, followed by a trailing `registerNub(DOMAIN, ...)` side-effect call.
- tsup produces one JS + one `.d.ts` per entry. Multi-entry is supported by passing an `entry` object.

### Integration Points
- Root `pnpm-workspace.yaml` must include `packages/nub` (or a matching glob) so pnpm picks up the new package. Current globs include `packages/*` and `packages/nubs/*` — need to verify.
- Root `turbo.json` pipeline will pick up the new package automatically (tasks are package-scoped via `pnpm --filter`).
- No downstream change this phase — shim/sdk still depend on `@napplet/nub-*`; phase 119 flips that.

</code_context>

<specifics>
## Specific Ideas

- Preserve `FromSchema` type inference for the config domain: the optional peerDep `json-schema-to-ts` on the new package must match the version currently pinned by `@napplet/nub-config`.
- Preserve the `@napplet/nub-config` pattern of NOT calling `registerNub` in its barrel (config's integration is done by the central shim). Mirror that exactly: `@napplet/nub/config` (barrel) should follow whatever pattern the current `@napplet/nub-config/src/index.ts` uses. Read it during planning; do not assume.
- Granular `@napplet/nub/<domain>/types` entry points must be pure type re-exports — zero runtime code, zero imports of `@napplet/core`. Letting a consumer import only types keeps their bundle clean even without bundler tree-shaking.

</specifics>

<deferred>
## Deferred Ideas

- Flipping imports inside `@napplet/shim` / `@napplet/sdk` — deferred to phase 119.
- Converting old `@napplet/nub-<domain>` packages into re-export shims — deferred to phase 118.
- Documentation — deferred to phase 120.

</deferred>
