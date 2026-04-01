---
id: SEED-001
status: dormant
planted: 2026-04-01
planted_during: v0.7.0 Phase 38 discussion
trigger_when: security hardening milestone — any milestone touching AUTH flow, key management, napplet identity, or pre-publish hardening
scope: large
---

# SEED-001: Deterministic shell-generated napplet keypair

## Why This Matters

The current `loadOrCreateKeypair()` in `packages/shim/src/napplet-keypair.ts` generates a
**random keypair on every page load**. This was a placeholder introduced by an agent that hit a
chicken-and-egg problem during AUTH plumbing: it needed a keypair to proceed, but the intended
shell-side init message wasn't designed yet.

The consequence is critical: every page reload produces a new pubkey, so the ACL entry
(`pubkey:dTag:aggregateHash`) never matches across sessions. Users must re-confirm ACL
permissions on every single page load — defeating the core UX promise of the protocol
("confirm once per napplet version, not on every load").

## Correct Design

### Keypair derivation

The napplet's private key must be **deterministic**:

```
deterministicPrivkey = SHA256(salt + aggregateHash + dTag + nappletAuthorPubkey)
```

Where:
- `salt` — random bytes generated once by the shell/runtime, stored in the shell's `localStorage`
  (eventually encrypted). Per-shell-instance. Never changes unless explicitly rotated.
- `aggregateHash` — `SHA256(blobs + alpha-sorted paths)` computed from the NIP-5A site manifest.
  Validated by the shell at AUTH time. Changes on every napplet upgrade or downgrade.
- `dTag` — the napplet's canonical identity string (from the manifest event).
- `nappletAuthorPubkey` — the `pubkey` field on the kind 35128 NIP-5A manifest event (the
  manifest publisher's key, NOT the shell host user's pubkey).

This means: same napplet + same version + same shell instance → same keypair → ACL matches.
Different author, different version, or different shell → different keypair → ACL trips → re-consent.

### Shell-side flow

1. Shell has `salt` in localStorage (generated on first run).
2. Shell resolves `aggregateHash` from the cached manifest for this napplet.
3. Shell derives `deterministicPrivkey` using the formula above.
4. Shell sends an **init message** to the napplet iframe (via `postMessage`) containing the
   derived private key before the AUTH challenge is issued.
5. Napplet receives the private key from the init message and uses it for all crypto operations.
6. Napplet never generates its own keypair.

### aggregateHash validation

The shell must validate the aggregateHash by independently computing `SHA256(blobs + paths)`
from the site manifest (alpha-ordered by path), comparing against the hash in the AUTH event tags.
If they differ, reject AUTH and do NOT derive the keypair — the napplet's content doesn't match
its manifest claim.

### Salt storage

Initially: `localStorage` in the shell window under a well-known key (e.g., `napplet-shell-salt`).
Eventually: encrypted with the host user's key (separate hardening milestone).

## When to Surface

**Trigger:** Security hardening milestone — any milestone whose scope includes:
- AUTH flow changes
- Key management or key derivation
- Napplet identity / aggregate hash validation
- Pre-publish hardening pass
- "Fix ACL persistence" or "ACL not surviving page reload" bug reports

This seed should be presented during `/gsd:new-milestone` when the milestone
scope matches any of these conditions:
- Milestone involves auth, identity, or keypair management
- Milestone is a pre-publish security hardening pass
- A bug report surfaces about ACL requiring re-confirmation on every page load

## Scope Estimate

**Large** — This is a full milestone:
- New init message type in the protocol (shell → napplet bootstrap)
- Deterministic key derivation in the shell/runtime
- Salt generation and storage
- aggregateHash validation at AUTH time (currently trusted, not independently verified)
- Shim refactor: remove `loadOrCreateKeypair`, receive key from init message
- Test coverage: same-version persistence, version-change ACL trip, author-change ACL trip
- SPEC.md update: document init message and key derivation spec
- Future: salt encryption with host key

## Breadcrumbs

Related code and decisions in the current codebase:

- `packages/shim/src/napplet-keypair.ts` — placeholder implementation (`loadOrCreateKeypair` always generates fresh random keypair; `_nappType` param ignored)
- `packages/shim/src/index.ts:228,344` — call sites; keypair initialized eagerly at module load and again as fallback in `handleAuthChallenge`
- `packages/runtime/src/runtime.ts:248-270` — AUTH handling; reads `aggregateHash` from AUTH event tags; currently trusts the value without independent manifest validation
- `packages/runtime/src/session-registry.ts` — `SessionRegistry` maps windowId→pubkey; if pubkey is non-deterministic, registry entries are useless across page reloads
- `packages/shell/src/acl-store.ts` — ACL keyed on `pubkey:dTag:aggregateHash`; non-deterministic pubkey means no ACL hits across reloads
- `packages/shell/src/manifest-cache.ts` — shell-side manifest cache; already caches kind 35128 events by dTag; source of `aggregateHash` + `nappletAuthorPubkey`
- `packages/vite-plugin/src/index.ts` — computes aggregateHash at build time; same algorithm must be reproduced at runtime for shell-side validation
- `.planning/REQUIREMENTS.md` — SESS-03 (current: rename `loadOrCreateKeypair → createEphemeralKeypair`; superseded by this seed — see Phase 38 CONTEXT.md)
- `SPEC.md` — NIP-5A protocol spec; init message and key derivation spec will need a new section

## Notes

Discovered during Phase 38 (Session Vocabulary) discuss-phase on 2026-04-01 while reviewing
the `loadOrCreateKeypair` rename. The name `createEphemeralKeypair` (SESS-03 target) was
rejected because it would permanently encode the wrong behavior. Phase 38 CONTEXT.md notes
this function's rename as deferred pending this design fix.

The concatenation order for key derivation: `salt + aggregateHash + dTag + nappletAuthorPubkey`
was specified by the project author. The `nappletAuthorPubkey` is the pubkey of the NIP-5A
manifest publisher (kind 35128 event), NOT the shell host user's pubkey.
