# Phase 59: Channel Protocol Design - Research

**Researched:** 2026-04-05
**Phase:** 59 — Channel Protocol Design
**Focus:** Wire format specification, naming rationale, NIP section structure

---

## Research Question

"What do I need to know to PLAN the pipe wire format, broadcast semantics, and NIP section well?"

---

## 1. Naming Decision: "Pipes" Not "Channels"

### The Collision

NIP-28 defines "Public Chat Channels" using event kinds 40-44. The term "channel" in the Nostr ecosystem already means relay-based public chat rooms. Using "channels" for the napplet point-to-point IPC primitive would cause confusion in NIP review and among developers.

NIP-29 (Relay-based Groups) also uses channel-adjacent terminology with kinds 9000-9022 and 39000-39003.

### Decision Context (from 59-CONTEXT.md D-01)

The user has decided: **use "pipes" not "channels."** The verb prefix is `PIPE_`. The API namespace is `window.napplet.pipes`.

### Rationale Summary

| Term | Problem | Status |
|------|---------|--------|
| channels | Collides with NIP-28 Public Chat (kinds 40-44) | Rejected |
| connections | Too generic, ambiguous with WebSocket/relay connections | Not considered |
| links | Ambiguous with hyperlinks | Not considered |
| pipes | Unique in Nostr ecosystem, evokes Unix pipe semantics (data flow between processes), no NIP collision | **Selected** |

### Impact on Wire Format

All verb names use `PIPE_` prefix: `PIPE_OPEN`, `PIPE_ACK`, `PIPE`, `PIPE_CLOSE`, `PIPE_BROADCAST`.

This is clean because:
- No existing NIP-01 verb starts with `PIPE_`
- The prefix groups all pipe-related messages visually in protocol traces
- `PIPE` (data message) is a deliberate short form -- high-frequency messages need minimal overhead

---

## 2. Wire Format Design Analysis

### Verb Inventory (from 59-CONTEXT.md D-02)

Four lifecycle verbs plus one broadcast verb:

| Verb | Direction | Purpose | Payload |
|------|-----------|---------|---------|
| `PIPE_OPEN` | Napplet → Shell | Request a pipe to a target | `{targetType, targetKey?}` |
| `PIPE_ACK` | Shell → Napplet(s) | Confirm pipe opened | `{pipeId, peer}` |
| `PIPE` | Either → Shell → Other | Data message on open pipe | Arbitrary JSON payload |
| `PIPE_CLOSE` | Either → Shell | Tear down pipe | `{pipeId}` |
| `PIPE_BROADCAST` | Napplet → Shell | Fan out to all peers | Arbitrary JSON payload |

### JSON Array Format (Following Existing Convention)

The existing napplet protocol uses JSON arrays with verb-first format (matching NIP-01):

```
["VERB", arg1, arg2, ...]
```

Proposed pipe wire format follows this convention:

```json
["PIPE_OPEN", {"targetType": "synth-plugin", "targetKey": "abc...", "name": "audio-data"}]
["PIPE_ACK", {"pipeId": "p1", "peer": {"pubkey": "def...", "dTag": "synth-plugin"}}]
["PIPE", "p1", <payload>]
["PIPE_CLOSE", "p1"]
["PIPE_CLOSE", "p1", "target-disconnected"]
["PIPE_BROADCAST", <payload>]
```

### Design Decisions to Make

**PIPE_OPEN payload fields:**
- `targetType` (required): dTag of target napplet type — primary targeting mechanism (D-04)
- `targetKey` (optional): Session pubkey of specific instance — refinement for multi-instance (D-05)
- `name` (optional): Named pipe for multiplexing (from research: WebExtensions `runtime.connect({name})` pattern)

**PIPE_ACK payload fields:**
- `pipeId` (required): Shell-assigned opaque identifier (D-06)
- `peer` (required): Identity of the connected peer `{pubkey, dTag}` — both sides need to know who they're talking to

**PIPE data message structure:**
- Position 1: pipeId (string) — for routing
- Position 2: payload (any JSON-serializable value) — opaque to shell (D-08)
- Minimal envelope: `["PIPE", "p1", <payload>]` = ~20 bytes overhead

**PIPE_CLOSE payload:**
- Position 1: pipeId (string)
- Position 2 (optional): reason string — useful for error cases ("target-disconnected", "auth-failed", "acl-denied")

**PIPE_BROADCAST payload:**
- Position 1: payload (any JSON-serializable value)
- Shell delivers as individual `["PIPE", "<pipeId>", <payload>]` to each recipient (D-03)
- Sender is excluded from broadcast delivery (matching existing IPC_PEER sender-exclusion precedent)

### Shell-Mediated Routing

All pipe messages flow through the shell (D-07). The shell:
1. Receives PIPE_OPEN from initiator
2. Verifies initiator has completed AUTH handshake
3. Checks ACL for pipe capability (if shell implements ACL)
4. Resolves target by dTag (and optional targetKey)
5. Forwards PIPE_OPEN to target as incoming pipe request
6. Receives PIPE_ACK from target (or generates it automatically — design choice)
7. Forwards PIPE_ACK back to initiator with assigned pipeId
8. After that, routes PIPE messages by pipeId

### Open Question: Target Opt-In vs Auto-Accept

Two models:

**Model A — Target accepts explicitly (WebExtensions pattern):**
```
Napplet A → Shell: PIPE_OPEN(targetType: "synth")
Shell → Napplet B: PIPE_OPEN(from: A's info)
Napplet B → Shell: PIPE_ACK(pipeId)
Shell → Napplet A: PIPE_ACK(pipeId, peer: B)
```

**Model B — Shell auto-connects (per D-07: "Target napplet does NOT opt-in"):**
```
Napplet A → Shell: PIPE_OPEN(targetType: "synth")
Shell: verifies A is AUTH'd, finds target B, assigns pipeId
Shell → Napplet A: PIPE_ACK(pipeId, peer: B)
Shell → Napplet B: PIPE_ACK(pipeId, peer: A)
```

**The user decided Model B** (D-07): "Target napplet does NOT opt-in -- shell mediates." This simplifies the protocol:
- No need for the target to handle PIPE_OPEN events
- Shell is authoritative about pipe creation
- Target receives PIPE_ACK directly, meaning "you now have a pipe from A"
- But target SHOULD still have an `onOpen` handler to know a pipe was established

### Refined Sequence (Model B)

```
Napplet A                    Shell                      Napplet B
    |                          |                            |
    |--["PIPE_OPEN", opts]---->|                            |
    |                          |  verify AUTH, check ACL    |
    |                          |  resolve target by dTag    |
    |                          |  assign pipeId             |
    |                          |                            |
    |<--["PIPE_ACK", info]----|--["PIPE_ACK", info]-------->|
    |                          |                            |
    |--["PIPE", id, data]----->|--["PIPE", id, data]------->|
    |<--["PIPE", id, data]-----|<--["PIPE", id, data]-------|
    |                          |                            |
    |--["PIPE_CLOSE", id]----->|--["PIPE_CLOSE", id, ""]-->|
    |<--["PIPE_CLOSE", id, ""]--|                           |
```

### Error Cases

| Error | When | Shell Response |
|-------|------|----------------|
| Not authenticated | PIPE_OPEN before AUTH complete | `["PIPE_CLOSE", null, "auth-required"]` |
| Target not found | No napplet with target dTag loaded | `["PIPE_CLOSE", null, "target-not-found"]` |
| ACL denied | Pipe capability not granted | `["PIPE_CLOSE", null, "acl-denied"]` |
| Target disconnected | Target window destroyed during open pipe | `["PIPE_CLOSE", "<pipeId>", "peer-disconnected"]` |
| Invalid pipe | PIPE message with unknown pipeId | Silently dropped |

Note: For errors during PIPE_OPEN (before pipeId assignment), the shell uses `null` as the pipeId in the PIPE_CLOSE response. The initiator can correlate by timing (only one PIPE_OPEN outstanding) or by the error reason.

---

## 3. Broadcast Semantics

### Decision (D-03): Dedicated PIPE_BROADCAST Verb

The user decided on simple fan-out: napplet sends `PIPE_BROADCAST(data)`, shell delivers to ALL open pipes for that napplet.

### How It Works

1. Napplet A sends `["PIPE_BROADCAST", <payload>]`
2. Shell looks up all open pipes where A is an endpoint
3. Shell delivers `["PIPE", "<pipeId>", <payload>]` to each pipe peer (NOT to A itself)

### No Named Groups (D-03)

"Simple -- no named groups, no subscription model." Named broadcast groups are explicitly deferred.

### Broadcast Without Open Pipes

If a napplet sends PIPE_BROADCAST with no open pipes, the message is silently dropped. No error -- this is consistent with the existing IPC_PEER behavior where emit() with no subscribers is a no-op.

---

## 4. API Surface: window.napplet.pipes

### Proposed TypeScript Interface

Based on research API recommendation (adapted from FEATURES-CHANNELS.md) and context decisions:

```typescript
interface PipeHandle {
  readonly id: string;                           // Shell-assigned pipe ID
  readonly peer: { pubkey: string; dTag: string }; // Peer identity
  send(payload: unknown): void;                  // Send data to peer
  on(callback: (payload: unknown) => void): { close(): void }; // Listen for data
  close(): void;                                 // Close the pipe
  onClose(callback: (reason: string) => void): void; // Peer closed notification
}

interface NappletPipes {
  open(targetType: string, options?: { targetKey?: string; name?: string }): Promise<PipeHandle>;
  onOpen(callback: (pipe: PipeHandle) => void): { close(): void };
  broadcast(payload: unknown): void;
}

// Installed at window.napplet.pipes
```

### API Notes

- `open()` returns a Promise because pipe establishment involves async round-trip through shell
- `onOpen()` notifies the target side when a pipe is established to them
- `broadcast()` is fire-and-forget -- no return value, no confirmation
- `PipeHandle.on()` returns a subscription with `close()` for cleanup (matches existing pattern in relay-shim.ts)

---

## 5. NIP Section Structure

### Where in the NIP

Per Phase 58 context (D-05), pipes are a MAY capability. The NIP-5D structure places this under "Standard Capabilities":

```
## 6. Standard Capabilities
  ### 6.4 Pipes (window.napplet.pipes)
```

### Section Content (Target: ~150-200 words)

The NIP section needs:
1. One-sentence capability description
2. Wire format table (5 verbs)
3. One concrete JSON example per verb
4. Sequence diagram (ASCII art) showing open → data → close lifecycle
5. Broadcast behavior (2-3 sentences)
6. Error handling (table of error reasons)
7. API surface reference (method signatures, not TypeScript types)

### Spec Style (from Phase 58 context D-01, D-02)

- One example per verb (not exhaustive)
- API surface + behavioral requirements (not TypeScript interfaces, not pure prose)
- ~10 lines per sub-section

---

## 6. Integration With Existing Protocol

### Service Discovery

Pipe capability registers as a service via kind 29010:

```json
["EVENT", "cap-discovery", {
  "kind": 29010,
  "tags": [["s", "pipes"], ["v", "1.0.0"]],
  ...
}]
```

Napplets discover pipe support via `window.napplet.services.has('pipes')` before attempting `window.napplet.pipes.open()`.

### ACL Integration

If the shell implements ACL (MAY), a new capability string `pipe:connect` gates PIPE_OPEN requests. This extends the existing capability model (`relay:read`, `relay:write`, `sign:event`, etc.).

### Relationship to IPC (kind 29003)

Pipes **complement** existing IPC pub/sub -- they do NOT replace it.

| Aspect | IPC (kind 29003) | Pipes |
|--------|-----------------|-------|
| Addressing | Topic-based | Direct peer (by dTag) |
| Auth cost | Per-message (full NIP-01 event + sig) | Once (on open) |
| Message overhead | ~500 bytes | ~20 bytes |
| Coupling | Loose | Tight |
| Use case | Notifications, state changes | Data streams, commands |

### Message Dispatch

The runtime's `handleMessage()` dispatch loop needs new branches for `PIPE_OPEN`, `PIPE_ACK`, `PIPE`, `PIPE_CLOSE`, `PIPE_BROADCAST`. These sit alongside the existing REQ/EVENT/CLOSE/AUTH branches.

---

## 7. Validation Architecture

### Dimension 1: Functional Correctness
- Pipe lifecycle (open → data → close) produces correct wire format examples
- Error cases documented with specific reason strings
- Broadcast fan-out semantics clearly specified

### Dimension 2: Protocol Consistency
- Wire format follows existing JSON array convention
- Verb naming follows existing patterns (VERB_NAME, noun prefixed)
- Error response format consistent with NIP-01 CLOSED/NOTICE patterns

### Dimension 3: NIP Compliance
- Section fits NIP-5D terse style (<200 words for pipe capability section)
- MUST/MAY keywords used correctly
- No internal implementation details leak into spec

### Dimension 4: Naming Integrity
- "Pipes" used consistently, never "channels"
- Collision with NIP-28 acknowledged and avoided
- Rationale documented

### Dimension 5: API Completeness
- window.napplet.pipes covers open, onOpen, send, on, close, onClose, broadcast
- Promise-based open (async round-trip)
- Subscription cleanup pattern consistent with existing API

---

## RESEARCH COMPLETE

Phase-specific research covering wire format design, naming rationale, NIP section structure, error handling, and integration points. Ready for planning.

---

*Research for: Phase 59 — Channel Protocol Design*
*Researched: 2026-04-05*
