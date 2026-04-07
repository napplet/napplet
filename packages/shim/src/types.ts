/**
 * @napplet/shim -- Protocol types re-exported from @napplet/core,
 * plus temporary local constants for handshake verbs being removed
 * from core in v0.15.0. Phase 71 will remove these when the shim
 * drops all AUTH/handshake code.
 */

export type { NostrEvent, NostrFilter } from '@napplet/core';
export { BusKind, SHELL_BRIDGE_URI, PROTOCOL_VERSION } from '@napplet/core';
export type { BusKindValue } from '@napplet/core';

// ─── Temporary local constants (removed from @napplet/core in v0.15.0) ──────
// These are used by shim's AUTH handshake code which is removed in Phase 71.
// DO NOT add new consumers of these constants.

/** @deprecated Removed from @napplet/core. Will be removed from shim in Phase 71. */
export const AUTH_KIND = 22242 as const;

/** @deprecated Removed from @napplet/core. Will be removed from shim in Phase 71. */
export const VERB_REGISTER = 'REGISTER' as const;

/** @deprecated Removed from @napplet/core. Will be removed from shim in Phase 71. */
export const VERB_IDENTITY = 'IDENTITY' as const;
