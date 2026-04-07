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
| NUB | Napplet Unified Blueprint -- extension proposal system for interface and protocol specs |

## Transport

Communication uses `postMessage`. Napplet to shell: `window.parent.postMessage(msg, '*')`. Shell to napplet: `iframeWindow.postMessage(msg, '*')`. The `'*'` origin is required because napplets have opaque origins (no `allow-same-origin`). Sender authentication uses `MessageEvent.source`, not origin checking.

Napplet iframes MUST use this sandbox attribute:

    allow-scripts allow-forms allow-popups allow-modals allow-downloads

The `allow-same-origin` token MUST NOT be present. Shells MAY add additional sandbox tokens as needed. Napplets have no access to `localStorage`, `sessionStorage`, `IndexedDB`, direct WebSocket connections, or `window.nostr`. All storage, signing, and relay access is proxied through the shell.

The shell identifies senders via `MessageEvent.source` (unforgeable Window reference). The shell maps each iframe's Window reference to its napplet identity (dTag, aggregateHash) at iframe creation time. Messages from unknown sources (iframes not created by the shell) MUST be silently dropped. All messages are JSON arrays using [NIP-01](01.md) wire format.

## Wire Format

### Napplet-to-Shell Messages

| Verb | Format | Description |
|------|--------|-------------|
| `EVENT` | `["EVENT", <event>]` | Publish or command event |
| `REQ` | `["REQ", <sub_id>, <filter>, ...]` | Open subscription per [NIP-01](01.md) |
| `CLOSE` | `["CLOSE", <sub_id>]` | Close subscription |
| `COUNT` | `["COUNT", <sub_id>, <filter>, ...]` | Request event count per [NIP-45](45.md) |

### Shell-to-Napplet Messages

| Verb | Format | Description |
|------|--------|-------------|
| `EVENT` | `["EVENT", <sub_id>, <event>]` | Deliver matching event |
| `OK` | `["OK", <event_id>, <bool>, <msg>]` | Event acceptance/rejection |
| `EOSE` | `["EOSE", <sub_id>]` | End of stored events |
| `CLOSED` | `["CLOSED", <sub_id>, <msg>]` | Subscription closed by shell |
| `NOTICE` | `["NOTICE", <msg>]` | Human-readable notice |
| `COUNT` | `["COUNT", <sub_id>, {"count": <n>}]` | Event count result |

All verbs follow [NIP-01](01.md) relay semantics. The shell acts as a virtual relay to each napplet.

## Identity

The shell assigns napplet identity at iframe creation time. No multi-step negotiation is required.

When the shell creates a napplet iframe, it maps the iframe's `Window` reference to the napplet's `(dTag, aggregateHash)` tuple. The shell derives an internal identity pubkey for each napplet using `HMAC-SHA256(shellSecret, dTag + aggregateHash)` where `shellSecret` is a 32-byte random value persisted per shell instance. Same dTag + same aggregateHash + same shell = same identity.

Napplets send unsigned event templates (kind, created_at, tags, content) without id, pubkey, or sig fields. The shell stamps inbound messages with the napplet's derived pubkey internally. Events signed with a user's key ([NIP-07](07.md)/NIP-46) go through the shell's signer proxy, not the napplet's identity.

The shell MUST verify `MessageEvent.source` on every inbound message. Messages from Window references not mapped to a napplet identity MUST be silently dropped.

The shell SHOULD check `requires` tags from the [NIP-5A](5A.md) manifest against available capabilities at iframe creation time.

## Extension Discovery

Extension discovery is MUST. All shells MUST implement `shell.supports()`. Napplets discover capabilities by querying NUB proposal support:

- `shell.supports("NUB-RELAY")` -- boolean, interface present
- `shell.supports("NUB-RELAY", "NUB-02")` -- boolean, interface + protocol

How shells resolve `supports()` is an implementation detail. This NIP does not prescribe a wire protocol for discovery. Napplets MUST discover capabilities before using them and MUST gracefully degrade when a capability is absent.

Napplet manifests ([NIP-5A](5A.md) kind 35128) MAY include `["requires", "<nub-id>"]` tags. The shell checks these at napplet load time.

## NUB Extension Framework

Capabilities beyond the core protocol are defined as NUB (Napplet Unified Blueprint) proposals with two tracks:

**NUB-WORD** (interfaces): One canonical spec per name defining shell-provided API contracts on `window.napplet.*` namespaces (e.g., NUB-RELAY, NUB-STORAGE, NUB-SIGNER, NUB-NOSTRDB, NUB-IPC, NUB-PIPES).

**NUB-NN** (message protocols): Numbered proposals defining event semantics napplets agree on with each other. Multiple competing specs allowed per domain.

NUB proposals are maintained at [github.com/napplet/nubs](https://github.com/napplet/nubs). Event kinds used by NUB interfaces are defined in their respective proposals.

## Security Considerations

Napplets are untrusted code. The shell is trusted. The browser enforces iframe sandbox boundaries. `MessageEvent.source` provides unforgeable sender identity.

**Mitigations:**
1. Iframe sandbox: `allow-scripts` without `allow-same-origin` -- shells MUST NOT combine these tokens.
2. postMessage `*` origin is required for opaque-origin iframes; sender identification uses `MessageEvent.source`, NOT `event.origin`.
3. Identity binding: the shell maps `MessageEvent.source` to napplet identity at iframe creation. No per-message or one-time signature verification is needed -- the browser's `MessageEvent.source` is unforgeable within the same browsing context.
4. Internal identity confinement: events stamped with shell-derived napplet pubkeys MUST NOT be published to external relays; the user's signer ([NIP-07](07.md)/NIP-46) is the only source of externally published events.
5. Aggregate hash verification against [NIP-5A](5A.md) manifests; mismatch MAY result in napplet rejection. Storage isolation, signing safety, and relay access control are defined by their respective NUB interface specs.

**Non-Guarantees:** The protocol does NOT protect against a compromised browser, a malicious shell, side-channel attacks, or social engineering.

## Event Kinds

Interface-specific event kinds are defined in their respective NUB proposals.

## References

- [NIP-01](01.md) -- Basic protocol flow
- [NIP-07](07.md) -- `window.nostr` signer capability
- [NIP-45](45.md) -- Event counts
- [NIP-5A](5A.md) -- Napplet manifest format and aggregate hash
