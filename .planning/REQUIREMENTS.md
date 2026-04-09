# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-09
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.23.0 Requirements

Draft NUB-NOTIFY spec, implement @napplet/nub-notify.

### NUB-NOTIFY Spec

- [ ] **SPEC-01**: Draft NUB-NOTIFY spec in nubs repo → PR to napplet/nubs. No private refs. Covers: send/dismiss, permissions, actions, channels, badges, shell controls, priority levels.

### NUB Type Package

- [ ] **NUB-01**: Create `@napplet/nub-notify` package with typed message definitions (notify.send, notify.send.result, notify.dismiss, notify.badge, notify.channel.register, notify.permission.request, notify.permission.result, notify.action, notify.clicked, notify.dismissed, notify.controls)
- [ ] **NUB-02**: Package includes shim.ts (installNotifyShim, notification handling) and sdk.ts (convenience wrappers) per modular pattern

### Core Integration

- [ ] **CORE-01**: Add `'notify'` to `NubDomain` union and `NUB_DOMAINS` array in envelope.ts
- [ ] **CORE-02**: Add `notify` namespace to `NappletGlobal` type in types.ts

### Shim Integration

- [ ] **SHIM-01**: Import and call `installNotifyShim()` from `@napplet/nub-notify` in shim entry point + named export

### Documentation

- [ ] **DOC-01**: `@napplet/nub-notify` README with message reference
- [ ] **DOC-02**: Update NIP-5D domain table (add notify)
- [ ] **DOC-03**: Update core/shim/SDK READMEs for notify NUB

## Out of Scope

| Feature | Reason |
|---------|--------|
| Shell notification UI implementation | Shell concern |
| Push notifications / service workers | Browser-level, not protocol |
| Notification sounds | Shell decides presentation |
| npm publish | Blocked on human npm auth (PUB-04) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SPEC-01 | — | Pending |
| NUB-01 | — | Pending |
| NUB-02 | — | Pending |
| CORE-01 | — | Pending |
| CORE-02 | — | Pending |
| SHIM-01 | — | Pending |
| DOC-01 | — | Pending |
| DOC-02 | — | Pending |
| DOC-03 | — | Pending |

**Coverage:**
- v0.23.0 requirements: 9 total
- Mapped to phases: 0
- Unmapped: 9

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after initial definition*
