# Phase 59: Channel Protocol Design - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Design the pipe wire format, broadcast semantics, and write the NIP pipe section. This is protocol design — the implementation is Phase 60. Output is the pipe capability section of NIP-5D plus a wire format specification.

</domain>

<decisions>
## Implementation Decisions

### Naming
- **D-01:** Use "pipes" not "channels." `window.napplet.pipes`. Avoids collision with NIP-28 (Public Chat) which uses "channels." Verbs prefixed with PIPE_.

### Lifecycle Verbs
- **D-02:** Four verbs in the wire format:
  - `PIPE_OPEN` — Napplet requests a pipe to a target. Contains targetType (dTag) and optional targetKey (session pubkey).
  - `PIPE_ACK` — Shell confirms pipe opened. Contains shell-assigned pipeId. Sent after auth verification.
  - `PIPE` — Data message on an open pipe. Contains pipeId and arbitrary payload. Custom wire format — NOT NIP-01 events.
  - `PIPE_CLOSE` — Either side tears down the pipe. Contains pipeId.

### Broadcast
- **D-03:** Dedicated `PIPE_BROADCAST` verb. Napplet sends PIPE_BROADCAST(data), shell fans out to ALL open pipes for that napplet. Simple — no named groups, no subscription model. Shell-mediated fan-out.

### Targeting
- **D-04:** Primary targeting by dTag (napplet type from manifest). `PIPE_OPEN(targetType: "synth-plugin")`. Shell resolves to instance(s).
- **D-05:** Optional refinement by session pubkey. `PIPE_OPEN(targetType: "synth-plugin", targetKey: "abc...")` for when you need a specific instance.
- **D-06:** Shell assigns opaque pipe IDs. How the shell resolves multiple instances of the same type is a runtime decision, not NIP-specified.

### Auth on Open
- **D-07:** PIPE_OPEN triggers auth verification by the shell (the napplet must have completed AUTH handshake). Target napplet does NOT opt-in — shell mediates. If auth fails, shell sends PIPE_CLOSE with error reason.

### Wire Format After Open
- **D-08:** After PIPE_ACK, PIPE messages carry arbitrary payloads — not NIP-01 events. The whole point is escaping NIP-01 overhead for low-latency use cases. Payload format is opaque to the shell (shell just routes by pipeId).

### Claude's Discretion
- JSON structure of each verb's payload (exact field names)
- Whether PIPE_CLOSE carries a reason code or just the pipeId
- Error handling for edge cases (target not found, target disconnected mid-pipe)
- Whether to include sequence diagrams in the NIP section (recommended: yes, one diagram)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research
- `.planning/research/FEATURES-CHANNELS.md` — Channel (now pipe) protocol feature landscape: lifecycle patterns, postMessage performance, broadcast models, framework comparison
- `.planning/research/ARCHITECTURE.md` — NIP structure, capability negotiation patterns
- `.planning/research/PITFALLS.md` — NIP-28/29 naming collision risk (now resolved by using "pipes")

### Prior Phase Context
- `.planning/phases/57-nip-resolution-pre-engagement/57-CONTEXT.md` — NIP-5D number, positioning
- `.planning/phases/58-core-protocol-nip/58-CONTEXT.md` — Spec style decisions (one example per verb, API surface + behavior, sequence diagrams)

### Source Protocol
- `SPEC.md` §3 — AUTH handshake (pipes use the same auth model)
- `packages/core/src/index.ts` — BusKind definitions (pipes are a new bus kind or sit outside the kind system)
- `packages/shim/src/index.ts` — Current window.napplet.ipc (emit/on) — pipes complement this, don't replace it

### External
- NIP-28 — Public Chat "channels" (the reason we're using "pipes" instead)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/shim/src/index.ts` — IPC emit/on pattern. Pipes will follow a similar shim installation pattern but with different verbs.
- `packages/runtime/src/runtime.ts` — Message dispatch loop. Pipe verbs will need new dispatch branches.
- `packages/core/src/index.ts` — BusKind enum. May need new kinds for pipe verbs, or pipes may sit outside the NIP-01 event system entirely.

### Established Patterns
- postMessage wire format: JSON arrays `[verb, ...args]` (matches NIP-01 relay protocol)
- Shell mediates all napplet-to-napplet communication (no direct iframe-to-iframe)
- Auth verification on every sensitive operation

### Integration Points
- Pipe verbs integrate into the same postMessage listener as NIP-01 verbs
- Shell's dispatch loop needs to recognize PIPE_* verbs alongside REQ/EVENT/CLOSE
- Service discovery (kind 29010) may need to advertise pipe capability

</code_context>

<specifics>
## Specific Ideas

- DAW use case as the litmus test: BPM sync = PIPE_BROADCAST, VST parameter changes = PIPE to specific instance
- Pipe payloads should support both JSON and potentially ArrayBuffer/typed arrays for audio data (but NIP only needs to specify JSON — binary is a runtime optimization)
- The sequence diagram style from Phase 58 (AUTH) should be consistent — use same format for pipe lifecycle diagram

</specifics>

<deferred>
## Deferred Ideas

- Named broadcast groups (PIPE_JOIN/PIPE_LEAVE) — deferred unless the simple fan-out proves insufficient
- MessagePort upgrade for high-frequency pipes — deferred to post-v1
- Binary/ArrayBuffer payloads — runtime optimization, not NIP-specified

</deferred>

---

*Phase: 59-channel-protocol-design*
*Context gathered: 2026-04-05*
