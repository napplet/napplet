# Phase 29: Node Detail & Drill-Down - Research

**Researched:** 2026-04-01
**Phase:** 29-node-detail-drill-down
**Requirements:** NODE-01, NODE-02

## Technical Approach

### Current State: The Demo Has Path-Aware Data, But Not a Node-Inspection Model

Phase 27 left the demo with useful protocol metadata:

- `apps/demo/src/shell-host.ts` exports authenticated napplet state, audited protocol paths, and access to runtime-backed ACL state.
- `apps/demo/src/debugger.ts` can classify tapped traffic into concrete path families such as `relay-publish`, `state-read`, and `signer-request`.
- `apps/demo/src/flow-animator.ts` already consumes the live tap and keeps a lightweight flow counter surface.

What is still missing is a node-centric view of that data. The current demo logic is organized around messages and a small number of hard-coded DOM boxes, not around a reusable "node detail" model that can answer:

- what role a node plays
- what current state belongs to that node
- what summary fields should appear when collapsed
- what recent activity belongs to that node
- what richer sections should appear in an inspector

Phase 29 should therefore introduce a dedicated detail model instead of pushing more ad hoc strings directly into `main.ts`.

### Phase 28 Is the Structural Prerequisite; Phase 29 Should Layer On Top of It

Phase 28 plans already define the intended topology shape:

- explicit shell, ACL, runtime, napplet, and service node ids
- a topology model in `apps/demo/src/topology.ts`
- topology-aware rendering and animation

That means Phase 29 should assume node ids and roles come from the topology layer rather than re-deriving UI structure from DOM placement. The safest approach is:

1. treat topology as the source of node identity and hierarchy
2. build a node-detail adapter that enriches each topology node with live summary fields and recent activity
3. render both collapsed node summaries and the right-side inspector from the same detail object

This keeps Phase 29 additive. It should not redefine node identity or hierarchy that Phase 28 is responsible for.

### Compact Node Surfaces Need Role-Specific Summaries, Not Mini Dashboards

The phase context is explicit that collapsed nodes should be informative but not dense. The right split is:

- **collapsed node summary:** 2-4 high-value facts plus a status chip or activity indicator
- **inspector panel:** richer sections with identity, capabilities/state, recent history, and role-specific details

Likely compact-summary examples by role:

- **napplet:** auth status, short pubkey, granted capability count, last path/activity
- **shell:** host pubkey, loaded napplet count, current relay URI, message totals
- **ACL:** capability gate summary, blocked napplets count, last denial path/reason
- **runtime:** registered service count, authenticated napplet count, last routed path
- **service:** service name/version or mode, last handled action, service-specific health/activity summary

This satisfies NODE-01 without collapsing into unreadable cards.

### Recent Activity Should Reuse the Existing Message Tap, With Node-Specific Projection

The most reliable source for recent behavior remains the tapped protocol traffic and host/runtime state already present in the demo. Rather than inventing separate logging channels, Phase 29 should project that existing data into per-node activity streams.

Recommended model:

- keep the debugger as the full-fidelity event surface
- derive a bounded recent-activity ring per node from the same tap/messages
- normalize entries into short human-readable records such as path, direction, success/blocked, and timestamp

This keeps the inspector complementary to the debugger:

- debugger = global protocol ledger
- inspector = filtered, node-local interpretation of recent activity

That distinction is important for NODE-02 because the right panel must preserve the debugger instead of replacing it.

### The Right-Side Inspector Should Be a Peer Pane in the Main Workspace, Not an Overlay Over the Debugger

The project and phase context both require that the right-side drill-down preserve the bottom debugger. The correct layout implication is:

- the top workspace becomes a two-pane region: topology/content on the left, inspector on the right
- the bottom debugger remains in its existing resizable band
- opening the inspector changes only the upper workspace width allocation, not the debugger height or visibility

An overlay that covers the debugger would violate the milestone goal even if visually attractive. A slide-in panel anchored within the top workspace is the right interaction model.

### Selection State Should Be Global to the Demo UI, But Inspector Rendering Should Stay Modular

`apps/demo/src/main.ts` is already the place where shell boot, debugger wiring, ACL panel rendering, and animator setup converge. It is the practical owner for selected-node state.

However, the actual inspector rendering logic should not live entirely in `main.ts`. A better split is:

- `main.ts`: selected node id, subscriptions, orchestration
- new detail/inspector module(s): build detail objects, render summary sections, manage inspector DOM updates

That will matter immediately in later phases when notification and signer nodes gain richer controls and state.

### Recommended Artifact Split

The phase is best planned in three waves:

1. **Node detail model and compact summary surfaces**
   - create a topology-to-detail adapter
   - expose role-specific live summary fields on every node
   - add model-oriented regression coverage

2. **Right-side inspector layout and selection UX**
   - add selected-node state and a right-side inspector pane
   - keep the bottom debugger visible and usable
   - ensure every node can open drill-down consistently

3. **Recent activity/history and inspector hardening**
   - feed recent activity into each node and inspector
   - add render/e2e regression coverage for inspector behavior
   - lock NODE-01 and NODE-02 with focused tests

## Validation Architecture

### Dimension 1: Functional Correctness
- Every rendered node exposes role-relevant live summary information.
- Every supported node can open the inspector.
- The inspector shows both current state and recent activity/history for the selected node.

### Dimension 2: Integration
- Node identity comes from the Phase 28 topology model, not duplicate UI-only ids.
- Summary fields and inspector sections reuse host/runtime/debugger truth sources already present in the demo.
- The debugger remains the global source of protocol detail while the inspector stays node-local.

### Dimension 3: Edge Cases
- Nodes with sparse state still render a coherent summary and inspector.
- Service nodes work even when only signer is currently registered.
- Rapid message bursts do not cause the inspector to lose recent-history coherence.

### Dimension 4: Performance
- Collapsed node summaries should update from bounded state, not force full rerenders of the whole scene.
- Recent history should use a fixed-size buffer per node.
- Opening and closing the inspector should not reinitialize the debugger or napplet iframes.

### Dimension 5: Regression
- Add a model test for detail-field generation and node support coverage.
- Add a render test for inspector layout and collapsed summaries.
- Add an interaction or e2e test that proves the right panel opens while the debugger stays available.

### Dimension 6: Security
- Summaries must reflect actual ACL/runtime state and not imply capabilities that are not granted.
- Inspector actions in this phase should remain informational; richer mutating controls belong to later phases unless already present elsewhere.

### Dimension 7: Developer Experience
- Future phases can add service-specific sections by extending the node-detail adapter rather than branching `main.ts` repeatedly.
- Tests should fail if new node types appear without summary/detail coverage.

### Dimension 8: Observability
- Users can inspect a node locally without losing the bottom debugger's global event stream.
- Recent activity in the inspector should make path-specific behavior legible without duplicating the full debugger log.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Detail rendering gets hard-coded per current chat/bot layout instead of per topology node | Medium | High | Drive detail generation from topology node roles and stable ids |
| Inspector panel becomes a visual overlay that obscures the debugger | Medium | High | Constrain layout changes to the top workspace only and test debugger visibility explicitly |
| Recent activity duplicates the debugger and drifts out of sync | Medium | Medium | Derive inspector history from the same tapped-message source with bounded per-node projection |
| Scope drifts into notification or signer-specific UX flows from later phases | Medium | Medium | Keep this phase informational and structural; richer service controls remain for Phases 30-31 |

## Build Order

1. **Wave 1:** Create a node-detail model and compact summary surfaces for all topology nodes
2. **Wave 2:** Add selected-node state and a right-side inspector that preserves the debugger
3. **Wave 3:** Feed recent activity into summaries/inspector and lock behavior with targeted tests

## RESEARCH COMPLETE

---

*Research: 2026-04-01*
*Phase: 29-node-detail-drill-down*
