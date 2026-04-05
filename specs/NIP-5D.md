NIP-5D
======

Nostr Web Applets
-----------------

`draft` `optional`

This NIP defines a protocol for sandboxed web applications ("napplets") running in iframes to communicate with a hosting application ("shell") via postMessage using [NIP-01](01.md) wire format. Extensions are defined in the NUB (Napplet Unified Blueprint) proposal track.

## Terminology

| Term | Definition |
|------|------------|
| Shell | Web application hosting napplet iframes, acting as NIP-01 relay proxy |
| Napplet | Sandboxed iframe application communicating with the shell via postMessage |
| dTag | Napplet type identifier from the [NIP-5A](5A.md) manifest `d` tag |
| Aggregate hash | SHA-256 of napplet build files per [NIP-5A](5A.md) |
| Delegated key | Deterministic secp256k1 keypair derived by the shell for AUTH signing |
| Composite key | Tuple `(dTag, aggregateHash)` identifying a napplet version |
| NUB | Napplet Unified Blueprint -- extension proposal system for interface and protocol specs |

## Transport

Communication uses `postMessage`. Napplet to shell: `window.parent.postMessage(msg, '*')`. Shell to napplet: `iframeWindow.postMessage(msg, '*')`. The `'*'` origin is required because napplets have opaque origins (no `allow-same-origin`). Sender authentication uses `MessageEvent.source`, not origin checking.

Napplet iframes MUST use this sandbox attribute:

    allow-scripts allow-forms allow-popups allow-modals allow-downloads

The `allow-same-origin` token MUST NOT be present. Shells MAY add additional sandbox tokens as needed. Napplets have no access to `localStorage`, `sessionStorage`, `IndexedDB`, direct WebSocket connections, or `window.nostr`. All storage, signing, and relay access is proxied through the shell.

The shell identifies senders via `MessageEvent.source` (unforgeable Window reference). Messages from unregistered sources MUST be silently dropped. All messages are JSON arrays using [NIP-01](01.md) wire format.

## Wire Format

### Napplet-to-Shell Messages

| Verb | Format | Description |
|------|--------|-------------|
| `REGISTER` | `["REGISTER", <payload>]` | Announce napplet type and claimed hash |
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

`REQ`, `EVENT`, `CLOSE`, `EOSE`, `OK`, `CLOSED`, `COUNT`, `NOTICE` follow [NIP-01](01.md) semantics. `REGISTER` and `IDENTITY` are new verbs.

## Authentication

Authentication is MUST. All shells and napplets MUST implement the handshake defined in this section.

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

**Step 1: REGISTER.** The napplet MUST send `["REGISTER", {"dTag": "<type>", "claimedHash": "<hash>"}]` as its first message. `dTag` is the napplet type from `<meta name="napplet-type">`. `claimedHash` is the aggregate hash, or empty string in dev mode. If `dTag` is missing, the shell MUST respond with `["NOTICE", "REGISTER requires dTag"]`.

**Step 2: IDENTITY.** The shell derives a deterministic keypair using `HMAC-SHA256(shellSecret, dTag + aggregateHash)` where `shellSecret` is a 32-byte random value persisted per shell instance. Same dTag + same hash + same shell = same keypair. The shell sends `["IDENTITY", {"pubkey": "<hex>", "privkey": "<hex>", "dTag": "<type>", "aggregateHash": "<hash>"}]` and MUST send this before the AUTH challenge.

**Step 3: AUTH Challenge.** The shell sends `["AUTH", "<uuid-challenge>"]` per [NIP-42](42.md).

**Step 4: AUTH Response.** The napplet signs a kind 22242 event with the delegated key: tags `["relay", "napplet://shell"]`, `["challenge", "<string>"]`, `["type", "<napplet_type>"]`, `["version", "2.0.0"]`, `["aggregateHash", "<hash>"]`. The `type`, `version`, and `aggregateHash` tags are MUST. The `relay` tag MUST be `"napplet://shell"`.

**Step 5: Verification.** The shell MUST verify: kind is 22242, `challenge` matches, `relay` is `"napplet://shell"`, `created_at` within 60s, Schnorr signature valid, `pubkey` matches IDENTITY, `type` and `aggregateHash` present. On success: `["OK", <event_id>, true, ""]`. On failure: `["OK", <event_id>, false, "auth-required: <reason>"]`.

**Post-AUTH.** The shell identifies senders by `MessageEvent.source` -- no per-message signature verification ("verify once, trust source"). Messages sent before AUTH completes MUST be queued (max 50) and replayed on success, or dropped on failure. The shell SHOULD check `requires` tags from the [NIP-5A](5A.md) manifest against available capabilities.

## Extension Discovery

Extension discovery is MUST. All shells MUST implement `shell.supports()`. Napplets discover capabilities by querying NUB proposal support:

- `shell.supports("NUB-RELAY")` -- boolean, interface present
- `shell.supports("NUB-RELAY", "NUB-02")` -- boolean, interface + protocol

How shells resolve `supports()` is an implementation detail. This NIP does not prescribe a wire protocol for discovery. Napplets MUST discover capabilities before using them and MUST gracefully degrade when a capability is absent.

Napplet manifests ([NIP-5A](5A.md) kind 35128) MAY include `["requires", "<nub-id>"]` tags. The shell checks these during post-AUTH.

## NUB Extension Framework

Capabilities beyond the core protocol are defined as NUB (Napplet Unified Blueprint) proposals with two tracks:

**NUB-WORD** (interfaces): One canonical spec per name defining shell-provided API contracts on `window.napplet.*` namespaces (e.g., NUB-RELAY, NUB-STORAGE, NUB-SIGNER, NUB-NOSTRDB, NUB-IPC, NUB-PIPES).

**NUB-NN** (message protocols): Numbered proposals defining event semantics napplets agree on with each other. Multiple competing specs allowed per domain.

NUB proposals are maintained at [github.com/napplet/nubs](https://github.com/napplet/nubs). Event kinds used by NUB interfaces are defined in their respective proposals.

## Security Considerations

Napplets are untrusted code. The shell is trusted. The browser enforces iframe sandbox boundaries. `MessageEvent.source` provides unforgeable sender identity.

**Mitigations:** 
1. Iframe sandbox: `allow-scripts` without `allow-same-origin` -- shells MUST NOT combine these tokens. 
2. postMessage `*` origin is required for opaque-origin iframes; sender auth uses `MessageEvent.source`, NOT `event.origin`. 
3. AUTH handshake: one-time Schnorr signature via [NIP-42](42.md) establishes identity ("verify once, trust source"). 
4. Delegated key confinement: events signed with delegated keys MUST NOT be published to external relays; the user's signer ([NIP-07](07.md)/NIP-46) is the only source of externally published events.
6. Aggregate hash verification against [NIP-5A](5A.md) manifests; mismatch MAY result in AUTH rejection. (6) Storage isolation, signing safety, and relay access control are defined by their respective NUB interface specs.

**Non-Guarantees:** The protocol does NOT protect against a compromised browser, a malicious shell, side-channel attacks, or social engineering.

## Event Kinds

| Kind | Name | Usage |
|------|------|-------|
| 22242 | AUTH | Authentication event per [NIP-42](42.md) |

Interface-specific event kinds are defined in their respective NUB proposals.

## References

- [NIP-01](01.md) -- Basic protocol flow
- [NIP-07](07.md) -- `window.nostr` signer capability
- [NIP-42](42.md) -- Authentication of clients to relays
- [NIP-45](45.md) -- Event counts
- [NIP-5A](5A.md) -- Napplet manifest format and aggregate hash
