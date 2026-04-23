# Phase 31: Signer Connection UX - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the simplified signer demo with a visible signer connection experience that supports NIP-07 and NIP-46. This phase is about real signer connection UX, relay configuration for NIP-46, and making signer state legible in the demo architecture without falling back to a hidden fake-primary signer model.

</domain>

<decisions>
## Implementation Decisions

### Fallback / Demo Signer Behavior
- **D-01:** The phase should not present the current mock/demo signer as a user-facing fallback mode.
- **D-02:** The signer UX should require real NIP-07 or NIP-46 connection flows rather than treating a demo signer as an equivalent connect option.

### Connect Method Emphasis
- **D-03:** NIP-07 and NIP-46 should receive equal top-level emphasis in the connect experience.
- **D-04:** The UI should not frame NIP-46 as merely an advanced secondary path behind NIP-07.

### NIP-46 Relay Editing
- **D-05:** The editable NIP-46 relay should live inside the connect modal only.
- **D-06:** After connection, the relay may be shown for visibility, but editing should not be exposed from the node surface or inspector outside the connection flow.

### Post-Connect Information Hierarchy
- **D-07:** Post-connect visibility should include connection method, pubkey, relay, recent signer requests, and consent history.
- **D-08:** Full signer history and full consent history belong in the detail panel, not in the compact node surface, to avoid overloading the topology.
- **D-09:** The signer node itself should stay summary-oriented while the drill-down panel carries the richer request and consent timeline.

### the agent's Discretion
- Exact modal layout for presenting NIP-07 and NIP-46 side by side
- Exact terminology for bunker URI vs Nostr Connect QR in the UI
- Compact-summary fields shown on the signer node versus the inspector panel
- How recent signer requests and consent history are grouped or filtered in the detail view

</decisions>

<specifics>
## Specific Ideas

- The signer should feel like a real integration surface, not a developer shortcut hidden behind a mock keypair.
- Equal emphasis for NIP-07 and NIP-46 matters because both are first-class ways to use the demo, not beginner vs expert modes.
- The relay edit action is part of establishing the NIP-46 connection, not part of day-to-day node inspection, so it should stay inside the connect modal.
- The signer node should stay readable at a glance; the full request and consent story belongs in the inspector panel.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope
- `.planning/ROADMAP.md` — Phase 31 goal and success criteria
- `.planning/REQUIREMENTS.md` — `SIGN-01`, `SIGN-02`, `SIGN-03`, `SIGN-04`, `SIGN-05`
- `.planning/PROJECT.md` — Milestone expectation for signer service UX with NIP-07, NIP-46, and editable relay configuration

### Prior Phase Context
- `.planning/phases/28-architecture-topology-view/28-CONTEXT.md` — Signer node placement in the architecture view
- `.planning/phases/29-node-detail-drill-down/29-CONTEXT.md` — Compact node summary plus richer right-side inspector model
- `.planning/phases/27-demo-audit-correctness/27-CONTEXT.md` — Signer path observability and correctness expectations
- `.planning/phases/22.1-core-infrastructure-services/22.1-CONTEXT.md` — Signer-as-service direction and runtime/service boundary

### Current Demo and Signer Wiring
- `apps/demo/src/signer-demo.ts` — Current mock signer implementation being replaced as the primary user-facing experience
- `apps/demo/src/shell-host.ts` — Current signer service registration, signer mode labeling, and runtime hookup
- `apps/demo/src/main.ts` — Demo bootstrap and node/panel state integration points
- `apps/demo/index.html` — Current architecture surface where signer UI will appear

### Existing Signer / Runtime Contracts
- `packages/services/src/signer-service.ts` — Signer service request/response behavior and consent hook semantics
- `packages/runtime/src/types.ts` — Runtime signer hooks and consent request types
- `packages/shim/src/index.ts` — `window.nostr` proxy path that makes NIP-07-compatible signer requests through the shell
- `tests/e2e/signer-delegation.spec.ts` — Existing signer delegation coverage

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The demo already has signer-service wiring in `apps/demo/src/shell-host.ts`, so this phase can build on an existing signer node/path rather than inventing a new protocol path.
- The topology and inspector structure from Phases 28 and 29 provide the surfaces needed for compact signer status and richer signer history.
- Existing signer delegation tests provide a foundation for verifying the real connection UX.

### Established Patterns
- The current demo signer is still a mock implementation and should no longer be implied as the primary end-user path.
- The demo now labels signer mode explicitly after Phase 27; this can evolve into a real connection-state model for Phase 31.
- Signer activity and consent behavior are naturally richer than what should fit in a compact architecture node.

### Integration Points
- The phase will likely center on `apps/demo/src/shell-host.ts`, `apps/demo/src/signer-demo.ts`, `apps/demo/src/main.ts`, and the signer-related node/panel UI introduced by earlier milestone phases.
- NIP-46 connection state and relay configuration likely live in host-side UI state, while request/consent history should feed the signer inspector.
- The connect modal should be the sole editing surface for the NIP-46 relay, even if the chosen relay is displayed elsewhere after connection.

</code_context>

<deferred>
## Deferred Ideas

- Reintroducing a user-facing demo signer fallback is explicitly deferred and currently rejected for this phase.
- Advanced connection management outside the connect modal is deferred.
- Custom napplet loading remains outside the current milestone even though future custom napplets may rely on the signer connection UX.

</deferred>

---

*Phase: 31-signer-connection-ux*
*Context gathered: 2026-04-01*
