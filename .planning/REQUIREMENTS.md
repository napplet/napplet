# Requirements: Napplet Protocol SDK v0.3.0

**Defined:** 2026-03-31
**Core Value:** Protocol logic is portable — any environment can host napplets by implementing RuntimeHooks.

## v0.3.0 Requirements

### @napplet/core — Shared Protocol Types

- [ ] **CORE-01**: New package `@napplet/core` in `packages/core/` with zero dependencies
- [ ] **CORE-02**: `NostrEvent`, `NostrFilter` types moved from shell and shim to core
- [ ] **CORE-03**: `BusKind`, `AUTH_KIND`, `SHELL_BRIDGE_URI`, `PROTOCOL_VERSION` constants moved to core
- [ ] **CORE-04**: `Capability` type and `ALL_CAPABILITIES` moved to core (string union, not bitfield — bitfield stays in @napplet/acl)
- [ ] **CORE-05**: `DESTRUCTIVE_KINDS` moved to core
- [ ] **CORE-06**: Topic constants (`shell:state-*`, `napp:state-response`, etc.) moved to core
- [ ] **CORE-07**: @napplet/shell imports all protocol types from @napplet/core (no local copies)
- [ ] **CORE-08**: @napplet/shim imports all protocol types from @napplet/core (no local copies)
- [ ] **CORE-09**: Package builds, type-checks, zero external dependencies

### @napplet/runtime — Protocol Engine

- [ ] **RT-01**: New package `@napplet/runtime` in `packages/runtime/`
- [ ] **RT-02**: `RuntimeHooks` interface defined — abstract hooks any shell implements (sendToNapplet, getRelayPool, verifyEvent, persistAcl, loadAcl, etc.)
- [ ] **RT-03**: `createRuntime(hooks: RuntimeHooks)` factory exported — creates the protocol engine
- [ ] **RT-04**: Message dispatch logic moved from shell-bridge.ts to runtime (handleEvent, handleReq, handleClose, handleAuth, handleCount)
- [ ] **RT-05**: enforce.ts (enforce gate, resolveCapabilities) moved to runtime
- [ ] **RT-06**: Subscription management moved to runtime
- [ ] **RT-07**: AUTH handshake logic moved to runtime
- [ ] **RT-08**: Replay detection moved to runtime
- [ ] **RT-09**: Event buffer (ring buffer) and delivery logic moved to runtime
- [ ] **RT-10**: napp-key-registry moved to runtime (identity tracking is protocol-level, not browser-level)
- [ ] **RT-11**: ACL state container (wraps @napplet/acl with persistence via RuntimeHooks) moved to runtime
- [ ] **RT-12**: Runtime depends only on @napplet/core + @napplet/acl (no DOM, no browser APIs)
- [ ] **RT-13**: Package builds, type-checks, no browser-specific imports

### @napplet/shell — Browser Adapter

- [ ] **SHELL-01**: `createShellBridge(hooks: ShellHooks)` becomes a thin wrapper around `createRuntime(adaptHooks(hooks))`
- [ ] **SHELL-02**: `ShellHooks` interface preserved for backwards compatibility but internally adapts to `RuntimeHooks`
- [ ] **SHELL-03**: origin-registry stays in shell (browser-specific Window ↔ windowId)
- [ ] **SHELL-04**: state-proxy stays in shell (browser localStorage-backed)
- [ ] **SHELL-05**: manifest-cache stays in shell (browser localStorage-backed)
- [ ] **SHELL-06**: audio-manager stays in shell (Web Audio API, browser-specific)
- [ ] **SHELL-07**: Shell depends on @napplet/runtime + @napplet/core

### @napplet/shim — Updated Imports

- [ ] **SHIM-01**: @napplet/shim imports types from @napplet/core instead of local types.ts
- [ ] **SHIM-02**: Shim's local types.ts deleted or reduced to shim-specific types only
- [ ] **SHIM-03**: No behavioral changes — shim API remains identical

### Service Extension Design (stub)

- [x] **SVC-01**: `RuntimeHooks.services` optional field defined in interface (Record<string, unknown> or typed registry)
- [x] **SVC-02**: Event kind 29010 reserved for service discovery in @napplet/core
- [x] **SVC-03**: Service discovery message format documented in SPEC.md (even if not yet implemented)

### Test Suite

- [ ] **TST-01**: All 122 existing tests pass with new package structure
- [ ] **TST-02**: @napplet/core has unit tests for type re-exports (import verification)
- [ ] **TST-03**: @napplet/runtime has unit tests for message dispatch (isolated from browser)
- [ ] **TST-04**: Integration tests verify shell → runtime → acl chain works end-to-end

### Shell Export Cleanup (Gap Closure)

- [ ] **CLEAN-01**: Shell index.ts does not re-export handleStateRequest or cleanupNappState from state-proxy.ts
- [ ] **CLEAN-02**: Shell's createEnforceGate is re-exported from @napplet/runtime, not from local duplicate enforce.ts
- [ ] **CLEAN-03**: Shell singletons (nappKeyRegistry, aclStore) removed from public exports or documented as internal-only

## v0.4.0 (Deferred)

- **Audio service implementation** via service extension pattern
- **Notification service** via service extension pattern
- **Service discovery protocol** — napplet queries available services
- **Napplet manifest `requires` tags** — declares service dependencies
- **WASM compilation** of @napplet/acl
- **npm publish** all packages

## Out of Scope

| Feature | Reason |
|---------|--------|
| Actual service implementations | v0.3.0 designs the interface, v0.4.0 implements |
| WASM compilation | Designed for in v0.2.0, deferred until services are stable |
| New protocol features | Architecture extraction only |
| Demo app changes | Demo gets updated imports, no new features |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 12 | Pending |
| CORE-02 | Phase 12 | Pending |
| CORE-03 | Phase 12 | Pending |
| CORE-04 | Phase 12 | Pending |
| CORE-05 | Phase 12 | Pending |
| CORE-06 | Phase 12 | Pending |
| CORE-07 | Phase 12 | Pending |
| CORE-08 | Phase 12 | Pending |
| CORE-09 | Phase 12 | Pending |
| RT-01 | Phase 13 | Pending |
| RT-02 | Phase 13 | Pending |
| RT-03 | Phase 13 | Pending |
| RT-04 | Phase 13 | Pending |
| RT-05 | Phase 13 | Pending |
| RT-06 | Phase 13 | Pending |
| RT-07 | Phase 13 | Pending |
| RT-08 | Phase 13 | Pending |
| RT-09 | Phase 13 | Pending |
| RT-10 | Phase 13 | Pending |
| RT-11 | Phase 13 | Pending |
| RT-12 | Phase 13 | Pending |
| RT-13 | Phase 13 | Pending |
| SHELL-01 | Phase 14 | Pending |
| SHELL-02 | Phase 14 | Pending |
| SHELL-03 | Phase 14 | Pending |
| SHELL-04 | Phase 14 | Pending |
| SHELL-05 | Phase 14 | Pending |
| SHELL-06 | Phase 14 | Pending |
| SHELL-07 | Phase 14 | Pending |
| SHIM-01 | Phase 14 | Pending |
| SHIM-02 | Phase 14 | Pending |
| SHIM-03 | Phase 14 | Pending |
| SVC-01 | Phase 15 | Complete |
| SVC-02 | Phase 15 | Complete |
| SVC-03 | Phase 15 | Complete |
| TST-01 | Phase 16 | Pending |
| TST-02 | Phase 16 | Pending |
| TST-03 | Phase 16 | Pending |
| TST-04 | Phase 16 | Pending |
| CLEAN-01 | Phase 17 | Pending |
| CLEAN-02 | Phase 17 | Pending |
| CLEAN-03 | Phase 17 | Pending |

**Coverage:**
- v0.3.0 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0

---
*Requirements defined: 2026-03-31*
*Traceability updated: 2026-03-31*
