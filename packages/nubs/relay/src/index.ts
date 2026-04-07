/**
 * @napplet/nub-relay -- Relay NUB module.
 *
 * Exports message types for the relay NUB domain.
 * Shim methods will be added in Phase 77/78 when the NUB spec is finalized.
 *
 * @example
 * ```ts
 * import type { RelayMessage } from '@napplet/nub-relay';
 * ```
 *
 * @packageDocumentation
 */

export type { RelayMessage } from './types.js';
export { DOMAIN } from './types.js';
