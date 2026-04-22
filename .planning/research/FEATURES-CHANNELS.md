# Feature Landscape: NIP-5C Channel & Broadcast Protocol

**Domain:** Low-latency authenticated postMessage channels for sandboxed iframe applications
**Researched:** 2026-04-05
**Overall confidence:** MEDIUM-HIGH

**Relationship to FEATURES.md:** The general NIP-5C FEATURES.md covers the full spec feature set and lists the channel protocol as "HIGH complexity, needs design + implementation." This document is the deep-dive research on channel/socket patterns that informs that design.

---

## Table Stakes

Features napplet developers and shell implementors expect from a channel primitive. Missing any of these = the channel protocol feels incomplete or forces workarounds.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Named channels with open/close lifecycle | Every port/channel system has this (WebExtensions `runtime.connect({name})`, Electron MessagePort, WebSocket). Without it, devs reinvent multiplexing over raw postMessage. | Low | Chrome extensions, Electron, Comlink all use named channels |
| Auth-on-open (not per-message) | Existing NIP-01 IFC wraps every message in a kind 29003 event with full signature. Channels must amortize auth to the handshake. Per-message auth is why current IFC is too heavy for real-time. | Medium | This is the core motivation for channels |
| Graceful close with notification | Both sides must know when the other disconnects. WebExtensions fire `Port.onDisconnect`. Electron MessagePort fires `close` event. Without this, leaked subscriptions and zombie channels. | Low | `onDisconnect` / `close` event pattern is universal |
| Bidirectional message flow | All reference systems are bidirectional once the channel is open: WebExtensions Port, Electron MessagePort, Comlink endpoints. One-way channels are an anti-pattern for postMessage. | Low | Not negotiable |
| Shell as broker (no direct iframe-to-iframe) | Sandboxed iframes without `allow-same-origin` cannot reference each other's `contentWindow` to transfer MessagePorts directly. Shell must mediate channel setup. | Low | Hard constraint from sandbox policy |
| Channel identity (who opened it) | Both ends need to know the authenticated identity (napp pubkey / dTag) of their peer. Without this, channels are anonymous pipes with no ACL applicability. | Low | Shell already tracks session identity via SessionRegistry |
| Structured message payload | Messages on an open channel need a defined envelope. JSON is the pragmatic choice -- the wire already uses JSON arrays. Binary payloads can be base64-encoded in content field. | Low | Keep consistent with NIP-01 JSON arrays |
| Broadcast to all open channels | DAW BPM sync, global state change notifications, "all napplets reload" commands. Every multi-peer system has broadcast: WebExtensions `runtime.sendMessage()`, BroadcastChannel API, SharedWorker broadcast pattern. | Medium | Distinct from pub/sub topic fan-out (see comparison section) |

---

## Differentiators

Features that set the napplet channel protocol apart from generic postMessage. Not strictly expected, but create real value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Custom wire format after AUTH (non-NIP-01) | The core value proposition. Current IFC wraps everything in NIP-01 events (kind 29003 with signatures, pubkeys, timestamps). Channels drop to a minimal envelope after auth, eliminating per-message signing overhead. Estimated savings: ~400-600 bytes per message + Schnorr signature computation. | Medium | Must define the post-auth envelope format precisely |
| MessagePort upgrade path (optional, MAY) | After auth handshake over postMessage, shell transfers a `MessagePort` to each endpoint. Subsequent data flows over the dedicated port, bypassing the shell's global message listener and dispatch logic. | High | Works with sandboxed iframes (port transfer via postMessage third argument). Browser-specific perf varies. Shell must maintain a port registry. Spec as MAY. |
| Channel capability gating | Shell gates `CH_OPEN` by ACL. A napplet without a `channel:connect` capability cannot open channels. Can be further restricted to specific peer dTags. | Medium | Extends existing ACL system naturally |
| Selective broadcast (channel groups) | Broadcast to a named group of channels rather than all. Analogous to WebExtensions `runtime.connect({name: "mixer"})` -- only channels in the "mixer" group receive. | Medium | DAW use case: BPM sync to "transport" group only |
| Pre-open message queuing | If a channel target has not yet completed AUTH, queue messages (capped, like existing pre-AUTH queue of 50). Figma queues messages until iframe loads. | Low | Prevents race conditions during napplet startup |

---

## Anti-Features

Features to explicitly NOT build. These are traps, based on framework analysis and browser constraints.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Direct iframe-to-iframe MessagePort transfer | Cannot work without `allow-same-origin`. Even if it could, bypasses shell ACL and audit trail. The shell MUST remain the broker for security and observability. | Shell creates MessageChannel, transfers port1 to initiator, port2 to target. Shell retains knowledge of both ends. |
| SharedArrayBuffer for shared state | Requires COOP (`Cross-Origin-Opener-Policy: same-origin`) + COEP (`Cross-Origin-Embedder-Policy: require-corp`) headers on the entire document chain -- top-level page AND all iframes. This is an invasive deployment requirement that breaks many hosting setups (CDNs, third-party resources). Opaque-origin iframes (no `allow-same-origin`) cannot create cross-context SABs. | Use postMessage for all data transfer. For large binary data (audio buffers, state snapshots), use Transferable ArrayBuffers (zero-copy, no COOP/COEP needed). |
| WebRTC DataChannel for local iframe messaging | Massive API surface (ICE candidates, DTLS handshake, SCTP) for a problem postMessage already solves at comparable latency. Local loopback latency is 0-2ms in Chrome (same as postMessage). Firefox historically had 40-100ms local DataChannel latency due to Nagle's algorithm. Adds ~100KB of WebRTC stack. | postMessage + optional MessagePort upgrade. |
| BroadcastChannel API | Throws `SecurityError DOMException` in sandboxed iframes without `allow-same-origin` (confirmed: WHATWG HTML issue #1319, Chromium blink-dev PSA). Opaque origins cannot create matching BroadcastChannel instances across browsing contexts. Dead end. | Route broadcast through the shell. Shell iterates open channels and forwards. |
| Per-message cryptographic signatures on channels | The whole point of channels is eliminating the overhead of kind 29003's per-message event signing. Auth on open, then trust the channel. | AUTH handshake on channel open (reuse existing session AUTH identity). After that, messages are trusted because they arrive on an authenticated channel. Shell verifies message source via `MessageEvent.source` (postMessage) or port ownership (MessagePort). |
| Comlink-style transparent proxy RPC | Hides message-passing behind ES6 Proxies. Convenient but opaque -- developers need to understand they are crossing a postMessage boundary for debugging and performance reasoning. Also, Comlink's proxy model does not compose well with manual channel lifecycle management. | Provide explicit `channel.send()` / `channel.on()` API. Keep the "I am sending a message" mental model. RPC libraries can be built on top by userland (Comlink already supports arbitrary MessagePort endpoints via `MessageChannelAdapter`). |
| Reliable ordered delivery / sequence numbers / ACKs | postMessage within a single page is already ordered and reliable (no drops, no reordering). Adding sequence numbers or retransmission solves a problem that does not exist in the browser context. | Trust the browser's postMessage ordering guarantee. Document this assumption in the spec. |
| Backpressure / flow control (v1) | No browser API provides backpressure for postMessage. Implementing it in userland means buffering + signaling, which adds complexity without clear demand. | Document as future extension point. For v1, fast producers just send; slow consumers may drop or lag. |
| Channel metadata negotiation on open | Subprotocol negotiation (like WebSocket `Sec-WebSocket-Protocol`) adds round-trip complexity. In practice, both sides of a napplet channel know what they are doing -- they opted into connecting. | Let peers negotiate capabilities via initial data messages on the open channel, not via protocol-level metadata fields. |

---

## Feature Dependencies

```
AUTH handshake (existing v0.9.0+)
    |
    +--> Channel open (requires authenticated session identity)
            |
            +--> Channel data flow (requires open channel)
            |       |
            |       +--> Broadcast (requires at least one open channel)
            |
            +--> MessagePort upgrade (MAY, requires open channel)
            |
            +--> Channel close (requires open channel)

ACL system (existing v0.2.0+)
    |
    +--> Channel capability gating (extends ACL with channel:connect)

Service discovery (existing v0.4.0+)
    |
    +--> Channel service advertisement (channels as discoverable MAY capability)
```

---

## Channel Lifecycle: Cross-Framework Comparison

The lifecycle patterns across five frameworks are remarkably consistent. This convergence is strong evidence that the open/auth/data/close state machine is the correct pattern.

### Consensus State Machine

```
CLOSED --> OPENING --> [AUTH CHECK] --> OPEN --> CLOSING --> CLOSED
                          |                       |
                          +--> REJECTED           +--> ERROR --> CLOSED
```

In the napplet context, the `[AUTH CHECK]` phase is NOT a new handshake -- it is a check that both endpoints have already completed the napplet AUTH handshake (REGISTER/IDENTITY/AUTH). The shell validates this as part of processing `CH_OPEN`.

### Framework Comparison Matrix

| Aspect | WebExtensions | Electron | Figma | SharedWorker | Napplet Channels (proposed) |
|--------|--------------|----------|-------|--------------|---------------------------|
| **Initiator** | `runtime.connect({name})` | Main creates `MessageChannelMain`, distributes ports | `figma.showUI()` (implicit) | `new SharedWorker(url)` | `window.napplet.channels.open(target, name)` |
| **Acceptor** | `runtime.onConnect` listener | Renderer receives port via `webContents.postMessage` | `figma.ui.onmessage` | Worker `connect` event | `window.napplet.channels.onOpen(cb)` |
| **Auth model** | Implicit (extension manifest) | Implicit (main process orchestration) | Implicit (plugin manifest) | Same-origin policy | Explicit (existing napplet AUTH session) |
| **Data format** | JSON-serializable | Structured clone + Transferable | JSON via `pluginMessage` key | Structured clone + Transferable | JSON arrays (NIP-01 convention) |
| **Named channels** | Yes (`{name}` param) | No (one port pair per setup) | No (one channel per plugin) | No (one port per client) | Yes (`name` param in open) |
| **Close signal** | `port.disconnect()` fires `onDisconnect` | `port.close()` fires `close` event | `figma.closePlugin()` | Port GC or `port.close()` | `channel.close()` fires `onClose` |
| **Broadcast** | `runtime.sendMessage()` (separate API) | Manual (iterate ports) | N/A | Manual (iterate ports) | `channels.broadcast(payload, group?)` |
| **Broker** | Extension runtime | Main process | Figma host | SharedWorker thread | Shell |
| **Message queuing** | No (connect fails if no listener) | Yes (messages queue until listener) | Yes (until iframe loads) | No | Yes (until target AUTH complete, capped at 50) |

### Key Insights from Each Framework

**WebExtensions:** Named channels via `{name}` parameter. In Chrome, port stays active as long as any receiver exists. In Firefox, port closes when any context unloads. **Napplet channels should follow the Chrome model** (explicit disconnect only, no implicit close on navigation because napplets do not navigate).

**Electron:** The broker (main process) creates the channel and distributes ports. This is exactly the napplet shell's role. Electron explicitly documents that MessagePorts enable communication "without needing to use the main process as an in-between" and avoid "the performance overhead of relaying via the main process." This validates the MessagePort upgrade path as a real optimization.

**Figma:** Message queuing until the receiver is ready prevents startup race conditions. Figma also uses a `pluginMessage` key to namespace plugin messages vs system messages -- analogous to napplet channels using `CH` verb prefix to distinguish from NIP-01 verbs.

**SharedWorker:** Broadcast pattern = iterate stored ports, send to each. No built-in broadcast API. This is the pattern for napplet shell broadcast. SharedWorker is NOT available in sandboxed iframes without `allow-same-origin` (confirmed) -- the shell must be the broker.

**VST/DAW Host (analog):** Plugins sync to host beat position by reading `getPlayPosition()` transport state, not by receiving BPM messages. The napplet analog: shell exposes a "transport" broadcast channel where BPM is a continuous state value. Shell is the authoritative clock source.

---

## Broadcast vs Pub/Sub: The Critical Distinction

These are often conflated. In the napplet context they serve fundamentally different purposes.

| Aspect | Pub/Sub (existing IFC, kind 29003) | Broadcast (new channel op) | Point-to-Point Channel |
|--------|-------------------------------------|---------------------------|----------------------|
| **Addressing** | Topic-based (`#t` tag filter matching) | All open channels (or named group) | Single identified peer |
| **Auth** | Per-message (full NIP-01 event with sig) | Once (channel auth) | Once (channel auth) |
| **Overhead per msg** | ~400-600 bytes + Schnorr sign | ~30 bytes envelope | ~30 bytes envelope |
| **Latency** | Higher (serialize event, compute sig, dispatch by filter) | Lower (iterate channels, forward) | Lowest (direct send) |
| **Coupling** | Loose -- sender does not know recipients | Medium -- sender knows a group exists | Tight -- both sides negotiated |
| **Use case** | Infrequent coordination, notifications, unknown recipients | State sync, clock, config push | Data streams, commands, RPC-like |
| **Status** | **Shipped** (kind 29003, `window.napplet.ifc.emit/on`) | **New** | **New** |

**The pub/sub system does NOT go away.** Channels complement it. Pub/sub is for loose coupling where the sender does not know or care about recipients. Channels are for tight coupling where both sides have negotiated a persistent connection.

**When to use which:**
- "I changed my display name" --> pub/sub topic `auth:identity-changed` (anyone who cares)
- "Set BPM to 120 for all synced plugins" --> broadcast on `transport` group
- "Send this MIDI note to the synthesizer napplet" --> point-to-point channel

---

## postMessage Performance Characteristics

These numbers establish whether the protocol needs a MessagePort upgrade path or if postMessage alone is sufficient.

| Metric | Value | Source | Confidence |
|--------|-------|--------|------------|
| postMessage round-trip (idle page, small JSON) | <1ms | Surma's benchmarks (surma.dev) | MEDIUM |
| postMessage during document load | 10-70ms | Mozilla bug #1164539 | HIGH (Firefox-specific) |
| Structured clone overhead (small JSON object) | Negligible (<0.1ms) | General browser performance research | MEDIUM |
| Structured clone (32MB ArrayBuffer) | ~302ms | Chrome Blog: Transferable Objects | HIGH |
| Transferable ArrayBuffer (32MB, zero-copy) | ~6.6ms | Chrome Blog: Transferable Objects | HIGH |
| MessageChannel vs postMessage (Chrome) | MessageChannel slightly faster | Jeff Kaufman benchmark | MEDIUM |
| MessageChannel vs postMessage (Safari) | ~7ms overhead per one-shot MessageChannel call | Jeff Kaufman benchmark | MEDIUM |
| MessageChannel long-lived (reused after setup) | Comparable to or better than postMessage | Inferred; one-shot setup cost amortized | LOW |
| JSON.stringify + postMessage string | Faster than postMessage raw object | Nolan Lawson Web Worker benchmarks (2016) | LOW |
| WebRTC DataChannel local loopback (Chrome) | 0-2ms | Mozilla/Chrome WebRTC tests | MEDIUM |
| WebRTC DataChannel local loopback (Firefox) | 40-100ms (Nagle's algorithm) | Mozilla bug #976115 | HIGH |

### Practical Conclusions

1. **postMessage is fast enough for the vast majority of channel use cases.** Sub-millisecond for small JSON on idle pages. This covers chat, state sync, command dispatch, and most coordination patterns.

2. **MessagePort upgrade is a real optimization for high-frequency channels** because it bypasses the shell's global `message` event listener dispatch. Every incoming postMessage hits the shell's single `window.addEventListener('message', ...)` handler which must parse, classify, and route. A dedicated MessagePort goes directly to the channel handler. The spec should define this as MAY behavior.

3. **Transferable ArrayBuffers are the answer for binary data.** Zero-copy transfer eliminates the ~300ms structured clone penalty for large buffers. No COOP/COEP deployment burden. The spec should mention Transferable support as a MAY optimization.

4. **The real latency savings come from removing application-layer overhead**, not from changing the transport. Current kind 29003 IFC costs: event object construction, Schnorr signature computation, JSON serialization of a full NIP-01 event, filter matching on the shell side. The channel wire format (`["CH", id, payload]`) eliminates all of this. This is where 10-100x improvement comes from, not from postMessage vs MessagePort.

5. **Startup latency matters.** During iframe loading, postMessage can be 10-70ms (Firefox). Channel implementations should account for this by queuing early messages (matching Figma's pattern).

---

## Wire Format: Post-Auth Channel Messages

### Current IFC (kind 29003) -- The Overhead Channels Eliminate

```json
["EVENT", {
  "id": "abc123def456789012345678901234567890123456789012345678901234abcd",
  "pubkey": "def456789012345678901234567890123456789012345678901234567890abcd",
  "created_at": 1712345678,
  "kind": 29003,
  "tags": [["t", "bpm:sync"]],
  "content": "{\"bpm\":120}",
  "sig": "789abcdef012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890abcdef01"
}]
```

**Per-message cost:** ~500 bytes envelope + Schnorr signature computation + event ID computation (SHA-256 of serialized event).

### Proposed Channel Message (Post-Auth)

```json
["CH", "<channel_id>", <payload>]
```

**Per-message cost:** ~30 bytes envelope. No signature. No event construction. No SHA-256. Channel ID is a short identifier (UUID or incrementing integer) assigned at open time.

**Payload** is any JSON-serializable value. The channel contract (what payloads mean) is between the two endpoints -- the shell does not interpret channel payload content.

### Channel Control Messages

```json
["CH_OPEN", "<channel_id>", {"target": "<target_dTag>", "name": "<channel_name>"}]
["CH_ACCEPT", "<channel_id>", {"peer": "<peer_pubkey>", "peer_dTag": "<dTag>"}]
["CH_CLOSE", "<channel_id>"]
["CH_CLOSED", "<channel_id>", "<reason>"]
["CH_ERROR", "<channel_id>", "<error_message>"]
```

Follows the verb-first JSON array pattern used by the entire napplet protocol.

### Broadcast Message

```json
["CH_BROADCAST", "<group_or_*>", <payload>]
```

Shell delivers as `["CH", "<channel_id>", <payload>]` to each recipient (sender excluded, matching kind 29003 sender-exclusion precedent).

### Open Flow (Shell-Mediated)

```
Napplet A                    Shell                      Napplet B
    |                          |                            |
    |--["CH_OPEN", id, opts]-->|                            |
    |                          |  (verify A is AUTH'd,      |
    |                          |   check ACL, find target)  |
    |                          |                            |
    |                          |--["CH_OPEN", id, info]---->|
    |                          |                            |
    |                          |<--["CH_ACCEPT", id, info]--|
    |<--["CH_ACCEPT", id, info]|                            |
    |                          |                            |
    |--["CH", id, payload]---->|--["CH", id, payload]------>|
    |<--["CH", id, payload]----|<--["CH", id, payload]------|
    |                          |                            |
    |--["CH_CLOSE", id]------->|--["CH_CLOSED", id, ""]---->|
    |<--["CH_CLOSED", id, ""]--|                            |
```

---

## MVP Recommendation

### Ship: Core Channel Primitive

1. **Channel open/close lifecycle** with named channels (`CH_OPEN`, `CH_ACCEPT`, `CH_CLOSE`, `CH_CLOSED`, `CH_ERROR`)
2. **Auth-on-open** reusing existing AUTH session identity (no new auth flow -- shell verifies both peers have completed REGISTER/IDENTITY/AUTH)
3. **Minimal post-auth wire format** (`["CH", channel_id, payload]`)
4. **Broadcast as channel operation** (`["CH_BROADCAST", group, payload]`) with `"*"` for all-channel broadcast
5. **Shim API** on `window.napplet.channels` (`.open()`, `.onOpen()`, `.close()`, `.send()`, `.on()`, `.broadcast()`)

### Defer: Performance Optimizations

- **MessagePort upgrade path**: Real optimization but high complexity. Shell must manage port lifecycle, handle port GC, deal with browser inconsistencies. Spec as MAY, implement when demand exists.
- **Transferable ArrayBuffer support**: Useful for binary. Can be added later as `channel.transfer(buffer)`.
- **Channel groups for selective broadcast**: `"*"` (all channels) is sufficient for v1. Named groups add routing complexity.
- **Backpressure signals**: Document as future extension. No browser-level flow control exists for postMessage.

### Document Only (Spec, Never Build in SDK)

- **How a DAW could use channels**: BPM sync via broadcast, note data via point-to-point, mixer state via channel groups. Pattern description only.
- **MessagePort upgrade semantics**: Specify how a shell MAY upgrade to dedicated MessagePort after open. Leave implementation choice to shell authors.

---

## Recommended Shim API Surface

```typescript
interface ChannelHandle {
  /** Channel identifier assigned by shell */
  readonly id: string;
  /** Peer identity (populated after CH_ACCEPT) */
  readonly peer: { pubkey: string; dTag: string };
  /** Channel name (from open request) */
  readonly name: string;
  /** Send data to the peer */
  send(payload: unknown): void;
  /** Listen for incoming data */
  on(callback: (payload: unknown) => void): Subscription;
  /** Close the channel */
  close(): void;
  /** Fires when peer closes or disconnects */
  onClose(callback: (reason: string) => void): void;
}

interface NappletChannels {
  /** Open a channel to a named napplet type */
  open(target: string, name?: string): Promise<ChannelHandle>;
  /** Listen for incoming channel open requests */
  onOpen(callback: (channel: ChannelHandle) => void): Subscription;
  /** Broadcast to all open channels (or named group) */
  broadcast(payload: unknown, group?: string): void;
}

// Installed at window.napplet.channels
```

**API rationale:**
- **Named channels** from WebExtensions `runtime.connect({name})` -- proven pattern for multiplexing
- **open/onOpen** from Electron's port distribution pattern -- broker hands off to both sides
- **send/on** from every port-based system -- universal data exchange pattern
- **close/onClose** from WebExtensions `Port.disconnect()`/`Port.onDisconnect` -- graceful teardown with notification
- **broadcast** from SharedWorker's manual fan-out pattern -- shell iterates, no new API concept
- **Promise-based open** because channel establishment involves an async round-trip through the shell

---

## Sources

### High Confidence (Official Documentation, Verified)
- [Chrome Extension Message Passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) -- Port lifecycle, named channels, disconnect semantics
- [MDN: runtime.Port](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/Port) -- Port API surface, disconnect behavior, browser differences
- [MDN: runtime.connect()](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/connect) -- Named connection establishment
- [Electron MessagePorts Tutorial](https://www.electronjs.org/docs/latest/tutorial/message-ports) -- Broker pattern, port transfer, "without main process relay" performance benefit
- [MDN: Transferable Objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects) -- Zero-copy ArrayBuffer transfer semantics
- [MDN: SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker) -- MessagePort per client, manual broadcast pattern
- [MDN: BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) -- Same-origin requirement documented
- [MDN: SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) -- COOP/COEP requirements documented
- [WHATWG: BroadcastChannel in opaque origins (#1319)](https://github.com/whatwg/html/issues/1319) -- SecurityError in sandboxed iframes confirmed
- [Chrome Blog: Transferable Objects -- Lightning Fast](https://developer.chrome.com/blog/transferable-objects-lightning-fast) -- 302ms clone vs 6.6ms transfer benchmark
- [web.dev: Cross-Origin Isolation (COOP/COEP)](https://web.dev/articles/coop-coep) -- Full requirements chain for SharedArrayBuffer

### Medium Confidence (Benchmarks, Verified Analysis)
- [Jeff Kaufman: Overhead of MessageChannel](https://www.jefftk.com/p/overhead-of-messagechannel) -- Chrome/Firefox/Safari perf comparison, ~7ms Safari overhead
- [Figma: How Plugins Run](https://developers.figma.com/docs/plugins/how-plugins-run/) -- Two-environment model, message queuing semantics
- [Figma: How We Built the Plugin System](https://www.figma.com/blog/how-we-built-the-figma-plugin-system/) -- QuickJS sandbox + iframe architecture decisions
- [Anvil: Using MessageChannel with iframes](https://www.useanvil.com/blog/engineering/using-message-channel-to-call-functions-within-iframes/) -- Port transfer lifecycle pattern
- [Mozilla Bug #1164539: postMessage during document load](https://bugzilla.mozilla.org/show_bug.cgi?id=1164539) -- 10-70ms startup latency in Firefox
- [Mozilla Bug #976115: WebRTC DataChannel latency](https://bugzilla.mozilla.org/show_bug.cgi?id=976115) -- 40-100ms Firefox local loopback (Nagle's algorithm)
- [Chromium: BroadcastChannel in opaque origins (blink-dev)](https://groups.google.com/a/chromium.org/g/blink-dev/c/-Ph_KkAJ24U) -- Chrome aligning with spec

### Lower Confidence (Community Sources, Older Research)
- [Comlink](https://github.com/GoogleChromeLabs/comlink) -- RPC-over-postMessage, MessageChannelAdapter for custom transports, transferHandler pattern
- [kkRPC](https://github.com/kunkunsh/kkrpc) -- Multi-transport RPC with IoInterface abstraction (iframe, worker, stdio adapters)
- [Surma: Is postMessage Slow?](https://surma.dev/things/is-postmessage-slow/) -- Performance analysis (403 on direct fetch, from training data)
- [Nolan Lawson: High-Performance Web Worker Messages](https://nolanlawson.com/2016/02/29/high-performance-web-worker-messages/) -- JSON.stringify faster than structured clone (2016)
- JUCE forum discussions on VST/MIDI timing -- Sample-accurate timing via host transport, not wall clock messages

---

*Feature research for: v0.12.0 NIP-5C Channel & Broadcast Protocol*
*Researched: 2026-04-05*
