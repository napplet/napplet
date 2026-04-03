---
phase: 48
plan: 1
status: complete
started: "2026-04-02"
completed: "2026-04-02"
---

# Summary: 48-01 Update SPEC.md for v0.9.0 Handshake, Storage, and Security Model

## What Was Built

Updated SPEC.md Sections 2, 5, 14 (plus stale references in 13, 15, 16) to document the Phase 46 protocol changes.

## Key Changes

### Section 2: Authentication Handshake
- Replaced ephemeral keypair AUTH with three-phase REGISTER -> IDENTITY -> AUTH handshake
- Added new subsections: 2.2 Registration, 2.3 Identity Delegation, 2.8 Hash Verification, 2.9 Instance GUIDs
- Documented wire formats for `["REGISTER", {...}]` and `["IDENTITY", {...}]`
- Documented HMAC-SHA256(shellSecret, dTag + aggregateHash) key derivation
- Added pubkey mismatch rejection reason
- Removed old pubkey-based dTag derivation formula
- Added legacy ephemeral keypair fallback for pre-v0.9.0 shells
- Renumbered subsections 2.1-2.13

### Section 5: Storage Proxy
- Changed composite identity from (pubkey, dTag, aggregateHash) to (dTag, aggregateHash)
- Updated key format to `napplet-state:{dTag}:{aggregateHash}:{userKey}`
- Added legacy format migration note (triple-read fallback)
- Explained why pubkey was removed (storage destroyed on every reload)
- Documented storage persistence across page reloads

### Section 14: Security Model
- Added fifth threat model assumption (delegated keys confined to postMessage)
- Updated NIP-42 AUTH layer to reference shell-delegated deterministic keys
- Updated storage scoping layer to (dTag, aggregateHash)
- Added layer 9: Delegated key confinement
- Added Section 14.4: Delegated Key Threat Analysis (exfiltration, shell secret compromise, cross-shell isolation, HMAC collision resistance)

### Stale Reference Cleanup
- Updated Section 13 ACL composite key model (removed pubkey)
- Updated Section 13.6 manifest cache key
- Updated ACL persistence field descriptions
- Updated Section 15.3 composite key reference
- Updated minimal napplet example (Section 16) with REGISTER/IDENTITY flow
- Fixed RuntimeHooks/ShellHooks -> RuntimeAdapter/ShellAdapter

## Verification

All acceptance criteria pass:
- REGISTER appears 16 times, IDENTITY 12 times
- New key format `napplet-state:{dTag}:{aggregateHash}:{userKey}` present
- "delegated" appears 11 times across Sections 2 and 14
- HMAC-SHA256 documented in terminology, derivation, and threat analysis
- shellSecret documented with 32-byte specification
- pubkey mismatch listed as AUTH rejection reason
- Old parseInt formula removed from spec
- Section numbering consistent (2.1-2.13, 5.1-5.6, 14.1-14.4)
- `pnpm type-check` passes (16/16 tasks)

## Self-Check: PASSED

## key-files.modified
- SPEC.md
