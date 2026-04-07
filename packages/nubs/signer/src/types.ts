/**
 * @napplet/nub-signer -- signing delegation (sign, encrypt, decrypt) message types.
 *
 * This module defines the JSON envelope message types for the signer NUB domain.
 * All messages use the "domain.action" type discriminant format per NIP-5D.
 *
 * Message types will be populated from the NUB-SIGNER spec (Phase 77).
 * For now, this establishes the base message interface that all signer
 * messages will extend.
 */

import type { NappletMessage } from '@napplet/core';

// ─── Domain Constants ──────────────────────────────────────────────────────

/** The NUB domain name for signer messages. */
export const DOMAIN = 'signer' as const;

// ─── Base Message Type ─────────────────────────────────────────────────────

/**
 * Base interface for all signer NUB messages.
 * Extends NappletMessage with the signer.* type prefix.
 *
 * Concrete message types (e.g., signer.sign, signer.encrypt)
 * will extend this interface with specific payload fields.
 * Those types are defined by the NUB-SIGNER spec (Phase 77).
 *
 * @example
 * ```ts
 * // Future: concrete signer message type
 * // interface SignerSignMessage extends SignerMessage {
 * //   type: 'signer.sign';
 * //   event: EventTemplate;
 * // }
 * ```
 */
export interface SignerMessage extends NappletMessage {
  /** Message type in "signer.<action>" format. */
  type: `signer.${string}`;
}
