// @napplet/shim — Ephemeral keypair generation for napplet cryptographic identity.
// Napplets get a fresh in-memory keypair on every page load — no persistence.
// Identity is based on NIP-5A aggregate hash verified by the shell, not on
// persistent keypairs. Private keys never cross the iframe boundary.

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
 * Always creates a fresh keypair — no IndexedDB or any other persistence.
 * The shell identifies napplets by their NIP-5A aggregate hash (from the AUTH
 * event), not by the keypair's pubkey. Each page load produces a new identity
 * that is validated against the napplet's published manifest.
 *
 * @returns A fresh ephemeral keypair
 */
// TODO(SEED-001): This placeholder always generates a random keypair.
// The correct design: shell derives a deterministic key from
// SHA256(salt + aggregateHash + dTag + nappletAuthorPubkey) and sends it
// to the napplet via an init message. See .planning/seeds/SEED-001-deterministic-napplet-keypair.md
export function createEphemeralKeypair(): NappletKeypair {
  const privkey = generateSecretKey();
  const pubkey = getPublicKey(privkey);
  return { privkey, pubkey };
}
