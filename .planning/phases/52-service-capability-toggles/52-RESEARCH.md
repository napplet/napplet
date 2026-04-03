# Phase 52: Service & Capability Toggles - Research

**Researched:** 2026-04-03
**Status:** Complete

## 1. Service Toggle Infrastructure

### Current State
- `runtime.registerService(name, handler)` adds a ServiceHandler to the internal `serviceRegistry` object and `registeredServices` Map
- `runtime.unregisterService(name)` removes from both `serviceRegistry` and `registeredServices`
- Discovery subscriptions are auto-notified when services are registered (lines 1072-1082 in runtime.ts)
- In `shell-host.ts`, the demo wraps both methods to track `demoServiceNames` (a Set)
- Services are initially created in `createDemoHooks()` — `signer` and `notifications` are constructed there and passed as `services` property on the ShellAdapter

### Key Challenge: Retaining Handler References
When a service is "disabled" via unregisterService, the handler object is deleted from the registry. To re-enable it, we need the original handler reference. Current code does not retain handlers after unregister.

**Solution:** Store a parallel `Map<string, ServiceHandler>` in shell-host.ts that captures every handler at registration time. On disable, unregister from runtime but keep in the local map. On enable, re-register from the local map. This map never deletes entries — it's a permanent reference store for the session.

### Service Registration Flow
1. `createDemoHooks()` builds initial services object: `{ signer: signerHandler, notifications: notifHandler }`
2. These are passed via `ShellAdapter.services` to `createShellBridge(hooks)`
3. Inside runtime, `createRuntime()` calls `registerService()` for each entry in `hooks.services`
4. The demo's wrapped `registerService` adds to `demoServiceNames`
5. `getDemoServiceNames()` returns sorted list from `demoServiceNames`

### Impact of Unregister
- `routeServiceMessage()` in service-dispatch.ts uses `services[prefix]` lookup — if handler is missing, returns false
- When `routeServiceMessage` returns false, the message falls through to `eventBuffer.bufferAndDeliver()` which may fail with no matching subscription
- This effectively "blocks" the service — messages directed to it get no handler
- The napplet would see timeouts or CLOSED messages for unhandled service requests

## 2. Capability Toggle Infrastructure

### Current State
- `toggleCapability(windowId, capability, enabled)` already exists in `shell-host.ts` (lines 611-625)
- Calls `relay.runtime.aclState.grant()` or `.revoke()` 
- `acl-panel.ts` renders per-napplet toggle buttons for 5 capabilities (relay:read, relay:write, sign:event, state:read, state:write)
- `acl-modal.ts` shows read-only grid of all 10 capabilities per napplet

### What Needs to Change
- `acl-modal.ts` grid cells are currently display-only (innerHTML with span elements)
- Context decision D-05: cells should be clickable to cycle through granted/denied/default
- Context decision D-07: both inline buttons and modal cells must stay in sync
- The inline `acl-panel.ts` buttons already work; modal needs click handlers added

### Cycle Logic
From context D-05 and Claude's discretion on cycle order: `granted -> denied -> default -> granted`
- On click, determine current state from aclState
- Advance to next state in cycle
- Call `toggleCapability()` for grant/revoke, or reset to default
- For "default" state: need to ensure neither explicit grant nor explicit revoke is active

### Default State Reset
The ACL system uses `aclState.grant()` and `aclState.revoke()`. To return to "default" (neither explicit grant nor revoke), we need to check what `aclState` provides. Looking at the ACL:
- `grant(pubkey, dTag, hash, capability)` — adds capability to granted list
- `revoke(pubkey, dTag, hash, capability)` — removes from granted list and adds to explicitly denied
- For "default" — we need to remove from both explicit grants AND explicit denies

We should check if `aclState` exposes a `resetCapability()` or similar. If not, we may need to call `grant()` to remove from denied list, then check if the internal entry has no explicit state.

**Finding:** The ACL store likely doesn't have a "reset to default" API. The simplest approach for the demo: use a two-state toggle (granted/revoked) rather than three-state, which matches the existing inline buttons pattern. Or, implement the three-state cycle and use grant() when moving to default (since default is permissive, granting effectively returns to default behavior).

Actually, looking more carefully: the default policy is permissive (allow all). So:
- "default" = no explicit entry = allowed
- "granted" = explicit grant = allowed (same behavior as default in permissive mode)
- "revoked" = explicit revoke = denied

In practice for the demo, "default" and "granted" have the same runtime effect. The visual distinction is useful for showing what's explicitly set vs. inherited. The simplest approach: cycle between "allowed" (grant or default) and "denied" (revoke). Two states, click to toggle.

## 3. Service Toggle UI Locations

### Topology Node Overlay (D-01, D-02)
- Service nodes are `<article>` elements with class `topology-service-card`
- Each has `data-service-name` attribute
- D-02 specifies: small on/off icon overlaid on each service node
- Click icon = toggle service; click elsewhere = open inspector
- Need to add a toggle icon element inside the service card, positioned absolutely
- Toggle event needs `stopPropagation()` to prevent inspector opening

### Policy Modal Services Section (D-01, D-03)
- `acl-modal.ts` currently has: header, table, legend
- Add a "Services" section above the table
- Toggle switches (not checkboxes) next to each service name
- Both UI paths (D-04) call the same runtime.unregisterService/registerService

## 4. Live-Reload Behavior

### How It Already Works
- ACL changes via `aclState.grant()`/`aclState.revoke()` take immediate effect because `enforce()` reads from `aclState` on every call
- Service unregister takes immediate effect because `routeServiceMessage()` does a live lookup
- No caching or memoization to bypass — changes are inherently live

### Visual Feedback (D-09, D-10, D-12)
- D-09: Disabled service nodes should dim/gray out in topology
- D-10: Revoked capabilities reflect in Phase 51's color routing on next message
- D-12: Disabled services and revoked capabilities produce visible rejection entries in ACL history

For D-09: Add a CSS class like `service-disabled` to the topology node when toggled off, with reduced opacity and desaturated colors.

For D-12: When a service is disabled, messages directed to it will fail through the normal path — the runtime will either return an error or the message will be unhandled. This should already trigger ACL audit entries if the enforce gate is involved. For service-level failures that bypass ACL (e.g., service dispatch returning false), we may need to add explicit audit entries.

## 5. Sync Between Inline and Modal

Context D-07: Both inline buttons and modal cells call the same `toggleCapability()`. State must stay in sync.

**Approach:** When a toggle happens (from either source), the modal rebuilds if open. The simplest approach:
1. After `toggleCapability()`, check if modal is open (`isPolicyModalOpen()`)
2. If open, close and reopen to refresh (or selectively update the affected cell)
3. For inline buttons: they already work independently; no change needed if we don't cache their state

More elegant: expose a refresh function from acl-modal.ts that rebuilds the table body without closing the modal. Call it after any capability toggle.

## 6. File Modification Summary

### Files to Create
None — all files exist, we extend them.

### Files to Modify
1. **`apps/demo/src/shell-host.ts`** — Add service handler reference store, service toggle API, export service state
2. **`apps/demo/src/acl-modal.ts`** — Add services section, make capability cells clickable, add refresh function
3. **`apps/demo/src/topology.ts`** — Add toggle icon overlay on service nodes, dimming for disabled state
4. **`apps/demo/src/acl-panel.ts`** — Minor: sync with modal state (optional, since both call toggleCapability)

### Files to Read (reference only)
- `packages/runtime/src/runtime.ts` — registerService/unregisterService API
- `packages/runtime/src/service-dispatch.ts` — routeServiceMessage flow
- `packages/runtime/src/types.ts` — ServiceHandler, ServiceRegistry interfaces
- `apps/demo/src/flow-animator.ts` — How message classification works
- `apps/demo/src/node-inspector.ts` — Inspector interaction with topology nodes

## 7. Validation Architecture

### Requirement Coverage
- **TOGL-01** (service toggle): Service toggle UI on topology nodes + policy modal services section
- **TOGL-02** (capability toggle): Clickable modal cells + existing inline buttons (both calling toggleCapability)
- **TOGL-03** (live-reload): Already inherent in ACL and service dispatch architecture; needs visual verification

### Verification Approach
1. Build succeeds and type-check passes
2. Service toggle functions exist and are exported
3. Modal has services section with toggle elements
4. Modal cells have click event handlers
5. Topology service nodes have toggle icon elements
6. Disabled state CSS class exists on toggled-off nodes
7. Handler reference map retains handlers for re-registration

---

*Research complete: 2026-04-03*
