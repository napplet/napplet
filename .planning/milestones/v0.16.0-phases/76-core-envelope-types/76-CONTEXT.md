# Phase 76: Core Envelope Types - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Core package defines the envelope type system, message dispatch, and NUB registration — completely NUB-agnostic. This phase builds the infrastructure that NUB modules plug into.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase. Phase 75 created the envelope.ts stub and NUB scaffolds. This phase fleshes out the dispatch and registration system.

Key deliverables:
- NUB registration mechanism: a NUB module registers its domain and message type definitions
- Message dispatch: route inbound messages by domain prefix to the correct NUB handler
- Ensure NIP-01 verb constants are fully removed from core's public API (legacy.ts exists for backward compat but barrel should deprecation-warn)
- Type-level: discriminated union of NubMessage subtypes expandable by NUB modules

Phase 75 already created:
- packages/core/src/envelope.ts with NappletMessage, NubMessage, NubDomain, NUB_DOMAINS, ShellSupports
- packages/core/src/legacy.ts with deprecated BusKind
- packages/nubs/{relay,signer,storage,ifc}/ scaffolds with domain-typed message stubs

</decisions>

<code_context>
## Existing Code Insights

packages/core/src/envelope.ts has the base types. This phase adds dispatch and registration logic.

</code_context>

<specifics>
## Specific Ideas

No specific requirements.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
