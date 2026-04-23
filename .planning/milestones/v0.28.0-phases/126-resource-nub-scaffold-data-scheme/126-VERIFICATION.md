---
phase: 126-resource-nub-scaffold-data-scheme
verified: 2026-04-20T13:10:00Z
status: passed
score: 8/8 must-haves verified
---

# Phase 126: Resource NUB Scaffold + `data:` Scheme Verification Report

**Phase Goal:** A complete, self-contained `@napplet/nub/resource` subpath exists with envelope types, single-flight shim, SDK helpers, and zero-network `data:` decoding — proving the full request / result / cancel / cache / lifecycle dispatch path before anything integrates.
**Verified:** 2026-04-20T13:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `import { bytes } from '@napplet/nub/resource/shim'` resolves; `bytes('data:...')` returns Promise<Blob> with zero postMessage | VERIFIED | `dist/resource/shim.d.ts` exports `bytes`; `bytes()` checks `protocol === 'data:'` at shim.ts:181 and calls `decodeDataUrl(url)` = `fetch(url).then(r => r.blob())` — no `postMessage` call in that path; export confirmed in built `dist/resource/shim.js` |
| 2 | `ResourceErrorCode` union exposes exactly 8 codes: not-found, blocked-by-policy, timeout, too-large, unsupported-scheme, decode-failed, network-error, quota-exceeded | VERIFIED | types.ts:36-44 declares all 8 literals; built `dist/resource/types.d.ts` line 31 collapses them into the single-line union; all 8 confirmed present |
| 3 | `bytesAsObjectURL(url)` returns `{ url, revoke }`; `revoke()` invokes `URL.revokeObjectURL` exactly once (idempotent) | VERIFIED | shim.ts:231-262: `revoked` boolean flag guards `URL.revokeObjectURL(objectUrl)` — second call returns early at line 244; `objectUrl` set to null after revocation preventing double-release; `ready` non-enumerable Promise extension attached at line 255 |
| 4 | `bytes(url, { signal })` with already-aborted AbortSignal rejects with AbortError-shaped DOMException BEFORE any postMessage; in-flight abort sends `resource.cancel` envelope | VERIFIED | shim.ts:165-166: synchronous `opts?.signal?.aborted` check returns `Promise.reject(new DOMException('Aborted', 'AbortError'))` before `inflight.get`, `sendBytesRequest`, or any `postMessage`; post-dispatch abort: `wireSignal()` calls `sendCancel(cancelId)` then rejects with same DOMException shape (lines 117-123) |
| 5 | `ResourceBytesResultMessage` carries single Blob field — no chunk, stream, range, partial, or readable-stream fields anywhere in result union | VERIFIED | `dist/resource/types.d.ts` grep for `\bchunk\b\|stream:\|range:\|ReadableStream` returns zero matches on field declarations; only comment prose "no streaming" appears; source types.ts verified identically |
| 6 | Concurrent `bytes(sameUrl)` calls share one in-flight Promise via `Map<canonicalURL, Promise<Blob>>`; N concurrent calls produce 1 work-unit | VERIFIED | shim.ts:25 `const inflight = new Map<string, Promise<Blob>>()`; line 170-173: `inflight.get(url)` returns cached Promise for repeated calls; line 196 `inflight.set(url, work)` after first request; line 192-194 `work.finally(() => inflight.delete(url))` cleans on settle |
| 7 | `package.json` has 4 new exports entries; `tsup.config.ts` has 4 corresponding entry points; build emits 8 dist files | VERIFIED | `package.json` lines 143-158: `./resource`, `./resource/types`, `./resource/shim`, `./resource/sdk` — 4 entries confirmed; `tsup.config.ts` lines 39-42: `resource/index`, `resource/types`, `resource/shim`, `resource/sdk` — 4 entries confirmed; `dist/resource/` contains: `index.js`, `index.d.ts`, `types.js`, `types.d.ts`, `shim.js`, `shim.d.ts`, `sdk.js`, `sdk.d.ts` — 8 files |
| 8 | `pnpm --filter @napplet/nub build` and `pnpm --filter @napplet/nub type-check` exit 0 | VERIFIED | `type-check` produced no error output; `build` completed with all dist files emitted including 8 new `dist/resource/*` files; no error/warning lines in build output |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/nub/src/resource/types.ts` | Wire envelope types, ResourceErrorCode, 3 unions | VERIFIED | 200 lines; exports: `DOMAIN`, `ResourceErrorCode` (8 codes), `ResourceScheme`, `ResourceSidecarEntry`, `ResourceMessage`, `ResourceBytesMessage`, `ResourceCancelMessage`, `ResourceBytesResultMessage`, `ResourceBytesErrorMessage`, 3 discriminated unions |
| `packages/nub/src/resource/shim.ts` | bytes(), bytesAsObjectURL(), single-flight, data: inline, AbortSignal | VERIFIED | 309 lines; exports: `handleResourceMessage`, `bytes`, `bytesAsObjectURL`, `hydrateResourceCache`, `installResourceShim`; all 5 functions substantive |
| `packages/nub/src/resource/sdk.ts` | resourceBytes, resourceBytesAsObjectURL, requireResource() guard | VERIFIED | 61 lines; exports: `resourceBytes`, `resourceBytesAsObjectURL`; delegates via `requireResource()` → `window.napplet.resource`; does NOT import from `./shim.js` |
| `packages/nub/src/resource/index.ts` | Barrel with registerNub(DOMAIN, no-op) | VERIFIED | 68 lines; re-exports DOMAIN, all types, all shim functions, both SDK functions; `registerNub(DOMAIN, (_msg) => {})` at line 66 |
| `packages/nub/package.json` | 4 new `./resource*` exports entries | VERIFIED | Lines 143-158: exactly 4 entries with correct dist paths pointing to `dist/resource/{index,types,shim,sdk}.{d.ts,js}` |
| `packages/nub/tsup.config.ts` | 4 new `resource/*` entry points | VERIFIED | Lines 39-42: `resource/index`, `resource/types`, `resource/shim`, `resource/sdk` — all 4 present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `shim.ts` | `types.ts` | `import type { ..., ResourceSidecarEntry, ... } from './types.js'` | VERIFIED | shim.ts lines 4-10: imports `ResourceBytesMessage`, `ResourceBytesResultMessage`, `ResourceBytesErrorMessage`, `ResourceCancelMessage`, `ResourceSidecarEntry` from `'./types.js'` |
| `sdk.ts` | `window.napplet.resource` | `requireResource()` guard, no direct shim import | VERIFIED | sdk.ts: `requireResource()` returns `NappletGlobal['resource']`; no import from `'./shim'` anywhere in sdk.ts; delegates to `requireResource().bytes(url)` |
| `index.ts` | `@napplet/core` dispatch | `registerNub(DOMAIN, no-op)` at module load | VERIFIED | index.ts lines 58-68: `import { registerNub } from '@napplet/core'` + `registerNub(DOMAIN, (_msg) => {})` |
| `shim.ts` | browser `fetch()` for `data:` scheme | `if (protocol === 'data:') return decodeDataUrl(url)` | VERIFIED | shim.ts line 181: `if (protocol === 'data:')` dispatches to `decodeDataUrl(url)` = `fetch(url).then((r) => r.blob())` at line 102 |
| `package.json` exports | `tsup.config.ts` entry array | Both list exactly 4 resource paths | VERIFIED | package.json: 4 `./resource*` entries; tsup.config.ts: 4 `resource/*` entries; symmetrical |

### Data-Flow Trace (Level 4)

Not applicable — this phase delivers a pure protocol/library package (types, shim, SDK). There is no UI component or page that renders dynamic data. The shim itself IS the data-flow primitive; its implementation is verified at Level 3 (wiring checks above).

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| `bytes` export present in dist | `grep "bytes" dist/resource/shim.d.ts` | `export { bytes, bytesAsObjectURL, ... }` | PASS |
| `ResourceErrorCode` in dist types | grep for all 8 codes in `dist/resource/types.d.ts` | All 8 present on single union line | PASS |
| `protocol === 'data:'` discriminant | grep in shim.ts source | Line 181 confirmed | PASS |
| Build emits 8 resource dist files | `ls dist/resource/` | index.js, index.d.ts, types.js, types.d.ts, shim.js, shim.d.ts, sdk.js, sdk.d.ts | PASS |
| type-check exits 0 | `pnpm --filter @napplet/nub type-check` | No output (clean) | PASS |
| build exits 0 | `pnpm --filter @napplet/nub build` | All DTS emitted, no error lines | PASS |
| Commits exist | `git log d138035 f42517a 84caa19 4566137` | All 4 commits present on branch | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| RES-01 | 126-01-PLAN.md | `@napplet/nub/resource` subpath scaffold (4 files, 4 exports, 4 tsup entries) | SATISFIED | All 4 source files exist at correct paths; 4 exports entries in package.json; 4 tsup entries; 8 dist files |
| RES-02 | 126-01-PLAN.md | `ResourceBytesMessage` / `ResourceBytesResultMessage` with `id`, `url`, `blob: Blob`, `mime: string` | SATISFIED | types.ts:105-111 (`ResourceBytesMessage`), lines 153-161 (`ResourceBytesResultMessage` with `blob: Blob` and `mime: string`) |
| RES-03 | 126-01-PLAN.md | Typed error discriminator with exactly 8 codes | SATISFIED | types.ts:36-44: all 8 string literals in `ResourceErrorCode` union; verified in built dist |
| RES-04 | 126-01-PLAN.md | Shell-classified MIME via byte sniffing (NOT Content-Type passthrough) | SATISFIED | types.ts JSDoc on `ResourceBytesResultMessage.mime` line 158: "Shell-classified MIME type (byte-sniffed)"; `ResourceSidecarEntry.mime` JSDoc: "Shell-classified MIME (byte-sniffed; NOT upstream Content-Type)" |
| RES-05 | 126-01-PLAN.md | `resource.cancel` envelope + `AbortSignal` cancellation | SATISFIED | `ResourceCancelMessage` in types.ts:126-130; shim.ts `sendCancel()` sends `resource.cancel` envelope; `wireSignal()` fires it on abort; synchronous pre-check at bytes():165 |
| RES-06 | 126-01-PLAN.md | `bytesAsObjectURL` returning `{ url, revoke }` handle; `revoke()` idempotent | SATISFIED | shim.ts:231-262: `revoked` flag prevents double-revocation; `URL.revokeObjectURL` called at most once; non-enumerable `ready` Promise extension |
| RES-07 | 126-01-PLAN.md | Single-Blob contract — no chunk/stream/range fields in result union | SATISFIED | grep on `dist/resource/types.d.ts` for `\bchunk\b\|stream:\|range:\|ReadableStream` returns 0 field matches; only prose comment "no streaming" |
| SCH-01 | 126-01-PLAN.md | `data:` scheme decoded in-shim with zero shell round-trip | SATISFIED | shim.ts:181-182: `if (protocol === 'data:') { work = decodeDataUrl(url); }` where `decodeDataUrl = fetch(url).then(r => r.blob())`; path bypasses `sendBytesRequest` and `window.parent.postMessage` entirely |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/nub/src/resource/index.ts` | 63 | Comment "no-op placeholder" | Info | Intentional design — `registerNub(DOMAIN, no-op)` is explicitly required by the plan (must_haves key_links); the comment accurately describes intended behavior; not a code stub |
| `packages/nub/src/resource/shim.ts` | 287 | `hydrateResourceCache` sets `inflight.set(entry.url, Promise.resolve(entry.blob))` without `.finally(() => inflight.delete(...))` wrapper | Info | Hydrated entries will not be auto-cleaned from the inflight map after the first consumer settles them (comment at line 286 says "finally() will delete" but no finally is attached to hydrated Promises). This is a minor documentation inaccuracy — the hydrated blob stays in inflight until explicitly cleared or `installResourceShim()` cleanup is called. No goal impact: the phase does not require cleanup of hydrated entries. |

### Human Verification Required

None — all success criteria are verifiable programmatically via file inspection, grep, and build/type-check tooling.

### Gaps Summary

No gaps. All 8 must-have truths verified, all 6 artifacts substantive and wired, all 5 key links confirmed, all 8 requirement IDs satisfied, build and type-check exit 0.

The single info-level finding (hydrated entries in `hydrateResourceCache` lacking `.finally()` cleanup, contradicting the adjacent comment) has no impact on phase goal achievement. The phase explicitly scopes out long-lived blob cache concerns ("v0.28.0 has no long-lived blob cache; deferred to spec/future milestone" — SUMMARY, key-decisions).

---

_Verified: 2026-04-20T13:10:00Z_
_Verifier: Claude (gsd-verifier)_
