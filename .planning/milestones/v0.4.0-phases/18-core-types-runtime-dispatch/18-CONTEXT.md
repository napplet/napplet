# Phase 18: Core Types & Runtime Dispatch - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Move service type definitions to the correct packages (ServiceDescriptor to core, ServiceHandler/ServiceRegistry to runtime) and add generic topic-prefix service dispatch to the runtime's INTER_PANE handler. After this phase, the runtime can register service handlers and route INTER_PANE events to them by topic prefix.

</domain>

<decisions>
## Implementation Decisions

### Type migration strategy
- **D-01:** Hard cut — delete ServiceDescriptor, ServiceHandler, ServiceRegistry from @napplet/shell. Add ServiceDescriptor to @napplet/core. Add ServiceHandler and ServiceRegistry to @napplet/runtime. No re-exports for backwards compat. Consistent with the v0.2.0 ShellBridge rename approach.

### Service dispatch routing
- **D-02:** The runtime is a message router. It routes NIP-01 messages to the right service. Cross-cutting concerns (ACL, replay, negotiation) are filters applied before dispatch. The `shell:` namespace is reserved for core protocol commands (state, acl, create-window, dm) that stay hardcoded in the runtime.
- **D-03:** Delete the hardcoded `shell:audio-*` case from runtime.ts. Audio is not special — it will be a registered service like any other. No backwards compat for `shell:audio-*` prefix (alpha, no external consumers).
- **D-04:** The dispatch is fully generic — runtime routes messages to services based on registration. No service-specific logic in the runtime.

### Architectural distinction: filters vs services
- **D-05:** Enforcement gates (ACL, negotiation) are NOT services — they are filters that affect routing. Everything else that processes requests IS a service, including relay pool, cache, and signer. Shell implementors choose their own implementations. A shell with zero services is valid (local-only inter-pane).
- **D-06:** The dispatch chain is: enforce() gate → negotiation check (Phase 22) → shell:* core protocol commands → service dispatch → eventBuffer generic delivery. AUTH stays as runtime core (identity, not a service).

### Semver utility
- **D-07:** No semver utility in this phase. Service matching is name-only (presence/absence check). Version matching deferred until there's a real need (multiple incompatible service API versions in the wild). The `requires` manifest tag format is `["requires", "service-name"]` with no version range.

### RuntimeHooks.services shape
- **D-08:** Both static and dynamic registration. RuntimeHooks accepts an optional `services?: ServiceRegistry` for declaring services at creation time. The runtime object also exposes `registerService(name, handler)` for adding services after creation.
- **D-09:** ~~ServiceHandler.handleRequest() signature~~ **REVISED (Phase 19 discussion):** ServiceHandler uses `handleMessage(windowId: string, message: unknown[], send: (msg: unknown[]) => void): void` — services receive raw NIP-01 arrays and respond via `send` callback. Same interface for all services: relay pool handles `['REQ', ...]`, audio handles `['EVENT', event]` with topic prefix. Low-level integration — services manage their own subscription lifecycle.

### Claude's Discretion
- Internal naming of the service dispatch function in runtime.ts
- Whether to use a Map or plain object for the runtime's internal service registry
- Exact placement of the unregisterService() method (if needed alongside registerService)
- How to handle registration of a service name that's already registered (overwrite vs error)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Service Discovery Protocol
- `SPEC.md` Section 11 — Service Discovery protocol design (kind 29010, s/v/d tags, lifecycle, routing, backwards compat)
- `SPEC.md` Section 12 — Protocol Layers (Layer 3 = optional services)

### Existing Type Definitions (source of migration)
- `packages/shell/src/types.ts` lines 218-336 — Current ServiceDescriptor, ServiceHandler, ServiceRegistry, and ShellHooks.services definitions
- `packages/shell/src/index.ts` lines 38-40 — Current shell exports of service types

### Runtime Integration Points
- `packages/runtime/src/runtime.ts` lines 288-303 — INTER_PANE dispatch chain (where service routing inserts)
- `packages/runtime/src/runtime.ts` lines 481-600 — handleShellCommand() (shell:* namespace, stays as-is)
- `packages/runtime/src/types.ts` lines 331-376 — RuntimeHooks interface (where services field is added)

### Core Constants
- `packages/core/src/constants.ts` line 63 — BusKind.SERVICE_DISCOVERY (29010, already reserved)

### Research
- `.planning/research/ARCHITECTURE.md` — Integration points and build order analysis
- `.planning/research/PITFALLS.md` — Timing, routing, and migration pitfalls

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- ServiceDescriptor/ServiceHandler/ServiceRegistry interfaces in `packages/shell/src/types.ts` — move as-is (signatures don't change)
- `handleShellCommand()` pattern in runtime.ts — model for how service dispatch branches

### Established Patterns
- RuntimeHooks DI pattern — all I/O injected via hooks, no direct browser APIs in runtime
- enforce() gate — all events pass through ACL check before dispatch. Service events go through this too.
- Topic-prefix routing — `shell:state-*`, `shell:*` already use prefix matching

### Integration Points
- `runtime.ts` INTER_PANE switch (line 288) — add service dispatch after shell:* checks
- `types.ts` RuntimeHooks interface (line 331) — add optional `services?: ServiceRegistry`
- Runtime interface (line 40 area) — add `registerService()` to public API
- `packages/core/src/index.ts` — add ServiceDescriptor export
- `packages/shell/src/types.ts` — remove ServiceDescriptor/Handler/Registry, remove from ShellHooks
- `packages/shell/src/index.ts` — remove service type exports

</code_context>

<specifics>
## Specific Ideas

- Registration should look like `runtime.registerService('audio', audioRequestHandler)` — the runtime is generic, doesn't know about specific services
- Dispatch should look like `services[requestedService].handleRequest()` — pure registry lookup, no conditionals per service

</specifics>

<deferred>
## Deferred Ideas

- Per-service ACL capabilities (service:audio, service:notifications) — deferred to v0.5.0+
- Migrating shell:state-* and shell:acl-* to registered services — explicitly rejected. These are core protocol, not services.
- Semver version range matching — deferred until multiple incompatible service versions exist in the wild
- Dynamic service hot-reload with change notifications — future milestone

</deferred>

---

*Phase: 18-core-types-runtime-dispatch*
*Context gathered: 2026-03-31*
