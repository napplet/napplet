# Phase 89: Core Integration - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Add 'keys' to the NubDomain union and NUB_DOMAINS array in envelope.ts. Add keys namespace to NappletGlobal type in types.ts. Surgical 2-file change.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All choices at Claude's discretion. Two files to edit:

1. `packages/core/src/envelope.ts` — Add `'keys'` to NubDomain union and NUB_DOMAINS array. Update JSDoc table.
2. `packages/core/src/types.ts` — Add `keys` namespace to NappletGlobal interface with `registerAction()`, `unregisterAction()`, `onAction()` methods.

Use inline structural types in NappletGlobal (NOT imports from @napplet/nub-keys) to avoid circular dependency — core cannot depend on NUB packages.

</decisions>

<canonical_refs>
## Canonical References

- `/home/sandwich/Develop/nubs/NUB-KEYS.md` — API surface section defines the interface
- `packages/core/src/envelope.ts` — NubDomain union to edit
- `packages/core/src/types.ts` — NappletGlobal interface to extend

</canonical_refs>

<code_context>
## Existing Code Insights

- NubDomain currently: `'relay' | 'signer' | 'storage' | 'ifc' | 'theme'`
- NUB_DOMAINS currently: `['relay', 'signer', 'storage', 'ifc', 'theme']`
- NappletGlobal has: relay, ipc, storage, shell namespaces
- Pattern: each namespace uses inline types (not imported from NUB packages)

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

*Phase: 89-core-integration*
*Context gathered: 2026-04-09*
