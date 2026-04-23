---
phase: 127-nub-relay-sidecar-amendment
verified: 2026-04-20T13:45:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 127: NUB-RELAY Sidecar Amendment — Verification Report

**Phase Goal:** Shells that opt in can pre-resolve resources referenced by relay events; the napplet's `resource.bytes(url)` call resolves from cache without round-trip when the sidecar pre-populated the URL — invisibly to the napplet caller.
**Verified:** 2026-04-20T13:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `RelayEventMessage` accepts optional `resources?: ResourceSidecarEntry[]` field; envelopes omitting it still type-check identically to pre-v0.28.0 | VERIFIED | Line 204 of `relay/types.ts`: `resources?: ResourceSidecarEntry[];` inside `RelayEventMessage`. Field is optional (`?`) — additive, backward-compatible. `pnpm --filter @napplet/nub type-check` exits 0. |
| 2 | The relay shim invokes `hydrateResourceCache(msg.resources)` BEFORE delivering each event to the per-subscription `onEvent` callback | VERIFIED | Lines 71–72 of `relay/shim.ts`: `hydrateResourceCache(eventMsg.resources);` at offset 2811, `onEvent(eventMsg.event);` at offset 2859. Source ordering confirmed by node offset check (h=2811 < o=2859). |
| 3 | A synchronous `napplet.resource.bytes(sidecarUrl)` call inside an `onEvent` handler resolves from the resource shim's single-flight cache without sending a `resource.bytes` postMessage envelope | VERIFIED | Smoke test: `bytes(sidecarUrl)` awaited inside `onEvent`; `postMessageCountInsideOnEvent === 0`. Both PASS lines printed; exit 0. |
| 4 | N concurrent `bytes(sameUrl)` calls (sidecar-hydrated or otherwise) share one in-flight Promise (single-flight cache) | VERIFIED | `hydrateResourceCache` inserts `Promise.resolve(entry.blob)` into `inflight` Map (resource/shim.ts line 287). Subsequent `bytes(url)` hits the `const cached = inflight.get(url)` branch (line 171) and returns the same Promise to all callers — single work-unit, N resolutions. |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/nub/src/relay/types.ts` | `RelayEventMessage` extended with `resources?: ResourceSidecarEntry[]`; type-only sibling import of `ResourceSidecarEntry` | VERIFIED | Contains `import type { ResourceSidecarEntry } from '../resource/types.js';` at line 13. Contains `resources?: ResourceSidecarEntry[];` at line 204 inside `RelayEventMessage`. Import uses `import type` (not bare import) — `verbatimModuleSyntax` compliant. Path uses sibling relative `.js` form. |
| `packages/nub/src/relay/shim.ts` | Inbound `relay.event` handler calls `hydrateResourceCache(msg.resources)` before `onEvent(msg.event)` | VERIFIED | Contains `import { hydrateResourceCache } from '../resource/shim.js';` at line 18 (runtime value import, not type). `hydrateResourceCache(eventMsg.resources)` at line 71, `onEvent(eventMsg.event)` at line 72 — correct ordering. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/nub/src/relay/types.ts` | `packages/nub/src/resource/types.ts` | type-only sibling relative import | VERIFIED | Literal line match: `import type { ResourceSidecarEntry } from '../resource/types.js';` (line 13). Pattern `^import type \{ ResourceSidecarEntry \} from '\.\.\/resource\/types\.js';$` matches exactly. |
| `packages/nub/src/relay/shim.ts` | `packages/nub/src/resource/shim.ts` | runtime sibling relative import for `hydrateResourceCache` | VERIFIED | Literal line match: `import { hydrateResourceCache } from '../resource/shim.js';` (line 18). Pattern `^import \{ hydrateResourceCache \} from '\.\.\/resource\/shim\.js';$` matches exactly. |
| `relay/shim.ts` `relay.event` handler | resource shim `inflight` Map | `hydrateResourceCache(eventMsg.resources)` call on source line BEFORE `onEvent(eventMsg.event)` | VERIFIED | Source offset: `hydrateResourceCache(eventMsg.resources)` at char offset 2811; `onEvent(eventMsg.event)` at char offset 2859. 2811 < 2859 — ordering is load-bearing and correct. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `relay/shim.ts` → `onEvent` callback | `eventMsg.resources` (sidecar entries) | `relay.event` postMessage envelope from shell | Yes — shell populates field; `hydrateResourceCache` inserts `Promise.resolve(entry.blob)` into `inflight` Map before `onEvent` fires | FLOWING |
| `resource/shim.ts` `bytes()` | `inflight.get(url)` cache hit | `hydrateResourceCache()` pre-populates `inflight` with resolved Promises | Yes — cache contains real Blob bytes from sidecar entry | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `relay.event` with sidecar hydrates cache; `bytes(sidecarUrl)` resolves from cache with 0 postMessages; cached Blob bytes match sidecar bytes (PNG magic) | `node /tmp/127-sidecar-smoke.mjs` (verifier-generated; deleted after run) | `PASS: relay shim hydrated cache; bytes(sidecarUrl) resolved from cache with 0 postMessages` / `PASS: cached Blob bytes match sidecar Blob bytes (PNG magic preserved)` | PASS |
| `pnpm --filter @napplet/nub type-check` exits 0 | `pnpm --filter @napplet/nub type-check` | Exit 0, no errors | PASS |
| `pnpm --filter @napplet/nub build` exits 0; emits `dist/relay/types.d.ts` and shim chunks | `pnpm --filter @napplet/nub build` | ESM + DTS build success in 24ms + 2246ms; `dist/relay/types.d.ts` 8.24 KB, `dist/relay/shim.d.ts` 3.64 KB | PASS |
| `resources?: ResourceSidecarEntry[]` present in published `.d.ts` | `grep "resources" dist/relay/types.d.ts` | `resources?: ResourceSidecarEntry[];` found | PASS |
| `hydrateResourceCache` call in published dist (chunk-split) | `grep -rl "hydrateResourceCache" dist/` | Found in `dist/chunk-RHDDLJ3D.js` and `dist/chunk-OV3R23GE.js` | PASS |
| DEF-125-01 carry: workspace-wide failure still only in `@napplet/shim` (TS2741) | `pnpm -r type-check 2>&1 \| grep ELIFECYCLE` | `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL @napplet/shim@0.2.1` — one failure, TS2741, `resource` property missing | PASS — no new failures introduced |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SIDE-01 | 127-01-PLAN.md | Optional `resources?: ResourceSidecarEntry[]` field on `RelayEventMessage` (additive, backward-compatible wire change) | SATISFIED | Field present at line 204 of `relay/types.ts`; field is optional (`?`); `pnpm --filter @napplet/nub type-check` exits 0 with no regressions |
| SIDE-02 | 127-01-PLAN.md | `ResourceSidecarEntry` type defined in resource NUB; relay NUB imports as type-only in-package dep | SATISFIED | `ResourceSidecarEntry` owned by `packages/nub/src/resource/types.ts` (line 66). Relay imports via `import type { ResourceSidecarEntry } from '../resource/types.js';` — type-only, no runtime cross-domain dep |
| SIDE-03 | 127-01-PLAN.md | Relay shim calls `hydrateResourceCache(msg.resources)` from resource shim before delivering each event to `onEvent` | SATISFIED | Source-order verified: offset 2811 < 2859; inline comment in shim documents the ordering requirement; backward-compatible (null-safe: `hydrateResourceCache(undefined)` is a no-op) |
| SIDE-04 | 127-01-PLAN.md | Single-flight cache map keyed by canonical URL; subsequent `resource.bytes(url)` calls for sidecar-pre-populated URLs resolve from cache without round-trip; concurrent calls share one in-flight Promise | SATISFIED | `inflight` Map (resource/shim.ts line 25) stores `Map<string, Promise<Blob>>`; `hydrateResourceCache` inserts `Promise.resolve(entry.blob)` (line 287); `bytes()` returns `inflight.get(url)` on cache hit (line 172); smoke test proves 0 postMessages during cached `bytes()` call |

No REQUIREMENTS.md orphans: SIDE-01..04 are all mapped to Phase 127 in the traceability table; SIDE-05 is correctly assigned to Phase 132 (spec-layer, not this phase).

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | — | — | — |

No stubs, placeholders, empty returns, TODO/FIXME comments, or hardcoded empty values found in the two modified files. The `hydrateResourceCache(undefined)` no-op path is the documented null-safe contract (Phase 126), not a stub.

---

### Human Verification Required

None. All success criteria are verifiable programmatically:
- Wire field: grep
- Import conventions: grep with anchored regex
- Source ordering: char-offset comparison via Node script
- Build/type-check: exit codes
- End-to-end cache-hit behavior: smoke test with postMessage call counter

No visual, real-time, or external-service behavior is involved in this phase.

---

### Gaps Summary

No gaps. All 4 must-have truths are verified. All artifacts exist, are substantive, are wired, and have data flowing through them. All 4 requirement IDs (SIDE-01..04) are satisfied. Both commits (`24aca30`, `0a2ee58`) are present in git history. The DEF-125-01 carry is contained exactly as specified (one workspace failure in `@napplet/shim`, no new failures).

---

_Verified: 2026-04-20T13:45:00Z_
_Verifier: Claude (gsd-verifier)_
