---
phase: 46
plan: 4
title: "REGISTER/IDENTITY handshake and delegated key security"
status: complete
---

# Summary: 46-04 REGISTER/IDENTITY Handshake and Delegated Key Security

## What was built
Complete REGISTER -> IDENTITY -> AUTH handshake flow. Runtime handles REGISTER by deriving deterministic keypair via HMAC-SHA256(shellSecret, dTag+aggregateHash), sends IDENTITY with keypair to napplet, napplet uses it for NIP-42 AUTH. SEC-01 guard blocks delegated keys from publishing standard events to external relays. Shell adapter provides localStorage-backed shell secret and GUID persistence.

## Key files
- `packages/runtime/src/key-derivation.ts` — derivePrivateKey(), deriveKeypair(), getOrCreateShellSecret()
- `packages/runtime/src/runtime.ts` — handleRegister(), pendingRegistrations, delegatedPubkeys, SEC-01 guard
- `packages/shim/src/index.ts` — REGISTER send on load, IDENTITY handler, ephemeral fallback
- `packages/shim/src/napplet-keypair.ts` — marked as legacy fallback
- `packages/shell/src/hooks-adapter.ts` — shellSecretPersistence, guidPersistence, randomBytes, bytesToHex/hexToBytes
- `packages/shell/src/types.ts` — onHashMismatch callback on ShellAdapter
- `packages/runtime/package.json` — @noble/hashes and @noble/curves dependencies

## Decisions
- Key derivation uses @noble/hashes HMAC and @noble/curves schnorr (direct deps, not nostr-tools)
- Shell adapter uses inline hex utilities to avoid @noble/hashes dependency
- REGISTER is handled before AUTH in main message handler (not queued)
- SEC-01 guard allows all BusKind events, blocks non-bus-kind events from delegated pubkeys
- Shim falls back to ephemeral keypair if IDENTITY not received (backward compat)

## Self-Check: PASSED
