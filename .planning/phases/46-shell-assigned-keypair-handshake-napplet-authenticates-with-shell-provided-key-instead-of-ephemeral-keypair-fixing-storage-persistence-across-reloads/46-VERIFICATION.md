---
status: passed
phase: 46
phase_name: "Shell-Assigned Keypair Handshake"
verified_at: "2026-04-02"
---

# Phase 46 Verification: Shell-Assigned Keypair Handshake

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| AUTH-01 (REGISTER/IDENTITY verb constants and payload types) | PASS | VERB_REGISTER, VERB_IDENTITY in core/constants.ts; RegisterPayload, IdentityPayload in core/types.ts |
| AUTH-02 (Complete REGISTER->IDENTITY->AUTH handshake) | PASS | handleRegister() in runtime.ts derives keypair, sends IDENTITY, then sendChallenge() |
| AUTH-03 (AUTH pubkey must match delegated key) | PASS | handleAuth() checks `authEvent.pubkey !== registration.pubkey` |
| AUTH-04 (Shell secret persistence for deterministic derivation) | PASS | ShellSecretPersistence interface, getOrCreateShellSecret() in key-derivation.ts |
| VERIFY-01 (Shell-side hash verification in REGISTER handler) | PASS | handleRegister() calls hooks.hashVerifier.computeHash() when adapter provided |
| VERIFY-02 (Hash mismatch triggers user warning, not rejection) | PASS | onHashMismatch callback invoked on mismatch; registration proceeds |
| VERIFY-03 (Verification result caching) | PASS | ManifestCache.hasVerification/setVerification/getVerification in manifest-cache.ts |
| STORE-01 (Storage scoping removes ephemeral pubkey) | PASS | scopedKey(dTag, aggregateHash, userKey) — no pubkey parameter |
| STORE-02 (Triple-read migration for backward compat) | PASS | state-get tries new key, legacy with pubkey, old napp-state prefix |
| STORE-03 (state-clear and state-keys merge across formats) | PASS | Both handlers operate on both prefix and legacyPrefix |
| INST-01 (Persistent per-iframe GUID) | PASS | SessionEntry.instanceId, GuidPersistence interface, getInstanceId() |
| SEC-01 (Delegated keys blocked from external relay publish) | PASS | delegatedPubkeys Set + guard in handleEvent blocks non-bus-kind events |
| SEC-02 (Delegated keys used only for protocol auth) | PASS | Shim only uses delegated key for AUTH signing; signer proxy uses user's signer |

## Success Criteria Verification

1. **Napplet sends REGISTER, receives IDENTITY, completes AUTH** -- PASS
   - Shim sends `[VERB_REGISTER, { dTag, claimedHash }]` on load
   - Runtime derives keypair via HMAC-SHA256, sends `[VERB_IDENTITY, payload]`
   - Shim receives IDENTITY, stores keypair, uses it for NIP-42 AUTH

2. **Same napplet reads storage after page reload** -- PASS
   - Storage key is `napplet-state:{dTag}:{aggregateHash}:{userKey}` — no ephemeral pubkey
   - Same dTag + same aggregateHash = same storage, regardless of session

3. **Different aggregateHash = isolated storage** -- PASS
   - Different aggregateHash produces different storage prefix and different keypair

4. **Shell shows user warning on hash mismatch** -- PASS
   - HashVerifierAdapter.computeHash() called in REGISTER handler
   - onHashMismatch callback fired when computed != declared

5. **Delegated key cannot publish to external relays** -- PASS
   - SEC-01 guard in handleEvent blocks all non-bus-kind events from delegated pubkeys
   - User's signer (NIP-07/NIP-46) is the only event source for relay publishing

## Automated Checks

- `pnpm build` -- 15/15 packages pass
- `pnpm type-check` -- 16/16 packages pass
- `pnpm --filter @napplet/runtime test:unit` -- 46/46 tests pass
- No new TypeScript errors introduced

## must_haves (from all plans)

### Plan 01
- [x] VERB_REGISTER and VERB_IDENTITY constants exported from @napplet/core
- [x] RegisterPayload and IdentityPayload interfaces exported from @napplet/core
- [x] ShellSecretPersistence adapter added to RuntimeAdapter
- [x] HashVerifierAdapter and onHashMismatch callback added to RuntimeAdapter

### Plan 02
- [x] scopedKey() signature is (dTag, aggregateHash, userKey) with NO pubkey parameter
- [x] New storage format is napplet-state:{dTag}:{aggregateHash}:{userKey}
- [x] Triple-read migration in state-get
- [x] state-keys merges and deduplicates across both formats
- [x] cleanupNappState clears both key formats

### Plan 03
- [x] GuidPersistence adapter interface with get/set/remove methods
- [x] SessionEntry has instanceId: string field
- [x] SessionRegistry has getInstanceId(windowId) method

### Plan 04
- [x] key-derivation.ts with derivePrivateKey using HMAC-SHA256
- [x] getOrCreateShellSecret generates and persists 32-byte secret
- [x] Runtime handles REGISTER verb
- [x] Runtime verifies AUTH pubkey matches delegated key
- [x] Runtime blocks delegated key events from external relays (SEC-01)
- [x] Shim sends REGISTER on load instead of creating ephemeral keypair
- [x] Shim handles IDENTITY and stores delegated keypair
- [x] Shim falls back to ephemeral keypair for backward compat
- [x] Shell adapter provides localStorage-backed persistence

### Plan 05
- [x] ManifestCache has verification cache methods
- [x] REGISTER handler calls hashVerifier when adapter provided
- [x] Hash mismatch triggers warning but does NOT block registration
- [x] Missing hashVerifier gracefully skips verification
- [x] All new types exported from @napplet/runtime index
