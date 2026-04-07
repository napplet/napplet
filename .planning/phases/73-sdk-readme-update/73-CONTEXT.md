# Phase 73: SDK & README Update - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning
**Mode:** Auto-generated (docs phase — discuss skipped)

<domain>
## Phase Boundary

All package documentation reflects the no-crypto API surface so developers never encounter stale signing references. Update READMEs for @napplet/shim, @napplet/sdk, @napplet/core, and the root monorepo.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — documentation phase. Key changes:
- @napplet/shim README: remove nostr-tools peer dep, keypair/signing/AUTH references
- @napplet/sdk README: remove signing/ephemeral key references
- @napplet/core README: reflect removed handshake types
- Root README: update Key Concepts to describe identity as shell-assigned via message.source

</decisions>

<code_context>
## Existing Code Insights

READMEs are at packages/shim/README.md, packages/sdk/README.md, packages/core/README.md, and README.md (root).

</code_context>

<specifics>
## Specific Ideas

No specific requirements — documentation phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
