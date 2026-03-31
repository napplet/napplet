/**
 * cache-service.ts — Local event cache as a ServiceHandler.
 *
 * Wraps an existing cache implementation (query, store, isAvailable)
 * as a ServiceHandler that receives raw NIP-01 messages. Cache
 * subscriptions are one-shot queries — REQ triggers a query and
 * immediate EOSE, unlike relay pool subscriptions which stay open.
 */

import type { NostrEvent, NostrFilter } from '@napplet/core';
import type { ServiceHandler } from '@napplet/runtime';

/**
 * Options for creating a cache service.
 *
 * @example
 * ```ts
 * const cacheService = createCacheService({
 *   query: (filters) => myIndexedDB.query(filters),
 *   store: (event) => myIndexedDB.store(event),
 *   isAvailable: () => true,
 * });
 * ```
 */
export interface CacheServiceOptions {
  /**
   * Query cached events matching the given filters.
   *
   * @param filters - NIP-01 filter objects
   * @returns Promise resolving to matching cached events
   */
  query(filters: NostrFilter[]): Promise<NostrEvent[]>;

  /**
   * Store an event in cache. Best-effort, may silently fail.
   *
   * @param event - The event to store
   */
  store(event: NostrEvent): void;

  /**
   * Whether the cache is available.
   *
   * @returns true if the cache can handle requests
   */
  isAvailable(): boolean;
}

/**
 * Create a cache service that wraps an existing cache implementation
 * as a ServiceHandler.
 *
 * Cache REQ subscriptions are one-shot — they query, deliver results,
 * send EOSE, and are done. No long-lived subscription tracking needed.
 * Cache query failures are best-effort: EOSE is sent even on failure.
 *
 * @param options - Cache implementation to wrap
 * @returns A ServiceHandler ready for runtime.registerService('cache', handler)
 *
 * @example
 * ```ts
 * import { createCacheService } from '@napplet/services';
 *
 * const cache = createCacheService({
 *   query: (f) => workerRelay.query(f),
 *   store: (e) => workerRelay.store(e),
 *   isAvailable: () => workerRelay.ready,
 * });
 * runtime.registerService('cache', cache);
 * ```
 */
export function createCacheService(options: CacheServiceOptions): ServiceHandler {
  return {
    descriptor: {
      name: 'cache',
      version: '1.0.0',
      description: 'Local event cache (IndexedDB, worker relay, etc.)',
    },

    handleMessage(_windowId: string, message: unknown[], send: (msg: unknown[]) => void): void {
      const verb = message[0];

      if (verb === 'REQ') {
        const subId = message[1] as string;
        if (typeof subId !== 'string') return;
        const filters = message.slice(2) as NostrFilter[];

        if (!options.isAvailable()) {
          send(['EOSE', subId]);
          return;
        }

        options
          .query(filters)
          .then((events) => {
            for (const event of events) {
              send(['EVENT', subId, event]);
            }
            send(['EOSE', subId]);
          })
          .catch(() => {
            // Cache query is best-effort — send EOSE even on failure
            send(['EOSE', subId]);
          });
        return;
      }

      if (verb === 'EVENT') {
        const event = message[1] as NostrEvent | undefined;
        if (event && typeof event === 'object' && options.isAvailable()) {
          try {
            options.store(event);
          } catch {
            /* Cache write is best-effort */
          }
        }
        return;
      }
    },

    // Cache has no per-window state to clean up
    onWindowDestroyed(_windowId: string): void {
      /* no-op */
    },
  };
}
