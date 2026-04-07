/**
 * @napplet/nub-ifc -- IFC NUB module.
 *
 * Exports typed message definitions for the ifc domain and registers
 * the 'ifc' domain with the core dispatch infrastructure on import.
 *
 * @example
 * ```ts
 * import type { IfcEmitMessage, IfcChannelMessage, IfcNubMessage } from '@napplet/nub-ifc';
 * import { DOMAIN } from '@napplet/nub-ifc';
 * ```
 *
 * @packageDocumentation
 */

export { DOMAIN } from './types.js';

// ─── Type Exports ──────────────────────────────────────────────────────────

export type {
  IfcMessage,
  IfcEmitMessage,
  IfcSubscribeMessage,
  IfcSubscribeResultMessage,
  IfcUnsubscribeMessage,
  IfcEventMessage,
  IfcChannelOpenMessage,
  IfcChannelOpenResultMessage,
  IfcChannelEmitMessage,
  IfcChannelEventMessage,
  IfcChannelBroadcastMessage,
  IfcChannelListMessage,
  IfcChannelListResultMessage,
  IfcChannelCloseMessage,
  IfcChannelClosedMessage,
  IfcTopicMessage,
  IfcChannelMessage,
  IfcOutboundMessage,
  IfcInboundMessage,
  IfcNubMessage,
} from './types.js';

// ─── Domain Registration ───────────────────────────────────────────────────

import { registerNub } from '@napplet/core';
import { DOMAIN } from './types.js';

/**
 * Register the ifc domain with the core dispatch singleton.
 * Handler is a no-op placeholder -- the shell/shim provide real handlers.
 * Registration ensures dispatch.getRegisteredDomains() includes 'ifc'.
 */
registerNub(DOMAIN, (_msg) => {
  /* Shell or shim replaces this handler at runtime */
});
