/**
 * @napplet/nub-relay -- relay proxy operations (subscribe, publish, query) message types.
 *
 * This module defines the JSON envelope message types for the relay NUB domain.
 * All messages use the "domain.action" type discriminant format per NIP-5D.
 *
 * Message types will be populated from the NUB-RELAY spec (Phase 77).
 * For now, this establishes the base message interface that all relay
 * messages will extend.
 */

import type { NappletMessage } from '@napplet/core';

// ─── Domain Constants ──────────────────────────────────────────────────────

/** The NUB domain name for relay messages. */
export const DOMAIN = 'relay' as const;

// ─── Base Message Type ─────────────────────────────────────────────────────

/**
 * Base interface for all relay NUB messages.
 * Extends NappletMessage with the relay.* type prefix.
 *
 * Concrete message types (e.g., relay.subscribe, relay.event)
 * will extend this interface with specific payload fields.
 * Those types are defined by the NUB-RELAY spec (Phase 77).
 *
 * @example
 * ```ts
 * // Future: concrete relay message type
 * // interface RelaySubscribeMessage extends RelayMessage {
 * //   type: 'relay.subscribe';
 * //   filters: NostrFilter[];
 * // }
 * ```
 */
export interface RelayMessage extends NappletMessage {
  /** Message type in "relay.<action>" format. */
  type: `relay.${string}`;
}
