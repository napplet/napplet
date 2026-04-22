# Architecture Research — v0.28.0 Browser-Enforced Resource Isolation

**Domain:** Sandboxed iframe protocol SDK (postMessage JSON envelope, NUB-modular)
**Researched:** 2026-04-20
**Confidence:** HIGH (this repo's source tree is the source of truth; cross-repo coordination with `napplet/nubs` is the only MEDIUM-confidence area)
**Mode:** Subsequent-milestone integration — extending existing 14-package SDK with one new NUB + amendments to existing NUB-RELAY + vite-plugin

---

## Executive Summary

Browser-Enforced Resource Isolation lands as **one new NUB domain** plus **two surgical amendments** to existing wire surfaces. The change is *additive at the protocol layer* (one new NUB, one optional sidecar field on `relay.event`, one new `perm:strict-csp` capability) and *additive at the package layer* (one new `packages/nub/src/<resource>/` directory with `types.ts`/`shim.ts`/`sdk.ts`, plus matching subpath exports). Existing NUBs are untouched except NUB-RELAY which gains an *optional* sidecar field with a guaranteed-backward-compatible default of "absent".

The CSP enforcement is a **shell-side runtime concern, not a NUB**. CSP headers/meta-tags are emitted by the host shell when constructing the napplet iframe, and napplets observe CSP enforcement via the browser, not via the protocol. The protocol's only exposure is (a) the new resource NUB that becomes the only escape hatch from `connect-src 'none'`, and (b) a new `perm:strict-csp` capability on `shell.supports()` so napplets can detect they're running under enforced isolation. The vite-plugin's job in dev is to mirror this shell behavior so napplets don't develop under looser constraints than they ship under.

The build/dependency DAG is unchanged: `core → nub → {shim, sdk}`, with `vite-plugin` orthogonal. The new NUB lives in `packages/nub/src/<resource>/`; the central shim and SDK gain one more import block each, exactly matching the pattern from v0.25.0 (config) and v0.24.0 (identity). NUB-RELAY's amendment adds two optional fields to one type and one optional code path in the relay shim's `subscribe()` event handler. Total new files: ~4; modified files: ~7; spec files: 1 in this repo, 1–2 in the public `napplet/nubs` repo.

The single biggest open coordination point is **cross-repo spec authoring**. NUB-specs live in the public `napplet/nubs` repo (not this repo), so the new NUB-RESOURCE spec and the NUB-RELAY sidecar amendment must be drafted as PRs there *before or in parallel with* the implementation here. NIP-5D's Security Considerations amendment lives in this repo (`specs/NIP-5D.md`).

A secondary architectural question that this research surfaces but does not resolve: **demo napplets do not exist in this repo**. `pnpm-workspace.yaml` references `apps/*`, `apps/demo/napplets/*`, and `tests/fixtures/napplets/*`, but those directories were extracted to a separate repo at v0.13.0 and the workspace globs are now vestigial. Any "demo napplets exercising the model end-to-end" feature in PROJECT.md must either land in the downstream shell repo (and be referenced from this repo's research notes) or this repo must re-introduce a `tests/fixtures/napplets/` tree. This is a **scope decision for roadmap, not an implementation question**.

---

## Standard Architecture

### Existing System (pre-v0.28.0)

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SHELL (separate repo, not in monorepo)             │
│  ┌────────────────┐    ┌──────────────────┐    ┌────────────────┐    │
│  │  iframe        │    │  postMessage     │    │  ACL / dispatch │    │
│  │  factory       │    │  router          │    │  / NUB handlers │    │
│  └────────┬───────┘    └─────────┬────────┘    └────────────────┘    │
└───────────┼──────────────────────┼─────────────────────────────────────┘
            │                      │ postMessage (JSON envelope)
            ▼                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│              NAPPLET IFRAME (sandbox="allow-scripts")                 │
│                                                                       │
│   window.napplet (installed by @napplet/shim — side-effect import)   │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  .relay   .identity   .storage   .ifc   .keys   .media     │    │
│   │  .notify  .config     .shell.supports()                     │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│   Each namespace installed by @napplet/nub/<domain>/shim's            │
│     install<X>Shim() + handle<X>Message() functions                  │
│                                                                       │
│   @napplet/sdk: bundler-friendly named exports wrapping window.napplet│
└──────────────────────────────────────────────────────────────────────┘
```

### Post-v0.28.0 System (additive overlay)

```
┌──────────────────────────────────────────────────────────────────────┐
│                            SHELL (separate repo)                      │
│  ┌────────────────┐    ┌──────────────────┐    ┌────────────────┐    │
│  │  iframe        │    │  postMessage     │    │  ACL / dispatch │    │
│  │  factory       │◄┐  │  router          │    │                 │    │
│  │  + CSP headers │ │  └─────────┬────────┘    │ + RESOURCE NUB  │    │
│  │  + sandbox     │ │            │              │   handler       │    │
│  └────────┬───────┘ │            │              │ + scheme-pluggable │    │
│           │         │            │              │   URL fetcher       │    │
│           │         │            │              │ + SVG rasterizer    │    │
│           │         │            │              │ + private-IP block  │    │
│           │         │            │              │ + size cap/timeout  │    │
│           │         │            │              │ + content-hash cache │    │
│           │         │            │              └────────────────┘    │
│           │         │ (CSP enforcement: ambient browser concern;      │
│           │         │  delivered via iframe response headers and/or   │
│           │         │  meta tags inside napplet HTML at fetch time)   │
└───────────┼─────────┼──────────────────────────────────────────────────┘
            │ HTML w/ CSP meta + iframe attrs
            ▼         ▼
┌──────────────────────────────────────────────────────────────────────┐
│              NAPPLET IFRAME                                           │
│              sandbox="allow-scripts"                                  │
│              CSP: default-src 'self'; connect-src 'none';             │
│                   img-src blob:; media-src blob:; ...                 │
│                                                                       │
│   window.napplet                                                      │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  .relay (sidecar-aware)   .identity   .storage   .ifc      │    │
│   │  .keys  .media   .notify  .config                          │    │
│   │  .resource (NEW)  ←── only path to network-sourced bytes   │    │
│   │  .shell.supports('perm:strict-csp')  ←── new capability    │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│   Browser blocks any direct fetch — connect-src 'none' is enforced.   │
│   napplet.resource.bytes(url) → Blob (with blob:URL lifecycle helper)│
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities (additions only)

| Component | Owner | Responsibility | This-Repo File Path |
|-----------|-------|----------------|---------------------|
| Resource NUB types | This repo | Define `resource.bytes` request/response envelope, scheme list literal, sidecar payload shape | `packages/nub/src/<resource>/types.ts` (NEW) |
| Resource NUB shim | This repo | Promise-based `bytes(url) → Blob` wrapper; correlation-ID req/resp; blob-URL lifecycle helpers; sidecar consumption hooks | `packages/nub/src/<resource>/shim.ts` (NEW) |
| Resource NUB SDK | This repo | Named exports `resourceBytes()`, `resourceRevoke()`, etc. | `packages/nub/src/<resource>/sdk.ts` (NEW) |
| Resource NUB barrel | This repo | Re-exports + `registerNub()` placeholder | `packages/nub/src/<resource>/index.ts` (NEW) |
| Sidecar field on `relay.event` | This repo | Add optional `resources?: ResourceSidecar[]` to `RelayEventMessage` | `packages/nub/src/relay/types.ts` (MODIFY) |
| Sidecar consumption | This repo | Pre-populate napplet-side resource cache from sidecar before `onEvent` fires | `packages/nub/src/relay/shim.ts` (MODIFY) — handler in `subscribe()` |
| Central shim install | This repo | Import + wire `installResourceShim` + `handleResourceMessage` + `resource` namespace | `packages/shim/src/index.ts` (MODIFY) |
| Central SDK barrel | This repo | Add `resource` namespace + type re-exports + DOMAIN const + helper re-exports | `packages/sdk/src/index.ts` (MODIFY) |
| `NubDomain` literal + `NUB_DOMAINS` array | This repo | Add `'<resource>'` to union and array | `packages/core/src/envelope.ts` (MODIFY) |
| `NappletGlobal.resource` namespace | This repo | Add `resource: { bytes, revoke, ... }` to interface | `packages/core/src/types.ts` (MODIFY) |
| vite-plugin CSP injection | This repo | Optionally emit `<meta http-equiv="Content-Security-Policy">` in dev HTML matching shell's production policy | `packages/vite-plugin/src/index.ts` (MODIFY) |
| NIP-5D Security Considerations amendment | This repo | Document strict-CSP posture, MUST-NOT fetch directly, MUST route via resource NUB | `specs/NIP-5D.md` (MODIFY) |
| NUB-RESOURCE spec | **External repo** | Full message catalog, scheme registration semantics, error codes | `napplet/nubs/specs/NUB-RESOURCE.md` (NEW, separate repo) |
| NUB-RELAY sidecar amendment | **External repo** | Document optional sidecar field, semantics, ordering relative to event delivery | `napplet/nubs/specs/NUB-RELAY.md` (MODIFY, separate repo) |
| NUB-IDENTITY profile-picture clarification | **External repo** | Note that `picture` URLs MUST flow through resource NUB | `napplet/nubs/specs/NUB-IDENTITY.md` (MODIFY, separate repo) |
| NUB-MEDIA artwork clarification | **External repo** | Note that `artwork.url` MUST flow through resource NUB | `napplet/nubs/specs/NUB-MEDIA.md` (MODIFY, separate repo) |

---

## Per-Question Integration Plan

### Q1 — New NUB Package Layout

**Recommendation:** Follow the standard NUB pattern with two minor deviations driven by binary data and blob lifecycle.

**File layout** (matches identity / config / notify patterns exactly):

```
packages/nub/src/<resource>/
├── index.ts          # Barrel: re-exports types/shim/sdk; registerNub() placeholder
├── types.ts          # Wire envelope types (Request, Result, Error, Sidecar)
├── shim.ts           # window.napplet.resource installer + Promise-based API
└── sdk.ts            # Named exports for bundler consumers
```

**Standard pattern reference** (from `packages/nub/src/identity/`):
- `types.ts` exports: `DOMAIN` const, `<X>Message` base, request/result/error message interfaces, discriminated unions (`<X>OutboundMessage`, `<X>InboundMessage`, `<X>NubMessage`), and any payload value types (e.g., identity has `ProfileData`, `ZapReceipt`, `Badge`, `RelayPermission`).
- `shim.ts` exports: `installXShim()` (returns cleanup fn), `handleXMessage(msg)` (routes inbound result/error envelopes), and per-action public functions (`getPublicKey`, etc.) that build a request, postMessage to parent, and resolve a `pendingRequests` Map keyed on correlation ID.
- `sdk.ts` exports: `xPrefixedFunction()` named exports that delegate to `window.napplet.x.action()` at call time via a `requireX()` runtime guard.
- `index.ts` re-exports everything from types/shim/sdk and includes a stub `registerNub(DOMAIN, () => {})` call so `dispatch.getRegisteredDomains()` includes the new domain.

**Deviations needed for the resource NUB:**

1. **Binary data marshalling.** `resource.bytes` returns bytes, not JSON. The wire shape can be one of:
   - **(a) Transferable `ArrayBuffer`** in the result message: `{ type: 'resource.bytes.result', id, ok: true, mimeType: 'image/png', bytes: ArrayBuffer }`. postMessage natively supports `ArrayBuffer` as a transferable when listed in the second-arg transfer list, but with `targetOrigin === '*'` and structured-clone-as-copy (the default) you simply pay the copy cost. Acceptable for typical image payloads (≤2 MB).
   - **(b) `Blob` directly** in the message: `bytes: Blob`. postMessage can structured-clone Blobs across realms (browser-supported since Chrome 76 / Firefox 65). This is the cleanest API for the napplet because the shim hands the consumer a `Blob` it can pass straight to `URL.createObjectURL()`.
   - **(c) `Uint8Array`** wrapping an `ArrayBuffer`. Same constraints as (a) plus the typed-array view.

   **Recommendation: ship Blob (option b)** — it's the consumer's preferred type and structured clone handles it across the iframe boundary. Provide a `mimeType` field separately for clarity even though Blob carries it on `.type`. Reference for blob postMessage support: see "structured cloneable types" in HTML spec.

2. **Blob URL lifecycle helpers in the shim.** Once the napplet receives a Blob, it typically calls `URL.createObjectURL(blob)`. These URLs are scoped to the iframe document and leak memory if not revoked. The shim SHOULD provide a thin helper:

   ```typescript
   // packages/nub/src/<resource>/shim.ts
   export function bytes(url: string, opts?: ResourceBytesOptions): Promise<Blob>;
   export function bytesAsObjectURL(url: string, opts?: ResourceBytesOptions): Promise<{ url: string; revoke(): void }>;
   ```

   The `bytesAsObjectURL` form returns a paired `{ url, revoke }` so the napplet doesn't have to track the URL string separately. Lifecycle is napplet-owned — the shim does NOT auto-revoke.

3. **Scheme list as a string literal type, not exhaustive enum.** Schemes are pluggable; the wire MUST allow arbitrary scheme strings so the shell can register custom handlers. In `types.ts`:

   ```typescript
   /** Built-in scheme hints; shell may support additional schemes. */
   export type ResourceScheme = 'https' | 'blossom' | 'nostr' | 'data' | (string & {});
   ```

   The `(string & {})` trick keeps autocomplete suggestions while allowing any string.

4. **Sidecar payload type lives here, NOT in NUB-RELAY.** Even though the sidecar field appears on `RelayEventMessage`, the *type definition* of one sidecar entry — `{ url, mimeType, bytes }` — is owned by the resource NUB. NUB-RELAY imports the type from `@napplet/nub/<resource>/types`. This avoids circular ownership and matches the principle that "NUB packages own ALL their logic."

   **Decision needed in roadmap:** does this introduce a *type-only* dependency from `@napplet/nub/relay/types` → `@napplet/nub/<resource>/types`? It would, and it's fine because:
   - Both live inside the same `@napplet/nub` package — no cross-package dep edge.
   - The dependency is type-only (`import type`), so tree-shaking is unaffected.
   - `verbatimModuleSyntax: true` enforces that the import gets dropped at runtime.

   If you want to avoid even the in-package type dependency, the alternative is to inline a structurally-identical `ResourceSidecarEntry` type in NUB-RELAY's types and document that the canonical owner is NUB-RESOURCE. The roadmap should pick one explicitly.

---

### Q2 — Shim Integration

**The pattern is mechanical.** `@napplet/shim/src/index.ts` is a 212-line orchestrator that does five things for each NUB:

1. Import the NUB's `installXShim`, `handleXMessage`, and per-action functions.
2. Add a routing branch in `handleEnvelopeMessage()` that matches `type.startsWith('<domain>.')` and dispatches to `handleXMessage`.
3. Add the namespace to the `(window as ...).napplet = { ... }` object literal.
4. Call `installXShim()` in the initialization block at the bottom.
5. (Sometimes) export type augmentation via `declare global { interface Window { napplet: NappletGlobal } }` — already done once at the top, no repeat needed.

**For the resource NUB, the diff to `packages/shim/src/index.ts` looks like:**

```typescript
// 1. Add import (after other NUB imports, ~line 47):
import {
  installResourceShim,
  handleResourceMessage,
  bytes as resourceBytes,
  bytesAsObjectURL as resourceBytesAsObjectURL,
} from '@napplet/nub/<resource>/shim';

// 2. Add routing branch in handleEnvelopeMessage() (~line 100):
if (type.startsWith('resource.')) {
  handleResourceMessage(msg as { type: string; [key: string]: unknown });
  return;
}

// 3. Add namespace to window.napplet object (~line 178, after config block):
resource: {
  bytes: resourceBytes,
  bytesAsObjectURL: resourceBytesAsObjectURL,
},

// 4. Call installer in init block (~line 211):
installResourceShim();
```

**Install signature for a NUB that returns blobs:** identical to other NUBs. The blob handling lives entirely *inside* the NUB's shim module — `installResourceShim()` returns a cleanup function (or void, matching identity's pattern). The shim's responsibility is to set up the message router and per-request Promise plumbing; the data type returned to the napplet (Blob vs string vs object) is opaque to the central installer.

**One subtlety: handling `.error` envelopes.** Identity's central router (line 92) explicitly checks for `.endsWith('.result') || .endsWith('.error')` and routes both to the identity handler, while the identity handler internally checks for `.error` suffix to reject promises. This is identity-specific because identity has chatty result types. The resource NUB should probably do the same, since `resource.bytes.error` is a common case (network failure, blocked URL, oversized resource). **Recommendation: route `resource.*` (all of them) to `handleResourceMessage` and let the handler discriminate.** Cleaner than the identity pattern's outer-router-knows-suffixes approach.

**Cleanup ordering.** Other shims register no persistent listeners (each request manages its own listener) or one persistent listener (e.g., notify's interaction handlers). Resource NUB has no persistent listeners — every `bytes()` call creates a one-shot promise. So the install function returns a no-op cleanup that just clears `pendingRequests`, matching identity exactly.

---

### Q3 — Sidecar Field on `relay.event`

**Modification scope: surgical.** Two files change.

**Change 1 — `packages/nub/src/relay/types.ts`:**

```typescript
// Add at top, after other imports:
import type { ResourceSidecarEntry } from '../<resource>/types.js';
// ^^ OR define ResourceSidecarEntry inline here; see Q1 deviation 4 for the decision.

// Modify RelayEventMessage (~line 180):
export interface RelayEventMessage extends RelayMessage {
  type: 'relay.event';
  /** Subscription ID this event belongs to. */
  subId: string;
  /** The matching Nostr event. */
  event: NostrEvent;
  /**
   * Optional shell-pre-resolved resources referenced by this event's content/tags.
   * When present, the napplet's resource shim populates its cache from these
   * entries before the napplet sees the event, so subsequent
   * `napplet.resource.bytes(url)` calls resolve synchronously from cache.
   * Sidecar URLs are an OPTIMIZATION — napplets MUST NOT depend on sidecar
   * presence; the canonical fetch path is `resource.bytes(url)`.
   * @since v0.28.0
   */
  resources?: ResourceSidecarEntry[];
}
```

**Change 2 — `packages/nub/src/relay/shim.ts`:**

The shim's `subscribe()` function has a `handleMessage` listener (lines 53–69) that calls `onEvent(event)` for each `relay.event`. It needs to drain the sidecar *before* calling `onEvent`:

```typescript
if (msg.type === 'relay.event') {
  const evMsg = msg as RelayEventMessage;
  // NEW: hydrate the resource cache from sidecar BEFORE event delivery.
  // This is critical for ordering: the napplet's onEvent handler may
  // synchronously call resource.bytes() expecting cached resolution.
  if (evMsg.resources && evMsg.resources.length > 0) {
    // Import from <resource>/shim. The hydrate function is a NEW export.
    hydrateResourceCache(evMsg.resources);
  }
  onEvent(evMsg.event);
}
```

**Where does the sidecar consumption logic live?** Inside the resource NUB's shim, NOT in the relay shim. The relay shim imports a `hydrateResourceCache(entries)` function from `@napplet/nub/<resource>/shim` and calls it on each event with sidecar. This keeps:
- All resource cache state inside the resource shim (single source of truth).
- The relay shim ignorant of resource internals (just calls a function).
- The cross-NUB dependency narrow and one-directional (`relay/shim` → `<resource>/shim`).

**Is sidecar transparent or exposed to the napplet caller?** **Transparent.** The napplet calls `await napplet.resource.bytes(url)` regardless of whether the resource came via sidecar or via a follow-up roundtrip. Internally:
- If the URL is in the resource cache (sidecar pre-populated it), the Promise resolves with the cached Blob immediately, no postMessage needed.
- If not in cache, send `resource.bytes` envelope to shell, await `resource.bytes.result`.

This matches the design decision recorded in STATE.md: "Sidecar pre-resolution is an invisible optimization, not a separate API path." The napplet's API is `resource.bytes(url)` only.

**Cache key.** URL string verbatim. Sidecar populates with the same URL the event references. No content-hash exposure to the napplet — content-hashes stay shell-internal per the milestone decision.

**Cache eviction.** Open question for the roadmap: cache lifetime, max size, LRU vs FIFO. Initial recommendation: bounded LRU (e.g., 16 MB total) inside the resource shim. The shim owns this; protocol doesn't need to specify.

---

### Q4 — vite-plugin CSP Integration

**Existing plugin shape (read in `packages/vite-plugin/src/index.ts`, ~559 lines):**
- Single exported factory `nip5aManifest(options: Nip5aManifestOptions): Plugin`.
- `transformIndexHtml` injects meta tags: `napplet-aggregate-hash`, `napplet-type`, optional `napplet-requires`, optional `napplet-config-schema`.
- `closeBundle` (build only) walks `dist/`, hashes files, signs the kind 35128 manifest, writes `.nip5a-manifest.json`.

**Where CSP fits:** add a new Vite plugin option, `strictCsp?: boolean | StrictCspOptions`, that controls whether `transformIndexHtml` injects a `<meta http-equiv="Content-Security-Policy">` tag matching the production shell's expected policy. Reasoning:

- **(a) New option on existing plugin** — RECOMMENDED. The plugin already owns napplet HTML transformation. Splitting CSP into a separate plugin requires consumers to add two plugins to their vite.config; one plugin = one mental model. The plugin name `vite-plugin-nip5a-manifest` is slightly inaccurate but renaming is a separate concern.
- **(b) Separate plugin** (`@napplet/vite-plugin-csp`) — REJECTED. Adds package count without benefit; the build-time CSP and the manifest already share lifecycle (both are dev-mode quality-of-life features for napplet authors).
- **(c) Automatic / always-on** — REJECTED. Some napplet authors will want to test against looser CSP during local debugging; opt-in respects developer ergonomics.

**Default policy** (when `strictCsp: true`):

```
default-src 'self';
script-src 'self' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' blob: data:;
media-src 'self' blob:;
font-src 'self' blob: data:;
connect-src 'none';
object-src 'none';
frame-src 'none';
worker-src blob: 'self';
base-uri 'none';
form-action 'none';
```

The exact policy must match what the production shell emits — coordinate with the shell repo. The plugin SHOULD allow a custom policy override via `strictCsp: { policy: 'custom CSP string' }` for shells with non-default policies.

**Interaction with vite's HTML transform pipeline:** clean. `transformIndexHtml` already returns `IndexHtmlTransformResult` (an array of tag descriptors). Adding one more meta tag is one more entry in the existing array. No conflicts with vite's HMR client because the HMR script injection happens earlier in the pipeline and CSP `'self'` permits it (HMR client is served from the dev server origin). One caveat: `connect-src 'none'` blocks the HMR websocket. The plugin must either:
- Inject a relaxed CSP in dev (`connect-src 'self' ws://localhost:* wss://localhost:*`) and the strict CSP only on `vite build`.
- OR document that strict-CSP dev mode disables HMR (a worse experience).

**Recommendation:** dev-mode CSP includes `connect-src ws://localhost:* wss://localhost:*` for HMR; build-mode CSP enforces `connect-src 'none'`. The `transformIndexHtml` hook can detect mode via the `ctx.bundle` parameter (only present at build time) or via `config.command === 'build'` checked in `configResolved`. Both are well-documented vite hooks.

**The plugin already does mode-aware behavior** — see `closeBundle` skipping when `VITE_DEV_PRIVKEY_HEX` is unset, suggesting tolerance for dev/build divergence is already a design pattern here.

---

### Q5 — Shell-Side Machinery (Out-of-Repo Promises)

The protocol's Spec Amendments must promise enough behavior that any conformant shell can be built from scratch. This research enumerates the MUST/SHOULD/MAY surface; the actual NUB-RESOURCE spec PR drafts the exact wording.

**MUST** (failure to comply means the shell is non-conformant):

- Shell MUST respond to every `resource.bytes` request with either a `resource.bytes.result` (success) or `resource.bytes.error` (failure) envelope using the same correlation `id`.
- Shell MUST NOT return raw SVG bytes for SVG resources; SVG MUST be rasterized to PNG/WebP at the requested dimensions before the result is sent.
- Shell MUST enforce its own CSP policy in iframe construction; the napplet protocol does not police the shell.
- Shell MUST reject `resource.bytes` requests for schemes it does not register a handler for, returning `resource.bytes.error` with code `unsupported-scheme`.
- Shell MUST NOT expose content hashes to napplets (hashes are internal cache keys only).

**SHOULD** (defaults that conformant shells follow unless they have a documented reason not to):

- Shell SHOULD respond within 5 seconds for typical resources (heuristic; not enforceable from napplet side). For long-running fetches, the shell MAY send an interim `resource.bytes.pending` envelope to acknowledge receipt without final delivery — this avoids napplet-side timeouts.
- Shell SHOULD cache resources by content hash internally and serve duplicates from cache.
- Shell SHOULD enforce per-napplet resource fetch rate limits (e.g., 60 requests/min per dTag).
- Shell SHOULD enforce a maximum resource size (default: 10 MB; configurable per scheme).
- Shell SHOULD block private-IP and localhost destinations for `https:` scheme by default (SSRF mitigation).
- Shell SHOULD validate MIME type against expected categories (image/*, application/octet-stream for blossom:, etc.) before delivery.
- Shell SHOULD include sidecar entries on `relay.event` for event content that contains URLs the shell can pre-resolve (NIP-92 imeta tags, profile pictures referenced by p-tag identities, etc.).

**MAY** (optimizations and shell-specific behaviors):

- Shell MAY transform resources beyond rasterization (e.g., resize images, transcode audio) per scheme handler discretion.
- Shell MAY return `resource.bytes.error` with code `consent-required` if user consent is needed before fetching (e.g., first time fetching from a new domain). The napplet retries the request after the user grants consent through shell UI.
- Shell MAY register additional schemes beyond the four documented in NUB-RESOURCE.

**Napplet-side timeout policy.** The shim should default to a generous timeout (e.g., 30 seconds, matching identity's `REQUEST_TIMEOUT_MS = 30_000`) and reject the Promise with a clear error if the shell never responds. Document this in the shim's JSDoc.

---

### Q6 — Capability Negotiation: CSP as Shell Policy, Not NUB

**Recommendation: split the negotiation into two orthogonal capabilities.**

1. **`shell.supports('<resource>')`** (or `'nub:<resource>'`) — declares the shell implements the resource NUB. Required for the napplet to call `napplet.resource.bytes()` at all.

2. **`shell.supports('perm:strict-csp')`** — declares the shell enforces strict CSP (`connect-src 'none'` minimum) on this napplet's iframe. Informational only — napplets cannot bypass CSP regardless of this value; it lets napplets self-detect their security posture.

**Why split?**

- A shell could implement the resource NUB *without* enforcing strict CSP (e.g., a permissive dev shell that allows direct fetches but also offers the resource API for cross-scheme convenience). Coupling them would force every resource-NUB shell to be a strict-CSP shell.
- A shell could enforce strict CSP *without* implementing the resource NUB (this leaves napplets with no escape hatch — almost certainly a bug, but the protocol shouldn't preclude it).
- The CSP capability is in the `perm:` namespace per the existing `NamespacedCapability` pattern (see `packages/core/src/envelope.ts:104-107`). `perm:` is for "the shell grants this permission/posture"; `nub:` is for "the shell implements this NUB." CSP is a shell posture, not a NUB.

**Conformance implication.** A shell that advertises `perm:strict-csp` SHOULD also advertise `<resource>` — otherwise the napplet has no way to load any network-sourced bytes. Document this as a conformance recommendation in NIP-5D's Security Considerations amendment.

**Type system change.** The `NamespacedCapability` union (`packages/core/src/envelope.ts:104`) already accepts `` `perm:${string}` `` for any permission, so no type change is needed for `perm:strict-csp`. The `NubDomain` literal (`packages/core/src/envelope.ts:66`) and `NUB_DOMAINS` array (line 79) DO need to add `'<resource>'`.

---

### Q7 — Build / Dependency Order

**Existing DAG** (verified from package.json files):
- `@napplet/core` — zero deps
- `@napplet/nub` — depends on `@napplet/core` (workspace:*); peer dep on `json-schema-to-ts` (optional)
- `@napplet/shim` — depends on `@napplet/core` + `@napplet/nub` (both workspace:*)
- `@napplet/sdk` — depends on `@napplet/core` + `@napplet/nub` (both workspace:*)
- `@napplet/vite-plugin` — independent (depends on vite, json-schema, crypto, fs, path; nostr-tools dynamic-imported)
- 9 deprecated `@napplet/nub-<domain>` packages — re-export `@napplet/nub/<domain>` (slated for removal)

**v0.28.0 phase ordering** (each phase is internally consistent and can be PR'd separately):

**Phase 1 — Core type surface.** Modify `packages/core/src/envelope.ts` to add `'<resource>'` to `NubDomain` and `NUB_DOMAINS`. Modify `packages/core/src/types.ts` to add `resource: { ... }` to `NappletGlobal`. Build core. (No downstream impact yet because no NUB exists.)

**Phase 2 — Resource NUB scaffold.** Create `packages/nub/src/<resource>/{types,shim,sdk,index}.ts`. Add 4 entries to `packages/nub/tsup.config.ts` `entry` map. Add 4 entries to `packages/nub/package.json` `exports` map (`<resource>`, `<resource>/types`, `<resource>/shim`, `<resource>/sdk`). Build nub package. The NUB compiles in isolation; nothing imports it yet.

**Phase 3 — NUB-RELAY sidecar amendment.** Modify `packages/nub/src/relay/types.ts` to add optional `resources?: ResourceSidecarEntry[]` to `RelayEventMessage`. Modify `packages/nub/src/relay/shim.ts` to call `hydrateResourceCache()` on sidecar before `onEvent`. Add `hydrateResourceCache` export to resource shim. Build. Existing relay tests still pass because field is optional.

**Phase 4 — Shim integration.** Modify `packages/shim/src/index.ts` per Q2. Build shim. The new `window.napplet.resource` namespace is now available in any napplet that imports `@napplet/shim`.

**Phase 5 — SDK integration.** Modify `packages/sdk/src/index.ts` per Q2 (add `resource` namespace, type re-exports, `RESOURCE_DOMAIN` constant, helper re-exports). Build sdk.

**Phase 6 — vite-plugin CSP.** Modify `packages/vite-plugin/src/index.ts` to add `strictCsp` option and CSP meta-tag injection in `transformIndexHtml`. Mode-aware: dev allows HMR connect-src, build enforces strict. Build vite-plugin.

**Phase 7 — Spec amendments (this repo).** Modify `specs/NIP-5D.md` to add Security Considerations subsection on strict-CSP posture and the resource NUB as the canonical fetch path.

**Phase 8 — Spec amendments (cross-repo, `napplet/nubs`).** Draft NUB-RESOURCE PR. Draft NUB-RELAY sidecar amendment PR. Draft NUB-IDENTITY profile-picture clarification PR. Draft NUB-MEDIA artwork clarification PR. (See Q8 for cross-repo coordination strategy.)

**Phase 9 — Demo napplets / fixtures.** See Q9 — the location of these is a roadmap-level scope decision.

**Phase 10 — Documentation sweep.** Update READMEs (`README.md`, `packages/core/README.md`, `packages/nub/README.md`, `packages/shim/README.md`, `packages/sdk/README.md`, `packages/vite-plugin/README.md`), and `skills/build-napplet/SKILL.md` to cover the new resource NUB and CSP-aware development.

**Critical-path observation:** Phases 1-2 are blocking for everything else. Phases 3-6 are independent and can be parallelized once 1-2 land. Phases 7-9 can land any time after 1-6. Phase 10 is best done after 1-9 to avoid doc churn.

**Build order at `pnpm -r build` time** is handled by turborepo's `dependsOn` graph based on workspace deps. No manual ordering needed; turborepo will build core → nub → shim/sdk in parallel (and vite-plugin independently). This is already proven by 27 prior milestone builds.

---

### Q8 — Spec Amendments: Cross-Repo Story

**This repo owns:**
- `specs/NIP-5D.md` — the transport+identity+manifest+NUB-negotiation NIP. Amendment scope: add Security Considerations subsection on strict-CSP posture, document `perm:strict-csp` capability, document that resource NUB (when shell supports it) is the canonical path for network-sourced bytes when CSP is strict.

**External repo owns** (`napplet/nubs`, public):
- `NUB-RESOURCE.md` — full new NUB spec. Drafted as a PR to napplet/nubs. Covers: message catalog (`resource.bytes`, `resource.bytes.result`, `resource.bytes.error`, optional `resource.bytes.pending`), scheme registration model, sidecar entry structure, error code taxonomy, shell behavior MUST/SHOULD/MAY (per Q5).
- `NUB-RELAY.md` amendment — add optional `resources` field to `relay.event` envelope, document semantics and ordering.
- `NUB-IDENTITY.md` clarification — note that `ProfileData.picture` URLs are normal URLs and napplets MUST fetch them via the resource NUB (not directly).
- `NUB-MEDIA.md` clarification — same for `MediaArtwork.url`.

**Coordination strategy:**

1. **Spec PRs first, then implementation.** Per the carried decision "NUB drafts are spec-backed" (memory MEMORY.md), napplet protocol work should not land implementation that contradicts an unmerged spec PR. Open the `napplet/nubs#NN` NUB-RESOURCE PR as a draft early in the milestone, even before Phase 2 of this repo. The implementation phases reference the draft PR for design alignment.

2. **Allow parallelism.** Once the NUB-RESOURCE draft PR is open and the core message catalog is stable (even if details like error codes are still being discussed), Phases 1–6 can proceed in this repo. The risk is implementation drift if the spec changes; mitigate by re-syncing with each spec PR revision.

3. **Public-repo hygiene.** Per memory `feedback_no_private_refs_commits.md`: nubs is PUBLIC; never mention `@napplet/*` packages in commits, PRs, or specs there. The NUB-RESOURCE PR must describe the wire format and shell behavior generically — no "@napplet/shim implements this." This is just a consistent process; it doesn't add work.

4. **Merge order.** The spec PRs in napplet/nubs SHOULD merge first or simultaneously with the implementation PR in this repo. The implementation milestone is "v0.28.0" and ships when both sides land; napplet/nubs has its own versioning independent of this repo.

5. **Defer NUB naming.** STATE.md notes "NUB naming" is one of the 7 open design questions. The roadmap should pick a name early because it touches every file path (`packages/nub/src/<resource>/`), every type name (`Resource*Message`, etc.), every domain string (`'resource.bytes'`), and the spec title. Recommendation: just call it `resource` — it's the concept, the API surface (`napplet.resource.bytes`), and the type prefix (`Resource*`). Brevity wins.

---

### Q9 — Demo Napplets

**Current state in this repo:** *No demo napplets exist.* The `pnpm-workspace.yaml` references three glob patterns — `apps/*`, `apps/demo/napplets/*`, `tests/fixtures/napplets/*` — but none of those directories exist on disk. They are vestigial from before the v0.13.0 demo extraction (when shell + demo were extracted to a separate repo). Workspace globs that don't match anything are silently ignored by pnpm.

**Confirmed by:**
- `ls /home/sandwich/Develop/napplet/apps` → No such file or directory
- `ls /home/sandwich/Develop/napplet/tests` → No such file or directory
- v0.13.0 milestone description in PROJECT.md: "Runtime, shell, ACL, services, and demo extracted to a separate repo."
- The only demo references found in `find` results are in `.claude/worktrees/agent-*/apps/demo/`, which are agent worktrees that are not part of the active repo state.

**Roadmap-level scope decision required.** The PROJECT.md target features include "Demo napplets exercising the model end-to-end (profile viewer, feed napplet with inline images, scheme-mixed consumer)." There are three options:

**Option A — Reintroduce a `tests/fixtures/napplets/` tree in this repo.** Pros: tests live with the protocol they exercise, tightening the feedback loop. Cons: requires also re-introducing a test harness (the workspace glob `tests/e2e/harness` is also vestigial), browser automation, etc. Significant build-out.

**Option B — Build demo napplets in the downstream shell repo.** Pros: shell + demos already separated; the resource NUB needs a shell to test against anyway, and that shell lives in the other repo. Cons: spec/implementation coordination across repos becomes the testing path.

**Option C — Thin in-repo fixture napplets that build to static HTML, exercised via a dedicated test that runs the napplet HTML in a Playwright iframe with a mock shell.** Pros: protocol-only test surface, no real shell coupling. Cons: a mock shell is a non-trivial second implementation; the v0.16.0 / v0.21.0 protocol changes that broke things would have shown up in such a harness.

**Recommendation:** Roadmap should default to **Option B** for v0.28.0 (let the shell repo own demo development; this repo ships SDK and types) and revisit **Option A or C** as a separate post-v0.28 milestone if the lack of in-repo end-to-end coverage continues to bite.

**Specific demos suggested by PROJECT.md:**
1. **Profile viewer** — exercises `napplet.identity.getProfile()` → `picture` URL → `napplet.resource.bytes(picture)` → render. Tests sidecar pre-population (shell can sidecar profile pictures with the kind 0 event).
2. **Feed napplet with inline images** — kind 1 events with NIP-92 imeta tags. Shell sidecars the imeta image bytes; napplet renders. Tests the happy path of sidecar optimization.
3. **Scheme-mixed consumer** — fetches one `https:` URL, one `blossom:` URL, one `data:` URL, one `nostr:` URL (kind 35128 napplet manifest, perhaps). Tests scheme-pluggable URL handling.

---

## Recommended Project Structure (Diff View)

```
packages/
├── core/
│   └── src/
│       ├── envelope.ts                           # MODIFY: add '<resource>' to NubDomain + NUB_DOMAINS
│       └── types.ts                              # MODIFY: add NappletGlobal.resource: { bytes, ... }
│
├── nub/
│   ├── package.json                              # MODIFY: add 4 export entries for <resource>/*
│   ├── tsup.config.ts                            # MODIFY: add 4 entry points for <resource>/{index,types,shim,sdk}
│   └── src/
│       ├── <resource>/                           # NEW DIRECTORY
│       │   ├── types.ts                          # NEW: DOMAIN, ResourceBytesMessage, ResourceBytesResultMessage, ResourceBytesErrorMessage, ResourceSidecarEntry, ResourceScheme, discriminated unions
│       │   ├── shim.ts                           # NEW: bytes(), bytesAsObjectURL(), hydrateResourceCache(), handleResourceMessage(), installResourceShim()
│       │   ├── sdk.ts                            # NEW: resourceBytes(), resourceBytesAsObjectURL() named exports
│       │   └── index.ts                          # NEW: barrel + registerNub() placeholder
│       ├── relay/
│       │   ├── types.ts                          # MODIFY: add resources?: ResourceSidecarEntry[] to RelayEventMessage
│       │   └── shim.ts                           # MODIFY: hydrateResourceCache() call before onEvent in subscribe()
│       └── (other NUBs: untouched)
│
├── shim/
│   └── src/
│       └── index.ts                              # MODIFY: import installResourceShim/handleResourceMessage/bytes/bytesAsObjectURL; route resource.* messages; mount window.napplet.resource; call installResourceShim() in init block
│
├── sdk/
│   └── src/
│       └── index.ts                              # MODIFY: add `export const resource = { ... }`; re-export resource types; export RESOURCE_DOMAIN; re-export resource SDK helpers
│
└── vite-plugin/
    └── src/
        └── index.ts                              # MODIFY: add strictCsp?: boolean | StrictCspOptions to Nip5aManifestOptions; conditional CSP meta tag in transformIndexHtml; mode-aware (dev relaxes connect-src for HMR)

specs/
└── NIP-5D.md                                     # MODIFY: Security Considerations subsection on strict-CSP posture and resource NUB

# Cross-repo (napplet/nubs, public):
specs/NUB-RESOURCE.md                             # NEW (separate repo PR)
specs/NUB-RELAY.md                                # MODIFY (separate repo PR) — add sidecar field
specs/NUB-IDENTITY.md                             # MODIFY (separate repo PR) — picture URL via resource NUB
specs/NUB-MEDIA.md                                # MODIFY (separate repo PR) — artwork URL via resource NUB
```

### Structure Rationale (deltas from existing)

- **`packages/nub/src/<resource>/` placement:** Identical to the established NUB pattern (identity, config, notify, etc.). Pattern-conformity is itself the rationale — no new layout invention required.
- **Resource NUB owns the sidecar type:** Matches the principle "NUBs own ALL their logic." NUB-RELAY only references the type by import; NUB-RESOURCE defines it.
- **CSP in vite-plugin (not a separate plugin):** Single integration point for napplet authors; existing plugin already owns dev-time HTML transformation.
- **Spec split between this repo and napplet/nubs:** Already established by prior milestones (v0.20.0 keys spec → nubs#9, v0.22.0 media → nubs#10, v0.23.0 notify → nubs#11, etc.). No new pattern.

---

## Architectural Patterns

### Pattern 1: NUB Module Triad (types / shim / sdk)

**What:** Every NUB ships three companion files in `packages/nub/src/<domain>/`: a `types.ts` declaring wire envelope types, a `shim.ts` installing `window.napplet.<domain>` and routing inbound envelopes, and an `sdk.ts` exporting bundler-friendly named functions that delegate to `window.napplet.<domain>` at call time.

**When to use:** Any new protocol capability that introduces wire messages.

**Trade-offs:**
- Pro: Cherry-pickable by bundler consumers (no whole-NUB-stack pull).
- Pro: Tree-shaking proven (39 bytes for types-only consumers per v0.26.0 audit).
- Con: Boilerplate triples per NUB; 4 entry points in tsup config per NUB.

**Example (how the new resource NUB looks at the file boundary):**

```typescript
// packages/nub/src/<resource>/types.ts
export const DOMAIN = 'resource' as const;

export interface ResourceMessage extends NappletMessage {
  type: `resource.${string}`;
}

export interface ResourceBytesMessage extends ResourceMessage {
  type: 'resource.bytes';
  id: string;
  url: string;
  /** Optional rendering hints (e.g., max dimensions for SVG rasterization). */
  hints?: { maxWidth?: number; maxHeight?: number; mimeType?: string };
}

export interface ResourceBytesResultMessage extends ResourceMessage {
  type: 'resource.bytes.result';
  id: string;
  ok: true;
  bytes: Blob;
  mimeType: string;
}

export interface ResourceBytesErrorMessage extends ResourceMessage {
  type: 'resource.bytes.error';
  id: string;
  ok: false;
  code: 'unsupported-scheme' | 'blocked-by-policy' | 'too-large' | 'timeout' | 'fetch-failed' | 'consent-required' | (string & {});
  error: string;
}

export interface ResourceSidecarEntry {
  url: string;
  bytes: Blob;
  mimeType: string;
}

export type ResourceScheme = 'https' | 'blossom' | 'nostr' | 'data' | (string & {});

// Discriminated unions (matches RelayOutboundMessage / RelayInboundMessage / RelayNubMessage convention)
export type ResourceOutboundMessage = ResourceBytesMessage;
export type ResourceInboundMessage = ResourceBytesResultMessage | ResourceBytesErrorMessage;
export type ResourceNubMessage = ResourceOutboundMessage | ResourceInboundMessage;
```

### Pattern 2: Promise/Correlation-ID Request-Response Shim

**What:** Each NUB shim that makes round-trip requests maintains a `Map<correlationId, { resolve, reject }>` of pending Promises. The action function generates a UUID, postMessages the request, and stores resolvers. The central `handleXMessage` router resolves/rejects by correlation ID when results arrive. Identity, storage, and config all use this pattern.

**When to use:** Any napplet → shell → napplet round-trip with a result.

**Trade-offs:**
- Pro: Standard async ergonomics (`await napplet.resource.bytes(url)`).
- Pro: Multiple in-flight requests are isolated.
- Con: Must always include a timeout to prevent leaked promises (identity uses `REQUEST_TIMEOUT_MS = 30_000`).

**Example (resource shim core):**

```typescript
// packages/nub/src/<resource>/shim.ts
const REQUEST_TIMEOUT_MS = 30_000;
const pendingRequests = new Map<string, { resolve: (b: Blob) => void; reject: (e: Error) => void }>();
const resourceCache = new Map<string, Blob>(); // sidecar-populated

export function bytes(url: string, opts?: { hints?: { maxWidth?: number; maxHeight?: number; mimeType?: string } }): Promise<Blob> {
  // Cache hit (sidecar pre-populated) → resolve synchronously
  const cached = resourceCache.get(url);
  if (cached) return Promise.resolve(cached);

  const id = crypto.randomUUID();
  return new Promise<Blob>((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    window.parent.postMessage({ type: 'resource.bytes', id, url, hints: opts?.hints } as ResourceBytesMessage, '*');
    setTimeout(() => {
      if (pendingRequests.delete(id)) reject(new Error(`resource.bytes timed out after ${REQUEST_TIMEOUT_MS}ms`));
    }, REQUEST_TIMEOUT_MS);
  });
}

export function handleResourceMessage(msg: { type: string; [k: string]: unknown }): void {
  if (msg.type === 'resource.bytes.result') {
    const r = msg as unknown as ResourceBytesResultMessage;
    const pending = pendingRequests.get(r.id);
    if (!pending) return;
    pendingRequests.delete(r.id);
    pending.resolve(r.bytes);
  } else if (msg.type === 'resource.bytes.error') {
    const r = msg as unknown as ResourceBytesErrorMessage;
    const pending = pendingRequests.get(r.id);
    if (!pending) return;
    pendingRequests.delete(r.id);
    pending.reject(new Error(`${r.code}: ${r.error}`));
  }
}

/** Called by NUB-RELAY's shim when a relay.event arrives with sidecar. */
export function hydrateResourceCache(entries: ResourceSidecarEntry[]): void {
  for (const entry of entries) resourceCache.set(entry.url, entry.bytes);
}

export function installResourceShim(): () => void {
  return () => {
    pendingRequests.clear();
    resourceCache.clear();
  };
}
```

### Pattern 3: Capability-Gated Feature with Permission Decoupling

**What:** Two orthogonal capability axes — `nub:` (does the shell implement this NUB?) and `perm:` (does the shell grant this permission/posture?) — let napplets check feature availability and security posture independently. Any code that depends on a NUB MUST guard with `shell.supports('<nub-name>')`; code that wants to know about security posture MUST guard with `shell.supports('perm:<posture-name>')`.

**When to use:** Whenever a feature has both an API dimension (NUB) and a policy dimension (permission/posture).

**Trade-offs:**
- Pro: Shells can mix-and-match (resource NUB without strict CSP, or vice versa).
- Pro: Type-system-enforced via existing `NamespacedCapability` union.
- Con: Two checks per resource use site. Mitigated by SDK-level helpers if pain emerges.

**Example:**

```typescript
// In a napplet:
import { resource } from '@napplet/sdk';

if (window.napplet.shell.supports('nub:<resource>')) {
  if (window.napplet.shell.supports('perm:strict-csp')) {
    // We're in strict-CSP mode — direct fetch() is blocked anyway.
    // The resource NUB is our only path. Use it confidently.
  }
  const profilePic = await resource.bytes(profile.picture);
} else {
  // Shell doesn't implement resource NUB.
  // Fallback: degrade UI to no images, or refuse to load.
}
```

---

## Data Flow

### Flow 1: Standard Resource Fetch (no sidecar)

```
napplet                                 shell
  │
  │ napplet.resource.bytes('https://...')
  │
  │  → postMessage({ type:'resource.bytes', id:'abc', url:'...' })
  │ ─────────────────────────────────────►│
  │                                        │ Receive envelope.
  │                                        │ ACL check: napplet allowed to fetch?
  │                                        │ Scheme handler: https → fetch policy:
  │                                        │   - private-IP block? size cap? timeout?
  │                                        │ Fetch bytes (cache by content hash).
  │                                        │ MIME classify; if SVG, rasterize.
  │ ◄───── postMessage({ type:'resource.bytes.result', id:'abc', ok:true, bytes:Blob, mimeType:'image/png' })
  │
  │ handleResourceMessage matches id, resolves Promise.
  │
  │ Caller receives Blob → URL.createObjectURL → render.
```

### Flow 2: Sidecar-Optimized Resource Fetch (zero round-trip)

```
napplet                                 shell
  │                                        │ Subscription has events with image URLs.
  │                                        │ Pre-fetch images opportunistically.
  │                                        │ Build relay.event with resources sidecar.
  │ ◄───── postMessage({
  │           type:'relay.event',
  │           subId:'sub-1',
  │           event: {... kind:1 ... },
  │           resources: [
  │             { url:'https://...', bytes:Blob, mimeType:'image/png' },
  │           ],
  │         })
  │
  │ Relay shim: hydrateResourceCache(resources) — populate resourceCache map.
  │ Relay shim: onEvent(event)
  │
  │ Caller iterates event content, finds URL.
  │ napplet.resource.bytes(url)
  │   → cache hit, returns Promise.resolve(blob) synchronously.
  │
  │ NO postMessage round-trip.
```

### Flow 3: Scheme-Mismatch / Policy Rejection Path

```
napplet                                 shell
  │
  │ napplet.resource.bytes('foo:weird-thing')
  │
  │  → postMessage({ type:'resource.bytes', id:'xyz', url:'foo:weird-thing' })
  │ ─────────────────────────────────────►│
  │                                        │ No handler registered for 'foo:' scheme.
  │ ◄───── postMessage({
  │           type:'resource.bytes.error',
  │           id:'xyz', ok:false,
  │           code:'unsupported-scheme',
  │           error:"no handler for scheme 'foo'"
  │         })
  │
  │ handleResourceMessage matches id, rejects Promise with Error('unsupported-scheme: ...').
  │
  │ Caller try/catch handles failure — degrade UI gracefully.
```

---

## Confidence Assessment

| Sub-question | Confidence | Sources |
|--------------|------------|---------|
| Q1 NUB layout follows established triad pattern | HIGH | Verified `packages/nub/src/identity/`, `notify/`, `config/` all match the pattern; `tsup.config.ts` already structured for it |
| Q1 Blob postMessage behavior | HIGH | HTML structured-clone spec + browser support tables (Chrome 76+, FF 65+) — well-established |
| Q2 Shim integration mechanics | HIGH | Read `packages/shim/src/index.ts` end-to-end; pattern is mechanical and proven across 9 NUBs |
| Q3 Sidecar field placement and shim hydration | HIGH | Reading `packages/nub/src/relay/{types,shim}.ts` — modification surface is unambiguous |
| Q4 vite-plugin CSP integration | MEDIUM | `transformIndexHtml` API is well-known, but interaction with HMR `connect-src` requires verification by trying it. Recommendation derived from generic vite knowledge + plugin source structure |
| Q5 Shell-side conformance promises | MEDIUM | Derived from CSP/SSRF best practices and prior NUB spec patterns; exact MUST/SHOULD threshold is a roadmap call |
| Q6 Capability split (`nub:resource` + `perm:strict-csp`) | HIGH | `NamespacedCapability` union in `packages/core/src/envelope.ts` already supports this exact pattern; matches existing `nub:`/`perm:`/`svc:` (now-removed) conventions |
| Q7 Build order | HIGH | Verified package.json dependency chains; turborepo already handles ordering correctly per 27 prior milestones |
| Q8 Cross-repo spec coordination | MEDIUM | Pattern verified against PROJECT.md milestone history (every NUB has a `napplet/nubs#NN` PR); cross-repo workflow is documented but not exhaustively tested for *amendments* (vs new specs) |
| Q9 Demo napplet location | HIGH | Confirmed by direct filesystem inspection: `apps/`, `tests/`, `tests/fixtures/napplets/` do not exist. Workspace globs are vestigial post-v0.13.0 extraction |

**Overall confidence:** HIGH on architectural integration (every modification point is named with file path and verified). MEDIUM on cross-repo coordination details (depends on `napplet/nubs` PR cadence) and on vite-plugin HMR/CSP interaction (needs validation). The "demo napplets do not exist in this repo" finding is HIGH confidence and warrants explicit roadmap discussion.

---

## Roadmap-Level Open Questions Surfaced by This Research

These are not for the architecture researcher to answer; flagging so the roadmap drafter accounts for them:

1. **NUB name.** STATE.md already lists this as deferred. Recommend `resource` (the concept, the API, the type prefix).
2. **Cache eviction policy in resource shim.** Bounded LRU at what size? Or unbounded with napplet-managed `revoke()`? Initial: 16 MB LRU.
3. **Sidecar type ownership.** Resource NUB owns the type and relay imports it (in-package type-only dep) — or duplicated structurally in both NUBs with one canonical owner per spec? Recommend the former.
4. **Demo napplet scope.** Option B (downstream shell repo owns demos) is the default this research recommends. Confirm or pick A/C.
5. **vite-plugin dev CSP relaxation for HMR.** Document that dev CSP allows `connect-src ws://localhost:* wss://localhost:*` for HMR; build CSP enforces strict. Confirm this matches developer experience expectations.
6. **CSP delivery mechanism in production.** Whose responsibility — shell HTTP headers, shell-injected meta tag in napplet HTML at iframe construction, or both? STATE.md flags as one of the 7 design questions. Spec should pick.
7. **Worker-src policy.** Does a napplet using a Web Worker need `worker-src blob:`? Specifying impacts the default policy in vite-plugin.
8. **`resource.bytes.pending` interim message.** Optional MAY in NUB-RESOURCE spec, or omit and rely on napplet timeouts? Recommend MAY.
9. **REQUIRE vs RECOMMEND for strict CSP in NIP-5D.** Is strict CSP a MUST (changes what counts as a conformant shell), a SHOULD (default but waivable), or a MAY (purely optional posture)? Hardest of the seven open questions; affects the security narrative of the entire NIP.

---

## Sources

| Source | Type | Confidence |
|--------|------|------------|
| `/home/sandwich/Develop/napplet/.planning/PROJECT.md` (read 397 lines) | This-repo authoritative | HIGH |
| `/home/sandwich/Develop/napplet/.planning/STATE.md` (read 80+ lines) | This-repo authoritative | HIGH |
| `/home/sandwich/Develop/napplet/specs/NIP-5D.md` (read 119 lines) | This-repo spec | HIGH |
| `/home/sandwich/Develop/napplet/packages/nub/src/identity/{shim,sdk,index,types}.ts` | This-repo source pattern reference | HIGH |
| `/home/sandwich/Develop/napplet/packages/nub/src/relay/{types,shim}.ts` | This-repo source modification target | HIGH |
| `/home/sandwich/Develop/napplet/packages/shim/src/index.ts` (read 212 lines) | This-repo shim orchestrator | HIGH |
| `/home/sandwich/Develop/napplet/packages/sdk/src/index.ts` (read 976 lines) | This-repo SDK barrel | HIGH |
| `/home/sandwich/Develop/napplet/packages/vite-plugin/src/index.ts` (read 559 lines) | This-repo plugin | HIGH |
| `/home/sandwich/Develop/napplet/packages/core/src/{envelope,types}.ts` | This-repo core types | HIGH |
| `/home/sandwich/Develop/napplet/packages/{nub,shim,sdk,core}/package.json` | This-repo dependency graph | HIGH |
| `/home/sandwich/Develop/napplet/packages/nub/tsup.config.ts` | This-repo build config | HIGH |
| `/home/sandwich/Develop/napplet/pnpm-workspace.yaml` | This-repo workspace globs | HIGH |
| `/home/sandwich/Develop/napplet/.planning/codebase/INTEGRATIONS.md` (read 187 lines) | This-repo integration audit (note: dated 2026-03-29; some content predates v0.13.0 extraction and is stale — relay/shell separation no longer holds) | MEDIUM |
| MDN: `postMessage` structured cloneable types (Blob, ArrayBuffer) | External | HIGH |
| MDN: Content-Security-Policy directives (`connect-src`, `img-src`, `worker-src`) | External | HIGH |
| Vite `transformIndexHtml` plugin hook documentation | External | HIGH |

**Sources NOT consulted** (context already sufficient):
- napplet/nubs repo current spec contents (out of this repo; coordination strategy documented without inspecting current draft state)
- Downstream shell repo (out of this repo; shell behavior promises drafted from CSP/SSRF best practices and prior NUB pattern)
