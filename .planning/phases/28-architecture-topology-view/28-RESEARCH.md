# Phase 28: Architecture Topology View - Research

**Researched:** 2026-04-01
**Phase:** 28-architecture-topology-view
**Requirements:** ARCH-01, ARCH-02

## Technical Approach

### Current State: The Main Demo View Still Encodes a Three-Box Mental Model

The current flow area in `apps/demo/index.html` is still hard-coded as:

- `chat-box`
- one center `shell-box`
- `bot-box`

with fixed SVG arrow columns between them. That structure directly teaches the wrong architecture because:

- shell and ACL are merged into one node
- runtime is not shown at all
- services are not represented as first-class runtime children
- the layout assumes exactly two napplets instead of a scalable napplet layer

`apps/demo/src/flow-animator.ts` reinforces the same model by only flashing `{name}-box` and `shell-box`. The animator therefore cannot express path checkpoints like napplet -> ACL -> runtime -> service, because the DOM and logic only know about napplet <-> shell traffic.

### The Host Model Needed for This Phase Already Exists in Code

The demo host now exposes architecture clues that the UI is not using yet:

- `apps/demo/src/shell-host.ts` exports `DEMO_PROTOCOL_PATHS` with explicit entries for `auth`, `relay-publish`, `relay-subscribe`, `inter-pane-send`, `inter-pane-receive`, `state-read`, `state-write`, `signer-request`, and `signer-response`
- the demo already wires a signer service via `createSignerService(...)`
- `packages/runtime/src/runtime.ts` maintains a service registry and routes service messages from runtime rather than from a flattened shell box

This means Phase 28 should not invent a topology from scratch. The best path is to build a UI-facing topology model from the real host/runtime data that already exists, then render the main flow from that model.

### ACL Must Be Rendered as a Path Checkpoint, Not a Container

`packages/runtime/src/enforce.ts` and the earlier ACL planning docs both treat ACL as a gate on specific message paths, not as a peer service and not as a decorative label. The architecture view should therefore:

- render ACL as its own checkpoint/layer between napplets and runtime-facing operations
- avoid suggesting that ACL "contains" shell or runtime
- preserve the idea that runtime still fans out to services after ACL checks pass

The simplest accurate teaching model is a vertical stack:

1. napplet band
2. shell adapter node
3. ACL checkpoint node
4. runtime node
5. service branch attached directly beneath or beside runtime

That matches the phase context decisions more closely than either the current three-column pipeline or a service-container abstraction.

### Runtime-to-Service Relationships Should Be Data-Driven

The phase context explicitly says services should hang directly off runtime and only real services should be shown. The demo code already gives a viable source of truth:

- static services from `hooks.services`
- dynamic services registered on the runtime

Even if Phase 28 chooses a light abstraction in demo code rather than exposing the full runtime registry directly, the UI should be driven by a topology model that can enumerate real service nodes such as `signer` today and `notifications` later without rewriting the layout again.

### The Flow Animator Should Shift from Box IDs to Topology Node IDs

The current animator has fixed assumptions:

- node ids are `chat-box`, `bot-box`, `shell-box`
- arrow ids are `line-chat-out`, `line-chat-in`, `line-bot-in`, `line-bot-out`

That is too brittle for an architecture-faithful hierarchy. A better Phase 28 pattern is:

- render nodes with stable topology ids such as `topology-node-shell`, `topology-node-acl`, `topology-node-runtime`, `topology-node-service-signer`
- generate or declare edges from topology relationships
- have `flow-animator.ts` map tapped messages to a node/edge path instead of to one hard-coded center box

This also prepares the demo for future service nodes in Phases 29-31 without another conceptual reset.

### Recommended Artifact Split

The phase is best planned in two waves:

1. **Topology model and layered layout**
   - derive a demo topology model from host/runtime state
   - rebuild the main flow DOM into napplet, shell, ACL, runtime, and service nodes
   - ensure the napplet region and service region scale beyond the current chat/bot pair

2. **Topology-aware animation and regression coverage**
   - teach the animator about node/edge paths through the new hierarchy
   - keep the architecture view responsive and readable
   - add targeted tests that lock the topology model and rendered node structure to the real architecture

That split keeps ARCH-01 and ARCH-02 connected: the first plan creates the right shape, the second makes the shape trustworthy under interaction and future changes.

## Validation Architecture

### Dimension 1: Functional Correctness
- The rendered flow includes distinct napplet, shell, ACL, runtime, and real service nodes.
- Only services actually registered/wired in the demo appear.
- The main view no longer depends on a single `shell-box`.

### Dimension 2: Integration
- Topology data comes from demo host/runtime truth rather than a hand-maintained list in markup.
- `main.ts` and `flow-animator.ts` both consume the same topology model.
- Future phases can add notification or signer UX without replacing the architecture skeleton again.

### Dimension 3: Edge Cases
- More than two napplets can be represented without changing the architecture shape.
- Zero or one real services still renders a coherent runtime branch.
- ACL remains visually distinct even when some paths do not touch every service.

### Dimension 4: Performance
- Topology rendering remains cheap enough for demo boot and message flashing.
- No large DOM churn on each tapped message; animation should target known node and edge ids.

### Dimension 5: Regression
- A targeted topology model test locks required nodes and parent/child relationships.
- A DOM-oriented test or e2e check confirms the main view renders the expected node hierarchy.
- `pnpm --filter @napplet/demo build` remains green.

### Dimension 6: Security
- The architecture view does not imply that services bypass ACL.
- The UI does not show speculative placeholder services that are not actually registered.

### Dimension 7: Developer Experience
- Maintainers can add a service node by updating host/runtime wiring and topology data, not by rewriting the whole flow layout.
- Node ids and edge ids are explicit enough for debugger, animation, and future drill-down code to share.

### Dimension 8: Observability
- Message flashes can indicate whether traffic touched shell, ACL, runtime, and a specific service node.
- The visual hierarchy teaches the runtime/service split at a glance before users open the debugger.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Layout work hard-codes today’s signer service and breaks when more services appear | Medium | High | Build a topology model that enumerates real services instead of embedding fixed service markup only |
| ACL gets rendered as a global side label again instead of a checkpoint | Medium | High | Treat ACL as its own node/layer with explicit edges between napplets and runtime-facing flow |
| Animator logic stays tied to old ids and silently highlights the wrong architecture | High | Medium | Move animator input from hard-coded DOM ids to topology node and edge ids |
| Work drifts into node detail panels from Phase 29 | Medium | Medium | Limit this phase to hierarchy, labels, layout, and flow highlighting only |

## Build Order

1. **Wave 1:** Introduce a host-backed topology model and rebuild the main flow layout around it
2. **Wave 2:** Rewire animation to the new hierarchy and add regression coverage for topology structure

## RESEARCH COMPLETE

---

*Research: 2026-04-01*
*Phase: 28-architecture-topology-view*
