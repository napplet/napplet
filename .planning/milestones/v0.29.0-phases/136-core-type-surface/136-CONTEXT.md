# Phase 136: Core Type Surface - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning
**Mode:** Infrastructure phase — smart discuss skipped (no user-facing behavior; symbols + types only)

<domain>
## Phase Boundary

Add the type-surface symbols in `@napplet/core` that downstream phases (137 nub subpaths, 138 vite-plugin, 139 central shim/SDK) need to compile. Pure TypeScript patch — no runtime behavior, no wire protocol, no file creation. Two domain identifiers (`'connect'`, `'class'`), two `NappletGlobal` fields (`connect: NappletConnect` required, `class?: number` optional), and a `@deprecated` JSDoc annotation on `perm:strict-csp`.

**In scope:**
- `packages/core/src/envelope.ts` — add `'connect'` and `'class'` to `NubDomain` union and `NUB_DOMAINS` array (end state: 12 entries total)
- `packages/core/src/types.ts` — add `connect: NappletConnect` to `NappletGlobal` mirroring the `resource:` block; add `class?: number` to `NappletGlobal` (optional because shells may not implement `nub:class`; napplet reads `undefined` when shell doesn't implement the NUB or before `class.assigned` wire arrives); mark `perm:strict-csp` as `@deprecated` in JSDoc on `NamespacedCapability` with a pointer to `nub:connect` + `nub:class` as the superseders
- `NappletConnect` interface definition — lives in `packages/nub/src/connect/types.ts` per Phase 137 scope, but `packages/core/src/types.ts` imports or re-declares a minimal structural type for `NappletGlobal.connect` field typing. Decision deferred to planning: import from `@napplet/nub/connect/types` (creates a compile-time dependency edge core → nub/connect) vs. declare a compatible local interface and cross-check structural equality at build.

**Out of scope (future phases):**
- `@napplet/nub/connect` subpath files (Phase 137)
- `@napplet/nub/class` subpath files (Phase 137)
- Vite-plugin changes (Phase 138)
- Central shim/SDK integration (Phase 139)
- Any new wire protocol handlers (none — NUB-CONNECT has no wire; NUB-CLASS's wire handler lives in `@napplet/nub/class/shim.ts`)

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All implementation choices are at Claude's discretion — pure infrastructure phase. Follow existing `@napplet/core` conventions (ESM-only, strict TypeScript, file-per-concern). Key references:

- `packages/core/src/envelope.ts` currently has 10 entries in `NubDomain` + `NUB_DOMAINS`; end state is 12 (add `'connect'` + `'class'`).
- `packages/core/src/types.ts` has a `NappletGlobal` interface with existing namespace blocks (`relay`, `identity`, `storage`, `ifc`, `theme`, `notify`, `media`, `keys`, `config`, `resource`). The `resource:` block is the closest structural mirror for the new `connect:` field.
- `NamespacedCapability` type in `packages/core/src/types.ts` is a template-literal union with `nub:`, `perm:`, `svc:` prefixes. `perm:strict-csp` is already present; add `@deprecated` JSDoc with supersession pointer.

### NappletConnect interface sourcing — DEFERRED to planner

Planner decides whether `NappletGlobal.connect`'s type comes from:
- **(a)** `import type { NappletConnect } from '@napplet/nub/connect/types'` — creates a dependency edge core → nub/connect, cleanest single-source-of-truth, but couples core's build to nub's build in a way that may conflict with the historical "core is zero-dep" principle
- **(b)** Minimal structural type declared inline in `packages/core/src/types.ts` — preserves core's zero-dep independence, duplicates the interface shape in two places with a compile-time structural-equality comment or test

Similar decision for `class?: number` — this is just `number`, no interface, so no sourcing question.

Planner picks based on what keeps `pnpm --filter @napplet/core build` + `type-check` green with minimal surface area.

### perm:strict-csp deprecation annotation

`@deprecated` JSDoc on the capability mention in `NamespacedCapability`. The deprecation pointer reads: "Superseded by `nub:connect` + `nub:class` (v0.29.0). Shells implementing NUB-CONNECT and NUB-CLASS replace the v0.28.0 `perm:strict-csp` model."

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/core/src/envelope.ts` — current `NubDomain` + `NUB_DOMAINS` (10 entries; v0.28.0 added `'resource'` as the 10th)
- `packages/core/src/types.ts` — `NappletGlobal` interface with existing namespace blocks; `NamespacedCapability` template-literal type; `ShellSupports` interface
- v0.28.0 Phase 125 (`Phase 125: Core Type Surface`) is the closest structural precedent — same pattern: add one domain to `NubDomain` + `NUB_DOMAINS`, add one namespace block to `NappletGlobal`. Phase 136 does this twice (connect + class).

### Established Patterns

- `@napplet/core` is zero-dep by design — no imports from `@napplet/nub`, `@napplet/shim`, `@napplet/sdk`. Deviation requires explicit justification.
- ESM-only, strict TypeScript (`verbatimModuleSyntax: true`), file-per-concern
- JSDoc on every public symbol; `@deprecated` tag with supersession pointer for removed/superseded features

### Integration Points

- `packages/core/src/envelope.ts` (add to `NubDomain` + `NUB_DOMAINS`)
- `packages/core/src/types.ts` (add to `NappletGlobal`, annotate `NamespacedCapability`)
- Possibly `packages/core/src/index.ts` if `NappletConnect` / `NappletClass` types are re-exported at the core package barrel

</code_context>

<specifics>
## Specific Ideas

- Phase 125 (v0.28.0) added `'resource'` to `NubDomain` + `NUB_DOMAINS` and added `resource: NappletResource` to `NappletGlobal`. Mirror that pattern exactly for `'connect'` + `NappletGlobal.connect`, and apply the optional variant (`class?: number`) for `NappletGlobal.class`.
- The `NappletConnect` interface shape is locked by CONTEXT at Phase 135: `readonly granted: boolean; readonly origins: readonly string[]`. The planner must produce a type in `@napplet/core` that matches this shape regardless of sourcing strategy.
- The `class?: number` typing: do NOT use a number literal union type (e.g., `1 | 2`). The class space is extensible (future NUBs may define new classes); narrowing now would block future additions.

</specifics>

<deferred>
## Deferred Ideas

- Any non-type changes (Phase 137+ scope)
- Runtime behavior / wire handlers
- NappletConnect sourcing implementation choice (planner decides per "Claude's Discretion" note above)

</deferred>
