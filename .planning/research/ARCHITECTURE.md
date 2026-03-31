# Architecture Patterns: Service Discovery & Feature Negotiation Integration

**Domain:** Service discovery protocol integration into existing four-package napplet SDK
**Researched:** 2026-03-31
**Overall confidence:** HIGH (working from existing codebase, SPEC.md Section 11, and established patterns)

## Recommended Architecture

### Core Insight: Service Discovery Is a Runtime Concern, Not a Shell Concern

The existing service type definitions (`ServiceDescriptor`, `ServiceHandler`, `ServiceRegistry`) live in `@napplet/shell/types.ts`. This was correct for the v0.3.0 design phase, but for implementation, service discovery dispatch **must live in `@napplet/runtime`** because:

1. The runtime owns `handleReq()` -- it must intercept `REQ` for kind 29010 and respond with service descriptors instead of forwarding to the relay pool.
2. The runtime owns `handleEvent()` -- it must route INTER_PANE events with service topic prefixes to the correct handler.
3. Third-party (non-browser) shells that depend on `@napplet/runtime` must also support service discovery.
4. The shell's role is to adapt browser APIs into `RuntimeHooks` -- service handlers that use browser APIs (like audioManager) provide their `ServiceHandler` implementation at the shell level, but the dispatch and discovery protocol lives in the runtime.

**This means:** Core types for service discovery move to `@napplet/core`. The service registry and dispatch logic live in `@napplet/runtime`. The shell provides concrete `ServiceHandler` implementations (audio service) and passes them through `RuntimeHooks.services`.

### Architecture Diagram

```
@napplet/core (zero deps)
  types.ts:       + ServiceDescriptor
  constants.ts:   BusKind.SERVICE_DISCOVERY = 29010  (already exists)
  topics.ts:      + SERVICE_DISCOVER topic constant

@napplet/runtime (core + acl)
  types.ts:       + RuntimeServiceHooks (ServiceHandler, ServiceRegistry)
                  + RuntimeHooks.services?: RuntimeServiceHooks
  service-dispatch.ts:  NEW  -- handleServiceDiscovery(), routeServiceMessage()
  runtime.ts:     MODIFIED -- wire service dispatch into handleReq + handleEvent

@napplet/shell (core + runtime)
  types.ts:       ServiceDescriptor, ServiceHandler, ServiceRegistry  REMOVE (moved to core/runtime)
                  ShellHooks.services remains, but type refs change to runtime types
  hooks-adapter.ts: MODIFIED -- pass shellHooks.services through to RuntimeHooks.services
  audio-service.ts: NEW  -- wraps audioManager as a ServiceHandler
  audio-manager.ts: UNCHANGED (remains browser-specific singleton)

@napplet/shim (core)
  discovery.ts:   NEW  -- discoverServices(), hasService(), requireServices()
  index.ts:       MODIFIED -- export discovery API
```

### Component Boundaries

| Component | Responsibility | Package | New/Modified |
|-----------|---------------|---------|-------------|
| **ServiceDescriptor** (type) | Metadata describing a service (name, version, description) | core | MOVED from shell |
| **ServiceHandler** (interface) | Handler contract for service implementations | runtime | MOVED from shell, adapted |
| **ServiceRegistry** (type) | Map of service name to handler | runtime | MOVED from shell |
| **service-dispatch.ts** | Intercept kind 29010 REQ, route service topic messages | runtime | NEW |
| **audio-service.ts** | Wraps audioManager as a ServiceHandler | shell | NEW |
| **discovery.ts** | Shim-side API: discover, check, require services | shim | NEW |
| **Manifest requires** | Napplet declares service dependencies in manifest tags | vite-plugin + shim | MODIFIED |
| **Compatibility checker** | Compare discovered services against manifest requires | shim | NEW (in discovery.ts) |

## Detailed Component Design

### 1. Core Types (what moves to @napplet/core)

`ServiceDescriptor` must move to core because both the runtime (which creates discovery response events) and the shim (which parses them) need the type. The type is already simple and has no dependencies.

```typescript
// @napplet/core/types.ts — additions

/**
 * Metadata describing a registered shell service.
 * Services are optional capabilities a shell provides beyond the core protocol.
 */
export interface ServiceDescriptor {
  /** Unique service identifier (e.g., 'audio', 'notifications'). */
  name: string;
  /** Semver version of the service implementation. */
  version: string;
  /** Human-readable description of the service. */
  description?: string;
}
```

Add a topic constant:

```typescript
// @napplet/core/topics.ts — additions

export const TOPICS = {
  // ... existing ...

  // ─── Service Discovery ─────────────────────────────────────────────────
  SERVICE_DISCOVER: 'service:discover',
} as const;
```

No new capability string is needed for v0.4.0. Per SPEC.md Section 11.6, service-level ACL is deferred. Discovery itself requires `relay:read` (it's a REQ), and service messages via INTER_PANE require `relay:write` -- both already exist.

### 2. Runtime Service Dispatch (new module: service-dispatch.ts)

The runtime needs two new capabilities:

**A. Handle kind 29010 REQ (discovery)**

When `handleReq()` sees a filter with `kinds: [29010]`, instead of forwarding to the relay pool, it generates synthetic EVENT responses from the service registry. This follows the same pattern as how the runtime handles bus-kind subscriptions today (the `isBusKind` check at line 340 of runtime.ts).

```typescript
// @napplet/runtime/service-dispatch.ts

import type { NostrEvent } from '@napplet/core';
import { BusKind } from '@napplet/core';
import type { SendToNapplet } from './types.js';

export interface ServiceDescriptorRuntime {
  name: string;
  version: string;
  description?: string;
}

export interface ServiceHandlerRuntime {
  descriptor: ServiceDescriptorRuntime;
  handleRequest(windowId: string, topic: string, content: unknown, event: NostrEvent): void;
  onWindowDestroyed?(windowId: string): void;
}

export type ServiceRegistryRuntime = Record<string, ServiceHandlerRuntime>;

/**
 * Handle a service discovery REQ.
 * Sends one kind 29010 EVENT per registered service, then EOSE.
 */
export function handleServiceDiscovery(
  windowId: string,
  subId: string,
  services: ServiceRegistryRuntime | undefined,
  sendToNapplet: SendToNapplet,
): void {
  if (services) {
    for (const handler of Object.values(services)) {
      const event: NostrEvent = {
        id: `svc-${handler.descriptor.name}-${Date.now()}`,
        pubkey: '__shell__',
        created_at: Math.floor(Date.now() / 1000),
        kind: BusKind.SERVICE_DISCOVERY,
        tags: [
          ['s', handler.descriptor.name],
          ['v', handler.descriptor.version],
          ...(handler.descriptor.description ? [['d', handler.descriptor.description]] : []),
        ],
        content: '{}',
        sig: '',
      };
      sendToNapplet(windowId, ['EVENT', subId, event]);
    }
  }
  sendToNapplet(windowId, ['EOSE', subId]);
}

/**
 * Route an INTER_PANE event to the matching service handler by topic prefix.
 * Returns true if a service handled the message, false otherwise.
 */
export function routeServiceMessage(
  windowId: string,
  event: NostrEvent,
  topic: string,
  services: ServiceRegistryRuntime | undefined,
): boolean {
  if (!services) return false;
  const colonIndex = topic.indexOf(':');
  if (colonIndex === -1) return false;
  const prefix = topic.slice(0, colonIndex);
  const handler = services[prefix];
  if (!handler) return false;

  let content: unknown;
  try { content = event.content ? JSON.parse(event.content) : {}; }
  catch { content = {}; }

  handler.handleRequest(windowId, topic, content, event);
  return true;
}
```

**B. Integrate into runtime.ts**

Two modification points in `createRuntime()`:

1. In `handleReq()`: detect kind 29010 filters, call `handleServiceDiscovery()`, skip relay pool.
2. In `handleEvent()` under `BusKind.INTER_PANE`: before the `shell:` prefix checks, try `routeServiceMessage()`. If a service handled it, return early.

The integration points are precise:

```
handleReq():
  Line 340 (isBusKind check) — add specific check for SERVICE_DISCOVERY kind
  Before relay pool subscribe — if filters match 29010, call handleServiceDiscovery and return

handleEvent():
  Line 289 (INTER_PANE case) — add routeServiceMessage() call before shell: prefix checks
  After topic extraction, before shell:state- check
```

**RuntimeHooks extension:**

```typescript
// @napplet/runtime/types.ts — addition to RuntimeHooks

export interface RuntimeHooks {
  // ... existing fields ...

  /** Optional service extensions. */
  services?: ServiceRegistryRuntime;
}
```

### 3. Shell Audio Service (new module: audio-service.ts)

The audio manager is currently handled as a special case in `runtime.ts` line 294-298 where `shell:audio-*` topics are just forwarded as inter-pane events. With the service pattern, this becomes a proper `ServiceHandler`:

```typescript
// @napplet/shell/audio-service.ts

import type { ServiceHandlerRuntime } from '@napplet/runtime';
import type { NostrEvent } from '@napplet/core';
import { audioManager } from './audio-manager.js';

export function createAudioService(): ServiceHandlerRuntime {
  return {
    descriptor: {
      name: 'audio',
      version: '1.0.0',
      description: 'Audio playback management and mute control',
    },

    handleRequest(windowId: string, topic: string, content: unknown, event: NostrEvent): void {
      const payload = content as Record<string, string>;
      switch (topic) {
        case 'audio:register':
          audioManager.register(windowId, payload.nappClass ?? '', payload.title ?? '');
          break;
        case 'audio:unregister':
          audioManager.unregister(windowId);
          break;
        case 'audio:state-changed':
          audioManager.updateState(windowId, { title: payload.title });
          break;
      }
    },

    onWindowDestroyed(windowId: string): void {
      audioManager.unregister(windowId);
    },
  };
}
```

**Note on backwards compatibility:** The existing `shell:audio-*` topic handling in runtime.ts (lines 294-298) must remain operational during migration. The migration path is:

1. Add service dispatch alongside existing `shell:audio-*` handling.
2. Register `createAudioService()` as the `audio` service handler.
3. Service dispatch intercepts `audio:*` topics (not `shell:audio-*`).
4. Deprecate `shell:audio-*` prefix in a later version.
5. Both prefixes work during the transition period.

**Decision point:** Either (a) migrate audio topics from `shell:audio-*` to `audio:*` immediately and break the old format, or (b) make the audio service handler respond to both prefixes during migration. Option (b) is safer for backwards compatibility.

### 4. Hooks Adapter Changes

The `adaptHooks()` function in `hooks-adapter.ts` needs to pass services through:

```typescript
// hooks-adapter.ts — additions

export function adaptHooks(shellHooks: ShellHooks, deps: BrowserDeps): RuntimeHooks {
  // ... existing adaptation ...

  return {
    // ... existing fields ...
    services: shellHooks.services
      ? Object.fromEntries(
          Object.entries(shellHooks.services).map(([name, handler]) => [name, handler])
        )
      : undefined,
  };
}
```

This is trivial because `ShellHooks.services` already has the right shape -- it just needs to be passed through. The shell's `ServiceHandler` and runtime's `ServiceHandlerRuntime` can share the same interface imported from runtime.

### 5. Shim Discovery API (new module: discovery.ts)

The shim needs a developer-friendly API for service discovery. This is a new module in `@napplet/shim`:

```typescript
// @napplet/shim/discovery.ts

import { subscribe, query } from './relay-shim.js';
import { BusKind } from './types.js';
import type { NostrEvent } from './types.js';

export interface DiscoveredService {
  name: string;
  version: string;
  description?: string;
}

/**
 * Discover all services the shell provides.
 * Sends a REQ for kind 29010, collects responses until EOSE.
 * Returns a map of service name to descriptor.
 */
export async function discoverServices(): Promise<Map<string, DiscoveredService>> {
  const events = await query({ kinds: [BusKind.SERVICE_DISCOVERY] });
  const services = new Map<string, DiscoveredService>();
  for (const event of events) {
    const name = event.tags.find(t => t[0] === 's')?.[1];
    const version = event.tags.find(t => t[0] === 'v')?.[1];
    const description = event.tags.find(t => t[0] === 'd')?.[1];
    if (name && version) {
      services.set(name, { name, version, description });
    }
  }
  return services;
}

/**
 * Check if a specific service is available.
 */
export async function hasService(name: string): Promise<boolean> {
  const services = await discoverServices();
  return services.has(name);
}

/**
 * Check manifest requires against discovered services.
 * Returns list of missing services.
 */
export async function checkCompatibility(
  requires?: string[],
): Promise<{ compatible: boolean; missing: string[] }> {
  if (!requires || requires.length === 0) {
    return { compatible: true, missing: [] };
  }
  const services = await discoverServices();
  const missing = requires.filter(name => !services.has(name));
  return { compatible: missing.length === 0, missing };
}
```

**Caching consideration:** `discoverServices()` should cache the result for the session. Service availability does not change after shell startup. A module-level cache with the promise stored avoids redundant REQs:

```typescript
let _discoveryPromise: Promise<Map<string, DiscoveredService>> | null = null;

export function discoverServices(): Promise<Map<string, DiscoveredService>> {
  if (!_discoveryPromise) {
    _discoveryPromise = _doDiscover();
  }
  return _discoveryPromise;
}
```

### 6. Manifest Requires Tags

Napplet manifests can declare service dependencies via `requires` tags in the NIP-5A manifest. The vite-plugin needs a configuration option:

```typescript
// @napplet/vite-plugin — config addition

export interface Nip5aManifestOptions {
  nappType: string;
  /** Services this napplet requires (e.g., ['audio', 'notifications']). */
  requires?: string[];
}
```

The plugin adds `['requires', 'audio']` tags to the kind 35128 manifest event and injects a meta tag:

```html
<meta name="napplet-requires" content="audio,notifications">
```

The shim reads this meta tag and feeds it to `checkCompatibility()`.

### 7. Compatibility Reporting

When a napplet discovers missing services, the shim surfaces this to the developer/user. Two levels:

1. **Console warning** (always): `[napplet] Missing required services: audio, notifications`
2. **Callback hook** (opt-in): The napplet registers a handler for compatibility issues.

```typescript
// @napplet/shim — compatibility surface

export function onCompatibilityIssue(
  callback: (missing: string[]) => void,
): void {
  // Called after discovery completes if required services are missing
}
```

The napplet developer can choose how to handle this -- show a banner, disable features, etc. The shim does NOT force any UI.

## Data Flow

### Service Discovery Flow (post-AUTH)

```
Napplet (shim)                        Shell (runtime)
     |                                      |
     |  discoverServices() called           |
     |                                      |
     |-- ['REQ', 'svc-xxx', {kinds:[29010]}] -->
     |                                      |
     |  handleReq detects kind 29010        |
     |  calls handleServiceDiscovery()      |
     |                                      |
     | <-- ['EVENT', 'svc-xxx', {kind:29010, tags:[['s','audio'],['v','1.0.0']]}]
     | <-- ['EVENT', 'svc-xxx', {kind:29010, tags:[['s','state'],['v','1.0.0']]}]
     | <-- ['EOSE', 'svc-xxx']              |
     |                                      |
     |  Parse events, build service map     |
     |  Check against manifest requires     |
     |  Report missing services             |
```

### Service Message Flow (runtime dispatch)

```
Napplet (shim)                        Shell (runtime)                  Service Handler
     |                                      |                              |
     |-- ['EVENT', {kind:29003,             |                              |
     |    tags:[['t','audio:register']],    |                              |
     |    content:'{"nappClass":"player"}'  |                              |
     |   }] -------------------------------->                              |
     |                                      |                              |
     |  handleEvent: kind 29003, INTER_PANE |                              |
     |  topic = 'audio:register'            |                              |
     |  routeServiceMessage():              |                              |
     |    prefix = 'audio'                  |                              |
     |    handler = services['audio']       |                              |
     |    handler.handleRequest() --------------------------------->       |
     |                                      |                   audioManager.register()
     |                                      |                              |
     | <-- ['OK', eventId, true, '']        |                              |
```

## Patterns to Follow

### Pattern 1: REQ Interception for Bus Kinds

**What:** Detect bus-kind-only REQs and handle them locally instead of forwarding to relay pool.
**When:** Kind 29010 discovery requests.
**Precedent:** The existing `isBusKind` check in `handleReq()` (line 340) already skips relay pool for all 29000-29999 kinds. Service discovery piggybacks on this pattern.
**Why this matters:** The runtime already sends EOSE for bus-kind-only REQs when the relay pool is unavailable (line 374). Service discovery should send its events BEFORE this EOSE, within the same subscription lifecycle.

### Pattern 2: Topic Prefix Routing

**What:** Extract the prefix before `:` in a topic string and dispatch to a handler map.
**When:** INTER_PANE events with service-prefixed topics.
**Precedent:** The existing `shell:state-*`, `shell:audio-*`, `shell:acl-*` routing in `handleEvent()` already does prefix-based dispatch, but with hardcoded `if/else` chains. The service registry generalizes this into a map lookup.
**Why this matters:** New services can be added without modifying runtime.ts -- they just register a handler.

### Pattern 3: Synthetic Shell Events

**What:** The runtime creates NostrEvent objects with `pubkey: '__shell__'` and empty `sig` for shell-originated responses.
**When:** Service discovery responses, state responses, audio mute notifications.
**Precedent:** `handleShellCommand()` already creates synthetic events with `pubkey: ''` (line 488-492). The `audioManager.mute()` creates events with `pubkey: '__shell__'` (line 105 of audio-manager.ts).
**Standardize:** Use `pubkey: '__shell__'` consistently for all shell-originated events. This is what SPEC.md Section 11.2 specifies.

### Pattern 4: Module-Level Promise Cache (Shim)

**What:** Cache the discovery result as a module-level promise so repeated calls reuse the same query.
**When:** `discoverServices()` in the shim.
**Precedent:** The shim already uses module-level state for keypair management (`keypairReady` promise, line 96 of index.ts). Same pattern, same module.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Service Types in Shell Only

**What:** Keeping `ServiceDescriptor`, `ServiceHandler`, `ServiceRegistry` only in `@napplet/shell/types.ts`
**Why bad:** The runtime needs these types to perform dispatch, and the shim needs `ServiceDescriptor` to parse discovery responses. Importing from shell would create a circular dependency (shim depends on shell).
**Instead:** `ServiceDescriptor` lives in core. `ServiceHandler` and `ServiceRegistry` live in runtime. Shell re-exports for backwards compatibility.

### Anti-Pattern 2: Discovery in the Shell Bridge

**What:** Adding service discovery handling to `shell-bridge.ts` or `hooks-adapter.ts` instead of the runtime.
**Why bad:** This defeats the purpose of the runtime extraction in v0.3.0. Non-browser shells would not get service discovery. Every shell implementation would need to duplicate the discovery logic.
**Instead:** All protocol logic lives in the runtime. Shell only adapts browser APIs.

### Anti-Pattern 3: New Capability for Service Discovery

**What:** Adding `service:discover` as a new Capability string to gate discovery REQs.
**Why bad:** Discovery is a standard REQ for kind 29010. The existing `relay:read` capability already gates all REQs. Adding a separate capability for discovery creates unnecessary ACL complexity and breaks the principle that discovery should "just work" for any authenticated napplet.
**Instead:** Use existing `relay:read` for discovery REQs. Defer per-service capabilities to a future version per SPEC.md Section 11.6.

### Anti-Pattern 4: Automatic Discovery on Shim Init

**What:** Running service discovery automatically during shim initialization (alongside AUTH).
**Why bad:** Discovery requires AUTH to complete first (unauthenticated REQs are rejected). Adding it to the init sequence introduces timing complexity and delays napplet startup for apps that don't need discovery.
**Instead:** Discovery is opt-in. The napplet calls `discoverServices()` when it needs to. The shim caches the result.

### Anti-Pattern 5: Breaking Audio Topic Migration

**What:** Changing audio topics from `shell:audio-*` to `audio:*` immediately without a transition period.
**Why bad:** Existing napplets in the hyprgate reference implementation use `shell:audio-*`. A hard rename would break them.
**Instead:** Audio service handler responds to both `audio:*` (new, service-routed) and `shell:audio-*` (legacy, direct routing in handleEvent). Deprecate the old prefix in v0.5.0.

## Integration Points: Exact Code Modifications

### @napplet/core

| File | Change | What |
|------|--------|------|
| `types.ts` | ADD | `ServiceDescriptor` interface |
| `topics.ts` | ADD | `SERVICE_DISCOVER` topic constant |
| `index.ts` | ADD | Export `ServiceDescriptor` and new topic |

### @napplet/runtime

| File | Change | What |
|------|--------|------|
| `types.ts` | ADD | `ServiceHandlerRuntime`, `ServiceRegistryRuntime` interfaces |
| `types.ts` | MODIFY | Add `services?` to `RuntimeHooks` |
| `service-dispatch.ts` | NEW | `handleServiceDiscovery()`, `routeServiceMessage()` |
| `runtime.ts` | MODIFY | Wire service dispatch into `handleReq()` and `handleEvent()` |
| `index.ts` | MODIFY | Export service dispatch types and functions |

### @napplet/shell

| File | Change | What |
|------|--------|------|
| `types.ts` | MODIFY | Import service types from runtime instead of defining locally |
| `hooks-adapter.ts` | MODIFY | Pass `services` through to RuntimeHooks |
| `audio-service.ts` | NEW | `createAudioService()` wrapping audioManager |
| `index.ts` | MODIFY | Export `createAudioService`, re-export service types from runtime |

### @napplet/shim

| File | Change | What |
|------|--------|------|
| `discovery.ts` | NEW | `discoverServices()`, `hasService()`, `checkCompatibility()` |
| `index.ts` | MODIFY | Export discovery API |

### @napplet/vite-plugin

| File | Change | What |
|------|--------|------|
| `index.ts` | MODIFY | Accept `requires` option, add requires tags to manifest, inject meta tag |

## Suggested Build Order

Dependencies flow left to right. Each step depends on the previous.

```
Step 1: Core types           Step 2: Runtime dispatch     Step 3: Shell adapter      Step 4: Shim discovery
 ServiceDescriptor            service-dispatch.ts           hooks-adapter pass-thru    discovery.ts
 SERVICE_DISCOVER topic       runtime.ts wiring             audio-service.ts           checkCompatibility
                              RuntimeHooks.services         type migration

Step 5: Vite plugin           Step 6: Integration tests
 requires option              Discovery e2e test
 meta tag injection           Audio service test
                              Compatibility test
```

**Step ordering rationale:**

1. **Core types first** because runtime, shell, and shim all need `ServiceDescriptor`.
2. **Runtime dispatch second** because it is the core protocol change. Everything else is wiring.
3. **Shell adapter third** because it wires shell's concrete service implementations to the runtime.
4. **Shim discovery fourth** because it depends on the runtime responding to kind 29010 REQs.
5. **Vite plugin fifth** because `requires` is additive and doesn't block the discovery flow.
6. **Integration tests last** because they prove the full chain works end-to-end.

**Parallelism opportunity:** Steps 3 (shell) and 4 (shim) can execute in parallel after step 2, since they both depend only on core types and runtime dispatch being complete.

## Scalability Considerations

| Concern | 3 services (v0.4.0) | 10 services | 50+ services |
|---------|---------------------|-------------|-------------|
| Discovery response size | Negligible (3 events) | Tiny (~10 events, each <200 bytes) | May want paged discovery |
| Topic prefix routing | O(1) map lookup | O(1) map lookup | O(1) map lookup |
| Service handler map | Static, set at shell startup | Static | May want dynamic registration API |
| Discovery cache (shim) | Single promise, reused | Same | Same -- services don't change mid-session |
| Backwards compat | Dual prefix support | Consider removing old prefixes | Must have removed old prefixes |

## Sources

- SPEC.md Section 11 (Service Discovery protocol definition) -- HIGH confidence, authoritative
- SPEC.md Section 15.5 (Service Discovery Kind allocation) -- HIGH confidence, authoritative
- `packages/runtime/src/runtime.ts` (existing dispatch logic) -- HIGH confidence, direct code reading
- `packages/shell/src/types.ts` (existing service type stubs) -- HIGH confidence, direct code reading
- `packages/shell/src/audio-manager.ts` (existing audio implementation) -- HIGH confidence, direct code reading
- `packages/shim/src/relay-shim.ts` (existing query() pattern) -- HIGH confidence, direct code reading
- `packages/runtime/src/state-handler.ts` (pattern for topic-based handlers) -- HIGH confidence, direct code reading

---

*Architecture research: 2026-03-31*
