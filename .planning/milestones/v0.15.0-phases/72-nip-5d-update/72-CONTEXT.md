# Phase 72: NIP-5D Update - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning
**Mode:** Auto-generated (docs phase — discuss skipped)

<domain>
## Phase Boundary

NIP-5D accurately describes the simplified wire protocol where napplets send unsigned messages and the shell handles identity. Remove AUTH handshake requirement, update to reflect message.source identity model.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — documentation phase. Update NIP-5D to match the new protocol reality established in Phases 70-71.

Key changes needed:
- Remove AUTH (NIP-42 challenge-response) as a required protocol step
- Describe identity as shell-assigned via message.source at iframe creation
- Wire protocol is plain NIP-01 messages from napplet to shell
- No napplet-side signing or keypair generation

</decisions>

<code_context>
## Existing Code Insights

NIP-5D.md is the terse external protocol spec (<200 lines). Lives at root of repo.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — documentation phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
