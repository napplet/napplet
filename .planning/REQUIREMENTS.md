# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-05
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.12.0 Requirements

Requirements for Draft Final "Nostr Web Applets" NIP [NIP-5C] milestone. Each maps to roadmap phases.

### Resolution

- [ ] **RES-01**: NIP number conflict with Scrolls PR#2281 resolved (use 5D, contest 5C, or alternative)
- [ ] **RES-02**: Key stakeholders (hzrd149, arthurfranca, fiatjaf) pre-engaged with draft or outline before formal spec writing

### Core Protocol Spec

- [ ] **SPEC-01**: AUTH handshake section defines REGISTER/IDENTITY/AUTH wire format with NIP-42 reference, not redefinition
- [ ] **SPEC-02**: Relay proxy section defines REQ/EVENT/CLOSE/CLOSED/NOTICE forwarding as shell behavior, referencing NIP-01
- [ ] **SPEC-03**: Capability discovery section defines kind 29010 request/response surface (protocol only, not registry internals)
- [ ] **SPEC-04**: Manifest section references NIP-5A kind 35128 and aggregate hash, defines `requires` tags for capability declaration
- [ ] **SPEC-05**: Security considerations section addresses postMessage `*` origin, iframe sandbox constraints, and delegated key trust model
- [ ] **SPEC-06**: MUST/MAY layering clearly distinguishes required (AUTH + discovery) from optional capabilities

### Standard Capabilities

- [ ] **CAP-01**: Relay proxy capability (`window.napplet.relay`) interface defined as MAY
- [ ] **CAP-02**: IPC pub/sub capability (`window.napplet.ipc`) interface defined as MAY — NIP-01 event-based emit/on
- [ ] **CAP-03**: Napplet state storage capability (`window.napplet.storage`) interface defined as MAY
- [ ] **CAP-04**: NIP-07 signer capability (`window.nostr`) interface defined as MAY — references NIP-07, shell proxies transparently
- [ ] **CAP-05**: Nostr event database capability (`window.nostrdb`) interface defined as MAY
- [ ] **CAP-06**: Service/feature discovery capability (`window.napplet.services`) interface defined as MUST

### Channel Protocol

- [ ] **CHAN-01**: Channel wire format designed with open/auth/data/close lifecycle verbs
- [ ] **CHAN-02**: Broadcast defined as channel operation (send to all open channels), shell-mediated fan-out
- [ ] **CHAN-03**: Channel protocol implemented in @napplet/shim (`window.napplet.channels`) and runtime
- [ ] **CHAN-04**: Channel protocol test suite validates lifecycle, broadcast, and error cases
- [ ] **CHAN-05**: Channel NIP section written from implementation experience

### Spec Packaging

- [ ] **PKG-01**: Existing SPEC.md renamed to internal/runtime reference document
- [ ] **PKG-02**: NIP written in nostr-protocol/nips markdown format (terse, <500 lines, setext headings, draft badge)
- [ ] **PKG-03**: NIP lists @napplet/shim + hyprgate as reference implementations

## Future Requirements

- PR submission to nostr-protocol/nips (deferred to post-review)
- Package alignment with NIP-5C (remove signer proxy kinds, rename internal interfaces)
- MessagePort upgrade path for high-frequency channels

## Out of Scope

| Feature | Reason |
|---------|--------|
| PR submission to nostr-protocol/nips | Write spec first, review internally, submit in next milestone |
| Package refactoring to remove 29001/29002 proxy kinds | Spec first, then align packages in a follow-up milestone |
| MessagePort channel optimization | Defer to v2 — postMessage is <1ms, sufficient for v1 |
| DAW or audio-specific protocol implementation | NIP only designs the channel primitive that could support it |
| ACL internals in the NIP | Runtime implementation detail, not protocol standard |
| Interactive capability negotiation | NIP-91 pattern rejected by community; use declarative advertisement |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RES-01 | Phase 57 | Pending |
| RES-02 | Phase 57 | Pending |
| SPEC-01 | Phase 58 | Pending |
| SPEC-02 | Phase 58 | Pending |
| SPEC-03 | Phase 58 | Pending |
| SPEC-04 | Phase 58 | Pending |
| SPEC-05 | Phase 58 | Pending |
| SPEC-06 | Phase 58 | Pending |
| CAP-01 | Phase 58 | Pending |
| CAP-02 | Phase 58 | Pending |
| CAP-03 | Phase 58 | Pending |
| CAP-04 | Phase 58 | Pending |
| CAP-05 | Phase 58 | Pending |
| CAP-06 | Phase 58 | Pending |
| CHAN-01 | Phase 59 | Pending |
| CHAN-02 | Phase 59 | Pending |
| CHAN-03 | Phase 60 | Pending |
| CHAN-04 | Phase 60 | Pending |
| CHAN-05 | Phase 59 | Pending |
| PKG-01 | Phase 61 | Pending |
| PKG-02 | Phase 61 | Pending |
| PKG-03 | Phase 61 | Pending |

**Coverage:**
- v0.12.0 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-05 after roadmap creation*
