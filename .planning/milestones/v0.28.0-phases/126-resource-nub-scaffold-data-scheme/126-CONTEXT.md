# Phase 126: Resource NUB Scaffold + `data:` Scheme - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure-scaffold phase — discuss skipped)

<domain>
## Phase Boundary

A complete, self-contained `@napplet/nub/resource` subpath exists with:

- **types.ts** — wire envelope types: `ResourceBytesMessage`, `ResourceBytesResultMessage`, `ResourceBytesErrorMessage`, `ResourceCancelMessage`, `ResourceSidecarEntry`, `ResourceScheme`, plus discriminated unions
- **shim.ts** — `bytes(url, opts?)`, `bytesAsObjectURL(url)`, `hydrateResourceCache(entries)`, `handleResourceMessage(env)`, `installResourceShim()`. Single-flight `Map<canonicalURL, Promise<Blob>>` cache. AbortSignal cancellation. `data:` scheme decoded inline (zero shell round-trip).
- **sdk.ts** — named exports for bundler consumers
- **index.ts** — barrel + `RESOURCE_DOMAIN` constant
- **package.json** — 4 new `exports` entries (`./resource`, `./resource/types`, `./resource/shim`, `./resource/sdk`)
- **tsup.config.ts** — 4 new entry points

NO shim integration (Phase 128). NO SDK barrel integration (Phase 129). NO sidecar wiring on relay (Phase 127). This phase ships the package surface only.

</domain>

<decisions>
## Implementation Decisions

### Wire Type Shape (LOCKED — from REQUIREMENTS.md RES-02..07)

- **Request envelope**: `{ type: 'resource.bytes', id: string, url: string, opts?: { signal?: never } }` — `signal` is metadata-only on the wire (AbortSignal is napplet-side only; cancellation flows via separate `resource.cancel` envelope)
- **Result envelope**: `{ type: 'resource.bytes.result', id: string, blob: Blob, mime: string }` — `mime` is shell-classified by byte sniffing
- **Error envelope**: `{ type: 'resource.bytes.error', id: string, error: ResourceErrorCode, message?: string }` where `ResourceErrorCode = 'not-found' | 'blocked-by-policy' | 'timeout' | 'too-large' | 'unsupported-scheme' | 'decode-failed' | 'network-error' | 'quota-exceeded'`
- **Cancel envelope**: `{ type: 'resource.cancel', id: string }`
- **Sidecar entry**: `{ url: string, blob: Blob, mime: string }` — same shape as result minus the `id`/`type` fields
- **Single-Blob contract** (RES-07): no `chunk`, `stream`, `range`, or partial-payload fields anywhere in the result union

### Shim API Shape (LOCKED — from CORE-02 + RES-05/RES-06)

- `bytes(url: string, opts?: { signal?: AbortSignal }): Promise<Blob>`
- `bytesAsObjectURL(url: string): { url: string; revoke: () => void }` — returns synchronously a stable handle; `revoke()` calls `URL.revokeObjectURL(url)` exactly once
- Both API methods route to the same internal single-flight `inflight: Map<string, Promise<Blob>>` keyed on canonical URL string

### `data:` Scheme Handling (LOCKED — from SCH-01)

- Decoded inside napplet shim with ZERO postMessage round-trip
- Use `fetch(dataUrl).then(r => r.blob())` (browser-native; no manual base64 parsing)
- MIME comes from the data URI's media-type token; falls back to `application/octet-stream`

### Single-Flight Cache (LOCKED — from SIDE-04)

- `Map<canonicalURL, Promise<Blob>>` keyed on the URL string AS PROVIDED (no fancy normalization in v0.28.0; URL canonicalization rules are NUB-RESOURCE spec territory in Phase 132)
- N concurrent `bytes(sameUrl)` calls share one in-flight Promise → 1 fetch, N resolutions of same Blob reference
- `hydrateResourceCache(entries)` pre-populates the cache from sidecar entries; subsequent `bytes(url)` for those URLs resolves synchronously (Promise.resolve(blob))

### AbortSignal Cancellation (LOCKED — from RES-05)

- `bytes(url, { signal })` checks `signal.aborted` synchronously and rejects with `new DOMException('Aborted', 'AbortError')` (browser-standard `AbortError`-shaped) BEFORE sending any envelope
- If signal fires after dispatch but before result, send `resource.cancel` envelope and reject with `AbortError`
- Aborted requests are removed from `inflight` map so retries are possible

### Claude's Discretion

All file structure, JSDoc wording, internal helper names, and code organization at Claude's discretion. Mirror the established 9-NUB pattern (reference `packages/nub/src/identity/` and `packages/nub/src/notify/` as the canonical templates).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/nub/src/identity/` — current best-reference NUB triad (types/shim/sdk/index)
- `packages/nub/src/notify/` — alternative reference (similar request/result/error envelope shape)
- `packages/nub/src/config/` — most recent NUB; mirrors the request-result-error pattern with correlation IDs
- `packages/nub/package.json` — current `exports` map (9 NUB subpaths × multiple entries each); add 4 new resource entries
- `packages/nub/tsup.config.ts` — current entry array; add 4 new resource entries

### Established Patterns

- Each NUB has 4 files: `types.ts`, `shim.ts`, `sdk.ts`, `index.ts`
- `index.ts` is a barrel re-exporting from sibling files
- `installXShim()` registers the NUB's message router via `registerNub(domain, handler)` from `@napplet/core/dispatch`
- `requireNapplet()` guard at SDK call sites (mirrors identity/notify pattern)
- Correlation IDs use crypto.randomUUID() or similar; envelope id field is required
- Test fixture pattern: most NUBs do not have unit tests in `packages/nub/`; coverage lives in shim/sdk packages or downstream consumers
- ESM-only: no `.cjs`, all imports use `.js` extension for relative paths

### Integration Points

- `@napplet/core/dispatch` provides `registerNub(domain, handler)` — shim.ts uses this in `installResourceShim()`
- `@napplet/core/envelope` provides `NubDomain` (already includes `'resource'` from Phase 125) and the `NappletMessage` base type
- `@napplet/core/types` already declares `NappletGlobal.resource` namespace shape (Phase 125 deliverable) — shim's mount installs functions matching that shape
- Downstream Phase 128 imports `installResourceShim` and calls it from `@napplet/shim`
- Downstream Phase 129 re-exports `bytes`, `bytesAsObjectURL`, types, and `RESOURCE_DOMAIN` from `@napplet/sdk`
- Downstream Phase 127 imports `ResourceSidecarEntry` (type-only) from `@napplet/nub/resource/types`

</code_context>

<specifics>
## Specific Ideas

### Shim layout sketch (executor may refine)

```ts
// packages/nub/src/resource/shim.ts (rough sketch)
const RESOURCE_DOMAIN = 'resource' as const;
const inflight = new Map<string, Promise<Blob>>();
const pending = new Map<string, { resolve: (b: Blob) => void; reject: (e: Error) => void }>();

export function installResourceShim() { /* registerNub('resource', handleResourceMessage) */ }

export async function bytes(url: string, opts?: { signal?: AbortSignal }): Promise<Blob> {
  if (opts?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const cached = inflight.get(url);
  if (cached) return cached;
  const promise = new URL(url).protocol === 'data:' ? fetch(url).then(r => r.blob()) : sendBytesRequest(url, opts);
  inflight.set(url, promise);
  promise.finally(() => inflight.delete(url));
  return promise;
}

export function bytesAsObjectURL(url: string): { url: string; revoke: () => void } {
  let revoked = false;
  const promise = bytes(url).then(b => URL.createObjectURL(b));
  // synchronous handle — actual URL resolves async; revoke() awaits
  // ... details for the executor to figure out
}

export function hydrateResourceCache(entries?: ResourceSidecarEntry[]) { /* preload inflight from sidecar */ }
```

The synchronous `bytesAsObjectURL` return shape (`{ url, revoke }`) is awkward because the actual blob URL must wait for fetch. Executor decides: return a Promise-of-handle OR return a synchronous handle that exposes `.url` as a Promise OR expose `await handle.ready` pattern. The CONTEXT.md leaves this open — REQUIREMENT RES-06 only specifies signature shape, not async semantics.

</specifics>

<deferred>
## Deferred Ideas

- **URL canonicalization** for cache key (lowercase scheme, sort query params, etc.) — deferred to NUB-RESOURCE spec in Phase 132. v0.28.0 uses raw URL string.
- **Cache eviction policy** (LRU bounds) — deferred. v0.28.0 uses unbounded `inflight` map (acceptable since `inflight` only holds in-flight promises; once resolved, entries are deleted).
- **Persistent blob cache** beyond in-flight — out of scope for Phase 126; sidecar-pre-populated entries pass through `inflight` momentarily.
- **`hydrateResourceCache` lifetime** — sidecar entries expire when consumed by `bytes(url)`. No long-lived cache in v0.28.0.

</deferred>
