// @napplet/shim -- Napp relay API
// JSON envelope wire format over postMessage to the ShellBridge.

import type { NostrEvent, NostrFilter, Subscription, EventTemplate } from '@napplet/core';
import type {
  RelaySubscribeMessage,
  RelayCloseMessage,
  RelayPublishMessage,
  RelayQueryMessage,
  RelayEventMessage,
  RelayEoseMessage,
  RelayClosedMessage,
  RelayQueryResultMessage,
} from '@napplet/nub-relay';

/**
 * Open a live relay subscription through the shell's relay pool.
 *
 * Sends a `relay.subscribe` envelope message via postMessage to the parent shell.
 * The shell queries its local cache and connected relays, streaming
 * matching events back via `relay.event` messages.
 *
 * @param filters   One or more NIP-01 subscription filters
 * @param onEvent   Called for each matching event delivered by the shell
 * @param onEose    Called when the shell signals end of stored events (EOSE)
 * @param options   Optional: `{ relay, group }` for scoped relay subscriptions
 * @returns A Subscription handle with a `close()` method to tear down the subscription
 *
 * @example
 * ```ts
 * const sub = subscribe(
 *   { kinds: [1], limit: 20 },
 *   (event) => console.log('Got event:', event),
 *   () => console.log('EOSE'),
 * );
 * // Later: sub.close();
 * ```
 */
export function subscribe(
  filters: NostrFilter | NostrFilter[],
  onEvent: (event: NostrEvent) => void,
  onEose: () => void,
  options?: { relay?: string; group?: string },
): Subscription {
  const normalizedFilters = Array.isArray(filters) ? filters : [filters];
  const subId = crypto.randomUUID();

  function handleMessage(msgEvent: MessageEvent): void {
    if (msgEvent.source !== window.parent) return;
    const msg = msgEvent.data;
    if (typeof msg !== 'object' || msg === null || typeof msg.type !== 'string') return;
    if (!msg.type.startsWith('relay.')) return;

    const typedMsg = msg as RelayEventMessage | RelayEoseMessage | RelayClosedMessage;
    if (!('subId' in typedMsg) || typedMsg.subId !== subId) return;

    if (msg.type === 'relay.event') {
      onEvent((msg as RelayEventMessage).event);
    } else if (msg.type === 'relay.eose') {
      onEose();
    } else if (msg.type === 'relay.closed') {
      window.removeEventListener('message', handleMessage);
    }
  }

  window.addEventListener('message', handleMessage);

  // Send relay.subscribe envelope (handles both standard and scoped relay)
  const subscribeMsg: RelaySubscribeMessage = {
    type: 'relay.subscribe',
    id: crypto.randomUUID(),
    subId,
    filters: normalizedFilters,
    ...(options?.relay ? { relay: options.relay } : {}),
  };
  window.parent.postMessage(subscribeMsg, '*');

  return {
    close(): void {
      const closeMsg: RelayCloseMessage = {
        type: 'relay.close',
        id: crypto.randomUUID(),
        subId,
      };
      window.parent.postMessage(closeMsg, '*');
      window.removeEventListener('message', handleMessage);
    },
  };
}


/**
 * Sign and publish a Nostr event through the shell.
 *
 * The event template is signed via `window.nostr.signEvent()` (NIP-07 proxy),
 * then posted to the parent shell as a `relay.publish` envelope message
 * for relay broadcast.
 *
 * @param template  Unsigned event template (kind, content, tags, created_at)
 * @param options   Optional: `{ relay: true }` to publish via the scoped relay instead of the shared pool
 * @returns The signed NostrEvent after successful publication
 *
 * @example
 * ```ts
 * const signed = await publish({
 *   kind: 1,
 *   content: 'Hello Nostr!',
 *   tags: [],
 *   created_at: Math.floor(Date.now() / 1000),
 * });
 * ```
 */
export async function publish(
  template: EventTemplate,
  options?: { relay?: boolean },
): Promise<NostrEvent> {
  const w = window as Window & { nostr?: { signEvent(e: EventTemplate): Promise<NostrEvent> } };
  if (!w.nostr?.signEvent) {
    throw new Error('window.nostr is not available');
  }

  const signedEvent = await w.nostr.signEvent(template) as unknown as NostrEvent;

  const publishMsg: RelayPublishMessage = {
    type: 'relay.publish',
    id: crypto.randomUUID(),
    event: signedEvent,
  };
  window.parent.postMessage(publishMsg, '*');

  return signedEvent;
}

/**
 * One-shot query: send a relay.query message, await relay.query.result, resolve.
 *
 * Uses the dedicated `relay.query` envelope message for a cleaner protocol
 * instead of subscribe + collect + close.
 *
 * @param filters  NIP-01 subscription filters (single or array)
 * @returns Promise resolving to an array of matching NostrEvent objects
 *
 * @example
 * ```ts
 * const profiles = await query({ kinds: [0], authors: [pubkey] });
 * ```
 */
export function query(filters: NostrFilter | NostrFilter[]): Promise<NostrEvent[]> {
  const normalizedFilters = Array.isArray(filters) ? filters : [filters];
  const queryId = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    function handleMessage(msgEvent: MessageEvent): void {
      if (msgEvent.source !== window.parent) return;
      const msg = msgEvent.data;
      if (typeof msg !== 'object' || msg === null || typeof msg.type !== 'string') return;
      if (msg.type !== 'relay.query.result') return;

      const result = msg as RelayQueryResultMessage;
      if (result.id !== queryId) return;

      window.removeEventListener('message', handleMessage);
      if (result.error) {
        reject(new Error(result.error));
      } else {
        resolve(result.events);
      }
    }

    window.addEventListener('message', handleMessage);

    const queryMsg: RelayQueryMessage = {
      type: 'relay.query',
      id: queryId,
      filters: normalizedFilters,
    };
    window.parent.postMessage(queryMsg, '*');
  });
}
