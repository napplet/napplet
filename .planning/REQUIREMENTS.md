# Requirements: Napplet Protocol SDK — v0.28.0 Browser-Enforced Resource Isolation

**Defined:** 2026-04-20
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.28.0 Requirements

Convert napplet iframe security from ambient trust to browser-enforced isolation. Single new NUB (`resource`) with `resource.bytes(url) → Blob` primitive, scheme-pluggable URL space, optional sidecar pre-resolution on relay events, strict CSP enforcement at iframe boundary, and the spec amendments needed to lock the model in.

### Resource NUB Primitive

- [x] **RES-01**: New `@napplet/nub/resource` subpath at `packages/nub/src/resource/` with `types.ts`, `shim.ts`, `sdk.ts`, `index.ts` following the established NUB triad pattern; 4 new `exports` entries + 4 tsup entries in `@napplet/nub` package.json
- [x] **RES-02**: `ResourceBytesMessage` / `ResourceBytesResultMessage` envelope types with correlation ID, payload `{ url: string }`, result payload `{ blob: Blob, mime: string }`
- [x] **RES-03**: Typed error discriminator on result envelope: `not-found`, `blocked-by-policy`, `timeout`, `too-large`, `unsupported-scheme`, `decode-failed`, `network-error`, `quota-exceeded`
- [x] **RES-04**: Canonical MIME field on result, shell-classified via byte sniffing (NOT upstream `Content-Type` passthrough — RES-04 explicitly bans honoring attacker-controlled MIME)
- [x] **RES-05**: `resource.cancel` envelope + `AbortSignal`-shaped SDK helper for napplet-side cancellation
- [x] **RES-06**: `bytesAsObjectURL(url) → string` SDK helper with paired `revoke(objectURL)` for blob URL lifecycle management
- [x] **RES-07**: Single-Blob delivery contract enforced by type shape (no streaming, no chunked — that's a future audio/video milestone)

### Scheme Handlers

- [x] **SCH-01**: `data:` scheme decoded inside napplet shim with zero shell round-trip (validates dispatch path; mandatory base case)
- [x] **SCH-02**: `https:` scheme protocol surface defined in spec (shell-side network fetch with policy enforcement)
- [x] **SCH-03**: `blossom:` scheme protocol surface defined in spec (Blossom hash → bytes resolution; canonical hash form)
- [x] **SCH-04**: `nostr:` scheme protocol surface defined in spec with single-hop resolution semantics (NIP-19 bech32 input form)

### Default Shell Resource Policy

- [x] **POL-01**: Default private-IP block list documented as MUST in NUB-RESOURCE: RFC1918 (10/8, 172.16/12, 192.168/16), loopback (127/8, ::1), link-local (169.254/16, fe80::/10), unique-local (fc00::/7), cloud metadata (169.254.169.254). Block at DNS-resolution time, not URL parse time
- [x] **POL-02**: Default response size cap documented as SHOULD with recommended value (target ~10 MiB; deferred to phase planning for exact tuning)
- [x] **POL-03**: Default per-URL fetch timeout documented as SHOULD (target ~30s)
- [x] **POL-04**: Default per-napplet concurrent fetch + rate limit documented as SHOULD
- [x] **POL-05**: MIME classification policy: shell byte-sniffs response; rejects upstream `Content-Type` passthrough; enforces scheme-appropriate MIME allowlist
- [x] **POL-06**: Redirect chain cap documented as SHOULD with per-hop re-validation against private-IP block list (redirect amplification mitigation)

### SVG Rasterization

- [x] **SVG-01**: Shell-side SVG rasterization to PNG/WebP at requested dimensions documented as MUST in NUB-RESOURCE
- [x] **SVG-02**: Napplets MUST NOT receive `image/svg+xml` bytes; shell rasterizes before delivery
- [x] **SVG-03**: Rasterization caps documented as SHOULD: max input bytes (target 5 MiB), max output dimensions (target 4096×4096), wall-clock budget (target 2s); rasterization runs in sandboxed Worker with no network

### Core Type Surface

- [x] **CORE-01**: `'resource'` added to `NubDomain` union and `NUB_DOMAINS` constant in `packages/core/src/envelope.ts`
- [x] **CORE-02**: `resource: { bytes, bytesAsObjectURL }` namespace added to `NappletGlobal` in `packages/core/src/types.ts`
- [x] **CORE-03**: `perm:strict-csp` documented as valid `NamespacedCapability` (existing `perm:${string}` template literal already supports — JSDoc clarification only)

### CSP Enforcement (Vite Plugin)

- [x] **CSP-01**: `@napplet/vite-plugin` adds `strictCsp?: boolean | StrictCspOptions` option to `Nip5aManifestOptions`
- [x] **CSP-02**: `transformIndexHtml` hook with `enforce: 'pre'` injects CSP `<meta http-equiv>` as the first child of `<head>` (placement matters — meta CSP only binds elements parsed after it)
- [x] **CSP-03**: Build-time assertion: CSP meta is the first `<head>` child; build fails with clear diagnostic if any `<script>` precedes it
- [x] **CSP-04**: Build-time rejection of header-only directives in meta CSP: `frame-ancestors`, `sandbox`, `report-uri`, `report-to` (silently ignored by browsers in meta delivery — fail fast with clear error)
- [x] **CSP-05**: Dev/build mode split: dev relaxes `connect-src` for HMR (`ws://localhost:* wss://localhost:*`); build emits strict `connect-src 'none'`; build-time assertion that dev relaxations don't leak into prod manifest
- [x] **CSP-06**: Default 10-directive baseline policy documented (default-src, script-src, connect-src 'none', img-src blob: data:, font-src blob: data:, style-src 'self', worker-src 'none', object-src 'none', base-uri 'none', form-action 'none')
- [x] **CSP-07**: Nonce-based `script-src` for any inline scripts; never `'unsafe-inline'`, never `'unsafe-eval'`

### Capability Negotiation

- [x] **CAP-01**: `shell.supports('nub:resource')` returns true for shells implementing the resource NUB
- [x] **CAP-02**: `shell.supports('resource:scheme:<name>')` per-scheme capability check (e.g., `resource:scheme:blossom`)
- [x] **CAP-03**: `shell.supports('perm:strict-csp')` capability advertises the security posture (orthogonal to nub:resource so permissive dev shells can implement the NUB without enforcing CSP)

### Sidecar Pre-Resolution (NUB-RELAY)

- [x] **SIDE-01**: Optional `resources?: ResourceSidecarEntry[]` field on `RelayEventMessage` (additive, backward-compatible wire change)
- [x] **SIDE-02**: `ResourceSidecarEntry` type defined in resource NUB; relay NUB imports as type-only in-package dep (resource NUB owns ALL its types per NUB modular principle)
- [x] **SIDE-03**: Relay shim calls `hydrateResourceCache(msg.resources)` from resource shim before delivering each event to `onEvent` callback (transparent to napplet caller)
- [x] **SIDE-04**: Single-flight cache map keyed by canonical URL; subsequent `resource.bytes(url)` calls for sidecar-pre-populated URLs resolve from cache without round-trip; concurrent calls for same URL share one in-flight promise
- [x] **SIDE-05**: Sidecar default OFF in NUB-RELAY spec (privacy: shell pre-fetching reveals user activity to upstream avatar hosts before user has rendered the event); opt-in per shell policy + per event-kind allowlist documented in spec

### Shim Integration

- [x] **SHIM-01**: `packages/shim/src/index.ts` adds `resource.*` envelope routing branch
- [x] **SHIM-02**: `window.napplet.resource` namespace mounted by shim
- [x] **SHIM-03**: `installResourceShim()` called from central shim installer following established 9-NUB pattern

### SDK Integration

- [x] **SDK-01**: `packages/sdk/src/index.ts` adds `resource` namespace with named exports
- [x] **SDK-02**: `RESOURCE_DOMAIN` const re-exported alongside other domain constants
- [x] **SDK-03**: All resource NUB types re-exported from `@napplet/sdk` for bundler consumers

### Spec Amendments

- [x] **SPEC-01**: `specs/NIP-5D.md` Security Considerations subsection added: strict-CSP posture as **SHOULD**, `perm:strict-csp` capability, resource NUB as canonical fetch path, `sandbox="allow-scripts"` reaffirmation, prohibition on `allow-same-origin` (closes service-worker bypass vector)
- [x] **SPEC-02**: NUB-RESOURCE.md drafted and PR opened to public `napplet/nubs` repo (new spec): message catalog, scheme registration semantics, error code vocabulary, MUST/SHOULD/MAY shell behavior contract
- [x] **SPEC-03**: NUB-RELAY.md amendment PR opened to `napplet/nubs` (sidecar field + ordering semantics + default-OFF privacy rationale)
- [x] **SPEC-04**: NUB-IDENTITY.md clarification PR opened to `napplet/nubs` (no wire change; `picture` and `banner` URLs flow through `resource.bytes()`; pattern documented)
- [x] **SPEC-05**: NUB-MEDIA.md clarification PR opened to `napplet/nubs` (no wire change; `MediaArtwork.url` flows through `resource.bytes()`)
- [x] **SPEC-06**: All 4 nubs PRs zero-grep clean of `@napplet/*` private package references; CI guard or manual sweep before merge

### Documentation

- [ ] **DOC-01**: `@napplet/nub` README updated with new `/resource` subpath documentation
- [ ] **DOC-02**: `@napplet/shim` README updated for resource NUB integration
- [ ] **DOC-03**: `@napplet/sdk` README updated for resource namespace + RESOURCE_DOMAIN
- [ ] **DOC-04**: `@napplet/vite-plugin` README updated for `strictCsp` option + dev/prod CSP behavior
- [ ] **DOC-05**: Root README updated for v0.28.0 surface (resource NUB, browser-enforced isolation framing)
- [ ] **DOC-06**: `skills/build-napplet/SKILL.md` updated: napplets use `napplet.resource.bytes(url)` instead of `<img src=externalUrl>` or `fetch()`
- [ ] **DOC-07**: Shell-deployer resource policy checklist authored (private-IP block ranges, sidecar opt-in semantics, SVG rasterization caps, MIME allowlist, redirect chain limits)

### Demo Coordination

- [ ] **DEMO-01**: Demo napplets explicitly delegated to downstream shell repo for v0.28.0 — coordination note in PROJECT.md and NUB-RESOURCE spec; this repo's responsibility ends at the wire + SDK surface

### Verification

- [ ] **VER-01**: `pnpm -r build` + `pnpm -r type-check` exit 0 across all 14 workspace packages
- [ ] **VER-02**: Playwright CSP-block assertion test using positive blocking pattern (`page.on('console')` + `page.on('requestfailed')` correlation; assert specific blocked URL — not just "request didn't happen")
- [ ] **VER-03**: SVG bomb / `foreignObject` / recursive-`<use>` rejection tests (rasterizer enforces caps)
- [ ] **VER-04**: Single-flight cache stampede test (N concurrent `resource.bytes(sameUrl)` calls produce 1 fetch)
- [ ] **VER-05**: Sidecar opt-in default-OFF test (relay event with `resources` field is ignored unless shell explicitly opts in)
- [ ] **VER-06**: Cross-repo zero-grep CI/manual sweep: no `@napplet/*` private references in any `napplet/nubs` PR body or commit message
- [ ] **VER-07**: Bundle size: `@napplet/nub/resource` tree-shakes cleanly; consumer importing only `relay` types pays zero bytes for resource code

## Out of Scope

Explicitly excluded from v0.28.0. Documented to prevent scope creep mid-milestone.

| Feature | Reason |
|---------|--------|
| Audio playback (HTML5 audio, MediaSource, range requests) | Reserved for future shell-composited compositor milestone; the byte-streaming model breaks down for streaming media |
| Video playback (HTML5 video, MSE, HLS, DASH) | Same as audio — separate milestone with compositor model |
| Raw `fetch` passthrough NUB (e.g., `resource.fetch(req) → response`) | Reintroduces every SSRF vector this milestone solves; violates the unified primitive principle |
| Napplet-controlled cache invalidation API | DoS vector; cache timing side-channel; defeats shell-as-broker model |
| OAuth / cookie-bearing requests | Credential laundering; shell becomes confused deputy |
| Lightning L402 payment URLs | Belongs in a future NUB-PAY; conflating payment auth with byte fetching is a category error |
| WebSocket proxy (`resource.socket`) | Generic socket bridge is a separate NUB; out of scope for byte-fetching primitive |
| Napplet-trusted upstream MIME (Content-Type passthrough) | Shell MUST classify; upstream Content-Type is attacker-controlled |
| Napplet-negotiable CSP relaxation | Defeats the milestone entirely — CSP is a shell-imposed policy, not napplet-negotiable |
| Hash exposure to napplets | Decided in design conversation: hashes are shell-internal cache keys; napplets address by URL only |
| Synchronous `resource.bytes` API | Incompatible with postMessage; would require SharedArrayBuffer which conflicts with opaque-origin sandbox |
| `<img src=blossom://...>` direct browser interception | Requires `allow-same-origin` or Service Worker; both are sandbox escapes |
| Pluggable scheme registry exposed to shell hosts (DF-2) | Deferred to v0.28.x or later — explodes conformance surface; canonical 4 schemes (https/blossom/nostr/data) sufficient for v0.28.0 |
| Transform hints (`maxWidth`, `maxHeight`, `preferFormat`) (DF-3) | Deferred — useful for avatar UIs but expands shell scope; ship byte-faithful primitive first |
| Priority hint (`high`/`low`/`auto`) (DF-4) | Deferred — micro-optimization; shell can pick reasonable defaults |
| Progress push events (DF-5) | Deferred — adds protocol complexity for marginal UX gain at v0.28.0 size limits |
| `resource.preload(url)` warm-up (DF-6) | Deferred — sidecar covers the dominant pre-fetch case |
| `cacheKey` exposed on result (DF-7) | Deferred — hashes stay shell-internal per design decision |
| In-repo demo napplets | Demos delegated to downstream shell repo (Option B); `apps/` and `tests/` were extracted at v0.13.0 |
| Backwards-compatibility shims, deprecation aliases, migration helpers | Single user, active design — break freely. No backcompat shall be added |
| Mobile native wrapper | Web-first protocol, native later (carry from prior milestones) |
| Framework-specific bindings (Svelte/React components) | SDK is framework-agnostic by design (carry) |

## Traceability

Mapped 2026-04-20 by gsd-roadmapper. Every v0.28.0 REQ-ID maps to exactly one phase. Zero orphans.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RES-01 | Phase 126 | Complete |
| RES-02 | Phase 126 | Complete |
| RES-03 | Phase 126 | Complete |
| RES-04 | Phase 126 | Complete |
| RES-05 | Phase 126 | Complete |
| RES-06 | Phase 126 | Complete |
| RES-07 | Phase 126 | Complete |
| SCH-01 | Phase 126 | Complete |
| SCH-02 | Phase 132 | Complete |
| SCH-03 | Phase 132 | Complete |
| SCH-04 | Phase 132 | Complete |
| POL-01 | Phase 132 | Complete |
| POL-02 | Phase 132 | Complete |
| POL-03 | Phase 132 | Complete |
| POL-04 | Phase 132 | Complete |
| POL-05 | Phase 132 | Complete |
| POL-06 | Phase 132 | Complete |
| SVG-01 | Phase 132 | Complete |
| SVG-02 | Phase 132 | Complete |
| SVG-03 | Phase 132 | Complete |
| CORE-01 | Phase 125 | Complete |
| CORE-02 | Phase 125 | Complete |
| CORE-03 | Phase 125 | Complete |
| CSP-01 | Phase 130 | Complete |
| CSP-02 | Phase 130 | Complete |
| CSP-03 | Phase 130 | Complete |
| CSP-04 | Phase 130 | Complete |
| CSP-05 | Phase 130 | Complete |
| CSP-06 | Phase 130 | Complete |
| CSP-07 | Phase 130 | Complete |
| CAP-01 | Phase 128 | Complete |
| CAP-02 | Phase 128 | Complete |
| CAP-03 | Phase 130 | Complete |
| SIDE-01 | Phase 127 | Complete |
| SIDE-02 | Phase 127 | Complete |
| SIDE-03 | Phase 127 | Complete |
| SIDE-04 | Phase 127 | Complete |
| SIDE-05 | Phase 132 | Complete |
| SHIM-01 | Phase 128 | Complete |
| SHIM-02 | Phase 128 | Complete |
| SHIM-03 | Phase 128 | Complete |
| SDK-01 | Phase 129 | Complete |
| SDK-02 | Phase 129 | Complete |
| SDK-03 | Phase 129 | Complete |
| SPEC-01 | Phase 131 | Complete |
| SPEC-02 | Phase 132 | Complete |
| SPEC-03 | Phase 132 | Complete |
| SPEC-04 | Phase 132 | Complete |
| SPEC-05 | Phase 132 | Complete |
| SPEC-06 | Phase 132 | Complete |
| DOC-01 | Phase 133 | Pending |
| DOC-02 | Phase 133 | Pending |
| DOC-03 | Phase 133 | Pending |
| DOC-04 | Phase 133 | Pending |
| DOC-05 | Phase 133 | Pending |
| DOC-06 | Phase 133 | Pending |
| DOC-07 | Phase 133 | Pending |
| DEMO-01 | Phase 133 | Pending |
| VER-01 | Phase 134 | Pending |
| VER-02 | Phase 134 | Pending |
| VER-03 | Phase 134 | Pending |
| VER-04 | Phase 134 | Pending |
| VER-05 | Phase 134 | Pending |
| VER-06 | Phase 134 | Pending |
| VER-07 | Phase 134 | Pending |

**Coverage:**
- v0.28.0 requirements: 65 total (RES×7 + SCH×4 + POL×6 + SVG×3 + CORE×3 + CSP×7 + CAP×3 + SIDE×5 + SHIM×3 + SDK×3 + SPEC×6 + DOC×7 + DEMO×1 + VER×7)
  - **Note**: An earlier draft of this section reported "56 total"; that figure was an arithmetic error. The actual REQ-ID count enumerated in this document is 65.
- Mapped to phases: 65 ✓
- Unmapped: 0
- Phases used: 10 (125, 126, 127, 128, 129, 130, 131, 132, 133, 134)

**Phase distribution:**

| Phase | REQ Count | Categories |
|-------|-----------|------------|
| 125. Core Type Surface | 3 | CORE |
| 126. Resource NUB Scaffold + `data:` Scheme | 8 | RES (all 7) + SCH-01 |
| 127. NUB-RELAY Sidecar Amendment | 4 | SIDE-01..04 |
| 128. Central Shim Integration | 5 | SHIM (all 3) + CAP-01, CAP-02 |
| 129. Central SDK Integration | 3 | SDK |
| 130. Vite-Plugin Strict CSP | 8 | CSP (all 7) + CAP-03 |
| 131. NIP-5D In-Repo Spec Amendment | 1 | SPEC-01 |
| 132. Cross-Repo Nubs PRs | 18 | SPEC-02..06, SCH-02..04, POL (all 6), SVG (all 3), SIDE-05 |
| 133. Documentation + Demo Coordination | 8 | DOC (all 7) + DEMO-01 |
| 134. Verification & Milestone Close | 7 | VER (all 7) |
| **Total** | **65** | |

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-04-20 — traceability mapped to 10 phases (125–134) by gsd-roadmapper*
