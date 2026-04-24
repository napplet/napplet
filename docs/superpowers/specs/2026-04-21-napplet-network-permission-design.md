# NUB-CONNECT: Shell-Permissioned Network Access for Napplets

**Date:** 2026-04-21
**Status:** Design — pending implementation plan
**Supersedes:** `perm:strict-csp` capability advertisement from v0.28.0 (deprecated, not removed)
**Companion specs:** NIP-5D (envelope), NIP-5A (manifest), NUB-RESOURCE (sandboxed byte fetching)

## Motivation

A napplet today has two network postures: (1) use NUB-RESOURCE to ask the shell for bytes at a URL (shell-proxied, GET-only, one `Blob` per call, heavily hardened), or (2) nothing — the iframe's strict CSP and `sandbox="allow-scripts"` posture prevents direct network I/O. There is no user-consented path between these extremes for napplets that need direct `fetch()`, `WebSocket`, `EventSource`, or streaming responses against a known set of origins.

NUB-CONNECT fills that gap with a deliberately minimal user-facing model: *"This napplet wants network access — approve?"* The napplet pre-declares the origins it wants in its NIP-5A manifest; the shell reads them, prompts the user once at load time (keyed on `(dTag, aggregateHash)`), and expresses the user's decision through the iframe's CSP.

The core architectural move is that **the shell becomes the sole runtime CSP authority for every napplet** — not just network-access ones. The build tool stops baking CSP into napplet HTML, and the shell emits a complete `Content-Security-Policy` HTTP header on every napplet document response. This is a larger change than NUB-CONNECT alone requires, but is load-bearing for grant decisions (which must be runtime-variable) and dramatically simplifies the responsibility split between build tooling and runtime.

## Non-Goals

- **Per-origin partial grants.** v1 is all-or-nothing. A future v2 may add partial grants; not in scope here.
- **Wildcards.** No `https://*.example.com`. Each subdomain is a separate tag, a separate item in the consent prompt, a separate approval.
- **Shell visibility into post-grant traffic.** Once a user approves `https://foo.com`, the shell sees nothing about what the napplet sends or receives on that origin. This is a fundamental, documented posture — not something to paper over.
- **Quota or rate-limiting on granted traffic.** The browser doesn't give the shell a hook to enforce this post-grant without a service worker, which `sandbox="allow-scripts"` forbids.
- **Auditability of individual requests.** Same reason.
- **A new wire protocol.** NUB-CONNECT has no postMessage message types. The NUB is wholly expressed through manifest tags, CSP emission, and a runtime state-query API.

## Architecture Overview

Three moving parts, and nothing else:

1. **Manifest declaration** — the napplet author lists required origins as `["connect", "<origin>"]` tags on the NIP-5A kind-35128 manifest.
2. **Shell consent + CSP emission** — the shell reads `connect` tags, prompts the user the first time a given `(dTag, aggregateHash)` is loaded, persists the decision, and emits the effective CSP as an HTTP response header on the napplet's HTML document.
3. **Runtime discovery API** — the napplet shim surfaces `window.napplet.connect.{granted, origins}` so the napplet can degrade gracefully when access was denied or the shell doesn't implement the NUB.

No wire protocol, no postMessage traffic, no negotiation. The manifest is the napplet's request; the CSP header is the shell's answer.

## Napplet Classes

Two classes of napplets exist under NUB-CONNECT. The classes describe the *posture* a napplet takes, not the CSP-emission mechanism — both classes get their CSP from the shell at runtime, only the effective `connect-src` differs.

**Class 1 — Static-CSP napplets.** No `connect` tags in the manifest. No consent prompt, no user-facing friction. The shell emits the baseline CSP with `connect-src 'none'`. `window.napplet.connect.granted === false`, `origins === []`. This is the default posture — if a napplet doesn't declare network needs, it gets no network, exactly as today's strict-CSP environment. Fully compatible with NUB-RESOURCE for shell-mediated byte fetches.

**Class 2 — Network-access napplets.** One or more `connect` tags in the manifest. Shell prompts the user the first time a given `(dTag, aggregateHash)` is loaded, persists the decision, and emits a CSP whose `connect-src` reflects the grant: approved → the declared origins verbatim; denied → `'none'`. `window.napplet.connect.granted` reflects the grant state.

The class is determined entirely by whether the napplet's manifest declares `connect` tags — there is no separate opt-in flag. A napplet moves between classes by rebuilding with a different tag set (which changes the aggregateHash).

## Responsibility Split

Under NUB-CONNECT, CSP emission is **entirely runtime, entirely shell-side** — for every napplet, not just network-access ones.

**Napplet author**
- Declares required network origins in the NIP-5A manifest.
- Writes napplet JS/HTML with **no inline scripts** — all JS loaded via `<script src="…">`.
- Does not manage CSP. Production napplet HTML ships with no meta CSP.
- Handles `window.napplet.connect.granted === false` gracefully.

**Shell (runtime)**
- MUST be the HTTP responder for the napplet's HTML document. This is the load-bearing precondition for runtime CSP emission — shells that cannot control the response headers on the napplet document cannot implement NUB-CONNECT. Acceptable delivery mechanisms: direct serving from the shell's origin, HTTP proxy, `blob:` URL with HTML transform, or `srcdoc` on the iframe. Implementation choice, but the shell MUST own the CSP header path.
- Parses the NIP-5A manifest, validates `connect` tag format, persists grant decisions keyed on `(dTag, aggregateHash)`.
- Emits a complete `Content-Security-Policy` HTTP response header on the napplet HTML.
- Prompts the user before first load when the manifest declares `connect` tags and no grant exists for the current `(dTag, aggregateHash)`.
- Exposes a revocation UI.
- Installs `window.napplet.connect` into the iframe at shim bootstrap.

**`@napplet/vite-plugin`**
- Production builds: **no meta CSP, no nonce generation**. All of `buildBaselineCsp`, `validateStrictCspOptions`, `assertMetaIsFirstHeadChild`, `assertNoDevLeakage` move into a dev-only code path or are removed.
- Production builds: **new fail-loud diagnostic** — if the napplet's HTML contains any `<script>` element without a `src` attribute, fail the build with a clear error. This is a developer-experience guard, not a security control (the shell CSP also blocks it).
- Dev mode (`vite serve`): MAY retain a meta CSP for shell-less local preview. This is a convenience for authors running `vite dev` without a shell container — not a normative posture and not inspected by any shell.

## Manifest Tag Shape

```
["connect", "<origin>"]
```

One tag per origin. Tags are repeated for multiple origins.

### Origin Format (strict)

- **Scheme:** `https:`, `wss:`, `http:`, or `ws:`. No `data:`, no `file:`, no `blob:`, no custom schemes.
- **Host:** explicit (no wildcards). IDN hosts MUST be in Punycode form (`xn--…`), lowercase.
- **Port:** optional, explicit only. Default ports MUST NOT be written (`https://foo.com:443` is illegal; use `https://foo.com`).
- **Path, query, fragment:** forbidden. CSP origin-match is scheme+host+port only.

### Validation (shell-side, at manifest-load time)

- Malformed tag (invalid scheme, wildcard, path present, default port present, non-Punycode IDN, uppercase host) → refuse to load the napplet with a diagnostic.
- Cleartext origin (`http:` or `ws:`) — permitted, but the shell's consent UI MUST mark it visibly as unencrypted. Shells MAY additionally enforce a deployment policy refusing cleartext entirely; such shells advertise this by returning `false` from `shell.supports('connect:scheme:http')` / `shell.supports('connect:scheme:ws')`.

### Content-Addressing Consequences

`connect` tags MUST participate in the aggregateHash. The build tool folds the sorted, normalized origin set into the aggregateHash computation via a synthetic entry, matching the pattern established for `config:schema` (see `packages/vite-plugin/src/index.ts` around line 568).

Concretely, the build tool hashes a canonical serialization of the origin set (e.g., sorted origins joined with `\n`), and pushes `[originsHash, 'connect:origins']` into the xTags array before computing the aggregate. The synthetic entry is excluded from the manifest's `['x', …]` tag projection — origins surface as their own `['connect', …]` tags, not as pseudo-file x-tags.

Consequence: any change to the origin list → new aggregateHash → prior grant auto-invalidated → re-prompt on next load. This is load-bearing: a napplet cannot silently add a new origin post-approval, because the content-addressed identity the grant is keyed on changes with the origin list.

## Runtime Discovery API (Shim)

```typescript
interface NappletConnect {
  /** True iff the shell approved all manifest-declared origins. False when denied,
   *  not yet prompted, or the shell does not implement NUB-CONNECT. */
  readonly granted: boolean;

  /** The origins the shell approved. Empty array when denied or no grant.
   *  When granted, always equal to the manifest's `connect` tag set (v1 is all-or-nothing). */
  readonly origins: readonly string[];
}
```

Surfaced as `window.napplet.connect` by the shim. Shim is installed into the iframe document by the shell at bootstrap (existing pattern — matches how `window.napplet.relay`, `window.napplet.identity`, etc. are installed).

Capability advertisement: `window.napplet.shell.supports('nub:connect')` → `boolean`.

## Shell Consent Flow

On every napplet iframe load, the shell performs the following sequence before returning the HTML response:

1. **Fetch manifest.** Retrieve the napplet's NIP-5A kind-35128 manifest (existing v0.28.0 path).
2. **Validate aggregateHash.** (existing v0.28.0 path).
3. **Parse `connect` tags.** Malformed tags → refuse load with diagnostic.
4. **Look up grant state** keyed on `(dTag, aggregateHash)`:
   - **No `connect` tags present (Class 1)** → emit the baseline CSP (below) with `connect-src 'none'`, proceed to load, set `granted = false, origins = []`.
   - **Class 2, grant record is APPROVED** → emit CSP with `connect-src` listing granted origins, proceed to load, set `granted = true, origins = [...]`.
   - **Class 2, grant record is DENIED** → emit CSP with `connect-src 'none'`, proceed to load, set `granted = false, origins = []`.
   - **Class 2, no grant record** → prompt user (below), persist result, proceed as per decision.
5. **Serve HTML** with the composed CSP header.
6. **Install shim** with `window.napplet.connect` populated from the decision.

### Prompt Requirements

The shell MUST present to the user:

- Napplet display name (from manifest) and `dTag`.
- Full list of declared `connect` origins.
- Cleartext origins MUST be visually distinguished (e.g., warning icon + "unencrypted — traffic can be read by anyone on the network path").
- A clear summary of what approval means, in language that reflects the actual trust posture: *"This napplet will be able to send and receive any data with the listed servers. The shell cannot see or filter that traffic."*
- Two buttons: **Approve** (approves all listed origins) and **Deny** (denies all listed origins). No partial grants in v1.

Persistence: decision is stored keyed on exactly `(dTag, aggregateHash)`. A napplet rebuild that changes any bundled file → new aggregateHash → grant auto-invalidated.

### Re-prompt on Origin Change

When a new `(dTag, aggregateHash)` is loaded and a prior grant existed for a different `aggregateHash` of the same `dTag`, the prompt SHOULD show a **diff**: "previously approved: X, Y, Z; now requesting: X, Y, W". Net-new origins MUST be visible. Removed origins MAY be noted informationally.

### Revocation

Shells MUST expose a user-facing UI to review and revoke grants. Revocation marks the grant state as DENIED (not deleted), so the shell retains knowledge that the napplet was once approved and can offer a "re-approve" affordance. Next load after revocation enforces `connect-src 'none'` and reports `granted = false`.

## Shell-Emitted CSP (Authoritative)

The shell emits exactly this CSP on every napplet HTML document response, with `connect-src` as the only variable:

```
Content-Security-Policy:
  default-src 'none';
  script-src 'self';
  connect-src {VARIABLE};
  img-src blob: data:;
  font-src blob: data:;
  style-src 'self';
  worker-src 'none';
  object-src 'none';
  base-uri 'none';
  form-action 'none'
```

Where `{VARIABLE}` is:

- `'none'` if the napplet has no `connect` tags, grant is denied, grant doesn't exist yet, or the shell does not implement NUB-CONNECT.
- Space-separated granted origins if grant is approved.

**No nonce** — inline scripts are forbidden, so `script-src 'self'` is sufficient. No HTML rewriting by the shell.

**No meta CSP** — production napplet HTML ships with no meta CSP. If a legacy napplet HTML contains a residual meta CSP, see "Edge Case 1" below.

**Out-of-directive invariants** that don't vary per-napplet:
- `default-src 'none'` — fail-closed
- `img-src blob: data:` — allows resources delivered via NUB-RESOURCE (Blob URLs) and inline data URIs
- `font-src blob: data:` — same
- `style-src 'self'` — allows same-origin stylesheets; blocks inline `<style>` and `style="…"` attributes
- `worker-src 'none'` — no Web Workers
- `object-src 'none'` — no plugins
- `base-uri 'none'` — no `<base>` hijack
- `form-action 'none'` — no form submission

## Edge Cases

### 1. Residual meta CSP on legacy napplets

A napplet built under v0.28.0 may ship with a meta CSP declaring `connect-src 'none'`. When the shell serves this napplet with a header CSP declaring `connect-src https://foo.com`, the browser takes the **intersection** → effective `connect-src 'none'` → grant is silently suppressed.

**Mitigation:** shells serving any Class-2 napplet (manifest with one or more `connect` tags) MUST scan the served HTML for a `<meta http-equiv="Content-Security-Policy">` element and refuse to serve with a clear diagnostic. Illustrative wording: *"napplet ships with a meta CSP that would suppress granted origins — rebuild with a version of `@napplet/vite-plugin` that omits meta CSP."*

Class-1 napplets with a legacy meta CSP are harmless — both the meta and the header say `connect-src 'none'`, intersection is still `'none'`, no user-visible breakage.

### 2. Port and IDN normalization

CSP `connect-src` matching is origin-match: scheme + host + port. No percent-encoding awareness, no case-folding beyond host-lowercase. The shell MUST validate at manifest-load time that:

- Host is all-lowercase.
- IDN hosts are in Punycode (`xn--…`) form.
- No default-port suffix (`:443` for `https:`, `:80` for `http:`, `:443` for `wss:`, `:80` for `ws:`).

Mismatch → refuse to load with diagnostic.

### 3. No subdomain implicit match

`https://example.com` does NOT grant `https://api.example.com`. Each subdomain is a separate tag requiring separate user consent. This is intentional — vague "wildcard" grants defeat the point of an informed prompt.

### 4. fetch() against a non-granted URL

Browser blocks with a CSP violation reported to devtools. Napplet catches the rejected promise and degrades. The shell does NOT observe this violation — the report is devtools-local. Napplets SHOULD NOT rely on shell-side error reporting for post-grant enforcement.

### 5. Interaction with NUB-RELAY

NUB-RELAY mediates Nostr relay traffic via shell-proxied postMessage and enforces per-event ACL. A napplet using NUB-RELAY does NOT need a `connect` tag for the relay's URL — the direct socket is the shell's, not the napplet's.

Declaring `wss://relay.damus.io` in a `connect` tag is for napplets that want to open a **direct** WebSocket to that relay, bypassing NUB-RELAY's event-level ACL. Shells MUST treat these as distinct: a `connect` grant for a relay URL gives the napplet a raw socket to that relay, not mediated relay access.

### 6. Mixed-content browser rules

If the shell is served over `https:`, the browser blocks `http:` fetches regardless of the shell's CSP header. So granting `http://public-host.com` usefully works only when the shell is itself served over `http:` (local dev, loopback). `http://localhost` and `http://127.0.0.1` are browser-level secure-context exceptions and work from an `https:` shell. SHELL-CONNECT-POLICY MUST document this for operator sanity.

## Security Considerations

### Posture vs. NUB-RESOURCE

NUB-CONNECT is substantially weaker than NUB-RESOURCE. The spec MUST be explicit about this so that napplet authors and users understand the tradeoff:

| | NUB-RESOURCE | NUB-CONNECT |
|---|---|---|
| Model | Shell-proxied byte fetch | Direct browser fetch |
| Methods | GET only | Any (GET/POST/PATCH/DELETE/…) |
| Streaming | No (one `Blob` per call) | Yes (streams, WebSocket, SSE) |
| Shell visibility post-grant | Full (MIME sniff, SVG rasterize, redirect re-validate) | None |
| Origin scope | URL per call, any scheme in whitelist | Pre-declared origins only |
| Private-IP block at DNS resolution | Yes | No (browser enforces origin match on URL string, not resolved IP) |
| User grant | Implicit (always available) | Explicit (per-napplet prompt) |
| Attack surface | Minimal (shell hardens everything) | Browser-enforced origin match only |

Napplet authors SHOULD default to NUB-RESOURCE for avatars, static assets, one-shot byte fetches, and bech32 resolution. They SHOULD reach for NUB-CONNECT only when they need: POST/PUT/PATCH methods, WebSocket/SSE, custom headers, long-lived connections, streaming responses, or third-party libraries that call `fetch()` directly and aren't reasonable to refactor.

### Cleartext confidentiality

`http:` and `ws:` origins forfeit confidentiality of traffic to those origins. Users approving a cleartext origin MUST see an explicit unencrypted-traffic warning. Shells MAY enforce a deployment policy refusing cleartext entirely (advertised via `shell.supports('connect:scheme:http')` returning `false`).

### Grant-bypass attempts

A napplet that ships a contradictory meta CSP (attempting to loosen origins beyond the declared manifest set) cannot succeed: the browser takes the intersection of meta and header, and the header is authoritative. Additionally, the shell's pre-serve HTML scan (Edge Case 1) rejects napplets with meta CSPs that would suppress granted origins.

### Sandbox preservation

`sandbox="allow-scripts"` (no `allow-same-origin`) is unaffected by NUB-CONNECT grants. The opaque origin invariant is preserved regardless of grant state — grants affect what the napplet can reach *out* to, not how it's isolated from the shell's own origin.

### Post-grant opacity (the fundamental tradeoff)

Once the user approves `https://foo.com`, the shell has **zero visibility** into what the napplet does with that origin. The user's grant is a full trust vote for the origin. The consent UI MUST phrase the decision accordingly — this is not "allow one image" but "let this napplet talk with `foo.com` however it wants."

## Capability Advertisement

Primary flag:
- `shell.supports('nub:connect')` → `true` when the shell implements NUB-CONNECT (manifest parsing, consent persistence, runtime CSP emission).

Secondary, operator-policy flags:
- `shell.supports('connect:scheme:http')` → `true` when the shell permits cleartext `http:` origins at all.
- `shell.supports('connect:scheme:ws')` → `true` when the shell permits cleartext `ws:` origins at all.

Napplets declaring cleartext origins SHOULD consult these before build, or at least degrade gracefully when loaded in a shell that refuses cleartext.

### Superseded: `perm:strict-csp`

The v0.28.0 `shell.supports('perm:strict-csp')` flag is **superseded**. Under NUB-CONNECT, a compliant shell is by definition the sole CSP emitter — there is no non-strict variant to negotiate. The flag SHOULD continue returning `true` for back-compat; the spec marks it deprecated.

## Graceful Degradation (Napplet Author Guidance)

Napplets that might want network access SHOULD be authored to handle four states, in priority order:

1. **Granted.** `granted === true`, `origins` covers what the napplet needs. Use direct `fetch()` / `WebSocket` / `EventSource` against approved origins.
2. **Denied, but NUB-RESOURCE available.** `granted === false`, `shell.supports('nub:resource') === true`. Fall back to `window.napplet.resource.bytes(url)` for anything NUB-RESOURCE can express.
3. **Denied, NUB-RESOURCE unavailable.** Run in offline/cached mode or display "this napplet needs network access — grant in [shell's permissions UI]".
4. **Shell does not implement NUB-CONNECT.** (`shell.supports('nub:connect') === false`.) Same as state 3.

States 1 and 2 are the common paths. States 3 and 4 are graceful shutdowns.

## Migration Path from v0.28.0

**v0.29.0 (breaking):**

- Draft NUB-CONNECT in the `napplet/nubs` public repo alongside NUB-RESOURCE, NUB-RELAY.
- In this repo:
  - `@napplet/vite-plugin`: drop production `strictCsp` emission. Remove / move to dev-only the meta-CSP builder, nonce generator, and meta-first-child assertion. Add inline-script build-time diagnostic. Accept a new `connect?: string[]` option whose values are (a) normalized and validated, (b) emitted as `['connect', …]` manifest tags, and (c) folded into aggregateHash via the synthetic `connect:origins` xTag entry.
  - `@napplet/shim`: add `window.napplet.connect` installer.
  - `@napplet/sdk`: re-export the connect API.
  - New package or NUB folder: `@napplet/nub-connect` carrying the types + SDK surface, matching the existing NUB-per-package layout.
- Add `specs/SHELL-CONNECT-POLICY.md` as the shell-deployer checklist (parallel to existing `specs/SHELL-RESOURCE-POLICY.md`).
- Bump all packages, ship via changesets.

**Existing napplets continue to work as Class 1** — the residual v0.28.0 meta CSP is harmless for napplets with no `connect` tags (both meta and header say `connect-src 'none'`, intersection is `'none'`, no change). Napplets that later become Class 2 by adopting `connect` tags MUST rebuild without the meta CSP.

## Testing Posture

- Unit tests for manifest tag parsing and origin normalization: reject wildcards, reject paths, reject unknown schemes, accept cleartext with warning flag, normalize default ports, require Punycode for IDN.
- Integration test: napplet with `connect` tag + shell with approved grant → `fetch(granted-url)` succeeds, `fetch(other-url)` is CSP-blocked.
- Integration test: napplet with `connect` tag + denied grant → `connect-src 'none'` in emitted CSP, `window.napplet.connect.granted === false`.
- Integration test: napplet aggregateHash change (any dist file changed) → prior grant auto-invalidated, re-prompt occurs on next load.
- Integration test: napplet's `connect` origin list changed while dist files are unchanged → aggregateHash still changes (via the synthetic `connect:origins` fold) → prior grant auto-invalidated, re-prompt occurs on next load.
- Integration test: Class-2 napplet ships residual meta CSP → shell refuses to serve with the prescribed diagnostic (Edge Case 1).
- Integration test: Class-1 napplet ships residual meta CSP → shell serves normally (both meta and header converge on `connect-src 'none'`, no functional break).
- UX test: cleartext origin in the consent prompt is visibly distinguished from secure origins.
- UX test: origin-diff on aggregateHash change surfaces net-new origins.

## Deferred to v2

- Per-origin partial grants. Requires prompt UX for multi-toggle and a state model where `origins` is a subset of the manifest's declared set.
- Wildcard subdomains (`https://*.example.com`). Requires threat-model re-examination.
- Quota / rate-limiting on post-grant traffic. Browser does not expose the hook without a service worker, which `sandbox="allow-scripts"` forbids.
- Audit logging of individual network calls. Same reason — browser enforces CSP transparently to the shell.

## Open Questions for Implementation Plan

- Exact package layout: single `@napplet/nub-connect` package (matching `@napplet/nub-resource`) vs. surfacing through `@napplet/shim` directly. Decision to be made during plan authoring.
- Should the build-time inline-script diagnostic in `@napplet/vite-plugin` be a warning or a hard error? Lean hard error (fail-loud) — the napplet would otherwise break at runtime under the shell CSP.
- Should dev-mode `vite serve` retain a minimal meta CSP, or should `@napplet/vite-plugin` dev-mode CSP be removed entirely? Lean "retain for shell-less local preview only," but with a clearly deprecated path.
- Whether to formalize the shell-serves-the-napplet-HTML requirement as a NIP-5D amendment or leave it to NUB-CONNECT's prose. Lean NUB-CONNECT prose — NIP-5D doesn't currently specify how HTML is served, only how it's addressed and sandboxed.
