# Milestone v0.29.0 Requirements — NUB-CONNECT + Shell as CSP Authority

## v1 Requirements

### Cross-Repo Spec (`napplet/nubs` public repo)

- [ ] **SPEC-01**: Draft NUB-CONNECT.md in napplet/nubs covering manifest tag shape (`["connect", "<origin>"]`), origin format rules (scheme/host/port/path/wildcard/Punycode), consent flow, runtime API (`NappletConnect` interface), capability advertisement (`nub:connect`, `connect:scheme:http`, `connect:scheme:ws`), grant lifecycle (key = `(dTag, aggregateHash)`), security considerations, Class-1 / Class-2 taxonomy, test vectors
- [ ] **SPEC-02**: Define canonical aggregateHash fold procedure for `connect:origins` at byte level (lowercase → ASCII sort → `\n`-join no trailing → UTF-8 → SHA-256 → lowercase hex) — normative pseudocode + conformance fixture so build and shell produce byte-identical hashes
- [ ] **SPEC-03**: Specify IDN handling direction of authority (build converts UTF-8 → Punycode; shell rejects non-Punycode) with test vectors
- [ ] **SPEC-04**: Author NUBs-track advisory document on how NUBs define napplet classes on top of existing tracks (Class 1 = no opt-in, Class 2 = `connect` tags trigger consent + grant-derived CSP)
- [ ] **SPEC-05**: Zero-grep hygiene across NUB-CONNECT + advisory drafts: no `@napplet/*` mentions, no `kehto`/`hyprgate`, no private-package names

### NIP-5D Amendment (`specs/NIP-5D.md`)

- [ ] **NIP5D-01**: Soften "Browser-Enforced Resource Isolation" subsection (lines 115-130) to forward-pointer to NUB-CONNECT, delegating napplet-class distinction out of NIP-5D into the NUBs track
- [ ] **NIP5D-02**: Keep NIP-5D's transport-only philosophy; do not add class enumeration or CSP emission details inline — NIP-5D points at NUB-CONNECT for these concerns

### Core Type Surface (`packages/core/`)

- [ ] **CORE-01**: Add `'connect'` to `NubDomain` union in `envelope.ts` and to `NUB_DOMAINS` array (11 domains total)
- [ ] **CORE-02**: Add `connect: NappletConnect` field to `NappletGlobal` interface in `types.ts`, mirroring the `resource:` block pattern
- [ ] **CORE-03**: Mark `perm:strict-csp` as `@deprecated` in JSDoc on `NamespacedCapability` type; document supersession by `nub:connect`

### `@napplet/nub/connect` Subpath (`packages/nub/src/connect/`)

- [ ] **NUB-01**: Create `types.ts` with `DOMAIN = 'connect'` const, `NappletConnect` interface (`readonly granted: boolean`, `readonly origins: readonly string[]`), and pure `normalizeConnectOrigin(origin: string): string` function that validates scheme/host/port/path/IDN (shared source of truth for build-side and shell-side consumers)
- [ ] **NUB-02**: Create `shim.ts` with `installConnectShim()` that reads `<meta name="napplet-connect-granted">`, parses whitespace-separated origins, and populates `window.napplet.connect` with readonly-getter state (default `{granted: false, origins: []}` when meta absent)
- [ ] **NUB-03**: Create `sdk.ts` with thin readonly-getter wrappers (`connectGranted()`, `connectOrigins()`) — OR omit if design lands on types-only exposure like theme NUB (decide during plan phase)
- [ ] **NUB-04**: Create `index.ts` barrel re-exporting types + shim + SDK, plus `registerNub(DOMAIN, noop)` side-effect on import
- [ ] **NUB-05**: Add 4 subpath exports to `packages/nub/package.json`: `./connect`, `./connect/types`, `./connect/shim`, `./connect/sdk`
- [ ] **NUB-06**: Add 4 entry points to `packages/nub/tsup.config.ts` for the connect subpath files
- [ ] **NUB-07**: Tree-shaking contract: `@napplet/nub/connect/types` consumed via `import type` emits zero runtime code (matches v0.26.0 theme-NUB bundle-size proof)

### `@napplet/vite-plugin` Surgery (`packages/vite-plugin/`)

- [ ] **VITE-01**: Remove production-path strict-CSP machinery — delete `buildBaselineCsp`, `validateStrictCspOptions`, `assertMetaIsFirstHeadChild`, `assertNoDevLeakage`, nonce generation, CSP meta injection in `transformIndexHtml`, CSP asserts in `closeBundle`, `StrictCspOptions` import; `packages/vite-plugin/src/csp.ts` deleted OR retained dev-only (decide during plan phase)
- [ ] **VITE-02**: Remove `strictCsp?: boolean | StrictCspOptions` option from `Nip5aManifestOptions` OR retain as `@deprecated` accept-but-warn for one release cycle (decide during plan phase)
- [ ] **VITE-03**: Add `connect?: string[]` option to `Nip5aManifestOptions`
- [ ] **VITE-04**: Implement origin normalization via shared `normalizeConnectOrigin()` from `@napplet/nub/connect/types`; validate in `configResolved()`; throw with `[nip5a-manifest]` prefix on invalid origins (uppercase host, wildcard, path, query, fragment, default port, non-Punycode IDN, cleartext scheme without explicit opt-in warning)
- [ ] **VITE-05**: Emit `['connect', origin]` tags (one per origin) in the signed NIP-5A manifest, placed between `manifestXTags` and `configTags`
- [ ] **VITE-06**: Fold normalized connect origins into `aggregateHash` via synthetic xTag entry — sort → `\n`-join → SHA-256 → `[hash, 'connect:origins']` pushed into xTags before `computeAggregateHash`; filter out of `['x', …]` projection (matches `config:schema` precedent at `packages/vite-plugin/src/index.ts:568`)
- [ ] **VITE-07**: Extract synthetic xTag filter into `SYNTHETIC_XTAG_PATHS` set (or equivalent constant) so adding future synthetic entries doesn't require patching the projection filter twice (prevents BUILD-P3 drift)
- [ ] **VITE-08**: Add fail-loud inline-script diagnostic — scan `dist/index.html` in `closeBundle` for `<script>` elements without `src` attribute; throw with clear error referencing the shell-CSP `script-src 'self'` reason (decide regex vs parse5/htmlparser2 during plan phase)
- [ ] **VITE-09**: Build-time cleartext warning — when `http:` or `ws:` origins appear in `connect`, emit informational console log explaining browser mixed-content rules (silently fails from HTTPS shell unless localhost/127.0.0.1)
- [ ] **VITE-10**: Optional dev-mode-only `<meta name="napplet-connect-requires" content="...">` for shell-less `vite serve` local preview (distinct name from shell-authoritative `napplet-connect-granted`)

### Central Shim + SDK Integration (`packages/shim/`, `packages/sdk/`)

- [ ] **SHIM-01**: Import `installConnectShim` from `@napplet/nub/connect/shim` in `packages/shim/src/index.ts`; call at bootstrap; add `connect: { granted, origins }` block to the `window.napplet` literal. No central-dispatch router entry — NUB-CONNECT has no wire messages
- [ ] **SHIM-02**: Graceful degradation — `window.napplet.connect` MUST default to `{granted: false, origins: []}` (never `undefined`) when shell does not advertise `nub:connect` or does not inject the grant meta tag
- [ ] **SDK-01**: Add `connect` namespace block to `packages/sdk/src/index.ts` parallel to `resource`; re-export types from `@napplet/nub/connect`; export `DOMAIN as CONNECT_DOMAIN`; export `installConnectShim`

### Shell-Deployer Policy Document (`specs/SHELL-CONNECT-POLICY.md`)

- [ ] **POLICY-01**: Author `specs/SHELL-CONNECT-POLICY.md` as shell-deployer checklist parallel to `specs/SHELL-RESOURCE-POLICY.md`; non-normative companion to NUB-CONNECT spec
- [ ] **POLICY-02**: Document HTTP-responder precondition — shell MUST own the response headers for napplet HTML; list acceptable delivery mechanisms (direct serving, HTTP proxy, `blob:` URL with HTML rewrite, `srcdoc`), with per-mode pitfalls (blob has no HTTP headers so CSP meta-as-first-head-child returns; srcdoc `about:srcdoc` origin resolves `'self'` differently; proxy must preserve/rewrite CSP; direct-serve watch CDN caching)
- [ ] **POLICY-03**: Document residual meta-CSP scan requirement — shells MUST refuse to serve Class-2 napplets (manifest with `connect` tags) that contain `<meta http-equiv="Content-Security-Policy">`; include parser-based example (not regex); 5-fixture conformance bundle covering attribute-order variations, CDATA/comments, quoted variants
- [ ] **POLICY-04**: Document mixed-content reality check — `http:` origins from HTTPS shell silently fail except localhost/127.0.0.1 secure-context exceptions
- [ ] **POLICY-05**: Document cleartext-scheme policy — shells MAY refuse cleartext entirely (advertise `shell.supports('connect:scheme:http') === false`); consent UI MUST visibly warn when granting cleartext origins
- [ ] **POLICY-06**: Document grant-persistence composite-key requirement — grants keyed on exact `(dTag, aggregateHash)`; napplet rebuild with changed `connect` tags produces new aggregateHash (via `connect:origins` fold) and auto-invalidates prior grant
- [ ] **POLICY-07**: Document revocation UI requirement — shells MUST expose a user-facing revocation affordance; revoked grants mark state as DENIED (not deleted) so shell retains historical knowledge
- [ ] **POLICY-08**: Document consent-prompt language requirement — MUST capture that grant allows send AND receive with the origin, and that shell has zero visibility into post-grant traffic ("this napplet can talk with foo.com however it wants")
- [ ] **POLICY-09**: Document explicit N/A items — no private-IP block (browser matches URL literal not resolved IP), no MIME sniffing, no SVG rasterization caps, no redirect chain limits (all are NUB-RESOURCE concerns; NUB-CONNECT has no shell-visibility post-grant)
- [ ] **POLICY-10**: Zero-grep hygiene on SHELL-CONNECT-POLICY.md — no `@napplet/*` references (this file is in the private SDK repo but must remain citation-safe for the NUBs track)

### Documentation Sweep

- [ ] **DOC-01**: Update root `README.md` for two-class posture, connect API, and "default to NUB-RESOURCE; reach for NUB-CONNECT only when resource NUB can't express what you need" guidance
- [ ] **DOC-02**: Update `packages/nub/README.md` to add `connect` row to the NUB domain table; note types-only vs full-surface distinction
- [ ] **DOC-03**: Update `packages/vite-plugin/README.md` — remove strict-CSP documentation; add `connect` option documentation; add inline-script-diagnostic documentation
- [ ] **DOC-04**: Update `packages/shim/README.md` to document `window.napplet.connect` surface and graceful-degradation defaults
- [ ] **DOC-05**: Update `packages/sdk/README.md` to document the `connect` namespace, `CONNECT_DOMAIN` constant, and `installConnectShim` export
- [ ] **DOC-06**: Update `skills/build-napplet/SKILL.md` for two classes, connect API, "default to NUB-RESOURCE" guidance, and cleartext / mixed-content warning
- [ ] **DOC-07**: Preserve v0.28.0 historical changelog bullets byte-identical (v0.27.0 precedent)

### Verification & Milestone Close

- [ ] **VER-01**: `pnpm -r build` exits 0 across all 14 packages with the connect subpath added
- [ ] **VER-02**: `pnpm -r type-check` exits 0 across all 14 packages
- [ ] **VER-03**: Tree-shake bundle test — extend v0.26.0 VER-03 / v0.28.0 VER-01 harness with a "types-only connect consumer" case; assert final bundle contains zero `installConnectShim` and zero `registerNub` emissions
- [ ] **VER-04**: Playwright smoke test — napplet with `connect` tags + shell with approved grant → `fetch(granted-url)` succeeds, `fetch(other-url)` emits `securitypolicyviolation` event
- [ ] **VER-05**: Playwright smoke test — napplet with `connect` tags + shell with denied grant → emitted CSP header has `connect-src 'none'`, `window.napplet.connect.granted === false`
- [ ] **VER-06**: Integration test — napplet's `connect` origin list changed while dist files unchanged → aggregateHash still changes via `connect:origins` fold → prior grant auto-invalidated on next load
- [ ] **VER-07**: Integration test — napplet ships residual meta CSP + Class-2 manifest → shell refuses to serve with the prescribed diagnostic; Class-1 residual meta CSP is harmless
- [ ] **VER-08**: Cross-repo zero-grep audit — public-repo hygiene clean on NUB-CONNECT draft + NUBs-track advisory (zero `@napplet/`, zero `kehto`, zero `hyprgate`, zero `packages/(nub|shim|sdk|vite-plugin)`)
- [ ] **VER-09**: Author changeset for v0.29.0 breaking change; call out `strictCsp` removal/deprecation loudly
- [ ] **VER-10**: Confirm downstream-shell-repo tracking issue exists for v0.29.0 demo napplets (Option B carried forward from v0.28.0)

## Future Requirements (Deferred)

**Carried from v0.26.0:**
- REMOVE-01: Delete the 9 deprecated `@napplet/nub-<domain>` packages from the repo
- REMOVE-02: Remove the deprecated packages from the publish workflow and pnpm-workspace.yaml
- REMOVE-03: Remove deprecation banners / `@deprecated` metadata references

**Emerging from v0.29.0 (candidate v0.30.0 or later):**
- CONNECT-V2-01: Per-origin partial grants (approve some, deny others in the same prompt)
- CONNECT-V2-02: Wildcard subdomain origins (`https://*.example.com`) pending threat-model review
- REMOVE-STRICTCSP: Hard-remove the deprecated `strictCsp` option from `Nip5aManifestOptions` after one release cycle (if deprecation path chosen in VITE-02)
- REMOVE-STRICTCSP-CAP: Remove `perm:strict-csp` capability advertisement support after the deprecation-window expires
- CONNECT-AUDIT-01: Downstream-shell-repo feature — user-facing "recent network calls" audit UI (browser gives no hook; requires service-worker workaround or per-shell instrumentation)

## Out of Scope

**Carried from prior milestones:**
- Mobile native wrapper — web-first protocol, native later
- Framework-specific bindings (Svelte/React components) — SDK is framework-agnostic by design
- Multi-shell federation — single shell per page for v1
- IndexedDB storage backend — localStorage sufficient for v1
- Key rotation for delegated keypairs — complexity not justified yet
- Rate limiting on signer requests — document expected behavior, don't enforce yet
- Restrictive ACL default mode — permissive default for developer adoption
- Manifest signature verification in shell — deferred to post-v1 security hardening
- Arbitrary custom napplet loading in the demo shell
- DAW implementation or audio-specific protocols

**New in v0.29.0:**
- **Per-origin partial grants** — v1 is all-or-nothing; a future v2 may add partial grants
- **Wildcard subdomains** — each subdomain is a separate tag requiring separate user consent
- **Shell visibility into post-grant traffic** — fundamental tradeoff of NUB-CONNECT vs. NUB-RESOURCE; user's grant is a full trust vote for listed origins
- **Quota / rate-limiting on granted traffic** — browser doesn't give the shell a hook without a service worker (sandbox forbids SW registration)
- **Audit logging of individual network calls** — same reason; browser enforces CSP transparently to shell
- **Any postMessage wire messages for NUB-CONNECT** — spec Non-Goal; NUB-CONNECT is expressed entirely through manifest tags + CSP + discovery meta tag
- **Service-Worker-based grant mechanisms** — sandbox forbids SW registration at opaque origin
- **Private-IP block list for `connect-src`** — browser CSP matches URL literal not resolved IP; DNS rebinding bypasses any origin-match check; document as NUB-RESOURCE-only concern
- **Separate `@napplet/nub-connect` workspace package** — inverts v0.26.0 consolidation; use subpath of existing `@napplet/nub`
- **MIME sniffing / SVG rasterization / redirect chain limits** — NUB-RESOURCE concerns, not applicable when browser does origin enforcement
- **NPM publish automation** — PUB-04 carried forward; blocked on human npm auth
- **Demo napplets in this repo** — Option B from v0.28.0 carries forward; demos live in downstream shell repo

## Traceability

(Filled in by roadmap — maps each REQ-ID to its owning phase.)

---

*Generated 2026-04-21 for milestone v0.29.0 NUB-CONNECT + Shell as CSP Authority. See `.planning/research/SUMMARY.md` for research synthesis feeding this requirement set.*
