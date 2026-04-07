/**
 * @napplet/nub-relay -- Relay NUB module.
 *
 * Exports typed message definitions for the relay domain and registers
 * the 'relay' domain with the core dispatch infrastructure on import.
 *
 * @example
 * ```ts
 * import type { RelaySubscribeMessage, RelayNubMessage } from '@napplet/nub-relay';
 * import { DOMAIN } from '@napplet/nub-relay';
 * ```
 *
 * @packageDocumentation
 */

export { DOMAIN } from './types.js';

// ─── Type Exports ──────────────────────────────────────────────────────────

export type {
  RelayMessage,
  RelaySubscribeMessage,
  RelayCloseMessage,
  RelayPublishMessage,
  RelayQueryMessage,
  RelayEventMessage,
  RelayEoseMessage,
  RelayClosedMessage,
  RelayPublishResultMessage,
  RelayQueryResultMessage,
  RelayOutboundMessage,
  RelayInboundMessage,
  RelayNubMessage,
} from './types.js';

// ─── Domain Registration ───────────────────────────────────────────────────

import { registerNub } from '@napplet/core';
import { DOMAIN } from './types.js';

/**
 * Register the relay domain with the core dispatch singleton.
 * Handler is a no-op placeholder -- the shell/shim provide real handlers.
 * Registration ensures dispatch.getRegisteredDomains() includes 'relay'.
 */
registerNub(DOMAIN, (_msg) => {
  /* Shell or shim replaces this handler at runtime */
});
