# Phase 74: NIP-5D Rewrite - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewrite NIP-5D as the transport+identity+manifest+NUB-negotiation spec. Zero protocol message definitions — those move to NUB specs. Define the generic JSON envelope format.

</domain>

<decisions>
## Implementation Decisions

### Wire Format
- Generic JSON envelope: `{ type, ...payload }` replaces NIP-01 arrays
- NIP-5D defines the envelope structure but does NOT enumerate message types — NUBs do that
- The `type` field is a string discriminant (e.g., `"relay.subscribe"`, `"signer.sign"`)

### Transport
- postMessage between napplet iframe and parent shell
- `'*'` target origin required (sandboxed iframes have opaque origins)

### Identity
- Shell identifies napplets via unforgeable `MessageEvent.source` Window reference
- Identity established at iframe creation — shell knows dTag + aggregateHash from manifest
- No handshake, no AUTH, no napplet-side crypto

### Sandbox Policy
- Spec MUST say `sandbox="allow-scripts"` only — minimal trust
- Everything else (popups, forms, modals, downloads) is a shell-granted privilege
- Shell MAY add additional sandbox tokens based on its own policy

### NUB Negotiation
- Manifest declares `requires` tags for NUB interfaces the napplet needs
- Shell declares what it supports
- Compatibility check at load time
- `window.napplet.shell.supports('relay')` — napplet can query at runtime
- Short names: `relay`, `signer`, `storage`, `ifc` — NOT spec identifiers like `NUB-RELAY`
- Same method also covers sandbox permissions: `window.napplet.shell.supports('popups')`
- Services keep their existing separate API: `window.napplet.services.has('audio')`

### What NIP-5D References But Does NOT Define
- Protocol messages (→ NUB-RELAY, NUB-SIGNER, NUB-STORAGE, NUB-IFC)
- Service discovery protocol (→ existing service discovery mechanism)
- ACL enforcement (→ shell/runtime implementation detail)

</decisions>

<code_context>
## Existing Code Insights

Current NIP-5D is at specs/NIP-5D.md (~112 lines after v0.15.0). It still contains relay verb tables and protocol message definitions that need to move to NUBs.

</code_context>

<specifics>
## Specific Ideas

The NIP should be short enough that a NIP reviewer can understand the entire protocol in 5 minutes. The complexity lives in NUBs, not the NIP.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
