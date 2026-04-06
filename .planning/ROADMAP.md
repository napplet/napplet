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
- **v0.13.0 Runtime Decoupling & Publish** — Phases 62-67 (in progress)

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

### v0.13.0 Runtime Decoupling & Publish (Phases 62-67)

**Milestone Goal:** Extract runtime/shell/acl/services/demo into @kehto org (fresh repo at ~/Develop/kehto), clean up @napplet to 4 packages (core, shim, sdk, vite-plugin), and publish @napplet to npm.

- [x] **Phase 62: Kehto Repo Scaffold** - Initialize ~/Develop/kehto as pnpm monorepo with package shells and GSD seed (completed 2026-04-06)
- [x] **Phase 63: Package Migration** - Copy source from @napplet, rewrite imports to @kehto/*, build and type-check green (completed 2026-04-06)
- [x] **Phase 64: Demo & Test Migration** - Demo playground and test suite running in kehto against @kehto packages (completed 2026-04-06)
- [x] **Phase 65: Napplet Cleanup** - Remove extracted packages and demo from @napplet, reconfigure for 4-package monorepo (completed 2026-04-06)
- [x] **Phase 66: Publish Pipeline & Release** - GitHub Actions CI/CD and npm publish for @napplet packages (completed 2026-04-06)
- [ ] **Phase 67: Cross-Repo Wiring & Docs** - Switch kehto to npm @napplet/core dependency, update all READMEs

## Phase Details

### Phase 62: Kehto Repo Scaffold
**Goal**: Kehto exists as a buildable monorepo with the right package structure and GSD planning context
**Depends on**: Nothing (fresh repo)
**Requirements**: KEHTO-01, KEHTO-02, KEHTO-08
**Success Criteria** (what must be TRUE):
  1. ~/Develop/kehto is a git repo with pnpm workspaces, turborepo, tsconfig, and ESM-only configuration
  2. @kehto/acl, @kehto/runtime, @kehto/shell, @kehto/services package directories exist with valid package.json files
  3. PROJECT.md and .planning/ directory are seeded with enough context for future /gsd:new-project
**Plans**: 2 plans
Plans:
- [x] 62-01-PLAN.md — Initialize monorepo root config and four @kehto package shells
- [x] 62-02-PLAN.md — Seed CLAUDE.md and .planning/ GSD context

### Phase 63: Package Migration
**Goal**: All four kehto packages contain the migrated source and build cleanly
**Depends on**: Phase 62
**Requirements**: KEHTO-03, KEHTO-07
**Success Criteria** (what must be TRUE):
  1. Source files from @napplet/{acl,runtime,shell,services} are present in @kehto/{acl,runtime,shell,services} with all internal cross-references updated to @kehto/* imports
  2. @napplet/core is consumed as a workspace-linked dependency (switched to npm in Phase 67)
  3. `pnpm build` and `pnpm type-check` succeed with zero errors across all four kehto packages
**Plans**: 2 plans
Plans:
- [x] 63-01-PLAN.md — Link @napplet/core, migrate @kehto/acl and @kehto/runtime source
- [x] 63-02-PLAN.md — Migrate @kehto/shell and @kehto/services source, verify full monorepo

### Phase 64: Demo & Test Migration
**Goal**: The demo playground runs and tests pass in the kehto repo, proving the extracted packages work end-to-end
**Depends on**: Phase 63
**Requirements**: KEHTO-05, KEHTO-06
**Success Criteria** (what must be TRUE):
  1. Demo playground launches in kehto and loads napplets that complete AUTH handshake and exchange messages through @kehto packages
  2. Relevant Playwright e2e and Vitest tests are copied to kehto and pass against @kehto packages
  3. Protocol behavior (AUTH, relay routing, ACL, storage, IPC, services) is identical to what the tests verified in @napplet
**Plans**: 3 plans
Plans:
- [x] 64-01-PLAN.md — Copy demo playground, rewrite shell-side imports to @kehto/*, build
- [x] 64-02-PLAN.md — Copy unit tests, create vitest config with @kehto/* aliases, verify passing
- [x] 64-03-PLAN.md — Copy e2e infrastructure and Playwright tests, verify protocol conformance + visual checkpoint

### Phase 65: Napplet Cleanup
**Goal**: The @napplet monorepo contains only the 4 portable SDK packages and builds cleanly
**Depends on**: Phase 64
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04
**Success Criteria** (what must be TRUE):
  1. packages/acl, packages/runtime, packages/shell, packages/services, and demo/ are deleted from @napplet
  2. pnpm workspace, turbo.json, and root tsconfig reference only core, shim, sdk, and vite-plugin
  3. `pnpm build` and `pnpm type-check` succeed with the 4-package monorepo (no dangling references)
**Plans**: 1 plan
Plans:
- [x] 65-01-PLAN.md — Delete extracted packages/demo/tests, update configs, verify clean build

### Phase 66: Publish Pipeline & Release
**Goal**: @napplet packages are published to npm with automated CI/CD
**Depends on**: Phase 65
**Requirements**: PUB-01, PUB-02, PUB-03, PUB-04
**Success Criteria** (what must be TRUE):
  1. GitHub Actions runs type-check and build on every PR to @napplet
  2. Changesets workflow versions and publishes @napplet/{core,shim,sdk,vite-plugin} to npm on merge to main
  3. All four packages are live on npm and installable via `npm install @napplet/core`
**Plans**: 2 plans
Plans:
- [x] 66-01-PLAN.md — CI/publish workflows, changeset cleanup, version normalization
- [ ] 66-02-PLAN.md — Human npm auth setup, initial changeset, first publish + verification

### Phase 67: Cross-Repo Wiring & Docs
**Goal**: Kehto consumes @napplet/core from npm (not workspace link) and all documentation reflects the split
**Depends on**: Phase 66
**Requirements**: KEHTO-04, DOC-01, DOC-02
**Success Criteria** (what must be TRUE):
  1. @kehto packages declare @napplet/core as a peer dependency resolved from npm (not a workspace link)
  2. `pnpm build` in kehto succeeds with npm-sourced @napplet/core
  3. Root README in @napplet describes the 4-package SDK and cross-references @kehto for runtime/shell needs
  4. Package READMEs for core, shim, sdk, and vite-plugin direct users to @kehto for runtime integration
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 62 → 63 → 64 → 65 → 66 → 67

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 62. Kehto Repo Scaffold | 2/2 | Complete    | 2026-04-06 |
| 63. Package Migration | 2/2 | Complete    | 2026-04-06 |
| 64. Demo & Test Migration | 3/3 | Complete    | 2026-04-06 |
| 65. Napplet Cleanup | 1/1 | Complete    | 2026-04-06 |
| 66. Publish Pipeline & Release | 1/2 | Complete    | 2026-04-06 |
| 67. Cross-Repo Wiring & Docs | 0/TBD | Not started | - |
