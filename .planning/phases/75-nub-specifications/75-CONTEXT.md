# Phase 75: NUB Specifications - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Write 4 NUB specs defining protocol messages within the NIP-5D JSON envelope. Each NUB owns a message domain. Specs go in specs/nubs/.

</domain>

<decisions>
## Implementation Decisions

### General NUB Structure
- Each NUB spec is self-contained, references NIP-5D for envelope format only
- Message types use `domain.action` format (e.g., `relay.subscribe`)
- Each spec defines all valid type strings, payload shapes, and expected shell behavior
- NUB specs should follow the same prescriptive style as the updated NIP-5D

### NUB-RELAY
- Domain: `relay`
- Messages: subscribe, event, close, eose, ok, notice, count
- Napplet sends: relay.subscribe, relay.publish, relay.close, relay.count
- Shell sends: relay.event, relay.eose, relay.closed, relay.ok, relay.notice, relay.count.result
- Filter format follows NIP-01 filter semantics (kinds, authors, ids, tag filters, since/until/limit)
- Events are unsigned templates from napplet (kind, content, tags, created_at — no id/pubkey/sig)
- Shell stamps identity and routes to relay pool

### NUB-SIGNER
- Domain: `signer`
- Exposes NIP-07-like operations over the envelope: sign, get-public-key, nip04/nip44 encrypt/decrypt
- Request/response pattern with correlation IDs
- Shell decides how to fulfill (NIP-07, NIP-46, or other backing signer)

### NUB-STORAGE
- Domain: `storage`
- Scoped key-value storage proxied through shell
- Operations: get, set, delete, keys
- Storage scoped by napplet identity (dTag + aggregateHash)
- Shell enforces quotas

### NUB-IFC (Inter-Frame Communication)
- Domain: `ifc`
- Merges former IPC + PIPES concepts
- Two modes:
  - **Dispatch**: fire-and-forget messages, each goes through ACL individually
  - **Channel**: opened once with ACL check at open, subsequent messages flow without per-message ACL
- Topic-based routing (napplet publishes to a topic, shell routes to subscribers)

</decisions>

<code_context>
## Existing Code Insights

NUB specs previously existed in specs/nubs/ but were moved to a separate nubs repo in v0.14.0. We're creating fresh specs here that align with the new JSON envelope format.

Current NIP-5D at specs/NIP-5D.md defines the envelope: `{ type: "domain.action", ...payload }`.

</code_context>

<specifics>
## Specific Ideas

Keep specs concise — each should be readable in under 5 minutes. Focus on message catalog + payload shapes + shell behavior. Don't over-specify implementation.

</specifics>

<deferred>
## Deferred Ideas

- NUB-NOSTRDB (local database queries) — future milestone
- NUB governance framework — future milestone

</deferred>
