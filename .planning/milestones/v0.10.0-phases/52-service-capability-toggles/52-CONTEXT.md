# Phase 52: Service & Capability Toggles - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable/disable any service (signer, notifications, audio, relay pool, cache) and toggle individual ACL capabilities per napplet via the demo UI. Changes take effect live on the next message without re-register. Builds on Phase 50's policy modal and Phase 51's directional color routing.

</domain>

<decisions>
## Implementation Decisions

### Service Toggle UI
- **D-01:** Service toggles available in two places: Phase 50's policy modal (new "Services" section) AND directly on service topology nodes (overlay toggle icon).
- **D-02:** Topology node toggle: small on/off icon overlaid on each service node. Click the icon to toggle the service; click elsewhere on the node to open inspector. Prevents conflict between toggle and inspection.
- **D-03:** Policy modal: add a "Services" section (above or below the capability grid) with toggle switches next to each registered service name.
- **D-04:** Both paths (modal and topology node) call the same `runtime.unregisterService(name)` / `runtime.registerService(name, handler)` under the hood.

### Capability Toggle UX
- **D-05:** Policy modal grid cells are directly clickable — click a cell to cycle through granted/denied/default states. No separate edit mode needed.
- **D-06:** The existing inline capability buttons above each napplet (from `acl-panel.ts`) are kept alongside the modal. Two paths to the same action — inline for quick toggle, modal for full view.
- **D-07:** Both inline buttons and modal cells call the same `toggleCapability()` from `shell-host.ts`. State must stay in sync between the two views.

### Live-Reload Behavior
- **D-08:** Changes take effect on the very next message — no re-register or page reload required.
- **D-09:** When a service is disabled, its topology node visually dims/grays out.
- **D-10:** Revoked capabilities are immediately reflected in Phase 51's directional color routing on the next message.
- **D-11:** No toast notifications for toggle actions — topology and color changes provide sufficient feedback.
- **D-12:** Disabled services and revoked capabilities produce visible rejection entries in Phase 50's ACL detail panel (rejection history).

### Claude's Discretion
- Toggle icon design and placement on service nodes
- "Services" section layout in the policy modal
- How to keep inline buttons and modal cells in sync (event bus, shared state, re-render on change)
- Visual treatment for dimmed/disabled service nodes
- Cycle order for grid cell clicks (granted → denied → default → granted)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Service Infrastructure
- `packages/runtime/src/runtime.ts:1057-1076` — `registerService()` and `unregisterService()` APIs
- `packages/runtime/src/service-dispatch.ts` — `routeServiceMessage()` prefix-matching dispatch, `notifyServiceWindowDestroyed()`
- `packages/runtime/src/types.ts` — `ServiceHandler`, `ServiceDescriptor`, `ServiceRegistry` interfaces

### Demo Service Wiring
- `apps/demo/src/shell-host.ts:477-485` — Demo wraps `registerService`/`unregisterService` with UI tracking
- `apps/demo/src/shell-host.ts:289-323` — Services object passed to runtime (signer, notifications)
- `apps/demo/src/shell-host.ts:590-613` — `toggleCapability()` and `toggleBlock()` functions

### ACL / Capability UI
- `apps/demo/src/acl-panel.ts` — Existing inline capability toggle buttons, `DEMO_CAPABILITY_LABELS`, `DEMO_CAPABILITY_HINTS`
- `apps/demo/src/acl-modal.ts` — Phase 50's policy modal with capability grid (to be extended with clickable cells and services section)
- `apps/demo/src/acl-history.ts` — Phase 50's ACL event ring buffer (rejection entries)

### Topology
- `apps/demo/src/topology.ts` — Topology node rendering, edge definitions, service node IDs
- `apps/demo/src/flow-animator.ts` — Message classification and highlight path (color routing from Phase 51)
- `apps/demo/src/node-inspector.ts` — Inspector pane, tab system

### Prior Phase Context
- `.planning/phases/50-acl-detail-panel/50-CONTEXT.md` — Policy modal decisions (D-06: modal with grid/table, D-10: grid format)
- `.planning/phases/51-accurate-color-routing/51-CONTEXT.md` — Directional color routing, persistent state model, split-border nodes
- `.planning/phases/49-constants-panel/49-CONTEXT.md` — Mutable config object pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `runtime.registerService()`/`unregisterService()` — Already exist and work. Discovery subscriptions auto-update.
- `toggleCapability()` in `shell-host.ts` — Already wired, calls `aclState.grant()`/`aclState.revoke()`.
- `DEMO_CAPABILITY_LABELS` and `DEMO_CAPABILITY_HINTS` — Full maps for all 10 capabilities.
- `acl-modal.ts` — Phase 50's modal, ready to extend with services section and clickable cells.
- `shell-host.ts` service tracking wrapper — Already intercepts register/unregister for UI updates.

### Established Patterns
- Inline styles for dynamic UI (UnoCSS can't detect dynamic classes)
- `onAclCheck` audit callback fires on every enforce() call — rejection entries auto-populate
- Service handler references need to be retained when unregistering so they can be re-registered on toggle-on

### Integration Points
- `acl-modal.ts` — Add services section, make grid cells clickable
- `topology.ts` — Add toggle icon overlay on service nodes, dimming for disabled state
- `shell-host.ts` — Store service handler references for re-registration
- `acl-panel.ts` — Keep in sync with modal state changes

</code_context>

<specifics>
## Specific Ideas

- Two paths to every toggle action (modal + inline/topology) keeps the demo flexible for different workflows
- Service handler references must be retained when disabling so re-enabling is possible without page reload
- Disabled service nodes dim in topology — visual signal without any toast noise

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 52-service-capability-toggles*
*Context gathered: 2026-04-03*
