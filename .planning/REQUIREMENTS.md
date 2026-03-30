# Requirements: Napplet Protocol SDK v0.2.0

**Defined:** 2026-03-30
**Core Value:** The shell's security boundary (ACL) must be deterministic, auditable, and enforce on every code path — no bypasses, no gaps.

## v0.2.0 Requirements

### Rename: pseudo-relay → ShellBridge

- [ ] **REN-01**: `createPseudoRelay()` renamed to `createShellBridge()` in @napplet/shell
- [ ] **REN-02**: `PseudoRelay` type renamed to `ShellBridge` in @napplet/shell
- [ ] **REN-03**: `pseudo-relay.ts` file renamed to `shell-bridge.ts`
- [ ] **REN-04**: All references in tests updated (import paths, variable names, comments)
- [ ] **REN-05**: All references in demo app updated
- [ ] **REN-06**: SPEC.md updated — "pseudo-relay" → "ShellBridge" throughout
- [ ] **REN-07**: PSEUDO_RELAY_URI constant renamed to SHELL_BRIDGE_URI
- [ ] **REN-08**: Package README updated with new API name

### Rename: storage → state (completion)

- [ ] **STA-01**: All test files updated — storage:read/write → state:read/write capability strings
- [ ] **STA-02**: Test file `storage-isolation.spec.ts` renamed to `state-isolation.spec.ts`
- [ ] **STA-03**: All test assertions updated for `shell:state-*` topics and `napp:state-response`
- [ ] **STA-04**: Test harness globals updated if they reference storage

### ACL Redesign — Pure Module

- [ ] **ACL-01**: ACL logic extracted into standalone module with zero side effects (no DOM, no localStorage, no closures over runtime)
- [ ] **ACL-02**: ACL module exports a single check function: `(identity: {pubkey, dTag, hash}, capability, action) → allow | deny`
- [ ] **ACL-03**: ACL state is an immutable data structure — mutations return new state, not mutate in place
- [ ] **ACL-04**: ACL module has no dependencies beyond standard library (WASM-compilable)
- [ ] **ACL-05**: ACL persistence (localStorage) is a separate adapter layer, not part of the core module
- [ ] **ACL-06**: ACL module is fully describable in <100 words (spec-friendly)

### ACL Enforcement — Single Gate

- [ ] **ENF-01**: ShellBridge has ONE enforcement function that all message paths call before acting
- [ ] **ENF-02**: Enforcement checks both sender capabilities (relay:write, sign:event, state:write) AND recipient capabilities (relay:read, state:read) on every message
- [ ] **ENF-03**: No postMessage to a napplet iframe occurs without passing through the enforcement gate
- [ ] **ENF-04**: Denied messages produce explicit responses (OK false, CLOSED with reason, error tags)
- [ ] **ENF-05**: Enforcement function is auditable — logs every check with identity, capability, and decision

### ACL Behavioral Tests — Capability × Action Matrix

- [ ] **TST-01**: Test matrix covers every capability (relay:read, relay:write, sign:event, sign:nip04, sign:nip44, state:read, state:write, hotkey:forward) × every action type (publish, subscribe, deliver, sign, state-get, state-set, inter-pane emit, inter-pane receive)
- [ ] **TST-02**: Each cell in the matrix has: grant → action succeeds, revoke → action denied with correct error
- [ ] **TST-03**: Block/unblock tested for every action type
- [ ] **TST-04**: ACL changes take effect immediately — revoke mid-session stops delivery on next message
- [ ] **TST-05**: No message path bypasses ACL — tested by revoking ALL capabilities and verifying zero messages delivered
- [ ] **TST-06**: ACL state persistence tested — revoke, reload, verify still revoked

### Shell Code Cleanup

- [ ] **CLN-01**: Consistent method naming across ShellBridge (verb-noun pattern: `handleEvent`, `deliverEvent`, `checkCapability`)
- [ ] **CLN-02**: ShellBridge public API is minimal and well-documented (JSDoc with @param, @returns, @example)
- [ ] **CLN-03**: Internal helpers are private (not exported), clearly named, single-responsibility
- [ ] **CLN-04**: Remove debug console.log statements added during v0.1.0 development
- [ ] **CLN-05**: All ShellBridge methods have consistent error handling (no silent swallows without comment)

## v0.3.0 (Deferred)

- **WASM compilation** of ACL module — v0.2.0 designs for it, v0.3.0 implements
- **Restrictive ACL default mode** — opt-in strict mode where unknown identities are denied
- **Rate limiting on signer requests** — per-napp request frequency caps
- **npm publish** — v0.2.0 focuses on architecture, publish after stabilization

## Out of Scope

| Feature | Reason |
|---------|--------|
| WASM build of ACL | v0.2.0 designs for WASM-readiness, actual compilation deferred to v0.3.0 |
| New protocol features | Architecture cleanup only, no new capabilities |
| Demo app redesign | Demo gets updated imports but no new features |
| NIP PR submission | Spec evolves with architecture but PR submission is separate |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REN-01 | Phase 7 | Pending |
| REN-02 | Phase 7 | Pending |
| REN-03 | Phase 7 | Pending |
| REN-04 | Phase 7 | Pending |
| REN-05 | Phase 7 | Pending |
| REN-06 | Phase 7 | Pending |
| REN-07 | Phase 7 | Pending |
| REN-08 | Phase 7 | Pending |
| STA-01 | Phase 7 | Pending |
| STA-02 | Phase 7 | Pending |
| STA-03 | Phase 7 | Pending |
| STA-04 | Phase 7 | Pending |
| ACL-01 | Phase 8 | Pending |
| ACL-02 | Phase 8 | Pending |
| ACL-03 | Phase 8 | Pending |
| ACL-04 | Phase 8 | Pending |
| ACL-05 | Phase 8 | Pending |
| ACL-06 | Phase 8 | Pending |
| ENF-01 | Phase 9 | Pending |
| ENF-02 | Phase 9 | Pending |
| ENF-03 | Phase 9 | Pending |
| ENF-04 | Phase 9 | Pending |
| ENF-05 | Phase 9 | Pending |
| TST-01 | Phase 10 | Pending |
| TST-02 | Phase 10 | Pending |
| TST-03 | Phase 10 | Pending |
| TST-04 | Phase 10 | Pending |
| TST-05 | Phase 10 | Pending |
| TST-06 | Phase 10 | Pending |
| CLN-01 | Phase 11 | Pending |
| CLN-02 | Phase 11 | Pending |
| CLN-03 | Phase 11 | Pending |
| CLN-04 | Phase 11 | Pending |
| CLN-05 | Phase 11 | Pending |

**Coverage:**
- v0.2.0 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after roadmap creation*
