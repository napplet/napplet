# Phase 18: Core Types & Runtime Dispatch — Research

**Researched:** 2026-03-31
**Status:** Complete (derived from milestone-level research)

## Research Sources

Phase 18 research is fully covered by the v0.4.0 milestone-level research:

- `.planning/research/ARCHITECTURE.md` — Integration points, component boundaries, build order, data flow, code modification table
- `.planning/research/PITFALLS.md` — 15 pitfalls covering timing races, topic collisions, type migration, handler content validation, window cleanup

## Key Findings for Phase 18

### Scope (What Phase 18 Covers)

Phase 18 is **Steps 1-2** of the 6-step build order from ARCHITECTURE.md:

1. **Core types** — Move `ServiceDescriptor` to `@napplet/core` (shared type). Move `ServiceHandler` and `ServiceRegistry` to `@napplet/runtime` (runtime concern).
2. **Runtime dispatch** — Add `services?` to `RuntimeHooks`, implement topic-prefix routing in `handleEvent()` INTER_PANE case, add `registerService()` to Runtime public API, wire `onWindowDestroyed()` cleanup in `destroy()`.

Phase 18 does NOT include: service discovery protocol (Phase 19), concrete service implementations (Phase 20), shim discovery API (Phase 21), or negotiation/compatibility (Phase 22).

### Critical Decision: No Semver Utility

CONTEXT decision D-07 explicitly says "No semver utility in this phase." REQUIREMENTS CORE-03 says "Service matching is name-only (presence/absence check)." This contradicts ROADMAP success criterion #2 (semver utility). The CONTEXT decisions from `/gsd:discuss-phase` take precedence — they represent the user's explicit design intent. Phase 18 does NOT implement semver.

### Integration Points (from ARCHITECTURE.md)

| Package | File | Change |
|---------|------|--------|
| **core** | `types.ts` | ADD `ServiceDescriptor` interface |
| **core** | `index.ts` | ADD export for `ServiceDescriptor` |
| **runtime** | `types.ts` | ADD `ServiceHandler`, `ServiceRegistry` interfaces; ADD `services?` to `RuntimeHooks` |
| **runtime** | `runtime.ts` | MODIFY INTER_PANE handler to route service topics; ADD `registerService()` to Runtime interface; ADD `onWindowDestroyed()` calls in window cleanup |
| **runtime** | `index.ts` | ADD exports for `ServiceHandler`, `ServiceRegistry` |
| **shell** | `types.ts` | REMOVE `ServiceDescriptor`, `ServiceHandler`, `ServiceRegistry` definitions; IMPORT from core/runtime |
| **shell** | `index.ts` | CHANGE re-exports to point to core/runtime sources |
| **shell** | `hooks-adapter.ts` | ADD pass-through of `services` from `ShellHooks` to `RuntimeHooks` |

### Pitfalls Most Relevant to Phase 18

1. **Pitfall 2 (Topic collision)** — `shell:audio-*` hardcoded routing must coexist with new service dispatch. CONTEXT decision D-03 says to DELETE the hardcoded `shell:audio-*` case (alpha, no external consumers). Service dispatch goes AFTER `shell:*` prefix checks (D-02).
2. **Pitfall 4 (Breaking RuntimeHooks)** — `services?` field must be optional. Default: no services = dispatch is no-op.
3. **Pitfall 8 (Untrusted content)** — `handleRequest()` receives `content: unknown`. Runtime should catch JSON.parse errors before calling handler.
4. **Pitfall 15 (Missing onWindowDestroyed cleanup)** — Runtime must call `onWindowDestroyed()` on all handlers when a window is torn down.

### Dispatch Chain (from CONTEXT D-06)

```
enforce() gate → shell:state-* → shell:* core protocol → services[prefix] → eventBuffer generic delivery
```

The `shell:audio-*` case is deleted. Audio becomes a registered service using `audio:*` prefix.

### Validation Architecture

**Testable behaviors for Phase 18:**

1. `import { ServiceDescriptor } from '@napplet/core'` compiles
2. `import { ServiceHandler, ServiceRegistry } from '@napplet/runtime'` compiles
3. `ServiceDescriptor`, `ServiceHandler`, `ServiceRegistry` no longer exported from `@napplet/shell/types.ts` as locally-defined types (re-exports from core/runtime are acceptable)
4. `createRuntime({ ...hooks, services: { audio: handler } })` registers service
5. `runtime.registerService('test', handler)` adds a service at runtime
6. An INTER_PANE event with topic `audio:play` is routed to the `audio` service handler
7. An INTER_PANE event with topic `unknown:action` falls through to `eventBuffer`
8. `onWindowDestroyed()` is called on all handlers when a window is destroyed
9. Existing `shell:state-*` and `shell:*` routing is unaffected
10. `pnpm build` succeeds with no type errors across all packages

## RESEARCH COMPLETE
