# Phase 30: Notification Service UX - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Surface the notification service as a first-class part of the demo and exercise it through visible toast behavior. This phase should use the real notification service path and present it clearly in the architecture, without inventing a separate fake notification model.

</domain>

<decisions>
## Implementation Decisions

### Toast Presentation Style
- **D-01:** Toasts should feel educational rather than purely product-polish or purely debugger-raw.
- **D-02:** Toast presentation should include readable service/protocol cues so users can connect the visible toast to the notification-service path underneath it.

### Trigger Surface
- **D-03:** Notifications should be triggerable from both dedicated notification-node controls and napplet-driven examples.
- **D-04:** The demo should show that notifications can originate from the architecture surface and from real napplet behavior, not only one of those paths.

### Notification Lifecycle Scope
- **D-05:** The demo should support create, dismiss, mark-read, and list-state behavior.
- **D-06:** The UX should expose the real lifecycle of notifications rather than a one-shot fire-and-forget toast demo.

### Node vs Panel Information Split
- **D-07:** The notification node should show counts and compact summary state in the main topology.
- **D-08:** The drill-down panel should hold the full notification list and richer history/detail, rather than pushing all notification state inline into the node.

### Host / Service Responsibility
- **D-09:** The real notification service remains browser-agnostic and host-owned; toast rendering belongs in the demo host layer via the service callback path.
- **D-10:** This phase should make it obvious that the toast UX is a presentation of service state, not a replacement for the service model itself.

### the agent's Discretion
- Exact toast copy, motion, and educational labeling
- Which napplet-driven examples should trigger notifications first
- Exact compact-summary fields for the notification node
- How notification history should be represented in the drill-down panel

</decisions>

<specifics>
## Specific Ideas

- The notification experience should teach the protocol while still feeling usable.
- A good outcome is that a user can trigger a notification from a node control, trigger another from napplet behavior, and understand that both are flowing through the same notification service.
- The main node should stay skim-friendly; the full notification inventory belongs in the inspector panel.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope
- `.planning/ROADMAP.md` — Phase 30 goal and dependency on Phases 28 and 29
- `.planning/REQUIREMENTS.md` — `NOTF-01`, `NOTF-02`, and `NOTF-03`
- `.planning/PROJECT.md` — Milestone-level expectation for notification/toast flow through the notification service

### Prior Phase Context
- `.planning/phases/28-architecture-topology-view/28-CONTEXT.md` — Service-node placement and topology rules
- `.planning/phases/29-node-detail-drill-down/29-CONTEXT.md` — Notification node summary vs drill-down expectations
- `.planning/phases/27-demo-audit-correctness/27-CONTEXT.md` — Correctness and observability expectations that still apply to notification behavior
- `.planning/phases/20-concrete-services/20-CONTEXT.md` — Original notification-service semantics and host-controlled presentation model

### Notification Service Implementation
- `packages/services/src/notification-service.ts` — Real notification service behavior and callback model
- `packages/services/src/types.ts` — Notification types and service options
- `packages/services/src/index.ts` — Export surface for `createNotificationService()`
- `packages/services/README.md` — Notification topics and host integration examples

### Current Demo Integration Points
- `apps/demo/src/shell-host.ts` — Demo host wiring point for registering the notification service and rendering toast UI from service callbacks
- `apps/demo/src/main.ts` — Demo bootstrap and UI state hookup point
- `apps/demo/index.html` — Architecture surface where the notification node and toast UI will be visible
- `apps/demo/src/flow-animator.ts` — Existing activity signaling that can help explain notification-service traffic

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createNotificationService()` already exposes an `onChange` callback intended for host-side presentation, so the demo host can render real toasts without modifying the service itself.
- The existing topology and drill-down work from Phases 28 and 29 provide natural surfaces for compact notification counts and detailed notification history.
- The demo bootstrap in `apps/demo/src/main.ts` and host wiring in `apps/demo/src/shell-host.ts` are the natural integration points for service registration and toast state.

### Established Patterns
- The service is browser-agnostic and should stay that way; UI belongs in the demo host.
- Notification topics already support create, dismiss, read, and list operations.
- The milestone’s architecture model prefers showing only real services actually wired into the demo.

### Integration Points
- The notification node should hang directly off runtime in the topology from Phase 28.
- The compact notification summary belongs in the node surface from Phase 29, while the full list/history belongs in the inspector panel.
- Napplet-driven examples may require small additions to demo napplets or host controls so the real `notifications:*` path is exercised visibly.

</code_context>

<deferred>
## Deferred Ideas

- OS-native notification APIs remain a host implementation detail and are not required for this phase.
- Broader service ACL work (`service:notifications`) is still a separate future phase.
- Custom napplet loading remains out of scope even though future custom napplets may eventually trigger notifications.

</deferred>

---

*Phase: 30-notification-service-ux*
*Context gathered: 2026-04-01*
