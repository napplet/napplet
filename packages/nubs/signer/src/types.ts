/**
 * @napplet/nub-signer -- Signing delegation message types for the JSON envelope wire protocol.
 *
 * Defines 14 message types mapping the NIP-07 window.nostr interface to JSON envelope:
 * - Napplet -> Shell: getPublicKey, signEvent, getRelays, nip04.encrypt/decrypt, nip44.encrypt/decrypt
 * - Shell -> Napplet: *.result for each request
 *
 * All types form a discriminated union on the `type` field.
 */

import type { NappletMessage } from '@napplet/core';
import type { NostrEvent, EventTemplate } from '@napplet/core';

// ─── Domain Constants ──────────────────────────────────────────────────────

/** The NUB domain name for signer messages. */
export const DOMAIN = 'signer' as const;

/**
 * Event kinds that require explicit user consent before signing.
 * Includes profile (0), contacts (3), deletion (5), and relay list (10002).
 */
export const DESTRUCTIVE_KINDS = new Set([0, 3, 5, 10002]);

// ─── Base Message Type ─────────────────────────────────────────────────────

/**
 * Base interface for all signer NUB messages.
 * Concrete message types narrow the `type` field to specific literals.
 */
export interface SignerMessage extends NappletMessage {
  /** Message type in "signer.<action>" format. */
  type: `signer.${string}`;
}

// ─── Napplet -> Shell Request Messages ─────────────────────────────────────

/**
 * Request the user's public key (hex-encoded).
 */
export interface SignerGetPublicKeyMessage extends SignerMessage {
  type: 'signer.getPublicKey';
  /** Correlation ID. */
  id: string;
}

/**
 * Request signing of an unsigned event template.
 */
export interface SignerSignEventMessage extends SignerMessage {
  type: 'signer.signEvent';
  /** Correlation ID. */
  id: string;
  /** The unsigned event template to sign. */
  event: EventTemplate;
}

/**
 * Request the user's preferred relay list.
 */
export interface SignerGetRelaysMessage extends SignerMessage {
  type: 'signer.getRelays';
  /** Correlation ID. */
  id: string;
}

/**
 * Request NIP-04 encryption of plaintext for a recipient pubkey.
 */
export interface SignerNip04EncryptMessage extends SignerMessage {
  type: 'signer.nip04.encrypt';
  /** Correlation ID. */
  id: string;
  /** Hex-encoded recipient public key. */
  pubkey: string;
  /** Plaintext to encrypt. */
  plaintext: string;
}

/**
 * Request NIP-04 decryption of ciphertext from a sender pubkey.
 */
export interface SignerNip04DecryptMessage extends SignerMessage {
  type: 'signer.nip04.decrypt';
  /** Correlation ID. */
  id: string;
  /** Hex-encoded sender public key. */
  pubkey: string;
  /** Ciphertext to decrypt. */
  ciphertext: string;
}

/**
 * Request NIP-44 encryption of plaintext for a recipient pubkey.
 */
export interface SignerNip44EncryptMessage extends SignerMessage {
  type: 'signer.nip44.encrypt';
  /** Correlation ID. */
  id: string;
  /** Hex-encoded recipient public key. */
  pubkey: string;
  /** Plaintext to encrypt. */
  plaintext: string;
}

/**
 * Request NIP-44 decryption of ciphertext from a sender pubkey.
 */
export interface SignerNip44DecryptMessage extends SignerMessage {
  type: 'signer.nip44.decrypt';
  /** Correlation ID. */
  id: string;
  /** Hex-encoded sender public key. */
  pubkey: string;
  /** Ciphertext to decrypt. */
  ciphertext: string;
}

// ─── Shell -> Napplet Result Messages ──────────────────────────────────────

/**
 * Result of signer.getPublicKey request.
 */
export interface SignerGetPublicKeyResultMessage extends SignerMessage {
  type: 'signer.getPublicKey.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Hex-encoded public key. */
  pubkey?: string;
  /** Error message if request failed. */
  error?: string;
}

/**
 * Result of signer.signEvent request.
 */
export interface SignerSignEventResultMessage extends SignerMessage {
  type: 'signer.signEvent.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** The fully signed Nostr event. */
  event?: NostrEvent;
  /** Error message if request failed. */
  error?: string;
}

/**
 * Result of signer.getRelays request.
 */
export interface SignerGetRelaysResultMessage extends SignerMessage {
  type: 'signer.getRelays.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Map of relay URL to read/write policy. */
  relays?: Record<string, { read: boolean; write: boolean }>;
  /** Error message if request failed. */
  error?: string;
}

/**
 * Result of signer.nip04.encrypt request.
 */
export interface SignerNip04EncryptResultMessage extends SignerMessage {
  type: 'signer.nip04.encrypt.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Encrypted ciphertext. */
  ciphertext?: string;
  /** Error message if request failed. */
  error?: string;
}

/**
 * Result of signer.nip04.decrypt request.
 */
export interface SignerNip04DecryptResultMessage extends SignerMessage {
  type: 'signer.nip04.decrypt.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Decrypted plaintext. */
  plaintext?: string;
  /** Error message if request failed. */
  error?: string;
}

/**
 * Result of signer.nip44.encrypt request.
 */
export interface SignerNip44EncryptResultMessage extends SignerMessage {
  type: 'signer.nip44.encrypt.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Encrypted ciphertext. */
  ciphertext?: string;
  /** Error message if request failed. */
  error?: string;
}

/**
 * Result of signer.nip44.decrypt request.
 */
export interface SignerNip44DecryptResultMessage extends SignerMessage {
  type: 'signer.nip44.decrypt.result';
  /** Correlation ID matching the original request. */
  id: string;
  /** Decrypted plaintext. */
  plaintext?: string;
  /** Error message if request failed. */
  error?: string;
}

// ─── Discriminated Unions ──────────────────────────────────────────────────

/** Napplet -> Shell signer request messages. */
export type SignerRequestMessage =
  | SignerGetPublicKeyMessage
  | SignerSignEventMessage
  | SignerGetRelaysMessage
  | SignerNip04EncryptMessage
  | SignerNip04DecryptMessage
  | SignerNip44EncryptMessage
  | SignerNip44DecryptMessage;

/** Shell -> Napplet signer result messages. */
export type SignerResultMessage =
  | SignerGetPublicKeyResultMessage
  | SignerSignEventResultMessage
  | SignerGetRelaysResultMessage
  | SignerNip04EncryptResultMessage
  | SignerNip04DecryptResultMessage
  | SignerNip44EncryptResultMessage
  | SignerNip44DecryptResultMessage;

/** All signer NUB message types (discriminated union on `type` field). */
export type SignerNubMessage = SignerRequestMessage | SignerResultMessage;
