# Roadmap: Napplet Protocol SDK

## Milestones

- ✅ **v0.1.0 Alpha** — Phases 1-6 (shipped 2026-03-30) — [Archive](milestones/v0.1.0-ROADMAP.md)
- ✅ **v0.2.0 Shell Architecture Cleanup** — Phases 7-11 (shipped 2026-03-31) — [Archive](milestones/v0.2.0-ROADMAP.md)
- ✅ **v0.3.0 Runtime and Core** — Phases 12-17 (shipped 2026-03-31) — [Archive](milestones/v0.3.0-ROADMAP.md)
- ✅ **v0.4.0 Feature Negotiation & Service Discovery** — Phases 18-22.1 (shipped 2026-03-31) — [Archive](milestones/v0.4.0-ROADMAP.md)

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
