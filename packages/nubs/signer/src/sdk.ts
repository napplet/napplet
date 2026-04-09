/**
 * @napplet/nub-signer -- SDK helpers for signer operations.
 *
 * These convenience functions wrap the NIP-07 window.nostr proxy
 * installed by the signer shim.
 */

import type { EventTemplate } from '@napplet/core';

// ─── Runtime guard ──────────────────────────────────────────────────────────

interface NostrProxy {
  getPublicKey(): Promise<string>;
  signEvent(event: object): Promise<object>;
  getRelays(): Promise<Record<string, object>>;
  nip04: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
  nip44: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}

function requireNostr(): NostrProxy {
  const w = window as Window & { nostr?: NostrProxy };
  if (!w.nostr) {
    throw new Error('window.nostr not installed -- import @napplet/shim first');
  }
  return w.nostr;
}

// ─── SDK functions ──────────────────────────────────────────────────────────

/**
 * Get the user's public key (hex-encoded).
 *
 * @returns The user's hex-encoded public key
 *
 * @example
 * ```ts
 * import { signerGetPublicKey } from '@napplet/nub-signer';
 *
 * const pubkey = await signerGetPublicKey();
 * ```
 */
export function signerGetPublicKey(): Promise<string> {
  return requireNostr().getPublicKey();
}

/**
 * Sign an unsigned event template.
 *
 * @param event  Unsigned event template
 * @returns The signed event object
 *
 * @example
 * ```ts
 * import { signerSignEvent } from '@napplet/nub-signer';
 *
 * const signed = await signerSignEvent({
 *   kind: 1, content: 'Hello!', tags: [],
 *   created_at: Math.floor(Date.now() / 1000),
 * });
 * ```
 */
export function signerSignEvent(event: EventTemplate): Promise<object> {
  return requireNostr().signEvent(event);
}

/**
 * Get the user's preferred relay list.
 *
 * @returns Map of relay URL to read/write policy
 *
 * @example
 * ```ts
 * import { signerGetRelays } from '@napplet/nub-signer';
 *
 * const relays = await signerGetRelays();
 * ```
 */
export function signerGetRelays(): Promise<Record<string, object>> {
  return requireNostr().getRelays();
}

/**
 * NIP-04 encryption/decryption helpers.
 */
export const signerNip04 = {
  /**
   * Encrypt plaintext for a recipient using NIP-04.
   *
   * @param pubkey     Hex-encoded recipient public key
   * @param plaintext  Text to encrypt
   * @returns Encrypted ciphertext
   */
  encrypt(pubkey: string, plaintext: string): Promise<string> {
    return requireNostr().nip04.encrypt(pubkey, plaintext);
  },

  /**
   * Decrypt ciphertext from a sender using NIP-04.
   *
   * @param pubkey      Hex-encoded sender public key
   * @param ciphertext  Text to decrypt
   * @returns Decrypted plaintext
   */
  decrypt(pubkey: string, ciphertext: string): Promise<string> {
    return requireNostr().nip04.decrypt(pubkey, ciphertext);
  },
};

/**
 * NIP-44 encryption/decryption helpers.
 */
export const signerNip44 = {
  /**
   * Encrypt plaintext for a recipient using NIP-44.
   *
   * @param pubkey     Hex-encoded recipient public key
   * @param plaintext  Text to encrypt
   * @returns Encrypted ciphertext
   */
  encrypt(pubkey: string, plaintext: string): Promise<string> {
    return requireNostr().nip44.encrypt(pubkey, plaintext);
  },

  /**
   * Decrypt ciphertext from a sender using NIP-44.
   *
   * @param pubkey      Hex-encoded sender public key
   * @param ciphertext  Text to decrypt
   * @returns Decrypted plaintext
   */
  decrypt(pubkey: string, ciphertext: string): Promise<string> {
    return requireNostr().nip44.decrypt(pubkey, ciphertext);
  },
};
