# Phase 46: Shell-Assigned Keypair Handshake - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix storage persistence by removing ephemeral pubkey from storage scoping and adding shell-side aggregate hash verification. The napplet's persistent identity becomes `dTag:aggregateHash` (type + version), with per-iframe GUIDs for instance identity. The ephemeral keypair is replaced by a shell-delegated stable keypair used solely for NIP-01 protocol authentication — never for publishing to external relays. The user's signer (NIP-07/NIP-46) remains the only source of events published to real relays.

This is a protocol-level change affecting SPEC.md, @napplet/runtime, @napplet/shim, and potentially @napplet/shell.

</domain>

<decisions>
## Implementation Decisions

### Storage Identity (DECIDED)

- **D-01:** Storage scoping changes from `napplet-state:{pubkey}:{dTag}:{aggregateHash}:{userKey}` to `napplet-state:{dTag}:{aggregateHash}:{userKey}`. The ephemeral pubkey is removed from the storage key. This means the same napplet type+version persists storage across page reloads. Different versions (different aggregateHash) get isolated storage.

### Keypair Delegation (DECIDED)

- **D-02:** Shell delegates a stable keypair to the napplet (Variant A). The handshake adds two new messages before standard NIP-42:
  1. Napplet → Shell: `REGISTER { dTag, claimedHash }` — napplet announces its identity
  2. Shell validates aggregate hash (D-04), derives keypair from `HMAC(shellSecret, dTag + aggregateHash)`, sends Shell → Napplet: `IDENTITY { pubkey, privkey, dTag, hash }`
  3. Standard NIP-42 AUTH follows — napplet signs with delegated key
  
  The delegated key exists so the napplet speaks native NIP-01 over postMessage. If the shell held the key and signed everything, you'd have a proxy and the keypair would be pointless.

### Delegated Key Scope (DECIDED)

- **D-07:** Napplet delegated keys are for protocol authentication ONLY — they NEVER sign events published to external relays. The user's signer (NIP-07/NIP-46) is the only thing that produces events leaving the shell. The flow is: napplet requests publish → shell checks ACL → shell asks user's signer to sign → shell publishes to relays. The delegated key is nowhere in the relay publishing chain. This means even if a malicious napplet exfiltrates its delegated key via `fetch()`, there's nothing useful to do with it — no relay has ever seen that pubkey, and the napplet key should be blocked from publishing to remote relays by default.

### Key Derivation (DECIDED)

- **D-08:** Shell derives the keypair deterministically: `seed = HMAC(shellSecret, dTag + aggregateHash)`, `keypair = ed25519(seed)`. This means the same napplet type+version always gets the same keypair from the same shell. Different users (different shellSecret) get different keypairs for the same napplet. The `shellSecret` is a per-shell persistent secret, not the user's nsec.

### Instance Identity (DECIDED)

- **D-03:** Each iframe gets a persistent GUID assigned by the shell/runtime. The GUID survives page reloads (same tab/slot = same GUID). This prevents multi-instance storage collisions when two iframes of the same napplet type run simultaneously. The runtime may enforce singleton policies ("only one of this napplet type allowed") as an implementation decision, not a protocol requirement.

### Aggregate Hash Verification (DECIDED)

- **D-04:** The shell verifies the napplet's declared aggregate hash by computing it from the actual fetched files (blobs). Two-step validation:
  1. Verify the manifest is a valid Nostr event with a valid signature
  2. Fetch napplet files, compute aggregate hash, compare to declared hash
  - Match → proceed to AUTH (verified identity, still untrusted permissions)
  - Mismatch → user warning ("napplet files don't match declared identity — buggy build, modified, or fake manifest")

### Verification Caching (DECIDED)

- **D-05:** Verification results are cached keyed by manifest event ID. Since Nostr events are immutable (same event ID = same content), the shell only recomputes the aggregate hash when the event ID changes. On subsequent loads with the same event ID, cached verification is used and hash computation is skipped.

### Spec vs Implementation Boundary (DECIDED)

- **D-06:** The NIP-5A spec defines the `napplet <-> shell` wire format. Everything else — ACL policy, singleton enforcement, instance tracking, verification caching — is implementation-level behavior in the runtime/shell packages. The spec says WHAT messages flow; the implementation decides HOW to enforce trust.

### Claude's Discretion

- Where GUID is stored (localStorage keyed by iframe src? runtime-managed registry?)
- Exact cache format for verification results
- Whether singleton enforcement is a RuntimeAdapter option or a separate hook

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Protocol Specification
- `SPEC.md` §2 — Authentication Handshake (NIP-42 challenge-response, currently uses ephemeral keypair)
- `SPEC.md` §5 — Storage Proxy (current scoping model with pubkey:dTag:aggregateHash)
- `SPEC.md` §14 — Security Model (threat model, what the protocol protects against)
- `SPEC.md` §15.3 — NIP-5A Manifest Format and Aggregate Hash

### Code to Modify
- `packages/runtime/src/state-handler.ts` — `scopedKey()` function that builds `napplet-state:{pubkey}:{dTag}:{aggregateHash}:{userKey}`
- `packages/shim/src/napplet-keypair.ts` — `createEphemeralKeypair()` that generates fresh keypair per page load
- `packages/runtime/src/runtime.ts` — AUTH handshake flow, aggregate hash resolution
- `packages/runtime/src/manifest-cache.ts` — manifest caching, needs verification result caching

### Prior Phase Context
- `.planning/phases/41-shim-restructure/41-CONTEXT.md` — window.napplet shape
- `.planning/phases/40-*/` — createEphemeralKeypair() introduced here (SESS-03)

</canonical_refs>

<code_context>
## Existing Code Insights

### Current Storage Scoping
- `state-handler.ts:14-15` — `scopedKey(pubkey, dTag, aggregateHash, userKey)` returns `napplet-state:${pubkey}:${dTag}:${aggregateHash}:${userKey}`
- Removing pubkey from this function is the core change for D-01

### Current Keypair Flow
- `napplet-keypair.ts` — `createEphemeralKeypair()` generates fresh Ed25519 keypair via `generateSecretKey()`
- Used in shim's `index.ts` at module init to create session identity
- Keypair signs AUTH response and all outbound events

### Current Manifest/Hash Flow
- `manifest-cache.ts` — caches by `pubkey:dTag`, stores `aggregateHash` and `verifiedAt`
- Runtime resolves aggregate hash during AUTH from `<meta napplet-aggregate-hash>` tag
- Shell currently trusts whatever the napplet's meta tag declares — no verification against actual files

### Integration Points
- `runtime.ts:253-305` — AUTH handler where identity is established
- `enforce.ts` — ACL enforcement uses `(pubkey, dTag, aggregateHash)` tuple

</code_context>

<specifics>
## Specific Ideas

- Verification caching: `Map<eventId, { aggregateHash: string, valid: boolean, verifiedAt: number }>`
- GUID assignment: shell assigns on first iframe registration, persists in localStorage keyed by `napplet-instance:{src_origin_or_slot_id}`
- The "only one of this kind" singleton policy could be a `RuntimeAdapter.maxInstances?: number` option

</specifics>

<deferred>
## Deferred Ideas

- **Key rotation for ephemeral keypairs** — listed in PROJECT.md Out of Scope, still out of scope
- **Restrictive ACL default** — separate concern, doesn't change with this phase

</deferred>

---

*Phase: 46-shell-assigned-keypair-handshake*
*Context gathered: 2026-04-02*
