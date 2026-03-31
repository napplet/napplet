# Phase 19: Service Discovery Protocol - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement kind 29010 REQ/EVENT/EOSE discovery flow — the runtime enumerates its service registry and generates synthetic response events. After this phase, a napplet can discover what services are available in its shell.

**NOTE:** This phase's discussion surfaced a significant architectural shift that affects Phase 18. ServiceHandler should handle raw NIP-01 messages (`handleMessage`), not just INTER_PANE topic events (`handleRequest`). Phase 18 is flagged for replanning. This context captures the revised architectural model.

</domain>

<decisions>
## Implementation Decisions

### Architectural shift: services handle raw NIP-01 messages
- **D-01:** ServiceHandler interface uses `handleMessage(windowId, message, send)` — services receive raw NIP-01 arrays (`['REQ', subId, ...filters]`, `['EVENT', event]`, `['CLOSE', subId]`, etc.) and respond via `send` callback. This replaces the INTER_PANE-only `handleRequest(windowId, topic, content, event)` from Phase 18 D-09. Phase 18 plans flagged for replanning.
- **D-02:** All services use the same interface. Relay pool receives `['REQ', ...]` and responds with `['EVENT', ...]` + `['EOSE', ...]`. Audio receives `['EVENT', event]` where kind=29003 and topic starts with `audio:`. Same interface, different messages.
- **D-03:** The runtime is a message router + filter layer. It routes NIP-01 messages to the right service. Cross-cutting concerns (ACL, replay, negotiation) are filters applied before dispatch. The runtime does not embed knowledge of how individual services work.

### Core capabilities as services
- **D-04:** Relay pool, cache, and signer are services — optional capabilities a shell may or may not provide. Shell implementors choose their own implementations (Applesauce, NDK, Snort worker, custom IndexedDB, etc.). They register via `registerService()` like any other service.
- **D-05:** A shell with no relay pool, no cache, no signer is valid — napplets can still communicate via inter-pane messaging only. Everything is optional except the runtime core (message routing, ACL enforcement, AUTH identity).
- **D-06:** Starting with low-level integration only. Services get raw NIP-01 messages and handle everything themselves (subscription management, EOSE, etc.). High-level coordination helpers (combining cache + relay, dedup, unified EOSE) can be built as utilities on top later — not part of the runtime core.

### Filters vs services (refined from Phase 18)
- **D-07:** Enforcement gates (ACL, negotiation checks) are NOT services. They are filters that affect routing. Everything else that processes requests IS a service — including relay pool, cache, signer, audio, notifications.
- **D-08:** AUTH handshake is runtime core — identity verification, not a service.

### Discovery protocol
- **D-09:** Kind 29010 discovery is handled by the runtime itself, not by a service. The runtime knows its own registry and generates synthetic EVENTs to answer discovery queries.
- **D-10:** Subscription lifecycle follows standard NIP-01 semantics. If napplet uses `query()` (REQ + auto-CLOSE after EOSE) — one-shot. If napplet uses `subscribe()` (REQ stays open) — runtime pushes new descriptors when services are registered dynamically via `registerService()`.
- **D-11:** Synthetic discovery events use sentinel values: zero-padded pubkey/sig, random hex id. Consistent with existing `runtime.injectEvent()` pattern.

### Service matching
- **D-12:** Name-only matching (carried from Phase 18 D-07). No semver version ranges.

### Claude's Discretion
- How the runtime determines message routing to services (kind-based, subscription-based, or hybrid)
- Internal data structures for tracking discovery subscriptions
- Whether `registerService()` validates the descriptor fields

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Service Discovery Protocol
- `SPEC.md` Section 11 — Service Discovery protocol design (kind 29010, s/v/d tags, lifecycle, routing)
- `SPEC.md` Section 12 — Protocol Layers (Layer 3 = optional services)

### Runtime Integration Points
- `packages/runtime/src/runtime.ts` lines 288-303 — Current INTER_PANE dispatch chain
- `packages/runtime/src/runtime.ts` lines 330-380 — handleReq() where kind 29010 interception goes
- `packages/runtime/src/runtime.ts` lines 636-650 — injectEvent() pattern for synthetic events (sentinel values)
- `packages/runtime/src/types.ts` lines 331-376 — RuntimeHooks interface

### Phase 18 Context (predecessor — being replanned)
- `.planning/phases/18-core-types-runtime-dispatch/18-CONTEXT.md` — Type migration decisions still valid (D-01 hard cut). Dispatch model superseded by this phase's D-01/D-02/D-03.

### Research
- `.planning/research/ARCHITECTURE.md` — Integration points analysis
- `.planning/research/PITFALLS.md` — Pitfall #3: kind 29010 has no synthetic response path (addressed by D-09)
- `.planning/research/FEATURES.md` — Ecosystem patterns for service discovery

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `runtime.injectEvent()` — existing pattern for creating synthetic events with sentinel pubkey/sig and random id. Reuse for discovery response events.
- `eventBuffer` subscription tracking — pattern for managing open subscriptions, delivering matching events. Discovery subscriptions that stay open after EOSE need similar tracking.

### Established Patterns
- RuntimeHooks DI — all I/O injected via hooks. Service registration extends this pattern.
- `relayPool.isAvailable()` / `cache.isAvailable()` — existing capability checks. These become service registration (present in registry = available).
- BusKind.SERVICE_DISCOVERY (29010) already reserved in `@napplet/core/constants.ts`.

### Integration Points
- `handleReq()` in runtime.ts — intercept kind 29010 REQs before routing to relay pool/cache
- `registerService()` / `unregisterService()` — new methods on runtime public API
- ServiceRegistry internal state — tracks all registered services for discovery enumeration
- Open discovery subscription tracking — for pushing new services to live subscribers

</code_context>

<specifics>
## Specific Ideas

- The ServiceHandler interface should be `handleMessage(windowId, message, send)` — raw NIP-01 messages in, responses via `send` callback. Same interface for all services regardless of what NIP-01 verbs they handle.
- Shell implementors choose their relay implementation (Applesauce, NDK, Snort, custom) and register it as a service. The runtime doesn't know or care what library backs the service.
- A napplet that only does inter-pane communication should work with a shell that has zero services registered.

</specifics>

<deferred>
## Deferred Ideas

- High-level coordination helper: `createCoordinatedRelay(pool, cache)` that combines relay + cache results with dedup and unified EOSE. Built as a utility on top of the low-level service interface, not part of runtime core.
- Per-service ACL capabilities — deferred to v0.5.0+
- Semver version range matching — deferred until needed
- Service dependency graphs — explicitly rejected

</deferred>

---

*Phase: 19-service-discovery-protocol*
*Context gathered: 2026-03-31*
