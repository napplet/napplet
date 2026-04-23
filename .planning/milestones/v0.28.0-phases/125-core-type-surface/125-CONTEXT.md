# Phase 125: Core Type Surface - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

The shared type vocabulary downstream packages need to compile against the resource NUB exists in `@napplet/core`. Specifically:

- `'resource'` added to `NubDomain` union type and `NUB_DOMAINS` runtime constant array in `packages/core/src/envelope.ts`
- `resource: { bytes, bytesAsObjectURL }` namespace declaration added to `NappletGlobal` interface in `packages/core/src/types.ts`
- `perm:strict-csp` documented as a valid identifier under the existing `perm:${string}` template literal in `NamespacedCapability` (JSDoc clarification only; no type widening required)

This phase ships TYPE DECLARATIONS only. No runtime behavior, no shim integration, no envelope handling. Downstream phases (126 NUB scaffold, 128 shim integration, 130 vite-plugin) consume these types.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All implementation choices are at Claude's discretion — pure infrastructure phase per autonomous workflow's infrastructure detection rule. The phase satisfies all three infrastructure criteria:

1. Goal keywords match: "type vocabulary", "exists in `@napplet/core`" (scaffolding/setup)
2. Success criteria are all technical: imports resolve, type-check exits 0, no user-facing behavior
3. No "users can / displays / shows / presents" language anywhere

Use ROADMAP success criteria as the sole spec; mirror the established pattern from prior NubDomain additions (e.g., v0.25.0 added `'config'`, v0.24.0 added `'identity'`, v0.23.0 added `'notify'`).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/core/src/envelope.ts` — current `NubDomain` union and `NUB_DOMAINS` constant; add `'resource'` following the alphabetical (or insertion-order) pattern already established
- `packages/core/src/types.ts` — current `NappletGlobal` interface with namespaces for each existing NUB (`relay`, `identity`, `storage`, `ifc`, `theme`, `notify`, `keys`, `media`, `config`); add `resource` namespace mirroring the established shape
- `packages/core/src/types.ts` — existing `NamespacedCapability` template literal `perm:${string}` already accepts `perm:strict-csp` without modification; only JSDoc clarification is needed

### Established Patterns

- Type-only changes; no runtime, no test fixtures
- Build/type-check via `pnpm --filter @napplet/core build` and `pnpm --filter @napplet/core type-check`
- 9 prior NubDomain additions followed an identical pattern; reference those commits if needed

### Integration Points

- All consumers of `NubDomain` and `NappletGlobal` (shim, sdk, NUB packages) get the new value/property automatically once core builds
- No breaking changes; pure additive

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. The ROADMAP success criteria fully constrain the deliverable:

1. `import { type NubDomain } from '@napplet/core'` resolves a union including `'resource'`
2. `NUB_DOMAINS` array includes `'resource'`
3. `import { type NappletGlobal } from '@napplet/core'` exposes `resource.bytes` and `resource.bytesAsObjectURL` signatures
4. `NamespacedCapability` JSDoc / README documents `perm:strict-csp`
5. `pnpm --filter @napplet/core build` and `type-check` exit 0

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase, scope locked.

</deferred>
