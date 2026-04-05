# Phase 60: Channel Protocol Implementation - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement pipes in @napplet/shim and @napplet/runtime with test coverage validating the spec design from Phase 59. This is code implementation — the wire format and API design are locked.

</domain>

<decisions>
## Implementation Decisions

### Shim API Shape
- **D-01:** `window.napplet.pipes.open(targetType, opts?)` returns a Pipe object with WebSocket-like API: `{ send(data), close(), onMessage(cb), onClose(cb), id }`. Familiar pattern for developers.
- **D-02:** `window.napplet.pipes.broadcast(data)` for fan-out to all open pipes.

### Test Strategy
- **D-03:** Vitest unit tests first for runtime dispatch logic (mock postMessage). One Playwright smoke test for the full postMessage path. Full e2e with multiple napplets deferred — the demo needs more napplets first (separate milestone).

### Package Placement
- **D-04:** Follow existing file-per-concern pattern:
  - `packages/shim/src/pipes-shim.ts` — Pipe client API (window.napplet.pipes install)
  - `packages/runtime/src/pipe-handler.ts` — Pipe dispatch, lifecycle, broadcast fan-out
  - `packages/core/src/pipes.ts` — Pipe types, verb constants (PIPE_OPEN, PIPE_ACK, PIPE, PIPE_CLOSE, PIPE_BROADCAST)

### Wire Format (locked from Phase 59)
- **D-05:** PIPE_OPEN → PIPE_ACK → PIPE → PIPE_CLOSE + PIPE_BROADCAST
- **D-06:** Targeting by dTag (napplet type), optional pubkey refinement
- **D-07:** Shell-assigned opaque pipe IDs
- **D-08:** Payloads opaque to shell after PIPE_ACK — custom wire, not NIP-01 events

### Claude's Discretion
- Exact Pipe object TypeScript interface (field names, callback signatures)
- How pipe registry is stored in runtime (Map by pipeId)
- Error handling for target-not-found, target-disconnected
- Whether pipes need new BusKind entries or sit outside the kind system
- Number and scope of vitest test cases

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 59 Output (wire format spec)
- `.planning/phases/59-channel-protocol-design/59-CONTEXT.md` — All wire format decisions
- `.planning/phases/59-channel-protocol-design/59-01-PLAN.md` — NIP pipe section plan (reference for what the spec says)

### Existing Code (follow these patterns)
- `packages/shim/src/relay-shim.ts` — Pattern for shim file structure (subscribe/publish/query)
- `packages/shim/src/nipdb-shim.ts` — Pattern for request/response correlation with pending Map + timeout
- `packages/shim/src/state-shim.ts` — Pattern for shell-proxied operations
- `packages/shim/src/discovery-shim.ts` — Pattern for service capability exposure
- `packages/runtime/src/runtime.ts` — Message dispatch loop (where pipe verbs get added)
- `packages/runtime/src/state-handler.ts` — Pattern for handler files with topic-based dispatch
- `packages/core/src/index.ts` — BusKind enum, type exports

### Prior Phase Context
- `.planning/phases/57-nip-resolution-pre-engagement/57-CONTEXT.md` — NIP-5D identity
- `.planning/phases/58-core-protocol-nip/58-CONTEXT.md` — Spec style decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/shim/src/nipdb-shim.ts` — Request/response correlation pattern with pending Map, UUID correlation IDs, and timeouts. Pipes can reuse this for PIPE_OPEN → PIPE_ACK correlation.
- `packages/runtime/src/runtime.ts` — handleMessage dispatch switch. Pipe verbs get new cases here.
- `packages/core/src/index.ts` — BusKind enum for adding pipe-related kinds if needed.

### Established Patterns
- Shim files: install function called from index.ts, registers message handlers, exposes API on window.napplet.*
- Runtime dispatch: switch on verb/kind in handleMessage, delegate to handler functions
- Correlation: UUID id tags in events, pending Map, timeout rejection

### Integration Points
- `packages/shim/src/index.ts` — import and call installPipesShim() alongside other shim installs
- `packages/runtime/src/runtime.ts` — add PIPE_* verb handling in message dispatch
- `packages/core/src/index.ts` — export pipe types and constants
- Service discovery (kind 29010) — advertise pipes capability if shell supports it

</code_context>

<specifics>
## Specific Ideas

- The Pipe object should feel like a WebSocket — developers already know that API
- Pipe correlation (PIPE_OPEN → PIPE_ACK) should use the same UUID + pending Map pattern as nipdb-shim.ts
- Broadcast is fire-and-forget from the napplet side — no ACK needed

</specifics>

<deferred>
## Deferred Ideas

- Full Playwright e2e tests with multiple napplet iframes (needs more demo napplets — separate milestone)
- MessagePort upgrade for high-frequency pipes
- Binary/ArrayBuffer payloads

</deferred>

---

*Phase: 60-channel-protocol-implementation*
*Context gathered: 2026-04-05*
