/**
 * @napplet/shim — Protocol types re-exported from @napplet/core.
 *
 * Shim previously maintained its own copies of these types.
 * They now live in @napplet/core as the single source of truth.
 */

export type { NostrEvent, NostrFilter } from '@napplet/core';
export { BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION } from '@napplet/core';
export type { BusKindValue } from '@napplet/core';
