# Phase 115: Core / Shim / SDK Integration + Wire - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Make `'config'` a first-class NUB domain throughout the monorepo:
1. Add `'config'` to `NubDomain` union + `NUB_DOMAINS` array in `packages/core/src/envelope.ts`
2. Add inline `config` namespace to `NappletGlobal` in `packages/core/src/types.ts` (structural types, not imported — matches identity precedent)
3. `@napplet/shim` adds `@napplet/nub-config` as workspace dep, imports `installConfigShim` + `handleConfigMessage`, mounts at install time, adds `config.*` routing branch in the central envelope dispatcher
4. `@napplet/sdk` adds `@napplet/nub-config` as workspace dep, re-exports `config` convenience wrappers, all nub-config message types, `CONFIG_DOMAIN`, and `installConfigShim`
5. `shell.supports('config')` / `shell.supports('nub:config')` probes work per existing `NamespacedCapability` convention

Addresses requirements WIRE-01..06 (all 6 wire messages round-tripping), CORE-01, CORE-02, SHIM-01, SDK-01, CAP-01.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices at Claude's discretion — pure integration phase. Mirror the v0.24.0 identity-NUB integration pattern (Phase 109) exactly. Surgical edits only; no refactoring of existing code.

### Integration pattern (derived from nub-identity precedent)
1. `packages/core/src/envelope.ts` — add `'config'` literal to NubDomain union + NUB_DOMAINS const array
2. `packages/core/src/types.ts` — add `config` namespace to NappletGlobal using INLINE structural types (not imported from @napplet/nub-config — core must not depend on nub packages)
3. `packages/shim/package.json` — add `@napplet/nub-config: workspace:*`
4. `packages/shim/src/index.ts` — import + call `installConfigShim()`, route `config.*` messages to `handleConfigMessage`
5. `packages/sdk/package.json` — add `@napplet/nub-config: workspace:*`
6. `packages/sdk/src/index.ts` — re-export `config` namespace + all message types + CONFIG_DOMAIN + installConfigShim

### NamespacedCapability (CAP-01)
`shell.supports()` already uses template literal types (`nub:<domain>` | bare domain). Adding `'config'` to NubDomain automatically flows through — no additional work needed for probing. Must verify it works.

### Resolve onSchemaError harmonization note from phase 113
Phase 113 flagged that `onSchemaError` returns `() => void` (plan-locked) vs spec sketch `Subscription`. In this phase, the NappletGlobal.config type surface in core/types.ts must match whatever the shim actually exposes. Plan-locked `() => void` is what ships.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/core/src/envelope.ts` — current NubDomain union (add `'config'` literal)
- `packages/core/src/types.ts` — current NappletGlobal (add inline config namespace)
- `packages/shim/src/index.ts` — existing mount pattern for installIdentityShim/installRelayShim/etc
- `packages/sdk/src/index.ts` — existing re-export pattern for identity/relay/storage/etc
- `packages/nubs/config/` — phase 112/113 output; source of truth for API shape

### Established Patterns (from v0.24.0 nub-identity integration — Phase 109)
- Core types use INLINE structural types (core must stay dependency-free of NUB packages)
- Shim imports + mounts via installXShim() side-effect call
- Shim routes messages by domain prefix to handleXMessage()
- SDK uses `export * as identity from '@napplet/nub-identity'` or similar namespace pattern
- SDK also re-exports message type definitions for bundler consumers

### Integration Points
- packages/core/src/envelope.ts
- packages/core/src/types.ts
- packages/shim/package.json
- packages/shim/src/index.ts
- packages/sdk/package.json
- packages/sdk/src/index.ts

Wire tests (WIRE-01..06 round-trip) can be verified via existing test infrastructure OR via manual confirmation through build + type-check (since there's no demo/runtime test harness in this repo).

</code_context>

<specifics>
## Specific Ideas

- Verify after changes: `grep -c "config" packages/core/src/envelope.ts` ≥ 2 (union + array); `grep "napplet.config" packages/core/src/types.ts`
- Build gate: full monorepo `pnpm type-check` must stay green
- Capability probing: `shell.supports('config')` and `shell.supports('nub:config')` — since NamespacedCapability is already `${NubDomain} | nub:${NubDomain} | ...`, adding NubDomain literal is sufficient

</specifics>

<deferred>
## Deferred Ideas

None — this phase completes the integration; phase 116 documents it.

</deferred>
