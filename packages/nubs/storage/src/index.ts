/**
 * @napplet/nub-storage -- Storage NUB module.
 *
 * Exports typed message definitions for the storage domain and registers
 * the 'storage' domain with the core dispatch infrastructure on import.
 *
 * @example
 * ```ts
 * import type { StorageGetMessage, StorageNubMessage } from '@napplet/nub-storage';
 * import { DOMAIN } from '@napplet/nub-storage';
 * ```
 *
 * @packageDocumentation
 */

export { DOMAIN } from './types.js';

// ─── Type Exports ──────────────────────────────────────────────────────────

export type {
  StorageMessage,
  StorageGetMessage,
  StorageSetMessage,
  StorageRemoveMessage,
  StorageKeysMessage,
  StorageGetResultMessage,
  StorageSetResultMessage,
  StorageRemoveResultMessage,
  StorageKeysResultMessage,
  StorageRequestMessage,
  StorageResultMessage,
  StorageNubMessage,
} from './types.js';

// ─── Domain Registration ───────────────────────────────────────────────────

import { registerNub } from '@napplet/core';
import { DOMAIN } from './types.js';

/**
 * Register the storage domain with the core dispatch singleton.
 * Handler is a no-op placeholder -- the shell/shim provide real handlers.
 * Registration ensures dispatch.getRegisteredDomains() includes 'storage'.
 */
registerNub(DOMAIN, (_msg) => {
  /* Shell or shim replaces this handler at runtime */
});
