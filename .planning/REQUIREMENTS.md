# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-07
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.15.0 Requirements

Requirements for Protocol Simplification milestone. Each maps to roadmap phases.

### Wire Protocol

- [ ] **WIRE-01**: Napplets send raw NIP-01 messages (REQ, EVENT, CLOSE) without signing — no crypto in the wire protocol
- [ ] **WIRE-02**: Shell identifies napplet sender via unforgeable message.source Window reference
- [ ] **WIRE-03**: Identity established at iframe creation — shell maps Window → (dTag, aggregateHash) before first message
- [ ] **WIRE-04**: REGISTER/IDENTITY/AUTH three-phase handshake removed from the protocol

### Shim Cleanup

- [ ] **SHIM-01**: @napplet/shim removes all signing code (finalizeEvent, generateSecretKey, keypair storage)
- [ ] **SHIM-02**: @napplet/shim drops nostr-tools crypto imports (no schnorr, no secp256k1)
- [ ] **SHIM-03**: Shim no longer generates or stores ephemeral/delegated keypairs
- [ ] **SHIM-04**: subscribe(), publish(), query() APIs remain unchanged from the napplet developer's perspective

### Runtime Internalization

- [ ] **RT-01**: Shell/runtime derives identity pubkey from (shellSecret, dTag, aggregateHash) at iframe creation, not at AUTH
- [ ] **RT-02**: Runtime stamps inbound napplet messages with the derived pubkey internally
- [ ] **RT-03**: ACL enforcement continues to work via internally-assigned pubkey (no behavior change from the shell's perspective)
- [ ] **RT-04**: Storage scoping, IPC routing, and signer proxy continue to function with internal identity

### Spec & Docs

- [ ] **DOC-02**: NIP-5D updated to remove AUTH handshake requirement
- [ ] **DOC-03**: @napplet/shim and @napplet/sdk READMEs updated to reflect no-crypto API

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Protocol Extensions

- **EXT-01**: Cross-origin napplet communication (beyond postMessage to parent)
- **EXT-02**: WebRTC/SharedWorker transport support (would re-introduce signing need)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Removing nostr crypto from runtime/shell internals | Shell's internal identity system is preserved — only the wire protocol changes |
| Test suite updates in @kehto | Kehto is a separate repo with its own lifecycle |
| Demo updates | Demo lives in kehto now |
| RUNTIME-SPEC.md updates | Lives in kehto now; update there when runtime changes land |
| npm publish | Still blocked on human auth (PUB-04) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WIRE-01 | Phase 70 | Complete (types express unsigned contract) |
| WIRE-02 | Phase 70 | Complete (type-level; runtime impl in kehto) |
| WIRE-03 | Phase 70 | Complete (type-level; runtime impl in kehto) |
| WIRE-04 | Phase 70 | Complete (handshake types removed from core) |
| SHIM-01 | Phase 71 | Pending |
| SHIM-02 | Phase 71 | Pending |
| SHIM-03 | Phase 71 | Pending |
| SHIM-04 | Phase 71 | Pending |
| RT-01 | Phase 70 | Complete (type-level; runtime impl in kehto) |
| RT-02 | Phase 70 | Complete (type-level; runtime impl in kehto) |
| RT-03 | Phase 70 | Complete (ACL types preserved in core) |
| RT-04 | Phase 70 | Complete (bus kinds for storage/IPC/signer intact) |
| DOC-02 | Phase 72 | Pending |
| DOC-03 | Phase 73 | Pending |

**Coverage:**
- v0.15.0 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 after roadmap creation*
