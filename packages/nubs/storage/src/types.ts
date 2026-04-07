/**
 * @napplet/nub-storage -- scoped storage operations (get, set, remove, keys) message types.
 *
 * This module defines the JSON envelope message types for the storage NUB domain.
 * All messages use the "domain.action" type discriminant format per NIP-5D.
 *
 * Message types will be populated from the NUB-STORAGE spec (Phase 77).
 * For now, this establishes the base message interface that all storage
 * messages will extend.
 */

import type { NappletMessage } from '@napplet/core';

// ─── Domain Constants ──────────────────────────────────────────────────────

/** The NUB domain name for storage messages. */
export const DOMAIN = 'storage' as const;

// ─── Base Message Type ─────────────────────────────────────────────────────

/**
 * Base interface for all storage NUB messages.
 * Extends NappletMessage with the storage.* type prefix.
 *
 * Concrete message types (e.g., storage.get, storage.set)
 * will extend this interface with specific payload fields.
 * Those types are defined by the NUB-STORAGE spec (Phase 77).
 *
 * @example
 * ```ts
 * // Future: concrete storage message type
 * // interface StorageGetMessage extends StorageMessage {
 * //   type: 'storage.get';
 * //   key: string;
 * // }
 * ```
 */
export interface StorageMessage extends NappletMessage {
  /** Message type in "storage.<action>" format. */
  type: `storage.${string}`;
}
