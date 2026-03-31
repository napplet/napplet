/**
 * relay-pool-service.ts — Relay pool as a ServiceHandler.
 *
 * Wraps an existing relay pool implementation (subscribe, publish,
 * selectRelayTier, isAvailable) as a ServiceHandler that receives
 * raw NIP-01 messages and manages subscription lifecycle.
 */

import type { NostrEvent, NostrFilter } from '@napplet/core';
import type { ServiceHandler } from '@napplet/runtime';

// Timer globals available in all JS runtimes
declare function setTimeout(callback: () => void, ms: number): unknown;
declare function clearTimeout(id: unknown): void;

/** EOSE fallback timeout in milliseconds. */
const EOSE_FALLBACK_MS = 15_000;

/**
 * Options for creating a relay pool service.
 *
 * @example
 * ```ts
 * const relayPoolService = createRelayPoolService({
 *   subscribe: (filters, cb, urls) => myPool.subscribe(filters, cb, urls),
 *   publish: (event) => myPool.publish(event),
 *   selectRelayTier: (filters) => myPool.selectRelays(filters),
 *   isAvailable: () => myPool.connected,
 * });
 * ```
 */
export interface RelayPoolServiceOptions {
  /**
   * Subscribe to events matching filters. Returns handle with unsubscribe().
   *
   * @param filters - NIP-01 filter objects
   * @param callback - Receives matching events or 'EOSE'
   * @param relayUrls - Optional relay URL hints
   * @returns Handle to cancel the subscription
   */
  subscribe(
    filters: NostrFilter[],
    callback: (item: NostrEvent | 'EOSE') => void,
    relayUrls?: string[],
  ): { unsubscribe(): void };

  /**
   * Publish an event to relays.
   *
   * @param event - The event to publish
   */
  publish(event: NostrEvent): void;

  /**
   * Select relay URLs appropriate for the given filters.
   *
   * @param filters - NIP-01 filter objects
   * @returns Array of relay URLs
   */
  selectRelayTier(filters: NostrFilter[]): string[];

  /**
   * Whether the relay pool is available and connected.
   *
   * @returns true if the relay pool can handle requests
   */
  isAvailable(): boolean;
}

/** Internal subscription tracking entry. */
interface TrackedSubscription {
  handle: { unsubscribe(): void };
  eoseTimer: unknown;
}

/**
 * Create a relay pool service that wraps an existing relay pool
 * implementation as a ServiceHandler.
 *
 * Handles REQ (subscribe), CLOSE (unsubscribe), and EVENT (publish) verbs.
 * Tracks subscriptions per windowId:subId for lifecycle management.
 * Sets a 15-second EOSE fallback timer on each subscription.
 *
 * @param options - Relay pool implementation to wrap
 * @returns A ServiceHandler ready for runtime.registerService('relay-pool', handler)
 *
 * @example
 * ```ts
 * import { createRelayPoolService } from '@napplet/services';
 *
 * const pool = createRelayPoolService({
 *   subscribe: (f, cb, urls) => applesauce.subscribe(f, cb, urls),
 *   publish: (e) => applesauce.publish(e),
 *   selectRelayTier: (f) => applesauce.getRelays(f),
 *   isAvailable: () => applesauce.connected,
 * });
 * runtime.registerService('relay-pool', pool);
 * ```
 */
export function createRelayPoolService(options: RelayPoolServiceOptions): ServiceHandler {
  const tracked = new Map<string, TrackedSubscription>();

  return {
    descriptor: {
      name: 'relay-pool',
      version: '1.0.0',
      description: 'Relay pool subscription and publishing',
    },

    handleMessage(windowId: string, message: unknown[], send: (msg: unknown[]) => void): void {
      const verb = message[0];

      if (verb === 'REQ') {
        const subId = message[1] as string;
        if (typeof subId !== 'string') return;
        const filters = message.slice(2) as NostrFilter[];
        const subKey = `${windowId}:${subId}`;

        // Cancel existing subscription for this key if any
        const existing = tracked.get(subKey);
        if (existing) {
          existing.handle.unsubscribe();
          clearTimeout(existing.eoseTimer);
          tracked.delete(subKey);
        }

        if (!options.isAvailable()) {
          send(['EOSE', subId]);
          return;
        }

        const relayUrls = options.selectRelayTier(filters);
        let eoseSent = false;

        const eoseTimer = setTimeout(() => {
          if (!eoseSent) {
            eoseSent = true;
            send(['EOSE', subId]);
          }
        }, EOSE_FALLBACK_MS);

        const handle = options.subscribe(filters, (item) => {
          if (item === 'EOSE') {
            clearTimeout(eoseTimer);
            if (!eoseSent) {
              eoseSent = true;
              send(['EOSE', subId]);
            }
            return;
          }
          send(['EVENT', subId, item]);
        }, relayUrls);

        tracked.set(subKey, { handle, eoseTimer });
        return;
      }

      if (verb === 'CLOSE') {
        const subId = message[1] as string;
        if (typeof subId !== 'string') return;
        const subKey = `${windowId}:${subId}`;
        const entry = tracked.get(subKey);
        if (entry) {
          entry.handle.unsubscribe();
          clearTimeout(entry.eoseTimer);
          tracked.delete(subKey);
        }
        return;
      }

      if (verb === 'EVENT') {
        const event = message[1] as NostrEvent | undefined;
        if (event && typeof event === 'object' && options.isAvailable()) {
          options.publish(event);
        }
        return;
      }
    },

    onWindowDestroyed(windowId: string): void {
      const prefix = `${windowId}:`;
      for (const [key, entry] of tracked) {
        if (key.startsWith(prefix)) {
          entry.handle.unsubscribe();
          clearTimeout(entry.eoseTimer);
          tracked.delete(key);
        }
      }
    },
  };
}
