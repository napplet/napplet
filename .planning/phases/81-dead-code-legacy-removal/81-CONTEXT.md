# Phase 81: Dead Code & Legacy Removal - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning
**Mode:** Auto-generated (cleanup phase)

<domain>
## Phase Boundary

Delete every dead service discovery artifact, legacy constant, and backward-compat shim from the codebase. This is an unreleased monorepo — no backward compatibility needed.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure cleanup phase. Delete files, remove exports, remove types, remove tests.

Specific deletions:
- `packages/shim/src/discovery-shim.ts` — entire file
- `window.napplet.services` API from `packages/shim/src/index.ts`
- `ServiceDescriptor`/`ServiceInfo` types from `packages/core/src/types.ts`
- `NappletGlobal.services` type definition from `packages/core/src/types.ts`
- `packages/core/src/legacy.ts` — entire file
- Legacy re-exports from `packages/core/src/index.ts` (BusKind, DESTRUCTIVE_KINDS, VERB_REGISTER, VERB_IDENTITY, AUTH_KIND, BusKindValue)
- Legacy tests from `packages/core/src/index.test.ts` (BusKind constants, DESTRUCTIVE_KINDS, handshake exports)
- `napplet-napp-type` meta tag fallback from `packages/shim/src/index.ts`
- `napplet-napp-type` duplicate injection from `packages/vite-plugin/src/index.ts`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to delete
- `packages/shim/src/discovery-shim.ts` — entire file, dead service discovery
- `packages/core/src/legacy.ts` — entire file, deprecated NIP-01 constants

### Files to edit
- `packages/core/src/index.ts` — remove legacy re-exports
- `packages/core/src/types.ts` — remove ServiceDescriptor, ServiceInfo, NappletGlobal.services
- `packages/core/src/index.test.ts` — remove BusKind and legacy tests
- `packages/shim/src/index.ts` — remove services API and napplet-napp-type fallback
- `packages/vite-plugin/src/index.ts` — remove napplet-napp-type duplicate injection

</canonical_refs>

<code_context>
## Existing Code Insights

### Key facts
- `DESTRUCTIVE_KINDS` already has an independent copy in `packages/nubs/signer/src/types.ts` — the core copy is purely dead
- `discovery-shim.ts` imports `query` from `relay-shim.js` and `NostrEvent`/`ServiceInfo` from `@napplet/core`
- `window.napplet.services` is wired in `shim/src/index.ts` lines 334-343
- SDK re-exports `DESTRUCTIVE_KINDS` from `@napplet/nub-signer`, not from core — safe to remove from core

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward deletion.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>

---

*Phase: 81-dead-code-legacy-removal*
*Context gathered: 2026-04-08*
