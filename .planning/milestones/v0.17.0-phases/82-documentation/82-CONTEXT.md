# Phase 82: Documentation - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning
**Mode:** Auto-generated (documentation phase)

<domain>
## Phase Boundary

Update all package READMEs and NIP-5D to reflect the cleaned-up API: namespaced shell.supports(), removed services API, removed BusKind/legacy constants.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — documentation update phase. Read each README and NIP-5D, remove outdated references, add namespaced supports() documentation.

Specific updates:
- `packages/core/README.md` — remove BusKind table, remove ServiceDescriptor/ServiceInfo docs, add namespaced supports() docs
- `packages/shim/README.md` — remove services API section, remove discovery docs, update supports() docs
- `packages/sdk/README.md` — remove services namespace docs, update supports() examples
- `NIP-5D.md` — update if it references old flat supports() or kind 29010

</decisions>

<canonical_refs>
## Canonical References

### Files to update
- `packages/core/README.md`
- `packages/shim/README.md`
- `packages/sdk/README.md`
- `NIP-5D.md` (if it exists in this repo)

### Source of truth
- `packages/core/src/envelope.ts` — NamespacedCapability type definition
- `packages/core/src/types.ts` — NappletGlobal type (no more services)

</canonical_refs>

<code_context>
## Existing Code Insights

Phase 80 added NamespacedCapability type. Phase 81 deleted legacy.ts, discovery-shim.ts, ServiceDescriptor/ServiceInfo, NappletGlobal.services. READMEs still reference the old API.

</code_context>

<specifics>
## Specific Ideas

No specific requirements.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>

---

*Phase: 82-documentation*
*Context gathered: 2026-04-08*
