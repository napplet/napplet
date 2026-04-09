# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-09
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol -- and ship the spec + SDK so others can build on it.

## v0.20.0 Requirements

Implement the Keys NUB (napplet/nubs#9) -- bidirectional keyboard protocol with action registration, shell-delegated keybindings, and smart forwarding.

### NUB Type Package

- [x] **NUB-01**: Create `@napplet/nub-keys` package with typed message definitions per NUB-KEYS spec (keys.forward, keys.registerAction, keys.registerAction.result, keys.unregisterAction, keys.bindings, keys.action)
- [x] **NUB-02**: Package follows existing NUB pattern (tsup, ESM-only, barrel export, DOMAIN constant)

### Core Integration

- [ ] **CORE-01**: Add `'keys'` to `NubDomain` union and `NUB_DOMAINS` array in envelope.ts
- [ ] **CORE-02**: Add `keys` namespace to `NappletGlobal` type in types.ts (registerAction, unregisterAction, onAction)

### Shim Implementation

- [ ] **SHIM-01**: Delete `keyboard-shim.ts`, create `keys-shim.ts` implementing NUB-KEYS smart forwarding
- [ ] **SHIM-02**: Maintain local suppress list from `keys.bindings` messages; suppress bound keys, forward unbound
- [ ] **SHIM-03**: Safety guards: skip `isComposing`, skip bare modifiers, never suppress Tab/Shift+Tab
- [ ] **SHIM-04**: Install `window.napplet.keys` with `registerAction()`, `unregisterAction()`, `onAction()`

### SDK

- [ ] **SDK-01**: Add `keys` namespace to SDK wrapping `window.napplet.keys`
- [ ] **SDK-02**: Convenience `registerAction()` that auto-wires `onAction()` listener + suppress handling
- [ ] **SDK-03**: Re-export all `@napplet/nub-keys` message types

### Documentation

- [ ] **DOC-01**: `@napplet/nub-keys` README with message reference
- [ ] **DOC-02**: Update NIP-5D NUB domain table to include `keys`
- [ ] **DOC-03**: Update core, shim, and SDK READMEs for keys NUB

## Future Requirements

Deferred to future milestones.

### Keyboard Extensions

- **KEY-EXT-01**: Capture mode (keybinds:capture-start/end) -- let napplet enter a mode where all keystrokes are captured for rebinding UI
- **KEY-EXT-02**: Action categories/groups for shell keybinding UI
- **KEY-EXT-03**: `event.repeat` opt-in per action (e.g., arrow key repeat for scroll)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Shell-side keybinding management UI | Shell implementation concern, not SDK |
| Deferred TOPICS (audio, wm, future NUB) | Not part of keys NUB |
| nostrdb proxy conformance audit | Separate milestone |
| npm publish | Blocked on human npm auth (PUB-04) |
| Capture mode (keybinds:capture-start/end) | Deferred to future extension |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NUB-01 | Phase 88 | Complete |
| NUB-02 | Phase 88 | Complete |
| CORE-01 | Phase 89 | Pending |
| CORE-02 | Phase 89 | Pending |
| SHIM-01 | Phase 90 | Pending |
| SHIM-02 | Phase 90 | Pending |
| SHIM-03 | Phase 90 | Pending |
| SHIM-04 | Phase 90 | Pending |
| SDK-01 | Phase 91 | Pending |
| SDK-02 | Phase 91 | Pending |
| SDK-03 | Phase 91 | Pending |
| DOC-01 | Phase 92 | Pending |
| DOC-02 | Phase 92 | Pending |
| DOC-03 | Phase 92 | Pending |

**Coverage:**
- v0.20.0 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after roadmap creation*
