---
status: passed
phase: 48
phase_name: specification-documentation
verified: "2026-04-02"
---

# Verification: Phase 48 — Specification & Documentation

## Phase Goal

> Developers reading SPEC.md understand the new REGISTER/IDENTITY/AUTH handshake, the pubkey-free storage scoping model, and the delegated key security boundary

## Requirement Verification

### DOC-01: SPEC.md Section 2 updated with REGISTER -> IDENTITY -> AUTH handshake sequence

**Status: PASSED**

Evidence:
- Section 2.1 Overview describes the three-phase process: REGISTER, IDENTITY, AUTH
- Section 2.2 documents REGISTER wire format: `["REGISTER", {"dTag": "<napplet_type>", "claimedHash": "<aggregate_hash_or_empty>"}]`
- Section 2.3 documents IDENTITY wire format: `["IDENTITY", {"pubkey": "<hex>", "privkey": "<hex>", "dTag": "<type>", "aggregateHash": "<hash>"}]`
- Section 2.4 documents the full 8-step handshake sequence with wire format examples
- HMAC-SHA256(shellSecret, dTag + aggregateHash) key derivation documented
- Pubkey mismatch AUTH rejection documented
- Legacy ephemeral keypair fallback documented
- Old parseInt-based dTag derivation formula removed

### DOC-02: SPEC.md Section 5 updated with new storage scoping model

**Status: PASSED**

Evidence:
- Section 5.1 composite identity changed to `(dTag, aggregateHash)` (no pubkey)
- Section 5.1 explains why pubkey was removed (ephemeral keys destroyed persistence)
- Section 5.5 key format is `napplet-state:{dTag}:{aggregateHash}:{userKey}`
- Section 5.5 documents legacy format migration fallback
- Section 5.6 documents storage persistence across page reloads

### DOC-03: SPEC.md Section 14 updated with delegated key security model

**Status: PASSED**

Evidence:
- Section 14.1 contains fifth assumption about delegated keys not appearing on external relays
- Section 14.2 layer 2 mentions "shell-delegated deterministic keypair"
- Section 14.2 layer 8 references `(dTag, aggregateHash)` without pubkey
- Section 14.2 layer 9 documents delegated key confinement
- Section 14.4 "Delegated Key Threat Analysis" covers: key exfiltration, shell secret compromise, cross-shell isolation, HMAC collision resistance

## Must-Haves Checklist

- [x] Section 2 documents full REGISTER -> IDENTITY -> AUTH handshake with message formats
- [x] Section 5 documents storage scoping as dTag:aggregateHash:userKey with no pubkey component
- [x] Section 14 documents delegated keys are protocol-auth-only with threat model

## Automated Checks

- `grep -c "REGISTER" SPEC.md` = 19 (>= 3)
- `grep -c "IDENTITY" SPEC.md` = 15 (>= 3)
- `grep "napplet-state:{dTag}" SPEC.md` matches new key format
- `grep -c "delegated" SPEC.md` = 14 (>= 5)
- `grep "HMAC-SHA256" SPEC.md` matches 4 times
- `grep "shellSecret" SPEC.md` matches 6 times
- Section numbering is consistent (2.1-2.13, 5.1-5.6, 14.1-14.4)
- `pnpm type-check` passes (16/16 tasks)

## Additional Cleanup

Beyond the three requirements, stale references were updated in:
- Section 13 ACL composite key model
- Section 13.6 manifest cache key
- Section 13.8 ACL persistence field descriptions
- Section 15.3 composite key reference
- Section 16 minimal napplet example
- RuntimeHooks/ShellHooks -> RuntimeAdapter/ShellAdapter

## Result

**PASSED** — All 3 requirements verified. SPEC.md is internally consistent with Phase 46 implementation.
