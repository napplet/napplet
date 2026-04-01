# Roadmap: Napplet Protocol SDK

## Milestones

- **v0.6.0 Demo Upgrade** — Phases 27-31 (planned)
- ✅ **v0.1.0 Alpha** — Phases 1-6 (shipped 2026-03-30) — [Archive](milestones/v0.1.0-ROADMAP.md)
- ✅ **v0.2.0 Shell Architecture Cleanup** — Phases 7-11 (shipped 2026-03-31) — [Archive](milestones/v0.2.0-ROADMAP.md)
- ✅ **v0.3.0 Runtime and Core** — Phases 12-17 (shipped 2026-03-31) — [Archive](milestones/v0.3.0-ROADMAP.md)
- ✅ **v0.4.0 Feature Negotiation & Service Discovery** — Phases 18-22.1 (shipped 2026-03-31) — [Archive](milestones/v0.4.0-ROADMAP.md)
- ✅ **v0.5.0 Documentation & Developer Skills** — Phases 23-26 (shipped 2026-04-01) — [Archive](milestones/v0.5.0-ROADMAP.md)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details open>
<summary>v0.6.0 Demo Upgrade (Phases 27-31) — PLANNED</summary>

- [x] **Phase 27: Demo Audit & Correctness** - Reconcile the demo with current packages, identify stale integrations, and verify whether observed failures are UI bugs or deeper protocol/runtime issues (completed 2026-04-01)
- [ ] **Phase 28: Architecture Topology View** - Separate shell, ACL, runtime, and service nodes into a flow that mirrors the actual host architecture
- [ ] **Phase 29: Node Detail & Drill-Down** - Add node-specific status surfaces plus a right-side expanded panel that preserves the bottom debugger
- [ ] **Phase 30: Notification Service UX** - Register notification service in the demo, surface it as a node, and drive toast UX through the real service path
- [ ] **Phase 31: Signer Connection UX** - Replace the simplified signer demo with visible signer connection flows for NIP-07 and NIP-46, including configurable NIP-46 relay settings

</details>

## Phase Details

### Phase 27: Demo Audit & Correctness
**Goal**: Reconcile the demo with the current `@napplet/*` architecture, identify stale integrations and correctness bugs, and make protocol failures understandable enough to distinguish UI issues from real ACL, runtime, or service behavior
**Depends on**: Nothing (first phase in the milestone)
**Requirements**: DEMO-01, DEMO-02, DEMO-03
**Success Criteria** (what must be TRUE):
  1. The demo boots against the current package structure without stale integration paths or obviously broken wiring
  2. Revoking a capability shows the affected protocol path clearly enough that relay, inter-pane, signer, and state failures are not conflated
  3. The phase leaves regression coverage where practical and reproducible notes for any diagnosed behavior that is not yet automated
**Plans**: 3 completed

### Phase 28: Architecture Topology View
**Goal**: Rebuild the main demo topology so the visual node hierarchy matches the actual host architecture instead of flattening shell behavior into a single box
**Depends on**: Phase 27
**Requirements**: ARCH-01, ARCH-02
**Success Criteria** (what must be TRUE):
  1. The flow view separates napplets, shell, ACL, runtime, and each registered service into distinct nodes
  2. The ordering and hierarchy of nodes teach the real architecture accurately at a glance
**Plans**: TBD

### Phase 29: Node Detail & Drill-Down
**Goal**: Add node-specific state surfaces and an expanded right-side drill-down panel so users can inspect the demo architecture without losing the bottom debugger
**Depends on**: Phase 28
**Requirements**: NODE-01, NODE-02
**Success Criteria** (what must be TRUE):
  1. Each node presents live information relevant to its role, such as identity, capabilities, recent activity, or service state
  2. Supported nodes can open an expanded drill-down view in a right-side panel while preserving access to the bottom debugger
**Plans**: 3 planned

### Phase 30: Notification Service UX
**Goal**: Surface the notification service as a first-class part of the demo and exercise it through visible toast behavior
**Depends on**: Phase 28, Phase 29
**Requirements**: NOTF-01, NOTF-02, NOTF-03
**Success Criteria** (what must be TRUE):
  1. The demo registers the notification service and shows it as its own node in the flow
  2. Users can trigger toast notifications through the real notification service path and observe the resulting protocol activity
  3. The notification node exposes useful notification state or actions for tinkering and inspection
**Plans**: TBD

### Phase 31: Signer Connection UX
**Goal**: Replace the simplified signer demo with a visible signer connection experience that supports NIP-07 and NIP-46 flows
**Depends on**: Phase 27, Phase 28, Phase 29
**Requirements**: SIGN-01, SIGN-02, SIGN-03, SIGN-04, SIGN-05
**Success Criteria** (what must be TRUE):
  1. The demo includes a visible signer node and login/connect flow instead of a hidden mock signer-only experience
  2. Users can connect through NIP-07 when available and through NIP-46 using either a bunker URI or a Nostr Connect QR code
  3. The demo UI allows editing the NIP-46 relay and shows signer connection state, pubkey, and recent signer activity
**Plans**: TBD

<details>
<summary>v0.1.0 Alpha (Phases 1-6) — SHIPPED 2026-03-30</summary>

- [x] **Phase 1: Wiring Fixes** - Fix extraction breakage so packages work end-to-end
- [x] **Phase 2: Test Infrastructure** - Playwright e2e framework for protocol conformance
- [x] **Phase 3: Core Protocol Tests** - AUTH, routing, lifecycle, replay detection tests
- [x] **Phase 4: Capability Tests** - ACL, storage, signer, inter-pane tests
- [x] **Phase 5: Demo Playground** - Interactive Chat + Bot demo with protocol debugger
- [x] **Phase 6: Specification and Publish** - Refine NIP-5A spec and validate packages

</details>

<details>
<summary>v0.2.0 Shell Architecture Cleanup (Phases 7-11) — SHIPPED 2026-03-31</summary>

- [x] **Phase 7: Nomenclature** - Rename PseudoRelay to ShellBridge across all packages
- [x] **Phase 8: ACL Pure Module** - Extract @napplet/acl as zero-dep pure module
- [x] **Phase 9: ACL Enforcement Gate** - Single enforce() gate in ShellBridge
- [x] **Phase 10: ACL Behavioral Tests** - Full capability x action matrix tests
- [x] **Phase 11: Shell Code Cleanup** - Verb-noun naming, JSDoc, clean internals

</details>

<details>
<summary>v0.3.0 Runtime and Core (Phases 12-17) — SHIPPED 2026-03-31</summary>

- [x] **Phase 12: Core Package** - Extract shared protocol types, constants, and message definitions into @napplet/core
- [x] **Phase 13: Runtime Package** - Extract protocol engine into @napplet/runtime
- [x] **Phase 14: Shell Adapter and Shim Rewire** - Slim shell to browser adapter over runtime; switch shim to core imports
- [x] **Phase 15: Service Extension Design** - Define RuntimeHooks.services interface and reserve kind 29010
- [x] **Phase 16: Verification** - Full test suite green with new structure
- [x] **Phase 17: Shell Export Cleanup** - Remove dead exports, deduplicate enforce, clean singletons

</details>

<details>
<summary>v0.4.0 Feature Negotiation & Service Discovery (Phases 18-22.1) — SHIPPED 2026-03-31</summary>

- [x] **Phase 18: Core Types & Runtime Dispatch** - ServiceDescriptor in core, ServiceHandler/ServiceRegistry in runtime, topic-prefix routing
- [x] **Phase 19: Service Discovery Protocol** - Kind 29010 REQ/EVENT/EOSE synthetic response flow
- [x] **Phase 20: Concrete Services** - @napplet/services package with audio and notification ServiceHandlers
- [x] **Phase 21: Shim Discovery API** - discoverServices(), hasService(), hasServiceVersion() on window.napplet global
- [x] **Phase 22: Negotiation & Compatibility** - Manifest requires tags, CompatibilityReport, strict/permissive mode, undeclared consent
- [x] **Phase 22.1: Core Infrastructure Services** (INSERTED) - Signer, relay pool, cache extracted as ServiceHandlers

</details>

<details>
<summary>v0.5.0 Documentation & Developer Skills (Phases 23-26) — SHIPPED 2026-04-01</summary>

- [x] **Phase 23: New Package READMEs** - Create READMEs for the four new packages: @napplet/acl, @napplet/core, @napplet/runtime, @napplet/services
- [x] **Phase 24: Root and Interface READMEs** - Update root README and existing package READMEs: shim, shell, vite-plugin to reflect v0.4.0 reality
- [x] **Phase 25: SPEC.md Updates** - Update SPEC.md Section 11, rename legacy identifiers, and document the requires/compat protocol (completed 2026-03-31)
- [x] **Phase 26: Skills Directory** - Create agentskills.io-format skill files: build-napplet, integrate-shell, add-service (completed 2026-03-31)

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Wiring Fixes | v0.1.0 | 5/5 | Complete | 2026-03-30 |
| 2. Test Infrastructure | v0.1.0 | 6/6 | Complete | 2026-03-30 |
| 3. Core Protocol Tests | v0.1.0 | 5/5 | Complete | 2026-03-30 |
| 4. Capability Tests | v0.1.0 | 5/5 | Complete | 2026-03-30 |
| 5. Demo Playground | v0.1.0 | 5/5 | Complete | 2026-03-30 |
| 6. Specification and Publish | v0.1.0 | 4/4 | Complete | 2026-03-30 |
| 7. Nomenclature | v0.2.0 | 2/2 | Complete | 2026-03-30 |
| 8. ACL Pure Module | v0.2.0 | 3/3 | Complete | 2026-03-30 |
| 9. ACL Enforcement Gate | v0.2.0 | 2/2 | Complete | 2026-03-30 |
| 10. ACL Behavioral Tests | v0.2.0 | 2/2 | Complete | 2026-03-30 |
| 11. Shell Code Cleanup | v0.2.0 | 2/2 | Complete | 2026-03-31 |
| 12. Core Package | v0.3.0 | 3/3 | Complete | 2026-03-31 |
| 13. Runtime Package | v0.3.0 | 5/5 | Complete | 2026-03-31 |
| 14. Shell Adapter and Shim Rewire | v0.3.0 | 2/2 | Complete | 2026-03-31 |
| 15. Service Extension Design | v0.3.0 | 2/2 | Complete | 2026-03-31 |
| 16. Verification | v0.3.0 | 4/4 | Complete | 2026-03-31 |
| 17. Shell Export Cleanup | v0.3.0 | 1/1 | Complete | 2026-03-31 |
| 18. Core Types & Runtime Dispatch | v0.4.0 | 3/3 | Complete | 2026-03-31 |
| 19. Service Discovery Protocol | v0.4.0 | 2/2 | Complete | 2026-03-31 |
| 20. Concrete Services | v0.4.0 | 4/4 | Complete | 2026-03-31 |
| 21. Shim Discovery API | v0.4.0 | 2/2 | Complete | 2026-03-31 |
| 22. Negotiation & Compatibility | v0.4.0 | 4/4 | Complete | 2026-03-31 |
| 22.1. Core Infrastructure Services | v0.4.0 | 4/4 | Complete | 2026-03-31 |
| 23. New Package READMEs | v0.5.0 | 4/4 | Complete | 2026-03-31 |
| 24. Root and Interface READMEs | v0.5.0 | 4/4 | Complete | 2026-03-31 |
| 25. SPEC.md Updates | v0.5.0 | 1/1 | Complete | 2026-03-31 |
| 26. Skills Directory | v0.5.0 | 3/3 | Complete | 2026-03-31 |
| 27. Demo Audit & Correctness | v0.6.0 | 3/3 | Complete | 2026-04-01 |
| 28. Architecture Topology View | v0.6.0 | 0/0 | Planned | — |
| 29. Node Detail & Drill-Down | v0.6.0 | 0/3 | Planned | — |
| 30. Notification Service UX | v0.6.0 | 0/0 | Planned | — |
| 31. Signer Connection UX | v0.6.0 | 0/0 | Planned | — |
