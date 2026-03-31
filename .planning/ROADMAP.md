# Roadmap: Napplet Protocol SDK

## Milestones

- ✅ **v0.1.0 Alpha** — Phases 1-6 (shipped 2026-03-30) — [Archive](milestones/v0.1.0-ROADMAP.md)
- ✅ **v0.2.0 Shell Architecture Cleanup** — Phases 7-11 (shipped 2026-03-31) — [Archive](milestones/v0.2.0-ROADMAP.md)
- ✅ **v0.3.0 Runtime and Core** — Phases 12-17 (shipped 2026-03-31) — [Archive](milestones/v0.3.0-ROADMAP.md)
- ✅ **v0.4.0 Feature Negotiation & Service Discovery** — Phases 18-22.1 (shipped 2026-03-31) — [Archive](milestones/v0.4.0-ROADMAP.md)
- 🔄 **v0.5.0 Documentation & Developer Skills** — Phases 23-26 (in progress)

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

### v0.5.0 Documentation & Developer Skills (Phases 23-26)

- [x] **Phase 23: New Package READMEs** - Create READMEs for the four new packages: @napplet/acl, @napplet/core, @napplet/runtime, @napplet/services
- [x] **Phase 24: Root and Interface READMEs** - Update root README and existing package READMEs: shim, shell, vite-plugin to reflect v0.4.0 reality
- [x] **Phase 25: SPEC.md Updates** - Update SPEC.md Section 11, rename legacy identifiers, and document the requires/compat protocol (completed 2026-03-31)
- [ ] **Phase 26: Skills Directory** - Create agentskills.io-format skill files: build-napplet, integrate-shell, add-service

## Phase Details

### Phase 23: New Package READMEs
**Goal**: Developers can understand and use @napplet/acl, @napplet/core, @napplet/runtime, and @napplet/services by reading their package READMEs alone
**Depends on**: Nothing (documentation work, no code dependencies)
**Requirements**: README-05, README-06, README-07, README-08
**Success Criteria** (what must be TRUE):
  1. `packages/acl/README.md` exists and documents `AclState`, `AclEntry`, `check()`, and all capability bits with a code example
  2. `packages/core/README.md` exists and documents `NostrEvent`, `NostrFilter`, `BusKind`, `ServiceDescriptor`, and topic constants
  3. `packages/runtime/README.md` exists and documents `createRuntime()`, `RuntimeHooks`, `ServiceHandler`, `ServiceRegistry`, and the kind 29010 discovery protocol
  4. `packages/services/README.md` exists and documents `createAudioService()` and `createNotificationService()` with usage examples showing `handleMessage` wiring
**Plans**: TBD

### Phase 24: Root and Interface READMEs
**Goal**: The root README and the three pre-existing package READMEs accurately describe the 7-package v0.4.0 SDK — no stale API names, no missing packages
**Depends on**: Phase 23
**Requirements**: README-01, README-02, README-03, README-04
**Success Criteria** (what must be TRUE):
  1. Root `README.md` lists all 7 packages (`@napplet/shim`, `@napplet/shell`, `@napplet/acl`, `@napplet/core`, `@napplet/runtime`, `@napplet/services`, `@napplet/vite-plugin`) with correct descriptions and an architecture diagram
  2. `packages/shim/README.md` documents `nappStorage`, `window.napplet`, and the service discovery API (`discoverServices`, `hasService`, `hasServiceVersion`) — no outdated references remain
  3. `packages/shell/README.md` documents `createShellBridge(hooks)`, the `RuntimeHooks` interface, service registry wiring, and the correct package dependency order
  4. `packages/vite-plugin/README.md` documents the `requires` tags injection behavior and reflects v0.4.0 vite-plugin output
**Plans**: TBD
**UI hint**: no

### Phase 25: SPEC.md Updates
**Goal**: SPEC.md accurately describes the protocol as implemented in v0.4.0 — correct naming, correct Section 11, and requires/compat protocol documented
**Depends on**: Nothing (can be done in parallel with 23-24 but logically follows)
**Requirements**: SPEC-01, SPEC-02, SPEC-03
**Success Criteria** (what must be TRUE):
  1. Section 11 of SPEC.md matches the implemented kind 29010 protocol: `s`/`v`/`d` tag structure, sentinel pubkey/sig, live subscription behavior, and empty-registry → immediate EOSE behavior
  2. All occurrences of `PseudoRelay`, `createPseudoRelay`, and `PSEUDO_RELAY_URI` in SPEC.md are replaced with `ShellBridge`, `createShellBridge`, and `SHELL_BRIDGE_URI`
  3. SPEC.md contains a section documenting manifest `requires` tags, the `CompatibilityReport` structure, strict vs. permissive mode behavior, and undeclared service consent flow
**Plans**: TBD

### Phase 26: Skills Directory
**Goal**: Agents and developers can pull portable skill files to reliably build with napplet without reading the full spec or source code
**Depends on**: Phase 23, Phase 24, Phase 25
**Requirements**: SKILL-01, SKILL-02, SKILL-03
**Success Criteria** (what must be TRUE):
  1. `skills/build-napplet/SKILL.md` exists with valid agentskills.io YAML frontmatter (`name`, `description`) and covers subscribe, publish, nappStorage, window.nostr proxy, and `discoverServices`/`hasService`
  2. `skills/integrate-shell/SKILL.md` exists with valid agentskills.io YAML frontmatter and covers `createShellBridge(hooks)`, full `RuntimeHooks` implementation, iframe setup, consent handling, and service registration
  3. `skills/add-service/SKILL.md` exists with valid agentskills.io YAML frontmatter and covers writing a `ServiceHandler` (`handleMessage`, `onWindowDestroyed`), defining a `ServiceDescriptor`, and wiring into `RuntimeHooks.services`
**Plans**: TBD

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
| 24. Root and Interface READMEs | v0.5.0 | 0/TBD | Not started | - |
| 25. SPEC.md Updates | v0.5.0 | 1/1 | Complete    | 2026-03-31 |
| 26. Skills Directory | v0.5.0 | 0/TBD | Not started | - |
