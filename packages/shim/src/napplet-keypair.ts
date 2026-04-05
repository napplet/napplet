// @napplet/shim — Ephemeral keypair generation (LEGACY FALLBACK).
// Used only when the shell does not support REGISTER/IDENTITY delegation.
// In the standard flow, the shell derives and delegates the keypair.
// See: REGISTER -> IDENTITY -> AUTH handshake in RUNTIME-SPEC.md Section 2.

import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';

export interface NappletKeypair {
  privkey: Uint8Array;
  pubkey: string;
}

/** @deprecated Use NappletKeypair. Will be removed in v0.9.0. */
export type NappKeypair = NappletKeypair;

/**
 * Generate an ephemeral keypair for a napplet.
 *
 * **Legacy fallback** — only used when the shell does not support
 * REGISTER/IDENTITY delegation (pre-v0.9.0 shells). In the standard
 * flow, the shell derives a deterministic keypair via
 * HMAC(shellSecret, dTag + aggregateHash) and sends it to the napplet
 * in the IDENTITY message.
 *
 * @returns A fresh ephemeral keypair
 */
export function createEphemeralKeypair(): NappletKeypair {
  const privkey = generateSecretKey();
  const pubkey = getPublicKey(privkey);
  return { privkey, pubkey };
}
