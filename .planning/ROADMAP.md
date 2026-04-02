# Roadmap: Napplet Protocol SDK

## Milestones

- ✅ **v0.1.0 Alpha** — Phases 1-6 (shipped 2026-03-30) — [Archive](milestones/v0.1.0-ROADMAP.md)
- ✅ **v0.2.0 Shell Architecture Cleanup** — Phases 7-11 (shipped 2026-03-31) — [Archive](milestones/v0.2.0-ROADMAP.md)
- ✅ **v0.3.0 Runtime and Core** — Phases 12-17 (shipped 2026-03-31) — [Archive](milestones/v0.3.0-ROADMAP.md)
- ✅ **v0.4.0 Feature Negotiation & Service Discovery** — Phases 18-22.1 (shipped 2026-03-31) — [Archive](milestones/v0.4.0-ROADMAP.md)
- ✅ **v0.5.0 Documentation & Developer Skills** — Phases 23-26 (shipped 2026-04-01) — [Archive](milestones/v0.5.0-ROADMAP.md)
- ✅ **v0.6.0 Demo Upgrade** — Phases 27-33 (shipped 2026-04-01) — [Archive](milestones/v0.6.0-ROADMAP.md)
- ✅ **v0.7.0 Ontology Audit and Adjustments** — Phases 34-40 (shipped 2026-04-02) — [Archive](milestones/v0.7.0-ROADMAP.md)
- **v0.8.0 Shim/SDK Split** — Phases 41-44 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

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

- [x] **Phase 34: Terminology Rename** - Rename all napp* identifiers, types, topics, meta tags, localStorage prefix, and docs to napplet* across all 7 packages (completed 2026-04-01)
- [x] **Phase 35: Wire Protocol Rename** - Rename BusKind.INTER_PANE to BusKind.IPC_PEER and update all 30+ call sites plus SPEC.md (completed 2026-04-01)
- [x] **Phase 36: Type Correctness** - Consolidate ConsentRequest to runtime canonical definition and remove shell/state-proxy.ts dead code (completed 2026-04-01)
- [x] **Phase 37: API Alignment** - Rename RuntimeHooks/ShellHooks to RuntimeAdapter/ShellAdapter with deprecated aliases for one release cycle (completed 2026-04-01)
- [x] **Phase 38: Session Vocabulary** - Rename NappKeyEntry/NappKeyRegistry to SessionEntry/SessionRegistry (completed 2026-04-01)
- [x] **Phase 39: Documentation Pass** - Document topic prefix direction semantics and mark nappStorage as deprecated (completed 2026-04-01)
- [x] **Phase 40: Remaining Rename Gaps** - Close audit gaps: createEphemeralKeypair, vite-plugin nappletType, SPEC.md stale topic strings (completed 2026-04-02)

</details>

### v0.8.0 Shim/SDK Split (In Progress)

**Milestone Goal:** Split `@napplet/shim` into a pure window-installer shim and a new `@napplet/sdk` convenience package, with a fully namespaced `window.napplet` API.

- [x] **Phase 41: Shim Restructure** - Reorganize @napplet/shim into a pure window installer with namespaced window.napplet API and zero named exports (completed 2026-04-02)
- [x] **Phase 42: SDK Package** - Create @napplet/sdk as a standalone bundler-friendly package wrapping window.napplet (completed 2026-04-02)
- [x] **Phase 43: Demo & Test Migration** - Update demo napplets and test suite for new window.napplet API shape (completed 2026-04-02)
- [ ] **Phase 44: Documentation** - Update SPEC.md and READMEs for shim/SDK split

## Phase Details

### Phase 41: Shim Restructure
**Goal**: Developers importing @napplet/shim get a side-effect-only module that installs a fully namespaced window.napplet global with zero named exports
**Depends on**: Phase 40
**Requirements**: PKG-01, WIN-01, WIN-02, WIN-03, WIN-04, DEP-01, DEP-02
**Success Criteria** (what must be TRUE):
  1. `import '@napplet/shim'` installs `window.napplet` with `relay`, `ipc`, `services`, and `storage` sub-objects -- no named exports available
  2. `window.napplet.relay.subscribe()`, `.publish()`, `.query()` work with existing call signatures
  3. `window.napplet.ipc.emit()` and `.on()` deliver inter-pane messages through the shell
  4. `window.napplet.services.list()` returns registered services and `.has()` checks by name/version
  5. `window.napplet.storage.getItem()`, `.setItem()`, `.removeItem()`, `.keys()` proxy to shell-scoped storage
**Plans**: TBD

### Phase 42: SDK Package
**Goal**: Bundler-consuming developers can `import { relay, ipc } from '@napplet/sdk'` and get typed wrappers around window.napplet without depending on the shim
**Depends on**: Phase 41
**Requirements**: PKG-02, PKG-03, SDK-01, SDK-02, SDK-03
**Success Criteria** (what must be TRUE):
  1. `@napplet/sdk` exists as a workspace package with its own package.json, tsup.config.ts, and tsconfig.json
  2. `import { relay, ipc, services, storage } from '@napplet/sdk'` produces objects that delegate to `window.napplet.*` at call time
  3. `import * as napplet from '@napplet/sdk'` produces an object structurally identical to `window.napplet`
  4. `@napplet/sdk` has no dependency on `@napplet/shim` in its package.json -- the two packages are independent siblings
  5. All public protocol types (`NostrEvent`, `NostrFilter`, `ServiceInfo`, `Subscription`, `EventTemplate`) are re-exported from `@napplet/sdk`
**Plans**: 2 (1 wave)

### Phase 43: Demo & Test Migration
**Goal**: All demo napplets and tests exercise the new namespaced window.napplet API, confirming the restructure works end-to-end in a real browser
**Depends on**: Phase 42
**Requirements**: ECO-01, ECO-02
**Success Criteria** (what must be TRUE):
  1. Demo Chat and Bot napplets use `window.napplet.relay.*`, `window.napplet.ipc.*`, and `window.napplet.storage.*` with no references to old top-level shim exports
  2. All Playwright e2e tests pass against the new window.napplet API shape
  3. All Vitest unit/integration tests pass with the restructured shim
**Plans**: 3 (2 waves)
**UI hint**: yes

### Phase 44: Documentation
**Goal**: Developers reading the spec, shim README, and SDK README understand the new window.napplet shape, when to use shim vs SDK, and how to migrate
**Depends on**: Phase 43
**Requirements**: ECO-03, ECO-04, ECO-05
**Success Criteria** (what must be TRUE):
  1. SPEC.md documents the namespaced `window.napplet` shape with `relay`, `ipc`, `services`, `storage` sub-objects
  2. `@napplet/shim` README explains it is a side-effect-only window installer, documents `window.napplet.*` shape, and notes zero named exports
  3. `@napplet/sdk` README explains namespaced exports, usage with and without a bundler, and its relationship to the shim
**Plans**: 3 (1 wave)

## Progress

**Execution Order:**
Phases execute in numeric order: 41 -> 42 -> 43 -> 44

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
| 28. Architecture Topology View | v0.6.0 | 2/2 | Complete | 2026-04-01 |
| 29. Node Detail & Drill-Down | v0.6.0 | 2/3 | Complete | 2026-04-01 |
| 30. Notification Service UX | v0.6.0 | 3/3 | Complete | 2026-04-01 |
| 31. Signer Connection UX | v0.6.0 | 3/3 | Complete | 2026-04-01 |
| 32. Fix Demo UI/UX Bugs | v0.6.0 | 5/5 | Complete | 2026-04-01 |
| 33. Polish Demo UI Layout | v0.6.0 | 4/5 | Complete | 2026-04-01 |
| 34. Terminology Rename | v0.7.0 | 5/5 | Complete | 2026-04-01 |
| 35. Wire Protocol Rename | v0.7.0 | 3/3 | Complete | 2026-04-01 |
| 36. Type Correctness | v0.7.0 | 2/2 | Complete | 2026-04-01 |
| 37. API Alignment | v0.7.0 | 1/1 | Complete | 2026-04-01 |
| 38. Session Vocabulary | v0.7.0 | 2/2 | Complete | 2026-04-01 |
| 39. Documentation Pass | v0.7.0 | 1/1 | Complete | 2026-04-01 |
| 40. Remaining Rename Gaps | v0.7.0 | 2/2 | Complete | 2026-04-02 |
| 41. Shim Restructure | v0.8.0 | 2/2 | Complete    | 2026-04-02 |
| 42. SDK Package | v0.8.0 | 2/2 | Complete    | 2026-04-02 |
| 43. Demo & Test Migration | v0.8.0 | 3/3 | Complete   | 2026-04-02 |
| 44. Documentation | v0.8.0 | 0/3 | Planned | - |
