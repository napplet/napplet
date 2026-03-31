# Research Summary: v0.4.0 Feature Negotiation & Service Discovery

**Domain:** Service discovery protocol integration into existing napplet SDK
**Researched:** 2026-03-31
**Overall confidence:** HIGH

## Executive Summary

Service discovery for v0.4.0 is a well-scoped integration task, not a greenfield design. The protocol is already specified in SPEC.md Section 11, the event kind (29010) is reserved in @napplet/core, and the service type stubs (ServiceDescriptor, ServiceHandler, ServiceRegistry) exist in @napplet/shell/types.ts. The work is implementing what has been designed and wiring it into the existing four-package architecture.

The primary architectural decision is that service discovery dispatch belongs in @napplet/runtime, not @napplet/shell. The runtime already owns all message handling (REQ, EVENT, CLOSE, COUNT, AUTH). Adding service discovery to the shell would violate the clean separation established in v0.3.0 and prevent non-browser shells from supporting services. Core protocol types (ServiceDescriptor) move to @napplet/core; handler interfaces and dispatch logic go to @napplet/runtime; concrete service implementations (audio) stay in @napplet/shell.

The shim-side API is straightforward: `discoverServices()` uses the existing `query()` function to send a REQ for kind 29010, parses the response events, and caches the result for the session. Compatibility checking compares discovered services against `requires` tags from the napplet manifest. This is a small, focused addition to the shim's public API.

The audio service is the first concrete implementation and serves as the template for future services. It wraps the existing audioManager singleton as a ServiceHandler. A backwards-compatible migration path handles the `shell:audio-*` to `audio:*` topic prefix transition.

## Key Findings

**Stack:** No new dependencies. All features build on existing @napplet/core types, @napplet/runtime dispatch, and @napplet/shim query API.

**Architecture:** Service discovery lives in runtime (dispatch), core (types), and shim (client API). Shell provides concrete handlers. See ARCHITECTURE.md for exact integration points.

**Critical pitfall:** The audio topic prefix migration (`shell:audio-*` to `audio:*`) must be backwards-compatible. Breaking existing hyprgate napplets would create upgrade friction.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Core Types & Runtime Dispatch** - Foundation phase
   - Addresses: ServiceDescriptor in core, handleServiceDiscovery/routeServiceMessage in runtime, RuntimeHooks.services
   - Avoids: Starting shim/shell work before the protocol engine handles 29010

2. **Shell Adapter & Audio Service** - Wiring phase
   - Addresses: hooks-adapter pass-through, createAudioService(), service type migration from shell to runtime
   - Avoids: Breaking existing ShellHooks API

3. **Shim Discovery API** - Client-facing phase
   - Addresses: discoverServices(), hasService(), checkCompatibility(), export surface
   - Avoids: Auto-discovery on init (must be opt-in, post-AUTH)

4. **Manifest Requires & Compatibility Reporting** - Manifest phase
   - Addresses: vite-plugin requires option, meta tag injection, compatibility warnings
   - Avoids: Coupling manifest checking to core protocol flow (keep it shim-side)

5. **Integration Tests & Verification** - Validation phase
   - Addresses: End-to-end discovery flow, audio service routing, compatibility reporting
   - Avoids: Shipping without full-chain verification

**Phase ordering rationale:**
- Core types must exist before runtime dispatch can reference them
- Runtime dispatch must work before shell can wire services or shim can query them
- Shell and shim work can partially parallelize (both depend on runtime, not each other)
- Manifest requires is additive and independent of the core discovery flow
- Tests go last because they prove the full chain

**Research flags for phases:**
- Phase 1: Standard patterns -- follow existing handleReq/handleEvent dispatch
- Phase 2: Audio migration needs careful backwards-compat handling (see PITFALLS.md)
- Phase 3: Standard patterns -- follows existing query() usage in shim
- Phase 4: Low risk -- vite-plugin changes are additive config
- Phase 5: May need new test infrastructure for service discovery (mock service handlers)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new dependencies, all built on existing packages |
| Features | HIGH | SPEC.md Section 11 defines the protocol clearly |
| Architecture | HIGH | Working from direct code reading of all 4 packages |
| Pitfalls | HIGH | Audio migration is the main risk, well-understood |

## Gaps to Address

- **Version negotiation:** SPEC.md does not define how version ranges work in service discovery. If a napplet requires `audio@>=2.0.0` but the shell provides `1.0.0`, the format for version constraint checking is not specified. For v0.4.0, exact name matching (presence/absence) is sufficient. Semver range checking can be added later.
- **Per-service ACL:** SPEC.md Section 11.6 explicitly defers this. No work needed for v0.4.0 but should be flagged for v0.5.0.
- **Discovery timing:** If a napplet calls `discoverServices()` before AUTH completes, the REQ will be queued (existing pre-AUTH queue behavior). The shim should document that discovery must be called after AUTH. Whether to enforce this or let the queue handle it is a design decision for the implementation phase.
- **Service handler error responses:** SPEC.md does not specify how a service handler reports errors back to the napplet. The audio service currently has no error path. Future services (notifications with permission prompts) may need a response channel.

---

*Summary research: 2026-03-31*
