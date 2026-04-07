/**
 * @napplet/nub-ifc -- inter-frame communication (dispatch, channel) message types.
 *
 * This module defines the JSON envelope message types for the ifc NUB domain.
 * All messages use the "domain.action" type discriminant format per NIP-5D.
 *
 * Message types will be populated from the NUB-IFC spec (Phase 77).
 * For now, this establishes the base message interface that all ifc
 * messages will extend.
 */

import type { NappletMessage } from '@napplet/core';

// ─── Domain Constants ──────────────────────────────────────────────────────

/** The NUB domain name for ifc messages. */
export const DOMAIN = 'ifc' as const;

// ─── Base Message Type ─────────────────────────────────────────────────────

/**
 * Base interface for all ifc NUB messages.
 * Extends NappletMessage with the ifc.* type prefix.
 *
 * Concrete message types (e.g., ifc.dispatch, ifc.channel)
 * will extend this interface with specific payload fields.
 * Those types are defined by the NUB-IFC spec (Phase 77).
 *
 * @example
 * ```ts
 * // Future: concrete ifc message type
 * // interface IfcDispatchMessage extends IfcMessage {
 * //   type: 'ifc.dispatch';
 * //   topic: string;
 * //   payload: unknown;
 * // }
 * ```
 */
export interface IfcMessage extends NappletMessage {
  /** Message type in "ifc.<action>" format. */
  type: `ifc.${string}`;
}
