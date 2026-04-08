# Phase 83: Dead Code Removal - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning
**Mode:** Auto-generated (cleanup phase)

<domain>
## Phase Boundary

Delete every confirmed dead code artifact from the codebase: handshake types, unused functions, dead re-export files, and incorrectly-exported internals. Update tests to match. Build must pass clean.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure cleanup phase. Delete types, remove exports, delete files, update tests.

Specific actions:

**DEAD-01: Remove handshake types**
- Delete `RegisterPayload` interface (core/types.ts:107-112)
- Delete `IdentityPayload` interface (core/types.ts:129-138)
- Delete the entire `// ─── Handshake Message Payloads` section (core/types.ts:95-138)
- Remove `RegisterPayload` and `IdentityPayload` from core/index.ts exports (line 44-45)

**DEAD-02: Remove getNappletType()**
- Delete `getNappletType()` function from shim/index.ts (lines 158-161)
- Function is defined but never called anywhere

**DEAD-03: Delete shim/types.ts**
- Delete `packages/shim/src/types.ts` entirely
- File re-exports `NostrEvent`, `NostrFilter`, `PROTOCOL_VERSION`, `SHELL_BRIDGE_URI` from core
- Nothing imports from this file

**DEAD-04: Privatize nipdb exports**
- Remove `export` keyword from `nipdbSubscribeHandlers` (nipdb-shim.ts:41)
- Remove `export` keyword from `nipdbSubscribeCancellers` (nipdb-shim.ts:46)
- Both Maps are only used internally within nipdb-shim.ts

**DEAD-05: Update tests**
- Remove any tests in core/index.test.ts that reference deleted types
- Verify remaining tests pass: `pnpm build && pnpm type-check`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to edit
- `packages/core/src/types.ts` — remove RegisterPayload, IdentityPayload
- `packages/core/src/index.ts` — remove handshake type exports
- `packages/core/src/index.test.ts` — remove tests for deleted exports
- `packages/shim/src/index.ts` — remove getNappletType()
- `packages/shim/src/nipdb-shim.ts` — privatize exported Maps

### Files to delete
- `packages/shim/src/types.ts` — dead re-export file

### Verification
- `pnpm build && pnpm type-check` must pass with zero errors

</canonical_refs>

<code_context>
## Existing Code Insights

### Key facts
- `RegisterPayload` and `IdentityPayload` are never imported outside core — handshake protocol was removed in v0.15.0
- `getNappletType()` reads a `<meta name="napplet-type">` tag but nothing calls it — the napplet-napp-type meta fallback was already removed in Phase 81
- `shim/types.ts` has only 2 export lines — a grep confirms zero importers
- `nipdbSubscribeHandlers`/`nipdbSubscribeCancellers` are used by `installNostrDb()` and internal handlers only
- Phase 81 already deleted legacy.ts, ServiceDescriptor, ServiceInfo, and services API — this continues that cleanup

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward deletion with build verification.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 83-dead-code-removal*
*Context gathered: 2026-04-08*
