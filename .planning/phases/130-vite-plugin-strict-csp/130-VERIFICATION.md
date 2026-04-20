---
phase: 130-vite-plugin-strict-csp
verified: 2026-04-20T20:00:00Z
status: passed
score: 11/11 must-haves verified
re_verification: false
---

# Phase 130: Vite-Plugin Strict CSP Verification Report

**Phase Goal:** Napplets developed with `@napplet/vite-plugin` ship under a 10-directive strict CSP baseline that survives meta placement, blocks header-only directive misuse, separates dev (HMR-relaxed) from prod (`connect-src 'none'`), and never permits `'unsafe-inline'` or `'unsafe-eval'` for scripts.
**Verified:** 2026-04-20T20:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | `Nip5aManifestOptions.strictCsp?: boolean | StrictCspOptions` exists; activates 10-directive baseline (CSP-01) | VERIFIED | `index.ts` line 89: `strictCsp?: boolean | StrictCspOptions`; `csp.ts` exports `buildBaselineCsp` with canonical 10-directive baseline |
| 2  | CSP meta injected as literal first `<head>` child via `injectTo: 'head-prepend'` + `order: 'pre'` (CSP-02, Pitfall 1 mitigation) | VERIFIED | `index.ts` line 442-465: `transformIndexHtml: { order: 'pre', handler(...) { ... injectTo: 'head-prepend' } }` |
| 3  | Build fails with `/CSP meta must be first <head> child/` when first head child is not CSP meta (CSP-03, Pitfall 1) | VERIFIED | `csp.ts` line 272-274: `assertMetaIsFirstHeadChild` throws exact diagnostic; called from `closeBundle` at line 522 before manifest-signing gate |
| 4  | Build fails with `/header-only directive .* not allowed in meta CSP/` for frame-ancestors, sandbox, report-uri, report-to (CSP-04, Pitfall 2) | VERIFIED | `csp.ts` lines 41-46 and 185-189: `HEADER_ONLY_DIRECTIVES` constant + `validateStrictCspOptions` throws on each; called from `configResolved` at line 431 |
| 5  | Production CSP contains `connect-src 'none'`; build fails with `/dev relaxation leaked to production/` if ws:// appears in prod policy (CSP-05, Pitfall 18) | VERIFIED | `csp.ts` line 138: prod branch `'none'`; `assertNoDevLeakage` at line 218-225 uses regex `/\b(?:ws|wss):\/\//i`; called from `closeBundle` line 532 with double-quote-pinned regex fix |
| 6  | Dev mode emits `connect-src 'self' ws://localhost:* wss://localhost:*` (CSP-05, Vite HMR) | VERIFIED | `csp.ts` line 138: `"'self' ws://localhost:* wss://localhost:*"` when `mode === 'dev'` |
| 7  | Default 10-directive baseline emitted in canonical order (CSP-06) | VERIFIED | `csp.ts` lines 53-64: `BASELINE_DIRECTIVE_ORDER` with exactly 10 directives in specified order; `buildBaselineCsp` iterates over this constant |
| 8  | `script-src` never `'unsafe-inline'` or `'unsafe-eval'`; build fails if user attempts to add either (CSP-07, Pitfall 19) | VERIFIED | `csp.ts` lines 192-200: `validateStrictCspOptions` checks `script-src` values and throws `forbidden in script-src`; baseline `buildBaselineCsp` never includes unsafe tokens |
| 9  | Each build emits a fresh 128-bit nonce via `crypto.randomBytes(16).toString('base64url')`; appears in `script-src` as `'nonce-{value}'` (Pitfall 19 mitigation) | VERIFIED | `index.ts` line 437: `crypto.randomBytes(16).toString('base64url')`; `csp.ts` line 137: `'nonce-${nonce}' 'self'` |
| 10 | JSDoc on `strictCsp` documents `shell.supports('perm:strict-csp')` pairing; CAP-03 closure is JSDoc-only with no runtime code | VERIFIED | `index.ts` line 80: `Pairs with shells advertising \`shell.supports('perm:strict-csp')\` (CAP-03)`; `csp.ts` lines 22-25 and 71-74: matching JSDoc; no runtime `supports()` code added |
| 11 | `pnpm --filter @napplet/vite-plugin build` exits 0; `pnpm -r type-check` exits 0 (workspace stays green) | VERIFIED | `dist/` contains `index.js`, `csp.js` (388 B re-export shim), `chunk-UWN2JOO7.js`; `pnpm -r type-check` produced zero errors across all packages |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/vite-plugin/src/csp.ts` | CspBuilder helper: `buildBaselineCsp`, `validateStrictCspOptions`, `assertNoDevLeakage`, `assertMetaIsFirstHeadChild`; 120+ lines | VERIFIED | 276 lines; exports all 4 functions plus `HEADER_ONLY_DIRECTIVES`, `BASELINE_DIRECTIVE_ORDER`, `StrictCspOptions`; zero runtime deps |
| `packages/vite-plugin/src/index.ts` | Extended `Nip5aManifestOptions` with `strictCsp?:`; `transformIndexHtml` object-form with `enforce: 'pre'`; `closeBundle` assertions; CAP-03 JSDoc; 600+ lines | VERIFIED | 660 lines; `strictCsp?: boolean | StrictCspOptions` at line 89; object-form hook at line 442; closeBundle assertions at lines 520-535 |
| `packages/vite-plugin/tsup.config.ts` | `src/csp.ts` as second entry so `dist/csp.js` is standalone-importable | VERIFIED | Line 4: `entry: ['src/index.ts', 'src/csp.ts']`; `dist/csp.js` exists (388 B, re-exports all 6 symbols from chunk) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `index.ts` imports | `csp.ts` | `import { buildBaselineCsp, validateStrictCspOptions, assertNoDevLeakage, assertMetaIsFirstHeadChild, type StrictCspOptions } from './csp.js'` | WIRED | Lines 19-25 of `index.ts`; all 4 functions imported and used |
| `transformIndexHtml` hook | Vite plugin pipeline | Object form with `order: 'pre'` + `injectTo: 'head-prepend'` | WIRED | Line 442-464; `order: 'pre' as const` sets priority; CSP meta tag uses `'head-prepend'` |
| `closeBundle` assertion | `dist/index.html` | `fs.readFileSync(indexPath)` then `assertMetaIsFirstHeadChild` + `assertNoDevLeakage` | WIRED | Lines 519-535; reads file with `existsSync` guard; extracts policy with double-quote-pinned regex; calls both assert functions |
| `configResolved` | `validateStrictCspOptions` | Called early before any HTML emission | WIRED | Line 431: `validateStrictCspOptions(strictCspOptions)` inside `if (strictCspEnabled)` block |

### Data-Flow Trace (Level 4)

Not applicable — this phase produces build tooling (a Vite plugin), not a component that renders dynamic data. The "data flow" here is: user option (`strictCsp`) → `configResolved` validation → nonce generation → `transformIndexHtml` CSP meta injection → `closeBundle` post-build assertion on `dist/index.html`. All nodes in this chain were verified in the key link check above.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `dist/csp.js` exports all required symbols | `cat /dist/csp.js` | Re-export shim exposes: `BASELINE_DIRECTIVE_ORDER`, `HEADER_ONLY_DIRECTIVES`, `assertMetaIsFirstHeadChild`, `assertNoDevLeakage`, `buildBaselineCsp`, `validateStrictCspOptions` | PASS |
| `pnpm -r type-check` produces zero errors | Command run | Zero error lines in output | PASS |
| `tsup.config.ts` has `src/csp.ts` as second entry | File inspection | `entry: ['src/index.ts', 'src/csp.ts']` at line 4 | PASS |
| `assertNoDevLeakage` signature matches call site | Grep cross-check | Signature `(emittedPolicy: string, mode: 'dev' | 'prod')` matches call `assertNoDevLeakage(cspMatch[1], cspMode)` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CSP-01 | 130-01-PLAN.md | `strictCsp?: boolean | StrictCspOptions` field on `Nip5aManifestOptions` | SATISFIED | `index.ts` line 89; marked `[x]` in REQUIREMENTS.md |
| CSP-02 | 130-01-PLAN.md | CSP meta injected as first `<head>` child via `enforce: 'pre'` hook | SATISFIED | `index.ts` lines 442-465: `order: 'pre'` + `injectTo: 'head-prepend'` |
| CSP-03 | 130-01-PLAN.md | Build fails with clear diagnostic when CSP meta not first | SATISFIED | `assertMetaIsFirstHeadChild` in `csp.ts` and called from `closeBundle` |
| CSP-04 | 130-01-PLAN.md | Build rejects header-only directives (`frame-ancestors`, `sandbox`, `report-uri`, `report-to`) from meta CSP | SATISFIED | `HEADER_ONLY_DIRECTIVES` constant and `validateStrictCspOptions` guard |
| CSP-05 | 130-01-PLAN.md | Dev/prod split for `connect-src`; build fails if dev ws:// leaks to prod | SATISFIED | `buildBaselineCsp` mode branching + `assertNoDevLeakage` with corrected regex |
| CSP-06 | 130-01-PLAN.md | 10-directive baseline in canonical order | SATISFIED | `BASELINE_DIRECTIVE_ORDER` (10 entries) + `buildBaselineCsp` iterates it |
| CSP-07 | 130-01-PLAN.md | Nonce-based `script-src`; never `unsafe-inline` or `unsafe-eval` | SATISFIED | Baseline never includes unsafe tokens; `validateStrictCspOptions` rejects them |
| CAP-03 | 130-01-PLAN.md | `perm:strict-csp` documented in JSDoc only; no runtime code | SATISFIED | JSDoc on `strictCsp` field in `index.ts` and module header in `csp.ts`; zero runtime `supports()` code |

### Anti-Patterns Found

No anti-patterns found in the three key files (`csp.ts`, `index.ts`, `tsup.config.ts`):
- No TODO / FIXME / PLACEHOLDER comments in `csp.ts`
- No `return null` / empty stub returns in either source file
- No hardcoded empty data arrays passed to rendering surfaces
- All validators actively throw (not no-op stubs)
- The Rule 1 bug (regex truncating CSP value at first single quote) was caught during smoke testing and fixed in commit `ca76b69` — the corrected regex `[^"]+` is present in `closeBundle` at line 530

### Human Verification Required

None required for automated checks. The following is flagged as optional end-to-end validation that is outside the scope of this build-time phase:

1. **Browser enforcement test**
   - **Test:** Build a napplet with `strictCsp: true`, serve it in a real browser, attempt a `fetch()` from within the napplet iframe, observe the browser blocking it with a CSP violation.
   - **Expected:** Browser console shows CSP violation; network tab shows blocked request.
   - **Why human:** Requires a running browser session; build-time gates confirm the policy is emitted correctly but cannot confirm the browser actually enforces it end-to-end. (Phase 134 Playwright tests will cover this.)

### Gaps Summary

No gaps. All 11 must-have truths are verified. The four project-killer mitigations (Pitfalls 1, 2, 18, 19) are implemented as active throw-on-violation functions, wired into the correct Vite hook lifecycle positions, and confirmed by zero type errors across the workspace. The dist artifacts match the declared shape. Phase 130 goal is fully achieved.

---

_Verified: 2026-04-20T20:00:00Z_
_Verifier: Claude (gsd-verifier)_
