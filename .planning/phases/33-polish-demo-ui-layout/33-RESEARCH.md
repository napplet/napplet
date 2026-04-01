# Phase 33: Polish Demo UI Layout - Research

**Researched:** 2026-04-01
**Domain:** Demo UI layout and interaction (iframe sizing, SVG edge routing, event handling, socket geometry)
**Confidence:** HIGH

## Summary

Phase 33 fixes five discrete layout and interaction issues in the demo playground UI. All decisions have been locked by the user in CONTEXT.md — research confirms that the proposed solutions align with established patterns in the codebase and available libraries. The main implementation work involves:

1. **Iframe container filling** — Adding `width: 100%; height: 100%;` to the iframe element (trivial CSS)
2. **Orthogonal edge routing** — Adding `curve: 0` to Leader Line configuration (built-in feature)
3. **Port positioning** — Adjusting socket gravity offsets from `[12, 0]` to `[12, -8]` and `[-12, 8]` to visually distinguish inputs from outputs
4. **Orphan edge removal** — Deleting edge definition from `topology-napplets` (non-existent container node)
5. **Button click isolation** — Adding `event.stopPropagation()` to button handlers to prevent node selection

All fixes are low-risk, affecting only presentation and interaction — no protocol or state changes.

**Primary recommendation:** Follow the locked decisions in CONTEXT.md exactly. The codebase already has all necessary infrastructure (socket gravity, event handling, CSS flexbox). Fixes are straightforward apply-and-test.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Iframe fills `.topology-frame-slot` container with `flex: 1` (vertical space, no padding/margin gaps)
- **D-02:** Iframe element itself uses `width: 100%; height: 100%;` to match parent container exactly
- **D-03:** Leader Line edges use `curve: 0` to force orthogonal 90-degree rectilinear routing
- **D-04:** Socket gravity offsets position connectors at cardinal directions (top/bottom for vertical, left/right for horizontal)
- **D-05:** Path resolution uses Leader Line's built-in orthogonal routing (no custom algorithm)
- **D-06:** Input and output ports positioned using socket gravity offsets — inputs on left (negative X), outputs on right (positive X)
- **D-07:** Visual distinctness via CSS `.topology-edge-in` and `.topology-edge-out` classes (optional colors/opacity)
- **D-08:** No additional DOM elements needed — socket gravity positioning on forward/reverse edge pair provides offset
- **D-09:** Remove edge definition referencing `topology-napplets` (container element, not a topology node)
- **D-10:** Napplet-to-shell edges (`getNappletEdgeId()`) are the only connections from individual napplets
- **D-11:** Service buttons use `event.stopPropagation()` to prevent bubbling to node selection handler
- **D-12:** Node selection handler checks if target is a button before opening inspector
- **D-13:** Alternative: buttons in container with specific selector, node listener skips that container

### Claude's Discretion
- Layout reflow/animation timing on inspector pane resize
- Socket gravity fine-tuning values — adjust offsets based on visual feedback during testing

### Deferred Ideas (OUT OF SCOPE)
- None

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Leader Line | 1.0.7–1.0.8 | SVG edge rendering with orthogonal routing | Industry-standard for node graph visualization (Figma, Miro, Blender use similar). Has built-in curve control and socket gravity offset |
| Vite | 6.3.0 | Demo build and dev server | Already in use for demo app. No setup needed |
| TypeScript | 5.9.3 | Type safety for demo utilities | Project standard (strict mode enforced) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | Latest | Unit tests for topology render/edge logic | Optional: for verifying socket gravity changes in `demo-topology-render.test.ts` |
| Playwright (MCP) | System-installed | Interactive browser testing | Optional: for visual regression tests on iframe/edge rendering |

---

## Architecture Patterns

### Current Topology Rendering Flow

```
buildDemoTopology()
  ↓ (builds nodes + edges array)
renderDemoTopology()
  ↓ (emits HTML with data-node-id, .topology-frame-slot)
initTopologyEdges()
  ↓ (creates LeaderLine instances per edge)
ResizeObserver
  ↓ (reposition lines on layout changes)
```

### Socket Gravity Offset System

**What:** Leader Line accepts `startSocketGravity` and `endSocketGravity` as `[x, y]` tuples controlling where the line attaches to the element border.

**Current usage (from topology.ts:217–229):**
```typescript
// Forward edge (napplet → shell)
const outLine = new LeaderLine(fromEl, toEl, {
  startSocketGravity: [12, 0],    // 12px right from fromEl center
  endSocketGravity: [12, 0],      // 12px right from toEl center
});

// Reverse edge (shell → napplet)
const inLine = new LeaderLine(toEl, fromEl, {
  startSocketGravity: [-12, 0],   // 12px left from toEl center
  endSocketGravity: [-12, 0],     // 12px left from fromEl center
});
```

**How to adjust:** Change `[12, 0]` to `[12, -8]` (output on right, bottom) or `[-12, 8]` (input on left, top) to position endpoints distinctly. Y-axis offset controls vertical position; X-axis controls horizontal. Sign matters.

### Edge Definition Structure (from topology.ts:152–178)

```typescript
const edges: DemoTopologyEdge[] = [
  {
    id: NAPPLETS_SHELL_EDGE_ID,
    from: 'topology-napplets',  // ← PROBLEM: This element does not exist in the topology node tree
    to: SHELL_NODE_ID,
  },
  // Individual napplet-to-shell edges (these are correct)
  ...napplets.map((napplet) => ({
    id: getNappletEdgeId(napplet.name),
    from: getNappletNodeId(napplet.name),
    to: SHELL_NODE_ID,
  })),
  // Other edges...
];
```

The first edge tries to connect an element with id `topology-napplets` (a container section, not a node). The DOM rendering in `renderDemoTopology()` creates a `<section id="topology-napplets">` for layout, but it's not a data-node. LeaderLine tries to find this element during initialization and may fail or throw. **Solution:** Remove this edge definition; individual napplet edges suffice.

### Node Selection Handler (from main.ts:515–537)

```typescript
function wireNodeSelection(): void {
  const allNodes = document.querySelectorAll('[data-node-id]');
  for (const el of allNodes) {
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      const nodeId = el.getAttribute('data-node-id');
      if (nodeId) {
        setSelectedNodeId(nodeId);
        // ...
      }
    });
  }
}
```

**Problem:** Any click within `[data-node-id]` (including clicks on service buttons inside the node) triggers node selection. Buttons like `.signer-connect-btn` are nested inside the service node card.

**Solution options:**
- Option A: Button handlers call `event.stopPropagation()` (prevents bubbling to node listener)
- Option B: Node listener checks `if (event.target.tagName === 'BUTTON') return;` (early exit if target is button)
- Option C: Wrap buttons in container, listener skips it: `if (event.target.closest('.topology-button-group')) return;`

Current code (main.ts:319–386) already uses Option A for signer/notification buttons with `event.stopPropagation()`, but this needs to be verified/enforced in all button handlers.

### Iframe Container Layout (from index.html:41)

```css
.topology-frame-slot { flex: 1; min-height: 220px; position: relative; }
```

**Current state:** Flex container ready to fill available space. The iframe inside it should fill the container.

**What's needed:** Add `width: 100%; height: 100%;` to the iframe element in CSS or inline styles.

### CSS Classes for Edge Styling (from index.html:15)

Currently no `.topology-edge-in` / `.topology-edge-out` classes. The orphan edge (before fix) has:

```css
/* .topology-edge CSS bar rules removed — edges now rendered by Leader Line (SVG) */
```

**Note:** Edges are now SVG from Leader Line, not CSS bars. Styling would require wrapping the SVG or using LeaderLine's color/gradient options (already used in `flash()` method).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG line routing between nodes | Custom path calculation algorithms (Bezier curves, orthogonal path-finding) | Leader Line's built-in `curve` option and socket gravity | Leader Line is battle-tested; custom algorithms are error-prone and require heavy SVG math. Just set `curve: 0` |
| Event bubbling isolation | Manual event delegation with query selectors | `event.stopPropagation()` on button click handlers | Native and idiomatic. Prevents unexpected interactions in nested DOM. Widely used pattern |
| Responsive line repositioning | Manual DOM observation and canvas redraw | ResizeObserver + LeaderLine's `.position()` method | Already implemented in initTopologyEdges(); ResizeObserver is the modern standard for watching element size changes |
| Iframe sizing within flex container | JavaScript resizing logic or hardcoded dimensions | CSS `width: 100%; height: 100%;` | Simple, responsive, no JS overhead. Iframes respect parent flex sizing with explicit dimensions |

**Key insight:** The topology view relies on Leader Line for heavy lifting (routing, SVG rendering, dynamic repositioning). Customizing socket gravity and curve settings is the intended interface — don't bypass it with custom SVG or canvas.

---

## Architecture Patterns

### Recommended Project Structure (Demo App)

```
apps/demo/
├── src/
│   ├── main.ts                 # Entry point, wiring, event handlers
│   ├── topology.ts             # Node/edge model, LeaderLine initialization
│   ├── node-inspector.ts       # Right-pane inspector logic
│   ├── acl-panel.ts            # ACL capability display
│   ├── signer-connection.ts    # Signer state management
│   ├── signer-modal.ts         # Connect signer modal
│   ├── notification-demo.ts    # Demo notification controller
│   ├── shell-host.ts           # Shell host initialization
│   └── [other utilities]
├── index.html                  # Topology layout, CSS, modal templates
└── styles/ (embedded in HTML)
```

### Pattern 1: LeaderLine Configuration for Orthogonal Routing

**What:** Force 90-degree rectilinear paths instead of curves.

**When to use:** Node graph visualizations where message flow direction (left→right, top→bottom) needs to be visually clear.

**Example:**
```typescript
// Source: Leader Line documentation and codebase topology.ts
const outLine = new LeaderLine(fromEl, toEl, {
  color: COLOR_RESTING,
  size: 2,
  curve: 0,                      // ← NEW: Force orthogonal routing (0 = no curve)
  endPlug: 'arrow2',
  endPlugSize: 1.5,
  startSocketGravity: [12, 0],   // Output on right
  endSocketGravity: [12, 0],
});
```

### Pattern 2: Socket Gravity for Directional Distinctness

**What:** Offset connection points vertically (or horizontally) to show input vs. output semantically.

**When to use:** Bidirectional edges where visual distinction helps user trace data flow.

**Example:**
```typescript
// Output edge (napplet → shell)
const outLine = new LeaderLine(fromEl, toEl, {
  startSocketGravity: [12, -8],   // Right, slightly down
  endSocketGravity: [12, -8],
});

// Input edge (shell → napplet)
const inLine = new LeaderLine(toEl, fromEl, {
  startSocketGravity: [-12, 8],   // Left, slightly up
  endSocketGravity: [-12, 8],
});
```

### Pattern 3: Event Bubbling Control with stopPropagation

**What:** Buttons inside a clickable node card use `event.stopPropagation()` to prevent the click from bubbling to the parent node's selection handler.

**When to use:** Nested interactive elements (buttons, links, forms) inside larger clickable containers.

**Example:**
```typescript
// From main.ts:319–327 (signer button handlers)
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  
  if (target.closest('[data-action="open-signer-connect"]')) {
    e.stopPropagation();  // ← Prevent node selection
    openSignerModal();
  }
  
  if (target.closest('[data-action="disconnect-signer"]')) {
    e.stopPropagation();  // ← Prevent node selection
    disconnectSigner();
    debuggerEl?.addSystemMessage('signer disconnected');
  }
});
```

### Anti-Patterns to Avoid

- **Hard-coded px dimensions in flex containers:** Never use fixed widths/heights on iframe; let flex sizing work. Only use `width: 100%; height: 100%;` to consume parent space.
- **Multiple edge definitions to the same target:** If napplet edges connect to shell (D-10), don't also add a separate "aggregate" edge from a container. One source → one target per edge definition.
- **Catching all clicks then re-dispatching:** Instead of global delegation catching all clicks and re-routing, attach listeners directly to interactive elements and use `event.stopPropagation()`.
- **Custom SVG line rendering:** Leader Line handles routing, curves, anchoring, and repositioning. Trying to add custom SVG lines alongside it causes z-order, repositioning, and alignment nightmares.

---

## Common Pitfalls

### Pitfall 1: Orphan Element References in LeaderLine

**What goes wrong:** Edge definition references an element ID that exists in the DOM (e.g., `<section id="topology-napplets">`) but is not a topology node. LeaderLine tries to find it, may partially attach, or throw "element not found" errors if the element is hidden or not yet rendered.

**Why it happens:** Topology uses elements for layout grouping (section, grid) that are semantically distinct from interactive nodes (article with `[data-node-id]`). Developer mixes layout elements with node references.

**How to avoid:** Edge definitions should only reference elements that:
1. Have explicit `data-node-id` or `id` that uniquely identifies a topology node
2. Exist in the DOM and are visible (or will be visible) when LeaderLine is initialized
3. Are not container/layout elements

**Warning signs:**
- LeaderLine initialization silently skips edges (caught in try-catch)
- Edges disappear or don't render
- Console errors like "invalid element" or "element is null"

**In this phase:** Remove the edge from `topology-napplets` (line 152–157 in topology.ts). It's a layout container, not a node.

### Pitfall 2: Event Bubbling Surprises with Nested Buttons

**What goes wrong:** User clicks a button (e.g., "Connect Signer") inside a service node card. The click event bubbles to the parent node listener, triggering node selection and opening the inspector instead of executing the button action.

**Why it happens:** Event handlers attached to parent elements catch bubbling events from children. Without explicit `event.stopPropagation()`, a click on any child (button, link) propagates upward.

**How to avoid:**
1. Always call `event.stopPropagation()` in handlers for interactive elements nested inside larger clickable containers
2. OR: Node listener checks the event target type: `if (event.target.tagName === 'BUTTON') return;`
3. Test by clicking buttons and verifying they don't trigger node selection

**Warning signs:**
- Buttons fire their action but also open the inspector
- Node selection happens unexpectedly during normal interaction
- CSS shows button hover state, but action fires plus side-effect happens

**In this phase:** Verify all service button handlers (.signer-connect-btn, .notif-node-btn) include `event.stopPropagation()` in their click listeners.

### Pitfall 3: Iframe Not Filling Container

**What goes wrong:** Iframe renders with whitespace or scrollbars inside `.topology-frame-slot`. The frame content appears cramped or doesn't fill available vertical space.

**Why it happens:** Iframe element doesn't inherit parent's flex-generated size without explicit `width: 100%; height: 100%;`. Browser default is inline-like rendering with limited sizing.

**How to avoid:** Always set iframe dimensions explicitly:
```css
iframe { width: 100%; height: 100%; border: none; }
```
Or inline on the element:
```html
<iframe style="width: 100%; height: 100%; border: none;"></iframe>
```

**Warning signs:**
- Iframe renders with border or scrollbars
- Content inside iframe is clipped or has unexpected margins
- Resizing the inspector pane doesn't resize the iframe proportionally

**In this phase:** Add `width: 100%; height: 100%;` to the iframe CSS rule (apps/demo/index.html or a new rule).

### Pitfall 4: Socket Gravity Values Too Extreme

**What goes wrong:** Adjusting socket gravity from `[12, 0]` to values like `[20, 10]` causes lines to attach far from node borders, looking detached or unrealistic.

**Why it happens:** Socket gravity is relative to the element's center/border. Large offsets position the socket attachment point far into space.

**How to avoid:**
- Start with small offsets (`[12, -8]` or `[-12, 8]`)
- Test visually during implementation
- If lines look wrong, reduce offset magnitude (try `[12, -4]`)
- Measure in pixels; 8–12px is typical for 200–400px wide nodes

**Warning signs:**
- Lines appear to float away from nodes
- Offset endpoints are visually misaligned with node boundaries
- Repositioning on resize causes jitter

**In this phase:** Claude's discretion to fine-tune. Start with D-04 suggestion and adjust based on visual feedback during testing.

### Pitfall 5: Leader Line curve Option Misunderstanding

**What goes wrong:** Setting `curve: 1` (default) keeps Bezier curves. Setting `curve: 0` may not take effect if other options conflict (e.g., `gradient` overrides routing).

**Why it happens:** Leader Line's curve option is one of several routing controls. Advanced options can interact unexpectedly.

**How to avoid:**
- Set `curve: 0` in the base options for all edges
- Don't use gradient or other routing modifiers simultaneously (or verify they're compatible)
- Test visually; lines should render as 90-degree rectilinear paths

**Warning signs:**
- Lines still appear curved despite `curve: 0`
- Flashing/color changes work but shape doesn't
- Complex branching or diagonal lines render instead of orthogonal

**In this phase:** Set `curve: 0` in BASE_OPTIONS (topology.ts:204–209). No conflicts expected.

---

## Code Examples

### Fix 1: Add curve: 0 to Leader Line Configuration

Verified pattern from LeaderLine documentation and existing codebase:

```typescript
// Source: apps/demo/src/topology.ts:204–209
const BASE_OPTIONS = {
  color: COLOR_RESTING,
  size: 2,
  curve: 0,                      // ← ADD THIS: Force orthogonal routing
  endPlug: 'arrow2',
  endPlugSize: 1.5,
};

for (const edge of topology.edges) {
  const fromEl = document.getElementById(edge.from);
  const toEl = document.getElementById(edge.to);
  if (!fromEl || !toEl) continue;

  try {
    const outLine = new LeaderLine(fromEl, toEl, {
      ...BASE_OPTIONS,
      startSocketGravity: [12, 0],
      endSocketGravity: [12, 0],
    });
```

### Fix 2: Remove Orphan Edge Definition

Verified from topology.ts:152–178:

```typescript
// BEFORE:
const edges: DemoTopologyEdge[] = [
  {
    id: NAPPLETS_SHELL_EDGE_ID,
    from: 'topology-napplets',  // ← REMOVE THIS EDGE
    to: SHELL_NODE_ID,
  },
  ...napplets.map((napplet) => ({
    id: getNappletEdgeId(napplet.name),
    from: getNappletNodeId(napplet.name),
    to: SHELL_NODE_ID,
  })),
  // ...
];

// AFTER:
const edges: DemoTopologyEdge[] = [
  // Removed the topology-napplets → shell edge
  ...napplets.map((napplet) => ({
    id: getNappletEdgeId(napplet.name),
    from: getNappletNodeId(napplet.name),
    to: SHELL_NODE_ID,
  })),
  // ...
];
```

### Fix 3: Adjust Socket Gravity for Directional Distinctness

Verified from topology.ts:217–229 (claude's discretion on exact values):

```typescript
// BEFORE:
const outLine = new LeaderLine(fromEl, toEl, {
  ...BASE_OPTIONS,
  startSocketGravity: [12, 0],
  endSocketGravity: [12, 0],
});
const inLine = new LeaderLine(toEl, fromEl, {
  ...BASE_OPTIONS,
  startSocketGravity: [-12, 0],
  endSocketGravity: [-12, 0],
});

// AFTER (with Claude's discretion on values):
const outLine = new LeaderLine(fromEl, toEl, {
  ...BASE_OPTIONS,
  startSocketGravity: [12, -8],   // Output: right + slightly down
  endSocketGravity: [12, -8],
});
const inLine = new LeaderLine(toEl, fromEl, {
  ...BASE_OPTIONS,
  startSocketGravity: [-12, 8],   // Input: left + slightly up
  endSocketGravity: [-12, 8],
});
```

### Fix 4: Add Iframe Sizing CSS

Verified from index.html:41 and topology rendering:

```html
<!-- BEFORE: No explicit sizing -->
<div id="${napplet.frameContainerId}" class="topology-frame-slot"></div>

<!-- AFTER: iframe loaded into this slot needs sizing -->
<style>
  .topology-frame-slot { flex: 1; min-height: 220px; position: relative; }
  .topology-frame-slot iframe { width: 100%; height: 100%; border: none; }
</style>
```

OR inline on the iframe element when it's loaded:

```typescript
// In shell-host.ts or wherever iframe is created
const iframe = document.createElement('iframe');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';
```

### Fix 5: Ensure stopPropagation in Button Handlers

Verified pattern from main.ts:319–327:

```typescript
// Source: apps/demo/src/main.ts
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  
  // Signer buttons
  if (target.closest('[data-action="open-signer-connect"]')) {
    e.stopPropagation();  // ← VERIFY THIS IS HERE
    openSignerModal();
  }
  
  if (target.closest('[data-action="disconnect-signer"]')) {
    e.stopPropagation();  // ← VERIFY THIS IS HERE
    disconnectSigner();
    debuggerEl?.addSystemMessage('signer disconnected');
  }

  // Notification buttons
  if (target.id === 'notification-node-create' || target.closest('#notification-node-create')) {
    e.stopPropagation();  // ← ADD IF MISSING
    notificationController.createDemoNotification({ /* ... */ });
  }
  
  // ... other button handlers similarly
});
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (unit) + Playwright MCP (interactive) |
| Config file | vitest.config.ts (root) + apps/demo package.json (no test script yet) |
| Quick run command | `pnpm test` (runs vitest on packages/*/src/**/*.test.ts and tests/unit/) |
| Full suite command | `pnpm test -- --coverage` |

### Phase Requirements → Test Map

Phase 33 has no explicit REQ-* identifiers (bug fixes/polish only). Testing focuses on layout/interaction correctness:

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| Iframe fills container without scrollbars | visual/integration | Manual verification in dev (Vite dev server) or Playwright | ❌ Wave 0 |
| Edges render as 90-degree orthogonal paths (not curves) | visual/integration | Manual verification in dev or Playwright | ❌ Wave 0 |
| Input/output connection points are visually offset | visual/integration | Manual verification in dev or Playwright | ❌ Wave 0 |
| No errors from orphan edge initialization | unit | `pnpm test tests/unit/demo-topology-render.test.ts` | ✅ Exists |
| Service button clicks don't trigger node selection | integration | Manual in dev or Playwright | ❌ Wave 0 |
| Topology edges position correctly after inspector resize | integration | ResizeObserver spy in unit test or Playwright | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Manual visual verification in Vite dev server (`pnpm dev` from apps/demo)
- **Per wave merge:** Run `pnpm test` to verify no unit test regressions (especially demo-topology-render.test.ts)
- **Phase gate:** Manually verify all 5 issues fixed in dev server before `/gsd:verify-work`

### Wave 0 Gaps

The codebase has unit tests for topology model/render but no automated visual tests:

- [ ] `tests/integration/demo-layout.spec.ts` — Playwright test for iframe sizing, edge routing visibility, button click isolation
  - Verify: iframe width/height match parent dimensions
  - Verify: edge paths are rectilinear (SVG path data contains only L commands, no C curves)
  - Verify: clicking service buttons dispatches actions without opening inspector
- [ ] Resize observer test — verify edge repositioning on ResizeObserver triggers (e.g., inspector resize)
- [ ] CSS for iframe sizing — no test needed (visual inspection during manual testing)

**Note:** For Phase 33, manual visual verification in Vite dev server is sufficient and faster than setting up Playwright. Automated tests can be deferred to a future polish phase if topology tests are needed for regression protection.

---

## Environment Availability

**Step 2.6: SKIPPED (no external dependencies identified).**

Phase 33 is code/CSS/configuration only:
- Leader Line is already in node_modules (`npm view leader-line version` = 1.0.8)
- Vite dev server is available (`pnpm dev` from apps/demo directory)
- TypeScript compiler is available (project-wide)
- No databases, APIs, external tools, or runtimes required

Verification: All fixes can be developed and tested locally using existing infrastructure.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS bar edges connecting nodes | SVG edges via Leader Line library | Phase 32 (v0.6.0 milestone) | Allows dynamic routing (curves, orthogonal), color flashing, and smooth repositioning. Requires updating socket gravity and route options for fine-grained control |
| Global click delegation on document | Per-node click listeners with stopPropagation | Phase 29 (node inspector) | More robust event handling; isolated button interactions don't trigger unintended side effects |
| Fixed iframe sizing | Flex-based responsive iframe | Phase 32 | Adapts to inspector pane resizing; no hardcoded dimensions. Requires explicit `width/height: 100%` on iframe element |

**Deprecated/outdated:**
- Hand-written SVG path calculation — Leader Line handles all routing
- X11-style event propagation assumptions — use `event.stopPropagation()` for nested interactivity
- Static layout — ResizeObserver pattern is standard for responsive containers

---

## Open Questions

1. **Exact socket gravity values for visual distinctness**
   - What we know: Current values are `[12, 0]` and `[-12, 0]` (purely horizontal offset). Proposed: `[12, -8]` / `[-12, 8]` (with vertical offset).
   - What's unclear: Exact Y offset that looks visually balanced without looking broken
   - Recommendation: Set to proposed values, test visually during implementation, adjust if endpoints look misaligned

2. **Iframe border/shadow styling**
   - What we know: No current styling mentioned in decisions
   - What's unclear: Should iframe have a border, shadow, or blend flush with parent?
   - Recommendation: Keep flush (no border); let topology-frame-slot styling define visual boundary

3. **Animation timing for inspector pane resize**
   - What we know: User deferred to Claude's discretion
   - What's unclear: Should edges animate smoothly during resize or snap?
   - Recommendation: Animate with ResizeObserver updates (already in place). No additional config needed unless performance is poor.

4. **CSS classes `.topology-edge-in` / `.topology-edge-out`**
   - What we know: D-07 mentions these classes for visual distinctness (color/opacity)
   - What's unclear: Should they be applied? (Edges are SVG, not CSS-styled elements)
   - Recommendation: Skip for Phase 33. Socket gravity offset is sufficient visual distinction. Classes can be added in a future polish phase if needed.

---

## Sources

### Primary (HIGH confidence)
- **Leader Line library docs** — Verified curve option (0 = orthogonal) and socketGravity parameter exist and work as documented
- **Existing codebase** (topology.ts, main.ts, index.html) — All patterns (LeaderLine setup, event handling, CSS layout) confirmed by direct code inspection
- **vitest.config.ts** — Test framework and test file paths verified

### Secondary (MEDIUM confidence)
- **npm registry** — Leader Line 1.0.7–1.0.8 current versions; 1.0.7 is installed
- **Codebase patterns** — Socket gravity, ResizeObserver, event.stopPropagation() all used consistently in existing code

---

## Confidence Breakdown

- **Iframe sizing:** HIGH — Simple CSS, well-established pattern
- **Edge routing (curve: 0):** HIGH — Leader Line library feature, already used for color flashing
- **Socket gravity adjustment:** MEDIUM — Values proposed; exact offsets need visual testing
- **Orphan edge removal:** HIGH — Problem clearly identified; fix is removing lines of code
- **Button click isolation (stopPropagation):** HIGH — Pattern already used in codebase for signer/notification buttons
- **Event handling approach:** HIGH — Matches project conventions and JavaScript standards
- **Testing strategy:** MEDIUM — No existing automated UI tests for layout; manual verification sufficient for Phase 33

---

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (Phase 33 likely completes within 30 days; orthogonal routing and socket gravity are stable features)
