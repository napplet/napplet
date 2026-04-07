/**
 * @napplet/nub-storage -- Storage NUB module.
 *
 * Exports message types for the storage NUB domain.
 * Shim methods will be added in Phase 77/78 when the NUB spec is finalized.
 *
 * @example
 * ```ts
 * import type { StorageMessage } from '@napplet/nub-storage';
 * ```
 *
 * @packageDocumentation
 */

export type { StorageMessage } from './types.js';
export { DOMAIN } from './types.js';
