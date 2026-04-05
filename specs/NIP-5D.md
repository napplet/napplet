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
from unregistered sources MUST be silently dropped. All messages are JSON arrays
using [NIP-01](01.md) relay wire format. The first element is the verb string.

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

- `dTag` (string, required): Napplet type identifier from `<meta name="napplet-type">`.
- `claimedHash` (string, required): Aggregate hash from `<meta name="napplet-aggregate-hash">`, or empty string in dev mode.

If `dTag` is missing or non-string, the shell MUST respond with
`["NOTICE", "REGISTER requires dTag"]` and MUST NOT proceed.

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

Where `shellSecret` is a 32-byte random value generated once per shell instance
and persisted across sessions. Same `dTag` + same hash + same shell = same
keypair. The shell MUST send `IDENTITY` before the `AUTH` challenge.

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

### Post-AUTH Behavior

After AUTH, the shell identifies senders by `MessageEvent.source` Window
reference. No per-message signature verification is required ("verify once, trust
source"). Messages sent before AUTH completes MUST be queued and replayed on
success, or dropped on failure. The queue MUST be capped at 50 messages. After
AUTH, the shell SHOULD check the napplet's `requires` tags from its
[NIP-5A](5A.md) manifest (kind 35128) against available services.

## Relay Proxy

The relay proxy capability is MAY. When provided, the shell acts as a
[NIP-01](01.md) relay to the napplet, forwarding `REQ`, `EVENT`, and `CLOSE` to
connected relays.

### Subscriptions

When the napplet sends `["REQ", <sub_id>, <filter>, ...]`:

1. The shell MUST verify AUTH is complete
2. The shell MUST enforce access control on the subscribe operation
3. The shell delivers matching events from connected relays and local cache
4. The shell sends `["EOSE", <sub_id>]` when stored events are exhausted
5. New matching events are delivered as `["EVENT", <sub_id>, <event>]`

Filter matching follows [NIP-01](01.md) semantics (`ids`, `authors`, `kinds`,
`since`, `until`, `limit`, `#<tag>`).

### Publishing

When the napplet sends `["EVENT", <event>]`:

1. The shell MUST verify AUTH is complete
2. The shell MUST enforce access control on the publish operation
3. The shell forwards the event to connected relays
4. The shell responds with `["OK", <event_id>, <bool>, <msg>]`

### Replay Protection

The shell MUST reject:

- Events with `created_at` older than 30 seconds
- Events with `created_at` more than 10 seconds in the future
- Events with duplicate event IDs

### Bus Kinds

Kinds 29000-29999 are postMessage bus traffic. They MUST NOT be forwarded to
external relays. They are routed only to matching in-memory subscriptions within
the shell. Standard kinds (outside this range) are forwarded to connected relays.

## Capability Discovery

Capability discovery is MUST. All shells MUST support kind 29010 discovery.

Napplets discover shell capabilities via kind 29010 events. After AUTH, the
napplet sends a standard [NIP-01](01.md) subscription:

```json
["REQ", "svc", {"kinds": [29010]}]
```

The shell responds with one `EVENT` per available capability, then `EOSE`:

```json
["EVENT", "svc", {
  "kind": 29010,
  "tags": [
    ["s", "audio"],
    ["v", "1.0.0"],
    ["d", "Audio playback management"]
  ],
  "content": "{}"
}]
```

```json
["EOSE", "svc"]
```

### Discovery Event Tags

| Tag | Required | Description |
|-----|----------|-------------|
| `s` | MUST | Service name (unique identifier, e.g., `relay`, `ipc`, `storage`) |
| `v` | MUST | Semver version of the capability implementation |
| `d` | MAY | Human-readable description |

### Requirement Declaration

Napplet manifests ([NIP-5A](5A.md) kind 35128) MAY include `["requires", "<service-name>"]`
tags declaring which capabilities the napplet needs. The shell checks these
during the post-AUTH compatibility check.

### Feature Detection

Napplets MUST discover capabilities before using them. The `window.napplet.services`
namespace provides:

- `list()` -- returns discovered service descriptors
- `has(name)` -- boolean check for capability presence

Napplets MUST gracefully degrade when a capability is absent.

### Live Subscriptions

After initial discovery `EOSE`, napplets MAY remain subscribed. The shell MUST
send additional kind 29010 events for capabilities registered after the initial
`EOSE`. If no capabilities are registered, the shell sends `EOSE` with zero
events.

## Standard Capabilities

The following capabilities are defined by this NIP. All are MAY unless noted.
Shells advertise supported capabilities via [Capability Discovery](#capability-discovery).

### Relay Proxy -- MAY

Discovery name: `relay`. Namespace: `window.napplet.relay`.

- `subscribe(filter, onEvent)` -- open a relay subscription
- `publish(event)` -- publish an event to connected relays
- `query(filter)` -- one-shot query (returns matching events, then closes)

The shell forwards `REQ`/`EVENT`/`CLOSE` to connected relays per [NIP-01](01.md).
The shell MUST enforce access control on both subscribe and publish operations.
See [Relay Proxy](#relay-proxy) for full protocol details.

### IPC Pub/Sub -- MAY

Discovery name: `ipc`. Namespace: `window.napplet.ipc`.

- `emit(topic, payload)` -- publish a topic event to other napplets
- `on(topic, callback)` -- subscribe to topic events

Uses kind 29003 events with a `["t", "<topic>"]` tag for routing. Topics are
free-form strings defined by napplets. The shell routes kind 29003 events to all
subscribers except the sender (sender exclusion prevents echo).

### Napplet State Storage -- MAY

Discovery name: `storage`. Namespace: `window.napplet.storage`.

- `get(key)` -- read a value
- `set(key, value)` -- write a value
- `remove(key)` -- delete a key
- `keys()` -- list all keys
- `clear()` -- remove all keys

Storage is scoped by composite key `dTag:aggregateHash`. Napplets see only their
own namespace. When the aggregate hash changes (new build), the napplet gets a
fresh empty namespace. The shell MUST enforce a per-napplet quota (default
512 KB, measured in UTF-8 bytes).

### NIP-07 Signer Proxy -- MAY

Discovery name: `signer`. Namespace: `window.nostr`.

Provides the [NIP-07](07.md) `window.nostr` interface inside the sandboxed
iframe. The shell proxies signing requests to the underlying signer (NIP-07
extension, NIP-46 remote signer, etc.).

- `getPublicKey()` -- returns the user's public key
- `signEvent(event)` -- request event signing
- `nip04.encrypt(pubkey, plaintext)` / `nip04.decrypt(pubkey, ciphertext)`
- `nip44.encrypt(pubkey, plaintext)` / `nip44.decrypt(pubkey, ciphertext)`

The shell MUST enforce access control per signing operation. Kinds 0 (metadata),
3 (contacts), 5 (deletion), and 10002 (relay list) MUST always require explicit
user consent regardless of access control settings.

### Event Database -- MAY

Discovery name: `nostrdb`. Namespace: `window.nostrdb`.

- `query(filter)` -- query a shell-provided local event cache

The shell MAY back this with any storage mechanism. This provides read access to
events the shell has already seen, without requiring a relay round-trip.

### Service Discovery -- MUST

Discovery name: always present. Namespace: `window.napplet.services`.

- `list()` -- returns all discovered capability descriptors
- `has(name)` -- boolean check for capability presence

This is the only MUST capability beyond the core AUTH handshake. See
[Capability Discovery](#capability-discovery) for the full protocol.

## Security Considerations

### Threat Model

Napplets are untrusted code. The shell is trusted. The browser enforces iframe
sandbox boundaries. The protocol assumes `MessageEvent.source` provides
unforgeable sender identification within the browser security model.

### Mitigations

1. **Iframe sandbox.** `allow-scripts` without `allow-same-origin`. Napplets
   have opaque origins, no direct state access, and no direct network access
   beyond `fetch` to their serving origin. Note: `allow-scripts` combined with
   `allow-same-origin` would allow sandbox escape -- shells MUST NOT combine
   these tokens.

2. **postMessage `*` origin.** Required because sandboxed iframes have opaque
   ("null") origins. Sender authentication uses `MessageEvent.source`
   (unforgeable Window reference), NOT `event.origin`. This is not a security
   weakness -- it is the correct approach for sandboxed iframes where origin
   strings are meaningless.

3. **AUTH handshake.** One-time Schnorr signature verification establishes
   napplet identity via [NIP-42](42.md) challenge-response. After AUTH, the
   Window reference is the identity token. This "verify once, trust source"
   model avoids per-message cryptographic overhead while maintaining security
   through browser iframe isolation.

4. **Delegated key confinement.** Shell-derived keypairs are confined to the
   postMessage channel. Events signed with delegated keys MUST NOT be published
   to external relays. The user's signer ([NIP-07](07.md)/NIP-46) is the only
   source of events published to external relays. The publishing flow is:
   napplet requests publish, shell checks access control, shell asks user's
   signer to sign, shell publishes to relays. The delegated key is not in this
   chain.

5. **Storage isolation.** State is scoped by composite key `(dTag, aggregateHash)`.
   Napplets cannot access each other's data. Hash changes create new namespaces.

6. **Aggregate hash verification.** Shells verify napplet build integrity against
   [NIP-5A](5A.md) manifests. Hash mismatch MAY result in AUTH rejection or a
   user-visible warning.

7. **Destructive kind safety floor.** Signing requests for kinds 0, 3, 5, and
   10002 MUST always require user consent regardless of access control settings.
   This cannot be waived by any configuration.

### Non-Guarantees

The protocol does NOT protect against:

- A compromised browser (same as any web application)
- A malicious shell implementation (napplets must trust the shell)
- Side-channel attacks through timing or resource usage
- Social engineering the user into granting capabilities

## Event Kinds

These are postMessage bus kinds used by this NIP. They exist only on the
postMessage channel between iframe and host. They MUST NOT be published to
external relays or stored by relay implementations.

| Kind | Name | Usage |
|------|------|-------|
| 22242 | AUTH | Authentication event per [NIP-42](42.md) |
| 29001 | SIGNER_REQUEST | Napplet-to-shell signer proxy request |
| 29002 | SIGNER_RESPONSE | Shell-to-napplet signer proxy response |
| 29003 | IPC_PEER | Inter-napplet messaging, storage commands, service dispatch |
| 29006 | NIPDB_REQUEST | Napplet-to-shell event database query |
| 29007 | NIPDB_RESPONSE | Shell-to-napplet event database result |
| 29010 | SERVICE_DISCOVERY | Shell-to-napplet capability advertisement |

Kinds 29000-29999 fall in [NIP-01](01.md)'s ephemeral event range. Relay
implementations encountering these kinds over WebSocket MUST NOT store them.

## Napplet API Surface

Summary of normative `window.*` namespaces that napplet code interacts with:

| Namespace | Requirement | Discovery Name |
|-----------|-------------|----------------|
| `window.napplet.services` | MUST | (always present) |
| `window.napplet.relay` | MAY | `relay` |
| `window.napplet.ipc` | MAY | `ipc` |
| `window.napplet.storage` | MAY | `storage` |
| `window.nostr` | MAY | `signer` |
| `window.nostrdb` | MAY | `nostrdb` |

Napplets MUST check `window.napplet.services.has(name)` before using any MAY
namespace.

## Implementations

- [@napplet/shim](https://github.com/sandwichfarm/napplet) -- napplet-side SDK
- [@napplet/shell](https://github.com/sandwichfarm/napplet) -- shell runtime
- [hyprgate](https://github.com/sandwichfarm/hyprgate) -- reference shell implementation
