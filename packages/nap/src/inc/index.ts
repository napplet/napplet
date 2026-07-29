/**
 * Napplet NAP inc -- INC NAP module.
 *
 * Exports typed message definitions for the inc domain, shim installer,
 * SDK helpers, and registers the 'inc' domain with core dispatch on import.
 *
 * @example
 * ```ts
 * import type { IncEmitMessage, IncChannelMessage, IncNapMessage } from '@napplet/nap/inc';
 * import { DOMAIN, installIncShim, incEmit, incOn } from '@napplet/nap/inc';
 * ```
 *
 * @module
 * @packageDocumentation
 */

export { DOMAIN } from './types.js';

export type {
  IncMessage,
  IncEmitMessage,
  IncSubscribeMessage,
  IncSubscribeResultMessage,
  IncUnsubscribeMessage,
  IncEventMessage,
  IncChannelOpenMessage,
  IncChannelOpenResultMessage,
  IncChannelOpenedMessage,
  IncChannelEmitMessage,
  IncChannelEventMessage,
  IncChannelBroadcastMessage,
  IncChannelListMessage,
  IncChannelListResultMessage,
  IncChannelCloseMessage,
  IncChannelClosedMessage,
  IncTopicMessage,
  IncChannelMessage,
  IncOutboundMessage,
  IncInboundMessage,
  IncNapMessage,
} from './types.js';

export {
  broadcast,
  channel,
  emit,
  handleIncEvent,
  handleIncMessage,
  installIncShim,
  list,
  on,
  onOpened,
  open,
} from './shim.js';

export {
  incBroadcast,
  incEmit,
  incListChannels,
  incOn,
  incOnChannelOpened,
  incOpenChannel,
} from './sdk.js';

import { registerNap } from '@napplet/core';
import { DOMAIN } from './types.js';

/**
 * Register the inc domain with the core dispatch singleton.
 * Handler is a no-op placeholder -- the shell/shim provide real handlers.
 * Registration ensures dispatch.getRegisteredDomains() includes 'inc'.
 */
registerNap(DOMAIN, (_msg) => {
  /* Shell or shim replaces this handler at runtime */
});
