/**
 * @napplet/nub-signer -- Signer NUB module.
 *
 * Exports message types for the signer NUB domain.
 * Shim methods will be added in Phase 77/78 when the NUB spec is finalized.
 *
 * @example
 * ```ts
 * import type { SignerMessage } from '@napplet/nub-signer';
 * ```
 *
 * @packageDocumentation
 */

export type { SignerMessage } from './types.js';
export { DOMAIN } from './types.js';
