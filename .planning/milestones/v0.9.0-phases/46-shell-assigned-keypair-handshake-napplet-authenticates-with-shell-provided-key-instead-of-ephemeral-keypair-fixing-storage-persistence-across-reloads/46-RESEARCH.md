# Phase 46: Shell-Assigned Keypair Handshake - Research

**Researched:** 2026-04-02
**Status:** Complete

## Objective

Research how to implement REGISTER/IDENTITY/AUTH handshake, storage rekeying, aggregate hash verification, instance GUIDs, and delegated key security for Phase 46.

## Current Architecture Analysis

### 1. Ephemeral Keypair Flow (What Must Change)

**File:** `packages/shim/src/napplet-keypair.ts`
- `createEphemeralKeypair()` calls `generateSecretKey()` + `getPublicKey()` from nostr-tools
- Creates a fresh random keypair on every page load
- Used in `packages/shim/src/index.ts` at line 359 (eager init) and line 222 (AUTH fallback)

**File:** `packages/shim/src/index.ts`
- `handleAuthChallenge()` (line 220): Creates keypair if null, signs AUTH event with ephemeral key
- AUTH event includes tags: `relay`, `challenge`, `type`, `version`, `aggregateHash`
- After AUTH, subscribes to signer responses and NIPDB responses
- `sendEvent()` (line 123): Finalizes events with ephemeral keypair privkey

**Problem:** Every page reload = new pubkey = new ACL identity = broken storage persistence. The SEED-001 document describes this exact issue.

### 2. Storage Scoping (What Must Change)

**File:** `packages/runtime/src/state-handler.ts`
- `scopedKey(pubkey, dTag, aggregateHash, userKey)` returns `napplet-state:${pubkey}:${dTag}:${aggregateHash}:${userKey}`
- `handleStateRequest()` builds prefix as `napplet-state:${pubkey}:${dTag}:${aggregateHash}:`
- `cleanupNappState()` uses same prefix pattern
- Dual-read migration already exists for `napp-state:` -> `napplet-state:` prefix (line 93-95)

**File:** `packages/runtime/src/acl-state.ts`
- ACL keyed by `${pubkey}:${dTag}:${hash}` via `toIdentity()` -> `@napplet/acl`
- `@napplet/acl` Identity type has `{ pubkey, dTag, hash }`

**Impact of removing pubkey from storage:** The `scopedKey()` function and all prefix computations must drop pubkey. ACL will naturally work because the delegated key is deterministic — same napplet+version+shell always gets the same pubkey.

### 3. AUTH Handshake (What Must Change)

**File:** `packages/runtime/src/runtime.ts` (lines 207-327)
- `handleAuth()` processes AUTH event after challenge
- Extracts `type` tag, derives `dTag = parseInt(pubkey.slice(0, 8), 16).toString(36) + nappletType`
- Extracts `aggregateHash` tag, registers in sessionRegistry
- Currently trusts whatever aggregateHash the napplet declares — no verification

**New handshake sequence (from CONTEXT.md D-02):**
1. Napplet -> Shell: `REGISTER { dTag, claimedHash }` (new message before AUTH)
2. Shell validates hash (D-04), derives keypair (D-08)
3. Shell -> Napplet: `IDENTITY { pubkey, privkey, dTag, hash }` (new message)
4. Napplet stores received keypair, uses it for standard NIP-42 AUTH
5. Standard AUTH flow continues as today

### 4. Manifest/Hash Verification (What Must Change)

**File:** `packages/runtime/src/manifest-cache.ts`
- Caches by `pubkey:dTag`, stores `aggregateHash` and `verifiedAt`
- No actual verification — just trusts the declared hash

**File:** `packages/vite-plugin/src/index.ts`
- `computeAggregateHash()` at line 49: Takes `[sha256hex, relativePath]` pairs, sorts `${hash} ${path}\n` lines, SHA-256s the concatenation
- This same algorithm must be reproduced in the runtime for shell-side verification

**Verification flow (D-04):**
1. Shell receives REGISTER with claimedHash
2. Shell fetches napplet files (the runtime's host must provide this capability)
3. Shell computes aggregate hash from fetched blobs using same algorithm as vite-plugin
4. Compare computed hash vs claimed hash
5. Match -> proceed; Mismatch -> user warning

### 5. ACL System Impact

**File:** `packages/acl/src/types.ts`
- `Identity { pubkey, dTag, hash }` — composite key
- With deterministic keypairs, pubkey becomes stable per napplet+version+shell
- ACL entries will persist across page reloads (the whole point)

**File:** `packages/shell/src/acl-store.ts`
- Shell-side singleton ACL store uses `pubkey:dTag:aggregateHash` as key
- This already works correctly with deterministic keys — no changes needed to ACL logic itself

### 6. Session Registry Impact

**File:** `packages/runtime/src/session-registry.ts`
- Maps `windowId -> pubkey` and `pubkey -> SessionEntry`
- `SessionEntry` contains `{ pubkey, windowId, origin, type, dTag, aggregateHash, registeredAt }`
- With deterministic keys, the pubkey mapping becomes meaningful across reloads

## Technical Design

### New Message Types

#### REGISTER (Napplet -> Shell)
```
["REGISTER", { "dTag": "<napplet-type>", "claimedHash": "<aggregate-hash-or-empty>" }]
```
- Sent by napplet before AUTH, as the first message after iframe loads
- `dTag` is the napplet type from `<meta name="napplet-type">`
- `claimedHash` is from `<meta name="napplet-aggregate-hash">` (empty in dev mode)

#### IDENTITY (Shell -> Napplet)
```
["IDENTITY", { "pubkey": "<hex>", "privkey": "<hex>", "dTag": "<napplet-type>", "aggregateHash": "<verified-hash>" }]
```
- Shell sends after validating the REGISTER
- Contains the deterministic keypair for this napplet+version+shell
- privkey is 64-char hex string (32 bytes)
- Napplet stores this and uses it for all subsequent crypto operations

### Key Derivation (D-08)

```typescript
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';

function deriveNappletKeypair(shellSecret: Uint8Array, dTag: string, aggregateHash: string): { privkey: Uint8Array, pubkey: string } {
  const input = new TextEncoder().encode(dTag + aggregateHash);
  const seed = hmac(sha256, shellSecret, input);  // HMAC-SHA256
  // seed is 32 bytes — valid as secp256k1 private key (with high probability)
  const pubkey = getPublicKey(seed);
  return { privkey: seed, pubkey };
}
```

**Note:** nostr-tools depends on @noble/hashes, so HMAC-SHA256 is available without new deps.

### Shell Secret (AUTH-04)

- Generated once on first use: `crypto.getRandomValues(new Uint8Array(32))`
- Stored in localStorage under key `napplet-shell-secret`
- Exposed via a new `RuntimeAdapter` method or persistence hook
- Per-shell instance — different shells get different secrets

### Storage Rekeying (STORE-01, STORE-02, STORE-03)

**Before:** `napplet-state:{pubkey}:{dTag}:{aggregateHash}:{userKey}`
**After:** `napplet-state:{dTag}:{aggregateHash}:{userKey}`

Changes needed:
1. `state-handler.ts`: Update `scopedKey()` to drop pubkey parameter
2. `state-handler.ts`: Update `handleStateRequest()` prefix computation
3. `state-handler.ts`: Update `cleanupNappState()` prefix
4. Migration: Add dual-read for old `napplet-state:{pubkey}:...` keys (similar to existing `napp-state:` migration)

### Aggregate Hash Verification (VERIFY-01, VERIFY-02, VERIFY-03)

The shell/runtime needs a new adapter method:
```typescript
interface RuntimeAdapter {
  // ... existing ...
  
  /** Fetch napplet files and compute aggregate hash for verification. */
  hashVerifier?: {
    /** Compute aggregate hash from fetched napplet files. Returns the hash, or null if files cannot be fetched. */
    computeAggregateHash(manifestEventId: string, files: Array<{ path: string; url: string }>): Promise<string | null>;
    /** Called when hash verification fails. */
    onHashMismatch?(dTag: string, claimed: string, computed: string): void;
  };
}
```

**Verification cache (D-05):**
```typescript
interface VerificationResult {
  aggregateHash: string;
  valid: boolean;
  verifiedAt: number;
}
// Keyed by manifest event ID — immutable events mean same ID = same content
const verificationCache = new Map<string, VerificationResult>();
```

### Instance GUID (INST-01)

- Shell assigns a GUID per iframe slot: `crypto.randomUUID()`
- Persists in a registry keyed by some stable iframe identifier (src origin or slot position)
- Survives page reloads (same tab/slot = same GUID)
- Used for multi-instance disambiguation, not for storage scoping

**Implementation location:** Runtime-level, stored via a new persistence hook or in the session registry.

### Delegated Key Security (SEC-01, SEC-02)

**Current publish flow in runtime.ts:**
```
napplet EVENT -> runtime handleEvent() -> enforce ACL -> 
  if IPC_PEER: route internally
  if regular kind: relayPool.publish(event) — event is signed by user's signer
```

The napplet's delegated key is only used for:
1. Signing the AUTH response (kind 22242)
2. Signing signer requests (kind 29001) — these are protocol messages, not relay events
3. Signing IPC-PEER events (kind 29003) — internal bus, never published to relays

For SEC-01/SEC-02: The runtime must explicitly block publishing events signed by delegated keys to external relays. Currently, `handleEvent()` checks if the event kind is a standard relay event and routes to `relayPool.publish()`. The publish path already goes through `hooks.auth.getSigner()` for the user's signer — the napplet's delegated key is NOT in the chain. But we should add an explicit guard: if the event's pubkey matches a delegated napplet key, reject relay publishing.

## Dependency Analysis

### nostr-tools Dependencies
- `generateSecretKey()`, `getPublicKey()` from `nostr-tools/pure` — already used in shim
- HMAC-SHA256 available via `@noble/hashes` (transitive dep of nostr-tools)
- `bytesToHex()`, `hexToBytes()` from `nostr-tools/utils` — for key serialization

### Package Boundaries
- **@napplet/core**: New message type constants (`REGISTER`, `IDENTITY` verbs)
- **@napplet/runtime**: Key derivation, verification logic, updated AUTH handler, updated state-handler, shell secret management
- **@napplet/shim**: Replace `createEphemeralKeypair()` with `REGISTER` + `IDENTITY` listener, accept delegated keypair
- **@napplet/shell**: Shell adapter changes to expose new runtime features (GUID management, shell secret persistence)

### Files Modified (Exhaustive)

| File | Changes | Requirement |
|------|---------|-------------|
| `packages/core/src/constants.ts` | Add REGISTER/IDENTITY verb constants | AUTH-01 |
| `packages/core/src/types.ts` | Add RegisterMessage, IdentityMessage types | AUTH-01, AUTH-02 |
| `packages/shim/src/index.ts` | Replace eager keypair with REGISTER + IDENTITY listener | AUTH-01, AUTH-02, AUTH-03 |
| `packages/shim/src/napplet-keypair.ts` | Remove or repurpose (no more ephemeral generation) | AUTH-02, AUTH-03 |
| `packages/runtime/src/runtime.ts` | Add REGISTER handler, IDENTITY sender, key derivation, updated AUTH flow | AUTH-01, AUTH-02, AUTH-03, AUTH-04, SEC-01, SEC-02 |
| `packages/runtime/src/state-handler.ts` | Remove pubkey from scopedKey(), update prefix | STORE-01, STORE-02, STORE-03 |
| `packages/runtime/src/manifest-cache.ts` | Add verification result caching | VERIFY-03 |
| `packages/runtime/src/types.ts` | Add ShellSecretPersistence, HashVerifierAdapter, VerificationCacheEntry types | AUTH-04, VERIFY-01, VERIFY-02, VERIFY-03 |
| `packages/runtime/src/session-registry.ts` | Add GUID tracking to SessionEntry | INST-01 |
| `packages/shell/src/shell-bridge.ts` | Wire new runtime features | AUTH-01, AUTH-02 |
| `packages/shell/src/hooks-adapter.ts` | Adapt new persistence hooks | AUTH-04 |
| `tests/e2e/auth-handshake.spec.ts` | Update for REGISTER/IDENTITY flow | AUTH-01, AUTH-02, AUTH-03 |
| `tests/e2e/state-isolation.spec.ts` | Update for new storage scoping | STORE-01, STORE-02, STORE-03 |

## Risk Analysis

### High Risk
- **Storage migration**: Existing stored data under old `napplet-state:{pubkey}:...` keys will become inaccessible. Need dual-read migration path (already have precedent with `napp-state:` migration).
- **Breaking handshake change**: All existing napplets must be updated to send REGISTER before AUTH. Backward compat needed for dev mode.

### Medium Risk
- **Key derivation edge cases**: HMAC output must be a valid secp256k1 private key. SHA-256 output is 32 bytes; the secp256k1 order is slightly less than 2^256, so there's a negligible chance (~3.7 * 10^-39) of an invalid key. Can add retry logic but practically unnecessary.
- **Aggregate hash verification timing**: Fetching files and computing hashes is async and potentially slow. The REGISTER handler must handle this gracefully.

### Low Risk  
- **GUID persistence**: Simple localStorage key — well-understood pattern.
- **ACL compatibility**: Deterministic keys mean ACL just works — same key = same entry.

## Validation Architecture

### Dimension 1: Correctness
- Same napplet+version+shell -> same keypair (determinism test)
- Different aggregateHash -> different keypair (isolation test)
- Storage survives page reload with same dTag+hash
- Storage isolated between different aggregateHash values

### Dimension 2: Security
- Delegated key events never published to external relays
- Only user's signer produces relay-published events
- Shell secret not leaked to napplets (only derived key is sent)
- HMAC key derivation is cryptographically sound

### Dimension 3: Protocol Conformance
- REGISTER -> IDENTITY -> AUTH sequence completes successfully
- Standard NIP-42 AUTH flow preserved after IDENTITY
- Error cases: missing dTag, hash mismatch, invalid signature

### Dimension 4: Backward Compatibility
- Old `napplet-state:{pubkey}:...` keys readable via dual-read migration
- Dev mode (empty aggregateHash) still works
- Napplets that send AUTH without REGISTER get a clear error

## RESEARCH COMPLETE
