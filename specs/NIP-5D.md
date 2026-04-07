NIP-5D
======

Nostr Web Applets
-----------------

`draft` `optional`

This NIP defines a protocol for sandboxed web applications ("napplets") running in iframes to communicate with a hosting application ("shell") via postMessage using a generic JSON envelope. Protocol messages are defined by NUB (Napplet Unified Blueprint) extension specs.

## Terminology

| Term | Definition |
|------|------------|
| Shell | Web application hosting napplet iframes |
| Napplet | Sandboxed iframe application communicating with the shell via postMessage |
| dTag | Napplet type identifier from the [NIP-5A](5A.md) manifest `d` tag |
| Aggregate hash | SHA-256 of napplet build files per [NIP-5A](5A.md) |
| NUB | Napplet Unified Blueprint -- extension spec defining protocol messages for a capability domain |

## Transport

Communication uses `postMessage`. Napplet to shell: `window.parent.postMessage(msg, '*')`. Shell to napplet: `iframeWindow.postMessage(msg, '*')`. The `'*'` target origin is required because napplets have opaque origins (no `allow-same-origin`).

Napplet iframes MUST use this sandbox attribute:

    sandbox="allow-scripts"

The `allow-same-origin` token MUST NOT be present. Shells MAY add additional sandbox tokens (`allow-forms`, `allow-modals`, `allow-downloads`, `allow-popups`) based on shell policy. Napplets have no access to `localStorage`, `sessionStorage`, `IndexedDB`, direct WebSocket connections, or `window.nostr`. All storage, signing, and relay access is proxied through the shell.

The shell identifies senders via `MessageEvent.source` (unforgeable Window reference). Messages from unknown sources (iframes not created by the shell) MUST be silently dropped.

## Wire Format

All messages between napplet and shell are JSON objects with a `type` field:

    { "type": "<domain>.<action>", ...payload }

The `type` field is a string discriminant in `domain.action` format. Domains correspond to NUB capability names (e.g., `relay`, `signer`, `storage`, `ifc`). NUB specs define the valid type strings and payload shapes for their domain. This NIP does not enumerate message types.

Example messages (defined by their respective NUB specs):

    { "type": "relay.subscribe", "id": "sub1", "filters": [...] }
    { "type": "relay.event", "id": "sub1", "event": {...} }
    { "type": "signer.sign", "id": "req1", "template": {...} }
    { "type": "storage.get", "key": "prefs" }

Messages with an unrecognized `type` MUST be silently ignored. This allows forward compatibility as new NUBs are defined.

## Identity

The shell assigns napplet identity at iframe creation time. No negotiation is required.

When the shell creates a napplet iframe, it maps the iframe's `Window` reference to the napplet's `(dTag, aggregateHash)` tuple from the [NIP-5A](5A.md) manifest. This mapping is the napplet's identity for the session. How the shell internally represents or derives identity is an implementation detail.

The shell MUST verify `MessageEvent.source` on every inbound message. Messages from Window references not mapped to a napplet identity MUST be silently dropped.

## Manifest and NUB Negotiation

Napplet manifests ([NIP-5A](5A.md) kind 35128) declare required capabilities using `requires` tags:

    ["requires", "relay"]
    ["requires", "signer"]
    ["requires", "storage"]

Each `requires` value is a short NUB name: `relay`, `signer`, `storage`, `ifc`. Manifests MUST NOT use spec identifiers like `NUB-RELAY`.

At napplet load time, the shell checks `requires` tags against its own capabilities. If a required capability is absent, the shell SHOULD reject the napplet or display a compatibility warning. If the manifest has no `requires` tags, the shell loads the napplet with whatever capabilities it provides.

### Runtime Capability Query

Napplets query capability support at runtime:

    window.napplet.shell.supports('relay')    // boolean
    window.napplet.shell.supports('signer')   // boolean

This covers both NUB capabilities and sandbox permissions:

    window.napplet.shell.supports('popups')   // boolean

Shells MUST implement `window.napplet.shell.supports()`. Napplets MUST gracefully degrade when a capability is absent.

Service discovery (e.g., audio, notifications) uses a separate API:

    window.napplet.services.has('audio')      // boolean

## NUB Extension Framework

Protocol messages are defined by NUB (Napplet Unified Blueprint) specs. Each NUB owns a message domain and defines the `type` strings, payload shapes, and semantics for that domain:

| NUB | Domain | Defines |
|-----|--------|---------|
| NUB-RELAY | `relay` | Relay proxy: subscribe, publish, event delivery, close |
| NUB-SIGNER | `signer` | Signing delegation: sign request, response, get-public-key |
| NUB-STORAGE | `storage` | Scoped storage: get, set, delete, keys |
| NUB-IFC | `ifc` | Inter-frame communication: dispatch and channel modes |

NUB specs are maintained at [github.com/napplet/nubs](https://github.com/napplet/nubs). Each NUB spec is self-contained and references this NIP only for envelope format and transport.

## Security Considerations

Napplets are untrusted code. The shell is trusted. The browser enforces iframe sandbox boundaries. `MessageEvent.source` provides unforgeable sender identity.

**Mitigations:**
1. Iframe sandbox: `allow-scripts` only -- shells MUST NOT add `allow-same-origin`.
2. postMessage `'*'` origin is required for opaque-origin iframes; sender identification uses `MessageEvent.source`, NOT `event.origin`.
3. Identity binding: the shell maps `MessageEvent.source` to napplet identity at iframe creation. The browser's `MessageEvent.source` is unforgeable within the same browsing context.
4. Aggregate hash verification against [NIP-5A](5A.md) manifests; mismatch MAY result in napplet rejection.
5. Unrecognized message types are silently ignored, preventing capability probing.

Storage isolation, signing safety, relay access control, and ACL enforcement are defined by their respective NUB specs.

**Non-Guarantees:** The protocol does NOT protect against a compromised browser, a malicious shell, side-channel attacks, or social engineering.

## References

- [NIP-07](07.md) -- `window.nostr` signer capability
- [NIP-5A](5A.md) -- Napplet manifest format and aggregate hash
