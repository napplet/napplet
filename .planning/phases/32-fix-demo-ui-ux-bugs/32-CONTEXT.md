# Phase 32: Fix demo UI/UX bugs - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Three targeted demo-layer fixes identified by systematic debugging (`.planning/debug/demo-v060-correctness-issues.md`):
1. ACL indicator signal quality — distinguish infrastructure failures from ACL denials
2. Topology edge routing — replace CSS-bar edges with real dynamic connections using Leader Line
3. Stale CLAUDE.md documentation — update NappKeypair description

All three issues are in `apps/demo/` only. Core packages (`@napplet/runtime`, `@napplet/shell`, `@napplet/acl`) are correct.

</domain>

<decisions>
## Implementation Decisions

### ACL Indicator Signal Quality

- **D-01:** The demo must show the real failure state — "no signer configured" is a valid production scenario, not noise to suppress or mock away. Users should see it happen.
- **D-02:** Three visual states for nodes and edges:
  - **Green** = protocol success (OK:true, EOSE, expected flow)
  - **Amber/orange** = infrastructure gap (no signer configured, mock relay no-op, relay timeout, service not wired)
  - **Red** = ACL explicitly denied (CLOSED:denied, OK:false from enforce gate)
- **D-03:** Classification logic lives in `flow-animator.ts`. Amber covers: error strings containing "no signer", "relay", "timeout", "not wired", mock no-op responses. Red is reserved for explicit ACL deny strings ("denied:", "blocked:").
- **D-04:** If package-level deficiencies are found (e.g., no structured error codes to distinguish deny vs infrastructure failure), track them as separate issues — do NOT fix them in Phase 32. Phase 32 fixes only the demo layer.

### Edge Routing — Leader Line

- **D-05:** Replace CSS-bar edges with **Leader Line** library. Add as a runtime dependency in `apps/demo/package.json`.
- **D-06:** Edges update dynamically: use `ResizeObserver` on the topology container and `MutationObserver` for DOM changes (inspector open/close, new napplets added). Edges reposition automatically on any layout change.
- **D-07:** Edges participate in the green/amber/red flash animation alongside nodes. When a message travels a path, the relevant edge flashes the same color as the source/target node. Leader Line color + dash animation is the mechanism.
- **D-08:** Edge IDs are assigned from the topology data model's existing `from`/`to` node IDs so `flow-animator.ts` can reference them by ID for animation — same pattern as nodes.

### Edge Directionality

- **D-09:** Two separate Leader Line instances per relationship — one `A→B` (outbound), one `B→A` (inbound). Each has its own arrowhead at the destination end. Lines run parallel, slightly offset, so inbound and outbound can animate independently.
- **D-10:** Resting state: dim/muted color (dark gray, low opacity), arrowhead always visible. Activity flashes bright green/amber/red over the dim base, then fades back to resting. Topology remains legible at all times.

### Documentation Fix

- **D-11:** Update `CLAUDE.md` line ~235: change "Stored in sessionStorage" for NappKeypair to "Ephemeral in-memory keypair per page load (no persistence)". The code was correctly refactored; only the doc is stale.

### Claude's Discretion
- Exact amber color value and flash duration (consistent with existing green/red timing)
- Leader Line anchor point positions on each node (top/bottom center vs side midpoints)
- Exact offset distance between the two parallel directional lines
- Whether to use Leader Line's built-in `dash` animation or CSS class toggling for the flash

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Debug Investigation (Primary Source)
- `.planning/debug/demo-v060-correctness-issues.md` — Full root cause analysis for all three issues. Contains exact file locations, line numbers, and evidence. MANDATORY reading before planning.

### Demo Source Files (All Three Issues)
- `apps/demo/src/flow-animator.ts` — Current green/red animation logic. ACL signal fix goes here.
- `apps/demo/src/topology.ts` — Current CSS-bar edge rendering. Edge routing replacement goes here.
- `apps/demo/src/shell-host.ts` — Mock hooks. Context for why signer is null by default.
- `apps/demo/index.html` — Topology container and CSS. Edge overlay container may need adding.
- `apps/demo/package.json` — Add Leader Line as runtime dep here.

### Prior Phase Context
- `.planning/phases/27-demo-audit-correctness/27-CONTEXT.md` — D-06: path-specific denial reporting; the amber state is the natural extension of this decision.
- `.planning/phases/28-architecture-topology-view/28-CONTEXT.md` — D-05/D-06: ACL as checkpoint semantics; D-07/D-08: services hang off runtime. Edge routing must respect this topology model.

### ACL and Protocol
- `packages/runtime/src/enforce.ts` — ACL deny message format. Understand what strings come back for "denied" vs other failures.
- `packages/services/src/signer-service.ts` — Line 101-104: exact error string "no signer configured". This is the amber trigger.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `flow-animator.ts` `flashNode(id, cls)` / `flashEdge(id, cls)` — extend, don't replace; add amber class alongside existing active/blocked
- `topology.ts` `buildDemoTopology()` — edges array with `from`/`to` IDs is correct and complete; only rendering changes

### Established Patterns
- Node flash: CSS class toggled for 500ms, then removed — amber should follow same timing
- Edge IDs: currently `edge-${from}-${to}` format in `renderNodeEdge()` — Leader Line instances keyed by same IDs

### Integration Points
- Leader Line instances need to be stored in a Map keyed by edge ID so `flow-animator` can look them up by the same ID it uses for nodes
- ResizeObserver attaches to `#topology-container` (or equivalent root element)

</code_context>

<specifics>
## Specific Ideas

- The user was clear: demo must show real production failures, not mock them away. "No signer configured" is a scenario users will encounter in the wild.
- Leader Line was the user's preferred approach — explicitly chosen over hand-rolled SVG and heavier libraries.
- The two-line-per-relationship design (separate inbound/outbound lines) allows independent animation of each direction — this is important for showing ACL behavior on a specific flow direction.

</specifics>
