# Milestone v0.29.0 Requirements — NUB-CONNECT + Shell as CSP Authority

> **Architecture note:** v0.29.0 introduces **two** NUBs — NUB-CLASS (abstract posture authority, wire-based class assignment) and NUB-CONNECT (user-gated direct network access). NUB-CLASS owns the napplet class-track via a sub-track of NUB-CLASS-$N documents. NUB-CONNECT is one of potentially several NUBs that contribute to class determination. Each NUB is voluntarily implementable and exposes a self-sufficient runtime surface (no cross-NUB state collapse).

## v1 Requirements

### Cross-Repo Spec (`napplet/nubs` public repo)

- [x] **SPEC-01**: Draft NUB-CONNECT.md in napplet/nubs covering manifest tag shape (`["connect", "<origin>"]`), origin format rules (scheme/host/port/path/wildcard/Punycode), consent flow, runtime API (`NappletConnect` interface with `granted: boolean` + `origins: readonly string[]`), capability advertisement (`nub:connect`, `connect:scheme:http`, `connect:scheme:ws`), grant lifecycle (key = `(dTag, aggregateHash)`), security considerations, references to NUB-CLASS-2 as the posture triggered by presence of `connect` tags, test vectors. NUB-CONNECT does NOT redefine Class 1/Class 2 — cites NUB-CLASS-2 by name.
- [x] **SPEC-02**: Define canonical aggregateHash fold procedure for `connect:origins` at byte level (lowercase → ASCII sort → `\n`-join no trailing → UTF-8 → SHA-256 → lowercase hex) — normative pseudocode + conformance fixture so build and shell produce byte-identical hashes
- [x] **SPEC-03**: Specify IDN handling direction of authority (build converts UTF-8 → Punycode; shell rejects non-Punycode) with test vectors
- [x] **SPEC-04**: Draft NUB-CLASS.md in napplet/nubs — establishes the NUB-CLASS track, defines the wire message `class.assigned` (shell → napplet at iframe ready, one terminal envelope per lifecycle with `{ class: number }` payload), defines the napplet-side runtime surface (`window.napplet.class` → `number | undefined`; undefined until wire arrives or if shell doesn't implement the NUB), defines capability `nub:class`, includes an internal section authoring the template + guidance for NUB-CLASS-$N sub-track member documents (CSP posture, manifest prerequisites, shell responsibilities, security considerations format)
- [x] **SPEC-05**: Zero-grep hygiene across NUB-CONNECT + NUB-CLASS + NUB-CLASS-1 + NUB-CLASS-2 drafts: no `@napplet/*` mentions, no `kehto`/`hyprgate`, no private-package names
- [x] **SPEC-06**: Draft NUB-CLASS-1.md in napplet/nubs — the strict / no-user-declared-origins posture. CSP shape: baseline with `connect-src 'none'`. Triggers: napplet manifest has no class-contributing NUB tags (current: no `connect` tags). Shell behavior: emit strict CSP header, no consent prompt, send `class.assigned` with `class: 1`.
- [x] **SPEC-07**: Draft NUB-CLASS-2.md in napplet/nubs — the user-approved explicit-origin CSP posture. CSP shape: `connect-src <granted-origins>`. Triggers: napplet manifest has `connect` tags AND user approved. Shell behavior: prompt user at first load per `(dTag, aggregateHash)`, persist decision, emit grant-derived CSP header, send `class.assigned` with `class: 2` (or `class: 1` on denial — napplet falls back to strict posture).
- [x] **SPEC-08**: Update NUB-CONNECT draft to cite NUB-CLASS-2 by name ("a napplet declaring any `connect` tag takes on the NUB-CLASS-2 posture defined in `NUB-CLASS-2.md`"); remove any inline Class-1/Class-2 redefinition

### NIP-5D Amendment (`specs/NIP-5D.md`)

- [x] **NIP5D-01**: Remove or generalize the "Browser-Enforced Resource Isolation" subsection (lines 115-130). Replace with a generic one-paragraph Security Considerations note: "NUBs MAY define napplet classes with different security postures delivered through shell-controlled HTTP response headers; class taxonomy and delivery mechanics are out of scope for this NIP." No NUB names, no class names, no CSP directives inline. ✅ Phase 135 Plan 02
- [x] **NIP5D-02**: Remove the `perm:strict-csp` capability-advertisement example; keep the generic `shell.supports(...)` table with `nub:/perm:/svc:` prefixes as an example pattern, but no NUB-flavored examples ✅ Phase 135 Plan 02

### Core Type Surface (`packages/core/`)

- [x] **CORE-01**: Add `'connect'` to `NubDomain` union in `envelope.ts` and to `NUB_DOMAINS` array
- [x] **CORE-02**: Add `connect: NappletConnect` field to `NappletGlobal` interface in `types.ts`, mirroring the `resource:` block pattern
- [x] **CORE-03**: Mark `perm:strict-csp` as `@deprecated` in JSDoc on `NamespacedCapability` type; document supersession by `nub:connect` + `nub:class`
- [x] **CORE-04**: Add `'class'` to `NubDomain` union in `envelope.ts` and to `NUB_DOMAINS` array (12 domains total with connect + class)
- [x] **CORE-05**: Add `class?: number` field to `NappletGlobal` interface in `types.ts` — typed as optional because shells may not implement `nub:class`; napplet reads `undefined` when shell doesn't implement the NUB or before `class.assigned` wire arrives

### `@napplet/nub/connect` Subpath (`packages/nub/src/connect/`)

- [x] **NUB-01**: Create `types.ts` with `DOMAIN = 'connect'` const, `NappletConnect` interface (`readonly granted: boolean`, `readonly origins: readonly string[]`), and pure `normalizeConnectOrigin(origin: string): string` function that validates scheme/host/port/path/IDN (shared source of truth for build-side and shell-side consumers)
- [x] **NUB-02**: Create `shim.ts` with `installConnectShim()` that reads `<meta name="napplet-connect-granted">`, parses whitespace-separated origins, and populates `window.napplet.connect` with readonly-getter state (default `{granted: false, origins: []}` when meta absent)
- [x] **NUB-03**: Create `sdk.ts` with thin readonly-getter wrappers (`connectGranted()`, `connectOrigins()`) — OR omit if design lands on types-only exposure like theme NUB (decide during plan phase)
- [x] **NUB-04**: Create `index.ts` barrel re-exporting types + shim + SDK, plus `registerNub(DOMAIN, noop)` side-effect on import
- [x] **NUB-05**: Add 4 subpath exports to `packages/nub/package.json`: `./connect`, `./connect/types`, `./connect/shim`, `./connect/sdk`
- [x] **NUB-06**: Add 4 entry points to `packages/nub/tsup.config.ts` for the connect subpath files
- [x] **NUB-07**: Tree-shaking contract: `@napplet/nub/connect/types` consumed via `import type` emits zero runtime code (matches v0.26.0 theme-NUB bundle-size proof)

### `@napplet/nub/class` Subpath (`packages/nub/src/class/`)

- [x] **CLASS-01**: Create `types.ts` with `DOMAIN = 'class'` const, `ClassAssignedMessage` wire type (`{ type: 'class.assigned'; id: string; class: number }`), optional `NappletClass` interface capturing the runtime state shape
- [x] **CLASS-02**: Create `shim.ts` with `installClassShim()` that registers a dispatcher handler for `class.assigned` envelopes; on receipt, writes the assigned number to `window.napplet.class` (readonly getter); leaves `window.napplet.class` as `undefined` until the wire arrives; idempotent re-assignment (last write wins) for future dynamic-class extension
- [x] **CLASS-03**: Create `sdk.ts` with thin readonly-getter wrapper (`getClass()`) — optional parallel to connect/sdk.ts; may omit if design lands on types-only exposure (decide during plan phase)
- [x] **CLASS-04**: Create `index.ts` barrel re-exporting types + shim + SDK, plus `registerNub(DOMAIN, handler)` side-effect registering the class.assigned handler
- [x] **CLASS-05**: Add 4 subpath exports to `packages/nub/package.json`: `./class`, `./class/types`, `./class/shim`, `./class/sdk`, plus 4 matching entry points in `packages/nub/tsup.config.ts`
- [x] **CLASS-06**: Tree-shaking contract: `@napplet/nub/class/types` consumed via `import type` emits zero runtime code (matches connect + theme NUB precedent)

### `@napplet/vite-plugin` Surgery (`packages/vite-plugin/`)

- [x] **VITE-01**: Remove production-path strict-CSP machinery — delete `buildBaselineCsp`, `validateStrictCspOptions`, `assertMetaIsFirstHeadChild`, `assertNoDevLeakage`, nonce generation, CSP meta injection in `transformIndexHtml`, CSP asserts in `closeBundle`, `StrictCspOptions` import; `packages/vite-plugin/src/csp.ts` deleted OR retained dev-only (decide during plan phase)
- [x] **VITE-02**: Remove `strictCsp?: boolean | StrictCspOptions` option from `Nip5aManifestOptions` OR retain as `@deprecated` accept-but-warn for one release cycle (decide during plan phase)
- [x] **VITE-03**: Add `connect?: string[]` option to `Nip5aManifestOptions`
- [x] **VITE-04**: Implement origin normalization via shared `normalizeConnectOrigin()` from `@napplet/nub/connect/types`; validate in `configResolved()`; throw with `[nip5a-manifest]` prefix on invalid origins (uppercase host, wildcard, path, query, fragment, default port, non-Punycode IDN, cleartext scheme without explicit opt-in warning)
- [x] **VITE-05**: Emit `['connect', origin]` tags (one per origin) in the signed NIP-5A manifest, placed between `manifestXTags` and `configTags`
- [x] **VITE-06**: Fold normalized connect origins into `aggregateHash` via synthetic xTag entry — sort → `\n`-join → SHA-256 → `[hash, 'connect:origins']` pushed into xTags before `computeAggregateHash`; filter out of `['x', …]` projection (matches `config:schema` precedent at `packages/vite-plugin/src/index.ts:568`)
- [x] **VITE-07**: Extract synthetic xTag filter into `SYNTHETIC_XTAG_PATHS` set (or equivalent constant) so adding future synthetic entries doesn't require patching the projection filter twice (prevents BUILD-P3 drift)
- [x] **VITE-08**: Add fail-loud inline-script diagnostic — scan `dist/index.html` in `closeBundle` for `<script>` elements without `src` attribute; throw with clear error referencing the shell-CSP `script-src 'self'` reason (decide regex vs parse5/htmlparser2 during plan phase)
- [x] **VITE-09**: Build-time cleartext warning — when `http:` or `ws:` origins appear in `connect`, emit informational console log explaining browser mixed-content rules (silently fails from HTTPS shell unless localhost/127.0.0.1)
- [x] **VITE-10**: Optional dev-mode-only `<meta name="napplet-connect-requires" content="...">` for shell-less `vite serve` local preview (distinct name from shell-authoritative `napplet-connect-granted`)

### Central Shim + SDK Integration (`packages/shim/`, `packages/sdk/`)

- [x] **SHIM-01**: Import `installConnectShim` from `@napplet/nub/connect/shim` in `packages/shim/src/index.ts`; call at bootstrap; add `connect: { granted, origins }` block to the `window.napplet` literal. No central-dispatch router entry — NUB-CONNECT has no wire messages
- [x] **SHIM-02**: Graceful degradation — `window.napplet.connect` MUST default to `{granted: false, origins: []}` (never `undefined`) when shell does not advertise `nub:connect` or does not inject the grant meta tag
- [x] **SHIM-03**: Import `installClassShim` from `@napplet/nub/class/shim` in `packages/shim/src/index.ts`; call at bootstrap; add `class: undefined` initial value (readonly getter) to the `window.napplet` literal. Wire dispatcher routes `class.assigned` envelopes to the class shim's handler.
- [x] **SHIM-04**: Graceful degradation — `window.napplet.class` MUST be `undefined` (never `0`, never `null`) when shell does not advertise `nub:class` or has not yet sent `class.assigned`; napplets gracefully degrade by checking `shell.supports('nub:class')` before depending on the value
- [x] **SDK-01**: Add `connect` namespace block to `packages/sdk/src/index.ts` parallel to `resource`; re-export types from `@napplet/nub/connect`; export `DOMAIN as CONNECT_DOMAIN`; export `installConnectShim`
- [x] **SDK-02**: Add `class` namespace block to `packages/sdk/src/index.ts` parallel to `connect`; re-export types from `@napplet/nub/class`; export `DOMAIN as CLASS_DOMAIN`; export `installClassShim`

### Shell-Deployer Policy Documents (`specs/SHELL-CONNECT-POLICY.md`, `specs/SHELL-CLASS-POLICY.md`)

- [x] **POLICY-01**: Author `specs/SHELL-CONNECT-POLICY.md` as shell-deployer checklist parallel to `specs/SHELL-RESOURCE-POLICY.md`; non-normative companion to NUB-CONNECT spec
- [x] **POLICY-02**: Document HTTP-responder precondition — shell MUST own the response headers for napplet HTML; list acceptable delivery mechanisms (direct serving, HTTP proxy, `blob:` URL with HTML rewrite, `srcdoc`), with per-mode pitfalls (blob has no HTTP headers so CSP meta-as-first-head-child returns; srcdoc `about:srcdoc` origin resolves `'self'` differently; proxy must preserve/rewrite CSP; direct-serve watch CDN caching)
- [x] **POLICY-03**: Document residual meta-CSP scan requirement — shells MUST refuse to serve Class-2 napplets (manifest with `connect` tags) that contain `<meta http-equiv="Content-Security-Policy">`; include parser-based example (not regex); 5-fixture conformance bundle covering attribute-order variations, CDATA/comments, quoted variants
- [x] **POLICY-04**: Document mixed-content reality check — `http:` origins from HTTPS shell silently fail except localhost/127.0.0.1 secure-context exceptions
- [x] **POLICY-05**: Document cleartext-scheme policy — shells MAY refuse cleartext entirely (advertise `shell.supports('connect:scheme:http') === false`); consent UI MUST visibly warn when granting cleartext origins
- [x] **POLICY-06**: Document grant-persistence composite-key requirement — grants keyed on exact `(dTag, aggregateHash)`; napplet rebuild with changed `connect` tags produces new aggregateHash (via `connect:origins` fold) and auto-invalidates prior grant
- [x] **POLICY-07**: Document revocation UI requirement — shells MUST expose a user-facing revocation affordance; revoked grants mark state as DENIED (not deleted) so shell retains historical knowledge
- [x] **POLICY-08**: Document consent-prompt language requirement — MUST capture that grant allows send AND receive with the origin, and that shell has zero visibility into post-grant traffic ("this napplet can talk with foo.com however it wants")
- [x] **POLICY-09**: Document explicit N/A items — no private-IP block (browser matches URL literal not resolved IP), no MIME sniffing, no SVG rasterization caps, no redirect chain limits (all are NUB-RESOURCE concerns; NUB-CONNECT has no shell-visibility post-grant)
- [x] **POLICY-10**: Zero-grep hygiene on SHELL-CONNECT-POLICY.md — no `@napplet/*` references (this file is in the private SDK repo but must remain citation-safe for the NUBs track)
- [x] **POLICY-11**: Author `specs/SHELL-CLASS-POLICY.md` as shell-deployer checklist parallel to `specs/SHELL-CONNECT-POLICY.md`; non-normative companion to NUB-CLASS spec
- [x] **POLICY-12**: Document class-determination authority — shell is the sole authority on what class a napplet is assigned; class is determined by which class-contributing NUBs are declared in the manifest combined with any user-consent outcomes; shell MUST send `class.assigned` wire at iframe ready, with at-most-one terminal envelope per napplet lifecycle (dynamic re-classification out of scope for v0.29.0)
- [x] **POLICY-13**: Document the wire timing — `class.assigned` MUST be sent AFTER the iframe signals readiness (shim bootstrap complete) and BEFORE the napplet's own code can meaningfully branch on class; recommend coupling to the shim's ready signal
- [x] **POLICY-14**: Document the cross-NUB invariant (shell responsibility) — in shells implementing BOTH `nub:connect` and `nub:class`: `class === 2` iff `connect.granted === true` at the time `class.assigned` is sent; shells MUST NOT emit a state where these two signals disagree
- [x] **POLICY-15**: Document revocation UX for class-2 napplets — revoking a connect grant MUST trigger either a napplet reload with `class.assigned` `class: 1`, or a shell-side refusal-to-serve until user re-approves; mid-session dynamic class change is out of v0.29.0 scope
- [x] **POLICY-16**: Zero-grep hygiene on SHELL-CLASS-POLICY.md — no `@napplet/*` references

### Documentation Sweep

- [x] **DOC-01**: Update root `README.md` for two-class posture, connect API, and "default to NUB-RESOURCE; reach for NUB-CONNECT only when resource NUB can't express what you need" guidance
- [x] **DOC-02**: Update `packages/nub/README.md` to add `connect` row to the NUB domain table; note types-only vs full-surface distinction
- [x] **DOC-03**: Update `packages/vite-plugin/README.md` — remove strict-CSP documentation; add `connect` option documentation; add inline-script-diagnostic documentation
- [x] **DOC-04**: Update `packages/shim/README.md` to document `window.napplet.connect` surface and graceful-degradation defaults
- [x] **DOC-05**: Update `packages/sdk/README.md` to document the `connect` namespace, `CONNECT_DOMAIN` constant, and `installConnectShim` export
- [x] **DOC-06**: Update `skills/build-napplet/SKILL.md` for two classes, connect API, "default to NUB-RESOURCE" guidance, and cleartext / mixed-content warning
- [x] **DOC-07**: Preserve v0.28.0 historical changelog bullets byte-identical (v0.27.0 precedent)

### Verification & Milestone Close

- [x] **VER-01**: `pnpm -r build` exits 0 across all 14 packages with the connect subpath added
- [x] **VER-02**: `pnpm -r type-check` exits 0 across all 14 packages
- [x] **VER-03**: Tree-shake bundle test — extend v0.26.0 VER-03 / v0.28.0 VER-01 harness with a "types-only connect consumer" case; assert final bundle contains zero `installConnectShim` and zero `registerNub` emissions
- [ ] **VER-04**: Playwright smoke test — napplet with `connect` tags + shell with approved grant → `fetch(granted-url)` succeeds, `fetch(other-url)` emits `securitypolicyviolation` event
- [ ] **VER-05**: Playwright smoke test — napplet with `connect` tags + shell with denied grant → emitted CSP header has `connect-src 'none'`, `window.napplet.connect.granted === false`
- [x] **VER-06**: Integration test — napplet's `connect` origin list changed while dist files unchanged → aggregateHash still changes via `connect:origins` fold → prior grant auto-invalidated on next load
- [ ] **VER-07**: Integration test — napplet ships residual meta CSP + Class-2 manifest → shell refuses to serve with the prescribed diagnostic; Class-1 residual meta CSP is harmless
- [x] **VER-08**: Cross-repo zero-grep audit — public-repo hygiene clean on NUB-CONNECT draft + NUBs-track advisory (zero `@napplet/`, zero `kehto`, zero `hyprgate`, zero `packages/(nub|shim|sdk|vite-plugin)`)
- [x] **VER-09**: Author changeset for v0.29.0 breaking change; call out `strictCsp` removal/deprecation loudly
- [x] **VER-10**: Confirm downstream-shell-repo tracking issue exists for v0.29.0 demo napplets (Option B carried forward from v0.28.0)
- [x] **VER-11**: Playwright smoke test — shell sends `class.assigned` envelope with `class: 2` → `window.napplet.class === 2` after dispatcher processes the wire; shell sends with `class: 1` → `window.napplet.class === 1`
- [x] **VER-12**: Playwright smoke test — shell advertises `shell.supports('nub:class') === false` and never sends `class.assigned` → `window.napplet.class === undefined` (graceful degradation)
- [x] **VER-13**: Integration test — cross-NUB invariant in shell implementing both NUBs: `window.napplet.class === 2` iff `window.napplet.connect.granted === true`; shell MUST NOT emit a state where these disagree

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

Every v1 REQ-ID is mapped to exactly one phase. 57/57 REQ-IDs covered. Phase numbering continues from v0.28.0 (ended at Phase 134).

| Requirement | Phase | Status |
|-------------|-------|--------|
| SPEC-01 | Phase 135 | Complete |
| SPEC-02 | Phase 135 | Complete |
| SPEC-03 | Phase 135 | Complete |
| SPEC-04 | Phase 135 | Complete |
| SPEC-05 | Phase 135 | Complete |
| NIP5D-01 | Phase 135 | ✅ Complete |
| NIP5D-02 | Phase 135 | ✅ Complete |
| CORE-01 | Phase 136 | Complete |
| CORE-02 | Phase 136 | Complete |
| CORE-03 | Phase 136 | Complete |
| CORE-04 | Phase 136 | Complete |
| CORE-05 | Phase 136 | Complete |
| NUB-01 | Phase 137 | Complete |
| NUB-02 | Phase 137 | Complete |
| NUB-03 | Phase 137 | Complete |
| NUB-04 | Phase 137 | Complete |
| NUB-05 | Phase 137 | Complete |
| NUB-06 | Phase 137 | Complete |
| NUB-07 | Phase 137 | Complete |
| VITE-01 | Phase 138 | Complete |
| VITE-02 | Phase 138 | Complete |
| VITE-03 | Phase 138 | Complete |
| VITE-04 | Phase 138 | Complete |
| VITE-05 | Phase 138 | Complete |
| VITE-06 | Phase 138 | Complete |
| VITE-07 | Phase 138 | Complete |
| VITE-08 | Phase 138 | Complete |
| VITE-09 | Phase 138 | Complete |
| VITE-10 | Phase 138 | Complete |
| SHIM-01 | Phase 139 | Complete |
| SHIM-02 | Phase 139 | Complete |
| SHIM-03 | Phase 139 | Complete |
| SHIM-04 | Phase 139 | Complete |
| SDK-01 | Phase 139 | Complete |
| SDK-02 | Phase 139 | Complete |
| POLICY-01 | Phase 140 | Complete |
| POLICY-02 | Phase 140 | Complete |
| POLICY-03 | Phase 140 | Complete |
| POLICY-04 | Phase 140 | Complete |
| POLICY-05 | Phase 140 | Complete |
| POLICY-06 | Phase 140 | Complete |
| POLICY-07 | Phase 140 | Complete |
| POLICY-08 | Phase 140 | Complete |
| POLICY-09 | Phase 140 | Complete |
| POLICY-10 | Phase 140 | Complete |
| DOC-01 | Phase 141 | Complete |
| DOC-02 | Phase 141 | Complete |
| DOC-03 | Phase 141 | Complete |
| DOC-04 | Phase 141 | Complete |
| DOC-05 | Phase 141 | Complete |
| DOC-06 | Phase 141 | Complete |
| DOC-07 | Phase 141 | Complete |
| VER-01 | Phase 142 | Complete |
| VER-02 | Phase 142 | Complete |
| VER-03 | Phase 142 | Complete |
| VER-04 | Phase 142 | Pending |
| VER-05 | Phase 142 | Pending |
| VER-06 | Phase 142 | Complete |
| VER-07 | Phase 142 | Pending |
| VER-08 | Phase 142 | Complete |
| VER-09 | Phase 142 | Complete |
| VER-10 | Phase 142 | Complete |

---

*Generated 2026-04-21 for milestone v0.29.0 NUB-CONNECT + Shell as CSP Authority. See `.planning/research/SUMMARY.md` for research synthesis feeding this requirement set.*
