/**
 * @napplet/nub-signer -- Signer NUB module.
 *
 * Exports typed message definitions for the signer domain, shim installer,
 * SDK helpers, and registers the 'signer' domain with core dispatch on import.
 *
 * @example
 * ```ts
 * import type { SignerSignEventMessage, SignerNubMessage } from '@napplet/nub-signer';
 * import { DOMAIN, DESTRUCTIVE_KINDS, installSignerShim } from '@napplet/nub-signer';
 * ```
 *
 * @packageDocumentation
 */

export { DOMAIN, DESTRUCTIVE_KINDS } from './types.js';

// ─── Type Exports ──────────────────────────────────────────────────────────

export type {
  SignerMessage,
  SignerGetPublicKeyMessage,
  SignerSignEventMessage,
  SignerGetRelaysMessage,
  SignerNip04EncryptMessage,
  SignerNip04DecryptMessage,
  SignerNip44EncryptMessage,
  SignerNip44DecryptMessage,
  SignerGetPublicKeyResultMessage,
  SignerSignEventResultMessage,
  SignerGetRelaysResultMessage,
  SignerNip04EncryptResultMessage,
  SignerNip04DecryptResultMessage,
  SignerNip44EncryptResultMessage,
  SignerNip44DecryptResultMessage,
  SignerRequestMessage,
  SignerResultMessage,
  SignerNubMessage,
} from './types.js';

// ─── Shim Exports ─────────────────────────────────────────────────────────

export { installSignerShim, handleSignerResponse, nostrProxy } from './shim.js';

// ─── SDK Exports ──────────────────────────────────────────────────────────

export {
  signerGetPublicKey,
  signerSignEvent,
  signerGetRelays,
  signerNip04,
  signerNip44,
} from './sdk.js';

// ─── Domain Registration ───────────────────────────────────────────────────

import { registerNub } from '@napplet/core';
import { DOMAIN } from './types.js';

/**
 * Register the signer domain with the core dispatch singleton.
 * Handler is a no-op placeholder -- the shell/shim provide real handlers.
 * Registration ensures dispatch.getRegisteredDomains() includes 'signer'.
 */
registerNub(DOMAIN, (_msg) => {
  /* Shell or shim replaces this handler at runtime */
});
