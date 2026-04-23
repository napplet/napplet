# Phase 129: Central SDK Integration - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning
**Mode:** Auto-generated (mechanical SDK barrel mirror — discuss skipped)

<domain>
## Phase Boundary

Mirror Phase 128 in `@napplet/sdk` so bundler consumers can import the resource NUB from a single named-exports surface:

1. Add `resource` namespace to `packages/sdk/src/index.ts` — re-export `bytes` and `bytesAsObjectURL` from `@napplet/nub/resource/sdk` (or `@napplet/nub/resource/shim` — executor's discretion based on existing pattern)
2. Re-export `RESOURCE_DOMAIN` const alongside the other domain constants (RELAY_DOMAIN, IDENTITY_DOMAIN, etc.)
3. Re-export all resource NUB types (`ResourceBytesMessage`, `ResourceBytesResultMessage`, `ResourceBytesErrorMessage`, `ResourceCancelMessage`, `ResourceSidecarEntry`, `ResourceErrorCode`, `ResourceScheme`, plus discriminated unions if any)

Mechanical mirror of how the prior 9 NUBs are exposed in `@napplet/sdk`. Reference identity / notify / config exposure patterns.

</domain>

<decisions>
## Implementation Decisions

### Locked Pattern (from prior 9 NUBs)

- `@napplet/sdk` exposes each NUB as a named namespace export (e.g., `import { resource } from '@napplet/sdk'`) AND individual types (e.g., `import type { ResourceBytesMessage } from '@napplet/sdk'`)
- Domain constant exposed as `RESOURCE_DOMAIN` (UPPER_SNAKE_CASE matching prior NUBs)
- All public types re-exported via `export type { ... }` blocks

### REQ Coverage

- **SDK-01**: `resource` namespace with named exports — explicit add to barrel
- **SDK-02**: `RESOURCE_DOMAIN` re-exported — explicit add
- **SDK-03**: All resource NUB types re-exported — explicit `export type` block

### Claude's Discretion

- Position within barrel (mirror identity/notify position)
- Whether to use barrel re-export (`export * from`) or explicit named re-exports (codebase pattern: explicit)
- JSDoc on new exports

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/sdk/src/index.ts` — current barrel; 9 NUBs exposed
- `packages/nub/src/resource/sdk.ts` — Phase 126 deliverable; exports `bytes`, `bytesAsObjectURL`
- `packages/nub/src/resource/types.ts` — Phase 126 deliverable; exports all envelope types
- `packages/nub/src/resource/index.ts` — barrel re-exporting both above

### Established Pattern

Each NUB in `@napplet/sdk/src/index.ts` typically follows:
```ts
import * as resource from '@napplet/nub/resource/sdk';
export { resource };
export const RESOURCE_DOMAIN = 'resource' as const;
export type { ResourceBytesMessage, ResourceBytesResultMessage, ... } from '@napplet/nub/resource/types';
```

The exact form may vary slightly per NUB. Read identity / notify / config exposures as canonical references.

### Integration Points

- `pnpm -r build` and `pnpm -r type-check` should remain green (full monorepo validated)
- Downstream Phase 130 will integrate vite-plugin (independent of this)

</code_context>

<specifics>
## Specific Ideas

Plan should fit in 1 plan with 1-2 tasks (single barrel file modification + verification).

</specifics>

<deferred>
## Deferred Ideas

- Tree-shaking validation for resource subpath (Phase 134 verification)
- SDK README update for resource (Phase 133 documentation sweep)

</deferred>
