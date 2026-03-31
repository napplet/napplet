/**
 * coordinated-relay.ts — Composite relay + cache ServiceHandler.
 *
 * Combines relay pool and cache into a single service that handles
 * REQ by querying both sources, deduplicating events by ID, and
 * sending a unified EOSE after both sources complete.
 *
 * This is a convenience helper for shell implementors. Those who need
 * custom coordination can write their own composite service.
 */

import type { NostrEvent, NostrFilter } from '@napplet/core';
import type { ServiceHandler } from '@napplet/runtime';
import type { RelayPoolServiceOptions } from './relay-pool-service.js';
import type { CacheServiceOptions } from './cache-service.js';

// Timer globals available in all JS runtimes
declare function setTimeout(callback: () => void, ms: number): unknown;
declare function clearTimeout(id: unknown): void;

/** Default EOSE fallback timeout. */
const DEFAULT_EOSE_TIMEOUT_MS = 15_000;

/**
 * Options for creating a coordinated relay service.
 *
 * @example
 * ```ts
 * const relay = createCoordinatedRelay({
 *   relayPool: {
 *     subscribe: (f, cb, urls) => pool.subscribe(f, cb, urls),
 *     publish: (e) => pool.publish(e),
 *     selectRelayTier: (f) => pool.selectRelays(f),
 *     isAvailable: () => pool.connected,
 *   },
 *   cache: {
 *     query: (f) => db.query(f),
 *     store: (e) => db.store(e),
 *     isAvailable: () => db.ready,
 *   },
 * });
 * runtime.registerService('relay', relay);
 * ```
 */
export interface CoordinatedRelayOptions {
  /**
   * Relay pool implementation.
   * Uses the same interface as RelayPoolServiceOptions.
   */
  relayPool: RelayPoolServiceOptions;

  /**
   * Local cache implementation.
   * Uses the same interface as CacheServiceOptions.
   */
  cache: CacheServiceOptions;

  /**
   * EOSE fallback timeout in milliseconds.
   * Sent if relay pool doesn't respond within this time.
   * Default: 15000 (15 seconds).
   */
  eoseTimeoutMs?: number;
}

/** Internal state for a tracked subscription. */
interface TrackedSub {
  seenIds: Set<string>;
  cacheEose: boolean;
  relayEose: boolean;
  eoseSent: boolean;
  eoseTimer: unknown;
  relayHandle: { unsubscribe(): void } | null;
}

/**
 * Create a coordinated relay service that combines relay pool and cache
 * into a single ServiceHandler with dedup and unified EOSE.
 *
 * On REQ: queries cache first, then subscribes to relay pool. Events
 * are deduplicated by ID. EOSE is sent after both sources complete.
 * On EVENT: publishes to relay pool and stores in cache.
 * On CLOSE: cancels relay pool subscription.
 *
 * @param options - Relay pool and cache implementations to coordinate
 * @returns A ServiceHandler ready for runtime.registerService('relay', handler)
 *
 * @example
 * ```ts
 * import { createCoordinatedRelay } from '@napplet/services';
 *
 * const relay = createCoordinatedRelay({ relayPool: myPool, cache: myCache });
 * runtime.registerService('relay', relay);
 * ```
 */
export function createCoordinatedRelay(options: CoordinatedRelayOptions): ServiceHandler {
  const timeoutMs = options.eoseTimeoutMs ?? DEFAULT_EOSE_TIMEOUT_MS;
  const subs = new Map<string, TrackedSub>();

  function maybeSendEose(subKey: string, subId: string, send: (msg: unknown[]) => void): void {
    const sub = subs.get(subKey);
    if (!sub || sub.eoseSent) return;
    if (sub.cacheEose && sub.relayEose) {
      sub.eoseSent = true;
      clearTimeout(sub.eoseTimer);
      send(['EOSE', subId]);
    }
  }

  return {
    descriptor: {
      name: 'relay',
      version: '1.0.0',
      description: 'Coordinated relay pool + cache with dedup and unified EOSE',
    },

    handleMessage(windowId: string, message: unknown[], send: (msg: unknown[]) => void): void {
      const verb = message[0];

      if (verb === 'REQ') {
        const subId = message[1] as string;
        if (typeof subId !== 'string') return;
        const filters = message.slice(2) as NostrFilter[];
        const subKey = `${windowId}:${subId}`;

        // Cancel existing subscription for this key
        const existing = subs.get(subKey);
        if (existing) {
          existing.relayHandle?.unsubscribe();
          clearTimeout(existing.eoseTimer);
          subs.delete(subKey);
        }

        const cacheAvailable = options.cache.isAvailable();
        const relayAvailable = options.relayPool.isAvailable();

        // Neither source available — send EOSE immediately
        if (!cacheAvailable && !relayAvailable) {
          send(['EOSE', subId]);
          return;
        }

        const tracked: TrackedSub = {
          seenIds: new Set(),
          cacheEose: !cacheAvailable, // mark done if cache not available
          relayEose: !relayAvailable, // mark done if relay not available
          eoseSent: false,
          eoseTimer: null as unknown,
          relayHandle: null,
        };
        subs.set(subKey, tracked);

        function deliver(event: NostrEvent): void {
          if (tracked.seenIds.has(event.id)) return;
          tracked.seenIds.add(event.id);
          if (subs.has(subKey)) send(['EVENT', subId, event]);
        }

        // Query cache (async)
        if (cacheAvailable) {
          options.cache
            .query(filters)
            .then((events) => {
              for (const event of events) deliver(event);
              tracked.cacheEose = true;
              maybeSendEose(subKey, subId, send);
            })
            .catch(() => {
              // Cache query is best-effort
              tracked.cacheEose = true;
              maybeSendEose(subKey, subId, send);
            });
        }

        // Subscribe to relay pool
        if (relayAvailable) {
          tracked.eoseTimer = setTimeout(() => {
            if (!tracked.eoseSent) {
              tracked.relayEose = true;
              maybeSendEose(subKey, subId, send);
            }
          }, timeoutMs);

          const relayUrls = options.relayPool.selectRelayTier(filters);
          tracked.relayHandle = options.relayPool.subscribe(filters, (item) => {
            if (item === 'EOSE') {
              clearTimeout(tracked.eoseTimer);
              tracked.relayEose = true;
              maybeSendEose(subKey, subId, send);
              return;
            }
            deliver(item);
            // Store relay events in cache
            if (cacheAvailable) {
              try { options.cache.store(item); } catch { /* best-effort */ }
            }
          }, relayUrls);
        }
        return;
      }

      if (verb === 'CLOSE') {
        const subId = message[1] as string;
        if (typeof subId !== 'string') return;
        const subKey = `${windowId}:${subId}`;
        const entry = subs.get(subKey);
        if (entry) {
          entry.relayHandle?.unsubscribe();
          clearTimeout(entry.eoseTimer);
          subs.delete(subKey);
        }
        return;
      }

      if (verb === 'EVENT') {
        const event = message[1] as NostrEvent | undefined;
        if (!event || typeof event !== 'object') return;
        // Publish to relay pool
        if (options.relayPool.isAvailable()) {
          options.relayPool.publish(event);
        }
        // Store in cache
        if (options.cache.isAvailable()) {
          try { options.cache.store(event); } catch { /* best-effort */ }
        }
        return;
      }
    },

    onWindowDestroyed(windowId: string): void {
      const prefix = `${windowId}:`;
      for (const [key, entry] of subs) {
        if (key.startsWith(prefix)) {
          entry.relayHandle?.unsubscribe();
          clearTimeout(entry.eoseTimer);
          subs.delete(key);
        }
      }
    },
  };
}
