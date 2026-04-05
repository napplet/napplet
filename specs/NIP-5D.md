NIP-5D
======

Nostr Web Applets
-----------------

`draft` `optional`

This NIP defines a protocol for sandboxed web applications ("napplets") running
in iframes to communicate with a hosting application ("shell") via postMessage,
using [NIP-01](01.md) wire format. It extends [NIP-5A](5A.md) with a runtime
communication layer for embedded interactive applications.

[NIP-5A](5A.md) defines how static web content is hosted on Nostr.
[NIP-5B](5B.md) defines how applications are discovered. This NIP defines what
happens after the iframe loads: how the embedded application authenticates,
discovers shell capabilities, and communicates.

## Terminology

| Term | Definition |
|------|------------|
| Shell | A web application hosting napplet iframes and acting as a NIP-01 relay proxy |
| Napplet | A sandboxed iframe application communicating with the shell via postMessage |
| dTag | The napplet type identifier from the [NIP-5A](5A.md) manifest `d` tag |
| Aggregate hash | A SHA-256 hash of the napplet's build files per [NIP-5A](5A.md), proving build integrity |
| Delegated key | A deterministic secp256k1 keypair derived by the shell and sent to the napplet for AUTH signing |
| Composite key | The tuple `(dTag, aggregateHash)` uniquely identifying a napplet version |

## Transport

### Delivery Mechanism

Communication uses the browser `postMessage` API:

- **Napplet to shell:** `window.parent.postMessage(message, '*')`
- **Shell to napplet:** `iframeWindow.postMessage(message, '*')`

The `'*'` target origin is required because napplets run with opaque origins
(no `allow-same-origin` in the sandbox attribute). Sender authentication is
handled by `MessageEvent.source`, not by origin checking. See
[Security Considerations](#security-considerations).

### Sandbox Policy

Napplet iframes MUST use the following sandbox attribute:

```
allow-scripts allow-forms allow-popups allow-modals allow-downloads
```

The `allow-same-origin` token MUST NOT be present. This means napplets have:

- No access to `localStorage`, `sessionStorage`, or `IndexedDB`
- No direct WebSocket connections (relays are proxied through the shell)
- No access to the parent page's `window.nostr` object
- An opaque ("null") origin

All storage, signing, and relay access is proxied through the shell via
postMessage.

### Sender Identification

The shell identifies napplet senders via `MessageEvent.source`, which provides
an unforgeable `Window` reference within the browser security model. Messages
from unregistered sources MUST be silently dropped.

### Message Format

All messages are JSON arrays using [NIP-01](01.md) relay wire format. The first
element is the verb string. Messages are delivered asynchronously via the browser
event loop. Napplets MUST NOT assume ordering between deliveries from different
subscriptions.

## Wire Format

### Napplet-to-Shell Messages

| Verb | Format | Description |
|------|--------|-------------|
| `REGISTER` | `["REGISTER", <payload>]` | Announce napplet type and claimed hash (first message) |
| `EVENT` | `["EVENT", <event>]` | Publish or command event |
| `REQ` | `["REQ", <sub_id>, <filter>, ...]` | Open subscription per [NIP-01](01.md) |
| `CLOSE` | `["CLOSE", <sub_id>]` | Close subscription |
| `AUTH` | `["AUTH", <event>]` | AUTH handshake response |
| `COUNT` | `["COUNT", <sub_id>, <filter>, ...]` | Request event count per [NIP-45](45.md) |

### Shell-to-Napplet Messages

| Verb | Format | Description |
|------|--------|-------------|
| `IDENTITY` | `["IDENTITY", <payload>]` | Delegate deterministic keypair |
| `EVENT` | `["EVENT", <sub_id>, <event>]` | Deliver matching event |
| `OK` | `["OK", <event_id>, <bool>, <msg>]` | Event acceptance/rejection |
| `EOSE` | `["EOSE", <sub_id>]` | End of stored events |
| `CLOSED` | `["CLOSED", <sub_id>, <msg>]` | Subscription closed by shell |
| `AUTH` | `["AUTH", <challenge>]` | AUTH challenge |
| `NOTICE` | `["NOTICE", <msg>]` | Human-readable notice |
| `COUNT` | `["COUNT", <sub_id>, {"count": <n>}]` | Event count result |

`REQ`, `EVENT`, `CLOSE`, `EOSE`, `OK`, `CLOSED`, `COUNT`, and `NOTICE` follow
[NIP-01](01.md) semantics exactly. `REGISTER` and `IDENTITY` are new verbs
defined by this NIP.

### Examples

Napplet announces its identity:

```json
["REGISTER", {"dTag": "chat", "claimedHash": "e3b0c44298fc1c14..."}]
```

Shell delegates a deterministic keypair:

```json
["IDENTITY", {"pubkey": "deadbeef...", "privkey": "cafebabe...", "dTag": "chat", "aggregateHash": "e3b0c44298fc1c14..."}]
```
