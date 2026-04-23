# Stack Research — v0.28.0 Browser-Enforced Resource Isolation

**Domain:** Browser-enforced iframe resource isolation + scheme-pluggable shell-mediated fetch
**Researched:** 2026-04-20
**Confidence:** HIGH (web-platform APIs verified via MDN/W3C; library versions verified via npm/GitHub)
**Scope:** STACK ADDITIONS only. Existing validated stack (TS 5.9.3, tsup 8.5, turborepo 2.5, pnpm 10.8, Vitest 4, Playwright, nostr-tools 2.23.3, 14 packages at v0.2.x) is NOT re-researched.

## Headline Verdict

**The milestone needs zero new runtime dependencies.** Every required capability — CSP enforcement, CSP violation reporting, Blob transfer over postMessage, WHATWG URL parsing, scheme dispatch, SHA-256 hashing, OffscreenCanvas/ImageBitmap rasterization — is a built-in browser API. The only optional addition worth considering is **`@resvg/resvg-wasm`** for shell-side SVG rasterization, and only if `OffscreenCanvas.drawImage(<img src=blob:svg>)` proves insufficient (e.g., for headless server rasterization or font fidelity). That dep belongs in the *shell* repo, **never** in `@napplet/*`.

**For Playwright tests**, no new packages — built-in `page.on('console')`, `page.on('response')`, `page.route()`, and the W3C `securitypolicyviolation` event surface everything you need.

**For Vite dev-mode CSP**, no third-party plugin is recommended. Build a small custom `transformIndexHtml` hook inside `@napplet/vite-plugin` that mirrors what the production shell will inject. The popular `vite-plugin-csp-guard` solves a different problem (full-app SPA CSP) and pulls in subresource-integrity machinery this project does not need.

This is consistent with the project's "zero framework deps" constraint and the existing pattern where `@napplet/core` is zero-deps and `@napplet/vite-plugin` keeps its single runtime dep (`nostr-tools`) tightly scoped.

---

## Recommended Stack

### Core Technologies — All Built-In Web APIs

| Technology | Availability | Purpose in v0.28.0 | Why It's the Right Choice |
|------------|--------------|---------------------|---------------------------|
| **CSP `Content-Security-Policy` header / `<meta http-equiv>`** | All evergreen browsers (W3C CSP3) | Strict isolation: `default-src 'none'; connect-src 'none'; script-src 'self'; img-src blob:` etc. | The whole milestone goal *is* "browser-enforced". CSP is the enforcer. |
| **`securitypolicyviolation` DOM event** | All evergreen browsers (W3C CSP3 §6) | Dev-mode visibility into what a napplet tried to fetch behind the shell's back; hookable by the shell to log/alert violations. | Native, zero overhead. `document.addEventListener('securitypolicyviolation', e => …)` exposes `blockedURI`, `violatedDirective`, `effectiveDirective`, `disposition`, `sample`. |
| **`Content-Security-Policy-Report-Only` header** | All evergreen browsers | A second policy that shell can serve in dev to *observe without blocking*, alongside the enforced one. Both fire `securitypolicyviolation` events. | Built-in. The two-policy pattern is the standard "tighten safely" workflow. |
| **`postMessage` with `Transferable`** | All evergreen browsers | Hand a `Blob` (or `ArrayBuffer`) from shell to napplet without a copy: napplet receives a `blob:` URL or a transferred `ArrayBuffer`. | `Blob`s are structured-cloneable (cheap because the underlying bytes are refcounted, not copied). `ArrayBuffer`s are transferable. `MessagePort`s are transferable. No library needed. |
| **`URL` (WHATWG)** | All evergreen browsers | Parse arbitrary URLs napplets pass to `resource.bytes(url)` and dispatch on `url.protocol`. | Built-in. Handles `https:`, `data:`, custom schemes (`blossom:`, `nostr:`) — all yield a parsed `URL` with `protocol` ending in `:`. |
| **`crypto.subtle.digest('SHA-256', bytes)`** | All evergreen browsers (W3C WebCrypto) | Content-addressed cache keys for shell-internal dedup of fetched bytes. | Built-in. **Streaming digest is NOT in the spec yet** ([proposal-webcrypto-streams](https://github.com/WinterTC55/proposal-webcrypto-streams), [w3c/webcrypto#73](https://github.com/w3c/webcrypto/issues/73)) — buffer-then-digest is the only browser-native option, which is fine because the byte-cap policy makes in-memory hashing safe. |
| **`OffscreenCanvas` + `ImageBitmap`** | All evergreen browsers | Shell-side resize / re-encode of fetched bitmap content before handing the napplet a `blob:`. Worker-friendly. | Built-in. `createImageBitmap(blob, { resizeWidth, resizeHeight })` is the one-liner. `OffscreenCanvas.convertToBlob({ type: 'image/webp', quality }) → Promise<Blob>` closes the loop. |
| **`<img src="blob:…svg…">` → `drawImage` → `convertToBlob`** | All evergreen browsers | The default SVG-rasterization path: load SVG into an `<img>` (which strictly disables script execution per HTML spec — "secure static mode"), draw to canvas, export raster. | Built-in, zero deps. **This is the recommended path** for v0.28.0 unless font/feature fidelity gaps emerge. |

### Optional Supporting Library — One Candidate, Conditional

| Library | Latest Version | Size | License | Conditional Use |
|---------|----------------|------|---------|-----------------|
| **`@resvg/resvg-wasm`** | `2.6.2` (verified via npm/Bundlephobia, [resvg-js GitHub](https://github.com/thx/resvg-js)) | ~560 KB on-the-wire (the WASM artifact dominates) | MPL-2.0 | **Add ONLY if** the shell needs to rasterize SVG outside a DOM (e.g., a Worker without `<img>` access, or a future headless shell), OR if `<img>`-based rasterization shows fidelity gaps (custom fonts, filters). |

**Default position: do NOT add it for v0.28.0.** The `<img src=blob:svg>` → canvas pipeline runs in the shell's browsing context (which has DOM access), preserves all native SVG features the browser supports, and weighs zero KB. `@resvg/resvg-wasm` is the right fallback to *document* in PITFALLS, not a default dep.

If it's added later, the integration point is a separate optional package in the *shell* repo (e.g., `@napplet-shell/resvg`), **never** in `@napplet/*` — the SDK stays WASM-free.

### What `@napplet/nub` Gets

A new `resource` subdomain following the established NUB pattern (`packages/nub/src/resource/{index.ts,types.ts,shim.ts,sdk.ts}` plus matching `exports` entries in `packages/nub/package.json`). Zero new dependencies; rides on `@napplet/core` only. Mirrors the structural precedent of `packages/nub/src/identity/` (request/result RPC shape with timeout) — concrete shape lives in REQUIREMENTS.

Pseudo-shape:

- `packages/nub/src/resource/types.ts` — message envelopes (`resource.bytes`, `resource.bytes.result`)
- `packages/nub/src/resource/shim.ts` — `installResourceShim()` that wires `window.napplet.resource.bytes(url)` → postMessage → `Promise<Blob>`
- `packages/nub/src/resource/sdk.ts` — typed wrapper for bundler consumers
- 4 new `exports` entries on `@napplet/nub/package.json` (`./resource`, `./resource/types`, `./resource/shim`, `./resource/sdk`)
- 1 new `'resource'` member of `NubDomain` in `@napplet/core`

### What `@napplet/vite-plugin` Gets

One new option (`csp?: { policy: string | CspBuilder; reportOnly?: string }`) and one new code path: a `transformIndexHtml` hook that injects the policy into the served napplet HTML in dev. **No new runtime deps.** `vite` itself already exposes everything needed.

Optional: a tiny `CspBuilder` helper type living in `packages/vite-plugin/src/csp.ts` that produces the canonical strict-default policy as a string. **Don't import a library** — CSP is a small grammar and a hand-rolled builder is ~30 lines.

### Development Tools — Already Present

| Tool | Role | Notes |
|------|------|-------|
| **Playwright** (already pinned) | CSP-violation assertions in e2e tests | Use `page.on('console', …)` to catch CSP violation messages, OR `page.evaluate(() => new Promise(r => addEventListener('securitypolicyviolation', r, { once: true })))` for direct event assertion. **Do NOT enable `bypassCSP`** in v0.28.0 test contexts — that disables exactly what this milestone is testing. (Reserve `bypassCSP: true` only for unrelated suites.) Verified via [Playwright TestOptions](https://playwright.dev/docs/api/class-testoptions). |
| **Vitest 4** (already pinned) | Unit tests for `CspBuilder`, scheme-dispatch table | jsdom does not implement CSP enforcement; reserve CSP behavioral tests for Playwright. |
| **tsup 8.5** (already pinned) | Build the new `nub/resource` subpath | No config change beyond adding the entry; `nub/tsup.config.ts` already iterates subdomains. |

---

## Question-by-Question Answers

### 1. CSP Reporting / Enforcement

- **Browser API, no library.** `document.addEventListener('securitypolicyviolation', e => …)` per W3C CSP3 ([MDN: SecurityPolicyViolationEvent](https://developer.mozilla.org/en-US/docs/Web/API/SecurityPolicyViolationEvent)). The event has `blockedURI`, `violatedDirective`, `effectiveDirective`, `disposition` (`"enforce"` vs `"report"`), `documentURI`, `sample`, `sourceFile`, `lineNumber`, `columnNumber`.
- **Pair `Content-Security-Policy` with `Content-Security-Policy-Report-Only`** to observe violations of a tighter candidate policy without blocking, before tightening for real. Both fire the same event.
- **Cross-frame caveat**: violations in a child iframe target *that iframe's document*. The shell can either install a listener inside the napplet via the bootstrap script it already injects, or rely on browser DevTools console for dev-time visibility. Per [chromium issue 41491434](https://issues.chromium.org/issues/41491434), `frame-ancestors` violations notably do *not* fire in the embedded frame — design accordingly.
- **Do NOT add**: `csp-report-handler`, `csp-evaluator`, or any "CSP report endpoint" library. Endpoint reporting (`report-to` / `report-uri`) is for production telemetry to a server — out of scope for this single-shell, single-user project.

### 2. Blob Handling Across postMessage

- **Built-in: `Blob` is structured-cloneable.** Pass a `Blob` directly to `iframe.contentWindow.postMessage(blob, '*')`. Underlying bytes are refcounted by the browser; the napplet receives a usable `Blob` reference without a memory copy.
- **Alternative: transfer `ArrayBuffer`** with the second `postMessage(message, [transfer])` argument when you want to relinquish ownership and avoid even the bookkeeping cost.
- **Alternative: hand a `blob:` URL.** Shell calls `URL.createObjectURL(blob)` and posts the string. Napplet uses it as `<img src>` / `<video src>` / `fetch(blobUrl)`. **Caveat**: the napplet must be allowed `blob:` in the relevant CSP directive (`img-src blob:`, `media-src blob:`, etc.). Document this in the default policy template.
- **`OffscreenCanvas` + `ImageBitmap` for shell-side resize**: built-in. `createImageBitmap(blob, { resizeWidth: 256, resizeHeight: 256, resizeQuality: 'high' })` then `new OffscreenCanvas(...).getContext('2d').drawImage(bitmap, 0, 0)` then `canvas.convertToBlob({ type: 'image/webp', quality: 0.85 })`. **Zero deps.** Works in a Worker if the shell pushes resize off the main thread (recommended for large images).
- **Do NOT add**: `pica`, `browser-image-compression`, `blob-util`. They wrap exactly the above APIs. The shell repo can add them later if a specific quality-tuning need emerges; the SDK does not need them.

### 3. URL Parsing / Scheme Dispatch

- **Built-in: WHATWG `URL`.** `new URL('blossom://abc/xyz').protocol === 'blossom:'`. Custom schemes parse fine; what they don't get is "special scheme" treatment (no automatic relative-URL resolution, no enforced authority structure) — which is exactly what you want for opaque-scheme dispatch.
- **Pattern: a `Map<string, SchemeHandler>` keyed on `url.protocol`.** This is the same shape Service Workers use internally for `fetch` event dispatch and the same shape Tauri's `register_uri_scheme_protocol` and Electron's `protocol.handle` use. There is no widely-adopted browser library for this because the dispatch is a one-liner.
- **Reference to mention in ARCHITECTURE.md**: Service Worker `fetch` handlers, Electron `protocol.handle` (built-in 2024+), and Android `WebViewAssetLoader` all share this shape. None ship as an npm package; they're 5–10 lines of registry + lookup.
- **Do NOT add**: `url-parse`, `whatwg-url`. The platform's `URL` is the spec implementation. `whatwg-url` is for Node-side parity with the same spec and not needed in browsers.

### 4. Vite Dev-Mode CSP

**Recommendation: build a small in-house `transformIndexHtml` hook inside `@napplet/vite-plugin`.** Reasons:

- The existing plugin already uses `transformIndexHtml` for the NIP-5A meta-tag and aggregate-hash injection — adding one more line to inject `<meta http-equiv="Content-Security-Policy" content="…">` (or to set the response header in the `configureServer` middleware hook) is trivial and stays inside the plugin's existing surface.
- The third-party options exist but mismatch this project's needs:
  - **`vite-plugin-csp-guard`** ([npm](https://www.npmjs.com/package/vite-plugin-csp-guard), [docs](https://vite-csp.tsotne.co.uk/)) — well-engineered, ~16K weekly downloads, but it solves the *full-app SPA* problem (hash all top-level inline scripts, hash all Vite-generated app code, add SRI). Napplets are deliberately *not* full SPAs in this sense — they're small sandboxed iframes whose scripts come from a manifest. Its hashing pipeline would fight rather than help.
  - **`Coreoz/vite-plugin-content-security-policy`** ([repo](https://github.com/Coreoz/vite-plugin-content-security-policy)) — focused on generating Nginx/Apache config. Wrong target.
  - **`vite-plugin-csp`** ([npm](https://www.npmjs.com/package/vite-plugin-csp)) — uses `csp-typed-directives`. Pulls in a typed-CSP dep for a 30-line problem.
- **Vite's own `html.cspNonce`** ([docs / issues](https://github.com/vitejs/vite/issues/16749)) injects a nonce attribute on Vite-emitted `<script>`/`<style>` tags but **does not generate or serve the policy itself** — you still need either a header or a `<meta>` injection step.

**Concrete plan**: extend `Nip5aManifestOptions` with `csp?: NappletCspOptions` (string policy or builder); inject as `<meta http-equiv="Content-Security-Policy">` in dev mode via the existing `transformIndexHtml`; document that production shells deliver the same policy via response header.

### 5. Content-Addressed Cache Primitives

- **Built-in: `crypto.subtle.digest('SHA-256', bytes)`** returns `Promise<ArrayBuffer>` ([MDN: SubtleCrypto.digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest)).
- **Streaming digest**: NOT in the platform spec yet. Active proposal at [WinterTC55/proposal-webcrypto-streams](https://github.com/WinterTC55/proposal-webcrypto-streams) and W3C webcrypto issue [#73](https://github.com/w3c/webcrypto/issues/73) — both still open as of April 2026. This means the shell must `await response.arrayBuffer()` (or `blob.arrayBuffer()`) before hashing. **This is fine** for v0.28.0 because the milestone explicitly enforces a size cap on shell-fetched resources — buffer-then-hash within a known max is safe and doesn't motivate a polyfill.
- **Hash-to-key encoding**: convert the `ArrayBuffer` to hex (one-line: `Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')`) or base64url. No library needed.
- **Do NOT add**: `js-sha256`, `hash-wasm`, `multiformats`. WebCrypto's native implementation is faster than any JS/WASM alternative and ships with the browser. `multiformats` (CID encoding) is right *if and only if* the shell exposes hashes to napplets — which the milestone explicitly does NOT do ("hashes stay shell-internal").

### 6. Testing Strict-CSP Iframes in Playwright

- **Pattern A — Console assertion**: CSP violations log to the console as `Refused to <verb> because it violates the following Content Security Policy directive…`. Use `page.on('console', msg => …)` and assert. Cheap, works for any browser engine.
- **Pattern B — `securitypolicyviolation` event**: inside the iframe, install a listener with `page.evaluate` and resolve a Promise on first fire; assert directive/blockedURI shape. Strongest assertion when you want to verify *which* directive blocked.
- **Pattern C — Network observation**: `page.on('response', …)` or `context.on('response', …)`. If CSP successfully blocks a request, the request never hits the network — so the *absence* of a response is the proof. Pair with a positive assertion that the *shell-mediated* fetch *did* hit the network for the same URL.
- **Pattern D — `page.route()` interception** to assert the napplet didn't even attempt the request (`route.continue()` or fail with assertion-tracking).
- **Critical: do NOT enable `bypassCSP: true`** for v0.28.0 suites — that's the option that exists for testing apps *under* CSP without dealing with it; we want to test *that CSP is in place*. Keep `bypassCSP` opt-in per-suite if it's needed elsewhere. Verified via [Playwright TestOptions](https://playwright.dev/docs/api/class-testoptions).
- **No new packages.** All built-in.

### 7. SVG Sanitization / Rasterization

The threat model: napplets must never receive scriptable XML (SVG can carry `<script>`, `on*` handlers, `xlink:href` to JS, `<foreignObject>` HTML). Solution per the milestone scope: shell rasterizes shell-side and hands napplet a non-scriptable raster (PNG/WebP/AVIF).

**Three rasterization paths, ranked:**

1. **`<img src="blob:…svg…">` → `drawImage` → `convertToBlob`** *(recommended default)*. Native browser SVG renderer; CRITICAL spec property: `<img>`-loaded SVG runs in *secure static mode* — scripts disabled, external loads blocked, no animation events. Per HTML spec and verified MDN behavior. Zero dependencies. Drawback: the shell needs a DOM context (true for the current target architecture).
2. **`@resvg/resvg-wasm@2.6.2`** *(MPL-2.0, ~560 KB WASM)*. Pure-WASM Rust renderer. Use *only if* the shell needs to rasterize from a Worker without DOM, or from a future Node/server shell, or if path 1 has fidelity issues. Sources: [thx/resvg-js](https://github.com/thx/resvg-js), [npm](https://www.npmjs.com/package/@resvg/resvg-wasm), [Bundlephobia](https://bundlephobia.com/package/@resvg/resvg-wasm). MPL-2.0 is permissive enough for MIT-licensed consumers.
3. **`canvg`** — DOM-based SVG-to-canvas in JS. Older, less faithful than the browser's native renderer, larger than path 1. Not recommended.

**Sanitization vs rasterization**: do not bother with `DOMPurify`-style sanitization here. The whole point of rasterization is that the *output* (PNG/WebP) is fundamentally non-scriptable, so any SVG-level malice is neutralized by the rendering boundary. Sanitization would be belt-and-braces *before* rendering; for the threat model ("napplet never sees scriptable XML"), rasterization alone suffices.

**Do NOT add**: `DOMPurify`, `svg-sanitizer`, `xss-filters`. Wrong layer for this milestone.

---

## Installation

```bash
# NO new runtime dependencies are required for v0.28.0.

# Optional, only if path-1 SVG rasterization proves insufficient (deferred decision):
# pnpm add @resvg/resvg-wasm   # add to the SHELL repo, NOT @napplet/*
```

## Alternatives Considered

| Recommended (Built-in) | Alternative | When the Alternative Wins |
|------------------------|-------------|----------------------------|
| `<img src=blob:svg>` rasterization | `@resvg/resvg-wasm@2.6.2` | DOM-less shell context (Worker without DOM access, Node/server shell), or measurable fidelity issues with native renderer |
| Custom `transformIndexHtml` CSP injection | `vite-plugin-csp-guard@^1` | Full-app SPA where every inline script needs hashing — explicitly NOT this project |
| `crypto.subtle.digest` (buffer-then-hash) | `hash-wasm` streaming SHA-256 | Only if size caps are removed and gigabyte-scale streaming hashing becomes a real workload — not v0.28.0 |
| `URL` + `Map<protocol, handler>` dispatch | `whatwg-url` package | Never needed in browsers; only relevant for cross-runtime parity work |
| `Content-Security-Policy-Report-Only` + `securitypolicyviolation` listener | `csp-report-handler` + `report-to` endpoint | Only when shipping a multi-user production shell with telemetry — out of scope for single-user dev |
| `createImageBitmap` + `OffscreenCanvas` | `pica`, `browser-image-compression` | Specific quality-tuning needs (e.g., Lanczos resampling for thumbnails) — defer to shell repo if ever needed |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `vite-plugin-csp-guard` (or any SPA-CSP plugin) | Designed for full-app SPAs with hash-all-inline-scripts; pulls in SRI machinery; fights the napplet sandbox model where scripts come from a manifest | Custom `transformIndexHtml` hook in `@napplet/vite-plugin` |
| `csp-typed-directives` / `csp-builder` | Tiny problem (a CSP string is a deterministic concatenation); a typed builder is fine but doesn't justify a dep | Hand-rolled `CspBuilder` helper (~30 LOC) inside `packages/vite-plugin/src/csp.ts` |
| `DOMPurify` for SVG sanitization | Wrong layer — rasterization neutralizes XML; sanitization adds maintenance burden for no incremental security in this threat model | Rasterization-only (path 1 above) |
| `js-sha256`, `hash-wasm`, `crypto-js` | Slower than `crypto.subtle.digest`, larger bundle, redundant with platform | `crypto.subtle.digest('SHA-256', bytes)` |
| `multiformats` (CID encoding) | Hashes are explicitly shell-internal in this milestone; napplets never see them; CID is wrong abstraction | Hex or base64url string, internal only |
| `whatwg-url` | Browsers ship the spec implementation as `URL` | `new URL(input)` |
| `pica`, `browser-image-compression` | Wrap `createImageBitmap` / `OffscreenCanvas` with extra surface | Direct platform APIs |
| `csp-report-handler` | Endpoint reporting is for production telemetry to a server | `securitypolicyviolation` event listener for dev-mode visibility |
| Service Worker as a fetch interceptor for napplets | Service Workers are scoped to origin; napplets-as-iframes have a different security model; SW would violate the "no `allow-same-origin`" sandbox posture | `postMessage`-based `resource.bytes(url)` primitive |
| `bypassCSP: true` in Playwright **for v0.28.0 suites** | That's the option that hides exactly what this milestone tests | Test under enforced CSP; assert via console / `securitypolicyviolation` / network observation |

## Stack Patterns by Variant

**If the shell stays browser-resident (current case):**
- Use `<img src=blob:svg>` for SVG rasterization. No `@resvg/*`.
- Inject CSP via `<meta http-equiv>` in dev (Vite plugin) and via response header in production shell.
- Use `crypto.subtle.digest` directly with size-capped buffers.

**If the shell ever moves off-DOM (future Worker-only or server-side variant):**
- Add `@resvg/resvg-wasm@^2.6` for SVG rasterization in the *shell* repo (not in `@napplet/*`).
- Streaming digest: revisit then; the [WinterTC55 proposal](https://github.com/WinterTC55/proposal-webcrypto-streams) may have shipped, or a `hash-wasm` add becomes justified by an explicit non-buffered workload.

**If multi-shell production deployment ever happens (deferred):**
- Add a CSP report endpoint and `report-to` directive support. `csp-report-handler` becomes worth evaluating then. Out of scope for v0.28.0.

## Version Compatibility & Conflicts With Existing Stack

**No conflicts.** Reviewed the existing dependency surface (`nostr-tools@^2.23.3`, `tsup@^8.5`, `turbo@^2.5`, `vite@^6.3`, `vitest@^4.1`, `typescript@^5.9.3`, `@types/json-schema@^7.0.15`, `json-schema-to-ts@^3.1.1` peer in `@napplet/nub`):

- None of these dependencies execute network fetches at runtime in a way that strict CSP would break. `nostr-tools` is data-types and signing utilities (no `fetch` in the parts re-exported by `@napplet/vite-plugin`). The build-time tools (tsup, vite, vitest) run in Node, not under napplet CSP.
- **Vite 6.3** — `transformIndexHtml` API stable. `html.cspNonce` exists if needed (we likely won't need it; napplet scripts come from a manifest, not Vite-injected `<script>` tags inside the napplet HTML).
- **Vitest 4** — jsdom does not enforce CSP. Keep CSP behavioral tests in Playwright; reserve Vitest for unit tests of `CspBuilder` string output and the scheme dispatch table.
- **Playwright** — `bypassCSP` exists ([TestOptions](https://playwright.dev/docs/api/class-testoptions)) but **must be left at default `false`** for v0.28.0 suites.
- **`@napplet/core` zero-dep contract** — preserved. The new `resource` NUB types live in `@napplet/nub/resource` (which already only depends on `@napplet/core`).
- **`sideEffects: false` on `@napplet/nub`** — preserved. New subpath exports are tree-shakable per the existing pattern.

## Anything to REMOVE or Change

**Nothing structural to remove.** Audit findings:

- The shim does not currently fetch external resources directly — it's a postMessage shim. No existing code conflicts with strict CSP.
- The `@napplet/vite-plugin` `nostr-tools` dependency is build-time only and unaffected.
- The 9 deprecated `@napplet/nub-<domain>` re-export shims (slated for `REMOVE-01..03` in a future milestone) need a corresponding `@napplet/nub-resource` re-export shim **only if** the project decides to keep the deprecation pattern consistent. **Recommendation: skip it** — `nub-resource` is brand-new, was never published as a separate package, has no existing consumers. The deprecation shims exist for backward compat; there's nothing to be backward-compat with. Surface `resource` exclusively via `@napplet/nub/resource`.

One **inconsistency to flag** (not a removal, but worth noting in REQUIREMENTS): the `relay.publishEncrypted` precedent (v0.24.0) means the shell already has a "do crypto on behalf of napplet" pattern. The new `resource.bytes` should follow the same envelope/timeout/error conventions — no new infra needed, just consistency in the new NUB's message-shape design.

## Sources

- **MDN: SecurityPolicyViolationEvent** — https://developer.mozilla.org/en-US/docs/Web/API/SecurityPolicyViolationEvent — HIGH confidence (W3C-tracking authoritative reference)
- **MDN: Document securitypolicyviolation event** — https://developer.mozilla.org/en-US/docs/Web/API/Document/securitypolicyviolation_event — HIGH confidence
- **MDN: SubtleCrypto.digest()** — https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest — HIGH confidence
- **W3C webcrypto issue #73 (streaming digest)** — https://github.com/w3c/webcrypto/issues/73 — HIGH confidence; verified the streaming-digest gap
- **WinterTC55 webcrypto-streams proposal** — https://github.com/WinterTC55/proposal-webcrypto-streams — HIGH confidence; verified proposal status
- **Playwright TestOptions (bypassCSP)** — https://playwright.dev/docs/api/class-testoptions — HIGH confidence
- **Vite issue #16749 (strict CSP in production)** — https://github.com/vitejs/vite/issues/16749 — MEDIUM (Vite team statements, evolving)
- **Vite issue #11862 (strict CSP in dev)** — https://github.com/vitejs/vite/issues/11862 — MEDIUM
- **vite-plugin-csp-guard** — https://www.npmjs.com/package/vite-plugin-csp-guard, https://vite-csp.tsotne.co.uk/ — MEDIUM (third-party plugin, evaluated and rejected with rationale)
- **Coreoz/vite-plugin-content-security-policy** — https://github.com/Coreoz/vite-plugin-content-security-policy — MEDIUM (evaluated and rejected)
- **vite-plugin-csp** — https://www.npmjs.com/package/vite-plugin-csp — MEDIUM (evaluated and rejected)
- **resvg-js / @resvg/resvg-wasm** — https://github.com/thx/resvg-js, https://www.npmjs.com/package/@resvg/resvg-wasm — HIGH confidence; v2.6.2 verified via npm + Bundlephobia
- **Bundlephobia: @resvg/resvg-wasm@2.6.2** — https://bundlephobia.com/package/@resvg/resvg-wasm — HIGH confidence on size (~560 KB)
- **Chromium issue 41491434 (`securitypolicyviolation` cross-frame quirks)** — https://issues.chromium.org/issues/41491434 — MEDIUM (browser bug tracker; relevant caveat)
- **content-security-policy.com quick reference** — https://content-security-policy.com/ — MEDIUM (community reference, cross-checked against MDN)
- **OWASP CSP Cheat Sheet** — https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html — HIGH for general CSP guidance
- **Existing repo source (verified by reading)**:
  - `/home/sandwich/Develop/napplet/package.json` — root devDeps inventory
  - `/home/sandwich/Develop/napplet/packages/vite-plugin/package.json` — vite-plugin dep surface (sole runtime dep: `nostr-tools`)
  - `/home/sandwich/Develop/napplet/packages/core/package.json` — confirmed zero runtime deps
  - `/home/sandwich/Develop/napplet/packages/nub/package.json` — confirmed subpath-export pattern; resource subdomain to follow

---
*Stack research for: v0.28.0 Browser-Enforced Resource Isolation*
*Researched: 2026-04-20*
*Confidence: HIGH overall. Web platform APIs cited from MDN/W3C are normative. Library version pins (`@resvg/resvg-wasm@2.6.2`, third-party Vite CSP plugins) verified via npm; recommendations to NOT add them documented with rationale.*
