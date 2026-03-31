# Domain Pitfalls: Service Discovery & Capability Negotiation

**Domain:** Adding service discovery, capability negotiation, and compatibility checking to an existing sandboxed iframe protocol (napplet v0.4.0)
**Researched:** 2026-03-31

---

## Critical Pitfalls

Mistakes that cause protocol breaks, backwards incompatibility, or require rewrites.

### Pitfall 1: Discovery REQ Races Against AUTH Queue Drain

**What goes wrong:** After AUTH succeeds, the runtime drains `pendingAuthQueue` synchronously at `runtime.ts:253`. The shim currently sends two REQs immediately after the AUTH event (`index.ts:224-225`): `SIGNER_SUB_ID` and `NIPDB_SUB_ID`. A natural v0.4.0 addition would be to send a third REQ for service discovery (`['REQ', 'svc-discovery', { kinds: [29010] }]`) immediately after AUTH. But the AUTH response (`['OK', eventId, true, '']`) is asynchronous -- the shim does not wait for the OK before sending these REQs. The REQs arrive at the runtime while AUTH is still processing (signature verification is async at `runtime.ts:188`), so they get queued in `pendingAuthQueue`. After AUTH succeeds and the queue drains, the REQs execute. This works. The race happens when:

1. The shim sends AUTH, then immediately sends the discovery REQ.
2. The discovery REQ enters `pendingAuthQueue`.
3. AUTH succeeds, queue drains, discovery REQ runs.
4. Runtime generates kind 29010 events and sends them back.
5. But the shim's discovery handler is not yet installed (it was supposed to be set up AFTER AUTH OK arrives).

The shim receives the discovery REQ response to a subscription it has not yet set up a handler for. The events are delivered but nobody is listening.

**Why it happens:** The current shim architecture fires REQs optimistically during `handleAuthChallenge()` before AUTH confirmation. This works for signer/nipdb because those subscriptions are long-lived and the handlers are installed at module initialization. But a discovery flow is a one-shot query that the napplet code initiates AFTER the shim is ready.

**Consequences:**
- Discovery responses are silently dropped because no handler is listening.
- Napplets that call `discoverServices()` immediately after import get stale or empty results.
- The race is timing-dependent -- fast AUTH verification (local mock) exposes it; slow verification (real Schnorr) masks it.

**Prevention:**
1. Do NOT send the service discovery REQ from `handleAuthChallenge()`. Discovery is napplet-initiated, not shim-internal.
2. Expose a `discoverServices()` function that returns a `Promise<ServiceDescriptor[]>`. This function internally sends the REQ, listens for kind 29010 events, waits for EOSE, then resolves.
3. The `discoverServices()` function should await the `keypairReady` promise (already exists) AND await AUTH confirmation before sending the REQ. Currently there is no "AUTH confirmed" promise -- add one.
4. Alternative: have the shell proactively push service descriptors as part of the post-AUTH flow (like `auth:identity-changed`). This avoids the napplet needing to query at all but changes the protocol design from pull to push.

**Detection:** Write a test where AUTH takes >50ms (mock slow `verifyEvent`). Call `discoverServices()` immediately after shim import. If discovery returns empty results, the race is present.

**Phase:** Must be resolved in the first phase (discovery protocol implementation). Getting the timing wrong here poisons everything built on top.

---

### Pitfall 2: Service Topic Routing Collision With Existing `shell:audio-*` Topics

**What goes wrong:** The runtime currently has hardcoded topic prefix routing at `runtime.ts:289-298`:

```typescript
if (topic?.startsWith('shell:state-')) {
  handleStateRequest(...);
  return;
}
if (topic?.startsWith('shell:audio-')) {
  eventBuffer.bufferAndDeliver(event, windowId);
  break;
}
if (topic?.startsWith('shell:') || ...) {
  handleShellCommand(event, windowId, topic!);
  return;
}
```

Audio events (`shell:audio-register`, `shell:audio-unregister`, `shell:audio-state-changed`) are currently forwarded as inter-pane events. The SPEC.md Section 11.3 defines the new service routing pattern as `{service-name}:{action}` -- so the audio service would use `audio:register`, `audio:unregister`, `audio:state-changed`. These are DIFFERENT topic strings from the existing `shell:audio-*` topics in `@napplet/core`'s TOPICS constant.

If the audio service handler is registered and the runtime dispatches `audio:register` to it, existing napplets using the old `shell:audio-register` topic will break. If both topic patterns are supported simultaneously, there are now two paths to the same functionality with different semantics.

**Why it happens:** The existing audio topics were designed before the service extension system was specified. They follow the `shell:*` prefix convention used for all shell commands. The service system uses a different convention (`{service-name}:*`) to allow arbitrary service names.

**Consequences:**
- Existing napplets break if old topics stop working.
- Two parallel paths to audio functionality create confusion and maintenance burden.
- The TOPICS constant in `@napplet/core` has the old names hardcoded (`AUDIO_REGISTER: 'shell:audio-register'`). Changing these is a semver-breaking change.

**Prevention:**
1. Keep the old `shell:audio-*` topics working during v0.4.0. Route them to the audio service handler as aliases. Add deprecation warnings.
2. The audio service handler should accept BOTH `audio:register` (new service convention) AND `shell:audio-register` (legacy) during the transition.
3. In the runtime's topic dispatch, add service routing BEFORE the `shell:audio-*` check. If a service is registered for the `audio` prefix, dispatch `audio:*` topics to it. The old `shell:audio-*` topics are aliased internally.
4. Do NOT change the TOPICS constants in `@napplet/core` yet. Add new constants alongside: `AUDIO_SVC_REGISTER: 'audio:register'`. Deprecate the old ones in JSDoc.
5. Plan a clean break in v0.5.0 or v1.0 where legacy topics are removed.

**Detection:** Run existing audio e2e tests after adding service dispatch. If audio tests fail, the routing collision is present. Check whether `handleEvent` in runtime.ts dispatches `audio:register` to a service handler or falls through to the `shell:` prefix check.

**Phase:** Must be addressed in the service dispatch routing phase. The ordering of `if` checks in `handleEvent()` determines whether old or new topics win.

---

### Pitfall 3: Over-Engineering the Negotiation Protocol

**What goes wrong:** It is tempting to design a full capability negotiation protocol inspired by IRCv3 CAP, with multi-round request/acknowledge cycles, atomic enable/disable of service sets, version constraints, and dependency resolution. This adds complexity that:
- Delays shipping by 2-3 phases.
- Creates protocol surface area with no consumers (no shell implementors exist yet besides hyprgate).
- Makes the spec harder for third-party implementors to adopt.
- Introduces state machine complexity that the simple REQ/EVENT/EOSE flow does not have.

**Why it happens:** Protocol designers naturally want to handle every edge case upfront. The IRCv3 CAP negotiation took years to stabilize and required three spec rewrites. The MCP protocol's version negotiation has open issues about backwards compatibility. These are cautionary tales, not templates.

**Consequences:**
- Napplet developers get a complex API (`negotiateServices({ require: [...], prefer: [...], versions: {...} })`) when they just need `const services = await discoverServices()`.
- Shell implementors must implement a state machine instead of "respond to REQ with descriptor events."
- The spec becomes harder to review and submit as a NIP.
- Bugs in the negotiation logic are hard to test because they involve multi-round async exchanges.

**Prevention:**
1. v0.4.0 should implement only the SPEC.md Section 11 design: napplet sends REQ, shell responds with service descriptors, EOSE. No negotiation, no enable/disable, no version constraints.
2. The shim API should be `discoverServices(): Promise<ServiceDescriptor[]>` and `hasService(name: string): boolean`. That is the entire napplet-facing API.
3. Compatibility checking (manifest `requires` tags) is a BUILD-TIME check, not a runtime negotiation. The vite-plugin declares required services in the manifest. The shell checks at AUTH time whether it can satisfy the requirements. No round trips needed.
4. Version negotiation can be deferred to a future version when there are actual version conflicts to resolve. Semver range matching on service versions is complexity with no current users.
5. If a napplet requires a service the shell does not have, the shell DOES NOT reject AUTH. Instead, it responds to discovery with the services it has, and the napplet decides what to do (degrade, show warning, refuse to start).

**Detection:** If the proposed API has more than 3 functions, or if the protocol requires more than one round trip for discovery, it is over-engineered for v0.4.0.

**Phase:** Architecture decision that must be locked before any implementation phase begins.

---

### Pitfall 4: Breaking RuntimeHooks Interface for Service Support

**What goes wrong:** Adding service dispatch to the runtime requires the runtime to know about registered services. The natural approach is to add a `services?: ServiceRegistry` field to `RuntimeHooks`. But `RuntimeHooks` is the core integration interface -- every shell implementor must provide it. Adding required fields is a breaking change. Adding optional fields creates confusion about where services live (RuntimeHooks vs ShellHooks vs separate registration).

Currently, `ServiceRegistry`, `ServiceHandler`, and `ServiceDescriptor` are defined in `@napplet/shell/types.ts`, not in `@napplet/runtime` or `@napplet/core`. The runtime package cannot import from shell (dependency goes the wrong direction: shell depends on runtime).

**Why it happens:** The service types were designed during v0.3.0 as a shell-level concept. Moving them to runtime or core requires a package boundary change.

**Consequences:**
- If service types stay in shell but the runtime needs them for dispatch, you get a circular dependency (runtime imports shell types).
- If you duplicate the types in runtime, you have two diverging `ServiceHandler` interfaces.
- If you move types to core, you change the public API of both core and shell (types removed from shell's exports).

**Prevention:**
1. Move `ServiceDescriptor`, `ServiceHandler`, and `ServiceRegistry` to `@napplet/core`. These are protocol-level types, not shell-specific. Core already has `NostrEvent`, `NostrFilter`, `Capability`, `BusKind`, and `TOPICS` -- service types belong there.
2. Shell re-exports them from core (preserving backwards compatibility for consumers who import from `@napplet/shell`).
3. Runtime adds an optional `services?: ServiceRegistry` to `RuntimeHooks`. The hooks-adapter in shell passes `shellHooks.services` through.
4. Make the field optional with a clear default: no services registered = discovery returns EOSE immediately.
5. Do the type migration as the FIRST step before any implementation, so all downstream code imports from the canonical location.

**Detection:** Try importing `ServiceHandler` from `@napplet/runtime` after adding service dispatch. If it requires importing from `@napplet/shell`, the dependency direction is wrong.

**Phase:** Must be the first phase action -- move types to core before implementing anything.

---

### Pitfall 5: Kind 29010 REQ Without Service Dispatch Returns Nothing (Silent Failure)

**What goes wrong:** When a napplet sends `['REQ', 'svc-discovery', { kinds: [29010] }]`, the runtime's `handleReq()` at `runtime.ts:314` creates a subscription and then:
1. Replays buffered events matching the filter.
2. Queries local cache (if available and not a bus kind).
3. Subscribes to relay pool (if available and not a bus kind).

Kind 29010 is in the bus kind range (29000-29999). The `isBusKind` check at `runtime.ts:340` will be `true`, so cache and relay pool are skipped. The subscription only receives buffered events. But no service descriptor events are in the buffer -- they need to be generated on demand when the REQ arrives.

The current architecture has no mechanism for the runtime to generate response events in response to a REQ. REQs only match against buffered events, cache, and relay subscriptions. There is no "synthetic response" path.

**Why it happens:** The runtime was designed as a relay proxy. REQs query existing data stores. Service discovery is different -- it is a request-response pattern where the runtime GENERATES events, not queries for them.

**Consequences:**
- Discovery REQ silently returns EOSE with no events. The napplet thinks the shell has zero services.
- Developers waste hours debugging why discovery "doesn't work" when the issue is architectural.

**Prevention:**
1. Add a new dispatch path in `handleReq()` specifically for kind 29010 filters. Before the general subscription/cache/relay flow, check if any filter has `kinds: [29010]`. If so, generate service descriptor events from the registered services and deliver them directly.
2. Implementation pattern:
   ```typescript
   // In handleReq, before the general subscription flow:
   if (filters.some(f => f.kinds?.includes(BusKind.SERVICE_DISCOVERY))) {
     for (const [name, handler] of Object.entries(registeredServices)) {
       const descriptorEvent = createServiceDescriptorEvent(handler.descriptor);
       hooks.sendToNapplet(windowId, ['EVENT', subId, descriptorEvent]);
     }
     hooks.sendToNapplet(windowId, ['EOSE', subId]);
     return; // Do not proceed to relay/cache
   }
   ```
3. Do NOT try to pre-buffer service descriptor events at startup. Services can be registered/deregistered at any time. Discovery must be live.
4. Ensure the subscription is still tracked so CLOSE can clean it up, even though the response is immediate.

**Detection:** Send a discovery REQ after AUTH. If the response is just EOSE with no events (and services are registered), the synthetic response path is missing.

**Phase:** Core to the service dispatch phase. Without this, discovery is dead on arrival.

---

## Moderate Pitfalls

### Pitfall 6: Audio Manager Migration Creates Two Audio State Owners

**What goes wrong:** The current `audioManager` in `packages/shell/src/audio-manager.ts` is a module-level singleton with its own `Map<string, AudioSource>` state, version counter, and `CustomEvent` dispatch. When converting it to a `ServiceHandler`, the temptation is to create an `AudioServiceHandler` class that wraps `audioManager`. Now there are two objects managing audio state:
- The `audioManager` singleton (still exported from `@napplet/shell`, used by shell UI components).
- The `AudioServiceHandler` (registered in the service registry, handling service messages).

If the handler updates its own internal state but forgets to call `audioManager.register()`, the shell UI is stale. If the handler delegates to `audioManager` for everything, it is just a pass-through wrapper with no value.

**Why it happens:** The audioManager was designed as a standalone registry with direct browser API access (`window.dispatchEvent`, `originRegistry.getIframeWindow`). The `ServiceHandler` interface has a different shape (`handleRequest(windowId, topic, content, event)`) and runs in the runtime context (no browser APIs).

**Consequences:**
- State divergence between the service handler and the audioManager singleton.
- Shell UI components that read `audioManager.getSources()` see stale data.
- The `audioManager.mute()` method sends postMessage directly to the iframe (bypassing the runtime), creating a second message path.

**Prevention:**
1. The `AudioServiceHandler` should be a THIN adapter that delegates all state management to the existing `audioManager` singleton. The handler's `handleRequest()` parses the message and calls `audioManager.register()`, `audioManager.unregister()`, etc.
2. The `audioManager` remains the source of truth for audio state. The service handler is only a message routing layer.
3. The `audioManager.mute()` method's direct postMessage call (`audio-manager.ts:102-111`) should be migrated to go through the runtime's `sendToNapplet()` path instead. This is a separate cleanup task that should happen in the same phase.
4. Keep `audioManager` exported from `@napplet/shell` for backwards compatibility. Shell UI code continues to read from it. The service handler writes to it.
5. Do NOT move audio state management into the runtime. Audio is browser-specific (Web Audio API, CustomEvent). It belongs in the shell adapter layer.

**Detection:** After migration, register an audio source via the service handler path. Check `audioManager.getSources()`. If the source is missing, the handler is not delegating correctly.

**Phase:** Audio service implementation phase. Get the delegation pattern right before adding more services.

---

### Pitfall 7: Manifest `requires` Tags Create Chicken-and-Egg With Discovery

**What goes wrong:** The plan includes manifest `requires` tags where a napplet declares its service dependencies in the NIP-5A manifest:

```json
{
  "tags": [
    ["requires", "audio", ">=1.0.0"],
    ["requires", "notifications", ">=1.0.0"]
  ]
}
```

The shell is supposed to check these at AUTH time and warn if it cannot satisfy them. But the shell receives the manifest's aggregate hash during AUTH (`aggregateHash` tag), not the full manifest. The manifest itself is fetched separately (or cached). The shell would need to:
1. Receive AUTH with aggregateHash.
2. Fetch/lookup the manifest by aggregateHash.
3. Parse `requires` tags from the manifest.
4. Check against registered services.
5. Decide whether to proceed with AUTH or warn.

Step 2 is the problem. The manifest cache (`manifest-cache.ts`) stores `{ pubkey, dTag, aggregateHash, verifiedAt }` -- it does NOT store the full manifest content or requires tags. Fetching the manifest during AUTH adds latency and a network dependency to the critical path.

**Why it happens:** The manifest cache was designed for identity verification (hash matches known build), not for content inspection.

**Consequences:**
- Compatibility checking during AUTH adds network latency (fetching manifest from relay/blossom).
- If the manifest is unavailable (relay down, first-time napplet), compatibility cannot be checked.
- AUTH becomes conditional on an external fetch, which can timeout or fail.

**Prevention:**
1. Do NOT check `requires` tags during AUTH. AUTH should remain fast and self-contained.
2. Compatibility checking happens AFTER AUTH, as part of the service discovery flow:
   a. Napplet completes AUTH.
   b. Napplet calls `discoverServices()`.
   c. Shim-side code compares discovered services against the napplet's own `requires` tags (read from meta tags, like aggregateHash is today).
   d. If required services are missing, the shim fires a callback or event that the napplet developer handles.
3. The shell does NOT need to know about `requires` tags. The compatibility check is entirely napplet-side: "I need these services, do I have them?"
4. Add `<meta name="napplet-requires" content="audio:>=1.0.0,notifications:>=1.0.0">` alongside the existing aggregate hash meta tag. The vite-plugin generates this from the manifest.

**Detection:** If the proposed implementation modifies `handleAuth()` in the runtime to check manifest content, it is over-coupling AUTH with compatibility. AUTH should not change.

**Phase:** Compatibility reporting phase (after discovery protocol is working). This is a shim-side feature, not a runtime feature.

---

### Pitfall 8: Service Handler `handleRequest` Receives Untrusted Content

**What goes wrong:** The `ServiceHandler.handleRequest()` signature is:

```typescript
handleRequest(windowId: string, topic: string, content: unknown, event: NostrEvent): void;
```

The `content` parameter is `JSON.parse(event.content)`. If the event content is malformed JSON, the parse throws. If it is valid JSON but contains unexpected types (array instead of object, missing fields), the handler crashes or behaves incorrectly.

Service handler authors will assume `content` is a well-structured object matching their expected schema. There is no validation layer between the raw event and the handler.

**Why it happens:** The handler interface was designed for simplicity. Adding schema validation feels like over-engineering. But every handler will need to validate its input independently, leading to inconsistent validation and repeated boilerplate.

**Consequences:**
- A malicious napplet sends `{ "constructor": { "prototype": { "isAdmin": true } } }` as content, and a careless handler spreads it into an object (prototype pollution).
- Missing fields cause `undefined` access errors that crash the handler.
- Each service handler reimplements input validation differently.

**Prevention:**
1. The runtime should catch `JSON.parse` errors and send an OK with error before calling the handler. If `event.content` is not valid JSON, the handler never sees it.
2. Pass `event.content` as a raw string to the handler, not as pre-parsed JSON. Let handlers parse and validate in their own context. This avoids surprising type assumptions.
3. Actually, a better pattern: pass both. `handleRequest(windowId, topic, rawContent: string, event: NostrEvent)`. The handler can parse and validate as needed.
4. Document that handler authors MUST validate all input. Provide a utility function or pattern example in the SDK.
5. For built-in services (audio), validate explicitly: check that `nappClass` is a string, `title` is a string, etc.

**Detection:** Send a service message with `content: "not json"`. If the runtime throws an unhandled exception, parsing is happening at the wrong layer.

**Phase:** Service dispatch routing phase. The handler calling convention must be decided before implementing any handlers.

---

### Pitfall 9: Discovery Response Contains Stale Service Descriptors After Hot Registration

**What goes wrong:** If services can be registered after runtime creation (e.g., a shell plugin system that loads services dynamically), and a napplet has already completed discovery, the napplet's cached service list is stale. The napplet believes it knows what services exist, but new services were added after discovery completed.

**Why it happens:** The SPEC.md Section 11 design is pull-based (napplet sends REQ, gets response). There is no mechanism for the shell to push service additions/removals to napplets that already completed discovery.

**Consequences:**
- A napplet loaded before a service plugin is activated never learns about the new service.
- If a service is removed, napplets that cached its descriptor continue trying to use it, getting silent failures.

**Prevention:**
1. For v0.4.0, document that services must be registered BEFORE the runtime is created. Dynamic service registration is out of scope.
2. If dynamic registration is needed later, add a push mechanism: the shell injects a `service:added` or `service:removed` inter-pane event when the registry changes. Napplets that care can subscribe.
3. The `discoverServices()` shim function should not aggressively cache. Each call should send a fresh REQ. The runtime generates fresh responses from the current registry state.
4. If caching is added later for performance, add an invalidation mechanism.

**Detection:** Register a service after a napplet completes AUTH + discovery. Check whether the napplet can discover the new service by calling `discoverServices()` again.

**Phase:** Define the scope clearly in the architecture phase. v0.4.0 = static registration. Dynamic registration = future.

---

### Pitfall 10: ACL Does Not Gate Service Discovery or Service Messages

**What goes wrong:** SPEC.md Section 11.6 explicitly states "Service-level ACL gating is NOT defined in this version." This means:
1. Any authenticated napplet can discover all registered services.
2. Any authenticated napplet can send messages to any service.
3. A napplet that has been blocked or had capabilities revoked can still use services.

The existing ACL checks in `enforce.ts` resolve capabilities based on verb and event kind. Service messages arrive as INTER_PANE events (kind 29003), which resolve to `relay:write` for the sender. If a napplet has `relay:write` revoked, it cannot send service messages. But if `relay:write` is granted (the default), all services are accessible.

**Why it happens:** Per-service ACL was explicitly deferred. This is a known design decision, not an oversight. But it creates a gap between the existing fine-grained ACL (per-capability revocation) and the new service system (no granularity).

**Consequences:**
- A shell that revokes `sign:event` for a napplet still allows that napplet to use all services.
- No way to allow audio but deny notifications for a specific napplet.
- If a service performs sensitive operations (clipboard write, file system access), there is no ACL barrier.

**Prevention:**
1. For v0.4.0, this is acceptable. Audio is not a sensitive operation. Document the limitation.
2. Plan the capability extension: add `service:audio`, `service:notifications`, etc. to the `Capability` union type and `ALL_CAPABILITIES` array. This is a semver-minor change in `@napplet/core`.
3. When per-service capabilities are added, the enforce gate needs to resolve service messages to the appropriate capability. The topic prefix determines which `service:*` capability to check.
4. Do NOT block on per-service ACL for v0.4.0. Ship discovery and audio first, add ACL in a follow-up.

**Detection:** Revoke all capabilities for a napplet. Attempt to use a service. If it works, per-service ACL is not enforced.

**Phase:** Acknowledge in the roadmap as a known limitation. Address in v0.5.0 or a security-focused follow-up.

---

### Pitfall 11: EOSE Semantics Differ Between Relay REQ and Discovery REQ

**What goes wrong:** For relay REQs, EOSE means "end of stored events, live events may follow." The subscription stays open and continues receiving new events. For discovery REQs, EOSE means "all services have been reported, done." The subscription should be closed because no live updates will arrive (services are static for v0.4.0).

If the napplet treats discovery like a normal subscription (keeping it open after EOSE), it wastes a subscription slot. If it treats a relay subscription like discovery (closing after EOSE), it misses live events.

**Why it happens:** Both use the same NIP-01 REQ/EOSE mechanism. The semantic difference is implicit based on the filter kind.

**Consequences:**
- Memory leak if discovery subscriptions are never closed.
- The shim's `query()` function (which wraps subscribe + close-on-EOSE) is the right pattern for discovery but creates a misleading usage: `query({ kinds: [29010] })` looks like it is querying a relay.

**Prevention:**
1. The `discoverServices()` API in the shim should use the `query()` pattern internally: subscribe, collect, close on EOSE, resolve.
2. Document that discovery is a one-shot operation. Napplets should call `discoverServices()` once, cache the result, and not re-query unless they have reason to believe services changed.
3. On the runtime side, the discovery REQ handler should immediately send all descriptors + EOSE, then the subscription can be auto-closed (or the napplet closes it -- both work).
4. Consider having the runtime auto-CLOSE the discovery subscription after EOSE to prevent leaks if the napplet forgets.

**Detection:** Open a discovery subscription and never close it. Check whether it accumulates in the runtime's `subscriptions` Map.

**Phase:** Discovery protocol implementation phase.

---

## Minor Pitfalls

### Pitfall 12: `ServiceDescriptor.version` Without Semver Parsing

**What goes wrong:** The `ServiceDescriptor` interface has `version: string`. Without semver parsing utilities in the SDK, napplet developers must either:
- Do string comparison (wrong: `"1.10.0" < "1.9.0"` alphabetically).
- Bring their own semver library (dependency burden).
- Ignore versions entirely (defeats the purpose of version reporting).

**Prevention:**
1. For v0.4.0, version is informational only. Document that it follows semver format but do not provide parsing.
2. If `requires` tags support version ranges (`>=1.0.0`), the shim will need a minimal semver comparison function. A ~30-line `satisfies(version, range)` function covers `>=`, `^`, and `~` operators.
3. Do NOT add `semver` as a dependency. The shim must remain lightweight.

**Phase:** Compatibility reporting phase (if version ranges are supported). Can be deferred if `requires` tags only check presence, not version.

---

### Pitfall 13: Service Name Collision Between Built-in and Custom Services

**What goes wrong:** The `ServiceRegistry` is an open dictionary (`[serviceName: string]: ServiceHandler`). Nothing prevents a shell implementor from registering a custom service called `audio` that conflicts with the built-in audio service, or `state` that conflicts with the state proxy.

**Prevention:**
1. Reserve built-in service names in the spec: `audio`, `notifications`, `clipboard`, `state`, `signer`. Document that these MUST NOT be used for custom services.
2. Validate at registration time: if a reserved name is used, warn or throw.
3. Custom services should use a namespace prefix: `myapp:custom-service` or reverse-domain `com.example:service`.
4. For v0.4.0, only `audio` is built-in. The reservation list is short and can be documented.

**Phase:** Spec documentation and service registration validation. Low priority for v0.4.0.

---

### Pitfall 14: Shim Bundle Size Increase From Discovery API

**What goes wrong:** The shim is loaded in every napplet iframe. It must be small. Adding discovery API, compatibility checking, version parsing, and requires-tag resolution can bloat the shim significantly.

**Prevention:**
1. The discovery API is tiny: one `discoverServices()` function that wraps `query()` (already exists).
2. Make compatibility checking tree-shakeable. If a napplet does not import `checkCompatibility()`, it should not be in the bundle.
3. Do NOT add semver parsing to the main shim entry point. Put it in a subpath export: `@napplet/shim/compat`.
4. Measure bundle size before and after. Target: <1KB added to the shim.

**Phase:** All shim-side phases. Measure at the end.

---

### Pitfall 15: Missing `onWindowDestroyed` Cleanup Creates Memory Leaks

**What goes wrong:** The `ServiceHandler` interface has an optional `onWindowDestroyed?(windowId: string)` method. If the audio service handler registers sources per-window (which it does), failing to call `onWindowDestroyed` when a napplet unloads leaks audio sources.

The runtime does not have a "window destroyed" concept. The shell-bridge detects iframe removal (or should -- see existing Pitfall 13 about subscription cleanup leaks). The bridge must call each service handler's `onWindowDestroyed()` when an iframe is removed.

**Prevention:**
1. Add a `destroyWindow(windowId: string)` method to the `Runtime` interface that cleans up subscriptions, pending state, AND calls `onWindowDestroyed` on all service handlers.
2. The shell-bridge calls `runtime.destroyWindow(windowId)` when it detects iframe removal.
3. The audio service handler's `onWindowDestroyed` calls `audioManager.unregister(windowId)`.
4. Make `onWindowDestroyed` cleanup idempotent -- calling it twice for the same windowId should be harmless.

**Detection:** Load a napplet that registers an audio source. Remove the iframe. Check `audioManager.getSources()`. If the source persists, cleanup is missing.

**Phase:** Audio service implementation phase. The window lifecycle must be wired up when the first service with per-window state is added.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Type migration (service types to core) | Breaking import paths for shell consumers (#4) | Re-export from shell for backwards compat |
| Discovery protocol (kind 29010 REQ/EVENT/EOSE) | Silent empty response (#5), timing race (#1) | Add synthetic response path in handleReq, expose auth-confirmed promise in shim |
| Service dispatch routing | Topic collision with legacy audio topics (#2) | Support both topic conventions, deprecate old |
| Audio service implementation | Two state owners (#6), cleanup leaks (#15) | Handler delegates to audioManager singleton, wire onWindowDestroyed |
| Compatibility reporting | Chicken-and-egg with manifest (#7) | Do compatibility checks shim-side, not AUTH-time |
| Shim discovery API | Over-engineering (#3), bundle bloat (#14) | One function (`discoverServices()`), tree-shake compat utils |
| ACL integration | No per-service gating (#10) | Document as known limitation, plan for v0.5.0 |
| EOSE handling | Subscription leak for one-shot discovery (#11) | Use query() pattern, auto-close |
| Content validation | Untrusted input to handlers (#8) | Pass raw string, validate in handler |

---

## Sources

- [IRCv3 Capability Negotiation](https://ircv3.net/specs/extensions/capability-negotiation) -- protocol-level lessons on ordering, timing, backwards compat in capability negotiation
- [MCP Protocol Version Negotiation Issue #546](https://github.com/ibm/mcp-context-forge/issues/546) -- real-world difficulties with protocol version negotiation and backward compatibility
- [MSRC: PostMessaged and Compromised (2025)](https://msrc.microsoft.com/blog/2025/08/postmessaged-and-compromised/) -- postMessage security patterns relevant to service message routing
- [MDN: Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) -- authoritative reference on postMessage origin and timing
- [Microservices Service Discovery Patterns](https://microservices.io/patterns/server-side-discovery.html) -- architectural patterns for service discovery versioning
- [WCF Discovery Versioning](https://learn.microsoft.com/en-us/dotnet/framework/wcf/feature-details/discovery-versioning) -- versioning strategy patterns for discovery protocols
- SPEC.md Section 11 (local, `/home/sandwich/Develop/napplet/SPEC.md:804`) -- the protocol design being implemented
- `packages/runtime/src/runtime.ts` (local) -- current verb dispatch, AUTH flow, topic routing
- `packages/shell/src/audio-manager.ts` (local) -- existing audio singleton being migrated
- `packages/shim/src/index.ts` (local) -- AUTH handshake timing, REQ firing
- `packages/core/src/topics.ts` (local) -- existing topic constants including legacy audio topics
- `packages/shell/src/types.ts` (local) -- current ServiceHandler/ServiceRegistry/ServiceDescriptor definitions

---

*Pitfalls audit: 2026-03-31 (v0.4.0 milestone research)*
*Confidence: HIGH for pitfalls 1-6, 10-11, 15 (verified against source code and runtime behavior). MEDIUM for pitfalls 7-9, 12-14 (inferred from architecture and protocol design, not yet tested).*
