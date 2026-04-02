# Phase 48: Specification & Documentation - Research

**Researched:** 2026-04-02
**Status:** Complete

## RESEARCH COMPLETE

## 1. Current SPEC.md Structure (Sections to Update)

### Section 2: Authentication Handshake [LOCKED] (Lines 207-338)

**Current state:** Documents ephemeral keypair AUTH flow only. No mention of REGISTER or IDENTITY verbs.

**Key subsections:**
- 2.1 Overview — Says "shell verifies signature and registers the napplet's ephemeral pubkey"
- 2.2 Sequence — 7-step flow starting with shell AUTH challenge. Step 2 says "Napplet generates ephemeral keypair" and "keypair MUST NOT be persisted across page loads"
- 2.3 Napp Type Resolution — meta tag for napplet type
- 2.4 Aggregate Hash Resolution — meta tag for aggregate hash
- 2.5 dTag Derivation — derives dTag from pubkey + type (formula: `parseInt(pubkey.slice(0, 8), 16).toString(36) + nappletType`)
- 2.6 Hybrid Verification Model — verify once, trust source
- 2.8 Pre-AUTH Message Queueing — queue cap at 50
- 2.9 Compatibility Check (post-AUTH)
- 2.10 Undeclared Service Consent

**What needs to change:**
1. New subsection for REGISTER verb (before 2.2 or as new 2.2, shifting existing)
2. New subsection for IDENTITY verb (shell -> napplet)
3. Update 2.2 Sequence to reflect REGISTER -> IDENTITY -> AUTH flow
4. Update 2.1 Overview to reference delegated keypairs
5. Update 2.5 dTag Derivation — dTag now comes from REGISTER payload, not derived from pubkey
6. Add shell secret concept and deterministic key derivation
7. Mark ephemeral keypair as legacy fallback

### Section 5: Storage Proxy [OPEN] (Lines 543-634)

**Current state:** Documents storage scoped by `(pubkey, dTag, aggregateHash)`.

**Key subsections:**
- 5.1 Overview — says composite identity `(pubkey, dTag, aggregateHash)`
- 5.2 Request-Response Protocol — kind 29003 events
- 5.3 Operations — table of shell:state-* topics
- 5.4 Quota Enforcement — 512 KB default
- 5.5 Key Scoping — format `napplet-state:{pubkey}:{dTag}:{aggregateHash}:{userKey}`
- 5.6 Identity Isolation — aggregateHash change = new namespace

**What needs to change:**
1. 5.1 Overview — remove pubkey from composite identity, explain why
2. 5.5 Key Scoping — change format to `napplet-state:{dTag}:{aggregateHash}:{userKey}`
3. 5.6 Identity Isolation — update to explain that same dTag+aggregateHash persists across reloads (the whole point)
4. Add note about legacy key migration (triple-read fallback in implementation)

### Section 14: Security Model [LOCKED] (Lines 1105-1141)

**Current state:** 3 subsections. Mentions ephemeral pubkey and storage scoping by `(pubkey, dTag, aggregateHash)`.

**Key subsections:**
- 14.1 Threat Model — 4 assumptions
- 14.2 Security Layers — 8 numbered layers
- 14.3 What Protocol Does NOT Protect Against — 4 items

**What needs to change:**
1. 14.1 Threat Model — add assumption about delegated keys
2. 14.2 Security Layers — update layer 2 (NIP-42 AUTH) to reference delegated keys, update layer 8 (Storage scoping) to remove pubkey
3. Add new subsection 14.4 for delegated key security model:
   - Delegated keys are protocol-auth-only
   - They never sign events published to external relays
   - Key exfiltration threat analysis (harmless — no relay has seen the pubkey)
   - Shell secret compromise analysis
   - HMAC derivation security properties

## 2. Implemented Code (Source of Truth)

### REGISTER/IDENTITY Wire Format

From `@napplet/core/types.ts`:

```
REGISTER verb: ['REGISTER', { dTag: string, claimedHash: string }]
IDENTITY verb: ['IDENTITY', { pubkey: string, privkey: string, dTag: string, aggregateHash: string }]
```

Constants in `@napplet/core/constants.ts`:
```
VERB_REGISTER = 'REGISTER'
VERB_IDENTITY = 'IDENTITY'
```

### Handshake Flow (from runtime.ts + shim/index.ts)

1. **Shim init:** Reads meta tags, sends `['REGISTER', { dTag, claimedHash }]` to parent
2. **Runtime handleRegister:** Validates payload, derives keypair via `deriveKeypair(shellSecret, dTag, aggregateHash)`, assigns instance GUID, optionally runs hash verification, sends `['IDENTITY', payload]` to napplet, then sends AUTH challenge
3. **Shim IDENTITY handler:** Stores delegated keypair, resolves keypairReady promise
4. **Shim handleAuthChallenge:** Uses delegated keypair to sign kind 22242 AUTH event (falls back to ephemeral if no IDENTITY received)
5. **Runtime handleAuth:** Verifies AUTH pubkey matches delegated pubkey from REGISTER step

### Key Derivation (from key-derivation.ts)

```
seed = HMAC-SHA256(shellSecret, TextEncoder.encode(dTag + aggregateHash))
pubkey = schnorr.getPublicKey(seed)
```

Shell secret: 32-byte random value, generated once, persisted via `ShellSecretPersistence` interface.

### Storage Scoping (from state-handler.ts)

New format: `napplet-state:{dTag}:{aggregateHash}:{userKey}`
Legacy format: `napplet-state:{pubkey}:{dTag}:{aggregateHash}:{userKey}` (read-only fallback)

Triple-read on `state-get`: new format -> legacy with pubkey -> old `napp-state:` prefix

### Delegated Key Security (from runtime.ts)

`delegatedPubkeys` Set tracks all delegated pubkeys. In EVENT handler:
- If event.pubkey is in delegatedPubkeys AND kind is not an internal bus kind (signer request/response, IPC_PEER, hotkey, etc.) -> reject with "blocked: delegated keys cannot publish to external relays — use signer proxy"

### Hash Verification (from runtime.ts)

- Cached by `manifestEventId = dTag:aggregateHash`
- manifestCache stores `VerificationCacheEntry { aggregateHash, valid, verifiedAt }`
- On mismatch: calls `hooks.onHashMismatch(dTag, claimed, computed)`

### Instance GUIDs

- `GuidPersistence` interface for storage
- In-memory fallback if not provided
- Assigned during REGISTER handling
- UUID v4 format (from crypto.randomUUID or fallback)

## 3. Phase 46 Decisions (from CONTEXT.md) Mapped to Spec Sections

| Decision | Spec Section | What to Document |
|----------|-------------|-----------------|
| D-01: Storage scoping removes pubkey | Section 5 | New key format, migration note |
| D-02: Shell delegates stable keypair | Section 2 | REGISTER/IDENTITY verbs, full handshake sequence |
| D-03: Per-iframe persistent GUID | Section 2 | Instance identity concept (brief mention) |
| D-04: Shell verifies aggregate hash | Section 2 | Hash verification step in handshake |
| D-05: Verification cached by event ID | Section 2 | Caching note |
| D-06: Spec = wire format only | N/A | Guides what goes in spec vs not |
| D-07: Delegated keys protocol-auth-only | Section 14 | Full threat analysis subsection |
| D-08: Deterministic HMAC derivation | Section 2, 14 | Derivation formula, security properties |

## 4. Plan Structure Recommendation

This is a documentation-only phase with 3 requirements mapping to 3 SPEC.md sections. Recommend:

- **1 plan, 1 wave** — All 3 sections are in a single file (SPEC.md). No build, no tests. A single plan with 3 tasks (one per section) is the natural decomposition.
- Alternatively, 3 plans in 1 wave for parallel execution — but since they all edit the same file, parallel editing would cause merge conflicts. Single plan is better.

---

*Phase: 48-specification-documentation*
*Research completed: 2026-04-02*
