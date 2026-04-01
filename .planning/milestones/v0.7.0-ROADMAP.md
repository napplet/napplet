# Roadmap: Napplet Protocol SDK

## Milestones

- ✅ **v0.1.0 Alpha** — Phases 1-6 (shipped 2026-03-30) — [Archive](milestones/v0.1.0-ROADMAP.md)
- ✅ **v0.2.0 Shell Architecture Cleanup** — Phases 7-11 (shipped 2026-03-31) — [Archive](milestones/v0.2.0-ROADMAP.md)
- ✅ **v0.3.0 Runtime and Core** — Phases 12-17 (shipped 2026-03-31) — [Archive](milestones/v0.3.0-ROADMAP.md)
- ✅ **v0.4.0 Feature Negotiation & Service Discovery** — Phases 18-22.1 (shipped 2026-03-31) — [Archive](milestones/v0.4.0-ROADMAP.md)
- ✅ **v0.5.0 Documentation & Developer Skills** — Phases 23-26 (shipped 2026-04-01) — [Archive](milestones/v0.5.0-ROADMAP.md)
- ✅ **v0.6.0 Demo Upgrade** — Phases 27-33 (shipped 2026-04-01) — [Archive](milestones/v0.6.0-ROADMAP.md)
- **v0.7.0 Ontology Audit and Adjustments** — Phases 34-39 (in progress)

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

### v0.7.0 Ontology Audit and Adjustments

- [ ] **Phase 34: Terminology Rename** - Rename all napp* identifiers, types, topics, meta tags, localStorage prefix, and docs to napplet* across all 7 packages
- [x] **Phase 35: Wire Protocol Rename** - Rename BusKind.INTER_PANE to BusKind.IPC_PEER and update all 30+ call sites plus SPEC.md
- [x] **Phase 36: Type Correctness** - Consolidate ConsentRequest to runtime canonical definition and remove shell/state-proxy.ts dead code (completed 2026-04-01)
- [x] **Phase 37: API Alignment** - Rename RuntimeHooks/ShellHooks to RuntimeAdapter/ShellAdapter with deprecated aliases for one release cycle (completed 2026-04-01)
- [x] **Phase 38: Session Vocabulary** - Rename NappKeyEntry/NappKeyRegistry to SessionEntry/SessionRegistry and fix loadOrCreateKeypair (completed 2026-04-01)
- [x] **Phase 39: Documentation Pass** - Document topic prefix direction semantics and mark nappStorage as deprecated (completed 2026-04-01)
- [x] **Phase 40: Remaining Rename Gaps** - Close audit gaps: rename createEphemeralKeypair, vite-plugin nappletType, and SPEC.md stale topic strings (closes SESS-03, TERM-01, TERM-04, WIRE-02) (completed 2026-04-01)

## Phase Details

### Phase 34: Terminology Rename
**Goal**: Eliminate the napp/napplet semantic collision so the codebase uses "napplet" consistently and "napp" never appears where "napplet" is meant
**Depends on**: Nothing (first phase in milestone)
**Requirements**: TERM-01, TERM-02, TERM-03, TERM-04, TERM-05
**Success Criteria** (what must be TRUE):
  1. `grep -r 'napp[^l]' packages/` returns zero hits in production TypeScript (excluding node_modules and dist)
  2. `pnpm type-check` passes across all 7 packages with zero errors
  3. All existing tests pass (193+ Playwright e2e + vitest unit/integration)
  4. The `napplet-state:` localStorage prefix is active with a dual-read fallback to `napp-state:` for migration
  5. SPEC.md, READMEs, and skills files contain no stale "napp" references where "napplet" is intended
**Plans**: TBD

### Phase 35: Wire Protocol Rename
**Goal**: Replace the UI-topology term INTER_PANE with the protocol-semantic IPC_PEER across all packages and documentation
**Depends on**: Phase 34
**Requirements**: WIRE-01, WIRE-02
**Success Criteria** (what must be TRUE):
  1. `grep -r 'INTER.PANE\|INTER_PANE\|inter.pane' packages/` returns zero hits (excluding node_modules and dist)
  2. `pnpm type-check` passes across all 7 packages
  3. All existing tests pass
  4. SPEC.md documents the `IPC-*` namespace convention and lists `IPC-PEER` as the current member with `IPC-BROADCAST` and `IPC-CHANNEL` as reserved future members
**Plans**: TBD

### Phase 36: Type Correctness
**Goal**: Eliminate duplicate type definitions between shell and runtime so each protocol type has exactly one canonical source
**Depends on**: Phase 35
**Requirements**: TYPE-01, TYPE-02
**Success Criteria** (what must be TRUE):
  1. `ConsentRequest` is defined only in `@napplet/runtime`, includes the `type` discriminator field, and `@napplet/shell` re-exports it
  2. `shell/state-proxy.ts` is confirmed dead code and removed, or if still imported, routed through runtime
  3. `pnpm type-check` passes and all tests pass after the changes
**Plans**: TBD

### Phase 37: API Alignment
**Goal**: Rename the public *Hooks interfaces to *Adapter to match established SDK conventions, with deprecated aliases shipping for one release cycle
**Depends on**: Phase 36
**Requirements**: API-01, API-02, API-03
**Success Criteria** (what must be TRUE):
  1. `RuntimeAdapter` and `ShellAdapter` are the canonical interface names; `RuntimeHooks` and `ShellHooks` exist as `@deprecated` type aliases
  2. Nested sub-interfaces use unprefixed names (`RelayPoolAdapter`, `AuthAdapter`, `CacheAdapter`, `CryptoAdapter` instead of `RuntimeRelayPoolHooks`, etc.)
  3. `pnpm type-check` passes and all tests pass
  4. Deprecation schedule is documented (removal in v0.9.0)
**Plans**: TBD

### Phase 38: Session Vocabulary
**Goal**: Rename session management types to reflect their purpose (session lifecycle) rather than their owner (napp/napplet)
**Depends on**: Phase 34, Phase 37
**Requirements**: SESS-01, SESS-02, SESS-03
**Success Criteria** (what must be TRUE):
  1. `SessionEntry` and `SessionRegistry` are the canonical type names (no `NappKeyEntry` or `NappletKeyEntry` references remain in production code)
  2. `createEphemeralKeypair()` is the function name with no parameters; `loadOrCreateKeypair` no longer exists
  3. `pnpm type-check` passes and all tests pass
**Plans**: TBD

### Phase 39: Documentation Pass
**Goal**: Document the implicit protocol conventions that new contributors and agents need to understand
**Depends on**: Phase 34, Phase 38
**Requirements**: DOC-01, DOC-02
**Success Criteria** (what must be TRUE):
  1. `core/topics.ts` has JSDoc explaining direction semantics: `shell:*` = napplet-to-shell, `napplet:*` = shell-to-napplet, `{service}:*` = bidirectional
  2. `nappStorage` in shim has `@deprecated` JSDoc pointing to `nappletState` as canonical, with v0.9.0 removal target noted
  3. `pnpm type-check` passes (JSDoc must not break builds)
**Plans**: TBD

### Phase 40: Remaining Rename Gaps
**Goal**: Close the three audit gaps left from Phases 34, 35, and 38 — finish the ontology rename so all v0.7.0 requirements are fully satisfied
**Depends on**: Phase 38, Phase 39
**Requirements**: SESS-03, TERM-01, TERM-04, WIRE-02
**Gap Closure**: Closes gaps from v0.7.0 milestone audit (2026-04-01)
**Plans:** 2/2 plans complete
Plans:
- [x] 40-01-PLAN.md — Rename loadOrCreateKeypair to createEphemeralKeypair and nappType to nappletType in TypeScript
- [x] 40-02-PLAN.md — Fix stale napp: topic strings in SPEC.md, READMEs, and skills files
**Success Criteria** (what must be TRUE):
  1. `createEphemeralKeypair()` is the sole function name in `packages/shim/src/napplet-keypair.ts`; `loadOrCreateKeypair` returns zero hits across all packages
  2. `Nip5aManifestOptions.nappletType` is the public API field name in `packages/vite-plugin/src/index.ts`; `nappType` returns zero hits in that file
  3. SPEC.md contains no `napp:state-response`, `napp:audio-muted`, or `napp-state:` strings — only `napplet:` prefixes remain
  4. `pnpm type-check` passes across all packages with zero errors

## Progress

**Execution Order:**
Phases execute in numeric order: 34 -> 35 -> 36 -> 37 -> 38 -> 39

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
| 34. Terminology Rename | v0.7.0 | 0/0 | Not started | - |
| 35. Wire Protocol Rename | v0.7.0 | 0/0 | Not started | - |
| 36. Type Correctness | v0.7.0 | 0/0 | Complete    | 2026-04-01 |
| 37. API Alignment | v0.7.0 | 1/1 | Complete    | 2026-04-01 |
| 38. Session Vocabulary | v0.7.0 | 2/2 | Complete    | 2026-04-01 |
| 39. Documentation Pass | v0.7.0 | 0/0 | Not started | - |
| 40. Remaining Rename Gaps | v0.7.0 | 2/2 | Complete    | 2026-04-01 |
