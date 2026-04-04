# Architecture Research: Side Panel Cleanup

**Domain:** Demo UI -- contextual filtering, tab reorganization, editable/read-only separation
**Researched:** 2026-04-04
**Confidence:** HIGH (based entirely on existing codebase analysis)

## Existing Architecture

### Current Side Panel Component Map

```
index.html
  #flow-area-inner (flex row)
    #topology-pane (left, flex:1, scrollable)
    #inspector-pane (right, 0px or 280px, animated)

node-inspector.ts          -- owns inspector pane lifecycle, tab bar, tab routing
  constants-panel.ts       -- renders constants tab content (all constants, global)
  node-details.ts          -- builds NodeDetail records (data only, no HTML)
  acl-panel.ts             -- inline ACL toggles inside napplet cards
  acl-modal.ts             -- full-screen policy matrix modal (opened from inspector)

demo-config.ts             -- DemoConfig singleton, ConstantDef[], get/set/reset/subscribe
topology.ts                -- DemoTopology, node roles, edge rendering
```

### Current Tab System

Two tabs in `node-inspector.ts`:

| Tab | Trigger | Content Source | Node Required? |
|-----|---------|----------------|----------------|
| `node` | Click topology node | `buildNodeDetails()` via `node-details.ts` | Yes |
| `constants` | Click "Constants" tab or `openConstantsTab()` | `renderConstantsPanel()` via `constants-panel.ts` | No |

Type definition: `type InspectorTab = 'node' | 'constants'`

Tab switching is handled by `wireTabHandlers()` which reads `data-inspector-tab` attributes and calls `updateInspectorPane()`.

### Current Constants Panel Architecture

The constants panel renders ALL 26 `ConstantDef` entries from `demoConfig` regardless of which node is selected. It supports:

- **Search filter:** Text match against key/label/description
- **Grouping modes:** `package` | `domain` | `flat` (module-level `_groupingMode` state)
- **Editable vs read-only:** Already distinguished in rendering -- editable constants get slider+input+reset, read-only get a static value display
- **Modification tracking:** `demoConfig.isModified(key)` drives modified-dot indicator and reset buttons

### Current Data Model

Each `ConstantDef` has these fields relevant to the new features:

| Field | Values in Codebase | Purpose |
|-------|-------------------|---------|
| `key` | e.g. `'core.REPLAY_WINDOW_SECONDS'` | Unique ID; prefix is package name |
| `pkg` | `'core'` `'runtime'` `'shim'` `'services'` `'acl'` `'demo'` | Package grouping |
| `domain` | `'timeouts'` `'sizes'` `'ui-timing'` `'protocol'` | Semantic domain grouping |
| `editable` | `true` or `false` | Whether the constant can be changed |
| `unit` | `'ms'` `'s'` `'count'` `'bytes'` `'px'` `''` | Display hint; `''` for protocol kinds |

### ConstantDef Inventory by Editability

**Editable (17):**
- `core.REPLAY_WINDOW_SECONDS` (core/timeouts)
- `runtime.RING_BUFFER_SIZE` (runtime/sizes)
- `services.DEFAULT_EOSE_TIMEOUT_MS` (services/timeouts)
- `services.EOSE_FALLBACK_MS` (services/timeouts)
- `services.DEFAULT_MAX_PER_WINDOW` (services/sizes)
- `acl.DEFAULT_QUOTA` (acl/sizes)
- `demo.FLASH_DURATION` (demo/ui-timing)
- `demo.FLASH_DURATION_MS` (demo/ui-timing)
- `demo.TOAST_DISPLAY_MS` (demo/ui-timing)
- `demo.MAX_RECENT_REQUESTS` (demo/sizes)
- `demo.ROLLING_WINDOW_SIZE` (demo/ui-timing)
- `demo.DECAY_DURATION_MS` (demo/ui-timing)
- `demo.TRACE_HOP_DURATION_MS` (demo/ui-timing)
- `demo.ACL_RING_BUFFER_SIZE` (demo/sizes)
- `demo.HEADER_HEIGHT` (demo/ui-timing)
- `demo.ROW_HEIGHT` (demo/ui-timing)

**Read-only (10, almost all domain:'protocol'):**
- `shim.REQUEST_TIMEOUT_MS` (shim/timeouts -- editable:false, not a protocol kind)
- `core.AUTH_KIND` (22242)
- `core.BusKind.REGISTRATION` (29000)
- `core.BusKind.SIGNER_REQUEST` (29001)
- `core.BusKind.SIGNER_RESPONSE` (29002)
- `core.BusKind.IPC_PEER` (29003)
- `core.BusKind.HOTKEY_FORWARD` (29004)
- `core.BusKind.METADATA` (29005)
- `core.BusKind.SERVICE_DISCOVERY` (29010)
- `runtime.SECRET_LENGTH` (32)

Note: `shim.REQUEST_TIMEOUT_MS` is editable:false but domain is 'timeouts' not 'protocol'. This is intentional -- the shim runs inside the iframe, so the value cannot be changed from the shell side. It belongs with read-only constants but is semantically a timeout, not a kind. It should display as a read-only constant, not a kind.

### Topology Node Roles

```
TopologyNodeRole = 'napplet' | 'shell' | 'acl' | 'runtime' | 'service'
```

Each node has a stable `id` pattern:
- `topology-node-napplet-{name}` (e.g. `topology-node-napplet-chat`)
- `topology-node-shell`
- `topology-node-acl`
- `topology-node-runtime`
- `topology-node-service-{name}` (e.g. `topology-node-service-signer`)

### How Selections Flow

```
User clicks node in topology
  -> wireNodeSelection() in main.ts
  -> setSelectedNodeId(nodeId) in node-inspector.ts
  -> showInspector(nodeId)
    -> _activeTab = 'node'
    -> _selectedNodeId = nodeId
    -> updateInspectorPane()
      -> finds DemoTopologyNode from _topology.nodes by id
      -> buildNodeDetails(node, options) in node-details.ts
      -> renders header + content + tabs
```

## Recommended Architecture Changes

### New Tab Structure

Replace the current 2-tab system with a 3-tab system:

```
Current:  [ Node ] [ Constants ]
Proposed: [ Node ] [ Constants ] [ Kinds ]
```

Where:
- **Node** -- unchanged (selected node state, activity, ACL denials)
- **Constants** -- editable values only, filtered by selected node when one is selected
- **Kinds** -- read-only protocol kind numbers, always showing all kinds

Type change: `type InspectorTab = 'node' | 'constants' | 'kinds'`

### Component Boundaries

```
node-inspector.ts (MODIFY)
  |-- Tab bar: 3 tabs
  |-- Tab routing: delegates to the right renderer
  |-- Passes selected node context to constants-panel
  |
  |-- node-details.ts (NO CHANGE)
  |-- constants-panel.ts (MODIFY)
  |     |-- Now accepts optional node role filter
  |     |-- Only renders editable constants
  |     |-- Filters by node relevance when a node is selected
  |
  |-- kinds-panel.ts (NEW)
        |-- Renders read-only protocol kind numbers
        |-- Static list, no node filtering needed
        |-- Simpler than constants-panel (no sliders, no reset)

demo-config.ts (MODIFY)
  |-- Add getByRole(role: TopologyNodeRole): ConstantDef[]
  |-- Add getEditableDefs(): ConstantDef[]
  |-- Add getReadOnlyDefs(): ConstantDef[]
  |-- Add relevantRoles field to ConstantDef (or derive from pkg)
```

### Node-to-Constants Mapping

This is the central design question. Constants must map to topology node roles so the panel can filter. The mapping uses a new `relevantRoles` field on `ConstantDef`:

| Constant pkg | Primary Role | Rationale |
|-------------|-------------|-----------|
| `core` | `runtime` | Core constants govern runtime behavior (replay window, protocol kinds) |
| `runtime` | `runtime` | Runtime ring buffer, secret length |
| `shim` | `napplet` | Shim runs inside napplet iframes |
| `services` | `service` | Service timeouts, per-window limits |
| `acl` | `acl` | ACL quota |
| `demo` | varies/global | Demo UI timing affects the whole visualization |

Recommended approach: add a `relevantRoles` field to `ConstantDef`:

```typescript
interface ConstantDef {
  // ... existing fields ...
  /** Which topology node roles this constant is relevant to. Empty = global/all. */
  relevantRoles: TopologyNodeRole[];
}
```

Mapping for each existing constant:

| Constant | relevantRoles |
|----------|---------------|
| `core.REPLAY_WINDOW_SECONDS` | `['runtime']` |
| `runtime.RING_BUFFER_SIZE` | `['runtime']` |
| `shim.REQUEST_TIMEOUT_MS` | `['napplet']` |
| `services.DEFAULT_EOSE_TIMEOUT_MS` | `['service']` |
| `services.EOSE_FALLBACK_MS` | `['service']` |
| `services.DEFAULT_MAX_PER_WINDOW` | `['service', 'napplet']` |
| `acl.DEFAULT_QUOTA` | `['acl']` |
| `demo.FLASH_DURATION` | `[]` (global) |
| `demo.FLASH_DURATION_MS` | `[]` (global) |
| `demo.TOAST_DISPLAY_MS` | `['service']` |
| `demo.MAX_RECENT_REQUESTS` | `['service']` |
| `demo.ROLLING_WINDOW_SIZE` | `[]` (global) |
| `demo.DECAY_DURATION_MS` | `[]` (global) |
| `demo.TRACE_HOP_DURATION_MS` | `[]` (global) |
| `demo.ACL_RING_BUFFER_SIZE` | `['acl']` |
| `demo.HEADER_HEIGHT` | `[]` (global) |
| `demo.ROW_HEIGHT` | `[]` (global) |
| `core.AUTH_KIND` | `['shell', 'napplet']` |
| `core.BusKind.REGISTRATION` | `['shell', 'napplet']` |
| `core.BusKind.SIGNER_REQUEST` | `['service', 'napplet']` |
| `core.BusKind.SIGNER_RESPONSE` | `['service', 'napplet']` |
| `core.BusKind.IPC_PEER` | `['runtime', 'napplet']` |
| `core.BusKind.HOTKEY_FORWARD` | `['napplet']` |
| `core.BusKind.METADATA` | `['napplet']` |
| `core.BusKind.SERVICE_DISCOVERY` | `['runtime', 'service']` |
| `runtime.SECRET_LENGTH` | `['runtime']` |

**Filtering rule:** When a node is selected, show constants where `relevantRoles` includes the node's role OR `relevantRoles` is empty (global). When no node is selected, show all constants for that tab (editable for Constants, read-only for Kinds).

### Data Flow Changes

```
Current flow (Constants tab):
  updateInspectorPane()
    -> renderConstantsPanel()      // reads ALL defs from demoConfig
    -> wireConstantsPanelEvents()

Proposed flow (Constants tab):
  updateInspectorPane()
    -> renderConstantsPanel({ role: selectedNode?.role ?? null })  // NEW: pass context
    -> constants-panel filters defs by: editable:true AND matchesRole(role)
    -> wireConstantsPanelEvents()

Proposed flow (Kinds tab):
  updateInspectorPane()
    -> renderKindsPanel({ role: selectedNode?.role ?? null })  // NEW: pass context
    -> kinds-panel filters defs by: editable:false AND matchesRole(role)
    -> no event wiring needed (read-only, no sliders)
```

### Integration Points

| Boundary | Change Type | Details |
|----------|-------------|--------|
| `node-inspector.ts` -> `constants-panel.ts` | Signature change | `renderConstantsPanel()` gains optional `{ role?: TopologyNodeRole }` param |
| `node-inspector.ts` -> `kinds-panel.ts` | New import | New module for kinds tab rendering |
| `demo-config.ts` -> `constants-panel.ts` | New methods | `getEditableDefs()`, `getByRole()` |
| `demo-config.ts` data | Field addition | `relevantRoles: TopologyNodeRole[]` on each `ConstantDef` |
| `index.html` | CSS additions | Styles for `.kinds-row` (simpler than `.const-row`) |

## Patterns to Follow

### Pattern 1: Filtered Rendering via Context Prop

**What:** Pass the current selection context to tab renderers as an optional parameter, letting each tab decide how to filter.

**When to use:** When a tab's content depends on external state (selected node) but should also work without it.

**Trade-offs:** Simple, no new state management. The constants panel remains a stateless renderer. Downside: must pass the role on every re-render, but `updateInspectorPane` already handles this.

**Example:**
```typescript
// constants-panel.ts
export function renderConstantsPanel(options?: { role?: TopologyNodeRole }): string {
  const role = options?.role ?? null;
  const defs = demoConfig.getEditableDefs().filter(def =>
    matchesSearch(def) &&
    (role === null || def.relevantRoles.length === 0 || def.relevantRoles.includes(role))
  );
  // ... render filtered defs with existing grouping/search
}
```

### Pattern 2: Separate Module for Distinct UI Concern

**What:** Extract the kinds (read-only protocol numbers) into a new `kinds-panel.ts` rather than overloading `constants-panel.ts` with conditional branching.

**When to use:** When two views share a data source but have fundamentally different interaction models (editable vs read-only).

**Trade-offs:** Clean separation, easier to test. The kinds panel is ~60-80 lines vs the constants panel at ~280 lines. No shared state complexity.

**Example:**
```typescript
// kinds-panel.ts
export function renderKindsPanel(options?: { role?: TopologyNodeRole }): string {
  const role = options?.role ?? null;
  const defs = demoConfig.getReadOnlyDefs().filter(def =>
    role === null || def.relevantRoles.length === 0 || def.relevantRoles.includes(role)
  );
  return defs.map(def => renderKindRow(def)).join('');
}
```

### Pattern 3: Context Indicator in Tab Bar

**What:** Show the selected node's role in the Constants/Kinds tab labels to indicate contextual filtering is active.

**When to use:** Whenever filtering changes the visible set without the user explicitly requesting it.

**Trade-offs:** Gives the user confidence that filtering is active. Small visual change, no architectural cost.

**Example:**
```typescript
function renderTabBar(): string {
  const contextLabel = _selectedNodeId && _topology
    ? _topology.nodes.find(n => n.id === _selectedNodeId)?.role ?? ''
    : '';
  const constLabel = contextLabel ? `Constants (${contextLabel})` : 'Constants';
  const kindsLabel = contextLabel ? `Kinds (${contextLabel})` : 'Kinds';
  // ... render tabs with contextLabel
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Overloading the Constants Panel

**What people do:** Add `if (showKinds) { ... } else { ... }` branches inside `renderConstantsPanel()` and `wireConstantsPanelEvents()` to handle both editable and kinds views.

**Why it's wrong:** The constants panel already has ~280 lines of slider wiring, search, grouping modes, and reset logic. Cramming a fundamentally different view (static list) into it creates a branching mess and makes both views harder to change.

**Do this instead:** Create `kinds-panel.ts` as a separate module. It shares the `demoConfig` data source but owns its own rendering.

### Anti-Pattern 2: Role Mapping via String Matching on Key Prefix

**What people do:** Derive node relevance from `key.startsWith('core.')` or `pkg === 'core'` at filter time, without an explicit mapping.

**Why it's wrong:** The `pkg` field is a package grouping, not a role mapping. `core` constants are relevant to the `runtime` node (runtime uses core). `demo` constants are global but could touch any node. Implicit derivation will produce wrong results.

**Do this instead:** Add explicit `relevantRoles` to each `ConstantDef`. The mapping is small (27 entries) and easily auditable.

### Anti-Pattern 3: Storing Filter State in DemoConfig

**What people do:** Add `selectedRole` state to `DemoConfig` and have it filter internally.

**Why it's wrong:** `DemoConfig` is a data registry (holds values, tracks modifications, notifies subscribers). Adding view-layer filtering state violates its single responsibility. The filter is a UI concern that belongs in the panel renderer or inspector.

**Do this instead:** Keep `DemoConfig` as a pure data registry. Add query methods (`getEditableDefs()`, `getReadOnlyDefs()`, `getByRole()`) that return filtered copies. Let the UI layer compose the final filter.

## Files to Create or Modify

### New Files

| File | Purpose | Estimated Size |
|------|---------|---------------|
| `apps/demo/src/kinds-panel.ts` | Read-only protocol kind numbers tab renderer | ~60-80 lines |

### Modified Files

| File | Changes | Scope |
|------|---------|-------|
| `apps/demo/src/demo-config.ts` | Add `relevantRoles` to `ConstantDef`, add `getEditableDefs()`, `getReadOnlyDefs()`, `getByRole()` methods, annotate each def with roles | Medium |
| `apps/demo/src/node-inspector.ts` | Add 'kinds' to `InspectorTab` union, add third tab button, route to `renderKindsPanel()`, pass role context to `renderConstantsPanel()` | Medium |
| `apps/demo/src/constants-panel.ts` | Accept optional role filter in `renderConstantsPanel()`, filter to editable-only defs, apply role filtering | Small |
| `apps/demo/index.html` | Add CSS for `.kinds-row` and `.kinds-value` styles | Small |

### Unchanged Files

| File | Why No Change |
|------|--------------|
| `node-details.ts` | Data-only module, no rendering, no tab awareness |
| `topology.ts` | Topology structure unchanged |
| `acl-panel.ts` | Inline ACL toggles, independent of inspector tabs |
| `acl-modal.ts` | Full-screen modal, independent of inspector tabs |
| `main.ts` | Inspector initialization unchanged; `openConstantsTab()` still works |
| `shell-host.ts` | No UI changes |

## Suggested Build Order

The following order minimizes blocked work and ensures testable increments:

### Phase 1: Data Layer (demo-config.ts)

**What:** Add `relevantRoles` field to `ConstantDef`, annotate all 27 defs, add query methods.

**Why first:** All downstream rendering depends on the data model. No UI changes yet, so existing behavior is preserved.

**Dependencies:** None.

**Testable:** Verify `getEditableDefs()` returns 17 items, `getReadOnlyDefs()` returns 10 items, `getByRole('runtime')` returns the expected subset.

### Phase 2: Kinds Panel (kinds-panel.ts + index.html CSS)

**What:** Create `kinds-panel.ts` rendering read-only protocol kind numbers. Add `.kinds-*` CSS to `index.html`.

**Why second:** Self-contained new file, no modifications to existing rendering. Can be built and tested in isolation before wiring into the tab system.

**Dependencies:** Phase 1 (`getReadOnlyDefs()`).

**Testable:** Import and call `renderKindsPanel()`, verify HTML output contains protocol kind numbers.

### Phase 3: Tab System Expansion (node-inspector.ts)

**What:** Add 'kinds' to `InspectorTab`, add third tab button to `renderTabBar()`, route the kinds tab to `renderKindsPanel()`. Wire tab handler.

**Why third:** Integrates the new kinds panel into the existing tab system. Requires Phase 2 to exist.

**Dependencies:** Phase 2 (kinds-panel module exists).

**Testable:** Click the Kinds tab, verify read-only constants render correctly. Node and Constants tabs still work as before.

### Phase 4: Contextual Filtering (constants-panel.ts + node-inspector.ts)

**What:** Modify `renderConstantsPanel()` to accept `{ role?: TopologyNodeRole }`, filter to editable-only defs, apply role filtering. Modify `updateInspectorPane()` in `node-inspector.ts` to pass the selected node's role. Optionally add role-based filtering to `renderKindsPanel()` as well. Update tab labels to show context indicator.

**Why last:** This is the most complex change and touches two files. By this point the tab system already works with 3 tabs, so this phase only changes what the Constants and Kinds tabs display based on selection.

**Dependencies:** Phase 1 (relevantRoles data), Phase 3 (tab system wired).

**Testable:** Select a runtime node, verify Constants tab shows only runtime-relevant + global constants. Select an ACL node, verify it shows ACL-relevant + global. Deselect node, verify all editable constants appear. Tab labels show context indicator.

## Sources

All findings derived from direct codebase analysis:
- `apps/demo/src/node-inspector.ts` -- tab system, inspector lifecycle
- `apps/demo/src/constants-panel.ts` -- current constants rendering
- `apps/demo/src/demo-config.ts` -- ConstantDef data model, DemoConfig class
- `apps/demo/src/node-details.ts` -- NodeDetail data shape, role-specific builders
- `apps/demo/src/topology.ts` -- TopologyNodeRole, node IDs
- `apps/demo/src/main.ts` -- wiring, initialization flow
- `apps/demo/index.html` -- layout, CSS

---
*Architecture research for: v0.11.0 Side Panel Cleanup*
*Researched: 2026-04-04*
