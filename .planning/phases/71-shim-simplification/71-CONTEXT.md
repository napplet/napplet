# Phase 71: Shim Simplification - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Napplet developers include @napplet/shim with zero crypto dependencies — the shim sends plain NIP-01 messages and never touches keys or signatures. Remove all signing code, keypair generation, AUTH handling, and drop nostr-tools peer dependency.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key context from Phase 70: handshake types (RegisterPayload, IdentityPayload, VERB_REGISTER, VERB_IDENTITY, AUTH_KIND) were removed from @napplet/core. Deprecated copies were placed in packages/shim/src/types.ts as a bridge — these should now be removed along with all code that uses them.

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
