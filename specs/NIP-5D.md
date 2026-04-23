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

## Security Considerations

Napplets are untrusted code. The shell is trusted. The browser enforces iframe sandbox boundaries. `MessageEvent.source` provides unforgeable sender identity.

**Mitigations:**
1. Iframe sandbox: `allow-scripts` is the only required token -- shells MUST NOT add `allow-same-origin`.
2. postMessage `'*'` origin is required for opaque-origin iframes; sender identification uses `MessageEvent.source`, NOT `event.origin`.
3. Identity binding: the shell maps `MessageEvent.source` to napplet identity at iframe creation. The browser's `MessageEvent.source` is unforgeable within the same browsing context.
4. Aggregate hash verification against [NIP-5A](5A.md) manifests; mismatch MAY result in napplet rejection.
5. Unrecognized message types are silently ignored, preventing capability probing.
6. Napplets produce cleartext only. Shells MUST NOT sign or broadcast events containing ciphertext received from a napplet. Shells MUST NOT provide `window.nostr` (NIP-07) or any signing/encryption primitives.

Storage isolation, relay access control, and ACL enforcement are defined by their respective NUB specs.

### Browser-Enforced Resource Isolation

The mitigations above describe ambient trust ("napplets shouldn't fetch directly"). Shells SHOULD additionally enforce browser-level isolation so that napplets *cannot* fetch directly even if their code attempts to.

**Strict Content Security Policy.** Shells SHOULD deliver napplet HTML under a strict Content Security Policy that disallows `'unsafe-inline'` and `'unsafe-eval'` in `script-src`, sets `connect-src 'none'` in production builds, sets `default-src 'none'`, and uses nonce-based `script-src` for any inline scripts. The CSP SHOULD be delivered as the first child of `<head>` so that no element is parsed before the policy binds. Shells that enforce this posture SHOULD advertise the `perm:strict-csp` capability via `window.napplet.shell.supports('perm:strict-csp')` so napplets can detect the posture at runtime.

Example minimal meta delivery:

    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none'; script-src 'nonce-...' 'self'; connect-src 'none'; img-src blob: data:; style-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'">

**Canonical fetch path.** Network-sourced bytes (avatars, banners, media artwork, blossom blobs, `data:` payloads, etc.) SHOULD reach napplets only through the resource NUB. The shell mediates the fetch, applies its policy (private-IP block, response size cap, timeouts, MIME byte-sniffing, SVG rasterization), and returns a `Blob` to the napplet. See the napplet/nubs registry NUB-RESOURCE specification for the message catalog, scheme handlers, and shell behavior contract.

**Sandbox reaffirmation.** As stated in the Transport section, napplet iframes MUST use `sandbox="allow-scripts"` and MUST NOT add `allow-same-origin`. Adding `allow-same-origin` would grant the napplet a real origin, allowing it to register a service worker, read shell `localStorage`, and bypass the resource NUB entirely. This prohibition is the load-bearing precondition for browser-enforced isolation; the strict-CSP posture above relies on the napplet remaining at an opaque origin.

Strict CSP, the resource NUB as canonical fetch path, and `sandbox="allow-scripts"` (without `allow-same-origin`) compose to convert ambient trust into browser-enforced isolation: the napplet *cannot* perform a network fetch the shell did not mediate.

### NIP-07 Extension Injection Residual

The Browser-Enforced Resource Isolation posture above closes direct network egress for honest napplet code. A separate threat is a NIP-07 signer extension the user has installed — such extensions commonly run content scripts with `all_frames: true`, causing the browser to inject the extension's page-world script into every frame including sandboxed napplet iframes. The resulting `window.nostr` surface, if exercised, would route signing and encryption around the shell — the same primitive this NIP's Transport section requires to be shell-mediated.

**Legacy `<script>`-tag injection.** Shells advertising `perm:strict-csp` (see the Browser-Enforced Resource Isolation subsection) serve napplet HTML under a nonce-based `script-src` directive. An extension that injects via the common `document.createElement('script'); s.textContent = '...'; head.appendChild(s)` pattern cannot know the per-load nonce. The browser rejects script execution and fires a `securitypolicyviolation` event whose `violatedDirective` begins with `script-src` (Chromium 144+ observed as `script-src-elem`, the element-level sub-directive; older Chromium and other browsers may emit the parent `script-src`). Shells MAY observe these violations via a `report-to` / `Report-To` endpoint and correlate offenders to napplet identity per the rules in `NUB-CLASS-1.md`.

**`world: 'MAIN'` extension-API residual.** Extensions using `chrome.scripting.executeScript({world: 'MAIN'})` (and equivalent main-world injection paths) bypass page CSP entirely per the WebExtension specification. No `securitypolicyviolation` event fires; no page-side detection mechanism exists. As of this writing no known NIP-07 extension ships this injection style, but the architecture cannot prevent future migration. This is documented honestly as a residual — not a fix.

**Structural mitigation and the spec-legal alternative.** The `connect-src 'none'` directive in the NUB-CLASS-1 baseline ensures that plaintext obtained inside a napplet — whether via an injected `window.nostr` or via the legitimate shell-mediated path — is trapped in the frame: the napplet has no direct network egress. Exfiltration requires calling a shell-mediated NUB (the shell observes and policies) or escaping the browser sandbox (architecturally forbidden). Napplets that need to decrypt NIP-04, NIP-44, or NIP-17 / NIP-59 events MUST call `identity.decrypt(event)` on NUB-IDENTITY (see `NUB-IDENTITY.md`). Shells MUST gate this call to napplets assigned `class: 1` per `NUB-CLASS-1.md`; receive-side decrypt for other classes is refused with a `class-forbidden` error.

**Non-Guarantees:** The protocol does NOT protect against a compromised browser, a malicious shell, side-channel attacks, or social engineering.

## References

- [NIP-5A](5A.md) -- Napplet manifest format and aggregate hash