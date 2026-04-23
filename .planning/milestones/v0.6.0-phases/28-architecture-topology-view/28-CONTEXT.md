# Phase 28: Architecture Topology View - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebuild the demo's main topology so the visual structure matches the real host architecture at a glance. This phase is about the layout and architectural relationships between napplets, shell, ACL, runtime, and currently wired services. It does not yet add the richer node drill-down behavior reserved for the next phase.

</domain>

<decisions>
## Implementation Decisions

### Overall Topology Shape
- **D-01:** The main architecture view should use a layered stack arranged top-to-bottom, not a left-to-right pipeline and not the previously suggested hybrid edge layout.
- **D-02:** The topology must leave room for a variable number of napplets in future. The view should not assume the demo will always have exactly two napplets.

### Service Visibility
- **D-03:** Show only services that are actually wired into the demo at the time, not placeholders for planned services that are not yet present.
- **D-04:** The layout should still be extensible so additional services can slot into the topology cleanly in later phases without changing the overall architecture model.

### ACL Placement Semantics
- **D-05:** ACL should be shown as a distinct checkpoint/layer on the relevant paths, not merely as one undifferentiated global box.
- **D-06:** The architecture should communicate that ACL enforcement affects specific message paths between napplets, runtime, and service access, rather than implying that ACL is a generic decorative label.

### Runtime-to-Service Structure
- **D-07:** Services should hang directly off runtime rather than being grouped under an extra container abstraction.
- **D-08:** Direct runtime-to-service relationships should remain visually readable even as the number of services grows.

### the agent's Discretion
- Exact visual composition of the top-to-bottom stack
- Whether the napplet region is rendered as repeated peers, a scrollable band, or another scalable pattern
- How path lines/arrows are drawn so the ACL checkpoint semantics remain clear without overcomplicating the scene

</decisions>

<specifics>
## Specific Ideas

- The future ability to load custom napplets is not part of this phase, but the topology should already make sense when the demo eventually has more than two napplets.
- This phase should correct the current misleading flattening of `shell / acl` into a single center node.
- Showing only real services is preferred over speculative placeholders; accuracy matters more than completeness theater.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope
- `.planning/ROADMAP.md` — Phase 28 goal, dependency on Phase 27, and downstream relationship to node drill-down work in Phase 29
- `.planning/REQUIREMENTS.md` — `ARCH-01` and `ARCH-02`
- `.planning/PROJECT.md` — Milestone-wide architecture visualization goals for the demo

### Prior Phase Context
- `.planning/phases/27-demo-audit-correctness/27-CONTEXT.md` — Correctness and observability decisions the new topology must respect
- `.planning/phases/05-demo-playground/05-CONTEXT.md` — Original demo layout assumptions that are now being replaced
- `.planning/phases/09-acl-enforcement-gate/09-CONTEXT.md` — ACL semantics and why path-specific checkpoints matter
- `.planning/phases/20-concrete-services/20-CONTEXT.md` — Notification/audio service model for how services should appear in the architecture
- `.planning/phases/22.1-core-infrastructure-services/22.1-CONTEXT.md` — Runtime-to-service relationship and signer-as-service direction

### Current Demo UI and Wiring
- `apps/demo/index.html` — Current flow layout and flattened `shell / acl` center box
- `apps/demo/src/main.ts` — Demo bootstrap and current flow wiring
- `apps/demo/src/flow-animator.ts` — Current message-flow visualization assumptions
- `apps/demo/src/shell-host.ts` — Current host wiring and runtime/ACL touch points
- `apps/demo/src/acl-panel.ts` — Current ACL control presentation

### Runtime and Services
- `packages/runtime/src/runtime.ts` — Runtime dispatch role in the real architecture
- `packages/runtime/src/enforce.ts` — ACL checkpoint semantics that the visual model should reflect
- `packages/services/src/notification-service.ts` — Example of a concrete service hanging off runtime
- `packages/services/src/signer-service.ts` — Signer service direction relevant to later topology growth

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/demo/index.html` already contains the main flow-area shell that can be restructured into a layered architecture view.
- `apps/demo/src/flow-animator.ts` already animates nodes and arrows, so the new topology can reuse the existing message-activity mechanism instead of starting from scratch.
- `apps/demo/src/main.ts` centralizes shell boot, napplet load, debugger hookup, and status updates, making it the natural integration point for topology-aware UI state.

### Established Patterns
- The current demo visually assumes a fixed three-column structure: chat -> shell/acl -> bot. That assumption must be removed.
- The runtime and service model in the packages is more layered than the current demo presentation.
- ACL semantics are path-specific in runtime logic and should be shown that way in the topology rather than flattened into a single undifferentiated center label.

### Integration Points
- The topology rework will primarily touch `apps/demo/index.html`, `apps/demo/src/main.ts`, and `apps/demo/src/flow-animator.ts`.
- The current `shell-box` concept in `apps/demo/index.html` will likely split into multiple architecture nodes that correspond more closely to runtime and ACL responsibilities.
- Service nodes should attach directly to the runtime area, while the napplet area should be able to expand beyond the current chat/bot pair.

</code_context>

<deferred>
## Deferred Ideas

- Rich node detail surfaces and right-side drill-down interactions belong to Phase 29.
- Loading custom napplets remains a later capability even though this phase should keep space for more than two napplets in the future.

</deferred>

---

*Phase: 28-architecture-topology-view*
*Context gathered: 2026-04-01*
