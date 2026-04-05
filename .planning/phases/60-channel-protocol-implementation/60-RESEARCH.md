# Phase 60: Channel Protocol Implementation - Research

**Researched:** 2026-04-05
**Question:** What do I need to know to PLAN this phase well?

## 1. Wire Format (Locked — Phase 59)

The pipe protocol uses 5 verbs over the existing postMessage wire format:

| Verb | Direction | Format |
|------|-----------|--------|
| `PIPE_OPEN` | napplet -> shell | `["PIPE_OPEN", { targetType, targetKey?, name? }]` |
| `PIPE_ACK` | shell -> both | `["PIPE_ACK", { pipeId, peer: { pubkey, dTag } }]` |
| `PIPE` | bidirectional | `["PIPE", pipeId, payload]` |
| `PIPE_CLOSE` | bidirectional | `["PIPE_CLOSE", pipeId, reason?]` |
| `PIPE_BROADCAST` | napplet -> shell | `["PIPE_BROADCAST", payload]` |

Key details:
- PIPE_OPEN targets by dTag (napplet type), optionally refined by session pubkey
- Shell assigns opaque pipeId after auth verification
- PIPE_ACK sent to BOTH endpoints simultaneously
- PIPE payloads are opaque to shell (custom wire, not NIP-01 events)
- PIPE_BROADCAST fans out as individual PIPE messages to all peers (sender excluded)
- Errors during PIPE_OPEN use `["PIPE_CLOSE", null, "reason"]` (null pipeId)

Error reasons: `auth-required`, `target-not-found`, `acl-denied`, `peer-disconnected`

## 2. Shim API Surface (from CONTEXT D-01, D-02)

The `window.napplet.pipes` namespace exposes:

| Method | Returns | Description |
|--------|---------|-------------|
| `open(targetType, options?)` | `Promise<PipeHandle>` | Open pipe to target napplet type |
| `onOpen(callback)` | `{ close() }` | Listen for incoming pipe connections |
| `broadcast(payload)` | `void` | Fan out to all pipe peers |

`PipeHandle` provides:
- `id: string` — shell-assigned pipe identifier
- `peer: { pubkey: string, dTag: string }` — connected peer identity
- `send(payload): void` — send data to peer
- `on(callback): { close() }` — listen for incoming data
- `close(): void` — close the pipe
- `onClose(callback): void` — listen for close notification

## 3. Codebase Integration Points

### Shim Side (`packages/shim/`)

**New file: `packages/shim/src/pipes-shim.ts`**

Pattern to follow: `nipdb-shim.ts` (request/response correlation with pending Map + timeout)

The file needs:
1. Module-level state: `pendingPipeOpens` Map for PIPE_OPEN → PIPE_ACK correlation
2. Active pipes registry: `Map<string, PipeHandle>` keyed by pipeId
3. Incoming pipe listener: callbacks registered via `onOpen()`
4. Message handler function that routes PIPE_ACK, PIPE, PIPE_CLOSE from parent
5. `installPipesShim()` function that adds the message listener and returns cleanup

**Integration in `packages/shim/src/index.ts`:**
- Import and call `installPipesShim()` during initialization
- Add `pipes` property to the `window.napplet` global object

**Type changes in `packages/core/src/types.ts`:**
- Add `PipeHandle` interface
- Add `PipeOpenOptions` interface
- Add `pipes` property to `NappletGlobal` interface

### Runtime Side (`packages/runtime/`)

**New file: `packages/runtime/src/pipe-handler.ts`**

Pattern to follow: `state-handler.ts` (topic-based dispatch with session registry lookup)

The file needs:
1. Pipe registry: `Map<string, PipeEntry>` where PipeEntry = `{ id, endpointA, endpointB, name? }`
   - endpointA/B are windowIds
2. `handlePipeOpen(windowId, msg, ...)` — validate auth, check ACL, resolve target, assign pipeId, send PIPE_ACK to both endpoints
3. `handlePipe(windowId, msg, ...)` — lookup pipeId, forward to peer
4. `handlePipeClose(windowId, msg, ...)` — remove from registry, notify peer
5. `handlePipeBroadcast(windowId, msg, ...)` — iterate all pipes where windowId is an endpoint, forward to each peer
6. `cleanupWindowPipes(windowId)` — remove all pipes involving this window, notify peers (called from `destroyWindow`)

**Integration in `packages/runtime/src/runtime.ts`:**
- Add PIPE_OPEN, PIPE, PIPE_CLOSE, PIPE_BROADCAST cases to `dispatchVerb()` switch
- These are NOT NIP-01 EVENT messages — they are top-level verbs like REGISTER
- Auth verification: check `sessionRegistry.getPubkey(windowId)` before handling
- Call `cleanupWindowPipes(windowId)` in `destroyWindow()`

**Important dispatch detail:** PIPE_* verbs sit at the same level as REQ/EVENT/CLOSE/AUTH/REGISTER in the dispatch switch. They are NOT routed through `handleEvent()` because they are not NIP-01 events. The `dispatchVerb()` function in runtime.ts (line ~224) needs new cases.

### Core Side (`packages/core/`)

**Additions to `packages/core/src/constants.ts`:**
- Add pipe verb constants: `VERB_PIPE_OPEN`, `VERB_PIPE_ACK`, `VERB_PIPE`, `VERB_PIPE_CLOSE`, `VERB_PIPE_BROADCAST`

**Additions to `packages/core/src/index.ts`:**
- Export the new verb constants and types

## 4. ACL Integration

The CONTEXT (D-07) says PIPE_OPEN triggers auth verification. The spec says a new capability `pipe:connect` should be checked.

Current capabilities in `packages/core/src/types.ts`:
```
'relay:read' | 'relay:write' | 'cache:read' | 'cache:write' | 'hotkey:forward' | 'sign:event' | 'sign:nip04' | 'sign:nip44' | 'state:read' | 'state:write'
```

Need to add `'pipe:connect'` to the Capability union type.

The enforce gate (`packages/runtime/src/enforce.ts`) resolves capabilities from messages. Need to add resolution for PIPE_OPEN → `pipe:connect`.

## 5. Session Registry Usage

Pipe targeting by dTag requires looking up which windowId(s) have a given napplet type. The session registry (`packages/runtime/src/session-registry.ts`) provides:
- `getPubkey(windowId)` — get pubkey for a window
- `getEntry(pubkey)` — get SessionEntry (has dTag, windowId)

For target resolution by dTag, we need to iterate entries. Let me check what's available.

The runtime needs to resolve `targetType` (dTag) to a windowId. The session registry may need a `getByDTag(dTag)` method, or the pipe handler can iterate all entries. Since the session registry stores entries keyed by pubkey, a lookup by dTag requires iteration. A small helper `findWindowByDTag(dTag, sessionRegistry)` in the pipe handler is sufficient — no need to modify the registry interface.

If `targetKey` (session pubkey) is provided, resolution is direct via `getEntry(targetKey)`.

## 6. Test Strategy (from CONTEXT D-03)

**Vitest unit tests for runtime pipe handler:**
- Located in `packages/runtime/src/pipe-handler.test.ts` (follows existing `dispatch.test.ts` pattern)
- Uses `createMockRuntimeAdapter()` from `test-utils.ts`
- Test cases:
  1. PIPE_OPEN succeeds and sends PIPE_ACK to both endpoints
  2. PIPE_OPEN fails with auth-required when sender not authenticated
  3. PIPE_OPEN fails with target-not-found when no matching napplet
  4. PIPE_OPEN fails with acl-denied when pipe:connect capability is denied
  5. PIPE data forwarding from A to B
  6. PIPE data forwarding from B to A
  7. PIPE with invalid pipeId is silently dropped
  8. PIPE_CLOSE from initiator notifies peer
  9. PIPE_CLOSE from peer notifies initiator
  10. PIPE_BROADCAST fans out to all peers (sender excluded)
  11. PIPE_BROADCAST with no open pipes is a no-op
  12. Window destruction cleans up all pipes and notifies peers
  13. Sending PIPE after PIPE_CLOSE is silently dropped

**One Playwright smoke test (optional, deferred):**
- Full postMessage path with two napplet iframes — deferred per CONTEXT D-03

## 7. Existing Test Infrastructure

Unit tests use vitest with node environment. The `createMockRuntimeAdapter` in `test-utils.ts` provides:
- `hooks: RuntimeAdapter` — full mock adapter
- `sent: SentMessage[]` — recorded messages to napplets
- `aclChecks: AclCheckEvent[]` — recorded ACL checks
- `stateStore: Map<string, string>` — in-memory state
- `reset()` — clear all recorded data

The `authenticateWindow()` helper in `dispatch.test.ts` completes the AUTH handshake for a test window. The pipe handler tests need the same pattern — authenticate two windows, then test pipe operations between them.

## 8. Validation Architecture

### Confidence Levels
- **Wire format:** HIGH — locked from Phase 59, JSON array convention matches existing verbs
- **Shim API:** HIGH — WebSocket-like API pattern is well-understood, correlation pattern from nipdb-shim.ts is proven
- **Runtime dispatch:** HIGH — adding verb cases to dispatchVerb() is mechanical
- **ACL integration:** HIGH — adding pipe:connect follows existing capability pattern exactly
- **Test coverage:** HIGH — vitest infrastructure and mock adapter are well-established

### Risks
- **Target resolution ambiguity:** When multiple instances of the same napplet type exist and no targetKey is provided, the shell must choose one. The spec says "shell selects an instance" — the plan should specify first-match behavior.
- **Message ordering:** PIPE_ACK must arrive at both endpoints before PIPE data. Since postMessage is synchronous per-window, this is guaranteed by sending ACK before returning from handlePipeOpen.
- **Broadcast performance:** Iterating all pipes for every broadcast is O(n). Acceptable for v1 (few napplets), but the plan should note this as a future optimization target.

### Verification Strategy
1. `pnpm test:unit` passes (existing + new pipe tests)
2. `pnpm type-check` passes (new types are sound)
3. `pnpm build` succeeds (new exports are wired correctly)
4. Manual: `window.napplet.pipes` namespace exists on shim import

---

## RESEARCH COMPLETE

*Phase: 60-channel-protocol-implementation*
*Researched: 2026-04-05*
