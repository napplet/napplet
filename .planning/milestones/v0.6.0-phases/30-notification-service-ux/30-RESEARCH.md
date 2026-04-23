# Phase 30: Notification Service UX - Research

**Researched:** 2026-04-01
**Phase:** 30 — Notification Service UX
**Requirement IDs:** NOTF-01, NOTF-02, NOTF-03

## Research Question

What do we need to know to plan Phase 30 well?

## 1. Current State Audit

### Demo host wiring

- `apps/demo/src/shell-host.ts` currently registers only the signer service in `createDemoHooks().services`.
- `bootShell()` exposes the tap and relay, but there is no host-owned notification state, no notification callback wiring, and no exported notification actions for the UI.
- The demo host already has the right architectural seam for this phase: `createNotificationService()` is designed to stay browser-agnostic while the host owns presentation via `onChange`.

### Demo UI surface

- `apps/demo/index.html` still renders a fixed three-column `chat -> shell/acl -> bot` layout with no runtime/service split visible in the file checked into the repo.
- There is no dedicated notification node, no toast layer, and no inspector/list surface for notification history.
- `apps/demo/src/flow-animator.ts` still hard-codes `shell-box`, `chat-box`, and `bot-box`, so any notification node added in Phase 30 will require extending or partially generalizing the animator.

### Napplet behavior

- `apps/demo/napplets/chat/src/main.ts` and `apps/demo/napplets/bot/src/main.ts` currently exercise relay, inter-pane, signer, and state flows only.
- No napplet emits `notifications:create`, `notifications:read`, `notifications:dismiss`, or `notifications:list`.
- This means Phase 30 must add at least one real napplet-driven notification path; otherwise the demo would only prove host-side controls.

### Notification service behavior

- `packages/services/src/notification-service.ts` already supports the full lifecycle Phase 30 wants to expose:
  - `notifications:create`
  - `notifications:dismiss`
  - `notifications:read`
  - `notifications:list`
- The service returns shell-originated `notifications:created` and `notifications:listed` responses and calls `onChange` whenever the notification registry changes.
- The service keeps the model host-owned and browser-agnostic, matching Phase 30 decisions D-09 and D-10.

## 2. Planning Implications

### NOTF-01: Service registration and visible node

Phase 30 cannot satisfy NOTF-01 with markup alone. The plan must explicitly register `notifications: createNotificationService(...)` in `createDemoHooks().services` so the topology is telling the truth. The notification node should only appear because the runtime actually has the service wired.

### NOTF-02: Visible toasts through the real service path

Toast UX must be derived from host-side notification state that comes from the service `onChange` callback, not from a parallel local toast store. The plan should also add path cues so a user can see that:

- a napplet emitted `notifications:create`
- the runtime routed that event to the registered service
- the host reacted through `onChange`
- a toast and list state changed because of that service update

### NOTF-03: Node summary and tinkering controls

The notification node needs two levels of information:

- compact node summary in the topology: total count, unread count, and recent activity status
- richer drill-down state in the right-side inspector: full notification list, per-item lifecycle, and host/demo controls

This matches Phase 30 D-07/D-08 and keeps the main topology skim-friendly.

## 3. Concrete Integration Approach

### Host-side notification controller

The cleanest shape is a dedicated demo module, likely `apps/demo/src/notification-demo.ts`, that:

- stores the latest notification list from `createNotificationService({ onChange })`
- tracks toast visibility state separately from service truth
- exposes subscription helpers for `main.ts`
- exposes UI actions for:
  - create demo notification via the real service path
  - mark notification read
  - dismiss notification
  - request/list current notifications

This keeps `shell-host.ts` focused on runtime wiring and `main.ts` focused on DOM updates.

### Napplet-driven examples

The current demo napplets already provide natural hooks:

- chat can emit `notifications:create` when a message is sent or when a relay/signer action succeeds or fails
- bot can emit `notifications:create` when it learns a rule or sends a response

At least one example should be added to each side of the “node control vs napplet behavior” split from D-03/D-04. The important point is not volume; it is proving that both routes hit the same service and show up in the same host-managed list/toast UI.

### UI gate assumption

`workflow.ui_phase` and `workflow.ui_safety_gate` are enabled, and there is no `30-UI-SPEC.md`. Because this run is explicitly non-interactive background planning, the planning pass should proceed under the “Continue without UI-SPEC” branch instead of stopping. The existing `30-CONTEXT.md` is specific enough to plan concrete UI work without inventing new product direction.

## 4. Risks and Dependencies

### Phase 28/29 dependency reality

The roadmap says Phase 30 depends on Phases 28 and 29, but the current checked-in demo files still look flatter than those phase contexts describe. The plans should therefore:

- prefer additive notification work over assuming a completed topology framework exists
- call out any necessary HTML/animator reshaping inside the phase tasks
- avoid requiring a missing abstraction before the executor can start

### Service-path observability

The debugger currently labels relay, inter-pane, state, and signer paths. Phase 30 likely needs notification-specific labeling or node activity signals; otherwise users may see a toast without understanding that it came from the notification service path.

### Testing strategy

The repo already has:

- Vitest coverage in `packages/services/src/*.test.ts`
- Playwright demo coverage in `tests/e2e/demo-audit-correctness.spec.ts`

Phase 30 should follow that split:

- unit-test the notification service lifecycle directly
- add demo-focused Playwright coverage that boots the real demo and verifies node visibility, toast behavior, and lifecycle controls

## 5. Recommended Plan Structure

### Plan 30-01: Register notification service and host state

- Add demo-host notification controller/state
- Register the notification service in the actual runtime hooks
- Surface host APIs that UI code can consume without bypassing the service

### Plan 30-02: Notification node, inspector, and toast UX

- Add the notification node to the topology
- Add compact summary + right-side inspector details
- Add visible toast rendering and dedicated node controls

### Plan 30-03: Napplet triggers and regression coverage

- Add napplet-driven notification examples
- Add unit coverage for service lifecycle expectations
- Add Playwright coverage for the visible demo behavior

## 6. Validation Architecture

**Dimension 1 — Real wiring:** `apps/demo/src/shell-host.ts` registers `notifications: createNotificationService(...)` in demo hooks.

**Dimension 2 — First-class topology:** `apps/demo/index.html` contains a dedicated notification node and `apps/demo/src/main.ts` renders notification summary data into it.

**Dimension 3 — Visible service-path UX:** Toast rendering is driven by host state derived from the notification service callback, not a fake local-only store.

**Dimension 4 — Lifecycle coverage:** The demo exposes create, dismiss, read, and list behavior through UI controls or napplet flows, and the service unit tests cover those transitions.

**Dimension 5 — Educational cues:** The visible UI contains readable protocol/service labels such as `notifications:create`, `notifications:list`, or equivalent service-path wording.

**Dimension 6 — Demo regression coverage:** A Playwright spec boots the demo and verifies node visibility, toast appearance, and notification inspector updates.

**Dimension 7 — Build/type safety:** `pnpm build` and `pnpm type-check` remain green after demo and service changes.

## RESEARCH COMPLETE
