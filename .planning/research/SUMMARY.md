# Research Summary — v0.28.0 Browser-Enforced Resource Isolation

**Project:** Napplet Protocol SDK
**Domain:** Strict CSP enforcement on sandboxed iframes + scheme-pluggable shell-as-resource-broker
**Researched:** 2026-04-20
**Confidence:** HIGH

---

## Executive Summary

v0.28.0 converts napplet iframe security from ambient trust ("napplets shouldn't fetch directly") to browser-enforced isolation ("napplets cannot fetch directly — the browser blocks it"). The mechanism is a strict Content Security Policy (`connect-src 'none'` minimum) delivered by the shell at iframe creation time, paired with a single new napplet-side primitive: `resource.bytes(url) → Blob`, backed by a scheme-pluggable shell broker. All four researchers converged on the same architectural verdict: one new NUB, two surgical wire amendments, zero new runtime dependencies. The entire feature set is built on web-platform primitives already available in every evergreen browser (CSP3, structured-clone Blobs, WebCrypto, OffscreenCanvas, WHATWG URL).

The recommended approach is additive at every layer: one new `packages/nub/src/resource/` directory following the established NUB triad pattern (types / shim / sdk), an optional `resources` sidecar field on the existing `relay.event` envelope, and a new `transformIndexHtml` hook in `@napplet/vite-plugin` that mirrors the production shell's CSP in dev so napplets are developed under the constraints they will ship under. The sidecar pattern — shell pre-resolves URLs referenced in an event and piggybacks the bytes on the same envelope — is genuinely novel compared to peer systems (Electron, Tauri, Figma plugins, Salesforce LWS) and warrants careful spec wording to prevent misuse as a default-on tracking vector.

The primary risks are implementation discipline problems, not architectural unknowns. The top project-killer pitfalls all have clear prevention strategies: CSP meta must be injected as the first `<head>` child with `enforce: 'pre'` (Pitfall 1), header-only directives (`frame-ancestors`, `sandbox`) silently fail in meta delivery (Pitfall 2), srcdoc inheritance is wontfix at WHATWG so production delivery must use HTTP header or blob URL (Pitfall 3), SSRF via private IP ranges and DNS rebinding requires block-at-resolution-time policy (Pitfall 6), SVG must be rasterized shell-side to PNG/WebP (Pitfall 7), and spec drift between the public `napplet/nubs` repo and this private repo must be gated at milestone close (Pitfall 8). Audio and video are explicitly out of scope and must not sneak in via the `resource.bytes` primitive.

---

## Key Findings

### Recommended Stack

Zero new runtime dependencies. Every required browser capability — CSP enforcement, `securitypolicyviolation` DOM events, structured-clone Blobs over postMessage, WHATWG URL scheme dispatch, `crypto.subtle.digest` for content-addressed caching, `OffscreenCanvas` + `createImageBitmap` for shell-side rasterization — ships in every evergreen browser. The only optional addition worth noting is `@resvg/resvg-wasm@2.6.2` (MPL-2.0, ~560 KB WASM) for SVG rasterization in a DOM-less shell or Worker context, but the recommended default is `<img src=blob:svg>` → canvas → `convertToBlob`, which is DOM-native and zero-dep. If `@resvg/resvg-wasm` is ever needed it belongs in the shell repo, never in `@napplet/*`.

The Vite CSP integration should be a small in-house `transformIndexHtml` hook inside the existing `@napplet/vite-plugin` — no third-party Vite CSP plugin is appropriate (they solve full-app SPA hashing problems; napplet scripts come from a manifest). The hand-rolled `CspBuilder` helper is ~30 lines.

**Core technologies:**

- **CSP3 `Content-Security-Policy` header / `<meta http-equiv>`** — browser enforcement gate; `connect-src 'none'` is the minimum that makes this milestone's security property true
- **`securitypolicyviolation` DOM event** — native dev-mode visibility into blocked fetches; use for Playwright CSP assertions
- **`postMessage` + structured-clone `Blob`** — hand bytes from shell to napplet; Blobs are refcounted by the browser on clone
- **WHATWG `URL` + `Map<protocol, handler>`** — scheme dispatch; `new URL(input).protocol` handles `'https:'`, `'blossom:'`, `'nostr:'`, `'data:'` etc.; no npm package needed
- **`crypto.subtle.digest('SHA-256', bytes)`** — content-addressed shell cache key; buffer-then-hash is the only browser-native path (streaming digest is still a proposal); safe because the milestone enforces a size cap
- **`<img src=blob:svg>` → `OffscreenCanvas.drawImage` → `convertToBlob`** — SVG rasterization: `<img>`-loaded SVG runs in "secure static mode" per HTML spec (scripts disabled, external loads blocked); zero deps
- **`@napplet/vite-plugin` extended** — new `strictCsp?: boolean | StrictCspOptions` option; `transformIndexHtml` hook with `enforce: 'pre'`; dev mode relaxes `connect-src` for HMR websocket; build mode enforces strict

### Expected Features

**Must have — Table Stakes (all 12 non-negotiable for v0.28.0):**

- **TS-1** `resource.bytes(url) → Blob` request/result envelope with correlation ID — the primitive itself
- **TS-2** Four schemes plumbed end-to-end: `https:`, `data:`, `blossom:`, `nostr:` — `data:` is mandatory as zero-network fallback; validates dispatch
- **TS-3** Typed error discriminator on result: `not-found`, `blocked-by-policy`, `timeout`, `too-large`, `unsupported-scheme`, `decode-failed`, `network-error`
- **TS-4** Canonical MIME string on result, shell-classified via byte sniffing (not upstream header passthrough)
- **TS-5** Cancellation envelope (`resource.cancel`) + AbortSignal-shaped SDK helper
- **TS-6** Strict CSP delivered to napplet iframe at creation time; `connect-src 'none'` minimum
- **TS-7** Default shell resource policy: private-IP block at DNS resolution time, size cap, rate limit, timeout
- **TS-8** Shell-side SVG rasterization; napplet never receives raw `image/svg+xml`
- **TS-9** `shell.supports('resource')` and `shell.supports('resource:scheme:<name>')` capability checks
- **TS-10** Vite-plugin emits CSP-aware napplet HTML in dev
- **TS-11** NIP-5D Security Considerations amendment
- **TS-12** Single-Blob delivery (no streaming, no chunked)

**Should have — ship with v0.28.0:**

- **DF-1** Optional `resources` sidecar field on `relay.event` — high value for feed napplets; must default OFF for privacy
- **DF-8** NUB-IDENTITY JSDoc: `picture` URLs must flow through `resource.bytes()` — prevents `<img src={profile.picture}>` CSP block
- **DF-9** NUB-MEDIA JSDoc: `MediaArtwork.url` must flow through `resource.bytes()`
- **DF-10** Demo napplets — required as contract tests that the milestone is actually usable

**Defer to v0.28.x or later:**

- **DF-2** Pluggable scheme registry exposed to shell hosts
- **DF-3** Transform hints (`maxWidth`, `maxHeight`, `preferFormat`)
- **DF-4** Priority hint (`high` / `low` / `auto`)
- **DF-5** Progress push events
- **DF-6** `resource.preload(url)` fire-and-forget warm-up
- **DF-7** `cacheKey` on result

**Explicit anti-features (document so they don't get re-proposed during scoping):**

| Anti-Feature | Why Banned |
|---|---|
| AF-1: Raw `fetch` passthrough | Reintroduces every SSRF vector this milestone solves |
| AF-2: Napplet-controlled cache invalidation | DoS vector + cache timing side-channel |
| AF-3: OAuth / cookie-bearing requests | Credential laundering; shell becomes confused deputy |
| AF-4: Lightning L402 payment URLs | Separate NUB (NUB-PAY); don't conflate payment auth with byte fetching |
| AF-5: Audio/video streaming, range requests, MediaSource | Belongs in a future compositor milestone |
| AF-6: WebSocket proxy (`resource.socket`) | Generic socket bridge is a separate NUB |
| AF-7: Napplet-controlled or upstream-trusted MIME | Shell must classify; upstream Content-Type is attacker-controlled |
| AF-8: Napplet-negotiable CSP | Defeats the milestone entirely |
| AF-9: Hash exposure to napplets | Decided: hashes are shell-internal; napplets address by URL only |
| AF-10: Synchronous `resource.bytes` | Incompatible with postMessage; requires SAB which conflicts with opaque-origin sandbox |
| AF-11: `<img src=blossom://...>` interception | Requires `allow-same-origin` or Service Worker; both are sandbox escapes |

### Architecture Approach

The milestone is additive at every layer: one new NUB domain plus two surgical wire amendments. The build/dependency DAG is unchanged (`core → nub → {shim, sdk}` with `vite-plugin` orthogonal). CSP enforcement is a shell-side runtime concern expressed as a new `perm:strict-csp` capability on `shell.supports()` — not a NUB. Cross-repo spec authoring (public `napplet/nubs` repo) must proceed in parallel with this-repo implementation.

**New files (~4):**

| File | Role |
|---|---|
| `packages/nub/src/resource/types.ts` | Wire envelope types: `ResourceBytesMessage`, `ResourceBytesResultMessage`, `ResourceBytesErrorMessage`, `ResourceSidecarEntry`, `ResourceScheme`, discriminated unions |
| `packages/nub/src/resource/shim.ts` | `bytes()`, `bytesAsObjectURL()`, `hydrateResourceCache()`, `handleResourceMessage()`, `installResourceShim()` |
| `packages/nub/src/resource/sdk.ts` | Named exports for bundler consumers |
| `packages/nub/src/resource/index.ts` | Barrel + `registerNub()` placeholder |

**Modified files (~7):**

| File | Change |
|---|---|
| `packages/core/src/envelope.ts` | Add `'resource'` to `NubDomain` + `NUB_DOMAINS` |
| `packages/core/src/types.ts` | Add `resource: { bytes, bytesAsObjectURL }` to `NappletGlobal` |
| `packages/nub/src/relay/types.ts` | Add optional `resources?: ResourceSidecarEntry[]` to `RelayEventMessage` |
| `packages/nub/src/relay/shim.ts` | Call `hydrateResourceCache(msg.resources)` before `onEvent()` in `subscribe()` |
| `packages/shim/src/index.ts` | Import + wire resource NUB: routing branch, namespace mount, `installResourceShim()` |
| `packages/sdk/src/index.ts` | Add `resource` namespace + type re-exports + `RESOURCE_DOMAIN` const |
| `packages/vite-plugin/src/index.ts` | `strictCsp` option; CSP meta injection with `enforce: 'pre'`; dev/build split |

**External repo — napplet/nubs (4 PRs):**

- `NUB-RESOURCE.md` — new spec (message catalog, scheme registration, error codes, MUST/SHOULD/MAY shell behavior)
- `NUB-RELAY.md` amendment — optional sidecar field + ordering semantics
- `NUB-IDENTITY.md` clarification — `picture` URLs via resource NUB (no wire change)
- `NUB-MEDIA.md` clarification — `artwork.url` via resource NUB (no wire change)

**Key architectural decisions:**

- **Blob over postMessage** — structured-clone for payloads < 256 KB (shell retains cache copy); Transferable for large payloads (zero-copy, shell drops reference)
- **Sidecar type ownership** — `ResourceSidecarEntry` defined in resource NUB; relay NUB imports it as type-only in-package dep (resource NUB owns ALL its types per `feedback_nub_modular`)
- **CSP as shell posture** — `perm:strict-csp` capability, not a NUB capability; orthogonal to `nub:resource` so permissive dev shells can implement resource NUB without enforcing strict CSP
- **Demo napplets** — do not exist in this repo (extracted at v0.13.0; `apps/` and `tests/` absent from disk). Recommendation: Option B — downstream shell repo owns demos for v0.28.0

### Critical Pitfalls

**PROJECT-KILLER severity — must address before v0.28.0 ships:**

1. **CSP meta after `<script>` tags — policy doesn't bind** (Pitfall 1) — vite-plugin must inject CSP meta as first `<head>` child with `enforce: 'pre'`; add build-time assertion; fail build if any `<script>` precedes the meta
2. **Header-only directives silently ignored in `<meta>` CSP** (Pitfall 2) — `frame-ancestors`, `sandbox`, `report-uri` do not work in meta; vite-plugin must reject them at build time with a clear error
3. **srcdoc inherits parent CSP — wontfix at WHATWG** (Pitfall 3) — production napplet delivery must use HTTP header or blob URL; document constraint in NIP-5D
4. **SSRF via private IPs and DNS rebinding** (Pitfall 6) — block at DNS-resolution time (not URL parse time); private ranges: 10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, ::1, fc00::/7, fe80::/10; cap redirect chains at 5 with per-hop re-validation
5. **SVG `<foreignObject>` / billion-laughs DoS** (Pitfall 7) — rasterize all SVG to PNG/WebP in a sandboxed Worker with no network; cap input bytes (5 MB), output dimensions (4096×4096), wall-clock time (2 s); never pass raw `image/svg+xml` to napplets
6. **Sidecar privacy leak — shell pre-fetches URLs user hasn't seen** (Pitfall 10) — sidecar MUST default OFF; NUB-RELAY amendment must specify opt-in semantics; scope cache per `(dTag, aggregateHash)`
7. **Spec drift between public napplet/nubs repo and private implementation** (Pitfall 8) — gate milestone close on all nubs PRs merged or having draft URLs; every wire shape in `@napplet/nub/resource` must have a counterpart in the public spec; NEVER mention `@napplet/*` in public nubs commits or PR bodies

**SERIOUS severity — address per phase:**

- **Blob URL lifetime / memory leak** (Pitfall 11) — `bytesAsObjectURL()` with paired `revoke()`; shell quota per napplet via `denied: 'quota-exceeded'`
- **Cache stampede — N concurrent requests for same URL** (Pitfall 13) — single-flight `Map<canonicalURL, Promise<Blob>>`; URL canonicalization rules in spec
- **Vite HMR `connect-src ws://` conflict** (Pitfall 18) — dev CSP allows HMR websocket; build CSP enforces `connect-src 'none'`; build-time assertion that dev relaxations don't appear in prod manifest
- **Vite inline scripts need nonces** (Pitfall 19) — nonce-based `script-src`, not `'unsafe-inline'`; never `'unsafe-eval'`
- **Playwright auto-wait doesn't catch CSP violations silently** (Pitfall 21) — CSP violation helper using `page.on('console')` + `page.on('requestfailed')` correlation; assert specific blocked URL

---

## Implications for Roadmap

Research has converged on a natural 10-phase sequence. Critical-path observation: Phases 1-2 are blocking for everything else; Phases 3-6 are independent of each other and can be parallelized; Phases 7-9 can land any time after 1-6; Phase 10 is best last to avoid doc churn.

### Phase 1: Core Type Surface

**Rationale:** `NubDomain` and `NappletGlobal` are consumed by every downstream package; must land first to unblock parallel work.
**Delivers:** `'resource'` added to `NubDomain` union + `NUB_DOMAINS`; `resource: { bytes, bytesAsObjectURL }` added to `NappletGlobal`; `perm:strict-csp` documented as valid `NamespacedCapability`
**Addresses:** TS-9 prerequisite, TS-1 type foundation
**Research flag:** Standard pattern — no research phase needed; mirrors how `'config'` and `'identity'` were added in prior milestones

### Phase 2: Resource NUB Scaffold

**Rationale:** Foundation everything else integrates from; must exist before shim/SDK can import it.
**Delivers:** `packages/nub/src/resource/{types,shim,sdk,index}.ts`; 4 `exports` entries + 4 tsup entry points in `@napplet/nub`; all envelope types; `bytes()`, `bytesAsObjectURL()`, `hydrateResourceCache()`, `handleResourceMessage()`, `installResourceShim()`; `data:` scheme decoded inside shim (zero-network, validates dispatch path)
**Addresses:** TS-1, TS-3 (typed errors), TS-4 (MIME field), TS-5 (cancellation), TS-12 (single-Blob enforced by type shape)
**Avoids:** Pitfall 11 (`bytesAsObjectURL` with paired `revoke()`)
**Research flag:** Standard NUB triad — no research phase needed; reference identity and config NUBs

### Phase 3: NUB-RELAY Sidecar Amendment

**Rationale:** Additive wire change; independent of shim/SDK integration; sidecar type owned by resource NUB (Phase 2 provides it).
**Delivers:** Optional `resources?: ResourceSidecarEntry[]` on `RelayEventMessage`; `hydrateResourceCache()` called before `onEvent()` in relay `subscribe()` handler; transparent cache so `resource.bytes(url)` gets a hit if sidecar pre-populated
**Addresses:** DF-1 (sidecar optimization)
**Avoids:** Pitfall 10 (default OFF, opt-in per shell policy); Pitfall 15 (bytes MUST be in same envelope as event, not a follow-up)
**Research flag:** Standard wire amendment — no research phase needed

### Phase 4: Shim Integration

**Rationale:** Mechanical after Phase 2 provides the NUB; follows the exact pattern from 9 prior NUBs.
**Delivers:** `packages/shim/src/index.ts` updated: `resource.*` routing branch, `window.napplet.resource` namespace mount, `installResourceShim()` call
**Addresses:** TS-1 (napplet-callable API)
**Research flag:** No research phase — ~15 lines following established pattern

### Phase 5: SDK Integration

**Rationale:** Mirrors shim integration; `@napplet/sdk` consumers need the `resource` namespace.
**Delivers:** `packages/sdk/src/index.ts` updated: `resource` namespace, type re-exports, `RESOURCE_DOMAIN` const, SDK helper re-exports
**Addresses:** TS-1 (bundler-friendly API), TS-9 (sdk-level capability helper)
**Research flag:** No research phase — mechanical mirror of shim integration

### Phase 6: Vite-Plugin CSP Injection

**Rationale:** Independent of NUB integration; dev-mode CSP is a table stake and common source of prod/dev divergence.
**Delivers:** `strictCsp?: boolean | StrictCspOptions` on `Nip5aManifestOptions`; `transformIndexHtml` with `enforce: 'pre'`; complete 10-directive default baseline policy; dev/build mode split for HMR `connect-src`; build-time assertion CSP meta is first `<head>` child; build-time rejection of header-only directives in meta
**Addresses:** TS-6 (dev-mode CSP), TS-10 (vite-plugin CSP)
**Avoids:** Pitfall 1 (meta placement), Pitfall 2 (header-only directives), Pitfall 18 (HMR conflict), Pitfall 19 (nonces not unsafe-inline), Pitfall 23 (incomplete directive set)
**Research flag:** Validate `enforce: 'pre'` interaction with Vite's HMR script injection order against an actual Vite build before calling phase complete — Pitfall 1 is a project-killer if missed

### Phase 7: Spec Amendments (This Repo)

**Rationale:** NIP-5D lives in this repo; can land after Phases 1-6 stabilize the wire shape.
**Delivers:** `specs/NIP-5D.md` Security Considerations subsection: strict-CSP posture, `perm:strict-csp`, resource NUB as canonical fetch path, `sandbox="allow-scripts"` reaffirmation, prohibition on `allow-same-origin`
**Addresses:** TS-11 (NIP-5D amendment)
**Avoids:** Pitfall 5 (`allow-same-origin` service worker bypass), Pitfall 9 (no-opt-out language)
**Research flag:** No research phase — coordinate wording with nubs PRs

### Phase 8: Cross-Repo Spec PRs (napplet/nubs)

**Rationale:** Must open as drafts early in the milestone; gating milestone close; must not mention `@napplet/*`.
**Delivers:** Draft PRs: NUB-RESOURCE (new), NUB-RELAY sidecar amendment, NUB-IDENTITY picture clarification, NUB-MEDIA artwork clarification; each PR references the relevant other specs in a "Coexistence" section
**Addresses:** DF-8, DF-9, TS-7 (SSRF policy as MUST), TS-8 (SVG handling as MUST), Pitfall 27 (nostr:/blossom: scheme disambiguation)
**Avoids:** Pitfall 8 (spec drift); Pitfall 6 (private-IP block list in spec's MUST surface)
**Research flag:** Amendment path to public nubs repo is less-tested than new-spec path; open drafts early and iterate; don't let spec and implementation drift into final days of milestone

### Phase 9: Demo Napplets

**Rationale:** Demos are the contract test that the milestone is actually usable. Scope decision required.
**Delivers (Option B — downstream shell repo):** Three demo napplets: (1) profile viewer (`identity.getProfile()` → `resource.bytes(picture)` → render, tests sidecar), (2) feed with inline images (kind 1 + NIP-92 imeta + sidecar), (3) scheme-mixed consumer (`https:` + `blossom:` + `data:` + `nostr:` on one screen)
**Addresses:** DF-10 (demos as milestone validation gate)
**Scope decision:** Demo napplets do NOT exist in this repo — `apps/` and `tests/` directories were extracted at v0.13.0 and workspace globs are vestigial (confirmed by filesystem inspection). Options: (A) re-introduce `tests/fixtures/napplets/` here with mock shell — significant build-out; (B) downstream shell repo owns demos — recommended; (C) thin Playwright iframe fixtures with mock shell — non-trivial second implementation. Flag as blocking decision in REQUIREMENTS.md.
**Research flag:** Cross-repo coordination concern; if downstream shell repo is unavailable, Phase 9 may expand scope significantly

### Phase 10: Documentation Sweep

**Rationale:** Best done last to avoid churn as wire shapes stabilize during Phases 1-9.
**Delivers:** 6 package READMEs updated; `skills/build-napplet/SKILL.md` updated; shell-deployer resource-policy checklist (SSRF IP ranges, sidecar opt-in semantics, SVG policy, MIME allowlist); napplet-author migration note (`fetch()` → `resource.bytes()`)
**Addresses:** TS-11 (hygiene), DF-8/DF-9 (JSDoc clarifications)
**Research flag:** No research phase — mechanical sweep

### Phase Ordering Rationale

- Phases 1-2 are blocking because every other phase imports from core (Phase 1) or from the resource NUB package (Phase 2)
- Phases 3-6 are independent of each other after Phase 2 lands; a small team can parallelize or order by preference
- Phase 7 should follow Phase 2 closely so NIP-5D amendment language tracks the final wire shape
- Phase 8 must open as drafts early even if wire shape is still evolving; final merge is gated on Phases 1-7
- Phase 9 is independent but provides the canary test; running demos early catches integration gaps before doc sweep
- Phase 10 must come last — documenting a moving wire shape wastes effort

### Open Design Questions — Research Recommendations

| Question | Research Recommendation | Confidence |
|---|---|---|
| NUB name | `resource` — matches the concept, the API, the type prefix; brevity wins | HIGH |
| CSP delivery mechanism (header vs meta vs both) | HTTP response header PREFERRED for production (enforces `frame-ancestors`/`sandbox` that meta cannot); meta acceptable for blob-URL delivered napplets in dev; document both paths in NIP-5D | HIGH |
| Demo napplets location | Option B: downstream shell repo for v0.28.0; revisit Option C (mock-shell fixtures) later | HIGH (confirmed: apps/ and tests/ don't exist in this repo) |
| Sidecar default | OFF — opt-in per shell policy per event kind; privacy rationale in NUB-RELAY amendment | HIGH |
| Vite dev CSP relaxation for HMR | Dev allows `connect-src ws://localhost:* wss://localhost:*`; build enforces strict; build-time assertion prevents leakage | HIGH |
| Strict CSP in NIP-5D as MUST/SHOULD/MAY | SHOULD (default but waivable by permissive dev shells); shells advertising `perm:strict-csp` SHOULD also advertise `nub:resource` | MEDIUM |
| Cache eviction in resource shim | Bounded LRU at 16 MB; shell quota enforced via `denied: 'quota-exceeded'` result | MEDIUM |
| `resource.bytes.pending` interim message | MAY in spec; not a v0.28.0 requirement | HIGH |
| `worker-src` default | `'none'` — napplets requiring Web Workers opt in via manifest; document in vite-plugin baseline | HIGH |

### Research Flags

**Phases needing careful validation:**

- **Phase 6 (Vite-plugin CSP):** `enforce: 'pre'` interaction with Vite's internal HMR client injection order is the highest-risk implementation detail. Validate with an actual Vite build that CSP meta appears first in emitted HTML before declaring phase complete. Pitfall 1 is project-killer if missed.
- **Phase 8 (Cross-repo spec PRs):** NUB amendments to the public nubs repo are less-trodden than new NUB PRs. Open draft PRs early; don't let spec and implementation drift into final days.
- **Phase 9 (Demos):** Demo napplet location is a scope decision. If downstream shell repo is unavailable or team wants in-repo coverage, Phase 9 may expand significantly. Flag in REQUIREMENTS.md before scoping.

**Phases with standard, well-documented patterns (no research phase needed):**

- Phase 1 (core types): mechanical addition, pattern proven 10+ times
- Phase 2 (NUB scaffold): NUB triad is established; reference identity/config NUBs
- Phase 3 (relay sidecar): surgical wire amendment; relay/types.ts + relay/shim.ts, both verified
- Phase 4 (shim integration): ~15 lines following a mechanical pattern proven across 9 NUBs
- Phase 5 (SDK integration): mirrors Phase 4
- Phase 7 (NIP-5D spec): amendment scope documented; coordinate wording with nubs PRs
- Phase 10 (docs): mechanical sweep following prior milestone patterns

---

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Stack | HIGH | Zero new runtime dependencies confirmed; all technologies are web-platform builtins verified via MDN/W3C; existing stack confirmed conflict-free |
| Features | HIGH on table stakes and anti-features; MEDIUM on differentiators | Table stakes and anti-features converge from multiple peer systems. Sidecar shape and transform-hint vocabulary generalized from GraphQL/Imgix — MEDIUM confidence on exact field names |
| Architecture | HIGH on this-repo integration; MEDIUM on cross-repo coordination | Every file path and modification scope verified by reading actual source. Cross-repo nubs PR amendment path is MEDIUM — less tested than new-spec PRs |
| Pitfalls | HIGH on security/browser pitfalls; MEDIUM on performance numbers | CSP3 behaviors verified via MDN/W3C/Chromium bugs. SVG attack vectors verified via CVEs. Performance thresholds (256 KB Transferable boundary, 10 MB size cap, 16 MB LRU) are informed heuristics |

**Overall confidence:** HIGH

### Gaps to Address

- **Demo napplet scope:** Must be resolved before REQUIREMENTS.md is written. Research recommendation is Option B (downstream shell repo), but this requires a cross-repo decision. Flag in requirements as a blocking decision.
- **Strict CSP normative level in NIP-5D:** SHOULD is the research recommendation but MUST would strengthen the security story. This is a spec philosophy call — surface to the maintainer before Phase 7 begins.
- **Performance thresholds:** The 256 KB Blob/Transferable threshold, 10 MB size cap, 16 MB LRU cache size, and 30-second request timeout are reasonable defaults. Validate against real napplet behavior once Phase 9 demos exist.
- **`nostr:` scheme resolution path:** Must define whether `nostr:` URLs resolve via NUB-RELAY internally (shell queries relays, fetches referenced event/profile, fetches referenced URL) or via simpler single-hop. Define before Phase 2 finalizes type shapes.

---

## Sources

### Primary — HIGH confidence (verified against official spec or repo source)

- `packages/nub/src/{identity,config,notify}/` — NUB triad pattern reference (all files read)
- `packages/nub/src/relay/{types,shim}.ts` — sidecar modification targets (read)
- `packages/shim/src/index.ts` — shim orchestrator pattern (212 lines read)
- `packages/sdk/src/index.ts` — SDK barrel pattern (976 lines read)
- `packages/vite-plugin/src/index.ts` — existing plugin structure (559 lines read)
- `packages/core/src/{envelope,types}.ts` — NubDomain + NappletGlobal (read)
- `.planning/PROJECT.md` — milestone goals and 7 open design questions
- `.planning/STATE.md` — in-progress decisions
- `specs/NIP-5D.md` — current spec
- MDN: SecurityPolicyViolationEvent, SubtleCrypto.digest, URL.createObjectURL, postMessage structured-clone
- W3C CSP3 spec — `<meta>` limitations, header-only directives
- W3C webappsec-csp issue #700 (srcdoc wontfix), w3c/webcrypto #73 (streaming digest not in spec yet)
- Playwright TestOptions (bypassCSP documentation)
- OWASP SSRF Prevention Cheat Sheet — private IP block list, DNS rebinding

### Secondary — MEDIUM confidence (vendor docs, multiple sources agree)

- Electron `protocol.handle` API — scheme-handler pattern reference
- Tauri custom protocol docs — whole-response delivery pattern
- Figma plugin `allowedDomains` — sandboxed-fetch peer system comparison
- Salesforce LWS CORS/CSP — strict-CSP enforcement peer
- Vite issues #11862, #16749, #9719 — HMR connect-src + inline script CSP conflicts
- GraphQL @defer/@stream RFC — sidecar same-envelope guarantee pattern
- Imgix rendering API — transform hint vocabulary
- NIP-B7 Blossom spec + hzrd149/blossom — `blossom:` URL conventions
- CVE-2025-66412 (Angular SVG XSS), CVE-2023-22461 (sanitize-svg bypass) — SVG attack surface

### Tertiary — LOW confidence (inferred or single-source)

- Surma "Is postMessage slow?" (2019, may be outdated) — Transferable vs structured-clone performance numbers; validate with current browsers during Phase 2

---

*Research completed: 2026-04-20*
*Ready for roadmap: yes*
