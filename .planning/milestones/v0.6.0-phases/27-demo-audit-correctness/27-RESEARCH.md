# Phase 27: Demo Audit & Correctness - Research

**Researched:** 2026-04-01
**Phase:** 27-demo-audit-correctness
**Requirements:** DEMO-01, DEMO-02, DEMO-03

## Technical Approach

### Current State: Demo Builds, But It Still Teaches an Older Host Model

`pnpm --filter @napplet/demo build` succeeds on the current tree, so Phase 27 is not primarily about broken imports or an unbootable bundle. The gap is behavioral correctness and observability.

The current demo still wires itself around a flattened shell-era mental model:

- `apps/demo/src/shell-host.ts` boots `createShellBridge(hooks)` with inline mock hooks and mutates `relay.runtime.aclState` directly for ACL toggles.
- The demo does **not** register any `RuntimeHooks.services` or call `runtime.registerService()` even though the runtime and `@napplet/services` now support service-based behavior.
- `apps/demo/src/signer-demo.ts` still provides signer behavior through `hooks.auth.getSigner()` rather than exercising the service registration path introduced in Phase 22.1.
- `apps/demo/src/acl-panel.ts` labels `relay:read` and `relay:write` as "Read Shell" / "Write Shell", which hides the real distinction between relay publish, inter-pane delivery, and state/signer traffic.

**Implication:** DEMO-01 should be treated as "demo behavior matches the current `@napplet/*` architecture closely enough to trust its diagnosis", not merely "Vite build succeeds".

### Capability Routing Already Exists in Runtime; Demo Should Surface It Instead of Guessing

`packages/runtime/src/enforce.ts` already encodes the core distinction the demo currently hides:

- signer requests (`kind 29001`) map to `sign:event`
- state get/keys map to `state:read`
- state set/remove/clear map to `state:write`
- generic inter-pane messages map to sender `relay:write` and recipient `relay:read`
- relay publish also maps to sender `relay:write` and recipient `relay:read`

This means the demo should not invent its own capability semantics in UI copy or debugger summaries. The most reliable approach is:

1. classify tapped traffic into explicit path families (`auth`, `relay-publish`, `relay-subscribe`, `inter-pane-send`, `inter-pane-receive`, `state-read`, `state-write`, `signer-request`, `signer-response`, `service-discovery`, `service-message`)
2. preserve the exact runtime denial reason (`denied: relay:write`, `denied: state:read`, `denied: sign:event`)
3. show which path succeeded or failed independently

That directly addresses DEMO-02 and DEMO-03 without waiting for the larger topology redesign in Phase 28.

### The Reported Chat/Bot ACL Confusion Is Real and Expected from Current Ordering

`apps/demo/napplets/chat/src/main.ts` currently does this in `sendMessage()`:

1. `emit('chat:message', ...)`
2. `publish(template, [])`

So when chat loses `relay:write`, the bot can still hear `chat:message` first if the inter-pane path remains allowed, and only the later relay publish fails. That matches the context diagnosis and explains why the UI can imply "message blocked" while the bot still responds.

**Important nuance:** this is not automatically a runtime bug. It is at least a demo explanation bug and may also expose stale UI assumptions. Phase 27 should make the two paths visibly independent before deciding whether ordering or behavior needs to change.

### Existing Automated Coverage Is Strong for Core ACL Rules, Weak for Demo-Specific Diagnosis

The repo already has strong coverage for runtime and ACL behavior:

- `packages/runtime/src/dispatch.test.ts` covers `relay:write`, `relay:read`, `sign:event`, and `state:read` denials.
- `tests/e2e/acl-matrix-relay.spec.ts`, `tests/e2e/acl-matrix-state.spec.ts`, and `tests/e2e/acl-matrix-signer.spec.ts` verify the enforcement matrix.
- `tests/e2e/signer-delegation.spec.ts` verifies signer request/response behavior.

What is missing is demo-facing evidence for:

- which path the demo claims was blocked
- whether debugger labels distinguish inter-pane vs relay vs signer vs state
- whether ACL panel wording matches real capability routing
- whether the demo host is still bypassing newer runtime/service architecture in misleading ways

Phase 27 should therefore add **integration tests near the demo/host boundary**, not re-derive enforcement behavior already proven deeper in the stack.

### Demo Host Should Align with Current Runtime/Service Architecture Where It Improves Correctness

The runtime already supports both:

- legacy fallback signer handling in `packages/runtime/src/runtime.ts`
- service-based signer handling via a registered `signer` service

The demo currently uses the fallback path. That is acceptable only if it remains clearly intentional and does not mislead the debugger/UI about what architecture is being exercised. A better Phase 27 approach is:

- audit whether the demo can register `createSignerService(...)` from `@napplet/services`
- if the change is low-risk, switch the demo to the service path now
- if not, document that the fallback signer path remains in use and make the debugger explicitly label it as a runtime fallback rather than a registered service

That keeps Phase 27 within "correctness and observability" while avoiding the bigger visual restructure deferred to later phases.

### Recommended Artifact Split

The phase should likely be executed in three plans:

1. **Audit and host alignment**
   - inventory every exercised capability path
   - remove stale host assumptions
   - decide whether signer/service wiring should move to registered services now

2. **Path-specific diagnostics and UI correction**
   - debugger labels
   - ACL copy
   - inline status surfaces
   - sequence diagram/path summaries

3. **Regression coverage and reproducible notes**
   - demo-facing tests for reported confusing scenarios
   - an explicit audit note/checklist for scenarios not worth automating yet

This split matches the phase goal and keeps the milestone dependency chain clean for Phases 28-31.

## Validation Architecture

### Dimension 1: Functional Correctness
- Demo still boots and authenticates both napplets after host realignment.
- Relay publish, relay subscribe, inter-pane messaging, state operations, and signer flows are each exercised explicitly.
- The reported "bot replies even when write is revoked" scenario becomes explainable as either independent inter-pane success or a genuine bug.

### Dimension 2: Integration
- Demo host wiring reflects current runtime/service capabilities instead of a stale shell-only abstraction.
- Any switch to `@napplet/services` uses actual service registration rather than a fake UI-only label.
- Debugger output is driven from tapped protocol/runtime evidence, not hand-maintained strings alone.

### Dimension 3: Edge Cases
- Mid-session ACL revocation changes the next matching operation only.
- Chat can be denied on relay publish while bot still hears inter-pane traffic, and the UI shows both outcomes separately.
- State and signer failures remain distinguishable from relay failures.

### Dimension 4: Performance
- Added debugger metadata does not meaningfully degrade demo responsiveness.
- Build stays fast enough for frequent feedback (`pnpm --filter @napplet/demo build` already completes quickly).

### Dimension 5: Regression
- Existing runtime/ACL tests remain green.
- New demo-facing tests cover the path-classification and denial-reporting layer instead of duplicating lower-level ACL tests.
- Demo bundle still builds after host and debugger changes.

### Dimension 6: Security
- ACL toggles must continue to act through real runtime ACL state.
- Diagnostics must not imply a capability was denied when it actually succeeded on a different path.
- Demo signer behavior must remain visibly fake/demo-only if a real host signer is not involved.

### Dimension 7: Developer Experience
- A maintainer can identify from the debugger whether a failure came from UI assumptions, runtime ACL enforcement, missing service wiring, or mock host behavior.
- Repro steps for non-automated findings live in a committed audit note rather than chat history alone.

### Dimension 8: Observability
- Every user-facing failure message should identify both the protocol path and the denial/runtime reason when available.
- Sequence/debug views should stop flattening "shell blocked it" into one undifferentiated bucket.
- Demo logs should be sufficient to separate "UI wording bug" from "runtime/service bug".

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Switching the demo to service-registered signer introduces churn beyond Phase 27 | Medium | Medium | Treat signer alignment as an audit decision with a fallback to explicit labeling if the swap is not low-risk |
| Debugger improvements stay too UI-only and do not reflect real runtime semantics | Medium | High | Reuse capability/path information already encoded in `packages/runtime/src/enforce.ts` |
| New tests duplicate ACL matrix coverage without protecting demo correctness | Medium | Medium | Focus new coverage on demo-host interpretation, UI labeling, and end-to-end diagnosis scenarios |
| Phase scope drifts into Phase 28 topology redesign | High | Medium | Restrict this phase to labels, status surfaces, path grouping, and host wiring correctness only |

## Build Order

1. **Wave 1:** Audit current host wiring and align obvious stale integrations with runtime/service reality
2. **Wave 2:** Make path-specific failures visible in ACL controls, debugger output, and demo status messaging
3. **Wave 3:** Add demo-facing regression coverage and an explicit audit checklist for any remaining manual scenarios

## RESEARCH COMPLETE

---

*Research: 2026-04-01*
*Phase: 27-demo-audit-correctness*
