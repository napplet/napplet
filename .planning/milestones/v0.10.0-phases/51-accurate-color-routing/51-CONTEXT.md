# Phase 51: Accurate Color Routing - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix topology edge and node coloring to reflect actual directional pass/fail/warn state. Replace uniform flash-all-same-color with directional awareness: outbound leg before failure point is green, return leg after failure is red/amber. Persistent state replaces flash-and-revert.

</domain>

<decisions>
## Implementation Decisions

### Directional Logic
- **D-01:** Any node in the path can be the failure point — ACL is the primary one (denial), but services can also fail (no signer, timeout, not wired). The failure point is determined by where the error actually occurs.
- **D-02:** Path is split into "before failure" and "after failure" legs. Before = outbound color (green), the failure node = failure color (red/amber), after = failure color propagating back.
- **D-03:** The existing color classification in `flow-animator.ts` (denial = red/blocked, infrastructure = amber, success = green/active) is used to identify the failure type and which node caused it.
- **D-04:** `-out` and `-in` LeaderLine instances per edge are already separate — flash them independently based on direction and failure point position.

### Persistent State Model
- **D-05:** Three persistence modes available via a 3-way toggle in the demo UI:
  - **Rolling window** (default): Track last N messages per edge direction. Color = majority of recent results. N configurable via constants panel.
  - **Decay over time**: Each message sets color, gradually fades toward neutral over X seconds of inactivity.
  - **Last-message wins**: Edge holds color of most recent message. Simplest mental model.
- **D-06:** Default mode is rolling window. Toggle accessible from the demo UI (exact placement is Claude's discretion).
- **D-07:** Window size (N) and decay duration (X seconds) are exposed as configurable constants in Phase 49's constants panel.

### Node Color Derivation
- **D-08:** Split-border approach: each node visually shows inbound and outbound state as separate halves of its border/background.
- **D-09:** For horizontal edge connections (current topology): left half = inbound state, right half = outbound state.
- **D-10:** For vertical edge connections (future-proofing): top half = inbound, bottom half = outbound.
- **D-11:** Implementation approach: two inner containers (50% width or height depending on edge orientation) with background-color simulating half-borders. The node looks unified but carries directional information.
- **D-12:** Half-border colors follow the same green/red/amber scheme derived from the persistence mode's accumulated state for that direction.

### Claude's Discretion
- Exact implementation of split-border CSS (container structure, padding, background approach)
- Persistence mode toggle placement and styling
- Transition/animation when colors change in persistent mode
- How to handle nodes with edges in multiple directions (e.g. runtime has edges to ACL, services, and shell)
- Rolling window size default value and decay duration default value

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Color System
- `apps/demo/src/flow-animator.ts` — Full file: message classification (line 150-170), highlight path building (line 84-127), flash dispatch (line 172-179). This is the primary file to modify.
- `apps/demo/src/topology.ts:184-273` — `initTopologyEdges()`: separate `-out`/`-in` LeaderLine creation (line 229-245), `flash()` method (line 258-271), color constants (line 185-188)
- `apps/demo/src/topology.ts:26-37` — `flashClass()` and `flashNode()` helpers that add/remove CSS classes with setTimeout

### Topology Structure
- `apps/demo/src/topology.ts` — Full topology model: `DemoTopology`, `DemoTopologyNode`, edge definitions, port positions
- `apps/demo/src/main.ts` — Where topology is initialized and flow animator is wired

### ACL Classification
- `packages/runtime/src/enforce.ts:200-202` — `formatDenialReason()` produces the `'denied: ...'` prefix that flow-animator checks

### Phase 49 Context (constants panel)
- `.planning/phases/49-constants-panel/49-CONTEXT.md` — Runtime config object for configurable values (window size, decay duration)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `-out` and `-in` LeaderLine instances already exist per edge (topology.ts:229-245). They just need to be flashed independently.
- Color constants already defined: `COLOR_ACTIVE`, `COLOR_AMBER`, `COLOR_BLOCKED`, `COLOR_RESTING`.
- `buildHighlightPath()` already knows the full path through the topology. Needs extension to identify the failure point position.
- `flashClass()` adds/removes CSS classes with setTimeout — can be adapted for persistent state.

### Established Patterns
- Inline styles for dynamic UI (UnoCSS can't detect dynamic classes)
- `ResizeObserver` on topology root for responsive line repositioning
- Message tap callback pattern: `tap.onMessage((msg) => { ... })`

### Integration Points
- `flow-animator.ts:initFlowAnimator()` — Main entry point, receives topology + edgeFlasher
- `topology.ts:EdgeFlasher` — Interface needs directional flash support (currently `flash(edgeId, cls)` flashes both lines)
- `topology.ts:initTopologyEdges()` — Returns EdgeFlasher, may need to return richer interface for directional control
- Phase 49's runtime config — window size and decay duration as configurable constants

</code_context>

<specifics>
## Specific Ideas

- Split-border on nodes: two inner containers with background-color simulating half-borders. User specifically described this approach — left half = inbound, right half = outbound for horizontal edges.
- 3-way toggle for persistence mode — rolling window (default), decay, last-message-wins. User wants this configurable, not a single baked-in behavior.
- Future-proof for vertical edges (top/bottom halves) even though current topology is horizontal-only.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 51-accurate-color-routing*
*Context gathered: 2026-04-03*
