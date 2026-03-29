// @napplet/shim — Ephemeral keypair generation for napp cryptographic identity.
// Napps get a fresh in-memory keypair on every page load — no persistence.
// Identity is based on NIP-5A aggregate hash verified by the shell, not on
// persistent keypairs. Private keys never cross the iframe boundary.

import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';

export interface NappKeypair {
  privkey: Uint8Array;
  pubkey: string;
}

/**
 * Generate an ephemeral keypair for a napp.
 *
 * Always creates a fresh keypair — no IndexedDB or any other persistence.
 * The shell identifies napps by their NIP-5A aggregate hash (from the AUTH
 * event), not by the keypair's pubkey. Each page load produces a new identity
 * that is validated against the napp's published manifest.
 *
 * @param _nappType - The napp type identifier (kept for API compatibility)
 * @returns A fresh ephemeral keypair
 */
export function loadOrCreateKeypair(_nappType: string): NappKeypair {
  const privkey = generateSecretKey();
  const pubkey = getPublicKey(privkey);
  return { privkey, pubkey };
}
