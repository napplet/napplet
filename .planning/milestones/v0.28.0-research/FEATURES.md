# Feature Research — v0.28.0 Browser-Enforced Resource Isolation

**Domain:** Sandboxed-iframe app + shell-mediated resource fetching layer (napplet protocol)
**Researched:** 2026-04-20
**Confidence:** HIGH on table stakes / anti-features (multiple peer systems converge); MEDIUM on transform-hint and sidecar shapes (WebSearch-only, no spec authority for our exact use case)

## Scope Anchor

This milestone introduces ONE new napplet-side primitive — `resource.bytes(url) → blob` — backed by a scheme-pluggable shell broker, and tightens the browser-enforced perimeter (CSP `connect-src 'none'`, no `allow-same-origin`) so napplets *cannot* fetch directly even if they try.

**EXPLICIT SCOPE-OUT (must remain out):** Audio and video playback. The streaming/seek/codec model is fundamentally different from byte-blob delivery and demands a shell-composited compositor approach. Forcing that into `resource.bytes()` would either bloat this NUB or build the wrong abstraction. Defer to a later compositor milestone.

## Feature Landscape

### Table Stakes (Users Expect These)

Without these, the napplet UX is visibly broken or insecure. Drawn from convergent practice across Electron `protocol.handle`, Tauri custom protocols, Figma plugin networking, and Slack Block Kit hosted images.

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|--------------|------------|-------|
| TS-1 | `resource.bytes(url) → Blob` request/result envelope (`resource.bytes` / `resource.bytes.result`) with correlation `id` | The primitive itself. Without it, no images, no inline assets, nothing the napplet can render from network. | S | Mirrors `identity.getProfile` request/result shape. |
| TS-2 | At least 4 schemes plumbed: `https:`, `data:`, `blossom:`, `nostr:` | Stated milestone target. `data:` is mandatory because it's the only zero-network fallback (placeholders, embedded SVG-as-data after rasterization, BlurHash-style decoded payloads). `blossom:` and `nostr:` are the Nostr-native ones. | M | `data:` is technically resolved entirely client-side but MUST flow through the same primitive so the napplet has one code path. Otherwise napplets bifurcate. |
| TS-3 | Distinguished failure modes in the result envelope (not a single boolean) | "Image broken" with no reason is the single most common DX complaint about sandboxed plugin systems. Need at minimum: `not-found`, `blocked-by-policy`, `timeout`, `too-large`, `unsupported-scheme`, `decode-failed`, `network-error`. | S | Strongly typed `error` discriminator. Lets napplet show "blocked by shell" vs "404" vs "still loading". |
| TS-4 | MIME / content-type returned alongside bytes | Napplets need to know whether to render as `<img>`, `<embed>`, or refuse. `Blob.type` alone is insufficient because napplets can't trust napplet-side sniffing under sandbox. | S | Shell sniffs once, classifies, returns canonical MIME string. |
| TS-5 | Cancellation semantics (napplet can abandon a pending request) | Standard `AbortController` ergonomics. Without it, scrolling feeds leak shell-side fetches and burn shell rate-limit budget. Universal precedent — `fetch()`, GraphQL clients, RPC libraries all expect this. | S | Either a `resource.cancel { id }` envelope or a fire-and-forget on the napplet that drops the result. Shell SHOULD propagate to upstream `AbortController`. |
| TS-6 | Strict CSP delivered to the iframe at creation time, with `connect-src 'none'`, `script-src 'self' blob: data:` (or similar), `frame-ancestors 'self'` | This is THE security gate. If it's not browser-enforced, "shell mediation" is just a polite request the napplet can ignore. Must be delivered via mechanism that survives `srcdoc` and opaque-origin contexts. | M | HTTP header is most robust; meta tag does NOT support `sandbox` and inherits parent CSP issues; `srcdoc` requires careful inheritance handling. See ARCHITECTURE research for the delivery decision. |
| TS-7 | Default shell resource policy with hard SSRF guards | Industry consensus (OWASP, Wiz, Stytch 2025): block private-IP ranges (127/8, 10/8, 172.16/12, 192.168/16, 169.254/16, ::1/128, fc00::/7, fe80::/10) at resolution time, not just at URL parse time (DNS rebinding). Plus per-request size cap, per-napplet rate limit, per-request timeout. | M | Documented as default policy in spec. Shell host can override. Must run after DNS resolution to defeat rebinding — see PITFALLS. |
| TS-8 | SVG handling that NEVER hands scriptable XML to the napplet | Documented XSS vector across every web platform that ships SVG (Angular CVE-2025-66412, sanitize-svg CVE-2023-22461, recurring `<animate>`/`<foreignObject>` bypasses). Sanitize-by-stripping is fragile; rasterize-by-default is the safe stance. Milestone explicitly calls for shell-side rasterization. | M | Shell rasterizes SVG → PNG; napplet receives `image/png` Blob with original URL preserved. Napplet never sees raw SVG bytes. |
| TS-9 | `shell.supports('resource')` (NUB capability check) and `shell.supports('resource:scheme:blossom')`-style scheme-level capability check | Existing `shell.supports()` precedent. Napplets must be able to ask "can you do `nostr:` URLs?" before rendering a `nostr:` URL link. | S | Use existing namespace; add scheme-level sub-capability (new pattern but consistent with existing `nub:`/`perm:` precedent). |
| TS-10 | Vite-plugin emits CSP-aware napplet HTML in dev (matches production posture) | Stated milestone target. Without it, napplets work in dev and break on deploy because dev iframe has no CSP. The single most common "works on my machine" pattern in plugin systems. | M | Vite plugin already exists; add CSP middleware/transform. Mirror the headers the shell will set. |
| TS-11 | NIP-5D Security Considerations amendment documenting the strict-CSP posture and `resource.bytes` contract | Spec hygiene. Shells implementing NIP-5D must know to set CSP and provide the `resource` NUB or napplets can't ship images. | S | Documentation only; ties to TS-1, TS-6. |
| TS-12 | Single Blob delivery (not chunked, not streaming) for v0.28.0 | Matches the explicit scope-out of audio/video. Streaming requires backpressure, partial-failure handling, range requests — all of which are properly the compositor milestone's problem. Whole-blob is what every comparable system uses for static assets (Electron `protocol.handle` returns Response, Tauri custom-protocol returns Vec<u8>, Figma plugins receive whole responses). | S | Document the cap (e.g., 25 MiB default). Napplets that need bigger are a future milestone. |

### Differentiators (Worth Having for v0.28)

These are not strictly required for the protocol to be usable, but each materially improves either DX or shell efficiency, and each is small enough to land in v0.28 without dragging the milestone.

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| DF-1 | Optional `sidecar` field on `relay.event` envelopes carrying pre-resolved resources `{ url → { mime, blob, error? } }` | Eliminates a double-roundtrip when the napplet immediately renders an image referenced in the event (the dominant case for feed napplets and profile viewers). The shell already knows the napplet has the event; pre-resolving the obvious URLs (profile picture in kind 0, image in kind 1, artwork in kind 30002, etc.) is invisible win. Milestone explicitly calls for this. | M | Pattern parallel: GraphQL `@defer` (multipart payload with later-arriving fragments) and ActivityPub attachments embedded in the activity. We embed up-front instead of deferring because the shell already paid the fetch cost; deferring would re-cost. **Amends NUB-RELAY** — sidecar is additive; old napplets ignore. |
| DF-2 | Scheme registry is shell-pluggable (host can register additional handlers at runtime) | Future-proofs without further protocol changes. Enables `ipfs:`, `arweave:`, `magnet:`, custom enterprise schemes without a NUB amendment. Tauri and Electron both expose this; absence in our protocol would be a notable regression vs. the desktop precedents. | S | Shell-internal API, not part of the wire protocol. NUB-RESOURCE spec says "shell MAY support additional schemes; napplets discover via `shell.supports('resource:scheme:foo')`". |
| DF-3 | Optional `hint` field on `resource.bytes` request: `{ purpose?: 'thumbnail'\|'full', maxWidth?: number, maxHeight?: number, preferFormat?: 'webp'\|'avif'\|'png'\|'jpeg' }` | Lets the shell short-circuit large fetches when the napplet only needs a thumbnail (avatar grid, message previews). Imgix/Cloudinary precedent: clients send `auto=format`, `max-w=`, `q=` parameters. Imgix's automatic content negotiation is the closest peer. **Hints, not commands** — shell may ignore. | M | Shell satisfies hint either by transforming locally (likely a future enhancement) or by rewriting the URL when fetching from a transform-aware backend (Imgix/Cloudinary). v0.28 ships the hint surface; behavior can be no-op-passes-through and still be valuable as a forward-compatible API. |
| DF-4 | Optional `priority: 'high' \| 'low' \| 'auto'` on `resource.bytes` request | Mirrors browser `fetchpriority` attribute (Chrome 101+, in spec). Lets feed napplets say "hero image now, off-screen avatars later" without inventing custom orchestration. Shell uses this to order its fetch queue and to prefer cached results for low-priority. | S | Three-state enum, `auto` default. Shell MAY ignore. Surface lands in v0.28 even if shell behavior is naive. |
| DF-5 | `resource.bytes.progress { id, fetched, total? }` push messages for in-flight large fetches | Lets napplets show real progress on multi-MB images instead of "loading…" forever. Optional — napplets without progress UI ignore. | M | Borderline — could defer. Include only if cost is small in shim/SDK. **Amend** NUB-RESOURCE if added; do not add to v0.28 result envelope shape. |
| DF-6 | Speculative `resource.preload(url, { priority: 'low' })` envelope (fire-and-forget warm-up) | Pattern from `<link rel=prefetch>` and IntersectionObserver-driven prefetch. Napplet about to scroll into view of an image can warm shell cache. Shell MAY ignore entirely. | S | Useful for feed napplets. Cheap to add — same handler, just no result. |
| DF-7 | Cache-key transparency: result envelope includes a stable `cacheKey` string the napplet can use to short-circuit its own re-renders | Napplet doesn't need to manage cache (shell does), but knowing whether two URL responses are byte-identical lets it skip re-decoding. Minor DX win. | S | Hash of `(scheme, normalized URL, hint)`. |
| DF-8 | NUB-IDENTITY clarifying note: profile `picture` field is a URL the napplet MUST resolve via `resource.bytes(url)` (not direct `<img src=>`) | Existing NUB-IDENTITY just hands back a URL string. Without explicit guidance, napplet authors will write `<img src={profile.picture}>` and it will be CSP-blocked. Clarification in the spec + SDK helper. | S | **Amends NUB-IDENTITY** documentation only, no wire change. |
| DF-9 | NUB-MEDIA clarifying note: `MediaArtwork.url` MUST resolve via `resource.bytes()`; `MediaArtwork.hash` is a `blossom:` shorthand the shell MAY auto-resolve | Same DX trap as DF-8 but for media artwork. The existing `MediaArtwork` type already anticipates Blossom, so this is mostly aligning the existing intent with the new primitive. | S | **Amends NUB-MEDIA** documentation only, no wire change. |
| DF-10 | Demo napplets exercising the model end-to-end: profile viewer (NUB-IDENTITY → `resource.bytes`), feed napplet with inline images, scheme-mixed consumer (https + blossom + data on one screen) | Stated milestone target. Demos are the contract test for "did we actually make this usable". A profile picture failing to render in the demo is the canary that the milestone is incomplete. | M | Three demo napplets minimum. Each must be obviously broken if any TS-* feature is missing. |

### Anti-Features (Tempting; Do NOT Add)

Each of these will get suggested ("just one more thing…"). Each is a trap. The reasons are documented so they don't get re-litigated mid-milestone.

| # | Anti-Feature | Why Tempted | Why Problematic | Alternative |
|---|---|---|---|---|
| AF-1 | Raw `fetch` passthrough (`resource.fetch(url, init)` with method/headers/body) | Looks like obvious convenience; "what if napplet needs POST?" | Reintroduces every problem the milestone is solving. POST + custom headers means napplets can exfiltrate (POST to attacker-controlled URL with stolen state in body). Method/header surface is the SSRF amplifier in every audited proxy. The whole point is a *narrow* primitive — bytes in, bytes out, no side effects. | If a napplet needs to POST, that's a NUB. Build it as a typed message in the appropriate domain (e.g., `relay.publish` for Nostr writes, future `nip96.upload` for media writes). |
| AF-2 | Napplet-controlled cache invalidation (`resource.invalidate(url)` or cache headers passed in) | "What if the avatar changed?" | Caching strategy is a shell concern. Letting napplets invalidate is a DoS vector (force shell to re-fetch on every render) and a privacy leak (napplet can probe "did you have this URL cached recently?"). | Shell decides cache TTL per scheme/MIME. Content-addressed schemes (`blossom:`, `nostr:`) are immutable so the question doesn't arise. For `https:` rely on shell's own cache headers handling. |
| AF-3 | OAuth / cookie-bearing requests | "What if the napplet needs to fetch from a service the user is logged into?" | This is the entire reason the iframe is opaque-origin. Bearing user credentials into napplet-requested fetches is a credential-laundering attack surface and turns the shell into a confused deputy. | Auth'd APIs belong behind a NUB that mediates the auth (shell holds token, exposes typed methods). Napplet never gets credentials directly. |
| AF-4 | Lightning-paid resources (L402, payment-required URLs) | Nostr ecosystem will request this within months | Conflates two separate concerns: payment authorization and byte fetching. Belongs in a separate NUB (e.g., NUB-PAY), with `resource.bytes` consuming a payment-token if needed. Adding payment to v0.28 doubles the surface. | Defer. Land NUB-RESOURCE clean; build NUB-PAY later; let `resource.bytes` accept an optional opaque `paymentToken` argument when NUB-PAY ships. |
| AF-5 | Audio/video streaming, range requests, MediaSource integration | "We have media artwork already; let's just stream the audio too." | Streaming is fundamentally different: backpressure, partial failure, codec negotiation, gap-filling, seek. Trying to express this through `resource.bytes(url) → Blob` either bloats the primitive into a streaming protocol or ships a lie that doesn't actually stream. The compositor model (shell renders the video element, napplet sees a placeholder/handle) is the correct abstraction. | Explicitly defer to a later "shell-composited compositor" milestone. Document this scope-out in the NUB-RESOURCE spec. |
| AF-6 | WebSocket proxy (`resource.socket(url)`) | Real-time data not delivered via Nostr relays | The whole proxy surface for streams is huge. Existing NUB-RELAY already handles the Nostr-flavored streaming case. Anything else is a special-purpose NUB. | Build a specific NUB if/when needed. Don't pre-build a generic socket bridge. |
| AF-7 | Napplet-supplied custom MIME sniffing or trust-the-Content-Type-header | "Just pass the server's Content-Type through" | The shell *must* sniff and classify because `Content-Type` is attacker-controlled when fetching arbitrary URLs. Mis-classified bytes are how SVG-XSS and HTML-injection-via-image happen. | Shell sniffs (magic bytes), normalizes to a canonical MIME, refuses anything in a denylist (`text/html`, `application/javascript`, raw `image/svg+xml` pre-rasterization). |
| AF-8 | Napplet-controlled CSP (loosen the policy from inside the iframe) | "My napplet needs to inline some JS / use eval / load a font from CDN" | The whole milestone's premise. CSP is the trust gate; making it negotiable defeats it. | Shell sets CSP. Napplets that need fonts/styles bundle them or resolve them via `resource.bytes()` and inject as `data:` URLs (which the policy explicitly allows). |
| AF-9 | Hash exposure to napplets ("here's the SHA-256 of what you got") | "Useful for content-addressing within napplet logic" | Stated PROJECT.md decision: **hashes stay shell-internal; napplets address resources by URL only**. Exposing hashes leaks shell internals and lets napplets probe shell cache state. | Napplet uses URLs (including `blossom:<hash>` and `nostr:<nevent>`) as identifiers. Shell handles hash verification internally. |
| AF-10 | Synchronous `resource.bytes` (block-on-result API in shim) | "Easier mental model for napplet authors" | postMessage is fundamentally async; faking sync via `Atomics.wait` requires SharedArrayBuffer (cross-origin-isolated only) which conflicts with the opaque-origin sandbox. Trying to fake it via spinning is broken. | Promise-returning SDK helper. Standard async/await. Same pattern every other NUB uses. |
| AF-11 | "Just fetch through `<img src=blossom://...>`" by intercepting `<img>` requests inside the iframe | Looks magical | Requires either same-origin iframe (defeats sandbox) or a Service Worker registered in the iframe (not possible under opaque origin) or browser-level scheme handlers (don't exist). The sandbox literally precludes this. | Napplets use `URL.createObjectURL(blob)` from the result of `resource.bytes()` and assign that to `<img src=>`. This is the standard pattern; document it in SDK and demos. |

## Feature Dependencies

```
TS-6 (Strict CSP delivered)
    └──enables──> TS-1 (resource.bytes is the ONLY way bytes get in)
                       └──requires──> TS-2 (at least 4 schemes)
                                            ├── https:  → TS-7 (SSRF policy)
                                            ├── blossom: → existing Nostr infra
                                            ├── nostr:   → NUB-RELAY (existing)
                                            └── data:    → pure napplet-side, no fetch
                       └──requires──> TS-3 (typed failures)
                       └──requires──> TS-4 (MIME on result)
                       └──requires──> TS-5 (cancellation)
                       └──requires──> TS-12 (single Blob, not chunked)

TS-1 ──enables──> TS-9  (capability check)
TS-1 ──enables──> TS-11 (NIP-5D amendment documents TS-1's contract)
TS-6 ──enables──> TS-10 (vite-plugin emits matching CSP)

TS-8 (SVG rasterization) ──depends-on──> TS-4 (MIME classification triggers it)

DF-1 (sidecar on relay.event) ──depends-on──> TS-1 + TS-3 (uses same bytes/error shape)
                              ──amends──>  NUB-RELAY (additive field)
DF-2 (pluggable schemes)      ──depends-on──> TS-2 (four schemes prove the registry works)
DF-3 (transform hints)        ──depends-on──> TS-1 (additive on request envelope)
DF-4 (priority)               ──depends-on──> TS-1 (additive on request envelope)
DF-5 (progress events)        ──depends-on──> TS-1 (additional message type)
DF-6 (preload)                ──depends-on──> TS-1 (separate fire-and-forget envelope)
DF-7 (cacheKey on result)     ──depends-on──> TS-1 + TS-4
DF-8 (NUB-IDENTITY note)      ──depends-on──> TS-1
DF-9 (NUB-MEDIA note)         ──depends-on──> TS-1
DF-10 (demo napplets)         ──depends-on──> all of TS-* (demos are the contract test)

AF-* ──conflicts-with──> the entire TS-* set (each anti-feature, if added, breaks the security model that TS-6/TS-7 rely on)
```

### Dependency Notes

- **TS-6 is the load-bearing feature.** Without browser-enforced CSP, every other table-stake collapses to "the shell asks the napplet politely not to fetch." The whole milestone hinges on this being correct first.
- **DF-1 (sidecar) must use the same envelope shape as TS-1** so the napplet has one code path — the sidecar is just a pre-arrived `resource.bytes.result` keyed by URL. Inventing a separate sidecar shape is a documented anti-pattern (see GraphQL `@defer` — incremental payloads use the same data shape as the initial response). Otherwise napplets bifurcate to handle "URL I asked about" and "URL the shell pre-resolved" differently.
- **TS-2 ordering matters.** Implement `data:` first (zero policy surface, validates the dispatch path), then `https:` (validates SSRF policy), then `blossom:` and `nostr:` (validate Nostr-native paths). This sequencing is for execution; all four ship together in v0.28.
- **AF-1 (raw fetch) and AF-3 (OAuth) are the anti-features most likely to be re-requested.** Document them prominently.

## NUB Amendment Inventory

Existing NUBs that get touched by this milestone:

| Existing NUB | Touch | Wire Change? | Notes |
|---|---|---|---|
| NUB-RELAY (`packages/nub/src/relay/`) | DF-1 sidecar field on `RelayEventMessage` | YES (additive) | New optional `sidecar?: Record<string, { mime: string; blob: Blob; error?: string }>` field. Old napplets ignore. Shell only populates if napplet manifest declares `requires: ['resource']`. |
| NUB-IDENTITY (`packages/nub/src/identity/`) | DF-8 documentation only | NO | `ProfileData.picture` (and `banner`) are URLs the napplet must resolve via `resource.bytes()`. Update JSDoc + spec. SDK helper `resolveProfilePicture(profile)` is a nice-to-have. |
| NUB-MEDIA (`packages/nub/src/media/`) | DF-9 documentation only | NO | `MediaArtwork.url` flows through `resource.bytes()`; `MediaArtwork.hash` is `blossom:<hash>` shorthand. Already shaped for this. |
| (no other NUB) | — | — | NUB-CONFIG, NUB-NOTIFY, NUB-IFC, NUB-KEYS, NUB-STORAGE, NUB-THEME unaffected. |

New NUB:

| New NUB | Domain | Surface |
|---|---|---|
| NUB-RESOURCE | `resource.*` | TS-1 (`resource.bytes` / `.result`), TS-5 (`resource.cancel`), DF-5 (`resource.bytes.progress`), DF-6 (`resource.preload`). Spec lives in the public `napplet/nubs` repo (check existing draft PR convention before assigning a number). |

## MVP Definition

### Launch With (v0.28.0 itself)

This *is* the milestone. All TS-* features ship together — they're not independent.

- [ ] **TS-1** `resource.bytes` request/result envelope (NUB-RESOURCE package: types + shim + sdk)
- [ ] **TS-2** Four schemes plumbed end-to-end (`https`, `data`, `blossom`, `nostr`)
- [ ] **TS-3** Typed error discriminator on result
- [ ] **TS-4** Canonical MIME on result
- [ ] **TS-5** Cancellation envelope (`resource.cancel`) + AbortSignal-shaped SDK helper
- [ ] **TS-6** Strict CSP delivered to iframe (HTTP header path; document `srcdoc` and meta-tag escape hatches with their limitations)
- [ ] **TS-7** Default shell resource policy (private-IP block at resolution time, size cap, timeout, rate limit) — **documented in spec, reference implementation in shell repo**
- [ ] **TS-8** Shell-side SVG rasterization (refuse raw `image/svg+xml`)
- [ ] **TS-9** `shell.supports('resource')` and `shell.supports('resource:scheme:<name>')` capability checks
- [ ] **TS-10** Vite-plugin emits CSP-aware napplet HTML in dev
- [ ] **TS-11** NIP-5D Security Considerations amendment
- [ ] **TS-12** Single-Blob delivery (no streaming surface in v0.28)
- [ ] **DF-1** Sidecar field on `relay.event` (NUB-RELAY amendment) — high value, low surface, ship together
- [ ] **DF-8** NUB-IDENTITY clarification (doc only)
- [ ] **DF-9** NUB-MEDIA clarification (doc only)
- [ ] **DF-10** Three demo napplets (profile viewer, feed-with-images, scheme-mixed)

### Add After Validation (v0.28.x or next milestone)

Worth shipping in v0.28 if scope holds; if scope tightens, defer to a `v0.28.1`-style follow-up.

- [ ] **DF-2** Pluggable scheme registry exposed to shell hosts — trigger: a third-party shell wants `ipfs:` support
- [ ] **DF-3** Transform hints on request — trigger: feed napplets are wasting bandwidth on full-size avatars
- [ ] **DF-4** `priority` hint — trigger: same, plus measured shell-side queue contention
- [ ] **DF-7** `cacheKey` on result — trigger: napplets are observably re-decoding identical Blobs

### Future Consideration (later milestones)

- [ ] **DF-5** Progress push events — trigger: real complaints about no-feedback-on-large-images
- [ ] **DF-6** `resource.preload` — trigger: an actual feed napplet author asks for it
- [ ] **Compositor milestone** for audio/video (replaces what AF-5 would have been)
- [ ] **NUB-PAY** for L402-style paid resources (replaces what AF-4 would have been)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---|---|---|---|
| TS-1 `resource.bytes` envelope | HIGH | LOW | P1 |
| TS-2 Four schemes | HIGH | MEDIUM | P1 |
| TS-3 Typed errors | HIGH | LOW | P1 |
| TS-4 MIME on result | HIGH | LOW | P1 |
| TS-5 Cancellation | MEDIUM | LOW | P1 |
| TS-6 Strict CSP delivery | HIGH (security) | MEDIUM | P1 |
| TS-7 Default SSRF policy | HIGH (security) | MEDIUM | P1 |
| TS-8 SVG rasterization | HIGH (security) | MEDIUM | P1 |
| TS-9 `shell.supports('resource:scheme:*')` | MEDIUM | LOW | P1 |
| TS-10 vite-plugin CSP | HIGH (DX) | MEDIUM | P1 |
| TS-11 NIP-5D amendment | MEDIUM | LOW | P1 |
| TS-12 Single-blob delivery | (constraint, not feature) | LOW | P1 |
| DF-1 Sidecar on relay.event | HIGH | MEDIUM | P1 (ship with milestone) |
| DF-2 Pluggable scheme registry | MEDIUM | LOW | P2 |
| DF-3 Transform hints | MEDIUM | MEDIUM | P2 |
| DF-4 Priority hint | LOW | LOW | P2 |
| DF-5 Progress events | LOW | MEDIUM | P3 |
| DF-6 `resource.preload` | LOW | LOW | P3 |
| DF-7 cacheKey | LOW | LOW | P3 |
| DF-8 NUB-IDENTITY note | MEDIUM (DX) | LOW | P1 |
| DF-9 NUB-MEDIA note | MEDIUM (DX) | LOW | P1 |
| DF-10 Demo napplets | HIGH (validation) | MEDIUM | P1 |

**Priority key:**
- P1: Must have for v0.28.0 — these define the milestone
- P2: Should have, fold into v0.28 if scope holds
- P3: Defer, future milestone

## Peer System Comparison

Convergent practice from the systems most similar in posture (sandboxed plugin/applet host that brokers resource access).

| Concern | Electron `protocol.handle` | Tauri custom protocol | Figma plugins | Slack Block Kit | Salesforce LWS | **napplet v0.28** |
|---|---|---|---|---|---|---|
| Per-scheme handler registration | Yes (`protocol.handle(scheme, handler)`) | Yes (`Builder::register_uri_scheme_protocol`) | N/A — hosted iframe + `allowedDomains` allowlist | N/A — server-side only | Hosted iframe + `connect-src` allowlist | DF-2: shell-internal pluggable registry |
| Whole-response delivery (not streamed) | Returns `Response` (one-shot) | Returns `Vec<u8>` / `Response` | One-shot fetch via `figma.networkRequest` | N/A | One-shot via shell-mediated `fetch` callout | TS-12: single Blob |
| Failure typing | HTTP-style `Response.status` | HTTP-style `Response.status` | Throws on CSP violation | N/A | Throws on CSP violation | TS-3: typed error enum |
| Cancellation | Yes (Web Streams cancellation) | Yes (Tokio cancellation) | AbortSignal on `figma.networkRequest` | N/A | AbortSignal on `fetch` | TS-5: `resource.cancel` envelope |
| Pre-resolution / sidecar | N/A | N/A | N/A | Manual via `chat.unfurl` | N/A | DF-1: sidecar on `relay.event` (Nostr-flavored) |
| Transform hints | No (handler does whatever) | No | No | No | No | DF-3 (novel-ish; Imgix/Cloudinary precedent only on the URL-rewrite side) |
| Priority hint | No (browser handles) | No | No | No | No | DF-4 (novel for IPC; standard for browser fetch) |
| SVG handling | Up to handler | Up to handler | No special handling — risk on plugin author | No SVG embedding allowed | Sanitized via LWS | TS-8: shell rasterizes |
| SSRF policy | None (host responsibility) | None (host responsibility) | `allowedDomains` allowlist | Hosted by Slack | `connect-src` allowlist | TS-7: documented default policy |
| CSP delivery | Per-window via session | Per-window via Wry config | iframe `csp` attribute + Figma headers | Slack-served iframe | Salesforce-served iframe | TS-6: HTTP header (preferred) + meta-tag fallback documented |

**Key takeaways from the comparison:**
1. Whole-blob delivery is universal for static assets. Streaming is always a separate concern. This validates AF-5 (defer audio/video).
2. Nobody offers transform hints at the IPC layer — DF-3 is a small DX win we can ship cheaply because the field is purely additive.
3. Nobody but napplet has the relay/sidecar problem because nobody but napplet is event-driven. DF-1 is genuinely novel and worth the small spec work.
4. Salesforce LWS and Figma both validate that strict CSP + allowlist (or in our case, broker) is the only sustainable model — every system that tried looser models got SSRF'd or XSS'd.

## Sources

Verified at the listed confidence levels. Most are official docs or standards bodies; WebSearch-only items are flagged in-line.

**Strict-CSP / iframe sandbox / postMessage proxying (HIGH confidence — official docs):**
- [Content-Security-Policy: connect-src — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src)
- [Content-Security-Policy: sandbox directive — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox) (sandbox cannot be set via `<meta>`)
- [Play safely in sandboxed IFrames — web.dev](https://web.dev/articles/sandboxed-iframes)
- [w3c/webappsec-csp issue #700 — srcdoc CSP inheritance](https://github.com/w3c/webappsec-csp/issues/700)

**Custom protocol / scheme handlers (HIGH confidence — official docs):**
- [Electron protocol API](https://www.electronjs.org/docs/latest/api/protocol)
- [Tauri v2 Configuration — assetProtocol](https://v2.tauri.app/reference/config/)
- [Tauri Wry custom protocols (DeepWiki)](https://deepwiki.com/tauri-apps/wry/4.1-custom-protocols)
- [web.dev — Registering a custom protocol handler](https://web.dev/registering-a-custom-protocol-handler/)

**Sandboxed-plugin host comparison (MEDIUM-HIGH; vendor docs):**
- [Figma — Making Network Requests](https://www.figma.com/plugin-docs/making-network-requests/) (`allowedDomains` allowlist + CSP enforcement)
- [Figma — How Plugins Run](https://developers.figma.com/docs/plugins/how-plugins-run/)
- [Salesforce — Working with CORS and CSP to Call APIs from LWC](https://developer.salesforce.com/blogs/2022/03/working-with-cors-and-csp-to-call-apis-from-lwc) (`connect-src` allowlist via CSP Trusted Sites)
- [Salesforce — Access to iframe Content in LWS](https://developer.salesforce.com/docs/platform/lightning-components-security/guide/lws-iframes.html)
- [Slack — Leveraging Private Files for Image Blocks with Block Kit](https://slack.com/blog/developers/uploading-private-images-blockkit) (Slack-mediated image hosting; pattern peer for sidecar/proxy)
- [Slack — Security best practices](https://docs.slack.dev/security/)

**SSRF / shell-mediated fetch threat model (HIGH confidence — OWASP, vendor security teams):**
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) (block 127/8, 10/8, 172.16/12, 192.168/16, 169.254/16, ::1/128, fc00::/7, fe80::/10)
- [Wiz — Server-Side Request Forgery: What It Is & How To Fix It (2025)](https://www.wiz.io/academy/application-security/server-side-request-forgery)
- [Stytch — Securing Identity APIs Against SSRF](https://stytch.com/blog/securing-identity-apis-against-ssrf/)
- [SSRF DNS Rebinding (2026)](https://aydinnyunus.github.io/2026/03/14/ssrf-dns-rebinding-vulnerability/) (validates "block at resolution time, not URL parse time")

**SVG XSS / rasterization (HIGH confidence — CVEs and mitigation guides):**
- [Cross-site Scripting Injection Attacks Using SVG Images — Rietta](https://rietta.com/blog/svg-xss-injection-attacks/)
- [CVE-2025-66412 — Angular Stored XSS via SVG Animation](https://www.telerik.com/kendo-angular-ui/components/knowledge-base/kb-security-angular-stored-xss-svg-mathml-cve-2025-66412)
- [CVE-2023-22461 — sanitize-svg bypass](https://security.snyk.io/vuln/SNYK-JS-MATTKRICKSANITIZESVG-3225111)
- [PacketWanderer — Stored XSS Through Malicious SVG Uploads](https://packetwanderer.com/posts/svg-xss/)
- [DigiNinja — Protecting against XSS in SVG](https://digi.ninja/blog/svg_xss.php)

**Sidecar / pre-resolution / incremental delivery (MEDIUM confidence — pattern is generalized from these):**
- [GraphQL @defer / @stream RFC](https://github.com/graphql/graphql-wg/blob/main/rfcs/DeferStream.md)
- [GraphQL Incremental Delivery RFC](https://github.com/graphql/graphql-over-http/blob/main/rfcs/IncrementalDelivery.md)
- [GraphQL @defer / @stream blog](https://graphql.org/blog/2020-12-08-defer-stream/)
- [Mastodon ActivityPub spec](https://docs.joinmastodon.org/spec/activitypub/) (federated attachment handling — closest peer for pre-resolved-on-the-event pattern)

**Transform hints / fetch priority (HIGH confidence — official):**
- [Optimize resource loading with the Fetch Priority API — web.dev](https://web.dev/articles/fetch-priority)
- [HTML attribute: fetchpriority — MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/fetchpriority)
- [WICG priority-hints EXPLAINER](https://github.com/WICG/priority-hints/blob/main/EXPLAINER.md)
- [Imgix Rendering API — Automatic / Format / Output Quality](https://docs.imgix.com/en-US/apis/rendering/automatic) (`auto=format`, `q=`, `max-w=` are the canonical transform-hint vocabulary)
- [Imgix Client Hints](https://docs.imgix.com/en-US/apis/rendering/format/client-hints)

**Cancellation (HIGH confidence — official):**
- [AbortController — MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [AbortController.abort() — MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)

**Failure-mode UX / placeholders (MEDIUM confidence — pattern docs):**
- [ThumbHash](https://evanw.github.io/thumbhash/)
- [Mux — A clear look at blurry image placeholders on the web](https://www.mux.com/blog/blurry-image-placeholders-on-the-web)
- [Fastly — Low quality image placeholders](https://www.fastly.com/documentation/solutions/tutorials/low-quality-image-placeholders/)

**Blossom / Nostr-native schemes (HIGH confidence — protocol spec):**
- [NIP-B7 Blossom media](https://nips.nostr.com/B7)
- [Blossom (hzrd149/blossom GitHub)](https://github.com/hzrd149/blossom)
- [NIP-96 HTTP File Storage Integration](https://nips.nostr.com/96)

**Existing project artifacts read for grounding:**
- `/home/sandwich/Develop/napplet/.planning/PROJECT.md` (milestone scope)
- `/home/sandwich/Develop/napplet/specs/NIP-5D.md` (current spec)
- `/home/sandwich/Develop/napplet/packages/nub/src/relay/types.ts` (NUB-RELAY shape — DF-1 amendment target)
- `/home/sandwich/Develop/napplet/packages/nub/src/identity/types.ts` (`ProfileData.picture`/`banner` URLs — DF-8)
- `/home/sandwich/Develop/napplet/packages/nub/src/media/types.ts` (`MediaArtwork` already shaped for `blossom:` — DF-9)

---
*Feature research for: napplet v0.28.0 Browser-Enforced Resource Isolation*
*Researched: 2026-04-20*
