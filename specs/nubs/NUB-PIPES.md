NUB-PIPES
=========

Authenticated Point-to-Point Connections
-----------------------------------------

`draft` `unimplemented`

**NUB ID:** NUB-PIPES
**Namespace:** `window.napplet.pipes`
**Discovery:** `shell.supports("NUB-PIPES")`

## Description

NUB-PIPES provides authenticated, persistent, bidirectional connections between
napplets. Unlike NUB-IPC (topic-based pub/sub with per-message signing), pipes
authenticate once on open and then exchange messages with minimal overhead. The
shell mediates all pipe operations -- napplets cannot connect directly due to
iframe sandbox restrictions.

Pipes are designed for high-frequency communication where per-message NIP-01
event signing (as in NUB-IPC) creates unacceptable overhead. A kind 29003 IPC
message costs ~500 bytes of envelope plus Schnorr signature computation. A pipe
message costs ~30 bytes. Use NUB-IPC for infrequent coordination; use NUB-PIPES
for data streams, real-time sync, and command channels.

## API Surface

```typescript
interface NappletPipes {
  /** Open a pipe to a napplet identified by its dTag. */
  open(target: string, name?: string): Promise<PipeHandle>;

  /** Listen for incoming pipe open requests from other napplets. */
  onOpen(callback: (pipe: PipeHandle) => void): Subscription;

  /** Send a message to all open pipes, or to a named group. */
  broadcast(payload: unknown, group?: string): void;
}

interface PipeHandle {
  /** Shell-assigned opaque pipe identifier. */
  readonly id: string;

  /** Peer identity, populated after PIPE_ACK. */
  readonly peer: { pubkey: string; dTag: string };

  /** Optional channel name for multiplexing (e.g., "midi", "transport"). */
  readonly name: string;

  /** Send a JSON-serializable value to the peer. */
  send(payload: unknown): void;

  /** Receive messages from the peer. */
  on(callback: (payload: unknown) => void): Subscription;

  /** Gracefully close the pipe. Both sides are notified. */
  close(): void;

  /** Fires when the peer closes or disconnects. */
  onClose(callback: (reason: string) => void): void;
}

interface Subscription {
  close(): void;
}
```

### Method Details

- **`open(target, name?)`** opens a pipe to a napplet identified by its dTag.
  `target` is the napplet type identifier (dTag). `name` is an optional channel
  name for multiplexing (e.g., `"midi"`, `"transport"`, `"state"`). Returns a
  Promise that resolves with a `PipeHandle` when the target accepts the pipe.
  Rejects if the target is not found, not authenticated, or ACL-denied.

- **`onOpen(callback)`** listens for incoming pipe open requests from other
  napplets. The callback receives a `PipeHandle` that is already connected
  (PIPE_ACK has been sent by the shell on the callee's behalf). The callee can
  immediately call `pipe.send()` and `pipe.on()`.

- **`broadcast(payload, group?)`** sends a message to all open pipes. If `group`
  is specified, only pipes with a matching `name` receive it. Passing `"*"`
  broadcasts to all open pipes regardless of name. The sender is excluded from
  delivery (matching NUB-IPC sender-exclusion precedent).

- **`PipeHandle.send(payload)`** sends a JSON-serializable value to the peer.
  The shell forwards the payload without interpretation.

- **`PipeHandle.on(callback)`** receives messages from the peer. Returns a
  `Subscription` that can be closed to stop listening.

- **`PipeHandle.close()`** gracefully closes the pipe. The shell sends
  `PIPE_CLOSED` to the peer with an empty reason string.

- **`PipeHandle.onClose(callback)`** fires when the peer closes, disconnects,
  or is destroyed (iframe removal). The `reason` string is empty for graceful
  close and descriptive for error conditions (e.g., `"peer destroyed"`).

## Wire Format

Pipe messages are NOT NIP-01 events. They use a minimal JSON array envelope
transported over the existing postMessage channel. After auth-on-open, each
message is a short array -- no signatures, no event IDs, no timestamps.

### Control Messages

#### PIPE_OPEN

Sent by the initiating napplet to request a pipe connection.

```
["PIPE_OPEN", <pipe_id>, {"target": "<dTag>", "name": "<name>"}]
```

- `pipe_id` (string): Proposed by the napplet. The shell MAY reassign.
- `target` (string): The dTag of the target napplet type.
- `name` (string, optional): Channel name for multiplexing. Defaults to `""`.

#### PIPE_ACK

Sent by the shell to both endpoints to confirm the pipe is established.

```
["PIPE_ACK", <pipe_id>, {"peer": "<pubkey>", "peerDTag": "<dTag>"}]
```

- `pipe_id` (string): The shell-assigned pipe identifier (may differ from the
  proposed ID in PIPE_OPEN).
- `peer` (string): The session pubkey of the connected peer.
- `peerDTag` (string): The dTag of the connected peer's napplet type.

The initiator receives the target's identity; the target receives the
initiator's identity.

#### PIPE_CLOSE

Sent by either endpoint to request graceful pipe teardown.

```
["PIPE_CLOSE", <pipe_id>]
```

#### PIPE_CLOSED

Sent by the shell to notify an endpoint that the pipe has been closed.

```
["PIPE_CLOSED", <pipe_id>, "<reason>"]
```

- `reason` (string): Empty string for graceful close. Descriptive string for
  error conditions (e.g., `"peer destroyed"`, `"acl revoked"`).

#### PIPE_ERROR

Sent by the shell when a pipe operation fails.

```
["PIPE_ERROR", <pipe_id>, "<error_message>"]
```

Error messages include:
- `"target not found"` -- no authenticated napplet with the requested dTag
- `"acl denied"` -- pipe:connect capability not granted
- `"unknown pipe"` -- pipe_id does not correspond to an open pipe
- `"not authenticated"` -- sender has not completed AUTH handshake

### Data Messages

#### PIPE

Sent between connected peers via the shell.

```
["PIPE", <pipe_id>, <payload>]
```

- `pipe_id` (string): The shell-assigned pipe identifier.
- `payload` (any JSON-serializable value): The shell does not interpret, validate,
  or transform payload content.

### Broadcast Messages

#### PIPE_BROADCAST

Sent by a napplet to broadcast to multiple open pipes.

```
["PIPE_BROADCAST", "<group_or_*>", <payload>]
```

- `group_or_*` (string): Pipe name to target, or `"*"` for all open pipes.
- `payload` (any JSON-serializable value).

The shell delivers broadcast as individual `["PIPE", <pipe_id>, <payload>]`
messages to each recipient. The sender is excluded from delivery (matching
NUB-IPC sender-exclusion precedent).

## Pipe Lifecycle

### Sequence Diagram

```
Napplet A                    Shell                      Napplet B
    |                          |                            |
    |--PIPE_OPEN, id, opts---->|                            |
    |                          |  (verify AUTH,             |
    |                          |   check ACL, find target)  |
    |                          |                            |
    |                          |--PIPE_OPEN, id, info------>|
    |                          |                            |
    |                          |<--PIPE_ACK, id, info-------|
    |<--PIPE_ACK, id, info-----|                            |
    |                          |                            |
    |--PIPE, id, payload------>|--PIPE, id, payload-------->|
    |<--PIPE, id, payload------|<--PIPE, id, payload--------|
    |                          |                            |
    |--PIPE_CLOSE, id--------->|--PIPE_CLOSED, id, ""------>|
    |<--PIPE_CLOSED, id, ""----|                            |
```

### State Machine

```
CLOSED --> OPENING --> OPEN --> CLOSING --> CLOSED
               |                    |
               +--> ERROR           +--> ERROR --> CLOSED
```

- **CLOSED**: No pipe exists. Initial and terminal state.
- **OPENING**: PIPE_OPEN sent, awaiting PIPE_ACK. Timeout after
  `REQUEST_TIMEOUT_MS` (default 10000ms, matching signer request precedent).
- **OPEN**: PIPE_ACK received. Data messages flow freely.
- **CLOSING**: PIPE_CLOSE sent, awaiting PIPE_CLOSED confirmation.
- **ERROR**: PIPE_ERROR received. Pipe transitions to CLOSED.

The shell validates that both endpoints have completed the napplet AUTH
handshake (REGISTER/IDENTITY/AUTH) before processing PIPE_OPEN. If either
endpoint has not completed AUTH, the shell returns PIPE_ERROR with
`"not authenticated"`.

## Shell Behavior

### MUST

- The shell MUST assign pipe IDs. Napplets propose IDs in PIPE_OPEN; the shell
  MAY reassign to prevent collisions or enforce naming conventions.
- The shell MUST verify that both endpoints have completed AUTH before
  establishing a pipe.
- The shell MUST forward PIPE messages between connected peers without
  modification.
- The shell MUST notify both sides on disconnect via PIPE_CLOSED.
- The shell MUST send PIPE_ERROR for invalid operations (unknown pipe ID, target
  not found, ACL denied, unauthenticated sender).
- The shell MUST identify pipe message senders via `MessageEvent.source`
  (unforgeable Window reference) and reject messages from unknown sources.
- The shell MUST clean up pipe state when a napplet iframe is destroyed,
  sending PIPE_CLOSED with reason `"peer destroyed"` to the surviving endpoint.

### MAY

- The shell MAY enforce ACL checks on a `pipe:connect` capability.
- The shell MAY restrict pipe targets to specific dTags via ACL policy.
- The shell MAY impose a maximum number of concurrent pipes per napplet.
- The shell MAY log or audit pipe traffic for debugging without modifying
  payloads.

### SHOULD

- The shell SHOULD queue PIPE_OPEN messages sent before the target completes
  AUTH (max 50 messages, matching the existing pre-AUTH queue precedent from
  NIP-5D Section 5).
- The shell SHOULD deliver queued pipe opens after the target completes AUTH.
- The shell SHOULD use opaque identifiers for pipe IDs (UUID v4 or
  incrementing integer) to prevent napplets from guessing other pipes' IDs.

## Event Kinds

NUB-PIPES does not use NIP-01 event kinds for data transport. All pipe messages
use the minimal JSON array wire format described above.

Pipe control messages (PIPE_OPEN, PIPE_ACK, PIPE_CLOSE, PIPE_CLOSED,
PIPE_ERROR) and data messages (PIPE) are transported over the same postMessage
channel used by NIP-01 relay messages, distinguished by their verb prefix.

| Verb | Direction | Description |
|------|-----------|-------------|
| PIPE_OPEN | napplet -> shell | Request pipe connection to target dTag |
| PIPE_ACK | shell -> napplet | Confirm pipe established, deliver peer identity |
| PIPE | bidirectional (via shell) | Data message on an open pipe |
| PIPE_CLOSE | napplet -> shell | Request graceful pipe teardown |
| PIPE_CLOSED | shell -> napplet | Notify pipe has been closed |
| PIPE_ERROR | shell -> napplet | Report pipe operation failure |
| PIPE_BROADCAST | napplet -> shell | Broadcast to multiple pipes |

## Security Considerations

- **Shell as sole broker.** Napplets cannot connect directly. Sandboxed iframes
  without `allow-same-origin` cannot reference each other's `contentWindow` to
  transfer MessagePorts. The shell mediates all pipe setup and teardown.

- **Auth-on-open.** Pipe messages after PIPE_ACK are NOT individually signed.
  Trust is established by the AUTH handshake (REGISTER/IDENTITY/AUTH) plus
  `MessageEvent.source` verification. A compromised browser extension could
  forge messages on an open pipe -- this is an accepted trust boundary, the same
  as NUB-IPC.

- **Sender verification.** The shell identifies pipe message senders via
  `MessageEvent.source`, which is an unforgeable `Window` reference set by the
  browser. This prevents cross-pipe spoofing.

- **Target validation.** PIPE_OPEN targets by dTag. The shell MUST verify the
  target napplet exists and has completed AUTH before forwarding the open
  request.

- **Opaque payloads.** Pipe payloads are opaque to the shell. The shell MUST
  NOT attempt to parse, validate, or transform pipe payload content. The data
  contract is between the two endpoints.

- **Broadcast scope.** Broadcast to `"*"` reaches all open pipes. Napplets
  SHOULD NOT send sensitive data via broadcast. For confidential communication,
  use a named point-to-point pipe.

- **Pipe ID opacity.** The shell assigns pipe IDs using opaque identifiers.
  Napplets cannot enumerate or guess other napplets' pipe IDs. This prevents
  pipe hijacking.

## Comparison with NUB-IPC

| Aspect | NUB-IPC (pub/sub) | NUB-PIPES (point-to-point) |
|--------|-------------------|---------------------------|
| **Addressing** | Topic-based (`#t` tag filter matching) | dTag targeting + shell-assigned pipe ID |
| **Auth** | Per-message (full NIP-01 event with sig) | Once on open (reuses AUTH session) |
| **Overhead per msg** | ~500 bytes + Schnorr sign/verify | ~30 bytes envelope |
| **Coupling** | Loose -- sender does not know recipients | Tight -- both sides negotiate connection |
| **Use case** | Infrequent coordination, notifications | Data streams, real-time sync, commands |
| **Status** | Implemented (@napplet/shim, kind 29003) | Unimplemented (this spec) |

## Future Extensions

- **MessagePort upgrade (MAY):** After PIPE_ACK, the shell MAY transfer a
  `MessagePort` to each endpoint for direct communication, bypassing the
  shell's global `message` event listener. This is a performance optimization
  for high-frequency pipes. The shell retains knowledge of both endpoints for
  cleanup and audit. The upgrade is transparent to the `PipeHandle` API -- the
  shim switches transport internally.

- **Transferable ArrayBuffers (MAY):** For binary data (audio buffers, state
  snapshots), the pipe MAY support zero-copy `ArrayBuffer` transfer via the
  postMessage transfer list. This eliminates the ~300ms structured clone penalty
  for large buffers. Could be exposed as `pipe.transfer(buffer)`.

- **Named pipe groups:** Selective broadcast to named groups beyond the `name`
  field filtering. For v1, filtering by pipe `name` with `"*"` fallback is
  sufficient.

- **Backpressure:** No browser API provides backpressure for postMessage. Fast
  producers may overwhelm slow consumers. Documented as future extension point.
  For v1, consumers that cannot keep up may lag or drop messages.

- **Pipe metadata negotiation:** Subprotocol negotiation (like WebSocket
  `Sec-WebSocket-Protocol`) on open. Deferred -- peers can negotiate via
  initial data messages on the open pipe.

## Implementations

- No implementations exist. This spec is a draft for future implementation in
  `@napplet/shim` (client) and `@kehto/runtime` (shell-side pipe router).
