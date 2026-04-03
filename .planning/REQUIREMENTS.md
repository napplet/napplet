# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-03
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.10.0 Requirements

Requirements for the Demo Consistency and Usability Pass. Each maps to roadmap phases.

### Transparency

- [ ] **TRANS-01**: User can view all protocol magic numbers (buffer sizes, timeouts, quotas, replay window, flash durations) in a dedicated constants panel
- [ ] **TRANS-02**: User can edit protocol constants at runtime with changes taking immediate effect
- [ ] **TRANS-03**: User can see what was rejected by ACL, why (which capability), and the full event context in the ACL detail panel
- [ ] **TRANS-04**: User can view all current restrictions and capabilities for a selected napplet in the detail panel

### Color Routing

- [ ] **COLOR-01**: Each topology edge half (in/out port) is colored by its own directional pass/fail state, not uniformly
- [ ] **COLOR-02**: Node color is derived as composite of its edge states (green = all pass, red = all fail, amber = mixed)
- [ ] **COLOR-03**: User can toggle per-message trace mode that animates individual messages through the graph hop-by-hop with fade

### Service & Capability Toggles

- [ ] **TOGL-01**: User can enable/disable any service (signer, notifications, audio, relay pool, cache) via the demo UI
- [ ] **TOGL-02**: User can toggle individual ACL capabilities (sign:event, sign:nip44, state:read, state:write, etc.) per napplet
- [ ] **TOGL-03**: ACL and service changes take effect live on the next message without requiring re-register

## Future Requirements

Deferred to future releases. Tracked but not in current roadmap.

### Protocol Hardening

- **HARD-01**: Restrictive ACL default mode (deny-by-default)
- **HARD-02**: Manifest signature verification in shell
- **HARD-03**: Rate limiting on signer requests with configurable thresholds

### Publishing

- **PUB-01**: npm publish all @napplet/* packages
- **PUB-02**: @napplet/create CLI / starter template
- **PUB-03**: Deploy demo as a production nsite

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom napplet loading in demo | Defer until built-in demo is fully accurate and debuggable |
| Mobile native wrapper | Web-first protocol, native later |
| Framework-specific bindings | SDK is framework-agnostic by design |
| NIP PR submission | Spec needs more iterations |
| Automated e2e tests for new UI features | Focus on shipping the UI; test coverage in a subsequent milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TRANS-01 | — | Pending |
| TRANS-02 | — | Pending |
| TRANS-03 | — | Pending |
| TRANS-04 | — | Pending |
| COLOR-01 | — | Pending |
| COLOR-02 | — | Pending |
| COLOR-03 | — | Pending |
| TOGL-01 | — | Pending |
| TOGL-02 | — | Pending |
| TOGL-03 | — | Pending |

**Coverage:**
- v0.10.0 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after initial definition*
