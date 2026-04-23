# Phase 127: NUB-RELAY Sidecar Amendment - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning
**Mode:** Auto-generated (additive wire amendment — discuss skipped)

<domain>
## Phase Boundary

Two additive changes to NUB-RELAY:

1. `RelayEventMessage` (in `packages/nub/src/relay/types.ts`) gets an optional `resources?: ResourceSidecarEntry[]` field. Type-only import of `ResourceSidecarEntry` from `../resource/types.js`. Old shells that omit the field continue to work identically.

2. `relay.subscribe()` shim (in `packages/nub/src/relay/shim.ts`) calls `hydrateResourceCache(msg.resources)` from `../resource/shim.js` BEFORE delivering the event to the napplet's `onEvent` callback. If `msg.resources` is undefined or empty, the call is a no-op. Behavior is invisible to the napplet caller — they get a regular event; subsequent `napplet.resource.bytes(url)` calls for sidecar-pre-populated URLs resolve from the resource shim's single-flight cache without postMessage round-trip.

NO sidecar policy negotiation (that's a Phase 132 spec concern). NO shell-side anything (this repo only ships protocol surface). The default-OFF privacy posture is documented in NUB-RELAY spec amendment in Phase 132 — this phase is the wire/code change only.

</domain>

<decisions>
## Implementation Decisions

### Wire Shape (LOCKED — from REQUIREMENTS.md SIDE-01..04)

- New optional field on `RelayEventMessage`: `resources?: ResourceSidecarEntry[]`
- `ResourceSidecarEntry` imported as type-only from `../resource/types.js` (resource NUB owns the type per NUB modular principle; relay NUB borrows it as type-only in-package reference)
- No version bump on the message type — additive optional field is additive

### Shim Behavior (LOCKED — from SIDE-03/SIDE-04)

- In the relay shim's incoming event handler (where `relay.event` envelopes are routed to per-subscription `onEvent` callbacks), invoke `hydrateResourceCache(msg.resources)` BEFORE the `onEvent(msg.event)` call
- `hydrateResourceCache` is already defined in `packages/nub/src/resource/shim.ts` (Phase 126 deliverable) — null-safe, treats undefined / empty as no-op
- Ordering matters: hydrate first, then deliver, so a synchronous `napplet.resource.bytes(url)` call inside `onEvent` resolves from cache

### Single-Flight Cache (LOCKED — from SIDE-04)

- The `inflight` Map in resource shim already enforces single-flight semantics (Phase 126 delivered)
- Sidecar entries hydrate INTO the same inflight Map via `Promise.resolve(entry.blob)`
- N concurrent `bytes(sameUrl)` calls share one in-flight Promise → 1 effective fetch, N consumers

### Claude's Discretion

- Exact placement of the `hydrateResourceCache` call within `relay/shim.ts` (the relay shim has multiple subscription paths — locate the correct one)
- JSDoc wording on the new `resources?` field (mention privacy considerations briefly + reference NUB-RELAY spec for default-OFF policy)
- Test scaffolding (if any). Existing pattern: most NUBs have no in-package unit tests; coverage lives in shim/sdk consumers

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/nub/src/relay/types.ts` — current `RelayEventMessage` shape; add optional `resources?: ResourceSidecarEntry[]` field
- `packages/nub/src/relay/shim.ts` — current `subscribe()` implementation; locate the inbound `relay.event` handler that calls `onEvent`
- `packages/nub/src/resource/types.ts` — exports `ResourceSidecarEntry` (Phase 126 deliverable)
- `packages/nub/src/resource/shim.ts` — exports `hydrateResourceCache(entries)` (Phase 126 deliverable)

### Established Patterns

- ESM-only with `.js` relative imports
- `import type` for type-only references (verbatimModuleSyntax enabled)
- Optional fields use TypeScript `?` syntax — no Optional<T> wrappers
- Cross-NUB imports within `@napplet/nub` use sibling relative paths (`../resource/types.js`), NOT the package name

### Integration Points

- `RelayEventMessage` is consumed by:
  - `@napplet/shim` central installer (Phase 128 will wire resource NUB into shim, but relay shim was already wired in v0.16.0)
  - `@napplet/sdk` re-exports relay types
  - Downstream consumers checking the wire shape
- `hydrateResourceCache(entries)` is called by relay shim — single new call site
- No package.json or tsup.config.ts changes (no new exports, no new entry points)

</code_context>

<specifics>
## Specific Ideas

Plan should fit in 1 plan with 2 tasks:
- Task 1: extend `relay/types.ts` with the `resources?` field (type-only change)
- Task 2: extend `relay/shim.ts` to call `hydrateResourceCache(msg.resources)` before `onEvent`

Smoke test acceptance criterion: a Node script that constructs a fake `relay.event` envelope with a `resources` array, calls the relay shim's event handler, then calls `bytes(sidecarUrl)` and verifies the Blob resolves WITHOUT a postMessage round-trip (would require a stub for `window.parent.postMessage` to detect).

</specifics>

<deferred>
## Deferred Ideas

- **Default-OFF policy enforcement** — NUB-RELAY spec amendment (Phase 132) documents the privacy rationale; this phase ships the wire/code only. The shell decides whether to populate `resources`; the napplet shim doesn't gate consumption.
- **Per-event-kind allowlist** — Phase 132 spec territory.
- **Sidecar TTL or expiry** — deferred. Sidecar entries hydrate into the inflight Map; per Phase 126 design, they're consumed when first read. Long-lived blob cache is a future milestone.

</deferred>
