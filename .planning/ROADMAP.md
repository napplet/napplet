# Roadmap: Napplet Protocol SDK

## Milestones

- ✅ **v0.1.0 Alpha** — Phases 1-6 (shipped 2026-03-30) — [Archive](milestones/v0.1.0-ROADMAP.md)
- 🚧 **v0.2.0 Shell Architecture Cleanup** — Phases 7-11 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 7: Nomenclature** - Rename pseudo-relay to ShellBridge and complete storage-to-state rename across all packages, tests, spec, and demo
- [ ] **Phase 8: ACL Pure Module** - Extract ACL logic into a standalone, pure, WASM-ready module with zero side effects
- [ ] **Phase 9: ACL Enforcement Gate** - Wire the pure ACL module into ShellBridge as the single enforcement point for all message paths
- [ ] **Phase 10: ACL Behavioral Tests** - Exhaustive capability-by-action test matrix proving every message path respects ACL decisions
- [ ] **Phase 11: Shell Code Cleanup** - Consistent naming, minimal public API, clean internals, and no debug artifacts

## Phase Details

### Phase 7: Nomenclature
**Goal**: All code, tests, spec, and demo use the canonical names (ShellBridge, state) so that new architecture work builds on correct terminology from day one
**Depends on**: Phase 6 (v0.1.0 complete)
**Requirements**: REN-01, REN-02, REN-03, REN-04, REN-05, REN-06, REN-07, REN-08, STA-01, STA-02, STA-03, STA-04
**Success Criteria** (what must be TRUE):
  1. Importing `createShellBridge` from `@napplet/shell` works and `createPseudoRelay` no longer exists anywhere in the codebase
  2. The `ShellBridge` type is used in all type annotations and no `PseudoRelay` type remains
  3. All 66 existing tests pass with the new names (no regressions from rename)
  4. SPEC.md contains zero occurrences of "pseudo-relay" and uses "ShellBridge" throughout
  5. All test capability strings use `state:read`/`state:write` (not `storage:*`) and the test file is named `state-isolation.spec.ts`
**Plans**: 2 plans, 1 wave, 14 tasks total

Plans:
- [x] 07-01: Rename pseudo-relay to ShellBridge (11 tasks, wave 1)
- [x] 07-02: Complete storage-to-state rename in tests (3 tasks, wave 1)

### Phase 8: ACL Pure Module
**Goal**: ACL decisions are computed by a standalone module that has no runtime dependencies, no side effects, and could be compiled to WASM without modification
**Depends on**: Phase 7
**Requirements**: ACL-01, ACL-02, ACL-03, ACL-04, ACL-05, ACL-06
**Success Criteria** (what must be TRUE):
  1. ACL module exports a single `check(identity, capability, action) -> allow | deny` function with no other required entry points
  2. ACL module has zero imports beyond standard library (no DOM APIs, no nostr-tools, no Node.js APIs)
  3. ACL state mutations return new state objects (never mutate in place) and the type system enforces immutability
  4. localStorage persistence is handled by a separate adapter that the ACL module does not import or reference
  5. A developer can describe the ACL module's behavior in under 100 words
**Plans**: 3 plans in 3 waves

Plans:
- [x] 08-01: Package scaffold and types (wave 1)
- [x] 08-02: Pure check and mutation functions (wave 2)
- [x] 08-03: Public API barrel and build verification (wave 3)

### Phase 9: ACL Enforcement Gate
**Goal**: Every message that flows through ShellBridge passes through exactly one enforcement function -- no message reaches a napplet iframe or exits to a relay without an ACL check
**Depends on**: Phase 8
**Requirements**: ENF-01, ENF-02, ENF-03, ENF-04, ENF-05
**Success Criteria** (what must be TRUE):
  1. ShellBridge contains a single `enforce()` function that every message handler calls before acting
  2. Both sender capabilities (relay:write, sign:event, state:write) and recipient capabilities (relay:read, state:read) are checked on every message
  3. A denied publish produces an `OK false` response, a denied subscription produces a `CLOSED` with machine-readable reason, and denied state operations produce error tags
  4. Enforcement decisions are logged with identity, capability, action, and decision for every check (auditable trail)
**Plans**: 2 plans, 2 waves, 7 tasks total

Plans:
- [ ] 09-01: Enforcement gate module — enforce(), resolveCapabilities(), audit hooks (3 tasks, wave 1)
- [ ] 09-02: Wire enforce gate into all ShellBridge handlers (4 tasks, wave 2)

### Phase 10: ACL Behavioral Tests
**Goal**: A comprehensive test matrix proves that every capability-action combination is enforced, and no message path bypasses the ACL gate
**Depends on**: Phase 9
**Requirements**: TST-01, TST-02, TST-03, TST-04, TST-05, TST-06
**Success Criteria** (what must be TRUE):
  1. Test suite covers every cell in the capability (8 capabilities) by action (8 action types) matrix with both grant-succeeds and revoke-denies assertions
  2. Revoking a capability mid-session causes the next message of that type to be denied (no stale grants)
  3. Revoking ALL capabilities for a napplet results in zero messages delivered to or from that napplet
  4. ACL state survives a simulated reload -- revoke, reload test harness, verify still revoked
  5. Block and unblock are tested for every action type and produce correct error responses on block
**Plans**: 2 plans in 2 waves

Plans:
- [ ] 10-01: Capability × Action matrix tests — relay, signer, state, hotkey (4 tasks, wave 1)
- [ ] 10-02: ACL lifecycle tests — mid-session revoke, revoke-all, persistence (1 task, wave 2)

### Phase 11: Shell Code Cleanup
**Goal**: ShellBridge has a minimal, consistent, well-documented public API with clean internals and no development artifacts
**Depends on**: Phase 10
**Requirements**: CLN-01, CLN-02, CLN-03, CLN-04, CLN-05
**Success Criteria** (what must be TRUE):
  1. All public ShellBridge methods follow verb-noun naming (e.g., `handleEvent`, `deliverEvent`, `checkCapability`) and no inconsistent names remain
  2. Every exported function and type has JSDoc with @param, @returns, and @example
  3. No `console.log` debug statements from v0.1.0 development remain in any shell package source file
  4. All internal helpers are unexported, clearly named, and single-responsibility (verified by checking that the package's public API surface matches documentation)
**Plans**: 2 plans, 2 waves, 10 tasks total

Plans:
- [ ] 11-01: Method naming, API surface, and internal visibility cleanup (4 tasks, wave 1)
- [ ] 11-02: JSDoc documentation, debug removal, and error handling cleanup (6 tasks, wave 2)

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8 -> 9 -> 10 -> 11

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Wiring Fixes | v0.1.0 | 5/5 | Complete | 2026-03-30 |
| 2. Test Infrastructure | v0.1.0 | 6/6 | Complete | 2026-03-30 |
| 3. Core Protocol Tests | v0.1.0 | 5/5 | Complete | 2026-03-30 |
| 4. Capability Tests | v0.1.0 | 5/5 | Complete | 2026-03-30 |
| 5. Demo Playground | v0.1.0 | 5/5 | Complete | 2026-03-30 |
| 6. Specification and Publish | v0.1.0 | 4/4 | Complete | 2026-03-30 |
| 7. Nomenclature | v0.2.0 | 0/2 | Planned | - |
| 8. ACL Pure Module | v0.2.0 | 0/3 | Planned | - |
| 9. ACL Enforcement Gate | v0.2.0 | 0/2 | Planned | - |
| 10. ACL Behavioral Tests | v0.2.0 | 0/2 | Planned | - |
| 11. Shell Code Cleanup | v0.2.0 | 0/2 | Planned | - |
