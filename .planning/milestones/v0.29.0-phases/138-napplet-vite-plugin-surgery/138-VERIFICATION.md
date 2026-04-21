---
phase: 138-napplet-vite-plugin-surgery
verified: 2026-04-21T00:00:00Z
status: passed
score: 6/6 must-haves verified
---

# Phase 138: @napplet/vite-plugin Surgery Verification Report

**Phase Goal:** The vite-plugin stops emitting production strict CSP and starts emitting `connect` manifest tags, folding origins into aggregateHash, and failing loud on inline scripts.
**Verified:** 2026-04-21
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (derived from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
| - | ----- | ------ | -------- |
| 1 | Production builds no longer emit `<meta http-equiv="Content-Security-Policy">` — strictCsp machinery fully removed | VERIFIED | `grep "Content-Security-Policy" packages/vite-plugin/src/index.ts` returns 0; `csp.ts` does not exist; strictCsp retained as `@deprecated strictCsp?: unknown` + one-shot `console.warn` in `configResolved` |
| 2 | `Nip5aManifestOptions` accepts `connect?: string[]` with shared normalizer validation throwing `[nip5a-manifest]`-prefixed on violations | VERIFIED | `connect?: string[]` at index.ts:120; `normalizeConnectOrigin` value-import from `@napplet/nub/connect/types` at index.ts:19; per-origin try/catch chains diagnostic as `[nip5a-manifest] invalid connect origin: ${msg}` at index.ts:618-621 |
| 3 | Manifest emits one `['connect', origin]` tag per origin between `manifestXTags` and `configTags`; aggregateHash includes synthetic `[hash, 'connect:origins']` xTag filtered out of `['x', …]` projection | VERIFIED | `connectTags` declared at index.ts:797; spread into `manifest.tags` between `manifestXTags` and `configTags` at index.ts:816; fold at index.ts:763-768 pushes `[originsHash, 'connect:origins']` into xTags before `computeAggregateHash`; filter `!SYNTHETIC_XTAG_PATHS.has(p)` at index.ts:788 excludes it from projection |
| 4 | Synthetic xTag filter driven by shared `SYNTHETIC_XTAG_PATHS` constant covering both `config:schema` and `connect:origins` | VERIFIED | `export const SYNTHETIC_XTAG_PATHS: ReadonlySet<string>` at index.ts:31-34 contains both entries; filter at index.ts:788 uses the registry |
| 5 | `closeBundle` fails the build when `dist/index.html` contains any `<script>` without `src`, with diagnostic referencing shell-CSP `script-src 'self'` | VERIFIED | `assertNoInlineScripts()` at index.ts:430-479 with zero-dep regex, comment stripping, allow-list for `application/json`/`application/ld+json`/`importmap`/`speculationrules`; call site at index.ts:701-705 in closeBundle BEFORE privkey check; throw message at index.ts:475-477 references `script-src 'self'` |
| 6 | Declaring `http:`/`ws:` origin emits informational console.warn on mixed-content; dev-mode-only `<meta name="napplet-connect-requires">` distinct from `napplet-connect-granted` | VERIFIED | Cleartext filter + console.warn at index.ts:626-633; dev-mode meta at index.ts:677-686 gated on `isDev && normalizedConnect.length > 0`; `grep "napplet-connect-granted"` returns 0 (plugin never emits the shell-authoritative name) |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `packages/vite-plugin/src/csp.ts` | Must NOT exist | VERIFIED (absent) | `test -f` returns exit 1 — file deleted in commit 8655f9e |
| `packages/vite-plugin/src/index.ts` | CSP machinery removed; connect option + normalizer + fold + registry + manifest tags + inline-script diagnostic + cleartext warn + dev meta + module-load self-check | VERIFIED | 874 LOC; all 12 banned CSP identifiers return 0; all 22 additive markers present; preserved non-CSP surfaces intact |
| `packages/vite-plugin/package.json` | Lists `@napplet/nub: workspace:*` as devDependency | VERIFIED | Line 29 in devDependencies block |
| `packages/vite-plugin/tsup.config.ts` | Entry reduced to `['src/index.ts']` only | VERIFIED | Line 4: `entry: ['src/index.ts']`; no csp.ts reference |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `packages/vite-plugin/src/index.ts` | `packages/nub/src/connect/types.ts` | `import { normalizeConnectOrigin } from '@napplet/nub/connect/types'` | WIRED | Value import at line 19; invoked at line 618 inside `configResolved` |
| `configResolved` (options.connect) | `normalizedConnect` closure state | Array.isArray guard + for-of normalization + try/catch re-throw | WIRED | Lines 609-624; normalized array assigned to outer closure var for downstream use |
| `closeBundle` fold | `aggregateHash` input xTags | `xTags.push([originsHash, 'connect:origins'])` before `computeAggregateHash` | WIRED | Lines 763-768 — push happens at line 767 before `computeAggregateHash(xTags)` at line 772 |
| `closeBundle` manifest assembly | signed event.tags | `...connectTags` spread between `manifestXTags` and `configTags` | WIRED | Line 816 in manifest.tags array; used downstream by finalizeEvent at line 832-837 via manifest.tags reference |
| `closeBundle` projection filter | x-tag emission | `!SYNTHETIC_XTAG_PATHS.has(p)` filter before `.map([hash, p] => ['x', hash, p])` | WIRED | Line 788 |
| Module-load | Spec fixture hash | `assertConnectFoldMatchesSpecFixture()` bare call at module scope re-invokes fold and compares to `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742` | WIRED | Function at lines 502-534; bare call at line 538; verified fires (throws) on drift via the pre-committed perturbation experiment documented in 138-03-SUMMARY |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `normalizedConnect` closure state | origin strings | `options.connect` → `normalizeConnectOrigin()` per-origin in `configResolved` | Yes — validated origins flow to both fold (sorted) and manifest (author-order) | FLOWING |
| aggregateHash fold | `sortedOrigins` → `canonical` → `originsHash` | `[...normalizedConnect].sort().join('\n')` → SHA-256 via `crypto.createHash('sha256').update(canonical, 'utf8').digest('hex')` | Yes — real SHA-256 digest fed to `xTags.push([originsHash, 'connect:origins'])` before `computeAggregateHash` | FLOWING |
| connectTags | `['connect', origin]` array | `normalizedConnect.map((origin) => ['connect', origin])` | Yes — real origin strings from closure state spread into `manifest.tags` | FLOWING |
| Self-check | actual vs EXPECTED hash | Re-runs fold on fixture; compares to spec constant | Yes — perturbation experiment in 138-03 confirmed drift triggers FATAL throw | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| vite-plugin build | `pnpm --filter @napplet/vite-plugin build` | exit 0; ESM 19.74 KB, DTS 6.49 KB | PASS |
| vite-plugin type-check | `pnpm --filter @napplet/vite-plugin type-check` | exit 0; `tsc --noEmit` clean | PASS |
| Module-load self-check fires | `node -e "import('./packages/vite-plugin/dist/index.js')..."` | exit 0; exports `SYNTHETIC_XTAG_PATHS,nip5aManifest`; no FATAL throw (fold matches spec) | PASS |
| Self-check fires on drift | (pre-committed experiment in 138-03-SUMMARY) | Documented: perturbing `.join('\n')` → `.join(',')` yields FATAL throw at import with actual `fdcf761...` vs expected `cc7c1b...` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| VITE-01 | 138-01 | Remove production-path strict-CSP machinery; delete csp.ts | SATISFIED | `csp.ts` absent; all 12 banned CSP identifiers return 0 in index.ts |
| VITE-02 | 138-01 | `strictCsp` removed OR retained as `@deprecated` accept-but-warn | SATISFIED | `strictCsp?: unknown` + `@deprecated` JSDoc at index.ts:74; once-per-build `console.warn` at index.ts:590-594 |
| VITE-03 | 138-02 | Add `connect?: string[]` option to `Nip5aManifestOptions` | SATISFIED | Line 120; full JSDoc lines 76-119 |
| VITE-04 | 138-02 | Origin normalization via `normalizeConnectOrigin()`; throw with `[nip5a-manifest]` prefix | SATISFIED | Value-import line 19; invoked line 618; re-throw with `[nip5a-manifest] invalid connect origin:` prefix line 621 |
| VITE-05 | 138-02 | One `['connect', origin]` tag per origin between `manifestXTags` and `configTags` | SATISFIED | connectTags at line 797; spread at line 816 between manifestXTags (line 815) and configTags (line 817) |
| VITE-06 | 138-02 | Fold origins into `aggregateHash` via synthetic `[hash, 'connect:origins']` xTag; filter from `['x', …]` projection | SATISFIED | Fold lines 763-768; filter `!SYNTHETIC_XTAG_PATHS.has(p)` line 788 |
| VITE-07 | 138-02 | `SYNTHETIC_XTAG_PATHS` registry covering `config:schema` + `connect:origins` | SATISFIED | Exported `ReadonlySet<string>` lines 31-34 |
| VITE-08 | 138-02 | Fail-loud inline-script diagnostic scanning `dist/index.html` | SATISFIED | `assertNoInlineScripts` at lines 430-479 with spec-referencing throw message; call site line 701-705 BEFORE privkey check |
| VITE-09 | 138-02 | Cleartext `http:`/`ws:` warning explaining mixed-content rules | SATISFIED | Cleartext filter + `console.warn` at lines 626-633 |
| VITE-10 | 138-02 | Dev-mode-only `<meta name="napplet-connect-requires">` distinct from shell-authoritative `napplet-connect-granted` | SATISFIED | Dev-meta block lines 677-686 gated on `isDev && normalizedConnect.length > 0`; `grep "napplet-connect-granted"` returns 0 |

All 10 VITE-XX REQ-IDs marked `[x]` in `.planning/REQUIREMENTS.md` lines 52-61 and marked Complete in the traceability table at lines 184-193.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| (none) | - | - | - | No stubs, placeholders, TODOs, or disconnected props in the modified vite-plugin surface. Each implementation is real (value-imported normalizer, actual SHA-256 fold, real regex scan, real console.warn). The module-load self-check is a genuine runtime guardrail (confirmed by perturbation experiment in 138-03-SUMMARY). |

### Human Verification Required

None. All checks automatable and passed.

### Gaps Summary

None. All 6 Success Criteria satisfied, all 10 VITE-XX requirements complete, build + type-check green, fold conformance guardrail in place.

### Notes

- **Out-of-scope pre-existing failure:** `pnpm -r type-check` fails at `@napplet/shim` with TS2741 (`Property 'connect' is missing in type … NappletGlobal`). This is caused by Phase 136-01 commit `b8f214e` which added `connect: NappletConnect` as a required field on `NappletGlobal` without updating the shim's `window.napplet` literal. Scheduled for Phase 139 (SHIM-01/SHIM-02). Not a Phase 138 gap — `files_modified` for Phase 138 plans are scoped to `packages/vite-plugin/**`. See `.planning/phases/138-napplet-vite-plugin-surgery/deferred-items.md`.
- **Documented Rule-1 deviations in 138-03-SUMMARY:** Task 1 code pre-landed in commit `d06c293` (bundled with 138-02 Task 4 from an aborted prior attempt); `cc7c1b1…` grep count is 2 not 1 (self-check constant + docs-comment co-location); "build fails" framing adjusted to "module-import fails" based on perturbation-experiment evidence. None affect goal achievement.

---

_Verified: 2026-04-21_
_Verifier: Claude (gsd-verifier)_
