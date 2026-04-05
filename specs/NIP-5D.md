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

## Authentication

Authentication is MUST. All shells and napplets MUST implement the handshake
defined in this section.

```
Napplet                              Shell
  |                                    |
  |--- REGISTER {dTag, hash} -------->|
  |                                    |  derive keypair
  |<--- IDENTITY {pub, priv} ---------|
  |<--- AUTH <challenge> -------------|
  |                                    |
  |--- AUTH <signed kind 22242> ----->|
  |                                    |  verify signature
  |<--- OK <event_id, true, ""> -----|
  |                                    |
```

### Step 1: REGISTER

The napplet MUST send `REGISTER` as its first message:

```json
["REGISTER", {"dTag": "<napplet_type>", "claimedHash": "<aggregate_hash>"}]
```

- `dTag` (string, required): The napplet type identifier, read from
  `<meta name="napplet-type">` in the napplet's document head.
- `claimedHash` (string, required): The aggregate hash from
  `<meta name="napplet-aggregate-hash">`, or empty string in dev mode.

If the payload is invalid (missing or non-string `dTag`), the shell MUST respond
with `["NOTICE", "REGISTER requires dTag"]` and MUST NOT proceed.

### Step 2: IDENTITY

After receiving a valid `REGISTER`, the shell derives a deterministic keypair
and sends it to the napplet:

```json
["IDENTITY", {"pubkey": "<hex>", "privkey": "<hex>", "dTag": "<type>", "aggregateHash": "<hash>"}]
```

Key derivation:

```
seed = HMAC-SHA256(shellSecret, dTag + aggregateHash)
pubkey = schnorr.getPublicKey(seed)
```

Where `shellSecret` is a 32-byte cryptographically random value generated once
per shell instance and persisted across sessions. The same napplet type + same
aggregate hash + same shell instance always produces the same keypair.

The shell MUST send `IDENTITY` before sending the `AUTH` challenge.

### Step 3: AUTH Challenge

The shell sends an [NIP-42](42.md) challenge:

```json
["AUTH", "<uuid-challenge>"]
```

### Step 4: AUTH Response

The napplet signs a kind 22242 event per [NIP-42](42.md) with the delegated
private key:

```json
{
  "kind": 22242,
  "created_at": <unix_timestamp>,
  "tags": [
    ["relay", "napplet://shell"],
    ["challenge", "<challenge_string>"],
    ["type", "<napplet_type>"],
    ["version", "2.0.0"],
    ["aggregateHash", "<hash>"]
  ],
  "content": ""
}
```

The `type`, `version`, and `aggregateHash` tags are MUST. The `relay` tag MUST
be `"napplet://shell"`. The event MUST be signed with the delegated key received
in the `IDENTITY` message.

### Step 5: Verification

The shell MUST verify:

1. Kind is 22242
2. `challenge` tag matches the pending challenge
3. `relay` tag is `"napplet://shell"`
4. `created_at` is within 60 seconds of current time
5. Schnorr signature is valid
6. `pubkey` matches the key sent in `IDENTITY`
7. `type` and `aggregateHash` tags are present

On success: `["OK", <event_id>, true, ""]`

On failure: `["OK", <event_id>, false, "auth-required: <reason>"]`

### Post-AUTH Identity

After AUTH, the shell identifies senders by `MessageEvent.source` Window
reference. No per-message signature verification is required. This "verify once,
trust source" model avoids per-message cryptographic overhead.

### Pre-AUTH Queueing

Messages sent before AUTH completes MUST be queued and replayed on success, or
dropped on failure. The queue MUST be capped at 50 messages by default. Messages
exceeding the cap MUST be rejected with `["NOTICE", "pre-AUTH queue full"]`.

### Manifest Compatibility Check

After AUTH, the shell SHOULD check the napplet's `requires` tags from its
[NIP-5A](5A.md) manifest (kind 35128) against available services. If
requirements are unmet, the shell MAY reject the napplet or invoke a
compatibility callback to surface the issue to the user.
