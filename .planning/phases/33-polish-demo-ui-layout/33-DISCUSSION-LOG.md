# Phase 33: Polish Demo UI Layout - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 33-polish-demo-ui-layout
**Mode:** Auto-analyze (--auto flag)
**Areas discussed:** 5

---

## Iframe Container Filling

**Decision Goal:** Napplet iframe should fill its container `.topology-frame-slot` without unused whitespace.

| Option | Description | Selected |
|--------|-------------|----------|
| Fill container (flex: 1, 100% width/height) | Iframe expands to use available space; no padding/margins | ✓ |
| Maintain padding/margins | Keep visual breathing room around iframe content | |
| Scrollable container | Use overflow: auto if content exceeds bounds | |

**User's choice:** Fill container with `width: 100%; height: 100%;`
**Notes:** Phase 32 established layout structure. Whitespace wastes visual real estate in the constrained layout. Container already has styling boundaries via `.topology-frame-slot`.

---

## Topology Edge Routing

**Decision Goal:** Topology edges should render with 90-degree rectilinear routing instead of curves for clarity and visual flow.

| Option | Description | Selected |
|--------|-------------|----------|
| Orthogonal routing (curve: 0) | Straight 90-degree lines following cardinal directions | ✓ |
| Curved routing | Smooth Bezier curves (current Leader Line default) | |
| Hybrid (curve control) | Mix of straight and curved segments for balance | |

**User's choice:** Orthogonal routing via `curve: 0` in Leader Line options
**Notes:** Leader Line already supports orthogonal routing. Rectilinear paths are standard in node-graph UIs. Improves visual traceability of message flow direction (left→right, top→bottom). No custom algorithm needed.

---

## Connection Point Visual Distinction

**Decision Goal:** Input and output connection points should be visually distinct and offset from each other on nodes.

| Option | Description | Selected |
|--------|-------------|----------|
| Socket gravity positioning | Use startSocketGravity [12, 0] for output, [-12, 0] for input | ✓ |
| CSS-only distinction | Different colors, opacity, or border styles for in/out edges | |
| Additional DOM elements | Add visual port markers (circles, rectangles) | |

**User's choice:** Socket gravity offsets with optional CSS class distinction (`.topology-edge-in`, `.topology-edge-out`)
**Notes:** Current implementation already renders separate forward/reverse edge pairs. Tweaking gravity values positions endpoints distinctly. Avoids new DOM complexity while reusing existing socket system. CSS can add color/opacity differentiation if needed.

---

## Orphan Edge Cleanup

**Decision Goal:** Remove edges that reference non-existent container nodes (e.g., `topology-napplets`).

| Option | Description | Selected |
|--------|-------------|----------|
| Remove orphan edges | Delete edge references to non-existent nodes | ✓ |
| Create missing container nodes | Add `topology-napplets` as a layout container node | |
| Conditionally skip rendering | Only render edges where both endpoints exist | |

**User's choice:** Remove the orphan edge definition referencing `topology-napplets`
**Notes:** `topology-napplets` was a layout grouping element, not a real topology node. Edges must connect real nodes. Removing orphan edge prevents LeaderLine from throwing "element not found" errors.

---

## Service Button Click Isolation

**Decision Goal:** Service buttons (notification controls, signer connect) should not trigger node panel opening when clicked.

| Option | Description | Selected |
|--------|-------------|----------|
| Stop propagation on buttons | Use `event.stopPropagation()` on button click handlers | ✓ |
| Check target type in node handler | Skip node selection if clicked element is a button tag | |
| Wrap buttons in isolated container | Use a selector to skip propagation for button ancestors | |

**User's choice:** Implement `event.stopPropagation()` on service button handlers; optionally add element type check in node selection handler
**Notes:** Current node click handler fires on any click within [data-node-id]. Buttons already have data-action attributes. Preventing bubbling is the standard pattern. Keeps concerns separated: node selection ≠ button action.

---

## Claude's Discretion

- Layout reflow/animation timing on inspector pane resize
- Socket gravity fine-tuning values (exact offsets based on visual feedback)
- Output vs input port color/opacity distinction (subtle visual cues)

---

## Session Summary

Phase 33 context gathered with auto-selected decisions for 5 layout/interaction areas. All decisions are grounded in existing code patterns and Phase 32's established structure. No conflicts with prior phases. Ready for planning.

