# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-07
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.16.0 Requirements

Requirements for Wire Format & NUB Architecture milestone. Each maps to roadmap phases.

### Spec (NIP-5D)

- [ ] **SPEC-01**: NIP-5D defines the generic JSON envelope format (`{ type, ...payload }`) as the wire protocol
- [ ] **SPEC-02**: NIP-5D describes transport (postMessage), identity (message.source), and manifest only — no protocol messages
- [ ] **SPEC-03**: NIP-5D references NUBs as the source of protocol message definitions
- [ ] **SPEC-04**: NIP-5D defines NUB negotiation (manifest `requires` → shell `supports` → compatibility)

### NUB Specs

- [ ] **NUB-01**: NUB-RELAY spec defines relay proxy messages within the JSON envelope
- [ ] **NUB-02**: NUB-SIGNER spec defines signing delegation messages
- [ ] **NUB-03**: NUB-STORAGE spec defines scoped storage messages
- [ ] **NUB-04**: NUB-IFC spec defines inter-frame communication with dispatch and channel modes (merges IPC + PIPES)

### Code — Core Types

- [ ] **CORE-01**: @napplet/core exports envelope message types replacing NIP-01 array types
- [ ] **CORE-02**: @napplet/core removes NIP-01 verb constants, adds JSON envelope type discriminants

### Code — Shim

- [ ] **SHIM-01**: @napplet/shim sends JSON envelope messages via postMessage (not NIP-01 arrays)
- [ ] **SHIM-02**: @napplet/shim receives and dispatches JSON envelope messages from shell
- [ ] **SHIM-03**: window.napplet API (subscribe, publish, query, emit, on, storage) unchanged

### Docs

- [ ] **DOC-01**: Package READMEs updated for JSON envelope wire format

## Future Requirements

Deferred to future release.

### NUB Extensions

- **NUB-05**: NUB-NOSTRDB spec for local database queries
- **NUB-06**: NUB governance framework (NUB-01/02/03 from earlier milestones)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Runtime/shell code changes | Lives in kehto; translation layer is kehto's concern |
| Demo updates | Lives in kehto |
| NUB-NOSTRDB | Defer to future milestone |
| NUB governance formalization | Defer to future milestone |
| npm publish | Still blocked on human auth (PUB-04) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SPEC-01 | — | Pending |
| SPEC-02 | — | Pending |
| SPEC-03 | — | Pending |
| SPEC-04 | — | Pending |
| NUB-01 | — | Pending |
| NUB-02 | — | Pending |
| NUB-03 | — | Pending |
| NUB-04 | — | Pending |
| CORE-01 | — | Pending |
| CORE-02 | — | Pending |
| SHIM-01 | — | Pending |
| SHIM-02 | — | Pending |
| SHIM-03 | — | Pending |
| DOC-01 | — | Pending |

**Coverage:**
- v0.16.0 requirements: 14 total
- Mapped to phases: 0
- Unmapped: 14 ⚠️

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 after initial definition*
