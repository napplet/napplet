# Phase 53: Per-Message Trace Mode - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a per-message trace animation mode to the topology view. When active, individual protocol messages animate hop-by-hop through the graph as edge color sweeps, showing the routing path and pass/fail state at each hop. This is the 4th option in Phase 51's color mode toggle (alongside rolling window, decay, and last-message-wins).

</domain>

<decisions>
## Implementation Decisions

### Animation Mechanics
- **D-01:** Animation style is edge color sweep — each edge segment in the path lights up sequentially (source half first, then target half), with color reflecting pass/fail at that point.
- **D-02:** Edges only — nodes do NOT flash/highlight during trace animation. Nodes stay in their persistent composite state.
- **D-03:** Color at each hop follows the directional logic from Phase 51: green before the failure point, red/amber at and after the failure point.

### Toggle Interaction
- **D-04:** Trace mode is the 4th option in Phase 51's color mode toggle (rolling window / decay / last-message-wins / trace). When trace is active, the other persistence modes are not applied — edge colors are driven entirely by per-message animations.
- **D-05:** Edges revert to resting color after the sweep animation completes (no persistent state in trace mode).

### Message Queue Behavior
- **D-06:** Multiple animations overlap gracefully — new sweep animations start immediately even if previous ones are still in progress. Multiple messages can be mid-animation simultaneously.
- **D-07:** No queuing, no dropping — each message gets its own independent animation lifecycle.

### Claude's Discretion
- Sweep animation duration (per hop) and easing
- How overlapping animations visually blend on the same edge (latest color wins, additive, etc.)
- Edge revert timing after sweep completes
- Whether the trace mode toggle label says "Trace" or "Per-message" or something else

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 51 Infrastructure (prerequisite)
- `.planning/phases/51-accurate-color-routing/51-CONTEXT.md` — Directional edge logic, persistence modes, split-border nodes, color state module
- `apps/demo/src/color-state.ts` (Phase 51 output) — Color state module with persistence modes, edge state tracking
- `apps/demo/src/flow-animator.ts` — Message tap callback, highlight path building, failure classification
- `apps/demo/src/topology.ts` — EdgeFlasher, `-out`/`-in` LeaderLine instances, color constants

### Topology and Edges
- `apps/demo/src/topology.ts:229-245` — Separate `-out` and `-in` LeaderLine instances per edge (sweep targets)
- `apps/demo/src/topology.ts:258-271` — Current flash() method (to be extended for sequential sweep)
- `apps/demo/src/flow-animator.ts:84-127` — `buildHighlightPath()` returns ordered nodes/edges for the message path

### Phase 49 Constants
- `.planning/phases/49-constants-panel/49-CONTEXT.md` — Configurable constants via demo config (sweep duration could be added here)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 51's color state module — already tracks per-edge directional state, 3-way persistence toggle. Trace mode adds a 4th option.
- `buildHighlightPath()` — Returns ordered list of nodes and edges for each message. Provides the sequence for the sweep animation.
- `-out`/`-in` LeaderLine instances — Already separate per edge. Sweep animates them independently in sequence.
- Phase 51's failure point identification — Determines where the color changes from green to red/amber along the path.

### Established Patterns
- `setTimeout` cascades for sequential timing (used in flash-and-revert)
- LeaderLine `setOptions({ color, size })` for color changes
- Color constants: `COLOR_ACTIVE`, `COLOR_AMBER`, `COLOR_BLOCKED`, `COLOR_RESTING`

### Integration Points
- Phase 51's color mode toggle — Add "Trace" as 4th option
- `flow-animator.ts` `onMessage` callback — When trace mode is active, trigger sweep instead of persistent state update
- Phase 49's demo config — Sweep duration as a configurable constant

</code_context>

<specifics>
## Specific Ideas

- Edge color sweep feels like watching a packet trace — green lights up sequentially along the path, turns red/amber at the failure point
- Overlapping animations give a realistic sense of protocol traffic volume
- No node highlights during trace keeps the animation focused on the edges (the routing paths)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 53-per-message-trace-mode*
*Context gathered: 2026-04-03*
