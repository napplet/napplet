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
- ✅ **v0.12.0 Spec Packaging** — Phase 61 (shipped 2026-04-06) — [Archive](milestones/v0.12.0-ROADMAP.md)
- ✅ **v0.13.0 Runtime Decoupling & Publish** — Phases 62-67 (shipped 2026-04-06) — [Archive](milestones/v0.13.0-ROADMAP.md)
- ✅ **v0.14.0 Repo Cleanup & Audit** — Phases 68-69 (shipped 2026-04-06) — [Archive](milestones/v0.14.0-ROADMAP.md)
- ✅ **v0.15.0 Protocol Simplification** — Phases 70-73 (shipped 2026-04-07) — [Archive](milestones/v0.15.0-ROADMAP.md)
- **v0.16.0 Wire Format & NUB Architecture** — Phases 74-78 (in progress)

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

<details>
<summary>v0.12.0 Spec Packaging (Phase 61) — SHIPPED 2026-04-06</summary>

- [x] **Phase 61: Spec Packaging** - Rename SPEC.md to RUNTIME-SPEC.md, finalize NIP-5D v2 format (completed 2026-04-05)

</details>

<details>
<summary>v0.13.0 Runtime Decoupling & Publish (Phases 62-67) — SHIPPED 2026-04-06</summary>

- [x] **Phase 62: Kehto Repo Scaffold** - Initialize ~/Develop/kehto as pnpm monorepo with package shells and GSD seed (completed 2026-04-06)
- [x] **Phase 63: Package Migration** - Copy source from @napplet, rewrite imports to @kehto/*, build and type-check green (completed 2026-04-06)
- [x] **Phase 64: Demo & Test Migration** - Demo playground and test suite running in kehto against @kehto packages (completed 2026-04-06)
- [x] **Phase 65: Napplet Cleanup** - Remove extracted packages and demo from @napplet, reconfigure for 4-package monorepo (completed 2026-04-06)
- [x] **Phase 66: Publish Pipeline & Release** - GitHub Actions CI/CD and npm publish for @napplet packages (completed 2026-04-06)
- [x] **Phase 67: Cross-Repo Wiring & Docs** - Switch kehto to npm @napplet/core dependency, update all READMEs (completed 2026-04-06)

</details>

<details>
<summary>v0.14.0 Repo Cleanup & Audit (Phases 68-69) — SHIPPED 2026-04-06</summary>

- [x] **Phase 68: Audit & Clean** - Remove dead code, stale docs, and leftover config (completed 2026-04-06)
- [x] **Phase 69: Migration Evaluation** - Assess remaining content for @kehto or nubs repo (completed 2026-04-06)

</details>

<details>
<summary>v0.15.0 Protocol Simplification (Phases 70-73) — SHIPPED 2026-04-07</summary>

- [x] **Phase 70: Core Protocol Types** - Remove AUTH/handshake types and constants from @napplet/core (completed 2026-04-07)
- [x] **Phase 71: Shim Simplification** - Strip signing, keypair, AUTH from shim; drop nostr-tools (completed 2026-04-07)
- [x] **Phase 72: NIP-5D Update** - Rewrite NIP-5D for simplified wire protocol (completed 2026-04-07)
- [x] **Phase 73: SDK & README Update** - Update all READMEs for no-crypto API (completed 2026-04-07)

</details>

### v0.16.0 Wire Format & NUB Architecture (In Progress)

**Milestone Goal:** Replace NIP-01 array wire format with generic JSON envelope. NIP-5D becomes transport+identity+manifest+NUB-negotiation only. Protocol messages defined by NUBs. Spec-first approach.

- [x] **Phase 74: NIP-5D Rewrite** - Rewrite NIP-5D as transport+identity+manifest+NUB-negotiation spec with generic JSON envelope (completed 2026-04-07)
- [ ] **Phase 75: NUB Specifications** - Write NUB-RELAY, NUB-SIGNER, NUB-STORAGE, NUB-IFC specs defining protocol messages
- [ ] **Phase 76: Core Envelope Types** - Replace NIP-01 array types in @napplet/core with JSON envelope types
- [ ] **Phase 77: Shim Envelope Migration** - Update @napplet/shim to send and receive JSON envelope messages
- [ ] **Phase 78: Documentation Update** - Update package READMEs for JSON envelope wire format

## Phase Details

### Phase 74: NIP-5D Rewrite
**Goal**: NIP-5D defines the wire protocol envelope, transport, identity, manifest, and NUB negotiation -- with zero protocol message definitions
**Depends on**: Nothing (first phase of v0.16.0)
**Requirements**: SPEC-01, SPEC-02, SPEC-03, SPEC-04
**Success Criteria** (what must be TRUE):
  1. NIP-5D specifies the generic JSON envelope format (`{ type, ...payload }`) as the sole wire format
  2. NIP-5D covers transport (postMessage), identity (message.source), and manifest -- and nothing else at the protocol-message level
  3. NIP-5D references NUBs as the source of all protocol message type definitions
  4. NIP-5D defines NUB negotiation flow (manifest `requires` tags, shell `supports`, compatibility resolution)
**Plans:** 1/1 plans complete

Plans:
- [x] 74-01-PLAN.md — Rewrite NIP-5D spec (JSON envelope, transport, identity, manifest, NUB negotiation)

### Phase 75: NUB Specifications
**Goal**: Four NUB specs define all protocol messages that were previously implicit in NIP-5D, using the JSON envelope
**Depends on**: Phase 74
**Requirements**: NUB-01, NUB-02, NUB-03, NUB-04
**Success Criteria** (what must be TRUE):
  1. NUB-RELAY spec defines relay proxy messages (subscribe, event, close, count) within the JSON envelope format
  2. NUB-SIGNER spec defines signing delegation messages (sign request, sign response, get-public-key) within the JSON envelope format
  3. NUB-STORAGE spec defines scoped storage messages (get, set, delete, keys) within the JSON envelope format
  4. NUB-IFC spec defines inter-frame communication with both dispatch mode (per-message ACL) and channel mode (ACL at open), merging the former IPC and PIPES concepts
  5. All four NUB specs reference the NIP-5D envelope and are self-contained message catalogs
**Plans:** 2 plans

Plans:
- [ ] 75-01-PLAN.md — NUB-RELAY and NUB-SIGNER specs (relay proxy + signing delegation)
- [ ] 75-02-PLAN.md — NUB-STORAGE and NUB-IFC specs (scoped storage + inter-frame communication)

### Phase 76: Core Envelope Types
**Goal**: @napplet/core exports typed JSON envelope message definitions that replace all NIP-01 array types
**Depends on**: Phase 75
**Requirements**: CORE-01, CORE-02
**Success Criteria** (what must be TRUE):
  1. @napplet/core exports discriminated union types for envelope messages (relay, signer, storage, ifc) matching the NUB specs
  2. NIP-01 verb constants (REQ, EVENT, CLOSE, etc.) are removed; JSON envelope type discriminants are the canonical message identifiers
  3. `pnpm build && pnpm type-check` passes with the new types and no NIP-01 array type exports
**Plans:** 1 plan

Plans:
- [ ] 74-01-PLAN.md — Rewrite NIP-5D spec (JSON envelope, transport, identity, manifest, NUB negotiation)

### Phase 77: Shim Envelope Migration
**Goal**: @napplet/shim sends and receives JSON envelope messages while preserving the window.napplet developer API unchanged
**Depends on**: Phase 76
**Requirements**: SHIM-01, SHIM-02, SHIM-03
**Success Criteria** (what must be TRUE):
  1. @napplet/shim sends JSON envelope objects (not NIP-01 arrays) via postMessage for all operations (subscribe, publish, query, emit, storage)
  2. @napplet/shim receives and correctly dispatches JSON envelope messages from the shell (events, EOSE, notices, storage responses)
  3. The window.napplet API (subscribe, publish, query, emit, on, storage) has identical call signatures and return types as before
  4. `pnpm build && pnpm type-check` passes across all packages
**Plans:** 1 plan

Plans:
- [ ] 74-01-PLAN.md — Rewrite NIP-5D spec (JSON envelope, transport, identity, manifest, NUB negotiation)

### Phase 78: Documentation Update
**Goal**: Package READMEs accurately describe the JSON envelope wire format
**Depends on**: Phase 77
**Requirements**: DOC-01
**Success Criteria** (what must be TRUE):
  1. @napplet/core README documents envelope message types and type discriminants instead of NIP-01 arrays
  2. @napplet/shim README describes JSON envelope as the wire format
  3. Root README references JSON envelope wire format and NUB architecture
**Plans:** 1 plan

Plans:
- [ ] 74-01-PLAN.md — Rewrite NIP-5D spec (JSON envelope, transport, identity, manifest, NUB negotiation)

## Progress

**Execution Order:**
Phases execute in numeric order: 74 -> 75 -> 76 -> 77 -> 78

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 74. NIP-5D Rewrite | 1/1 | Complete    | 2026-04-07 |
| 75. NUB Specifications | 0/TBD | Not started | - |
| 76. Core Envelope Types | 0/TBD | Not started | - |
| 77. Shim Envelope Migration | 0/TBD | Not started | - |
| 78. Documentation Update | 0/TBD | Not started | - |
