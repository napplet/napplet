NIP-5D
======

Nostr Web Applets
-----------------

`draft` `optional`

This NIP defines a protocol for sandboxed web applications ("napplets") running in iframes to communicate with a hosting application ("shell") via postMessage using a generic JSON envelope. Protocol messages are defined by NUB (Napplet Unified Blueprint) extension specs.

## Philosophy

A napplet is a Nostr applet - a small, focused application that does one thing well. Napplets SHOULD be single-purpose rather than monolithic. A chat widget, a feed viewer, a profile editor, and a relay manager are four napplets, not one application with four tabs. The shell composes napplets; napplets do not compose themselves.
 
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

The `allow-same-origin` token MUST NOT be present. Shells MAY add additional sandbox tokens (`allow-forms`, `allow-modals`, `allow-downloads`, `allow-popups`) based on shell policy. Napplets have no access to `localStorage`, `sessionStorage`, `IndexedDB`, direct WebSocket connections, or signing keys. All storage, signing, encryption, and relay access is proxied through the shell.

The shell identifies senders via `MessageEvent.source` (unforgeable Window reference). Messages from unknown sources (iframes not created by the shell) MUST be silently dropped.

Shells MUST NOT provide `window.nostr` (NIP-07) to napplet iframes. Signing and encryption are security-critical operations that MUST be mediated by the shell. See the Security Rationale section below.

## Wire Format

All messages between napplet and shell are JSON objects with a `type` field:

    { "type": "<domain>.<action>", ...payload }

The `type` field is a string discriminant in `domain.action` format. Domains correspond to NUB capability names (e.g., a NUB named `foo` owns all `foo.*` types). NUB specs define the valid type strings and payload shapes for their domain. This NIP does not enumerate message types.

Example — a hypothetical `foo` NUB with a request/response pattern:

    { "type": "foo.bar", "id": "abc", "data": {...} }
    { "type": "foo.bar.result", "id": "abc", "result": {...} }

Messages with an unrecognized `type` MUST be silently ignored. This allows forward compatibility as new NUBs are defined.

## Identity

The shell assigns napplet identity at iframe creation time. No negotiation is required.

When the shell creates a napplet iframe, it maps the iframe's `Window` reference to the napplet's `(dTag, aggregateHash)` tuple from the [NIP-5A](5A.md) manifest. This mapping is the napplet's identity for the session. How the shell internally represents or derives identity is an implementation detail.

The shell MUST verify `MessageEvent.source` on every inbound message. Messages from Window references not mapped to a napplet identity MUST be silently dropped.

## Manifest and NUB Negotiation

Napplet manifests ([NIP-5A](5A.md) kind 35128) declare required capabilities using `requires` tags:

    ["requires", "<nub-name>"]

Each `requires` value is a short NUB name matching a NUB domain (e.g., `foo`). Manifests MUST NOT use spec identifiers (e.g., use `foo`, not `NUB-FOO`).

At napplet load time, the shell checks `requires` tags against its own capabilities. If a required capability is absent, the shell SHOULD reject the napplet or display a compatibility warning. If the manifest has no `requires` tags, the shell loads the napplet with whatever capabilities it provides.

### Runtime Capability Query

Napplets query capability support at runtime:

    window.napplet.shell.supports('foo')           // NUB capability — boolean
    window.napplet.shell.supports('perm:popups')   // permission — boolean

Shells MUST implement `window.napplet.shell.supports()`. The argument is a namespaced capability string:

| Prefix   | Example            | Meaning                         |
|----------|--------------------|---------------------------------|
| *(bare)* | `'relay'`          | Shorthand for `'nub:relay'`     |
| `nub:`   | `'nub:identity'`   | Shell implements the identity NUB |
| `perm:`  | `'perm:popups'`    | Shell grants popup permission   |

Napplets MUST gracefully degrade when a capability is absent.

## NUB Extension Framework

Protocol messages are defined by NUB (Napplet Unified Blueprint) specs. Each NUB owns a message domain and defines the `type` strings, payload shapes, and semantics for that domain. A NUB spec is self-contained — it references this NIP only for envelope format and transport.

For example, a NUB named `foo` would own all `foo.*` message types (e.g., `foo.bar`, `foo.bar.result`) and define their payloads and shell behavior.

NUB specs MUST:
- Define all valid `type` strings for their domain
- Specify the payload shape for each message type
- Document expected shell behavior for each message
- Be independently implementable — a shell MAY support any subset of NUBs

## Known NUBs

The following NUB specs are defined for this protocol:

| Domain     | Spec         | Scope                                       |
|------------|--------------|---------------------------------------------|
| `relay`    | NUB-RELAY    | Relay proxy (subscribe, publish, query)     |
| `identity` | NUB-IDENTITY | Read-only user identity queries             |
| `storage`  | NUB-STORAGE  | Scoped key-value storage proxy              |
| `ifc`      | NUB-IFC      | Inter-frame communication                   |
| `theme`    | NUB-THEME    | Theme tokens and appearance settings        |
| `keys`     | NUB-KEYS     | Keyboard forwarding and action keybindings  |
| `media`    | NUB-MEDIA    | Media session control and playback          |
| `notify`   | NUB-NOTIFY   | Shell-rendered notifications                |

Shells MAY support any subset of these NUBs. New NUBs may be proposed independently of this NIP.

## Security Rationale: No Direct Crypto Access

Napplets MUST NOT have direct access to signing keys, encryption, or decryption operations. This is a deliberate security boundary, not a limitation.

**The threat:** A malicious napplet with NIP-07 access (`window.nostr`) can call `signEvent()` and `nip44.encrypt()` to:
1. Sign arbitrary events on behalf of the user (identity theft).
2. Encrypt exfiltrated user data and publish it to relays as ciphertext the shell cannot inspect.

**The solution:** All cryptographic operations are mediated by the shell:
- **Signing:** Napplets submit unsigned event templates via `relay.publish`. The shell signs the event, allowing it to inspect content and enforce policies before broadcasting.
- **Encryption:** Napplets submit plaintext via `relay.publishEncrypted`. The shell encrypts the content, signs the event, and broadcasts it. The shell can inspect plaintext content before encryption.
- **Decryption:** The shell decrypts incoming encrypted events before delivering them to the napplet. Napplets receive plaintext and never see ciphertext.
- **Identity:** Napplets query read-only user information via the `identity` NUB (public key, profile, follows, etc.) without any write or signing capability.

This design ensures the shell maintains a complete audit trail of all signed and encrypted content, and can enforce content policies at the signing boundary.

## Security Considerations

Napplets are untrusted code. The shell is trusted. The browser enforces iframe sandbox boundaries. `MessageEvent.source` provides unforgeable sender identity.

**Mitigations:**
1. Iframe sandbox: `allow-scripts` is the only required token -- shells MUST NOT add `allow-same-origin`.
2. postMessage `'*'` origin is required for opaque-origin iframes; sender identification uses `MessageEvent.source`, NOT `event.origin`.
3. Identity binding: the shell maps `MessageEvent.source` to napplet identity at iframe creation. The browser's `MessageEvent.source` is unforgeable within the same browsing context.
4. Aggregate hash verification against [NIP-5A](5A.md) manifests; mismatch MAY result in napplet rejection.
5. Unrecognized message types are silently ignored, preventing capability probing.

Storage isolation, signing safety, relay access control, and ACL enforcement are defined by their respective NUB specs.

**Non-Guarantees:** The protocol does NOT protect against a compromised browser, a malicious shell, side-channel attacks, or social engineering.

## References

- [NIP-5A](5A.md) -- Napplet manifest format and aggregate hash
- [NUB-IDENTITY](https://github.com/napplet/nubs/blob/main/NUB-IDENTITY.md) -- Read-only user identity queries
- [NUB-KEYS](https://github.com/napplet/nubs/blob/main/NUB-KEYS.md) -- Keyboard forwarding and action keybindings
- [NUB-MEDIA](https://github.com/napplet/nubs/blob/main/NUB-MEDIA.md) -- Media session control and playback
