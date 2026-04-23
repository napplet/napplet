# Phase 33: Polish Demo UI Layout - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix layout and interaction issues in the demo UI to improve visual clarity and usability:
- Napplet iframe fills container without whitespace
- Topology edges render with 90-degree rectilinear routing
- Input/output connection points visually distinct with offset positioning
- No orphan edges to undefined container nodes
- Service buttons respond without triggering node panel opening

Phase 33 is the final polish pass of v0.6.0 Demo Upgrade. Depends on Phase 32 (UI/UX bug fixes).

</domain>

<decisions>
## Implementation Decisions

### Iframe Container Rendering
- **D-01:** Napplet iframe will fill the `.topology-frame-slot` container (flex: 1) to use available vertical space without padding or margin gaps
- **D-02:** The iframe element itself will use `width: 100%; height: 100%;` to match parent container exactly
- **Rationale:** Phase 32 established layout structure; iframe whitespace wastes visual real estate in the constrained layout. No padding needed as the `.topology-frame-slot` already has container styling boundaries.

### Topology Edge Routing
- **D-03:** Leader Line edges will be configured with `curve: 0` to force orthogonal (90-degree) rectilinear routing instead of curves
- **D-04:** Socket gravity offsets will be adjusted to position connectors at cardinal directions (top/bottom for vertical edges, left/right for horizontal)
- **D-05:** Path resolution will use Leader Line's built-in orthogonal routing (no custom algorithm needed)
- **Rationale:** Leader Line already supports orthogonal routing via the curve option. Rectilinear paths are standard in node graph UIs and improve clarity. User can visually trace message flow direction (left→right, top→bottom).

### Connection Point Distinction
- **D-06:** Input and output ports will be positioned using socket gravity offsets: inputs on left side (negative X), outputs on right side (positive X)
- **D-07:** Visual distinctness achieved via CSS `.topology-edge-in` and `.topology-edge-out` classes with different colors or opacity if needed
- **D-08:** No additional DOM elements needed — socket gravity positioning on the two-line approach (out-line + in-line) in initTopologyEdges() provides the visual offset
- **Rationale:** Current implementation already renders separate forward/reverse edges (startSocketGravity vs endSocketGravity). Tweaking gravity values ([±12, 0]) positions endpoints distinctly. Avoids new DOM complexity while reusing existing socket system.

### Orphan Edge Cleanup
- **D-09:** Remove the edge definition that references `topology-napplets` (source) → it references a container element that doesn't exist in the topology node tree
- **D-10:** Napplet-to-shell edges (`getNappletEdgeId()`) will be the only connections from individual napplets to shell — no aggregate "napplets" container edge
- **Rationale:** The `topology-napplets` was a layout grouping element, not a topology node. Edges must connect real nodes. Removing orphan edge prevents LeaderLine from throwing "element not found" errors during line initialization.

### Service Button Click Isolation
- **D-11:** Service buttons (notification controls, signer connect button) use `data-action` attributes and will have click handlers that use `event.stopPropagation()` to prevent bubbling to node selection handler
- **D-12:** Node selection handler in wireNodeSelection() will check if clicked element is a button: `if (event.target.tagName === 'BUTTON') return;` before opening inspector
- **D-13:** Alternatively (if simpler), buttons will be wrapped in a container with a specific selector that the node click listener skips: `event.stopPropagation()` on the button's ancestor
- **Rationale:** Current node click handler fires on any click within [data-node-id]. Buttons already have data-action; preventing bubbling is the standard pattern. Keeps concerns separated: node selection ≠ button action.

### Claude's Discretion
- Layout reflow/animation on inspector pane resize — user deferred to Claude for animation timing and smoothness
- Socket gravity fine-tuning values — Claude has discretion to adjust the exact offsets ([12, -8], etc.) based on visual feedback during testing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Implementation
- `apps/demo/src/topology.ts` — DemoTopology types, buildDemoTopology(), renderDemoTopology(), initTopologyEdges() with Leader Line setup
- `apps/demo/index.html` — `.topology-frame-slot` iframe container, `.topology-edge` CSS, socket gravity styles
- `apps/demo/src/main.ts` — wireNodeSelection() handler, iframe loading, topology render orchestration

### Leader Line Library
- Leader Line UMD module loaded at runtime: `<script src="/node_modules/leader-line/leader-line.min.js"></script>`
- API: `new LeaderLine(element1, element2, options)` with curve/gradient/socketGravity support

### Related Phases
- Phase 32: Fix demo UI/UX bugs — Added Leader Line SVG edges, amber state, isAmber logic
- Phase 28: Architecture Topology View — Established node hierarchy and edge structure
- Phase 29: Node Detail & Drill-Down — Right-side inspector pane with selected-node state

No external specs — requirements fully captured in phase goal and decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **LeaderLine edge rendering**: `initTopologyEdges()` creates forward/reverse edge pairs with socket gravity — can be extended with curve/routing options
- **Node selection handler**: `wireNodeSelection()` in main.ts already listens to [data-node-id] clicks — can be enhanced with element type checks
- **Service button pattern**: Notification and signer buttons already use `data-action` attributes — consistent action dispatch pattern

### Established Patterns
- **Socket gravity for positioning**: Edges use `startSocketGravity: [12, 0]` and `endSocketGravity: [-12, 0]` to offset from node borders — extensible for input/output distinction
- **Event handling**: Button clicks dispatch via `data-action` attributes caught in global listener — prevents direct node DOM manipulation
- **Container filling**: Flex layout with `flex: 1` and `min-height: 0` already used for topology-pane — same pattern applies to iframe slot

### Integration Points
- Main rendering happens in `renderDemoTopology()` — topology structure passed in
- Frame container is `.topology-frame-slot` inside napplet card — iframe is loaded into this slot
- Global click handlers listen to document; use event.target checks or data-* selectors for dispatch

</code_context>

<specifics>
## Specific Ideas

### Iframe Filling
The Phase 32 frame content notes mention iframe layout issues. The `<iframe>` element loaded into `.topology-frame-slot` should expand to fill the container without padding or scrollbars hiding content.

### Leader Line Routing
Phase 32 already added Leader Line SVG edges. The curve option (`curve: 0` for orthogonal) is a built-in Leader Line feature — no custom path calculation needed.

### Port Visibility
Input vs output distinction can be subtle (color, opacity, or socket offset). User didn't specify a preference, so Claude has discretion to choose what looks cleanest — could use opacity (output brighter, input dimmer) or slight color hue shift.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 33-polish-demo-ui-layout*
*Context gathered: 2026-04-01*
