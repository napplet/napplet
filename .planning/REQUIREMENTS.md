# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-09
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.24.0 Requirements

Remove NIP-07 from napplets. Replace signer NUB with identity NUB. Add shell-mediated crypto to relay NUB.

### Kill NIP-07 + Signer

- [ ] **KILL-01**: Remove `window.nostr` installation from shim (NIP-07 proxy gone)
- [ ] **KILL-02**: Delete `@napplet/nub-signer` package entirely
- [ ] **KILL-03**: Remove 'signer' from NubDomain union, NUB_DOMAINS, NappletGlobal
- [ ] **KILL-04**: Remove signer imports/routing from shim and SDK

### NUB-IDENTITY Spec

- [ ] **SPEC-01**: Draft NUB-IDENTITY spec in nubs repo → PR to napplet/nubs. No private refs. Covers: getPublicKey, getRelays, getProfile, getFollows, getList(type), getZaps, getMutes, getBlocked, getBadges.

### NUB Identity Package

- [ ] **NUB-01**: Create `@napplet/nub-identity` package with typed message definitions for all identity queries
- [ ] **NUB-02**: Package includes shim.ts (installIdentityShim) and sdk.ts (convenience wrappers) per modular pattern

### Relay NUB Update

- [ ] **RELAY-01**: Add `relay.publishEncrypted` message type to `@napplet/nub-relay` (cleartext + recipient + encryption method, NIP-44 default)
- [ ] **RELAY-02**: Update NUB-RELAY spec in nubs repo with publishEncrypted + shell-decrypts-incoming semantics
- [ ] **RELAY-03**: Update relay shim to handle publishEncrypted and auto-decrypted incoming events

### Core + Shim Integration

- [ ] **CORE-01**: Replace 'signer' with 'identity' in NubDomain union and NUB_DOMAINS
- [ ] **CORE-02**: Replace signer namespace with identity namespace in NappletGlobal
- [ ] **SHIM-01**: Import installIdentityShim, remove installSignerShim

### NIP-5D + Documentation

- [ ] **DOC-01**: Update NIP-5D: remove "Shells MUST provide NIP-07 window.nostr", add security rationale, update domain table
- [ ] **DOC-02**: `@napplet/nub-identity` README
- [ ] **DOC-03**: Update core/shim/SDK READMEs (signer→identity, no window.nostr)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Shell crypto implementation details | Shell concern |
| NIP-04 deprecation timeline | External to this protocol |
| Kind-based auto-encryption (Option A) | Too complex, explicit publishEncrypted chosen |
| npm publish | Blocked on human npm auth (PUB-04) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| KILL-01 | — | Pending |
| KILL-02 | — | Pending |
| KILL-03 | — | Pending |
| KILL-04 | — | Pending |
| SPEC-01 | — | Pending |
| NUB-01 | — | Pending |
| NUB-02 | — | Pending |
| RELAY-01 | — | Pending |
| RELAY-02 | — | Pending |
| RELAY-03 | — | Pending |
| CORE-01 | — | Pending |
| CORE-02 | — | Pending |
| SHIM-01 | — | Pending |
| DOC-01 | — | Pending |
| DOC-02 | — | Pending |
| DOC-03 | — | Pending |

**Coverage:**
- v0.24.0 requirements: 16 total
- Mapped to phases: 0
- Unmapped: 16

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after initial definition*
