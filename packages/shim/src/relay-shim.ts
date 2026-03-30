// @napplet/shim — Napp relay API
// NIP-01 wire format over postMessage to the shell pseudo-relay.

import type { NostrEvent, NostrFilter } from './types.js';

/** Handle returned by subscribe() and query() for teardown. */
export interface Subscription {
  /** Close the subscription and stop receiving events. */
  close(): void;
}

/**
 * Unsigned event template passed to publish().
 * The shell signs it via the NIP-07 proxy before broadcasting.
 */
export interface EventTemplate {
  /** Nostr event kind number */
  kind: number;
  /** Event content (typically plaintext or JSON string) */
  content: string;
  /** Event tags (NIP-01 tag arrays) */
  tags: string[][];
  /** Unix timestamp (seconds since epoch) */
  created_at: number;
}

/**
 * Open a live NIP-01 subscription through the shell's relay pool.
 *
 * Sends `['REQ', subId, ...filters]` via postMessage to the parent shell.
 * The shell queries its local cache and connected relays, streaming
 * matching events back via `['EVENT', subId, event]`.
 *
 * @param filters   One or more NIP-01 subscription filters
 * @param onEvent   Called for each matching event delivered by the shell
 * @param onEose    Called when the shell signals end of stored events (EOSE)
 * @param options   Optional: `{ relay, group }` for NIP-29 scoped relay subscriptions
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
    if (!Array.isArray(msg) || msg.length < 2) return;
    const [verb, msgSubId] = msg;
    if (msgSubId !== subId) return;

    if (verb === 'EVENT' && msg.length >= 3) {
      onEvent(msg[2] as NostrEvent);
    } else if (verb === 'EOSE') {
      onEose();
    } else if (verb === 'CLOSED') {
      window.removeEventListener('message', handleMessage);
    }
  }

  window.addEventListener('message', handleMessage);

  if (options?.relay) {
    // Scoped relay (NIP-29 group relay)
    const connectEvent = {
      kind: 29001,
      content: '',
      tags: [
        ['t', 'shell:relay-scoped-connect'],
        ['url', options.relay],
        ['group', options.group ?? ''],
        ['sub-id', subId],
        ['filters', JSON.stringify(normalizedFilters)],
      ],
      created_at: Math.floor(Date.now() / 1000),
    };
    window.parent.postMessage(['EVENT', connectEvent], '*');

    return {
      close(): void {
        const closeEvent = {
          kind: 29001,
          content: '',
          tags: [['t', 'shell:relay-scoped-close']],
          created_at: Math.floor(Date.now() / 1000),
        };
        window.parent.postMessage(['EVENT', closeEvent], '*');
        window.removeEventListener('message', handleMessage);
      },
    };
  }

  // Standard shared pool REQ
  window.parent.postMessage(['REQ', subId, ...normalizedFilters], '*');

  return {
    close(): void {
      window.parent.postMessage(['CLOSE', subId], '*');
      window.removeEventListener('message', handleMessage);
    },
  };
}


/**
 * Sign and publish a Nostr event through the shell.
 *
 * The event template is signed via `window.nostr.signEvent()` (NIP-07 proxy),
 * then posted to the parent shell for relay broadcast.
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

  if (options?.relay) {
    // Publish to scoped relay
    const publishEvent = {
      kind: 29001,
      content: '',
      tags: [
        ['t', 'shell:relay-scoped-publish'],
        ['event', JSON.stringify(signedEvent)],
      ],
      created_at: Math.floor(Date.now() / 1000),
    };
    window.parent.postMessage(['EVENT', publishEvent], '*');
  } else {
    // Publish to shared pool
    window.parent.postMessage(['EVENT', signedEvent], '*');
  }

  return signedEvent;
}

/**
 * One-shot query: subscribe, collect events until EOSE, then close and resolve.
 *
 * Equivalent to calling subscribe() and collecting results until EOSE,
 * but packaged as a single Promise-based call for convenience.
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
  return new Promise((resolve) => {
    const events: NostrEvent[] = [];
    const sub = subscribe(
      filters,
      (ev) => events.push(ev),
      () => { sub.close(); resolve(events); },
    );
  });
}
