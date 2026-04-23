# Phase 29: Node Detail & Drill-Down - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Add node-specific status surfaces and a right-side drill-down inspector so users can inspect the demo architecture without losing the bottom debugger. This phase is about information density and inspection behavior on top of the topology from Phase 28, not about adding new services or changing the protocol model.

</domain>

<decisions>
## Implementation Decisions

### Collapsed Node Content
- **D-01:** Each node should show a compact summary directly in the topology view, not just a minimal dot/status and not a dense mini-dashboard.
- **D-02:** The compact summary should prioritize role-relevant information so users can skim the architecture without opening the drill-down panel for every node.

### Drill-Down Interaction Model
- **D-03:** The drill-down experience should be a single-focus inspector panel on the right side.
- **D-04:** The UI should not support pinning or comparing multiple nodes in this phase.

### Drill-Down Coverage
- **D-05:** Every node that exists in the demo should support drill-down in this phase, not just a hand-picked subset.
- **D-06:** The drill-down system should work consistently across napplets, shell, ACL, runtime, and currently wired services even if the exact data shown differs by node type.

### Detail Granularity
- **D-07:** The drill-down panel should show both current state and recent activity/history for the selected node.
- **D-08:** Recent activity should help users understand how a node has behaved recently, not just what its snapshot looks like at this instant.

### Layout / Interaction Constraints
- **D-09:** The inspector lives on the right side and must preserve access to the bottom debugger.
- **D-10:** Background blur or similar focus treatment is acceptable, but the debugger remains visible and usable.

### the agent's Discretion
- Exact compact-summary fields for each node type
- Exact panel transitions, blur treatment, and open/close affordances
- How much recent history to retain per node and how it should be presented

</decisions>

<specifics>
## Specific Ideas

- Nodes should feel informative at a glance without collapsing back into unreadable architecture clutter.
- The drill-down panel should act like an inspector, not like a second workspace or comparison tool.
- The panel should make it easier to understand live behavior of a node over time, especially when protocol activity is moving quickly in the debugger below.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope
- `.planning/ROADMAP.md` — Phase 29 goal and its relationship to Phases 28, 30, and 31
- `.planning/REQUIREMENTS.md` — `NODE-01` and `NODE-02`
- `.planning/PROJECT.md` — Milestone-level expectation that node drill-down should expand from the right without covering the bottom debugger

### Prior Phase Context
- `.planning/phases/28-architecture-topology-view/28-CONTEXT.md` — Topology structure that this inspector layer sits on top of
- `.planning/phases/27-demo-audit-correctness/27-CONTEXT.md` — Correctness and observability requirements that node details should reinforce
- `.planning/phases/05-demo-playground/05-CONTEXT.md` — Original debugger and demo-display intent being evolved here
- `.planning/phases/09-acl-enforcement-gate/09-CONTEXT.md` — ACL semantics that node summaries and drill-downs should present accurately

### Current Demo UI
- `apps/demo/index.html` — Current flow-area layout and debugger positioning constraints
- `apps/demo/src/main.ts` — Existing UI bootstrap and state hookup points
- `apps/demo/src/flow-animator.ts` — Existing node activity signals that can feed recent-activity presentation
- `apps/demo/src/debugger.ts` — Bottom debugger that must remain available during drill-down use
- `apps/demo/src/acl-panel.ts` — Existing per-napplet controls that may influence what compact node summaries should expose

### Runtime and Service Context
- `apps/demo/src/shell-host.ts` — Current host/runtime/ACL state wiring for node summaries
- `packages/runtime/src/runtime.ts` — Runtime role and current state sources relevant to runtime drill-down
- `packages/runtime/src/enforce.ts` — ACL checkpoint model that should inform ACL node details
- `packages/services/src/notification-service.ts` — Example service state/activity model for future service-node inspection
- `packages/services/src/signer-service.ts` — Signer-service activity model relevant to later signer node inspection

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/demo/src/main.ts` already centralizes shell boot, napplet load, and debugger hookup, making it a practical place to coordinate selected-node state.
- `apps/demo/src/flow-animator.ts` already tracks node and message activity, which can seed compact status surfaces and recent-history views.
- `apps/demo/src/debugger.ts` provides a bottom activity surface that the inspector should complement rather than replace.

### Established Patterns
- The current demo nodes are visually simple boxes with minimal status text and no inspector model.
- The existing layout already reserves a bottom debugger section, so the drill-down interaction must avoid taking over the full screen.
- Node types have different kinds of data, so consistency should come from inspector structure rather than identical fields everywhere.

### Integration Points
- The phase will likely center on `apps/demo/index.html`, `apps/demo/src/main.ts`, and new or extended UI modules that manage selected-node state and inspector rendering.
- The node-activity plumbing from `flow-animator.ts` and protocol state from `shell-host.ts` are likely sources for recent-history and summary data.
- The topology work from Phase 28 should provide the visual nodes that this phase makes inspectable.

</code_context>

<deferred>
## Deferred Ideas

- Multi-node comparison or pinning is explicitly deferred.
- New services and signer-specific UX enhancements belong to Phases 30 and 31.
- Custom napplet loading remains outside the current milestone scope even though the inspector should scale to additional nodes later.

</deferred>

---

*Phase: 29-node-detail-drill-down*
*Context gathered: 2026-04-01*
