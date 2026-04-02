# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-02
**Milestone:** v0.9.0 Identity & Trust
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.9.0 Requirements

### AUTH — Handshake Redesign

- [ ] **AUTH-01**: Napplet sends REGISTER message with dTag and claimedHash to shell before AUTH begins
- [ ] **AUTH-02**: Shell derives stable keypair from `HMAC(shellSecret, dTag + aggregateHash)` and sends IDENTITY message with pubkey + privkey to napplet
- [ ] **AUTH-03**: Napplet signs AUTH response with shell-delegated key (standard NIP-42 flow preserved)
- [ ] **AUTH-04**: Shell persists a per-shell secret (`shellSecret`) in localStorage, generated once on first use

### VERIFY — Aggregate Hash Verification

- [ ] **VERIFY-01**: Shell fetches napplet files and computes aggregate hash from blobs, comparing to napplet's declared hash
- [ ] **VERIFY-02**: Hash mismatch triggers user warning ("napplet files don't match declared identity")
- [ ] **VERIFY-03**: Verification results cached by manifest event ID — revalidation only when event ID changes

### STORE — Storage Persistence

- [ ] **STORE-01**: Storage scoped by `dTag:aggregateHash:userKey` — ephemeral pubkey removed from scope key
- [ ] **STORE-02**: Same napplet type+version reads its storage across page reloads without data loss
- [ ] **STORE-03**: Different napplet versions (different aggregateHash) get isolated storage

### INST — Instance Identity

- [ ] **INST-01**: Shell assigns persistent GUID per iframe slot, survives page reloads

### SEC — Security Hardening

- [ ] **SEC-01**: Delegated napplet keys cannot publish to external relays (blocked by default in shell)
- [ ] **SEC-02**: Only user's signer (NIP-07/NIP-46) produces events published to real relays

### DEP — Deprecation Cleanup

- [ ] **DEP-03**: `RuntimeHooks` deprecated alias removed from `@napplet/runtime` (deprecated in v0.7.0, one release cycle expired)
- [ ] **DEP-04**: `ShellHooks` deprecated alias removed from `@napplet/shell` (deprecated in v0.7.0, one release cycle expired)

### DOC — Documentation

- [ ] **DOC-01**: SPEC.md Section 2 updated with REGISTER → IDENTITY → AUTH handshake sequence
- [ ] **DOC-02**: SPEC.md Section 5 updated with new storage scoping model (dTag:aggregateHash, no pubkey)
- [ ] **DOC-03**: SPEC.md Section 14 updated with delegated key security model and threat analysis

## Future Requirements

### Storage Migration (deferred)

- **STORE-FUTURE-01**: Migration tool or hook to move existing `napplet-state:{pubkey}:...` keys to new `napplet-state:{dTag}:...` format
- **STORE-FUTURE-02**: `storage.clear()` API for full napplet storage wipe

### Singleton Enforcement (deferred)

- **INST-FUTURE-01**: `RuntimeAdapter.maxInstances` option to limit concurrent instances of the same napplet type

## Out of Scope

| Feature | Reason |
|---------|--------|
| Key rotation for delegated keypairs | Complexity not justified — keypair is derived deterministically |
| Restrictive ACL default | Separate concern, deferred to dedicated security milestone |
| Mobile native wrapper | Web-first protocol |
| npm publish | Blocked on human npm auth |
| Per-service ACL capabilities | Separate concern |
| Manifest signature verification chain | Post-v1 security hardening |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 46 | Pending |
| AUTH-02 | Phase 46 | Pending |
| AUTH-03 | Phase 46 | Pending |
| AUTH-04 | Phase 46 | Pending |
| VERIFY-01 | Phase 46 | Pending |
| VERIFY-02 | Phase 46 | Pending |
| VERIFY-03 | Phase 46 | Pending |
| STORE-01 | Phase 46 | Pending |
| STORE-02 | Phase 46 | Pending |
| STORE-03 | Phase 46 | Pending |
| INST-01 | Phase 46 | Pending |
| SEC-01 | Phase 46 | Pending |
| SEC-02 | Phase 46 | Pending |
| DEP-03 | Phase 47 | Pending |
| DEP-04 | Phase 47 | Pending |
| DOC-01 | Phase 48 | Pending |
| DOC-02 | Phase 48 | Pending |
| DOC-03 | Phase 48 | Pending |

**Coverage:**
- v0.9.0 requirements: 18 total
- Mapped to phases: 18/18
- Unmapped: 0

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 — Traceability updated with phase mappings*
