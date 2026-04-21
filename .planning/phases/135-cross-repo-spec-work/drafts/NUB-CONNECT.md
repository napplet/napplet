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

## Manifest Tag Shape

Origins are declared in the NIP-5A manifest using one tag per origin:

```
["connect", "<origin>"]
```

The `<origin>` value MUST be the lowercase, normalized, Punycode-encoded form defined in **Origin Format** below. Tags are signed as part of the NIP-5A manifest and participate in `aggregateHash` via a synthetic xTag entry defined in **Canonical `connect:origins` aggregateHash Fold** below. One origin, one tag; an origin list of length N produces exactly N `connect` tags in the manifest.

Worked example: a manifest fragment declaring three origins (two ASCII, one IDN converted to Punycode):

```
["connect", "https://api.example.com"]
["connect", "wss://events.example.com"]
["connect", "https://xn--caf-dma.example.com"]
```

The napplet-build tool is the sole author of these tags. Napplet authors do NOT hand-edit the manifest; they supply origins to the build tool's `connect: string[]` option and the build tool performs normalization, validation, and emission.

## Origin Format

Each origin MUST conform to the following rules. The napplet-build tool MUST reject any origin that fails these rules at build time; the shell MUST reject any `connect` tag whose value fails these rules at manifest-load time. Both sides enforce because the build rejection catches author errors early and the shell rejection catches tampering after signing.

- **Scheme whitelist.** The scheme part MUST be one of `https:`, `wss:`, `http:`, or `ws:`. Any other scheme — including `file:`, `ftp:`, `gopher:`, `data:`, `blob:`, and custom schemes — MUST be rejected. This is a closed set; shells MUST NOT accept additional schemes under any policy, and the build tool MUST NOT emit them.
- **Lowercase scheme and host.** The scheme and host parts MUST be lowercase on the wire. `HTTPS://FOO.COM` is invalid as emitted. The build tool MUST lowercase before emission; the shell MUST reject non-lowercase input with a diagnostic. Shells MUST NOT silently lowercase on lookup — doing so would cause two cosmetically different origins to produce two different aggregateHashes while matching the same CSP directive, breaking the determinism rationale for the fold below.
- **Punycode IDN.** A host containing any non-ASCII character MUST be Punycode-encoded (`xn--` form, lowercase) before emission. The build tool is the sole authority for the UTF-8 → Punycode conversion. The shell MUST NOT auto-convert and MUST reject any non-Punycode non-ASCII host with a diagnostic. This direction of authority ensures that whatever Punycode form the napplet author signs into the manifest is the byte-identical form the shell sees on lookup.
- **No wildcards.** The host MUST NOT contain `*`. Wildcard subdomains (for example `https://*.example.com`) MUST be rejected at build time and at manifest-load time. Each subdomain is a separate origin that requires its own `connect` tag and participates independently in the consent prompt.
- **Default ports banned.** If the port component would be the scheme's default (443 for `https:` and `wss:`, 80 for `http:` and `ws:`), the port MUST be omitted from the origin. `https://foo.com:443` MUST be rejected at build time; `https://foo.com` is the correct form. The rationale is aggregateHash determinism: two cosmetically different forms that CSP treats as equivalent origin-matches would otherwise produce different hashes, silently invalidating prior grants on no semantic change. Shells MUST NOT normalize default ports on lookup for the same reason.
- **No path, query, or fragment.** The origin is scheme + host + optional non-default port. `https://foo.com/api`, `https://foo.com?x=1`, and `https://foo.com#section` are all invalid. CSP `connect-src` matches at the origin granularity; path-level constraints are out of scope for NUB-CONNECT.
- **No trailing slash.** The origin MUST NOT end in `/`. `https://foo.com/` is invalid; `https://foo.com` is the correct form. This rule is a consequence of the no-path rule but is worth calling out because many URL-parsing libraries auto-append a trailing slash when stringifying a parsed origin.

### Origin Normalization Conformance Vectors

The table below enumerates canonical input/output pairs a conformant build tool and a conformant shell MUST agree on. Rows marked `reject` indicate inputs that MUST be refused with a diagnostic; rows with a normalized output indicate inputs that are accepted after producing the specified byte-identical string.

| Input | Normalized | Reason |
|-------|------------|--------|
| `HTTPS://api.example.com` | `https://api.example.com` | Uppercase scheme lowercased by build tool |
| `https://API.example.com` | `https://api.example.com` | Uppercase host lowercased by build tool |
| `https://foo.com/` | _reject_ | Trailing slash forbidden |
| `https://foo.com:443` | _reject_ | Default port `:443` for `https:` MUST NOT be written |
| `wss://events.example.com:443` | _reject_ | Default port `:443` for `wss:` MUST NOT be written |
| `http://foo.com:80` | _reject_ | Default port `:80` for `http:` MUST NOT be written |
| `https://api.example.com:8443` | `https://api.example.com:8443` | Non-default port accepted verbatim |
| `https://*.example.com` | _reject_ | Wildcard host forbidden |
| `https://foo.com/api` | _reject_ | Path not permitted in origin |
| `https://foo.com?x=1` | _reject_ | Query not permitted in origin |
| `https://foo.com#top` | _reject_ | Fragment not permitted in origin |
| `ftp://files.example.com` | _reject_ | Scheme not in whitelist |
| `data:text/plain,hello` | _reject_ | Scheme not in whitelist |
| `https://café.example.com` | `https://xn--caf-dma.example.com` | UTF-8 IDN converted to Punycode by build tool |
| `https://xn--caf-dma.example.com` | `https://xn--caf-dma.example.com` | Already Punycode, accepted verbatim |
| `https://CAFÉ.example.com` | _reject_ | Build tool rejects uppercase non-ASCII; author MUST supply lowercase or ASCII |
| `https://日本.example.com` | `https://xn--wgv71a.example.com` | Multi-byte UTF-8 IDN converted to Punycode by build tool |
| `https://api.example.com` | `https://api.example.com` | Already canonical, accepted verbatim (VALID accept case) |

Shell implementers MUST produce byte-identical output to the build tool for every accepted row. A disagreement on any row is a conformance bug.

## Canonical `connect:origins` aggregateHash Fold

The set of accepted origins MUST be folded into `aggregateHash` via a synthetic xTag entry so that any change to the origin set invalidates prior grants keyed on `(dTag, aggregateHash)`. The fold is defined as normative pseudocode; the output is a 64-character lowercase hexadecimal SHA-256 digest.

```
# Input:  origins = list[str]
#         Each origin has already been validated and normalized per the
#         Origin Format rules above (scheme lowercased, host lowercased,
#         Punycode-encoded, no default port, no path / query / fragment,
#         no trailing slash).
# Output: a 64-character lowercase hexadecimal SHA-256 digest.

def connect_origins_fold(origins: list[str]) -> str:
    normalized = [o.lower() for o in origins]   # 1. lowercase (idempotent after normalization)
    normalized.sort()                            # 2. ASCII-ascending sort
    joined = "\n".join(normalized)               # 3. join with single LF, NO trailing newline
    encoded = joined.encode("utf-8")             # 4. UTF-8 encode
    digest = sha256(encoded).hexdigest()         # 5. SHA-256
    return digest.lower()                        # 6. lowercase hex (already lowercase from hexdigest)
```

The resulting digest is pushed as a synthetic xTag entry `[<hex-digest>, 'connect:origins']` into the manifest's xTag array **before** `aggregateHash` is computed. This synthetic entry participates in `aggregateHash` but is filtered out of the `['x', ...]` tag projection in the signed manifest — the public manifest surfaces origins as their own `['connect', ...]` tags, not as pseudo-file x-tag entries.

Shells performing grant lookups MUST recompute the fold from the manifest's `['connect', ...]` tags (after normalization-equivalence verification) and MUST verify that the recomputed digest matches the synthetic `connect:origins` xTag's hash. A mismatch MUST result in manifest rejection with a diagnostic; a mismatch indicates either a build-tool bug or post-signing tampering, and in neither case is it safe to proceed. This double-entry — origin tags plus folded hash — is the guard against silent origin-list tampering.

### Conformance Fixture

The following fixture is normative for interop. A conformant build tool and a conformant shell MUST both produce the specified hexadecimal digest from the specified input origins.

```
Input origins (post-normalization, as supplied by the napplet author):
  https://api.example.com
  https://xn--caf-dma.example.com
  wss://events.example.com

Sorted (ASCII-ascending):
  https://api.example.com
  https://xn--caf-dma.example.com
  wss://events.example.com

Joined with literal LF (\n), no trailing newline:
  https://api.example.com\nhttps://xn--caf-dma.example.com\nwss://events.example.com

UTF-8 byte length of the joined string: 80

Expected SHA-256 lowercase hex digest:
  cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742
```

The digest above can be verified independently with a one-liner such as `python3 -c "import hashlib; print(hashlib.sha256(b'https://api.example.com\nhttps://xn--caf-dma.example.com\nwss://events.example.com').hexdigest())"`. Implementations whose output differs from `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742` for the specified inputs are non-conformant.
