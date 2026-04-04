# Phase 55: Tab Reorganization - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Split the inspector pane from 2 tabs (Node, Constants) into 3 tabs (Node, Constants, Kinds). Constants tab shows only editable behavioral values. Kinds tab shows read-only protocol kind numbers. Active tab persists across node selection changes. Polling timer guarded to avoid destroying input state.

</domain>

<decisions>
## Implementation Decisions

### Tab Labels and Layout
- **D-01:** Three tabs: "Node", "Constants", "Kinds" — `InspectorTab` union extended to `'node' | 'constants' | 'kinds'`
- **D-02:** Tab bar must fit within 280px inspector width. Short labels keep it tight.
- **D-03:** Tab order: Node (default) | Constants | Kinds

### Constants Tab (editable only)
- **D-04:** Constants tab renders only `demoConfig.getEditableDefs()` results (16 items). Same slider + input + reset UI as before.
- **D-05:** Existing `renderConstantsPanel()` in `constants-panel.ts` is modified to use `getEditableDefs()` instead of `getAllDefs()`.

### Kinds Tab (read-only)
- **D-06:** Kinds tab shows all read-only protocol kind constants from `demoConfig.getReadOnlyDefs()` filtered to `domain === 'protocol'` (9 items: AUTH_KIND + 8 BusKind values).
- **D-07:** Display format: compact reference cards showing label, numeric value, and description. No sliders or edit controls.
- **D-08:** Non-protocol read-only constants (e.g., `shim.REQUEST_TIMEOUT_MS`, `runtime.SECRET_LENGTH`) also shown in Kinds tab as a separate "Other Read-Only" section.

### Tab Persistence
- **D-09:** Remove `_activeTab = 'node'` reset in `showInspector()`. Active tab persists when clicking different topology nodes.
- **D-10:** The tab bar always reflects the current `_activeTab` state, even after node selection changes.

### Polling Timer Guard
- **D-11:** The 1500ms `setInterval` in `updateInspectorPane()` only re-renders content when `_activeTab === 'node'`. Constants and Kinds tabs are not polled — they re-render on explicit user action only.
- **D-12:** This prevents the innerHTML replacement from destroying active input focus and slider state.

### Claude's Discretion
- Exact CSS styling for Kinds reference cards (consistent with existing inspector styling)
- Whether Kinds tab needs a new module (`kinds-panel.ts`) or can be inline in `node-inspector.ts`
- Search/filter behavior on the Constants tab (carry over existing search if it works)
- Whether `renderConstantsPanel` signature needs to change

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Inspector Pane
- `apps/demo/src/node-inspector.ts` — Tab system, `InspectorTab` type, `renderTabBar()`, `updateInspectorPane()`, `showInspector()`, polling timer
- `apps/demo/src/constants-panel.ts` — `renderConstantsPanel()`, `wireConstantsPanelEvents()` — currently renders ALL constants

### Data Model (Phase 54)
- `apps/demo/src/demo-config.ts` — `ConstantDef` with `relevantRoles`, `getEditableDefs()`, `getReadOnlyDefs()`, `getByRole()`

### Phase 49 Context
- `.planning/phases/49-constants-panel/49-CONTEXT.md` — Original constants panel decisions (D-05: editable vs read-only, D-06: slider + input combo)

### Research
- `.planning/research/PITFALLS.md` — Polling timer DOM re-render issue, tab bar width constraints
- `.planning/research/FEATURES.md` — Chrome DevTools Styles/Computed tab split pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `renderTabBar()` in `node-inspector.ts` — Already renders 2-tab bar with active state. Extend to 3 tabs.
- `renderConstantsPanel()` in `constants-panel.ts` — Full render function with search, grouping, sliders. Modify to use `getEditableDefs()`.
- `wireConstantsPanelEvents()` — Event wiring for sliders/inputs. Reusable as-is for Constants tab.

### Established Patterns
- Tab rendering: `data-inspector-tab` attribute on buttons, click handler switches `_activeTab` and calls `updateInspectorPane()`
- Inline styles for dynamic UI (UnoCSS can't detect dynamically-assigned classes)
- `setInterval` at 1500ms for live-updating Node tab data

### Integration Points
- `showInspector(nodeId)` — line 334 resets `_activeTab = 'node'` (must be removed for persistence)
- `updateInspectorPane()` — main render dispatcher, needs `'kinds'` branch added
- `index.html` — no changes needed (inspector pane is fully JS-rendered)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard tab split following Chrome DevTools Styles/Computed pattern.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 55-tab-reorganization*
*Context gathered: 2026-04-04*
