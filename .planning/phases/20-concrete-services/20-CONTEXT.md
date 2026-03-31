# Phase 20: Concrete Services - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement audio and notification services as ServiceHandlers in a new @napplet/services package, proving the pattern works end-to-end. Core infrastructure migration (relay pool, cache, signer becoming services) is split to a separate phase.

</domain>

<decisions>
## Implementation Decisions

### Service package location
- **D-01:** Create new @napplet/services package for reference service implementations. This is a reference implementation — the package structure communicates the architecture. Services being in a separate package tells future implementors "services are pluggable modules, not part of the shell adapter."
- **D-02:** @napplet/services depends on @napplet/core (for types) and @napplet/runtime (for ServiceHandler interface). Does NOT depend on @napplet/shell. Services are browser-agnostic.

### Audio service
- **D-03:** Audio service is browser-agnostic. Lives in @napplet/services, not @napplet/shell. Uses `handleMessage(windowId, message, send)` for napplet communication and callbacks/hooks for shell host UI notification (not `window.dispatchEvent` directly).
- **D-04:** Audio service is a state registry — tracks audio sources per window (nappClass, title, muted). Same functional scope as existing audio-manager.ts but reimplemented as a ServiceHandler.
- **D-05:** Audio topics use `audio:*` prefix: `audio:register`, `audio:unregister`, `audio:mute`, `audio:state-changed`. Napplets send these as kind 29003 INTER_PANE events. No `shell:audio-*` backwards compat.
- **D-06:** The existing audio-manager.ts in @napplet/shell can be removed or deprecated once the service version works. The shell adapter wires the audio service and provides browser-specific hooks (e.g., CustomEvent dispatch).

### Notification service
- **D-07:** Notification service is a state registry — tracks notifications per napplet (create, dismiss, read/unread). Shell host decides presentation (toast, badge, OS notification, etc.). Same architectural pattern as audio service.
- **D-08:** Notification topics use `notifications:*` prefix: `notifications:create`, `notifications:dismiss`, `notifications:read`, `notifications:list`. Napplets send these as kind 29003 INTER_PANE events.
- **D-09:** Browser-agnostic. Lives in @napplet/services alongside audio. Shell host wires presentation via callbacks.

### Core infrastructure scope
- **D-10:** Core infrastructure migration (relay pool, cache, signer becoming services) is SPLIT OUT of Phase 20 into a new phase. Phase 20 only implements audio + notifications to prove the ServiceHandler pattern.
- **D-11:** SVC-04 (core infra as discoverable services) moves to the new phase. Phase 20 requirements are SVC-01, SVC-02, SVC-03 only.

### Claude's Discretion
- Internal state management approach for notification service (Map, array, etc.)
- Callback interface shape for shell host UI notifications (onChange hook, event emitter, etc.)
- Whether audio and notifications export factory functions (`createAudioService()`) or class constructors
- Test strategy for verifying services in isolation vs integration

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Audio Implementation
- `packages/shell/src/audio-manager.ts` — Current audio-manager implementation (browser-specific, to be reimplemented as ServiceHandler)
- `SPEC.md` Section 6 — Audio management topics and behavior

### Service Discovery Protocol
- `SPEC.md` Section 11 — Service Discovery (kind 29010, ServiceDescriptor s/v/d tags)
- `SPEC.md` Section 11.3 — Service message routing via topic prefix

### Prior Phase Contexts
- `.planning/phases/18-core-types-runtime-dispatch/18-CONTEXT.md` — ServiceHandler.handleMessage() interface (D-09 revised), type locations, dispatch model
- `.planning/phases/19-service-discovery-protocol/19-CONTEXT.md` — Raw NIP-01 message interface (D-01), core capabilities as services (D-04), low-level integration (D-06)

### Package Architecture
- `packages/shell/src/types.ts` — Current ServiceDescriptor/Handler/Registry definitions (moving to core/runtime in Phase 18)
- `packages/core/src/constants.ts` — BusKind.INTER_PANE (29003), topic constants

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `audio-manager.ts` — functional model (register/unregister/mute/get/has) to replicate in ServiceHandler form
- `originRegistry` — used by audio-manager for iframe window references; NOT needed in browser-agnostic service (send() replaces direct postMessage)
- `tsup.config.ts` patterns from existing packages — copy for @napplet/services setup

### Established Patterns
- `createRuntime(hooks)` factory pattern — services may follow similar factory pattern (`createAudioService(options)`)
- State registry with version counter + change notification — audio-manager pattern to reuse
- No browser APIs in @napplet/runtime — services in @napplet/services should follow same principle

### Integration Points
- `runtime.registerService('audio', handler)` — how the shell wires audio service into the runtime
- `handleMessage(windowId, message, send)` — the interface services implement
- Shell adapter in @napplet/shell — wires @napplet/services implementations into the runtime, provides browser-specific callbacks

</code_context>

<specifics>
## Specific Ideas

- Services should be factory functions: `createAudioService(options?)` returning a ServiceHandler. This follows the existing `createRuntime(hooks)` pattern.
- The audio service's callback for shell UI notification should be simple — maybe just an `onChange?: (sources: Map<string, AudioSource>) => void` callback passed to the factory.
- The notification service should mirror audio's architecture closely — proving the pattern generalizes means the two services should look structurally similar.

</specifics>

<deferred>
## Deferred Ideas

- Core infrastructure services (relay pool, cache, signer) — new phase, split from Phase 20
- Browser Notification API integration — shell host concern, not the service itself
- Cross-napplet notification routing — could be built on top of inter-pane, but not needed to prove the pattern
- Notification persistence — shell host concern (localStorage, database, etc.)

</deferred>

---

*Phase: 20-concrete-services*
*Context gathered: 2026-03-31*
