# Phase 56: Contextual Filtering - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Add contextual filtering to the Constants tab so it shows only constants relevant to the currently selected topology node. When no node is selected, show all. Provide a "show all" toggle to override filtering. Handle zero-result empty state gracefully.

</domain>

<decisions>
## Implementation Decisions

### Filter Integration
- **D-01:** When a topology node is selected, the Constants tab calls `demoConfig.getByRole(selectedNodeRole)` filtered to editable-only, instead of `demoConfig.getEditableDefs()`.
- **D-02:** When no node is selected (`_selectedNodeId` is null), show all editable constants (current default behavior via `getEditableDefs()`).
- **D-03:** The selected node's role is obtained from the topology data (already available via `getNodeDetail()` or similar in `node-inspector.ts`).
- **D-04:** Filtering applies ONLY to the Constants tab. The Kinds tab always shows all kinds (per research recommendation — 9 items is too few to filter).

### Show-All Toggle
- **D-05:** A small toggle at the top of the Constants tab lets the user bypass contextual filtering.
- **D-06:** Toggle label: "Show all" when filtering is active, "Filter to [node name]" when showing all with a node selected.
- **D-07:** Toggle state is session-scoped (resets on page reload). Persists across tab switches but NOT across node selections (selecting a new node re-engages filtering).
- **D-08:** When no node is selected, the toggle is hidden (nothing to filter).

### Empty State
- **D-09:** When the contextual filter produces zero editable constants for a role, show: "No editable constants for [node name]" with a "Show all" link/button.
- **D-10:** Clicking the "Show all" link in the empty state activates the show-all toggle.

### Claude's Discretion
- Exact CSS styling for the toggle and empty state (consistent with inspector pane styling)
- Whether the toggle is a checkbox, button, or text link
- Whether to show a count badge like "(3 of 16)" next to the tab label
- How to pass selectedNodeRole into the constants panel render function

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Inspector Pane (Phase 55 output)
- `apps/demo/src/node-inspector.ts` — 3-tab system, `_selectedNodeId`, `updateInspectorPane()`, `getActiveTab()`
- `apps/demo/src/constants-panel.ts` — `renderConstantsPanel()` already calls `getEditableDefs()`, `wireConstantsPanelEvents()`
- `apps/demo/src/kinds-panel.ts` — `renderKindsPanel()` for reference card pattern

### Data Model (Phase 54 output)
- `apps/demo/src/demo-config.ts` — `getByRole(role)`, `getEditableDefs()`, `ConstantDef.relevantRoles`

### Topology
- `apps/demo/src/topology.ts` — `TopologyNodeRole` type, topology node data
- `apps/demo/src/node-details.ts` — `getNodeDetail()`, `NodeDetail.role`

### Research
- `.planning/research/FEATURES.md` — Chrome DevTools contextual filtering pattern, Blender pin icon escape hatch
- `.planning/research/PITFALLS.md` — Cross-cutting constants, empty state handling

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getByRole(role)` on DemoConfig — Returns editable + read-only constants for a role, plus globals. Need to further filter to editable-only for Constants tab.
- `_selectedNodeId` in `node-inspector.ts` — Already tracks which node is selected. Can derive role from this.
- `renderConstantsPanel()` — Currently takes no args. Needs to accept optional role filter parameter.

### Established Patterns
- Inline styles for dynamic UI elements
- Toggle buttons pattern from `acl-panel.ts` capability toggles
- Module-level state for UI flags (like `_activeTab`)

### Integration Points
- `updateInspectorPane()` — passes render context to `renderConstantsPanel()`, needs to include selected role
- `constants-panel.ts` — render function signature changes to accept optional role
- Module-level `_showAll` flag in constants-panel or node-inspector

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard contextual filtering following Chrome DevTools pattern with Blender-style pin/show-all escape hatch.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 56-contextual-filtering*
*Context gathered: 2026-04-04*
