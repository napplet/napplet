# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-09
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.19.0 Requirements

Execute all "drop" verdicts from the v0.18.0 spec conformance audit (SPEC-GAPS.md).

### Code Drops

- [ ] **DROP-01**: Delete `Capability` type and `ALL_CAPABILITIES` constant from core/types.ts and core/index.ts
- [ ] **DROP-02**: Delete 7 superseded TOPICS (AUTH_IDENTITY_CHANGED, STATE_GET, STATE_SET, STATE_REMOVE, STATE_CLEAR, STATE_KEYS, STATE_RESPONSE) from core/topics.ts
- [ ] **DROP-03**: Delete 3 config TOPICS (SHELL_CONFIG_GET, SHELL_CONFIG_UPDATE, SHELL_CONFIG_CURRENT) from core/topics.ts
- [ ] **DROP-04**: Delete 3 scoped relay TOPICS (RELAY_SCOPED_CONNECT, RELAY_SCOPED_CLOSE, RELAY_SCOPED_PUBLISH) from core/topics.ts
- [ ] **DROP-05**: Delete `SHELL_BRIDGE_URI` from core/constants.ts and core/index.ts
- [ ] **DROP-06**: Delete `REPLAY_WINDOW_SECONDS` from core/constants.ts and core/index.ts
- [ ] **DROP-07**: Delete `PROTOCOL_VERSION` from core/constants.ts and core/index.ts
- [ ] **DROP-08**: Update core/index.test.ts — remove tests for deleted exports
- [ ] **DROP-09**: Verify `pnpm build && pnpm type-check` passes clean after all deletions

## Future Requirements

Deferred to future milestones.

### v0.20.0 Keys NUB

- **KEYS-01**: Keys NUB protocol — bidirectional keybinding protocol (napplet registers actions, shell binds keys, napplet suppresses forwarding for bound keys)
- **KEYS-02**: SDK convenience — auto-listener setup, forward suppression, handler binding for shell-delegated keybinds

## Out of Scope

| Feature | Reason |
|---------|--------|
| Deferred TOPICS (keybinds, audio, wm, future NUB) | Kept per v0.18.0 decision — not dropped |
| nostrdb proxy conformance audit | Deferred to future milestone |
| NIP-5D spec amendment for keyboard | Deferred to v0.20.0 keys NUB |
| npm publish | Blocked on human npm auth (PUB-04) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DROP-01 | — | Pending |
| DROP-02 | — | Pending |
| DROP-03 | — | Pending |
| DROP-04 | — | Pending |
| DROP-05 | — | Pending |
| DROP-06 | — | Pending |
| DROP-07 | — | Pending |
| DROP-08 | — | Pending |
| DROP-09 | — | Pending |

**Coverage:**
- v0.19.0 requirements: 9 total
- Mapped to phases: 0
- Unmapped: 9 ⚠️

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after initial definition*
