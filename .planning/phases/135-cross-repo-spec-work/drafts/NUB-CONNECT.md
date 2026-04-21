NUB-CONNECT
===========

User-Gated Direct Network Access
--------------------------------

`draft`

**NUB ID:** NUB-CONNECT
**Namespace:** `window.napplet.connect`
**Discovery:** `shell.supports("connect")`
**Parent:** NIP-5D

## Description

NUB-CONNECT provides sandboxed napplets with user-gated direct network access (`fetch`, `WebSocket`, `SSE`, `EventSource`) to a pre-declared list of origins. Origins are declared at build time via `["connect", "<origin>"]` tags in the NIP-5A manifest. The host shell reads those tags, prompts the user for approval at first load of a given `(dTag, aggregateHash)`, persists the decision, and emits a runtime Content Security Policy whose `connect-src` directive contains the approved origin list. The user's decision is expressed through the HTTP-response CSP the shell serves with the napplet's HTML — not through any postMessage traffic.

A napplet that declares any `connect` tag takes on the posture defined in `NUB-CLASS-2.md`. A napplet that declares no `connect` tags takes on the default posture defined in `NUB-CLASS-1.md`. This NUB does not redefine those class postures — see `NUB-CLASS-1.md` and `NUB-CLASS-2.md` for CSP shapes, consent-flow MUSTs, grant-persistence semantics, residual-meta-CSP refusal requirements, and revocation responsibilities. NUB-CONNECT defines the manifest-tag shape, origin format, canonical aggregateHash fold, runtime API, and capability advertisement that feed into the class determination; the postures themselves are owned by the sub-track documents.

NUB-CONNECT has **no postMessage wire protocol**. Grants are expressed entirely through the runtime CSP the shell emits in the HTTP response for the napplet's HTML, plus a shell-injected discovery meta tag (`<meta name="napplet-connect-granted" content="...">`) read synchronously by the napplet shim at install time. There are no `connect.*` envelopes in either direction. Implementers and readers looking for a wire message in this spec will not find one — the absence is deliberate.

## Motivation

The sandbox model inherited from NIP-5D (`sandbox="allow-scripts"`, no `allow-same-origin`) combined with a restrictive baseline CSP means napplets cannot, by default, reach the network directly. NUB-RESOURCE partially fills the gap with a shell-mediated single-`Blob` primitive (`resource.bytes(url) → Blob`): read-only, shell-visible, policy-enforced at the URL layer, with MIME byte-sniffing and SVG rasterization baked in. That primitive covers avatars, static assets, one-shot byte fetches, and bech32 resolution — a large fraction of napplet use cases.

What NUB-RESOURCE cannot express: `POST` / `PUT` / `PATCH` methods, WebSocket, Server-Sent Events, streaming responses, custom request headers, long-lived connections, and any third-party library that calls `fetch` or opens a socket directly. For those use cases, the napplet needs direct browser-level network access to a specific known host. Direct network access in a sandboxed iframe requires explicit CSP relaxation, which requires user consent — because the shell cannot see or filter traffic that flows directly from the iframe to an approved origin. NUB-CONNECT is the minimum-viable protocol for that consent.

Authors SHOULD default to NUB-RESOURCE for everything it can express; NUB-CONNECT exists specifically for the cases where the resource NUB cannot. The two NUBs are complementary, not competing — most non-trivial napplets will use both.

## Non-Goals

- **Per-origin partial grants.** v1 is all-or-nothing: approving the prompt approves every declared origin. A future revision MAY add partial grants.
- **Wildcard subdomains.** `https://*.example.com` is not supported. Each subdomain is a separate origin requiring its own `connect` tag and its own line in the consent prompt.
- **Quota or rate-limiting on granted traffic.** The browser provides no hook for a shell running in a parent frame to inspect or rate-limit traffic from a sandboxed child frame's direct network I/O. A service worker could mediate the traffic, but the napplet's `sandbox="allow-scripts"` iframe forbids service-worker registration.
- **Audit logging of individual network calls.** Same reason: the browser enforces CSP transparently to the shell. The shell sees no per-request trace.
- **A postMessage wire protocol.** NUB-CONNECT is expressed through manifest tags, CSP, and a discovery meta tag. No `connect.request`, no `connect.approve`, no `connect.granted` envelope exists. Adding one would contradict the architectural decision documented here and in NUB-CLASS-2.md.
- **Shell visibility into post-grant traffic.** Once the user approves an origin, the shell has no browser-level mechanism to observe, filter, or intercept subsequent traffic between the napplet and that origin. This is the fundamental tradeoff of NUB-CONNECT versus NUB-RESOURCE; it is not a defect to be mitigated but a property to be disclosed clearly in the consent prompt.

## Architecture Overview

Three moving parts, and nothing else:

- **Napplet build.** The napplet author declares required origins through the napplet build tool's `connect: string[]` option. The build tool normalizes each origin (lowercase scheme and host, Punycode for IDN, strip default ports, reject malformed input), emits one `["connect", "<normalized-origin>"]` tag per origin into the signed NIP-5A manifest, and folds the normalized origin set into `aggregateHash` via a synthetic `connect:origins` xTag entry. Any change to the origin set — addition, removal, reorder after normalization — produces a different `aggregateHash` and therefore a different grant key.

- **Shell runtime.** The shell reads the manifest's `connect` tags, validates each origin against the format rules, and looks up grant state keyed on `(dTag, aggregateHash)`. On first load of a new key: prompt the user, persist the decision. On subsequent loads: reuse the persisted decision. On approval, emit a runtime CSP whose `connect-src` directive contains the approved origins and inject `<meta name="napplet-connect-granted" content="<space-separated-origins>">` into the served HTML. On denial, fall back to the posture defined in `NUB-CLASS-1.md` (the shell emits `connect-src 'none'` and the injected meta tag is empty or absent). Grant-persistence and consent-flow details are owned by `NUB-CLASS-2.md`.

- **Napplet runtime.** The napplet shim reads the discovery meta tag synchronously at install time and populates `window.napplet.connect` with `{ granted, origins }`. Napplet code branches on `window.napplet.connect.granted`: when `true`, call `fetch` / open `WebSocket` / `EventSource` directly against approved origins; when `false`, fall back to NUB-RESOURCE for what the resource NUB can express, or degrade the affected feature gracefully. The shim never waits for a wire message — grant state is known at install time.

## Posture Citation

A napplet declaring any `["connect", "<origin>"]` manifest tag takes on the posture defined in `NUB-CLASS-2.md`. A napplet with no `connect` tags takes on the default posture defined in `NUB-CLASS-1.md`. NUB-CONNECT does NOT redefine those postures: this NUB specifies only the manifest-tag shape, the origin format, the canonical aggregateHash fold, the runtime API, and the capability advertisement that feed the class determination. The concrete CSP directive shapes, the consent-prompt MUSTs, the shell responsibilities at serve time, the grant-persistence semantics, the residual-meta-CSP refuse-to-serve requirement, and the revocation UX are owned by `NUB-CLASS-2.md` — readers looking for any of those details MUST follow the citation rather than treating this section as a substitute. For the default-deny posture that a napplet without `connect` tags receives (and that a napplet whose user denied the consent prompt is downgraded to), see `NUB-CLASS-1.md`.
