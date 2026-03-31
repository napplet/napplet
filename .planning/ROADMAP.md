# Roadmap: Napplet Protocol SDK

## Milestones

- ✅ **v0.1.0 Alpha** — Phases 1-6 (shipped 2026-03-30) — [Archive](milestones/v0.1.0-ROADMAP.md)
- ✅ **v0.2.0 Shell Architecture Cleanup** — Phases 7-11 (shipped 2026-03-31) — [Archive](milestones/v0.2.0-ROADMAP.md)
- 🚧 **v0.3.0 Runtime and Core** — Phases 12-17 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 12: Core Package** - Extract shared protocol types, constants, and message definitions into @napplet/core (completed 2026-03-31)
- [x] **Phase 13: Runtime Package** - Extract protocol engine (dispatch, enforce, AUTH, subscriptions) into @napplet/runtime (completed 2026-03-31)
- [x] **Phase 14: Shell Adapter and Shim Rewire** - Slim shell to browser adapter over runtime; switch shim to core imports (completed 2026-03-31)
- [x] **Phase 15: Service Extension Design** - Define RuntimeHooks.services interface and reserve service discovery event kind (completed 2026-03-31)
- [x] **Phase 16: Verification** - Full test suite green with new structure; new unit and integration tests (completed 2026-03-31)

## Phase Details

### Phase 12: Core Package
**Goal**: A zero-dependency @napplet/core package exists that all other packages import protocol types and constants from — no duplicate type definitions remain
**Depends on**: Phase 11
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, CORE-09
**Success Criteria** (what must be TRUE):
  1. `import { NostrEvent, NostrFilter } from '@napplet/core'` works in both shell and shim packages
  2. Protocol constants (BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION, DESTRUCTIVE_KINDS) are importable from @napplet/core and deleted from their original locations
  3. Topic constants (shell:state-*, napp:state-response) are importable from @napplet/core
  4. `pnpm build && pnpm type-check` passes across all packages with core as the single source of protocol types
  5. @napplet/core has zero external dependencies (package.json has no dependencies or peerDependencies)
**Plans**:
  - Plan 01 (Wave 1): Create @napplet/core package with protocol types, constants, and topics [CORE-01..06, CORE-09]
  - Plan 02 (Wave 2): Rewire @napplet/shell to import from @napplet/core [CORE-07]
  - Plan 03 (Wave 2): Rewire @napplet/shim to import from @napplet/core [CORE-08]

### Phase 13: Runtime Package
**Goal**: A browser-agnostic @napplet/runtime package owns the full protocol engine — message dispatch, ACL enforcement, AUTH handshake, subscription lifecycle — depending only on @napplet/core and @napplet/acl
**Depends on**: Phase 12
**Requirements**: RT-01, RT-02, RT-03, RT-04, RT-05, RT-06, RT-07, RT-08, RT-09, RT-10, RT-11, RT-12, RT-13
**Success Criteria** (what must be TRUE):
  1. `createRuntime(hooks: RuntimeHooks)` can be called without any DOM or browser globals (no window, document, localStorage references)
  2. The runtime handles all five NIP-01 verbs (EVENT, REQ, CLOSE, COUNT, AUTH) — shell-bridge.ts dispatch logic no longer exists
  3. enforce.ts, napp-key-registry, subscription management, replay detection, and event buffer all live in packages/runtime/src/
  4. RuntimeHooks interface is exported and documented — a non-browser environment could implement it to host napplets
  5. @napplet/runtime depends only on @napplet/core and @napplet/acl (no other runtime dependencies)
**Plans**: 13-01 (scaffold + RuntimeHooks), 13-02 (enforce + registry), 13-03 (ACL state + manifest + replay + buffer), 13-04 (createRuntime factory), 13-05 (build verification)

### Phase 14: Shell Adapter and Shim Rewire
**Goal**: @napplet/shell is a thin browser adapter that delegates to @napplet/runtime; @napplet/shim uses @napplet/core types with no behavioral changes
**Depends on**: Phase 13
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05, SHELL-06, SHELL-07, SHIM-01, SHIM-02, SHIM-03
**Success Criteria** (what must be TRUE):
  1. createShellBridge(hooks) internally calls createRuntime(adaptHooks(hooks)) — shell is an adapter, not an engine
  2. ShellHooks interface is unchanged — existing hyprgate integration code compiles without modification
  3. Browser-specific modules (origin-registry, state-proxy, manifest-cache, audio-manager) remain in shell, not runtime
  4. @napplet/shim has no local protocol type definitions — all types come from @napplet/core
  5. Shim's public API (subscribe, publish, query, emit, on, nappStorage) is unchanged — napplet code compiles without modification
**Plans**: TBD

### Phase 15: Service Extension Design
**Goal**: The RuntimeHooks.services interface is defined and documented so v0.4.0 can implement audio, notifications, and custom services without protocol changes
**Depends on**: Phase 13
**Requirements**: SVC-01, SVC-02, SVC-03
**Success Criteria** (what must be TRUE):
  1. RuntimeHooks has an optional `services` field with a typed interface (not just Record<string, unknown>)
  2. Event kind 29010 is reserved as a constant in @napplet/core for service discovery
  3. SPEC.md contains a "Service Discovery" section describing the message format, even if implementation is deferred
**Plans**: 15-01 (service types + kind constant), 15-02 (SPEC.md documentation)

### Phase 16: Verification
**Goal**: The full test suite passes with the new four-package structure and new packages have their own test coverage
**Depends on**: Phase 14, Phase 15
**Requirements**: TST-01, TST-02, TST-03, TST-04
**Success Criteria** (what must be TRUE):
  1. All 122 existing Playwright e2e tests pass without modification (or with import-path-only changes)
  2. @napplet/core has import verification tests proving types and constants are re-exported correctly
  3. @napplet/runtime has isolated unit tests for message dispatch that run without a browser
  4. An integration test verifies the full chain: shell adapter -> runtime -> acl -> core types
**Plans**: 16-01 (core import verification), 16-02 (runtime dispatch unit tests), 16-03 (shell-runtime-acl-core integration), 16-04 (e2e suite green)

### Phase 17: Shell Export Cleanup
**Goal**: Shell's public API exports only live, tested code — no dead re-exports from pre-runtime refactor, no duplicate modules
**Depends on**: Phase 16
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03
**Gap Closure**: Closes tech debt from v0.3.0-MILESTONE-AUDIT.md (SHELL-04, SHELL-06)
**Success Criteria** (what must be TRUE):
  1. Shell index.ts does not re-export handleStateRequest or cleanupNappState from state-proxy.ts
  2. Shell's createEnforceGate is re-exported from @napplet/runtime, not from a local duplicate enforce.ts
  3. Shell singletons (nappKeyRegistry, aclStore) are either removed from public exports or documented as internal-only
  4. pnpm build && pnpm type-check pass; all 180 tests green
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 12 -> 13 -> 14 -> 15 -> 16 -> 17
(Phase 14 and Phase 15 can execute in parallel after Phase 13)

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
| 12. Core Package | v0.3.0 | 3/3 | Complete   | 2026-03-31 |
| 13. Runtime Package | v0.3.0 | 0/5 | Complete    | 2026-03-31 |
| 14. Shell Adapter and Shim Rewire | v0.3.0 | 0/0 | Complete    | 2026-03-31 |
| 15. Service Extension Design | v0.3.0 | 2/2 | Complete    | 2026-03-31 |
| 16. Verification | v0.3.0 | 0/4 | Complete    | 2026-03-31 |
| 17. Shell Export Cleanup | v0.3.0 | 0/0 | Not started | - |
