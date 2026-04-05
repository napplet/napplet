# Phase 60: Initial NUB Interface Specs - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning
**Note:** This phase was pivoted from "Channel Protocol Implementation" to "Initial NUB Interface Specs." Old context is superseded.

<domain>
## Phase Boundary

Draft 6 NUB-WORD interface specs (NUB-RELAY, NUB-STORAGE, NUB-SIGNER, NUB-NOSTRDB, NUB-IPC, NUB-PIPES) using the TEMPLATE-WORD.md format. Content is extracted from NIP-5D v1 capability sections. NUB-PIPES uses Phase 59 pipe design decisions.

</domain>

<decisions>
## Implementation Decisions

### Spec Depth
- **D-01:** Claude adapts depth per spec. Specs referencing existing NIPs (NUB-SIGNER → NIP-07, NUB-NOSTRDB) get minimal treatment. Specs with rich protocol (NUB-RELAY, NUB-PIPES) get full template sections.

### NUB-PIPES
- **D-02:** Full wire format spec from Phase 59 design (PIPE_OPEN/PIPE_ACK/PIPE/PIPE_CLOSE/PIPE_BROADCAST, dTag targeting, shell-assigned pipe IDs). Marked with `draft` badge — unimplemented. Implementation deferred to future milestone.

### Source Material
- **D-03:** NIP-5D v1 (Phase 58 output, archived at specs/NIP-5D.md before v2 replaced it) had ~10 lines per capability. The content from those sections is the starting point for each NUB spec. Expand with API surface and shell behavior details from the existing codebase.

### File Location
- **D-04:** Specs go in specs/nubs/ directory: NUB-RELAY.md, NUB-STORAGE.md, NUB-SIGNER.md, NUB-NOSTRDB.md, NUB-IPC.md, NUB-PIPES.md.

### Claude's Discretion
- Which template sections to fill vs skip per spec
- Event kind assignments (extract from existing core/index.ts BusKind enum)
- Security section content per interface
- Whether to add usage examples

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### NUB Framework
- `specs/nubs/README.md` — Governance doc with dual-track model and interface registry
- `specs/nubs/TEMPLATE-WORD.md` — Interface proposal template (follow this format)
- `specs/nubs/TEMPLATE-NN.md` — Message protocol template (reference only, not used in this phase)

### Source Material for Each Spec
- `specs/NIP-5D.md` — NIP-5D v2 (191 lines). References NUB but doesn't define interfaces. The v1 content (499 lines) was the source — check git history if needed.
- `packages/shim/src/relay-shim.ts` — Source for NUB-RELAY API surface
- `packages/shim/src/state-shim.ts` — Source for NUB-STORAGE API surface
- `packages/shim/src/index.ts` — Source for NUB-SIGNER (window.nostr installation)
- `packages/shim/src/nipdb-shim.ts` — Source for NUB-NOSTRDB API surface
- `packages/shim/src/index.ts` — Source for NUB-IPC (emit/on)
- `packages/core/src/index.ts` — BusKind enum for event kind numbers

### Pipe Design Decisions
- `.planning/phases/59-channel-protocol-design/59-CONTEXT.md` (old, pre-pivot) — Pipe naming (pipes not channels), lifecycle verbs, broadcast semantics, targeting by dTag

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Each shim file (relay-shim.ts, state-shim.ts, nipdb-shim.ts, etc.) contains the exact API surface for its corresponding NUB spec
- BusKind enum in core/index.ts has all event kind numbers

### Established Patterns
- window.napplet.relay: subscribe(filter, onEvent), publish(event), query(filter)
- window.napplet.ipc: emit(topic, payload), on(topic, callback)
- window.napplet.storage: get(key), set(key, value), remove(key), keys(), clear()
- window.nostr: getPublicKey(), signEvent(event), nip04.*, nip44.*
- window.nostrdb: query(filter), add(event), event(id), subscribe(filter)

### Integration Points
- NUB specs reference the NIP-5D discovery mechanism: shell.supports("NUB-RELAY")
- Each spec defines which BusKind(s) it uses on the postMessage channel

</code_context>

<specifics>
## Specific Ideas

- NUB-SIGNER should be very short — just "provides NIP-07 window.nostr inside sandboxed iframe, shell proxies transparently"
- NUB-PIPES should be the most detailed since it's a new protocol with no implementation
- Each spec should include a "Discovery" section noting the shell.supports() identifier

</specifics>

<deferred>
## Deferred Ideas

- NUB message protocol specs (NUB-01, NUB-02, etc.) — interface specs first
- Pipe implementation in packages — separate milestone after NUB-PIPES spec is stable
- NUB repo creation on github.com/napplets

</deferred>

---

*Phase: 60-initial-nub-interface-specs (pivoted from 60-channel-protocol-implementation)*
*Context gathered: 2026-04-05*
