---
phase: 134-verification-milestone-close
milestone: v0.28.0
status: passed
verified: 2026-04-21
gates_total: 7
gates_passed: 7
gates_failed: 0
---

# Phase 134 Verification — v0.28.0 Browser-Enforced Resource Isolation

**Verified:** 2026-04-21
**Phase:** 134 — Verification & Milestone Close
**Milestone:** v0.28.0 Browser-Enforced Resource Isolation
**Branch:** feat/strict-model
**Status:** PASS (7/7 gates green)

## Summary

All 7 VER-IDs (VER-01..07) executed per the locked verification strategy in `134-CONTEXT.md`. Mix of runtime tests (VER-01 workspace build/type-check; VER-02 Playwright CSP positive-block; VER-04 single-flight stampede against built dist with stubbed postMessage; VER-07 esbuild tree-shake bundle inspection) and spec-conformance greps (VER-03 SVG rejection MUSTs/SHOULDs/attack vectors; VER-05 sidecar default-OFF + privacy + per-event-kind allowlist; VER-06 cross-repo zero-grep). All evidence persists to `/tmp/` per AGENTS.md no-home-dir-pollution rule.

| VER-ID | Gate | Result | Evidence |
|--------|------|--------|----------|
| VER-01 | `pnpm -r build` + `pnpm -r type-check` across 14 packages | **PASS** | `/tmp/napplet-ver-01.log` (BUILD_EXIT=0, TC_EXIT=0, PACKAGE_COUNT=14) |
| VER-02 | CSP positive-blocking simulation (Playwright) | **PASS** | `/tmp/napplet-ver-02-csp.log` (`{"cspViolation":true,"requestFailedForBlocked":true,"pass":true}`, VER02_EXIT=0) |
| VER-03 | SVG rejection spec conformance (NUB-RESOURCE.md) | **PASS** | `/tmp/napplet-ver-03-svg.log` (PASS — 3 MUSTs + 3 SHOULD caps + 3 named attack vectors verified, VER03_EXIT=0) |
| VER-04 | Single-flight cache stampede (N=10 against built dist) | **PASS** | `/tmp/napplet-ver-04-stampede.log` (`{"pass":true,"envelopeCount":1,"allSameBlob":true,"resultCount":10}`, VER04_EXIT=0) |
| VER-05 | Sidecar default-OFF spec conformance (NUB-RELAY-AMENDMENT.md) | **PASS** | `/tmp/napplet-ver-05-sidecar.log` (PASS — default-OFF + privacy rationale + per-event-kind allowlist verified, VER05_EXIT=0) |
| VER-06 | Cross-repo zero-grep across 4 nubs drafts | **PASS** | `/tmp/napplet-ver-06-zerogrep.log` (NUB-RESOURCE.md:0, NUB-RELAY-AMENDMENT.md:0, NUB-IDENTITY-AMENDMENT.md:0, NUB-MEDIA-AMENDMENT.md:0, TOTAL=0, VER06_EXIT=0) |
| VER-07 | Tree-shake bundle (relay-types-only consumer) | **PASS** | `/tmp/napplet-ver-07-treeshake.log` (74-byte bundle; installResourceShim:0, hydrateResourceCache:0, resource\.bytes:0, bytesAsObjectURL:0, handleResourceMessage:0, VER07_EXIT=0) |

## Gate Detail

### VER-01 — Workspace build + type-check (gating)

```
BUILD_EXIT=0
TC_EXIT=0
PACKAGE_COUNT=14
```

`pnpm -r build` across all 14 workspace packages (`packages/{core,nub,sdk,shim,vite-plugin}` + `packages/nubs/{config,identity,ifc,keys,media,notify,relay,storage,theme}`) exits 0. `pnpm -r type-check` exits 0. DEF-125-01 (workspace-wide `NappletGlobal['resource']` cascade) remains closed. Acceptance criterion: 14/14 packages green.

### VER-02 — CSP positive blocking (Playwright simulation)

Playwright loads a `data:text/html` page with a strict CSP meta (`default-src 'none'; img-src 'self'`) injected as the first child of `<head>`, then attempts to fetch a blocked external image. Both signals were observed for the same URL:

- `page.on('console')` fired an error message containing the substring "Content Security Policy"
- `page.on('requestfailed')` fired for the URL `https://example.com/blocked.png`

Per Pitfall 21 (positive-block assertion, not absence-of-request), this proves CSP enforcement, not silence. Result: `{"cspViolation":true,"requestFailedForBlocked":true,"pass":true}`.

### VER-03 — SVG rejection spec conformance

Verifies `NUB-RESOURCE.md` locks all three MUST clauses (shell rasterizes; never delivers raw `image/svg+xml`; rasterizer runs in sandboxed Worker with no network), all three SHOULD caps (max input bytes, max output dimensions, wall-clock budget), and cites all three named attack vectors (`<foreignObject>`, recursive `<use>`, billion-laughs / entity expansion). All 10 grep checks PASS.

Real rasterization is downstream-shell territory per `134-CONTEXT.md > decisions > Verification Strategy`; this is the spec-conformance gate.

### VER-04 — Single-flight cache stampede

Imports the built `bytes()` and `handleResourceMessage()` from `packages/nub/dist/resource/shim.js`, stubs `globalThis.window.parent.postMessage`, fires N=10 concurrent `bytes(URL)` calls for the same URL, and asserts:

1. Exactly 1 outbound `resource.bytes` envelope was dispatched (single-flight dedup)
2. After synthesizing one `resource.bytes.result` envelope, all 10 promises resolve to the SAME `Blob` reference (`Object.is` identity, not just structural equality)

Result: `{"pass":true,"envelopeCount":1,"allSameBlob":true,"resultCount":10}`. Pitfall 13 (cache stampede) mitigation proven against the actual built artifact, not source.

### VER-05 — Sidecar default-OFF spec conformance

Per `134-CONTEXT.md > decisions > Verification Strategy`: this is a **spec test**, not a runtime test. The implementation hydrates whatever the shell sends; the "default OFF" gate lives in `NUB-RELAY-AMENDMENT.md`. All three required pieces verified present:

- Default-OFF / opt-in posture documented
- Privacy rationale (upstream visibility / fingerprinting / pre-fetching)
- Per-event-kind allowlist guidance

Result: PASS.

### VER-06 — Cross-repo zero-grep sweep

```
NUB-RESOURCE.md: 0
NUB-RELAY-AMENDMENT.md: 0
NUB-IDENTITY-AMENDMENT.md: 0
NUB-MEDIA-AMENDMENT.md: 0
TOTAL=0
```

Zero `@napplet/` private-package references across all 4 cross-repo draft PRs destined for the public `napplet/nubs` repo. Pitfall 8 (private-namespace leak into public spec) mitigated.

### VER-07 — Tree-shake bundle

Minimal consumer fixture at `/tmp/napplet-ver-07-treeshake/` imports only `RelayEventMessage` from `@napplet/nub/relay/types` via a no-op `makeStub()` runtime function. esbuild bundles with `--tree-shaking=true --format=esm --platform=neutral`. Output bundle is 74 bytes (74b, comparable to v0.26.0's 39-byte precedent — the small delta is the explicit `null` return + ESM export wrapper).

Symbol-grep against the bundle confirms ZERO occurrences of all 5 forbidden resource-shim symbols:

- `installResourceShim`: 0
- `hydrateResourceCache`: 0
- `resource\.bytes`: 0
- `bytesAsObjectURL`: 0
- `handleResourceMessage`: 0

A consumer importing only relay types pays exactly zero bytes for resource code. `@napplet/nub` `sideEffects: false` + tsup chunk-splitting + per-subpath entry points are all working as designed.

## Spec Drift Resolved

Per the Phase 133 surfacing (`STATE.md > decisions > "Phase 133: TS-vs-spec error envelope drift surfaced for future resolution"`): `.planning/phases/132-cross-repo-nubs-prs/drafts/NUB-RESOURCE.md` updated to use `error: ResourceErrorCode` + `message?: string` (matching the canonical shipped `packages/nub/src/resource/types.ts`).

**19 surgical substitutions** applied across the spec table, key design notes paragraph, error response example, scheme/policy prose paragraphs, default policy SHOULD/MUST clauses, SVG rasterization caps table, and Shell Guarantees MUST/SHOULD table rows.

The plan listed 18 substitutions; one additional `code: "decode-failed"` was discovered in the blossom: scheme prose (line 113) by the post-edit sanity grep and corrected (Rule 1 deviation). Total = 19. Sanity check post-edit: zero remaining `code: "<errorname>"` references in error-envelope context across the file. New `error: "<errorname>"` form occurrences: 18 (one line where `code: "decode-failed"` appeared twice in the original was consolidated).

Cross-repo PR has not been opened yet (manual git ops on `~/Develop/nubs` deferred per Phase 132 CONTEXT.md), so the correction is in-repo only — no upstream sync required. Single commit on `feat/strict-model`: `2f80342`.

## Artifacts

- Spec correction commit: `2f80342` on `feat/strict-model` branch (NUB-RESOURCE.md)
- VERIFICATION.md (this file)
- STATE.md updated: `status: ready-for-audit`; Phase 134 decisions appended
- PROJECT.md updated: v0.28.0 moved from "Current Milestone" to "Shipped: v0.28.0 Browser-Enforced Resource Isolation"
- REQUIREMENTS.md updated: VER-01..07 traceability rows flipped Pending → Complete
- ROADMAP.md updated: Phase 134 marked Complete via `roadmap update-plan-progress`

## Next

Autonomous lifecycle proceeds:

1. `/gsd:audit-milestone v0.28.0`
2. `/gsd:complete-milestone` (archives v0.28.0 ROADMAP)
3. Cleanup pass

Branch `feat/strict-model` is ready for merge to `main` as a manual step (outside this phase, per `134-CONTEXT.md`).

---
*Verified by: gsd-executor (134-01-PLAN.md execution)*
*Phase: 134-verification-milestone-close*
