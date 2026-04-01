# Phase 27: Demo Audit & Correctness - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Reconcile the demo with the current `@napplet/*` architecture, identify stale integrations and correctness bugs, and add enough observability to distinguish UI bugs from real protocol, runtime, or ACL failures. This phase restores trust in the current demo behavior; it does not redesign the node topology or implement the later drill-down UI.

</domain>

<decisions>
## Implementation Decisions

### Audit Coverage
- **D-01:** Phase 27 should verify every capability path the current demo exercises, not just the visibly broken ones.
- **D-02:** The audit scope includes AUTH, relay publish, relay subscribe, inter-pane messaging, state read/write behavior, ACL toggles, and the current signer path.

### Correctness Evidence
- **D-03:** Fixes should add automated regression coverage where practical, especially for behavior that can be isolated in runtime, service, or demo integration tests.
- **D-04:** When a scenario is not worth automating yet, the phase should still leave a reproducible note or checklist describing the failure mode and the expected behavior after the fix.

### Observability Allowed in This Phase
- **D-05:** Any lightweight observability improvement is in scope if it helps explain which path failed, provided it does not rework the node layout reserved for later phases.
- **D-06:** Phase 27 may improve debugger labels, path-specific denial reporting, inline status messaging, or equivalent low-cost signals that clarify whether a failure came from relay, inter-pane, signer, state, or ACL behavior.

### Refactor Tolerance
- **D-07:** Phase 27 may replace stale internals when needed to restore correctness cleanly.
- **D-08:** Structural cleanup is allowed only insofar as it serves correctness and observability; it must not start the architecture-topology redesign planned for Phase 28.

### Current Diagnosis Baseline
- **D-09:** Treat the current chat/bot ACL confusion as an open diagnosis target, not a pre-decided runtime bug.
- **D-10:** The current code path shows that chat emits `chat:message` to the bot before attempting relay publish, so revoking `relay:write` can still allow a bot response through the inter-pane path. Phase 27 must make this distinction visible and verify whether any deeper bug also exists.

### the agent's Discretion
- Exact format of the reproducible audit checklist
- Which observability signals belong in the debugger versus lightweight inline UI
- Whether to fix demo correctness by patching the existing host or by swapping in newer runtime/service wiring, as long as the topology redesign does not begin

</decisions>

<specifics>
## Specific Ideas

- The demo is no longer just a visual playground; it should behave like a trustworthy correctness harness for the protocol.
- The user specifically reported a case where revoking chat's "write shell" capability caused the UI to imply a full block while the bot still received the message. This should be analyzed as separate message paths, not treated as one undifferentiated failure.
- Later phases will separate shell, ACL, runtime, and service nodes visually. Phase 27 should make failures understandable now without spending this phase on the full visual restructure.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope
- `.planning/ROADMAP.md` — Phase 27 boundary and its relationship to later demo phases
- `.planning/REQUIREMENTS.md` — `DEMO-01..03` for correctness plus the downstream dependencies on later demo phases
- `.planning/PROJECT.md` — Current milestone goals and explicit deferral of custom napplet loading

### Prior Demo and ACL Context
- `.planning/phases/05-demo-playground/05-CONTEXT.md` — Original playground intent, debugger model, and ACL demonstration assumptions that now need revalidation
- `.planning/phases/09-acl-enforcement-gate/09-CONTEXT.md` — ACL enforcement model, denial semantics, and audit logging expectations
- `.planning/phases/20-concrete-services/20-CONTEXT.md` — Notification service behavior and service-handler expectations relevant to demo wiring
- `.planning/phases/22.1-core-infrastructure-services/22.1-CONTEXT.md` — Signer-as-service and runtime/service migration expectations relevant to stale demo host wiring

### Demo Host and Current Behavior
- `apps/demo/src/main.ts` — Demo bootstrap and current debugger/ACL wiring
- `apps/demo/src/shell-host.ts` — Demo shell host, tap wiring, consent behavior, and capability toggling
- `apps/demo/src/acl-panel.ts` — Current ACL controls and capability labels shown to users
- `apps/demo/src/debugger.ts` — Current live log UI and protocol presentation surface
- `apps/demo/src/sequence-diagram.ts` — Current message-flow visualization assumptions
- `apps/demo/src/signer-demo.ts` — Simplified signer implementation currently used by the demo
- `apps/demo/napplets/chat/src/main.ts` — Current chat flow; emits inter-pane traffic before relay publish
- `apps/demo/napplets/bot/src/main.ts` — Current bot flow and inter-pane response behavior

### Runtime and Service Behavior
- `packages/runtime/src/enforce.ts` — Capability resolution rules that distinguish relay, state, signer, and inter-pane behavior
- `packages/runtime/src/runtime.ts` — Current runtime dispatch and service integration behavior
- `packages/services/src/signer-service.ts` — Current signer service behavior that the demo may need to reflect
- `packages/services/src/notification-service.ts` — Notification service behavior for later demo integration and current service expectations

### Existing Tests
- `packages/runtime/src/dispatch.test.ts` — Current runtime ACL and dispatch regression coverage
- `tests/unit/shell-runtime-integration.test.ts` — Integration-level behavior around shell/runtime wiring
- `tests/e2e/signer-delegation.spec.ts` — Signer flow coverage relevant to demo correctness

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/demo/src/shell-host.ts` already has a message tap and proxy instrumentation that can be extended for better path-level diagnostics.
- `apps/demo/src/debugger.ts` and `apps/demo/src/sequence-diagram.ts` provide an existing surface for richer labeling without requiring the later topology redesign.
- `packages/runtime/src/enforce.ts` already encodes the intended capability distinctions, which can be surfaced in the demo rather than guessed in UI code.
- Existing runtime and integration tests provide natural places for regression coverage when a bug turns out not to be demo-only.

### Established Patterns
- The current demo still reflects an older playground-era mental model and a simplified signer host, while the libraries now center more of the behavior in runtime and services.
- Inter-pane events, relay publish/subscribe, state operations, and signer requests are distinct protocol paths and should be presented as such during diagnosis.
- Prior phases established machine-readable ACL denial reasons and audit hooks; the demo should align with those instead of flattening multiple failure modes into one visual state.

### Integration Points
- Demo correctness work will concentrate in `apps/demo/src/main.ts`, `apps/demo/src/shell-host.ts`, `apps/demo/src/acl-panel.ts`, the debugger/sequence-diagram components, and the two demo napplets.
- If stale wiring is the root cause, fixes may need to touch runtime/service integration surfaces instead of only patching the demo UI.
- Automated regression coverage can land in unit/integration tests for runtime behavior or in demo-facing tests where a bug is specific to the host wiring.

</code_context>

<deferred>
## Deferred Ideas

- Phase 28 owns the visual topology redesign that separates shell, ACL, runtime, and service nodes in the main flow layout.
- Phase 29 owns the richer node-detail and drill-down panel experience.
- Custom napplet loading remains outside `v0.6.0` and should not be folded into this correctness phase.

</deferred>

---

*Phase: 27-demo-audit-correctness*
*Context gathered: 2026-04-01*
