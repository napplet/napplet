# Phase 112: NUB Config Package Scaffold - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Scaffold the `@napplet/nub-config` npm package in `packages/nubs/config/` — types.ts with the 6 wire-message interfaces + `NappletConfigSchema`/`ConfigValues` type aliases + `x-napplet-*` potentiality types, plus package.json / tsconfig.json / tsup.config.ts / barrel (index.ts) matching the `@napplet/nub-identity` template exactly.

Addresses requirements NUB-01, NUB-02, NUB-05, NUB-06. Does NOT add shim.ts or sdk.ts (those are Phase 113).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Copy the shape of `packages/nubs/identity/` (the most recent NUB, best structural precedent). Use the same tsup config, tsconfig extends, package.json fields. The types are dictated by the NUB-CONFIG spec (now merged as napplet/nubs#13) and ARCHITECTURE.md's wire-message table.

Dependencies:
- `@napplet/core: workspace:*` as the only runtime dep
- `@types/json-schema@^7.0.15` as devDependency (for `JSONSchema7` type alias)
- `json-schema-to-ts@^3.1.1` as optional peerDependency (for opt-in `FromSchema` inference)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/nubs/identity/package.json` — template (most recent NUB, 9th)
- `packages/nubs/identity/tsup.config.ts` — template
- `packages/nubs/identity/tsconfig.json` — template
- `packages/nubs/identity/src/types.ts` — message type pattern (correlation-ID `id` field, `.result` suffix)
- `packages/nubs/identity/src/index.ts` — barrel export pattern (re-export types + DOMAIN constant)
- `packages/core/src/envelope.ts` — `NappletMessage` base interface to extend

### Established Patterns
- ESM-only, `verbatimModuleSyntax: true`, `moduleResolution: "bundler"`
- DOMAIN constant is `'config' as const` exported from index.ts
- File-per-concern: types.ts (message definitions), index.ts (barrel)
- Wire messages extend `NappletMessage<DOMAIN, ACTION>` pattern
- Correlation ID field `id: string` on request/response pairs

### Integration Points
- Added to pnpm workspace via `pnpm-workspace.yaml` glob (`packages/nubs/*`)
- Turborepo picks it up automatically via `turbo.json`
- `@napplet/core` is a workspace link — build depends on core
- Not yet registered in NubDomain (phase 115)
- Not yet mounted in shim (phase 115)

</code_context>

<specifics>
## Specific Ideas

Follow the 9th NUB (identity) layout exactly unless the spec demands otherwise. Type file structure:

```ts
// types.ts
import type { NappletMessage } from '@napplet/core';
import type { JSONSchema7 } from 'json-schema';

export type NappletConfigSchema = JSONSchema7;
export type ConfigValues = Record<string, unknown>;

export interface ConfigRegisterSchemaMessage extends NappletMessage<'config', 'registerSchema'> {
  id: string;
  schema: NappletConfigSchema;
  version?: number;
}
// ... 5 more message types + .result variants
// ... ConfigSchemaErrorMessage
// ... NappletConfigSchemaExtensions (x-napplet-secret, x-napplet-section, x-napplet-order)
```

</specifics>

<deferred>
## Deferred Ideas

None — pure infrastructure phase. shim.ts and sdk.ts are Phase 113. Core/shim/SDK integration is Phase 115.

</deferred>
