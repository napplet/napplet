# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-08
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.18.0 Requirements

Requirements for the Spec Conformance Audit milestone. Organized into four categories: dead code removal, spec gap inventory, stale documentation cleanup, and final decision gate.

### Dead Code Removal

- [ ] **DEAD-01**: Remove `RegisterPayload` and `IdentityPayload` types from core/types.ts and core/index.ts exports
- [ ] **DEAD-02**: Remove `getNappletType()` function from shim/index.ts (defined, never called)
- [ ] **DEAD-03**: Delete `shim/types.ts` file (dead re-export of PROTOCOL_VERSION and SHELL_BRIDGE_URI, nothing imports it)
- [ ] **DEAD-04**: Make `nipdbSubscribeHandlers` / `nipdbSubscribeCancellers` private in nipdb-shim.ts (exported but only used internally)
- [ ] **DEAD-05**: Remove or update tests for deleted exports in core/index.test.ts

### Spec Gap Inventory

Each item must be documented with: location, what it does, evidence of no spec backing, and a recommendation category (future NUB, unknown, superseded, shell-only).

- [ ] **GAP-01**: Document `Capability` type + `ALL_CAPABILITIES` constant — ACL string union in core/types.ts, not in NIP-5D or any NUB spec, shell runtime concern
- [ ] **GAP-02**: Document `TOPICS` constant (28 IPC topic strings) in core/topics.ts — broken down by fate:
  - **Future NUB messages** (PR coming): `chat:open-dm`, `profile:open`, `stream:*`
  - **Unknowns** (no clear home): `keybinds:*`, `audio:*`, `wm:*`, `shell:config-*`
  - **Superseded** (replaced by storage.* NUB): `STATE_*`, `STATE_RESPONSE`
  - **Superseded** (AUTH removed): `AUTH_IDENTITY_CHANGED`
  - **Unknown**: `RELAY_SCOPED_*` (scoped relay ops)
- [ ] **GAP-03**: Document `SHELL_BRIDGE_URI` constant in core/constants.ts — "napplet://shell", references NIP-42 AUTH which was removed
- [ ] **GAP-04**: Document `REPLAY_WINDOW_SECONDS` constant in core/constants.ts — replay protection, shell implementation detail not in NIP-5D
- [ ] **GAP-05**: Document `PROTOCOL_VERSION` constant in core/constants.ts — "4.0.0", NIP-5D doesn't define a version constant
- [ ] **GAP-06**: Document `window.nostrdb` proxy in shim/nipdb-shim.ts — entire parallel protocol for NIP-DB local cache, not a NUB, not in NIP-5D
- [ ] **GAP-07**: Document `keyboard.forward` shim in shim/keyboard-shim.ts — hotkey forwarding protocol, not a NUB, not in NIP-5D
- [ ] **GAP-09**: Document IFC channel types (9 message types) in nub-ifc/types.ts — `ifc.channel.*` messages defined but never implemented in shim

### Stale Documentation Cleanup

- [ ] **DOC-01**: Fix SDK README — remove references to "services" namespace
- [ ] **DOC-02**: Fix vite-plugin README — remove `window.napplet.services.has()` references, update to `shell.supports('svc:...')`
- [ ] **DOC-03**: Fix core README — NubDomain table lists 4 domains but code has 5 (theme)
- [ ] **DOC-04**: Fix core envelope.ts JSDoc — NubDomain table lists 4 domains, references nonexistent D-02/D-03 decision IDs
- [ ] **DOC-05**: Remove `window.napplet.services.has()` from NIP-5D.md — replaced by `shell.supports('svc:...')`

### Final Decision Gate

- [ ] **DECIDE-01**: Present full documented gap inventory for drop-or-amend decisions on each GAP item

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Spec Alignment

- **ALIGN-01**: Implement `shell.supports()` properly (currently a stub returning false) — depends on shell-side capability population mechanism
- **ALIGN-02**: Formalize NUB governance (NUB-01/02/03) and create napplets org/repo

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Dropping any beyond-spec code | This milestone documents gaps; drop/amend decisions happen in DECIDE-01 |
| Implementing missing spec features | shell.supports() implementation is a shell-side concern |
| NUB spec authoring | NUB specs live in napplet/nubs repo, not here |
| npm publish | Blocked on human npm auth (PUB-04), orthogonal to this audit |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEAD-01 | — | Pending |
| DEAD-02 | — | Pending |
| DEAD-03 | — | Pending |
| DEAD-04 | — | Pending |
| DEAD-05 | — | Pending |
| GAP-01 | — | Pending |
| GAP-02 | — | Pending |
| GAP-03 | — | Pending |
| GAP-04 | — | Pending |
| GAP-05 | — | Pending |
| GAP-06 | — | Pending |
| GAP-07 | — | Pending |
| GAP-09 | — | Pending |
| DOC-01 | — | Pending |
| DOC-02 | — | Pending |
| DOC-03 | — | Pending |
| DOC-04 | — | Pending |
| DOC-05 | — | Pending |
| DECIDE-01 | — | Pending |

**Coverage:**
- v0.18.0 requirements: 19 total
- Mapped to phases: 0
- Unmapped: 19 ⚠️

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after initial definition*
