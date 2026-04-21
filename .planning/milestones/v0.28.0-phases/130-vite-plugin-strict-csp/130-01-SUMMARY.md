---
phase: 130-vite-plugin-strict-csp
plan: 01
subsystem: build-tooling
tags: [vite-plugin, csp, security, content-security-policy, browser-isolation, strict-csp, nonce, hand-rolled-regex]

# Dependency graph
requires:
  - phase: 125-core-type-surface
    provides: NappletGlobal['resource'] required slot (CAP-03 capability identifier `perm:strict-csp` lives shell-side; this plan only documents it via JSDoc)
provides:
  - "Nip5aManifestOptions.strictCsp?: boolean | StrictCspOptions field — opt-in strict CSP build-time enforcement"
  - "10-directive baseline CSP policy emitted via <meta http-equiv> as literal first <head> child (CSP-02/CSP-06)"
  - "Build-time hard-failure for header-only directives (frame-ancestors/sandbox/report-uri/report-to) in meta CSP (CSP-04 / Pitfall 2 mitigation)"
  - "Build-time hard-failure for 'unsafe-inline'/'unsafe-eval' tokens in script-src (CSP-07 / Pitfall 19 mitigation)"
  - "Build-time hard-failure for ws://wss:// dev relaxation leaking into production manifest (CSP-05 / Pitfall 18 mitigation)"
  - "Build-time hard-failure when CSP meta is not the literal first <head> child (CSP-03 / Pitfall 1 mitigation)"
  - "Per-build cryptographic nonce via crypto.randomBytes(16).toString('base64url') (128 bits entropy; W3C CSP3 minimum is 128 bits)"
  - "Dev/prod connect-src split: dev allows 'self' ws://localhost:* wss://localhost:* for Vite HMR; prod emits 'none'"
  - "JSDoc-only CAP-03 closure: strictCsp option documents shell.supports('perm:strict-csp') pairing"
  - "tsup.config.ts: src/csp.ts added as separate entry; dist/csp.js standalone-importable (test/verification surface)"
affects:
  - "Phase 131 (NIP-5D In-Repo Spec Amendment) — references the perm:strict-csp capability and the CSP enforcement model"
  - "Phase 132 (Cross-Repo Nubs PRs) — NUB-RESOURCE spec will document the CSP posture"
  - "Phase 133 (Documentation + Demo Coordination) — vite-plugin README needs strictCsp section"
  - "Phase 134 (Verification) — Playwright tests will need to verify CSP actually blocks fetches in browser"

# Tech tracking
tech-stack:
  added: []  # Zero new runtime dependencies — hand-rolled regex per STACK.md "What NOT to Use"
  patterns:
    - "Hand-rolled regex CSP builder + validator (zero deps, deterministic 10-directive grammar)"
    - "Vite transformIndexHtml object-form with order: 'pre' + injectTo: 'head-prepend' to land CSP meta as literal first <head> child"
    - "closeBundle post-build assertion on dist/index.html — load-bearing build-time gate independent of plugin-order interactions"
    - "Append-only StrictCspOptions.directives override contract (extend, not relax)"
    - "Build-time validators surface project-killer pitfalls as hard failures with prefixed [nip5a-manifest] diagnostics"

key-files:
  created:
    - "packages/vite-plugin/src/csp.ts (276 LOC) — CspBuilder helper, 4 validators, 2 constants, StrictCspOptions type"
  modified:
    - "packages/vite-plugin/src/index.ts (660 LOC, +144/-45 net) — strictCsp field, configResolved validation, transformIndexHtml object-form with order: 'pre', closeBundle assertions"
    - "packages/vite-plugin/tsup.config.ts — added src/csp.ts as second entry so dist/csp.js is standalone-importable"

key-decisions:
  - "Nonce algorithm: crypto.randomBytes(16).toString('base64url') chosen over crypto.randomUUID() — 128 bits of entropy matches W3C CSP3 § Nonce-source minimum exactly; base64url avoids quote-escaping in HTML attributes; randomBytes is portable to older Node runtimes if Vite ever drops Node 19+ requirement"
  - "tsup config: src/csp.ts added as separate entry — dist/csp.js becomes a standalone re-export shim around tsup's chunk-split csp implementation; enables Node-side validation scripts that import directly from dist/csp.js without going through dist/index.js"
  - "transformIndexHtml conversion to object form: required for both `order: 'pre'` (Pitfall 1 prevention — runs before Vite's HMR client injection) AND access to `ctx.server` for runtime dev/prod detection. The OBJECT form is now used regardless of strictCsp setting (back-compat preserved by absence of CSP meta in tag list, not by hook shape)"
  - "closeBundle assertion placement: moved to TOP of closeBundle() (before VITE_DEV_PRIVKEY_HEX gate) so strict CSP enforcement is INDEPENDENT of manifest signing — a napplet author may opt into strict CSP without configuring a manifest privkey, and the build-time gates MUST still fire"
  - "Header-only reject list scope: rejected on first violation (single clear diagnostic) rather than collected-then-thrown — author sees one problem at a time, faster iteration"
  - "Optional <meta charset> permitted before CSP meta in assertMetaIsFirstHeadChild — addresses CONTEXT.md 'Discretion to executor' question; <meta charset> is parser-only metadata that does not load resources or execute script, so it cannot defeat the CSP posture even when parsed before the CSP meta"

patterns-established:
  - "Pattern: project-killer mitigations as pure functions in a sibling module — testable in isolation, importable standalone, zero deps. Future security gates (e.g., subresource integrity assertions) should follow the same csp.ts shape."
  - "Pattern: hand-rolled HTML walker for build-time assertions — head-open regex + slice + leading-whitespace strip + optional-charset strip + first-element regex. Acceptable for narrow, deterministic checks; reach for parse5 if parsing nested arbitrary HTML."
  - "Pattern: append-only directive override contract — user supplies sources, plugin appends to baseline, never replaces. Forces 'extend' semantics and surfaces user errors (e.g. 'none' + 'self') as browser-side rejections rather than silent baseline drops."
  - "Pattern: independent enforcement of build gates from manifest signing — load-bearing security checks run regardless of optional features (privkey configuration, schema discovery, etc.)"

requirements-completed: [CSP-01, CSP-02, CSP-03, CSP-04, CSP-05, CSP-06, CSP-07, CAP-03]

# Metrics
duration: 8min 20s
completed: 2026-04-20
---

# Phase 130 Plan 01: Vite-Plugin Strict CSP Summary

**Strict 10-directive CSP enforcement in @napplet/vite-plugin with build-time hard-failure for all 4 project-killer pitfalls (Pitfalls 1, 2, 18, 19) — napplets opting in ship with a browser-enforced policy, and developer mistakes that would weaken the security posture cannot pass `pnpm build`.**

## Performance

- **Duration:** 8min 20s
- **Started:** 2026-04-20T19:18:23Z
- **Completed:** 2026-04-20T19:26:43Z
- **Tasks:** 3
- **Files created:** 1
- **Files modified:** 2

## Accomplishments

- Shipped the load-bearing security feature for v0.28.0: a strict-CSP build pipeline that converts ambient-trust ("napplets shouldn't fetch") into browser-enforced isolation ("napplets cannot fetch — the browser blocks it") via mechanically-impossible-to-misconfigure mitigations.
- All 4 project-killer pitfalls now fail the build with prefixed `[nip5a-manifest]` diagnostics:
  - **Pitfall 1** (CSP meta not first head child): `assertMetaIsFirstHeadChild` walks `dist/index.html` post-build with hand-rolled regex; throws `/CSP meta must be first <head> child/`.
  - **Pitfall 2** (header-only directives in meta CSP): `validateStrictCspOptions` independently rejects each of `frame-ancestors`/`sandbox`/`report-uri`/`report-to` at `configResolved` time with `/header-only directive .* not allowed in meta CSP/`.
  - **Pitfall 18** (dev `ws://` relaxation leaking to prod): `assertNoDevLeakage` extracts the policy string from `dist/index.html` post-build and throws `/dev relaxation leaked to production/` when prod manifests contain `ws://` or `wss://` in connect-src.
  - **Pitfall 19** (`'unsafe-inline'`/`'unsafe-eval'` in script-src): `validateStrictCspOptions` independently rejects each unsafe token at `configResolved` time with `/forbidden in script-src/`.
- 10-directive baseline policy locked in `BASELINE_DIRECTIVE_ORDER` and emitted in canonical order; `script-src` is always `'nonce-{nonce}' 'self'` with a fresh 128-bit nonce per build.
- Dev mode emits `connect-src 'self' ws://localhost:* wss://localhost:*` for Vite HMR; production emits `connect-src 'none'`. Build-time guard prevents the dev relaxation from ever appearing in a prod manifest.
- CAP-03 (`perm:strict-csp` capability) closed via JSDoc on the `strictCsp` field — capability identifier is shell-side, this plan only documents the pairing.
- Workspace stays green: `pnpm -r type-check` and `pnpm -r build` both exit 0 across all 14 packages — DEF-125-01 stays closed.
- Back-compat preserved: napplets that omit `strictCsp` ship byte-identical HTML (no CSP meta, no behavior change).
- Zero new runtime dependencies (per STACK.md "What NOT to Use" — `htmlparser2`/`parse5`/`csp-typed-directives` rejected; hand-rolled regex is the right tool for a 10-directive deterministic grammar with a 4-element reject list).

## Task Commits

Each task was committed atomically:

1. **Task 1: Create `packages/vite-plugin/src/csp.ts`** - `6df1f9c` (feat)
2. **Task 2: Wire `strictCsp` into `packages/vite-plugin/src/index.ts`** - `7af182e` (feat)
3. **Task 3: End-to-end smoke test (also includes Rule 1 bug fix)** - `ca76b69` (fix)

## Files Created/Modified

- **`packages/vite-plugin/src/csp.ts`** (276 LOC, NEW) — CspBuilder helper module. Exports: `HEADER_ONLY_DIRECTIVES`, `BASELINE_DIRECTIVE_ORDER`, `StrictCspOptions`, `buildBaselineCsp`, `validateStrictCspOptions`, `assertNoDevLeakage`, `assertMetaIsFirstHeadChild`. Zero runtime deps; module-header JSDoc traces every requirement ID and pitfall ID; section dividers per CONVENTIONS.md.
- **`packages/vite-plugin/src/index.ts`** (660 LOC, MODIFIED, +144/-45 net) — Three surgical zones:
  - **Zone A** (imports): added `import { buildBaselineCsp, validateStrictCspOptions, assertNoDevLeakage, assertMetaIsFirstHeadChild, type StrictCspOptions } from './csp.js';`
  - **Zone B** (`Nip5aManifestOptions` interface): added `strictCsp?: boolean | StrictCspOptions` field with full JSDoc covering CAP-03, all 4 pitfalls, dev/prod split, and the `perm:strict-csp` shell capability pairing.
  - **Zone C** (plugin body): added module-level `cspNonce`/`cspMode`/`strictCspOptions`/`strictCspEnabled` state; extended `configResolved` with fail-fast validation + nonce generation + dev/prod detection; converted `transformIndexHtml` from FUNCTION form to OBJECT form with `order: 'pre'` + `injectTo: 'head-prepend'` for CSP meta; moved strict-CSP `closeBundle` assertion to TOP of `closeBundle()` so it fires regardless of manifest-signing path.
- **`packages/vite-plugin/tsup.config.ts`** (10 LOC, MODIFIED, +1/-1) — `entry: ['src/index.ts', 'src/csp.ts']` so `dist/csp.js` is emitted as a standalone re-export shim importable by Node-side verification scripts.

## Decisions Made

- **Nonce algorithm: `crypto.randomBytes(16).toString('base64url')`.** 128 bits of entropy matches W3C CSP3 § Nonce-source minimum exactly. base64url avoids quote-escaping inside HTML attribute values. Considered `crypto.randomUUID()` (122 bits, also adequate) but `randomBytes` is portable across older Node versions if Vite ever drops the Node 19+ requirement; the plan suggested both, this picks the more conservative option.
- **tsup config: `src/csp.ts` added as a separate entry.** Without this, tsup chunk-splits csp.ts into a hashed chunk file (e.g. `dist/chunk-UWN2JOO7.js`) and the published API surface is only reachable via `dist/index.js` named exports. The Task 1 standalone Node validation script (`/tmp/csp-validate.mjs`) imports directly from `dist/csp.js`; without the second tsup entry, that import would fail. With the second entry, `dist/csp.js` becomes a small (~388-byte) re-export shim that pulls from the same chunk that `dist/index.js` uses — no code duplication, full standalone importability.
- **transformIndexHtml conversion to OBJECT form is unconditional.** The plan suggested guarding the conversion on `strictCsp`, but converting always (and only emitting the CSP meta tag conditionally inside the handler) is cleaner: the hook shape is uniform, back-compat is preserved by ABSENCE of the CSP meta in the returned tag list (not by hook shape), and the smoke test's back-compat case (Case 7) confirms HTML is byte-identical to pre-phase-130 when `strictCsp` is omitted.
- **strict-CSP closeBundle assertion placement: TOP of `closeBundle()` (before the `VITE_DEV_PRIVKEY_HEX` gate).** Critical correctness fix vs. the plan's literal placement: the existing `closeBundle()` has an early-return on `!privkeyHex` that would have skipped the strict-CSP assertion entirely. Moving the assertion to the top of the hook ensures strict CSP enforcement is independent of manifest signing — a napplet author opting into strict CSP without configuring a privkey still gets the build-time gates. Without this restructure, the smoke test (which does not set `VITE_DEV_PRIVKEY_HEX`) could never have fired the assertions.
- **Optional `<meta charset>` permitted before CSP meta** (CONTEXT.md "Discretion to executor: whether `<meta charset>` is permitted to precede" — answered YES). `<meta charset>` is parser-only metadata that does not load resources or execute script, so it cannot defeat the CSP posture even when parsed first. Common Vite templates emit `<meta charset>` as the first head child; rejecting it would force every napplet author to manually re-order their `<head>`. The `assertMetaIsFirstHeadChild` walker strips an optional `<meta charset>` before checking the first element.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] closeBundle CSP-extraction regex truncated value at first single quote**
- **Found during:** Task 3 (end-to-end smoke test), Case 3 (Pitfall 18 / CSP-05 dev-leak detection)
- **Issue:** The regex `/<meta\s+http-equiv\s*=\s*["']Content-Security-Policy["']\s+content\s*=\s*["']([^"']+)["']/i` used `[^"']` in the capture group, which truncated the captured CSP value at the first single quote inside the policy. Since CSP values legitimately contain single quotes (`'none'`, `'self'`, `'nonce-...'`), the captured value was always a tiny prefix (e.g. just `default-src `). With the truncated value, `assertNoDevLeakage` could never see the `ws://` tail, and case 3 (which appended `ws://localhost:5173` to prod connect-src) incorrectly passed.
- **Fix:** Pin the surrounding quote characters to double-quote (Vite always uses double quotes for attribute values when rendering tags from `IndexHtmlTransformResult` arrays) and accept any non-double-quote character inside the capture: `/<meta\s+http-equiv\s*=\s*"Content-Security-Policy"\s+content\s*=\s*"([^"]+)"/i`. Now embedded single quotes survive extraction and `assertNoDevLeakage` sees the full policy string.
- **Files modified:** `packages/vite-plugin/src/index.ts` (closeBundle regex)
- **Verification:** Smoke Case 3 now correctly throws `/dev relaxation leaked to production/`. All 7 smoke cases pass.
- **Committed in:** `ca76b69` (Task 3 commit)

**2. [Rule 3 - Blocking] Smoke test Case 1 regex assumed wrong head ordering**
- **Found during:** Task 3 (end-to-end smoke test), Case 1 (10-directive baseline emission)
- **Issue:** The smoke test's `drive()` helper does a naive `<head>` substitution via `.replace('<head>', '<head>' + headPrepend.map(renderTag) + headAppend.map(renderTag))` which puts injected tags AFTER the `<head>` opening tag and BEFORE the template's existing children — so the actual ordering becomes CSP-meta, aggregate-hash, napplet-type, then template's `<meta charset>` (which was originally first in `<head>`). The plan's case-1 regex `/<head><meta charset="utf-8"><meta http-equiv=...` assumed Vite-style merging where head-prepend lands AFTER existing static head children. Both orderings are valid for `assertMetaIsFirstHeadChild` (CSP meta IS first child in the smoke's emitted HTML), so this is purely a smoke-fixture issue.
- **Fix:** Updated the case-1 regex to `/<head><meta http-equiv="Content-Security-Policy"/` (CSP meta first, charset elsewhere) — matches the smoke's actual rendering. This is a Phase-127-style smoke-test scaffolding deviation: source code unchanged, fix lives in `/tmp` test only and was cleaned up post-pass.
- **Files modified:** `/tmp/napplet-csp-smoke/run.mjs` (smoke fixture only — DELETED after pass)
- **Verification:** Smoke Case 1 now passes. The load-bearing assertion (`assertMetaIsFirstHeadChild` in `closeBundle`) was always correct — the smoke's regex was the issue.
- **Committed in:** N/A (smoke fixture not in source tree per AGENTS.md no-pollution rule)

---

**Total deviations:** 2 (1 source-code Rule 1 bug fix, 1 smoke-fixture Rule 3 scaffolding fix)
**Impact on plan:** Both fixes were necessary for correctness. The Rule 1 bug fix to the CSP-extraction regex would have allowed dev relaxations to silently leak into prod manifests — without the smoke test catching it, this project-killer mitigation (CSP-05 / Pitfall 18) would have shipped non-functional. The Rule 3 smoke-fixture fix was purely a test scaffolding issue with no source impact. No scope creep.

## Issues Encountered

None beyond the deviations above. The plan was thorough and the executor followed it surgically. The Rule 1 bug was caught precisely because Phase 130 was scoped to include a 7-case smoke test as a load-bearing acceptance criterion (Task 3) — without that smoke test, the bug would have shipped silently and a future Playwright test in Phase 134 would have been the next chance to catch it.

## Verification Proof

**Plugin-local green:**
- `pnpm --filter @napplet/vite-plugin type-check` exits 0
- `pnpm --filter @napplet/vite-plugin build` exits 0 (`dist/index.js` 12.80 KB, `dist/csp.js` 388 B re-export shim, `dist/chunk-UWN2JOO7.js` 3.68 KB)

**Workspace-wide green (DEF-125-01 stays closed across all 14 packages):**
- `pnpm -r type-check` exits 0
- `pnpm -r build` exits 0

**Smoke test (7/7 cases pass):**
```
[nip5a-manifest] smoke: strict CSP enabled (mode: prod)
[nip5a-manifest] smoke: strict CSP verified (meta-first + no-dev-leak)
[nip5a-manifest] VITE_DEV_PRIVKEY_HEX not set — skipping manifest generation
CASE-1-POSITIVE-OK
CASE-2-NEGATIVE-HEADER-ONLY-OK (4/4 directives rejected independently)
CASE-3-NEGATIVE-DEV-LEAK-OK
CASE-4-NEGATIVE-PITFALL-1-OK
CASE-5-NEGATIVE-UNSAFE-SCRIPT-SRC-OK (2/2 unsafe tokens rejected)
CASE-6-POSITIVE-DEV-HMR-OK
CASE-7-POSITIVE-BACK-COMPAT-OK
SMOKE-OK: all 7 cases passed (4 positive + 3 negative)
```

**Requirement traceability** (every CSP-XX and CAP-03 ID grep-resolves to ≥1 source location in `packages/vite-plugin/src/`):
- CSP-01: 2 occurrences
- CSP-02: 1
- CSP-03: 3
- CSP-04: 5
- CSP-05: 5
- CSP-06: 2
- CSP-07: 6
- CAP-03: 3

**Zero new runtime deps:** `packages/vite-plugin/package.json` `dependencies` block unchanged (`{ "nostr-tools": "^2.23.3" }` only).

**Back-compat smoke:** `nip5aManifest({ nappletType: 'test' })` returns `OBJECT-FORM` for `transformIndexHtml` (back-compat verified by absence of CSP meta in tag output, not by hook shape).

**Fixture cleanup:** `/tmp/napplet-csp-smoke/` removed post-pass per AGENTS.md no-pollution rule (`test ! -d /tmp/napplet-csp-smoke` exits 0).

## User Setup Required

None — strict CSP is opt-in per napplet via `nip5aManifest({ nappletType, strictCsp: true })` in `vite.config.ts`. Napplet authors who want strict CSP add the option; everyone else sees zero behavior change. No env vars, no external services, no manual config required.

## Next Phase Readiness

- Phase 130 ready for verification (`/gsd:verify-phase 130`)
- Phase 131 (NIP-5D In-Repo Spec Amendment) is unblocked: the `perm:strict-csp` capability identifier and the strict-CSP enforcement model are now ready to be referenced from the spec text.
- Phase 132 (Cross-Repo Nubs PRs) — NUB-RESOURCE spec PR can now reference the CSP posture; this plan documents the JSDoc-level CAP-03 closure.
- Phase 133 (Documentation + Demo Coordination) — vite-plugin README needs a `strictCsp` section showing the 10-directive baseline, the StrictCspOptions API, and the 4 project-killer mitigations.
- Phase 134 (Verification) — Playwright tests will need to verify the emitted CSP actually blocks fetches in a real browser; the build-time gates from this plan are necessary but not sufficient for end-to-end browser-enforcement proof.
- DEF-125-01 stays CLOSED — workspace-wide `pnpm -r type-check` green across all 14 packages.

---
*Phase: 130-vite-plugin-strict-csp*
*Completed: 2026-04-20*

## Self-Check: PASSED

- Files created: `packages/vite-plugin/src/csp.ts` ✓
- Files modified: `packages/vite-plugin/src/index.ts`, `packages/vite-plugin/tsup.config.ts` ✓
- SUMMARY.md created: `.planning/phases/130-vite-plugin-strict-csp/130-01-SUMMARY.md` ✓
- Smoke fixture cleaned up: `/tmp/napplet-csp-smoke/` removed ✓
- All 3 task commits exist: `6df1f9c` (Task 1), `7af182e` (Task 2), `ca76b69` (Task 3) ✓
