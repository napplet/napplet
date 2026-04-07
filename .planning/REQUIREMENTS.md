# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-08
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.17.0 Requirements

Requirements for Capability Cleanup milestone. Each maps to roadmap phases.

### Capability Query

- [ ] **CAP-01**: `shell.supports()` accepts namespaced strings with `nub:`, `perm:`, `svc:` prefixes
- [ ] **CAP-02**: `ShellSupports` interface updated to accept namespaced capability strings
- [ ] **CAP-03**: `NappletGlobalShell` type reflects the namespaced API

### Dead Code Removal

- [ ] **DEAD-01**: `discovery-shim.ts` deleted from shim package
- [ ] **DEAD-02**: `window.napplet.services` API removed from shim
- [ ] **DEAD-03**: `ServiceDescriptor`/`ServiceInfo` types removed from core
- [ ] **DEAD-04**: `NappletGlobal.services` type definition removed
- [ ] **DEAD-05**: `legacy.ts` deleted from core package
- [ ] **DEAD-06**: Legacy re-exports removed from `core/src/index.ts`
- [ ] **DEAD-07**: Legacy tests removed from `core/src/index.test.ts`

### Backward Compat Removal

- [ ] **COMPAT-01**: `napplet-napp-type` meta tag fallback removed from shim
- [ ] **COMPAT-02**: `napplet-napp-type` duplicate injection removed from vite-plugin

### Documentation

- [ ] **DOC-01**: `core/README.md` updated — BusKind table removed, supports() docs reflect namespaced API
- [ ] **DOC-02**: `shim/README.md` updated — services API removed, supports() docs updated
- [ ] **DOC-03**: `sdk/README.md` updated — supports() docs reflect namespaced API
- [ ] **DOC-04**: NIP-5D updated if it references old supports() signature or service discovery

## Future Requirements

None — this is a cleanup milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Service implementation (audio, notifications) | Services extracted to shell runtime repo in v0.13.0 |
| `shell.supports()` actual implementation (non-stub) | Shell populates capabilities — that's the shell runtime repo's concern |
| Service versioning (`svc:audio@1.0.0`) | Decided against — boolean support check is sufficient |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAP-01 | Phase 80 | Pending |
| CAP-02 | Phase 80 | Pending |
| CAP-03 | Phase 80 | Pending |
| DEAD-01 | Phase 81 | Pending |
| DEAD-02 | Phase 81 | Pending |
| DEAD-03 | Phase 81 | Pending |
| DEAD-04 | Phase 81 | Pending |
| DEAD-05 | Phase 81 | Pending |
| DEAD-06 | Phase 81 | Pending |
| DEAD-07 | Phase 81 | Pending |
| COMPAT-01 | Phase 81 | Pending |
| COMPAT-02 | Phase 81 | Pending |
| DOC-01 | Phase 82 | Pending |
| DOC-02 | Phase 82 | Pending |
| DOC-03 | Phase 82 | Pending |
| DOC-04 | Phase 82 | Pending |

**Coverage:**
- v0.17.0 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after roadmap creation*
