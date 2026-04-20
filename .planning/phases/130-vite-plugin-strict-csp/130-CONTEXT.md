# Phase 130: Vite-Plugin Strict CSP - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning
**Mode:** Auto-generated (vite-plugin extension — discuss skipped; all defaults locked from research)

<domain>
## Phase Boundary

Add strict CSP enforcement to `@napplet/vite-plugin` so napplets ship under a 10-directive baseline that the browser actually enforces:

1. New `strictCsp?: boolean | StrictCspOptions` option on `Nip5aManifestOptions`
2. `transformIndexHtml` hook with `enforce: 'pre'` — injects `<meta http-equiv="Content-Security-Policy">` as the LITERAL FIRST CHILD of `<head>`
3. Build-time assertion: CSP meta is the first `<head>` child; build fails with clear diagnostic if any element precedes it (mitigates Pitfall 1 — project-killer)
4. Build-time rejection of header-only directives in meta CSP: `frame-ancestors`, `sandbox`, `report-uri`, `report-to` (mitigates Pitfall 2 — project-killer)
5. Dev/build mode split: dev allows `connect-src 'self' ws://localhost:* wss://localhost:*` for HMR; build emits `connect-src 'none'`. Build-time assertion that dev relaxations don't leak into prod manifest (mitigates Pitfall 18)
6. Default 10-directive baseline policy (default-src 'none', script-src 'nonce-...' 'self', connect-src 'none', img-src blob: data:, font-src blob: data:, style-src 'self', worker-src 'none', object-src 'none', base-uri 'none', form-action 'none')
7. Nonce-based `script-src` for any inline scripts; never `'unsafe-inline'`, never `'unsafe-eval'`
8. New capability advertisement: shells implementing this policy advertise `shell.supports('perm:strict-csp')` (this is documentation/JSDoc only — vite-plugin doesn't run in the shell)

NO shell-side code (this is the napplet-side build tool). NO sidecar policy. NO documentation sweep (Phase 133).

</domain>

<decisions>
## Implementation Decisions

### CSP Baseline Policy (LOCKED — from research SUMMARY.md)

10 directives, exact strings:

```
default-src 'none';
script-src 'nonce-{NONCE}' 'self';
connect-src 'none';            -- dev: 'self' ws://localhost:* wss://localhost:*
img-src blob: data:;
font-src blob: data:;
style-src 'self';
worker-src 'none';
object-src 'none';
base-uri 'none';
form-action 'none';
```

### Header-Only Directive Reject List (LOCKED — from Pitfall 2)

Build MUST fail if any of these appear in user-supplied CSP overrides for meta delivery:
- `frame-ancestors`
- `sandbox`
- `report-uri`
- `report-to`

### Meta Placement (LOCKED — from Pitfall 1)

The `<meta http-equiv="Content-Security-Policy">` element MUST be the literal first child of `<head>`. The vite-plugin's `transformIndexHtml` MUST use `enforce: 'pre'` so its hook runs BEFORE Vite's HMR client injection. After the transform, a post-build assertion walks the DOM (or HTML AST) and fails if any `<script>`, `<style>`, `<link>`, or `<meta>` (other than `<meta charset>`?) precedes the CSP meta. Discretion to executor: whether `<meta charset>` is permitted to precede.

### Dev/Prod Split (LOCKED — from Pitfall 18)

- Dev mode: emit CSP with `connect-src 'self' ws://localhost:* wss://localhost:*` to allow Vite HMR websocket
- Production build: emit CSP with `connect-src 'none'`
- Build-time assertion: scan emitted prod manifest for any `ws://` or `wss://` in `connect-src` and fail the build if found (prevents dev-relaxation leak to prod)

### Capability Surface

`shell.supports('perm:strict-csp')` is a SHELL-side capability advertisement, not a napplet-side or vite-plugin-side concern. The vite-plugin does NOT need code for this — only documentation in JSDoc / README that THIS option, when enabled by the napplet author, complements a shell that advertises `perm:strict-csp`. CAP-03 closure is JSDoc-only.

### Worker-src Default

`'none'` — napplets needing Web Workers opt in via manifest extension (deferred to future milestone). Document in vite-plugin baseline.

### Claude's Discretion

- HTML walker library: hand-rolled regex vs `htmlparser2`/`parse5` (no new runtime deps preferred per STACK.md; hand-rolled with `<head>` boundary detection is fine)
- Nonce generation algorithm (recommend `crypto.randomUUID()` or `crypto.getRandomValues()` base64)
- Exact `StrictCspOptions` shape (whether to allow per-directive overrides, custom nonce, etc.) — ship minimal v1, expand later
- Test fixtures: a smoke test that builds a sample napplet with `strictCsp: true` and asserts the emitted HTML contains the policy meta as first head child

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/vite-plugin/src/index.ts` — current plugin source (~559 lines per research); already has `Nip5aManifestOptions` interface to extend
- Vite's `transformIndexHtml` hook documented; `enforce: 'pre'` is a vite-plugin-api primitive

### Established Patterns

- ESM-only, no new runtime deps preferred (per STACK.md research)
- vite-plugin currently injects `<meta name="napplet-aggregate-hash">` and `<meta name="napplet-config-schema">` — extend with the same mechanism

### Integration Points

- After this phase: napplets built with `strictCsp: true` ship with browser-enforced CSP
- Phase 131 (NIP-5D amendment) documents the `perm:strict-csp` capability that pairs with this
- Phase 134 (verification) will Playwright-test that CSP actually blocks fetches

</code_context>

<specifics>
## Specific Ideas

Plan should fit in 1 plan with 3-5 tasks:
- Task 1: extend `Nip5aManifestOptions` with `strictCsp?: boolean | StrictCspOptions` type
- Task 2: implement `CspBuilder` helper (compute baseline, apply user overrides, validate header-only-directive reject list)
- Task 3: wire `transformIndexHtml` hook with `enforce: 'pre'`, dev/prod mode detection, nonce generation, meta injection
- Task 4: build-time assertions (first-head-child, no header-only directives, no dev-leakage to prod)
- Task 5: smoke test (sample napplet build → assert HTML structure)

Critical acceptance criteria (project-killer mitigation):
- Build of a sample HTML where `<script>` precedes the CSP meta location → build FAILS with clear diagnostic
- Build of a config containing `frame-ancestors` in meta → build FAILS
- Build with `mode: production` containing `ws://` → build FAILS
- Successful build emits HTML where regex `^<head>\s*<meta http-equiv="Content-Security-Policy"` matches

</specifics>

<deferred>
## Deferred Ideas

- **Worker opt-in via manifest** — not in v0.28.0; document `worker-src 'none'` baseline only
- **Per-napplet CSP overrides** — minimal v1; future milestone may add per-napplet relaxations
- **CSP report-uri / report-to** — not in meta delivery (header-only); document for shell-side delivery only
- **Trusted Types** — defer; can be added without breaking the baseline

</deferred>
