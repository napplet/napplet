/**
 * key-derivation.ts — Deterministic keypair derivation for napplet identity.
 *
 * Derives a stable secp256k1 keypair from HMAC-SHA256(shellSecret, dTag + aggregateHash).
 * Same napplet type + version + shell = same keypair.
 * No browser APIs. No DOM.
 */

import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { schnorr } from '@noble/curves/secp256k1.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import type { ShellSecretPersistence } from './types.js';

// TextEncoder is available in all JS runtimes but not in ES2022 lib types.
declare class TextEncoder { encode(input: string): Uint8Array; }

/** 32-byte shell secret used as HMAC key for keypair derivation. */
const SECRET_LENGTH = 32;

/**
 * Get or create the shell secret.
 * Generated once on first use, persisted via ShellSecretPersistence.
 *
 * @param persistence - Storage backend for the shell secret
 * @param randomBytes - Function to generate cryptographically secure random bytes
 * @returns The 32-byte shell secret
 */
export function getOrCreateShellSecret(
  persistence: ShellSecretPersistence,
  randomBytes: (length: number) => Uint8Array,
): Uint8Array {
  const existing = persistence.get();
  if (existing && existing.length === SECRET_LENGTH) return existing;

  const secret = randomBytes(SECRET_LENGTH);
  persistence.set(secret);
  return secret;
}

/**
 * Derive a deterministic private key seed from HMAC-SHA256(shellSecret, dTag + aggregateHash).
 *
 * The output is 32 bytes — a valid secp256k1 private key with overwhelming probability
 * (failure probability ~3.7 * 10^-39, less than a hardware error).
 *
 * @param shellSecret - The 32-byte per-shell secret
 * @param dTag - Napplet type identifier
 * @param aggregateHash - Build artifact hash (empty string in dev mode)
 * @returns 32-byte seed suitable for use as a secp256k1 private key
 */
export function derivePrivateKey(
  shellSecret: Uint8Array,
  dTag: string,
  aggregateHash: string,
): Uint8Array {
  const input = new TextEncoder().encode(dTag + aggregateHash);
  return hmac(sha256, shellSecret, input);
}

/**
 * Derive a full keypair (private key bytes, hex private key, hex public key)
 * from a shell secret and napplet identity.
 *
 * @param shellSecret - The 32-byte per-shell secret
 * @param dTag - Napplet type identifier
 * @param aggregateHash - Build artifact hash (empty string in dev mode)
 * @returns Object with privkeyBytes, privkeyHex, and pubkeyHex
 */
export function deriveKeypair(
  shellSecret: Uint8Array,
  dTag: string,
  aggregateHash: string,
): { privkeyBytes: Uint8Array; privkeyHex: string; pubkeyHex: string } {
  const privkeyBytes = derivePrivateKey(shellSecret, dTag, aggregateHash);
  const pubkeyBytes = schnorr.getPublicKey(privkeyBytes);
  return {
    privkeyBytes,
    privkeyHex: bytesToHex(privkeyBytes),
    pubkeyHex: bytesToHex(pubkeyBytes),
  };
}
