# Roadmap: Napplet Protocol SDK

## Milestones

- ✅ **v0.1.0 Alpha** — Phases 1-6 (shipped 2026-03-30) — [Archive](milestones/v0.1.0-ROADMAP.md)
- ✅ **v0.2.0 Shell Architecture Cleanup** — Phases 7-11 (shipped 2026-03-31) — [Archive](milestones/v0.2.0-ROADMAP.md)
- ✅ **v0.3.0 Runtime and Core** — Phases 12-17 (shipped 2026-03-31) — [Archive](milestones/v0.3.0-ROADMAP.md)
- **v0.4.0 Feature Negotiation & Service Discovery** — Phases 18-22 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>v0.1.0 Alpha (Phases 1-6) - SHIPPED 2026-03-30</summary>

- [x] **Phase 1: Wiring Fixes** - Fix extraction breakage so packages work end-to-end
- [x] **Phase 2: Test Infrastructure** - Playwright e2e framework for protocol conformance
- [x] **Phase 3: Core Protocol Tests** - AUTH, routing, lifecycle, replay detection tests
- [x] **Phase 4: Capability Tests** - ACL, storage, signer, inter-pane tests
- [x] **Phase 5: Demo Playground** - Interactive Chat + Bot demo with protocol debugger
- [x] **Phase 6: Specification and Publish** - Refine NIP-5A spec and validate packages

</details>

<details>
<summary>v0.2.0 Shell Architecture Cleanup (Phases 7-11) - SHIPPED 2026-03-31</summary>

- [x] **Phase 7: Nomenclature** - Rename PseudoRelay to ShellBridge across all packages
- [x] **Phase 8: ACL Pure Module** - Extract @napplet/acl as zero-dep pure module
- [x] **Phase 9: ACL Enforcement Gate** - Single enforce() gate in ShellBridge
- [x] **Phase 10: ACL Behavioral Tests** - Full capability x action matrix tests
- [x] **Phase 11: Shell Code Cleanup** - Verb-noun naming, JSDoc, clean internals

</details>

<details>
<summary>v0.3.0 Runtime and Core (Phases 12-17) - SHIPPED 2026-03-31</summary>

- [x] **Phase 12: Core Package** - Extract shared protocol types, constants, and message definitions into @napplet/core
- [x] **Phase 13: Runtime Package** - Extract protocol engine into @napplet/runtime
- [x] **Phase 14: Shell Adapter and Shim Rewire** - Slim shell to browser adapter over runtime; switch shim to core imports
- [x] **Phase 15: Service Extension Design** - Define RuntimeHooks.services interface and reserve kind 29010
- [x] **Phase 16: Verification** - Full test suite green with new structure
- [x] **Phase 17: Shell Export Cleanup** - Remove dead exports, deduplicate enforce, clean singletons

</details>

### v0.4.0 Feature Negotiation & Service Discovery (In Progress)

- [x] **Phase 18: Core Types & Runtime Dispatch** - ServiceDescriptor in core, ServiceHandler/ServiceRegistry in runtime, topic-prefix routing (3 plans)
- [x] **Phase 19: Service Discovery Protocol** - Kind 29010 REQ/EVENT/EOSE synthetic response flow (completed 2026-03-31)
- [x] **Phase 20: Concrete Services** - Audio service (first proof), notification service (generalization proof), core infrastructure as services (completed 2026-03-31)
- [x] **Phase 21: Shim Discovery API** - discoverServices(), hasService(), hasServiceVersion() on window global (completed 2026-03-31)
- [x] **Phase 22: Negotiation & Compatibility** - Manifest requires tags, compatibility reporting, strict/permissive mode, undeclared usage consent (completed 2026-03-31)

## Phase Details

### Phase 18: Core Types & Runtime Dispatch
**Goal**: The runtime can register service handlers and route INTER_PANE events to the correct handler by topic prefix — the service dispatch backbone exists
**Depends on**: Phase 17
**Requirements**: CORE-01, CORE-02, CORE-03, DISP-01, DISP-02, DISP-03
**Success Criteria** (what must be TRUE):
  1. `import { ServiceDescriptor } from '@napplet/core'` works in shim, runtime, and shell packages
  2. An inline semver utility in @napplet/core resolves caret (^1.0.0), gte (>=1.0.0), and exact (1.0.0) ranges without external dependencies
  3. A shell host can pass a services registry via RuntimeHooks and the runtime routes INTER_PANE events to the matching ServiceHandler based on topic prefix (e.g., `audio:play` routes to the audio handler)
  4. When a napplet window is torn down, the runtime calls ServiceHandler.onWindowDestroyed() for every registered handler so per-window state is cleaned up
**Plans**: 18-01 (core types, wave 1), 18-02 (runtime dispatch, wave 2), 18-03 (shell migration, wave 2)

### Phase 19: Service Discovery Protocol
**Goal**: A napplet can send a kind 29010 REQ and receive one EVENT per registered service followed by EOSE — the runtime synthesizes discovery responses from its registry
**Depends on**: Phase 18
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04
**Success Criteria** (what must be TRUE):
  1. When a napplet sends a REQ filtering for kind 29010, the runtime responds with one synthetic EVENT per registered service containing s (name), v (version), and optional d (description) tags
  2. A shell with no registered services responds with EOSE immediately and zero EVENTs
  3. Both core infrastructure services (relay pool, cache) and optional services (audio, notifications) appear in the same discovery response — napplets see a unified list
**Plans**: 19-01 (discovery logic, wave 1), 19-02 (tests, wave 2)

### Phase 20: Concrete Services
**Goal**: Audio and notification services prove the ServiceHandler pattern works end-to-end — audio wraps the existing audio-manager, notifications generalize the pattern, core infrastructure is discoverable
**Depends on**: Phase 19
**Requirements**: SVC-01, SVC-02, SVC-03, SVC-04
**Success Criteria** (what must be TRUE):
  1. A napplet can send `audio:play` topic events and hear sound — the audio service wraps existing audio-manager as a ServiceHandler with name/version/description descriptor
  2. Both `audio:*` (new convention) and `shell:audio-*` (legacy) topic prefixes reach the audio handler — existing hyprgate napplets do not break
  3. A notification service exists as a second ServiceHandler, proving the pattern generalizes beyond a single service
  4. Core infrastructure (relay pool, cache) appears in discovery responses with proper descriptors — infrastructure is a service, not a special case
**Plans**: TBD

### Phase 21: Shim Discovery API
**Goal**: Napplet code can query available services and check version compatibility through a typed API on the window global
**Depends on**: Phase 19
**Requirements**: SHIM-01, SHIM-02, SHIM-03, SHIM-04
**Success Criteria** (what must be TRUE):
  1. A napplet can call `discoverServices()` and receive a typed array of ServiceInfo objects describing available services
  2. A napplet can call `hasService('audio')` and get a boolean indicating whether the service is registered
  3. A napplet can call `hasServiceVersion('audio', '>=1.0.0')` and get a boolean reflecting semver compatibility
  4. The discovery API is accessible on the window global (same access pattern as window.nostr) — no special imports needed in napplet code
**Plans**: TBD

### Phase 22: Negotiation & Compatibility
**Goal**: Napplets declare service dependencies in their manifest, the runtime checks them at load time, and the shell host receives a compatibility report before the napplet starts real work
**Depends on**: Phase 20, Phase 21
**Requirements**: NEG-01, NEG-02, NEG-03, NEG-04, NEG-05, NEG-06, COMPAT-01, COMPAT-02, COMPAT-03
**Success Criteria** (what must be TRUE):
  1. A napplet manifest can declare `["requires", "audio", ">=1.0.0"]` tags and the vite-plugin injects them at build time
  2. At napplet load time, the runtime reads manifest requires tags, checks them against the ServiceRegistry, and raises an onCompatibilityIssue hook with a CompatibilityReport (available/missing/incompatible services, compatible boolean)
  3. In strict mode, a napplet requiring a missing service is blocked from loading — the shell host receives the report and the napplet never starts
  4. In permissive mode (default), a napplet requiring a missing service loads with a warning — the shell host receives the report and decides UX
  5. When a napplet uses a service it did not declare in its manifest, the runtime raises a consent-style warning (reusing the ConsentRequest pattern from destructive signing kinds)
**Plans**: 22-01 (vite plugin requires, wave 1), 22-02 (runtime types, wave 1), 22-03 (compatibility check, wave 2), 22-04 (undeclared consent, wave 2)

## Progress

**Execution Order:**
Phases execute in numeric order: 18 -> 19 -> 20 -> 21 -> 22
(Phase 20 and Phase 21 can execute in parallel after Phase 19)

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
| 13. Runtime Package | v0.3.0 | 0/5 | Complete | 2026-03-31 |
| 14. Shell Adapter and Shim Rewire | v0.3.0 | 0/0 | Complete | 2026-03-31 |
| 15. Service Extension Design | v0.3.0 | 2/2 | Complete | 2026-03-31 |
| 16. Verification | v0.3.0 | 0/4 | Complete | 2026-03-31 |
| 17. Shell Export Cleanup | v0.3.0 | 1/1 | Complete | 2026-03-31 |
| 18. Core Types & Runtime Dispatch | v0.4.0 | 3/3 | Complete | 2026-03-31 |
| 19. Service Discovery Protocol | v0.4.0 | 0/2 | Complete    | 2026-03-31 |
| 20. Concrete Services | v0.4.0 | 4/4 | Complete    | 2026-03-31 |
| 21. Shim Discovery API | v0.4.0 | 2/2 | Complete    | 2026-03-31 |
| 22. Negotiation & Compatibility | v0.4.0 | 4/4 | Complete    | 2026-03-31 |
| 22.1. Core Infrastructure Services | v0.4.0 | 0/4 | Planned | - |

### Phase 22.1: Core Infrastructure Services (INSERTED)

**Goal:** Migrate relay pool, cache, and signer from hardcoded RuntimeHooks interfaces to registered services — completing the unified service model where all capabilities are discoverable and pluggable
**Requirements**: SVC-04 (moved from Phase 20)
**Depends on:** Phase 19 (service dispatch must exist), Phase 20 (pattern proven with audio/notifications)
**Plans:** 4/4 plans complete

Plans:
- [ ] 22.1-01 — Signer service: extract handleSignerRequest as ServiceHandler (wave 1)
- [ ] 22.1-02 — Relay pool and cache services: individual ServiceHandler implementations (wave 2)
- [ ] 22.1-03 — Coordinated relay helper: createCoordinatedRelay composite service (wave 2)
- [ ] 22.1-04 — Runtime migration: service dispatch for signer, relay, cache (wave 3)
