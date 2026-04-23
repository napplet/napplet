# Phase 21: Shim Discovery API - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Expose service discovery functions on a window global so napplet code can query available services and check compatibility without imports. After this phase, napplets can call `window.napplet.discoverServices()` and get typed results.

</domain>

<decisions>
## Implementation Decisions

### Window global shape
- **D-01:** Discovery API lives on `window.napplet` — a new namespace, cleanly separated from `window.nostr` (NIP-07) and `window.nostrdb` (NIP-DB). Contains `discoverServices()`, `hasService()`, `hasServiceVersion()`.

### API surface
- **D-02:** `window.napplet.discoverServices()` returns `Promise<ServiceInfo[]>` where ServiceInfo has `name: string`, `version: string`, `description?: string` (matching ServiceDescriptor from core).
- **D-03:** `window.napplet.hasService(name: string)` returns `Promise<boolean>` — checks if a named service exists.
- **D-04:** `window.napplet.hasServiceVersion(name: string, version: string)` returns `Promise<boolean>` — checks if service exists with exact version match. Name-only matching is primary (Phase 18 D-07); this is a convenience for version-aware napplets.

### Discovery timing
- **D-05:** Discovery REQs go through the existing pre-AUTH message queue. If a napplet calls discoverServices() before AUTH completes, the REQ is buffered and sent after AUTH succeeds. The promise resolves after AUTH + discovery round-trip. Consistent with all other shim operations — zero special casing.

### Internal caching
- **D-06:** Shim caches discovery results after the first successful query. Subsequent calls to discoverServices(), hasService(), and hasServiceVersion() return cached results without firing another kind 29010 REQ. Cache is session-scoped (cleared on page reload).

### Claude's Discretion
- ServiceInfo type definition location (inline in shim or imported from core)
- Cache invalidation strategy (if needed beyond session scope)
- Whether window.napplet is installed at shim load time or lazily on first call
- Error handling for discovery failures (timeout, no response)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shim Implementation
- `packages/shim/src/index.ts` — Current shim initialization, window.nostr installation pattern (lines 257-289)
- `packages/shim/src/relay-shim.ts` — Existing subscribe() and query() functions that discovery wraps

### Service Discovery Protocol
- `SPEC.md` Section 11.2 — Discovery REQ/EVENT/EOSE flow, s/v/d tag schema
- `SPEC.md` Section 11.4 — Service lifecycle: "After AUTH completes, the napplet MAY send a REQ for kind 29010"

### Prior Phase Contexts
- `.planning/phases/18-core-types-runtime-dispatch/18-CONTEXT.md` — ServiceDescriptor type in core (D-01), name-only matching (D-07)
- `.planning/phases/19-service-discovery-protocol/19-CONTEXT.md` — Discovery handled by runtime (D-09), NIP-01 subscription semantics (D-10), sentinel event values (D-11)

### Core Constants
- `packages/core/src/constants.ts` — BusKind.SERVICE_DISCOVERY (29010)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `query()` in relay-shim.ts — one-shot REQ/EOSE pattern. `discoverServices()` is essentially `query([{ kinds: [29010] }])` with result parsing.
- `window.nostr` installation pattern in index.ts — exact pattern to follow for `window.napplet`
- Pre-AUTH message queue — discovery REQs flow through this automatically, no new code needed

### Established Patterns
- All shim public APIs are on window globals (window.nostr, window.nostrdb) — window.napplet follows this pattern
- Promise-based async APIs — all shim operations return promises
- Shim auto-initializes on import — window.napplet should be installed at load time

### Integration Points
- `packages/shim/src/index.ts` initialization section — add `window.napplet` installation
- New `packages/shim/src/discovery-shim.ts` — discovery logic module
- `packages/shim/src/types.ts` — export ServiceInfo type

</code_context>

<specifics>
## Specific Ideas

- `discoverServices()` is a thin wrapper: calls `query([{ kinds: [29010] }])`, parses s/v/d tags from response events, caches results, returns typed ServiceInfo array.
- `hasService()` and `hasServiceVersion()` call `discoverServices()` internally (leveraging cache) and filter the result.
- The window.napplet object should be installed during shim initialization, same pattern as window.nostr.

</specifics>

<deferred>
## Deferred Ideas

- `window.napplet.subscribe()` for live service change notifications — future, when dynamic registration matters
- `window.napplet.getCompatibilityReport()` — Phase 22 concern, not Phase 21
- Auto-discovery on init — deferred per milestone scoping (explicit calls for now)

</deferred>

---

*Phase: 21-shim-discovery-api*
*Context gathered: 2026-03-31*
