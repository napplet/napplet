import type {
  DmConversationPage,
  DmConversationQuery,
  DmMessage,
  DmMessagePage,
  DmMessageQuery,
  DmOk,
  DmSendRequest,
  DmSendResult,
  DmStatus,
  DmSubscribeRequest,
  DmSubscription,
  Subscription,
} from '@napplet/core';
import { requireDomain } from './require-napplet.js';
import type { SdkDomain } from './sdk-domain.js';

/**
 * Runtime-mediated direct messages (NAP-DM): present DM UI while the runtime
 * owns signing, encryption, relay routing, storage, key/session state, and
 * policy.
 *
 * @example
 * ```ts
 * import { dm } from '@napplet/sdk';
 *
 * const { conversations } = await dm.conversations({ limit: 20 });
 * dm.onMessage((message) => render(message));
 * ```
 */
export const dm: SdkDomain<'dm'> = {
  /**
   * Get current DM availability and advisory runtime labels.
   * @returns Promise resolving to the runtime DM status
   */
  status(): Promise<DmStatus> {
    return requireDomain('dm').status();
  },

  /**
   * Fetch normalized conversations visible to this napplet.
   * @param query  Optional cursor and limit
   * @returns Promise resolving to a page of conversations
   */
  conversations(query?: DmConversationQuery): Promise<DmConversationPage> {
    return requireDomain('dm').conversations(query);
  },

  /**
   * Fetch normalized message history for one conversation.
   * @param query  Conversation id plus optional cursor and limit
   * @returns Promise resolving to a page of messages
   */
  messages(query: DmMessageQuery): Promise<DmMessagePage> {
    return requireDomain('dm').messages(query);
  },

  /**
   * Ask the runtime to send a direct message.
   * @param request  Recipients, content, and optional conversation/client ids
   * @returns Promise resolving to the normalized send result
   */
  send(request: DmSendRequest): Promise<DmSendResult> {
    return requireDomain('dm').send(request);
  },

  /**
   * Start live delivery for one conversation or all visible conversations.
   * @param request  Optional conversation scope
   * @returns Promise resolving to the runtime subscription id
   */
  subscribe(request?: DmSubscribeRequest): Promise<DmSubscription> {
    return requireDomain('dm').subscribe(request);
  },

  /**
   * Stop a live DM subscription.
   * @param subscriptionId  Runtime subscription id from subscribe()
   * @returns Promise resolving to the runtime acknowledgement
   */
  unsubscribe(subscriptionId: string): Promise<DmOk> {
    return requireDomain('dm').unsubscribe(subscriptionId);
  },

  /**
   * Register for shell-pushed `dm.message` deliveries.
   * @param handler  Called with each message and its runtime subscription id
   * @returns A Subscription with `close()` to stop listening
   */
  onMessage(
    handler: (message: DmMessage, subscriptionId: string) => void,
  ): Subscription {
    return requireDomain('dm').onMessage(handler);
  },
};
