# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-05
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.12.0 Requirements

Requirements for Draft Final "Nostr Web Applets" NIP [NIP-5C] milestone. Each maps to roadmap phases.

### Resolution

- [ ] **RES-01**: NIP number conflict with Scrolls PR#2281 resolved (use 5D, contest 5C, or alternative)
- [x] **RES-02**: Key stakeholders (hzrd149, arthurfranca, fiatjaf) pre-engaged with draft or outline before formal spec writing

### Core Protocol Spec

- [x] **SPEC-01**: AUTH handshake section defines REGISTER/IDENTITY/AUTH wire format with NIP-42 reference, not redefinition
- [x] **SPEC-02**: Relay proxy section defines REQ/EVENT/CLOSE/CLOSED/NOTICE forwarding as shell behavior, referencing NIP-01
- [x] **SPEC-03**: Capability discovery section defines kind 29010 request/response surface (protocol only, not registry internals)
- [x] **SPEC-04**: Manifest section references NIP-5A kind 35128 and aggregate hash, defines `requires` tags for capability declaration
- [x] **SPEC-05**: Security considerations section addresses postMessage `*` origin, iframe sandbox constraints, and delegated key trust model
- [x] **SPEC-06**: MUST/MAY layering clearly distinguishes required (AUTH + discovery) from optional capabilities

### Standard Capabilities

- [x] **CAP-01**: Relay proxy capability (`window.napplet.relay`) interface defined as MAY
- [x] **CAP-02**: IPC pub/sub capability (`window.napplet.ipc`) interface defined as MAY — NIP-01 event-based emit/on
- [x] **CAP-03**: Napplet state storage capability (`window.napplet.storage`) interface defined as MAY
- [x] **CAP-04**: NIP-07 signer capability (`window.nostr`) interface defined as MAY — references NIP-07, shell proxies transparently
- [x] **CAP-05**: Nostr event database capability (`window.nostrdb`) interface defined as MAY
- [x] **CAP-06**: Service/feature discovery capability (`window.napplet.services`) interface defined as MUST

### NIP Simplification (PIVOT — replaces Channel Protocol)

- [x] **SIMP-01**: NIP-5D v2 reduced to core-only (~150 lines): handshake, transport, security model, NUB reference
- [x] **SIMP-02**: Standard capabilities (relay, IPC, storage, signer, nostrdb) moved out of NIP into NUB interface track
- [x] **SIMP-03**: Discovery mechanism updated from service names to NUB proposal IDs (shell.supports("NUB-RELAY", "NUB-02"))
- [ ] **SIMP-04**: NIP references NUB proposal track (github.com/napplets) for interface and message protocol extensions

### NUB Framework

- [ ] **NUB-01**: NUB governance document defines two tracks: NUB-WORD (interfaces, one canonical per name) and NUB-NN (message protocols, competing allowed)
- [ ] **NUB-02**: Initial NUB interface specs drafted: NUB-RELAY, NUB-STORAGE, NUB-SIGNER, NUB-NOSTRDB, NUB-IPC, NUB-PIPES
- [ ] **NUB-03**: NUB template created for submitting new proposals (interface and message protocol variants)

### Spec Packaging

- [ ] **PKG-01**: Existing SPEC.md renamed to RUNTIME-SPEC.md as internal/runtime reference document
- [ ] **PKG-02**: NIP-5D v2 in nostr-protocol/nips markdown format (terse, <200 lines, setext headings, draft badge)
- [ ] **PKG-03**: NIP lists @napplet/shim + hyprgate as reference implementations

## Future Requirements

- PR submission to nostr-protocol/nips (deferred to post-review)
- Package alignment with NIP-5D (remove signer proxy kinds, rename internal interfaces)
- Channel/pipe protocol implementation in packages (NUB-PIPES — separate milestone)
- MessagePort upgrade path for high-frequency pipes
- Initial NUB message protocol specs (NUB-01 feed, NUB-02 chat, etc.)

## Out of Scope

| Feature | Reason |
|---------|--------|
| PR submission to nostr-protocol/nips | Write spec first, review internally, submit in next milestone |
| Package refactoring to remove 29001/29002 proxy kinds | Spec first, then align packages in a follow-up milestone |
| Channel/pipe implementation in packages | Moved to future milestone — NUB-PIPES spec first, then implement |
| DAW or audio-specific protocol implementation | NUB-PIPES only designs the primitive that could support it |
| ACL internals in the NIP | Runtime implementation detail, not protocol standard |
| NUB message protocol specs (NUB-01, NUB-02, etc.) | Interface specs first, message protocols follow |
| NUB repo creation on github.com/napplets | Design the framework first, create repo when structure is finalized |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RES-01 | Phase 57 | Complete |
| RES-02 | Phase 57 | Complete |
| SPEC-01 | Phase 58 | Complete |
| SPEC-02 | Phase 58 | Complete (moving to NUB-RELAY) |
| SPEC-03 | Phase 58 | Complete (updating in Phase 59) |
| SPEC-04 | Phase 58 | Complete |
| SPEC-05 | Phase 58 | Complete |
| SPEC-06 | Phase 58 | Complete (updating in Phase 59) |
| CAP-01 | Phase 58 | Complete (moving to NUB-RELAY) |
| CAP-02 | Phase 58 | Complete (moving to NUB-IPC) |
| CAP-03 | Phase 58 | Complete (moving to NUB-STORAGE) |
| CAP-04 | Phase 58 | Complete (moving to NUB-SIGNER) |
| CAP-05 | Phase 58 | Complete (moving to NUB-NOSTRDB) |
| CAP-06 | Phase 58 | Complete (updating in Phase 59) |
| SIMP-01 | Phase 59 | Complete |
| SIMP-02 | Phase 59 | Complete |
| SIMP-03 | Phase 59 | Complete |
| SIMP-04 | Phase 59 | Pending |
| NUB-01 | Phase 60 | Pending |
| NUB-02 | Phase 60 | Pending |
| NUB-03 | Phase 60 | Pending |
| PKG-01 | Phase 61 | Pending |
| PKG-02 | Phase 61 | Pending |
| PKG-03 | Phase 61 | Pending |

**Coverage:**
- v0.12.0 requirements: 24 total (14 complete from Phases 57-58, 10 pending)
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-05 after roadmap creation*
