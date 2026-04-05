# Roadmap: Napplet Protocol SDK

## Milestones

- ✅ **v0.1.0 Alpha** — Phases 1-6 (shipped 2026-03-30) — [Archive](milestones/v0.1.0-ROADMAP.md)
- ✅ **v0.2.0 Shell Architecture Cleanup** — Phases 7-11 (shipped 2026-03-31) — [Archive](milestones/v0.2.0-ROADMAP.md)
- ✅ **v0.3.0 Runtime and Core** — Phases 12-17 (shipped 2026-03-31) — [Archive](milestones/v0.3.0-ROADMAP.md)
- ✅ **v0.4.0 Feature Negotiation & Service Discovery** — Phases 18-22.1 (shipped 2026-03-31) — [Archive](milestones/v0.4.0-ROADMAP.md)
- ✅ **v0.5.0 Documentation & Developer Skills** — Phases 23-26 (shipped 2026-04-01) — [Archive](milestones/v0.5.0-ROADMAP.md)
- ✅ **v0.6.0 Demo Upgrade** — Phases 27-33 (shipped 2026-04-01) — [Archive](milestones/v0.6.0-ROADMAP.md)
- ✅ **v0.7.0 Ontology Audit and Adjustments** — Phases 34-40 (shipped 2026-04-02) — [Archive](milestones/v0.7.0-ROADMAP.md)
- ✅ **v0.8.0 Shim/SDK Split** — Phases 41-44 (shipped 2026-04-02) — [Archive](milestones/v0.8.0-ROADMAP.md)
- ✅ **v0.9.0 Identity & Trust** — Phases 46-48 (shipped 2026-04-03) — [Archive](milestones/v0.9.0-ROADMAP.md)
- ✅ **v0.10.0 Demo Consistency and Usability Pass** — Phases 49-53 (shipped 2026-04-04) — [Archive](milestones/v0.10.0-ROADMAP.md)
- ✅ **v0.11.0 Clean up Side Panel** — Phases 54-56 (shipped 2026-04-05) — [Archive](milestones/v0.11.0-ROADMAP.md)
- **v0.12.0 Draft Final "Nostr Web Applets" NIP** — Phases 57-61 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Note: Phase 45 (IPC terminology cleanup) was completed as a quick task during v0.8.0 and is not part of the v0.9.0 roadmap.

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
- [x] **Phase 25: SPEC.md Updates** - Update SPEC.md Section 11, rename legacy identifiers, and document the requires/compat protocol
- [x] **Phase 26: Skills Directory** - Create agentskills.io-format skill files: build-napplet, integrate-shell, add-service

</details>

<details>
<summary>v0.6.0 Demo Upgrade (Phases 27-33) — SHIPPED 2026-04-01</summary>

- [x] **Phase 27: Demo Audit & Correctness** - Reconcile the demo with current packages, identify stale integrations, and verify whether observed failures are UI bugs or deeper protocol/runtime issues
- [x] **Phase 28: Architecture Topology View** - Separate shell, ACL, runtime, and service nodes into a flow that mirrors the actual host architecture
- [x] **Phase 29: Node Detail & Drill-Down** - Add node-specific status surfaces plus a right-side expanded panel that preserves the bottom debugger
- [x] **Phase 30: Notification Service UX** - Register notification service in the demo, surface it as a node, and drive toast UX through the real service path
- [x] **Phase 31: Signer Connection UX** - Replace the simplified signer demo with visible signer connection flows for NIP-07 and NIP-46, including configurable NIP-46 relay settings
- [x] **Phase 32: Fix Demo UI/UX Bugs** - Amber infrastructure-failure state, Leader Line SVG edges, ACL isAmber logic fix, signer error detection
- [x] **Phase 33: Polish Demo UI Layout** - Fix layout and interaction issues: iframe container filling, 90-degree line routing, endpoint offsets, orphan container lines, and service button click handling

</details>

<details>
<summary>v0.7.0 Ontology Audit and Adjustments (Phases 34-40) — SHIPPED 2026-04-02</summary>

- [x] **Phase 34: Terminology Rename** - Rename all napp* identifiers, types, topics, meta tags, localStorage prefix, and docs to napplet* across all 7 packages
- [x] **Phase 35: Wire Protocol Rename** - Rename BusKind.INTER_PANE to BusKind.IPC_PEER and update all 30+ call sites plus SPEC.md
- [x] **Phase 36: Type Correctness** - Consolidate ConsentRequest to runtime canonical definition and remove shell/state-proxy.ts dead code
- [x] **Phase 37: API Alignment** - Rename RuntimeHooks/ShellHooks to RuntimeAdapter/ShellAdapter with deprecated aliases for one release cycle
- [x] **Phase 38: Session Vocabulary** - Rename NappKeyEntry/NappKeyRegistry to SessionEntry/SessionRegistry
- [x] **Phase 39: Documentation Pass** - Document topic prefix direction semantics and mark nappStorage as deprecated
- [x] **Phase 40: Remaining Rename Gaps** - Close audit gaps: createEphemeralKeypair, vite-plugin nappletType, SPEC.md stale topic strings

</details>

<details>
<summary>v0.8.0 Shim/SDK Split (Phases 41-44) — SHIPPED 2026-04-02</summary>

- [x] **Phase 41: Shim Restructure** - Reorganize @napplet/shim into a pure window installer with namespaced window.napplet API and zero named exports
- [x] **Phase 42: SDK Package** - Create @napplet/sdk as a standalone bundler-friendly package wrapping window.napplet
- [x] **Phase 43: Demo & Test Migration** - Update demo napplets and test suite for new window.napplet API shape
- [x] **Phase 44: Documentation** - Update SPEC.md and READMEs for shim/SDK split

</details>

<details>
<summary>v0.9.0 Identity & Trust (Phases 46-48) — SHIPPED 2026-04-03</summary>

- [x] **Phase 46: Shell-Assigned Keypair Handshake** - REGISTER/IDENTITY/AUTH handshake, storage rekeying, aggregate hash verification, instance GUIDs, delegated key security (completed 2026-04-02)
- [x] **Phase 47: Deprecation Cleanup** - Remove RuntimeHooks and ShellHooks deprecated aliases (completed 2026-04-02)
- [x] **Phase 48: Specification & Documentation** - Update SPEC.md Sections 2, 5, and 14 for new handshake, storage, and security models (completed 2026-04-02)

</details>

<details>
<summary>v0.10.0 Demo Consistency and Usability Pass (Phases 49-53) — SHIPPED 2026-04-04</summary>

- [x] **Phase 49: Constants Panel** - Expose and edit protocol magic numbers in a dedicated UI panel (completed 2026-04-03)
- [x] **Phase 50: ACL Detail Panel** - Show per-napplet restrictions, capabilities, and rejection reasons with full event context (completed 2026-04-03)
- [x] **Phase 51: Accurate Color Routing** - Directional edge coloring and composite node colors reflecting actual pass/fail/warn state (completed 2026-04-03)
- [x] **Phase 52: Service & Capability Toggles** - Enable/disable services and toggle individual ACL capabilities with live-reload (completed 2026-04-03)
- [x] **Phase 53: Per-Message Trace Mode** - Animated hop-by-hop message trace through the topology graph (completed 2026-04-03)

</details>

<details>
<summary>v0.11.0 Clean up Side Panel (Phases 54-56) — SHIPPED 2026-04-05</summary>

- [x] **Phase 54: Data Layer** - Add role annotations and query methods to ConstantDef for downstream filtering (completed 2026-04-04)
- [x] **Phase 55: Tab Reorganization** - Split Kinds into a read-only tab, constrain Constants to editable values, and fix tab persistence (completed 2026-04-04)
- [x] **Phase 56: Contextual Filtering** - Filter constants by selected node role with show-all fallback and toggle (completed 2026-04-04)

</details>

### v0.12.0 Draft Final "Nostr Web Applets" NIP (In Progress)

**Milestone Goal:** Write a terse NIP-format specification for Nostr Web Applets extending NIP-5A, design the NUB proposal framework for interface and message protocol extensions, and package for submission to nostr-protocol/nips.

- [x] **Phase 57: NIP Resolution & Pre-Engagement** - Resolve NIP number conflict and pre-engage key stakeholders before spec writing (completed 2026-04-05)
- [x] **Phase 58: Core Protocol NIP** - Write NIP-5D v1 with all capabilities inline (completed 2026-04-05, superseded by v2 pivot)
- [x] **Phase 59: NIP Simplification & NUB Framework Design** - Reduce NIP-5D to core-only (~150 lines), design NUB dual-track proposal system (completed 2026-04-05)
- [ ] **Phase 60: Initial NUB Interface Specs** - Draft NUB-WORD specs for existing capabilities (RELAY, STORAGE, SIGNER, NOSTRDB, IPC, PIPES)
- [ ] **Phase 61: Spec Packaging** - Rename SPEC.md, finalize NIP-5D v2 format, list reference implementations

## Phase Details

### Phase 57: NIP Resolution & Pre-Engagement
**Goal**: NIP number confirmed and key Nostr stakeholders aware of the spec direction before any writing begins
**Depends on**: Nothing (first phase of v0.12.0)
**Requirements**: RES-01, RES-02
**Success Criteria** (what must be TRUE):
  1. A NIP number is chosen (5D, 5E, or contested 5C) with rationale documented, confirmed not to collide with any open PR
  2. At least two of hzrd149, arthurfranca, fiatjaf have received an outline or draft framing that distinguishes NIP-5C scope from NIP-5A/5B
  3. Current status of PR#2281 (Scrolls), PR#2282 (5B), and PR#2287 (aggregate hash) is checked and documented as context for spec writing
**Plans**: 57-01 (NIP number resolution), 57-02 (stakeholder scope outline)

### Phase 58: Core Protocol NIP
**Goal**: A complete NIP draft covering AUTH, relay proxy, capability discovery, all standard capabilities, MUST/MAY layering, and security model
**Depends on**: Phase 57
**Requirements**: SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06, CAP-01, CAP-02, CAP-03, CAP-04, CAP-05, CAP-06
**Success Criteria** (what must be TRUE):
  1. NIP draft file exists with sections for transport, wire format, AUTH handshake (REGISTER/IDENTITY/AUTH referencing NIP-42), relay proxy forwarding, capability discovery (kind 29010), manifest integration (NIP-5A requires tags), and security considerations
  2. Every standard capability (relay proxy, IPC, storage, NIP-07 signer, nostrdb, service discovery) has a defined interface section with MUST or MAY designation
  3. The spec passes the "is it observable on the wire?" test -- no internal implementation details (ACL bitfields, hook interfaces, ring buffer sizing, class names)
  4. Document is under 500 lines of markdown and uses RFC 2119 keywords consistently
  5. MUST/MAY split is explicit: AUTH handshake + service discovery are MUST; relay proxy, IPC, storage, signer, nostrdb, channels are MAY
**Plans**: 58-01 (write NIP-5D spec: transport, AUTH, relay proxy, capabilities, security)

### Phase 59: NIP Simplification & NUB Framework Design
**Goal**: NIP-5D reduced to core-only (~150 lines) and NUB dual-track proposal framework designed
**Depends on**: Phase 58
**Requirements**: SIMP-01, SIMP-02, SIMP-03, SIMP-04
**Success Criteria** (what must be TRUE):
  1. NIP-5D v2 exists at specs/NIP-5D.md with only: handshake (REGISTER/IDENTITY/AUTH), transport (postMessage, sandbox), security model, and NUB reference — under 200 lines
  2. Standard capabilities (relay, IPC, storage, signer, nostrdb) removed from NIP body — referenced as NUB proposals
  3. Discovery mechanism uses NUB proposal IDs: shell.supports("NUB-RELAY", "NUB-02") pattern
  4. NIP references NUB proposal track for all interface and message protocol extensions
**Plans**: 2 plans
Plans:
- [x] 59-01-PLAN.md — Distill NIP-5D v1 to core-only v2 (~180 lines)
- [x] 59-02-PLAN.md — Create NUB framework documents (governance, templates)

### Phase 60: Initial NUB Interface Specs
**Goal**: NUB governance document and initial interface specs drafted for existing capabilities
**Depends on**: Phase 59
**Requirements**: NUB-01, NUB-02, NUB-03
**Success Criteria** (what must be TRUE):
  1. NUB governance document defines two tracks: NUB-WORD (interfaces, one canonical per name) and NUB-NN (message protocols, competing allowed)
  2. At least 6 initial NUB interface specs drafted: NUB-RELAY, NUB-STORAGE, NUB-SIGNER, NUB-NOSTRDB, NUB-IPC, NUB-PIPES
  3. NUB proposal template exists for both interface and message protocol submissions
**Plans**: 3 plans
Plans:
- [ ] 60-01-PLAN.md — Write NUB-RELAY, NUB-STORAGE, NUB-SIGNER specs
- [ ] 60-02-PLAN.md — Write NUB-NOSTRDB, NUB-IPC specs
- [ ] 60-03-PLAN.md — Write NUB-PIPES spec and verify governance artifacts

### Phase 61: Spec Packaging
**Goal**: NIP-5D v2 is in final submittable form and existing SPEC.md is repositioned as internal reference
**Depends on**: Phase 60
**Requirements**: PKG-01, PKG-02, PKG-03
**Success Criteria** (what must be TRUE):
  1. Existing SPEC.md is renamed to RUNTIME-SPEC.md with a header noting it is the internal/runtime reference, not the NIP
  2. NIP-5D v2 uses nostr-protocol/nips markdown conventions: setext headings, draft badge, correct event kind table format, References section
  3. Implementations section lists @napplet/shim + @napplet/shell (SDK) and hyprgate (reference shell) with links
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 57 -> 58 -> 59 -> 60 -> 61

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 57. NIP Resolution & Pre-Engagement | 2/2 | Complete | 2026-04-05 |
| 58. Core Protocol NIP (v1) | 1/1 | Complete | 2026-04-05 |
| 59. NIP Simplification & NUB Framework | 2/2 | Complete    | 2026-04-05 |
| 60. Initial NUB Interface Specs | 0/3 | Planned | - |
| 61. Spec Packaging | 0/0 | Not started | - |
