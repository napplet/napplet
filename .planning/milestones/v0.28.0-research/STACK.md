# Stack Research — v0.29.0 NUB-CONNECT + Shell as CSP Authority

**Domain:** TypeScript monorepo / build-time Vite plugin + runtime shim type surface
**Researched:** 2026-04-21
**Confidence:** HIGH (for existing stack — already validated); HIGH (for new needs — verified against Node stdlib + current docs)
**Scope:** Subtractive + additive milestone. No new runtime frameworks, no rewrite.

## TL;DR

**Zero new runtime dependencies.** Every need for v0.29.0 is satisfiable by:
- Node 20+ stdlib (`node:url`, `node:crypto`) for origin normalization and hashing.
- The existing hand-rolled regex parser pattern in `csp.ts` for inline-script detection.
- Existing Playwright + Vitest for tests (shell-emitted CSP is simulated via `page.route()` response-header rewrite and/or test-server fixtures; no new test library).

The only package-level changes are **removals** from `@napplet/vite-plugin` and an **additive `/connect` subpath** on the existing consolidated `@napplet/nub` package.

## Current Stack (validated — DO NOT re-research)

| Technology | Version | Role | Notes |
|------------|---------|------|-------|
| TypeScript | 5.9.3 | Language | strict, ESM-only, ES2022 |
| tsup | 8.5.0 | Package bundling | per-package builds |
| turborepo | 2.5.0 | Monorepo orchestration | `pnpm -r build` |
| pnpm | 10.8.0 | Workspaces / install | |
| changesets | 2.30.0 | Versioning / publish | |
| Vite | ^6.3.0 (peer) | Consumer build tool | `@napplet/vite-plugin` peer dep |
| Vitest | 4.x | Unit / integration tests | existing |
| Playwright | (existing) | e2e / CSP-bound tests | existing harness |
| nostr-tools | 2.23.3 | Direct dep of vite-plugin only | dynamic-imported for signing |
| `@napplet/nub` | 0.2.x | Consolidated NUB package | 38 subpath exports today |
| 4-package SDK | 0.2.x | core / shim / sdk / vite-plugin | unchanged shape |

Everything above is already in `packages/vite-plugin/package.json` and root `pnpm-lock.yaml`. No version bumps required for v0.29.0.

## Proposed Additions

### 1. `@napplet/nub/connect` subpath (NEW — additive only)

**What:** New subpath on the existing `@napplet/nub` package mirroring the structure of `@napplet/nub/resource` shipped in v0.28.0:

```
packages/nub/src/connect/
  index.ts    — barrel re-exports types.ts + shim.ts + sdk.ts
  types.ts    — NappletConnect interface (granted, origins)
  shim.ts     — installConnectShim(window, { granted, origins })
  sdk.ts      — named-export helpers wrapping window.napplet.connect
```

**Dependencies:** none. Types-only for `types.ts`; shim is ~20 lines that read a handshake message or a `<meta name="napplet-connect-granted">` injected by the shell; SDK is thin wrappers.

**Why:** The consolidated-package architecture established in v0.26.0 (34 subpaths), extended in v0.28.0 to 38 (resource × 4), is the proven pattern. Adding 4 more subpaths (connect × 4) brings it to 42. No new package — that would fragment the tree-shake contract.

**Integration point:** Parallels resource wiring. Central shim (`packages/shim/src/index.ts`) imports `@napplet/nub/connect/shim` and calls `installConnectShim(...)` with values populated from the shim-bootstrap handshake. Central SDK (`packages/sdk/src/index.ts`) re-exports from `@napplet/nub/connect/sdk`.

### 2. `node:url` for origin normalization (stdlib, NO new dep)

**Need:** The new `connect?: string[]` vite-plugin option must normalize + validate origins per NUB-CONNECT spec §"Origin Format (strict)":
- Scheme ∈ `{https, wss, http, ws}`
- Lowercase host
- Punycode (xn--…) for IDN
- No default ports (`:443` for `https`, `:80` for `http`, etc.)
- No path / query / fragment / wildcards

**Tool:** `node:url` module — already available in Node 20+ which every maintainer already runs.

```typescript
import { URL, domainToASCII } from 'node:url';

function normalizeConnectOrigin(raw: string): string {
  const u = new URL(raw);                     // throws on malformed
  if (!/^(https?|wss?):$/.test(u.protocol)) throw ...;
  if (u.pathname !== '/' && u.pathname !== '') throw ...;
  if (u.search || u.hash) throw ...;
  if (u.username || u.password) throw ...;
  const asciiHost = domainToASCII(u.hostname); // Punycode conversion
  if (!asciiHost) throw new Error(`invalid IDN: ${u.hostname}`);
  if (asciiHost !== u.hostname.toLowerCase()) throw ...; // require authors to ship Punycode pre-normalized, or normalize silently — decide in plan
  const defaultPort = { 'https:': '443', 'http:': '80', 'wss:': '443', 'ws:': '80' }[u.protocol];
  if (u.port && u.port === defaultPort) throw ...;
  return `${u.protocol}//${asciiHost}${u.port ? `:${u.port}` : ''}`;
}
```

**Why `node:url`, not `punycode`:** The userland `punycode` npm module is an orphaned userland fork of the deprecated Node builtin. `node:url`'s `domainToASCII` wraps the current WHATWG URL IDN toolchain (ICU-backed in recent Node versions) and is what Node itself steers you toward. Zero new dep, zero deprecation warning, correctness delegated to the runtime.

**Why not `tr46`:** Adds a dep (~100KB with tables) for a feature `node:url` already provides. We're a build-time plugin running in Node; this is exactly the case `domainToASCII` is for.

**Confidence:** HIGH. Verified against [Node.js URL docs](https://nodejs.org/api/url.html) and [punycode deprecation guidance](https://nodejs.org/api/punycode.html) — both explicitly direct domain-workflow consumers to `url.domainToASCII`.

### 3. `node:crypto` for `connect:origins` aggregate-hash fold (existing, NO new dep)

**Need:** Per spec §"Content-Addressing Consequences", the normalized origin set is hashed and pushed as a synthetic `[originsHash, 'connect:origins']` xTag entry before `computeAggregateHash(...)` runs. Exactly mirrors the `config:schema` pattern already in `packages/vite-plugin/src/index.ts` around lines 568–571.

**Tool:** `crypto.createHash('sha256')` — already imported at line 17 of `index.ts`.

```typescript
if (connectOrigins.length > 0) {
  const canonical = [...connectOrigins].sort().join('\n');
  const h = crypto.createHash('sha256').update(canonical).digest('hex');
  xTags.push([h, 'connect:origins']);
}
// Filtered out of the ['x', ...] manifest projection just like 'config:schema' (line 586).
```

**Canonical serialization choice:** sorted origins joined with `\n`. Matches the pattern used for the file-set aggregate hash (lines 113–119). Reject alternatives: JSON.stringify of an array is order-sensitive and brittle; sorted newline-joined is already the house pattern.

### 4. Inline-script build-time diagnostic (NEW — regex-only, NO new dep)

**Need:** Per spec §"Responsibility Split / Napplet author / no inline scripts" + §"Open Questions → lean hard error", fail the production build if `dist/index.html` contains any `<script>` without `src=`. This is a DX guard so authors see the error here, not as a silent runtime CSP violation in the browser.

**Tool:** Same regex-parser pattern as existing `csp.ts` (`assertMetaIsFirstHeadChild` at lines 244–276). A single regex walk over the HTML source, matching `<script[^>]*>` and checking for the presence of `src=` attr.

```typescript
export function assertNoInlineScripts(html: string): void {
  const scriptOpen = /<script\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptOpen.exec(html)) !== null) {
    const attrs = m[1];
    if (!/\bsrc\s*=/i.test(attrs)) {
      throw new Error(
        `[nip5a-manifest] inline <script> detected in dist/index.html — forbidden under shell-authoritative CSP (script-src 'self'). Move JS to an external file and load via <script src="...">.`,
      );
    }
  }
}
```

**Why no HTML parser:** Spec note in existing `csp.ts` header says it outright — "Per STACK.md 'What NOT to Use', htmlparser2/parse5/csp-typed-directives are NOT needed for a 10-directive deterministic grammar." Same logic applies here: Vite emits a well-formed HTML document with its own emitter; we are scanning for a specific element shape. A regex is appropriate, auditable, zero-dep, and the code is short enough to read in one screen.

**Edge cases handled by the pattern:**
- `<script type="module" src="...">` — has `src=`, passes.
- `<script async src="...">` — has `src=`, passes.
- `<script>/* inline */</script>` — no `src=`, fails.
- `<script src="">` — has `src=` attr (rendered as such by all HTML emitters); we could tighten to reject empty values, but YAGNI — Vite never emits this.
- Script tags inside comments / CDATA — not supported in HTML5, irrelevant.
- HTML-escaped `&lt;script&gt;` — not a script element, skipped (regex matches `<`, not `&lt;`).

**Integration point:** Add as a new exported function in `packages/vite-plugin/src/csp.ts` (the file is being repurposed as "build-time CSP-adjacent guards" — see §Proposed Removals), called from `closeBundle` in `packages/vite-plugin/src/index.ts` after the existing `assertMetaIsFirstHeadChild` line is removed or gated.

### 5. Shell-side HTML delivery mechanisms (NORMATIVE REFERENCE ONLY — spec text, no SDK code)

**Scope clarification:** Per milestone context, "Shell-side HTML serving — not implemented in this repo (shell is downstream)." The SDK does not ship server code. The NUB-CONNECT spec (in `napplet/nubs` repo) and the in-repo `specs/SHELL-CONNECT-POLICY.md` checklist MUST enumerate acceptable delivery mechanisms so downstream shell implementors have a canonical list.

**Canonical delivery options (for spec prose):**

| Mechanism | Where CSP lives | Origin model | Notes |
|-----------|-----------------|--------------|-------|
| **HTTP proxy** | Response header on proxied napplet HTML | Shell's origin or any origin the shell proxies | Most flexible. The shell acts as a reverse proxy for `dist/index.html` and its static assets, stripping any residual meta CSP and attaching the computed CSP header. Works with any static host upstream. |
| **Direct serving from shell origin** | Response header | Shell's origin | Shell is itself a server; napplet HTML lives alongside shell routes. Same-origin implications: `sandbox="allow-scripts"` (no `allow-same-origin`) makes this still opaque to the shell origin. |
| **`blob:` URL with HTML rewrite** | Meta CSP AFTER HTML rewrite (header CSP not available on `blob:`) | Opaque origin per iframe | Shell fetches HTML, rewrites to inject CSP meta as first head child, creates `Blob({type:'text/html'})`, iframe `src=URL.createObjectURL(blob)`. **Caveat:** `blob:` URLs cannot have HTTP headers, so CSP must be delivered via meta — which means the residual-meta-CSP scan (§Edge Case 1) doesn't apply the same way; shells using this mechanism MUST still strip any author-shipped meta CSP and inject the shell's meta as first head child. |
| **`srcdoc=`** | Meta CSP inside the srcdoc HTML string | Opaque origin | iframe `srcdoc` takes a full HTML document as an attribute. Same meta-CSP-delivery constraint as `blob:`. Practical payload-size limit (browsers enforce URI-length limits in some cases; `srcdoc` does not hit those, but memory considerations for large napplet bundles apply). |
| **Service Worker on a separate origin** | Response header from the SW's synthesized response | Shell-controlled subdomain or path | Requires the shell to register a SW for a distinct origin (can't be the napplet's sandboxed opaque origin). Heavy — probably over-engineering. Mentioned for completeness; spec should flag as "possible but not recommended for v1." |

**What the spec should say (informative text for SHELL-CONNECT-POLICY.md):**
> Preferred delivery is HTTP proxy or direct serving, where CSP is an HTTP response header and residual meta-CSP on the napplet document can be strictly scanned + rejected pre-serve. `blob:` and `srcdoc` are supported but require the shell to rewrite HTML to inject its own meta CSP as the first `<head>` child, and to strip any author-shipped meta CSP beforehand. Service Worker is out of scope for v1.

**Why this goes in spec prose, not SDK code:** Downstream shell implementors choose their architecture. The SDK's job is to produce napplet HTML that doesn't fight any of these mechanisms (no inline scripts, no meta CSP in prod, all assets via `<script src>` / `<link href>` relative paths). That's the sum total of the SDK's contribution to shell-side delivery.

**Confidence:** HIGH. All four mechanisms are present-day browser features; `blob:` and `srcdoc` opaque-origin + meta-CSP interaction documented on MDN.

### 6. Playwright CSP test strategy (existing stack, NEW pattern)

**Need:** Per spec §"Testing Posture", integration tests verify:
- Class 2 + approved grant → fetch to granted URL succeeds, fetch to other URL is CSP-blocked
- Class 2 + denied grant → `connect-src 'none'` in emitted CSP, `window.napplet.connect.granted === false`
- Residual meta CSP on Class 2 napplet → shell refuses to serve with prescribed diagnostic
- Aggregate-hash flip on origin list change → re-prompt triggered

**Tool:** Existing Playwright harness + two orthogonal techniques:

**Technique A — `page.route()` to inject CSP header** (canonical Playwright pattern for response-header manipulation):

```typescript
await page.route('**/napplet-fixture.html', async (route) => {
  const response = await route.fetch();
  const body = await response.body();
  await route.fulfill({
    response,
    body,
    headers: {
      ...response.headers(),
      'content-security-policy': "default-src 'none'; script-src 'self'; connect-src https://approved.example; ...",
    },
  });
});
```

This simulates the shell emitting CSP via HTTP header on a fixture HTML page that the test serves statically. Zero new dependencies — `page.route` is a first-party Playwright API.

**Technique B — listen for `securitypolicyviolation` events** via `page.evaluate`:

```typescript
await page.evaluate(() => {
  (window as any).__cspViolations = [];
  document.addEventListener('securitypolicyviolation', (e) => {
    (window as any).__cspViolations.push({
      violatedDirective: e.violatedDirective,
      blockedURI: e.blockedURI,
    });
  });
});

// ... perform fetch that should be blocked ...

const violations = await page.evaluate(() => (window as any).__cspViolations);
expect(violations).toContainEqual(expect.objectContaining({
  violatedDirective: 'connect-src',
  blockedURI: expect.stringContaining('https://other.example'),
}));
```

[`SecurityPolicyViolationEvent`](https://developer.mozilla.org/en-US/docs/Web/API/SecurityPolicyViolationEvent) is a standard DOM event fired by the browser when CSP is violated. Subscribing to it in `page.evaluate` is the cleanest way to assert positive-blocking in Playwright. This is the pattern v0.28.0 already uses for CSP positive-blocking simulation; we extend it here.

**Why not `bypassCSP: true`:** That's for the opposite use case (running agent code on a CSP-locked site). We WANT the CSP to apply and fire violations. Leave `bypassCSP` at the default `false`.

**Confidence:** HIGH. `page.route()` header manipulation is stable Playwright API; `securitypolicyviolation` is W3C-standard and implemented in Chromium/Firefox/WebKit.

## Proposed Removals

All removals are from `@napplet/vite-plugin`. The CSP module (`packages/vite-plugin/src/csp.ts`) becomes lean.

| File / Export | Current Role | Action in v0.29.0 |
|---------------|--------------|-------------------|
| `buildBaselineCsp()` | 10-directive string builder | **Remove in prod path**, keep ONLY a dev-mode minimal wrapper OR delete entirely. Recommendation: keep a trimmed `buildDevCspMeta(mode, nonce)` dev-only helper behind a `if (mode === 'dev')` gate, drop prod paths. |
| `validateStrictCspOptions()` | Rejects header-only + unsafe-* | **Remove.** No `StrictCspOptions` option surface in v0.29.0. |
| `assertNoDevLeakage()` | Fail if ws:// in prod CSP | **Remove.** No prod CSP emitted. |
| `assertMetaIsFirstHeadChild()` | First-child invariant | **Remove from prod path.** Keep in dev-mode path only if we retain dev meta CSP (lean: remove entirely; dev shell-less preview can ship without strict meta-first enforcement — it's a development convenience, not a security gate). |
| `HEADER_ONLY_DIRECTIVES` const | Directive reject list | **Remove.** |
| `BASELINE_DIRECTIVE_ORDER` const | Canonical ordering | **Remove.** |
| `StrictCspOptions` interface | Public option type | **Remove from public API.** Breaking change for anyone who imported it; acceptable per v0.29.0 breaking-change posture. |
| `nonce` generation (`crypto.randomBytes(16).toString('base64url')`) in `index.ts` line 437 | Per-build nonce | **Remove.** No nonce needed — shell CSP uses `script-src 'self'`, inline scripts forbidden. |
| `strictCsp?: boolean \| StrictCspOptions` option on `Nip5aManifestOptions` | Opt-in CSP emission | **Remove from type** OR mark as no-op with `@deprecated` JSDoc for one release if we want a soft break. Recommendation: **hard remove**, matches v0.29.0 "breaking change" posture in PROJECT.md line 19. |
| `transformIndexHtml` CSP-meta injection block (`index.ts` lines 456–466) | Emits meta CSP | **Remove entirely.** No meta CSP in prod; dev meta is optional and, if retained, should be a single-line injection gated on `isDev`. |
| `closeBundle` CSP post-build assertion block (`index.ts` lines 519–535) | Post-build verification | **Remove entirely.** |

**Resulting `csp.ts` shape:** File either (a) shrinks to ~20 lines containing only `assertNoInlineScripts()`, renamed to a more accurate filename like `guards.ts`; or (b) is split: `guards.ts` with the inline-script check + a new `connect.ts` with `normalizeConnectOrigin()` + `hashConnectOrigins()`. Preference: **(b) split by concern** — matches the existing file-per-concern convention captured in memory.

**Net LOC delta in vite-plugin:** roughly −250 lines (remove CSP machinery) + +80 lines (connect normalization, inline-script guard, aggregateHash fold) ≈ −170 net. This is a simplification, not a rewrite.

## Integration Points

| Change | File | Shape |
|--------|------|-------|
| New `connect?: string[]` option | `packages/vite-plugin/src/index.ts` — `Nip5aManifestOptions` interface | Optional string array of raw origins; plugin normalizes before emitting. |
| Origin normalization | `packages/vite-plugin/src/connect.ts` (new) | `normalizeConnectOrigin(raw: string): string` + `normalizeAll(origins: string[]): string[]` with deterministic throw messages. |
| Aggregate-hash fold | `packages/vite-plugin/src/index.ts` — `closeBundle` | After file walk, before `computeAggregateHash`, push `[originsHash, 'connect:origins']` mirroring lines 568–571. |
| Manifest `['connect', origin]` tags | `packages/vite-plugin/src/index.ts` — `manifest.tags` construction (around lines 601–606) | Append one tag per normalized origin, placed between `x-tags` and `config-tags` per existing ordering convention. Filter `connect:origins` out of `['x', ...]` projection same way `config:schema` is filtered (line 586). |
| Inline-script guard | `packages/vite-plugin/src/guards.ts` (new) + call site in `closeBundle` | `assertNoInlineScripts(html)` called post-build, replacing the removed CSP block. |
| Optional `<meta name="napplet-connect">` HTML attribute | `packages/vite-plugin/src/index.ts` — `transformIndexHtml` tags list | Surfaces the declared origin set into `index.html` for devtools inspection; not load-bearing (shell reads from manifest). **Lean: don't ship this in v0.29.0**, can be added in a follow-up if shells ask for it. |
| `@napplet/nub/connect` subpath | `packages/nub/src/connect/{index,types,shim,sdk}.ts` | Four files, mirroring `packages/nub/src/resource/` layout. |
| `@napplet/nub/package.json` exports | `packages/nub/package.json` | Add 4 new subpath entries: `./connect`, `./connect/types`, `./connect/shim`, `./connect/sdk`. |
| Central shim wiring | `packages/shim/src/index.ts` | Import `installConnectShim` and call at bootstrap with values read from shell handshake — parallels resource wiring landed in v0.28.0. |
| Central SDK wiring | `packages/sdk/src/index.ts` | `export * from '@napplet/nub/connect/sdk'` — one line. |
| `NubDomain` type | `packages/core/src/types.ts` (existing) | Add `'connect'` to the `NubDomain` union. |
| `NappletGlobal` type | `packages/core/src/types.ts` | Add `connect: NappletConnect` property. |
| `shell.supports()` namespace | `packages/core/src/types.ts` + downstream-shell advertising | Add `'nub:connect'`, `'connect:scheme:http'`, `'connect:scheme:ws'` to the namespaced `shell.supports()` key union. |

## What NOT to Add

| Rejected | Why | Use Instead |
|----------|-----|-------------|
| `parse5` / `htmlparser2` / `node-html-parser` | We scan Vite-emitted HTML for one element shape. A full DOM parser is over-engineering and adds ~300KB of deps for a 10-line check. The existing regex pattern in `csp.ts` is proven and auditable. | Hand-rolled regex in `guards.ts`. |
| `csp-typed-directives` / `csp-header` / `csp-builder` packages | We are NOT building CSP strings in the SDK anymore — that's the shell's job. All CSP-emission code is being removed. A CSP library would be the wrong direction. | Deletion. The shell owns CSP composition. |
| `tr46` / `idna-uts46-hx` / `punycode` (userland npm) | `node:url`'s `domainToASCII` is ICU-backed, standards-current, zero-dep, and what Node docs direct domain workflows to. The userland `punycode` npm is orphaned. | `import { domainToASCII } from 'node:url'`. |
| `valid-url` / `is-url-superb` | We need strict NUB-CONNECT-specific validation (reject paths, reject default ports, reject wildcards); generic URL-validity packages are too permissive and we'd still need custom rules on top. Just use `new URL()` + explicit rules. | `new URL(...)` with explicit rule checks. |
| XML schema or JSON-schema validator for `connect` manifest tag shape | The manifest tag shape is trivial: `['connect', string]`. No nested structure to validate. A schema validator is overkill. | Inline TypeScript type guard + explicit rule checks. |
| Runtime CSP-building framework (e.g., something that composes CSP in the shim) | The shim does not emit CSP. Period. CSP comes from the shell. The shim exposes `window.napplet.connect.{granted, origins}` — a two-field read-only interface. No CSP logic in SDK runtime code. | Two-field read-only interface, populated at bootstrap. |
| Service Worker for post-grant traffic inspection | Spec §"Non-Goals" forbids this. `sandbox="allow-scripts"` also forbids it. | Accept post-grant opacity as the documented tradeoff. |
| New test runner / CSP-test library | Playwright's `page.route()` + `securitypolicyviolation` listener cover every test case in spec §"Testing Posture". The v0.28.0 suite already uses this pattern. | Extend existing Playwright fixtures. |
| `undici` / `node-fetch` for test HTTP | Playwright's `page.route` + fulfill cover response-header manipulation. If we need a real HTTP server for a fixture, Node 20's built-in `node:http` is sufficient (same pattern used elsewhere in the repo's tests). | stdlib or existing harness. |
| New package `@napplet/nub-connect` (separate workspace) | v0.26.0 consolidated all NUBs into a single `@napplet/nub` package with subpaths explicitly to avoid package-fragmentation. Opening a new `@napplet/nub-connect` package would invert that decision. The NUB-CONNECT spec §"Open Questions" leans toward "surface through existing structure" — this research resolves that: use a subpath. | `@napplet/nub/connect` subpath. |
| `@deprecated` soft-deprecate of `strictCsp` option | v0.29.0 is explicitly a breaking-change milestone (PROJECT.md line 19). A soft-deprecate path means keeping 250 LOC of dead code for a release. Hard-remove is cleaner. | Hard-remove, document in CHANGELOG + migration note. |
| A second "dev-only CSP" code path | Spec §"Open Questions" leans "retain for shell-less local preview only, but with clearly deprecated path." Research verdict: retain a minimal ≤30-line dev-mode inline meta CSP helper with `connect-src 'self' ws://localhost:* wss://localhost:*` + `script-src 'self' 'unsafe-inline'` (for Vite HMR) behind a `mode === 'dev'` gate, nothing fancy. Fully document that it is NOT normative and is NOT inspected by any shell. Final decision on keep-vs-remove belongs in phase planning, not research. | Phase plan decides. Research leans keep-minimal to preserve `vite dev` DX for authors with no shell running. |

## Version Compatibility

| Constraint | Already satisfied by existing stack |
|------------|------------------------------------|
| Node ≥ 18 for `domainToASCII` | Yes — repo targets Node 20+; `domainToASCII` has been stable since Node 14. |
| Vite ≥ 5 for `transformIndexHtml` return array shape | Yes — peer dep is already `>=5.0.0`. |
| Playwright ≥ 1.40 for `page.route().fulfill({ response, body, headers })` | Yes — existing harness; API stable. |
| `SecurityPolicyViolationEvent` in Playwright-driven Chromium | Yes — W3C standard, Chromium has supported it since 2016. |

No version bumps required.

## Sources

- [Node.js `node:url` documentation](https://nodejs.org/api/url.html) — verified `domainToASCII` API shape and IDN handling (HIGH confidence).
- [Node.js `punycode` deprecation notice](https://nodejs.org/api/punycode.html) — verified that userland alternatives are orphaned and `url.domainToASCII` is the canonical replacement (HIGH confidence).
- [MDN `SecurityPolicyViolationEvent`](https://developer.mozilla.org/en-US/docs/Web/API/SecurityPolicyViolationEvent) — verified event name, interface shape, cross-browser support (HIGH confidence).
- [Playwright `TestOptions`](https://playwright.dev/docs/api/class-testoptions) and `page.route()` documentation — verified response-header rewrite pattern (HIGH confidence).
- `packages/vite-plugin/src/csp.ts` (lines 1–277) — ground-truth read of existing strict-CSP code slated for removal (HIGH confidence).
- `packages/vite-plugin/src/index.ts` (lines 1–660) — ground-truth read of current plugin integration surface (HIGH confidence).
- `docs/superpowers/specs/2026-04-21-napplet-network-permission-design.md` — full design spec authored by project maintainer (HIGH confidence — this is the authority for v0.29.0 scope).
- `.planning/PROJECT.md` (lines 1–399) — confirms existing stack + v0.29.0 scope (HIGH confidence).
- Project memory: NUB packages own ALL logic; file-per-concern convention — confirms subpath-on-`@napplet/nub` pattern and filename convention.

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Removing `StrictCspOptions` breaks downstream importers | LOW — the type was added in v0.28.0, two weeks ago, likely zero external importers yet | Document in CHANGELOG as intentional breaking change. Downstream shell repo is the primary consumer and is already in the coordination loop per PROJECT.md line 20. |
| `domainToASCII` normalizes IDN to Punycode silently instead of erroring on raw Unicode input | LOW — matches spec intent (require Punycode in output) but may surprise authors who pass raw Unicode | Decide in phase plan: either auto-normalize (friendlier) or hard-error on input-differs-from-output (stricter per spec). Lean auto-normalize + emit a build-log info message. |
| Regex inline-script detection misses an exotic edge case (e.g., SVG `<script>` inside an inline SVG) | LOW — Vite-emitted napplet HTML doesn't include inline SVGs with scripts; if an author adds one, the shell CSP will still block it at runtime (defense in depth) | Accept. The build-time check is DX — the shell CSP is the security control. Spec explicitly notes this split. |
| Playwright `page.route()` response-header rewrite doesn't update `document.contentSecurityPolicy` in some edge cases | LOW — this is a well-established pattern; v0.28.0 suite already uses it | If issues emerge in a specific test case, fall back to a real Node test server fixture using stdlib `node:http`. |
| Dev-mode meta CSP retention causes confusion ("why does my napplet have a meta CSP when I'm told not to?") | MEDIUM — if retained poorly, authors may copy-paste dev CSP into prod | Either (a) delete dev CSP entirely (simplest), or (b) add a clear `<!-- dev-only, NOT inspected by any shell -->` comment above the injected meta. Phase plan decides. |
| `node:url` behavior differences across Node minor versions for edge-case IDN inputs | LOW — ICU is bundled with Node; stable across Node 20.x | Pin Node version in CI; tests cover the canonical origin shapes. |
| Shell implementors choose `blob:`/`srcdoc` delivery and fail to strip author-shipped meta CSP, causing silent intersection with header-less delivery | MEDIUM — cross-repo concern, not SDK-side | SHELL-CONNECT-POLICY.md MUST include a "strip any incoming meta CSP before injecting shell's meta CSP" checklist item. Already implied by spec §Edge Case 1 but should be explicit in the checklist. |
| Authors rebuild with new `connect` origins and forget that aggregateHash flips → all storage re-scoped → appears as "data loss" | MEDIUM — not new to v0.29.0 (config schema changes already do this) | Document prominently in NUB-CONNECT spec §Content-Addressing Consequences + migration note. Mirrors NUB-CONFIG wording. |

---
*Stack research for: v0.29.0 NUB-CONNECT + Shell as CSP Authority*
*Researched: 2026-04-21*
