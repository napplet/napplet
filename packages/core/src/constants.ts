/**
 * @napplet/core -- Envelope-era protocol constants for the napplet-shell protocol.
 *
 * These constants define protocol metadata and operational limits
 * shared across all napplet packages. NIP-01 bus constants have
 * been moved to legacy.ts.
 */

// ─── Protocol Metadata ──────────────────────────────────────────────────────

/**
 * Current protocol version for the napplet-shell communication protocol.
 * Version 4.0.0 marks the JSON envelope wire format era (NIP-5D v4).
 * @example
 * ```ts
 * console.log(PROTOCOL_VERSION); // '4.0.0'
 * ```
 */
export const PROTOCOL_VERSION = '4.0.0' as const;

/**
 * URI identifying the shell bridge as a pseudo-relay endpoint.
 * Used in NIP-42 AUTH relay tags to distinguish shell messages from real relays.
 * @example
 * ```ts
 * const relayTag = ['relay', SHELL_BRIDGE_URI]; // ['relay', 'napplet://shell']
 * ```
 */
export const SHELL_BRIDGE_URI = 'napplet://shell' as const;

/**
 * Maximum age in seconds for an event to be accepted (replay protection window).
 * @example
 * ```ts
 * const isExpired = (Date.now() / 1000) - event.created_at > REPLAY_WINDOW_SECONDS;
 * ```
 */
export const REPLAY_WINDOW_SECONDS = 30 as const;
