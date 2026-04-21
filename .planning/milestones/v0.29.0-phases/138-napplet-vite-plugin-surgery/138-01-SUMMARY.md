---
phase: 138-napplet-vite-plugin-surgery
plan: 01
subsystem: build-tooling

tags: [vite-plugin, csp, deprecation, nip5a, shell-as-csp-authority]

# Dependency graph
requires:
  - phase: 135-nip-5d-shell-as-csp-authority-amendment
    provides: NIP-5D §Security Considerations rewritten — shell is sole CSP authority; plugin meta-CSP is redundant
  - phase: 136-core-type-surface-for-connect-and-class
    provides: NubDomain / NappletGlobal surface for connect + class (no direct consumer here, but upstream of Plan 138-02)
  - phase: 137-nub-connect-and-nub-class-subpath-scaffolds
    provides: normalizeConnectOrigin (consumed by Plan 138-02, not this one; documented here for wave-1 → wave-2 linkage)
provides:
  - csp.ts file deleted entirely from packages/vite-plugin/src/
  - strictCsp production-path machinery removed from index.ts (nonce generation, meta injection, closeBundle asserts)
  - strictCsp option retained as @deprecated `unknown`-typed field with warn-once shim for one release cycle
  - tsup entry map reduced to ['src/index.ts']
  - Cleaner surface ready for additive half (Plan 138-02) to bolt connect? option onto
affects:
  - 138-02-PLAN.md (additive half — adds connect option, inline-script diagnostic, manifest tags)
  - 141-documentation-sweep (DOC-03 removes strict-CSP docs from vite-plugin/README.md)
  - v0.30.0 REMOVE-STRICTCSP (future requirement — hard removes the deprecation shim)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@deprecated accept-but-warn one-release-cycle deprecation (npm ecosystem convention)"
    - "configResolved as the natural single-fire hook for once-per-build side effects (Vite contract)"

key-files:
  created: []
  modified:
    - packages/vite-plugin/src/index.ts (660 → 560 LOC; -100 net)
    - packages/vite-plugin/tsup.config.ts (entry array: 2 → 1 item)
  deleted:
    - packages/vite-plugin/src/csp.ts (276 LOC removed in full)

key-decisions:
  - "Clean break on csp.ts — no dev-only retention (per 138-CONTEXT Q2). The production path is the only meaningful deployment posture; shell-less `vite serve` preview is not a security-posture-testing environment."
  - "Deprecation shim over hard-remove of strictCsp option (per 138-CONTEXT Q3). One release cycle of warn-once preserves existing v0.28.0 consumers' vite.config.ts on upgrade; hard removal tracked as REMOVE-STRICTCSP for v0.30.0."
  - "Field type → `unknown` (not `boolean | unknown` or removal) — unknown accepts any prior-assigned value without widening the public surface or requiring migration migration documentation to precede the warn."
  - "Warn emitted from configResolved (not nip5aManifest() factory entry) — configResolved fires exactly once per plugin invocation by Vite contract, so no external guard variable is needed; factory entry would fire once per import of the plugin module rather than per invocation."

patterns-established:
  - "Shell-as-authority pattern: build-time plugins should NOT emit browser-enforced security policy; they emit descriptive manifest tags the shell authoritatively translates into HTTP response headers."
  - "One-release-cycle deprecation: field stays accepted (typed `unknown`), emits @deprecated JSDoc + runtime console.warn, tracked under REMOVE-<NAME> future requirement for next major."

requirements-completed:
  - VITE-01
  - VITE-02

# Metrics
duration: 3m14s
completed: 2026-04-21
---

# Phase 138 Plan 01: Vite-Plugin Surgery (Subtractive Half) Summary

**Stripped 376 LOC of v0.28.0 strict-CSP production machinery from `@napplet/vite-plugin` — deleted `csp.ts` in full, purged nonce/meta-injection/closeBundle-asserts from `index.ts`, replaced `strictCsp` option with a `@deprecated unknown`-typed accept-but-warn shim that emits exactly one `[nip5a-manifest] strictCsp is deprecated in v0.29.0 …` console.warn per build.**

## Performance

- **Duration:** 3m14s
- **Started:** 2026-04-21T14:26:54Z
- **Completed:** 2026-04-21T14:30:08Z
- **Tasks:** 2 / 2
- **Files modified:** 2 (index.ts, tsup.config.ts)
- **Files deleted:** 1 (csp.ts)

## Accomplishments

- **csp.ts deleted entirely** — 276 LOC removed, no dev-only retention per locked decision Q2. The file's 7 exports (`buildBaselineCsp`, `validateStrictCspOptions`, `assertMetaIsFirstHeadChild`, `assertNoDevLeakage`, `HEADER_ONLY_DIRECTIVES`, `BASELINE_DIRECTIVE_ORDER`, `StrictCspOptions`) are gone.
- **`index.ts` LOC delta −100 (660 → 560)** — removed the 7-line `./csp.js` import block, the 34-line `strictCsp` JSDoc+field, the 4-line runtime-state block, the 11-line `configResolved` CSP branch, the 11-line `transformIndexHtml` CSP meta injection (including `order: 'pre'` + `isDev`/`ctx.server` dead code), and the 18-line `closeBundle` CSP-assert block.
- **Deprecation shim shipped** — `strictCsp?: unknown` + 7-line `@deprecated` JSDoc + once-per-build `console.warn` emitted from `configResolved` when `options.strictCsp !== undefined`. Existing v0.28.0 napplet `vite.config.ts` files with `strictCsp: true` or `strictCsp: { directives: { ... } }` continue to type-check and build cleanly on upgrade to v0.29.0 — they just see one warn per build instructing them to remove the option before v0.30.0.
- **`tsup.config.ts` entry reduced** from `['src/index.ts', 'src/csp.ts']` to `['src/index.ts']`.
- **Build + type-check green** — `pnpm --filter @napplet/vite-plugin build` and `type-check` both exit 0.

## Task Commits

1. **Task 1: DELETE csp.ts + remove from tsup entry** — `8655f9e` (chore)
2. **Task 2: Remove strictCsp machinery from index.ts; add @deprecated warn-once shim** — `0dbf941` (refactor)

## Files Created / Modified / Deleted

- `packages/vite-plugin/src/csp.ts` — **DELETED** (276 LOC)
- `packages/vite-plugin/src/index.ts` — **MODIFIED** (660 → 560 LOC, net −100; 41 insertions / 141 deletions). Removed all CSP machinery; added `@deprecated unknown`-typed `strictCsp` field + once-per-build console.warn shim.
- `packages/vite-plugin/tsup.config.ts` — **MODIFIED** (entry array: `['src/index.ts', 'src/csp.ts']` → `['src/index.ts']`).

## Banned-Identifier Audit

All 10 banned identifiers return 0 hits in `packages/vite-plugin/src/index.ts`:

| Identifier | Hits |
| --- | --- |
| `buildBaselineCsp` | 0 |
| `validateStrictCspOptions` | 0 |
| `assertMetaIsFirstHeadChild` | 0 |
| `assertNoDevLeakage` | 0 |
| `StrictCspOptions` | 0 |
| `from './csp` | 0 |
| `Content-Security-Policy` | 0 |
| `head-prepend` | 0 |
| `strictCspEnabled` | 0 |
| `cspNonce` | 0 |
| `cspMode` | 0 |
| `strictCspOptions` | 0 |

Required markers present:

| Marker | Hits |
| --- | --- |
| `@deprecated` | 2 (on strictCsp field + inline reference) |
| `strictCsp is deprecated in v0.29.0` | 1 (in console.warn literal) |
| `strictCsp?: unknown` | 1 (field declaration) |

## Preserved NON-CSP Surfaces (byte-identical)

All six surfaces required to remain untouched are present in `index.ts`:

| Surface | Hits |
| --- | --- |
| `napplet-aggregate-hash` meta | 4 |
| `napplet-type` meta | 2 |
| `napplet-config-schema` meta | 2 |
| `finalizeEvent` (nostr-tools signing) | 2 |
| `aggregateHash` (variable + hash output) | 9 |
| `computeAggregateHash` (helper) | 2 |

Schema discovery (`discoverConfigSchema`), structural schema validation (`validateConfigSchema`, `walk`), synthetic `config:schema` xTag fold, `['config', …]` manifest tag emission, requires-tags projection, and manifest signing via `nostr-tools/pure` are all unchanged byte-for-byte below the deleted CSP fences.

## Build + Type-check

| Command | Exit Code | Notes |
| --- | --- | --- |
| `pnpm --filter @napplet/vite-plugin build` | 0 | tsup ESM build 8ms; DTS 639ms; dist/index.js 11.25 KB, dist/index.d.ts 3.22 KB |
| `pnpm --filter @napplet/vite-plugin type-check` | 0 | tsc --noEmit clean |

Built artifacts (`dist/index.js`, `dist/index.d.ts`) contain 0 occurrences of `Content-Security-Policy`, `head-prepend`, `buildBaselineCsp`, or `strictCspEnabled`.

## Decisions Made

See the `key-decisions` frontmatter block above. All four decisions were already locked in `138-CONTEXT.md` Q1–Q4 and implemented faithfully:

- **Q2 (csp.ts disposition):** Delete entirely — no dev-only retention, no split-by-concern. Production path is the only meaningful deployment posture.
- **Q3 (strictCsp deprecation):** `@deprecated` accept-but-warn for one cycle. Hard-remove tracked as `REMOVE-STRICTCSP` in REQUIREMENTS.md for v0.30.0.
- (Q1 inline-script detection + Q4 hard-error diagnostic are scoped to Plan 138-02 — additive half.)

## Deviations from Plan

None — plan executed exactly as written. All 7 micro-edits (import block, field + JSDoc, runtime state, configResolved branch, transformIndexHtml, closeBundle asserts, identifier audit) landed cleanly on the first pass. One trivial in-plan discretion: the `StrictCspOptions` identifier appeared once inside the new `@deprecated` JSDoc as a historical reference to the removed type — the banned-identifier grep (which the acceptance criteria require to return 0) caught it, so I rewrote the JSDoc line to reference the `boolean | object` shape instead (no load-bearing code implication — the JSDoc is prose, not a type reference).

## Issues Encountered

None.

## Traceability

- **Locked decision Q2 (delete csp.ts entirely):** [`.planning/phases/138-napplet-vite-plugin-surgery/138-CONTEXT.md` §Decisions](./138-CONTEXT.md)
- **Locked decision Q3 (warn-once deprecation shim):** [`.planning/phases/138-napplet-vite-plugin-surgery/138-CONTEXT.md` §Decisions](./138-CONTEXT.md)
- **Future requirement `REMOVE-STRICTCSP` (v0.30.0 hard-remove):** `.planning/REQUIREMENTS.md` §Future Requirements
- **Future requirement `REMOVE-STRICTCSP-CAP` (v0.30.0 capability removal):** `.planning/REQUIREMENTS.md` §Future Requirements

## Next Phase Readiness

- **Plan 138-02 (additive half) unblocked.** The `index.ts` now has:
  - A clean `transformIndexHtml` function (no head-prepend, no `order: 'pre'`) ready to grow an inline-script diagnostic + connect grant meta emission.
  - A clean `configResolved` ready to grow `normalizeConnectOrigin` validation + cleartext warning.
  - A clean `closeBundle` CSP-free prefix ready to grow the inline-script scan.
  - `SYNTHETIC_XTAG_PATHS` extraction (VITE-07) still pending — Plan 138-02 lands that when it adds the `connect:origins` synthetic fold alongside the existing `config:schema` entry.
- **Downstream plans unaffected.** Plans 139 (shim/SDK integration), 140 (shell-policy docs), 141 (docs sweep), and 142 (milestone close) were already aware the plugin would stop emitting CSP in v0.29.0.
- **No blockers.**

## Self-Check: PASSED

- FOUND: 138-01-SUMMARY.md
- CONFIRMED DELETED: packages/vite-plugin/src/csp.ts
- FOUND: packages/vite-plugin/src/index.ts (preserved, mutated)
- FOUND: packages/vite-plugin/tsup.config.ts (mutated)
- FOUND commit 8655f9e (Task 1: delete csp.ts + drop tsup entry)
- FOUND commit 0dbf941 (Task 2: remove strictCsp machinery + @deprecated shim)

---
*Phase: 138-napplet-vite-plugin-surgery*
*Completed: 2026-04-21*
