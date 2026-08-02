import type {
  EventTemplate,
  NostrFilter,
  OutboxEventOptions,
  OutboxEventResult,
  OutboxPublishOptions,
  OutboxPublishResult,
  OutboxQueryOptions,
  OutboxRelayPlan,
  OutboxResult,
  OutboxSubscribeOptions,
  OutboxSubscription,
  OutboxTarget,
} from '@napplet/core';
import { requireDomain } from './require-napplet.js';
import type { SdkDomain } from './sdk-domain.js';

/**
 * Outbox-aware relay routing (NAP-OUTBOX): supply Nostr filters and intent and
 * let the shell discover the correct relays (NIP-65 write/read relays, fallbacks,
 * relay intelligence), query/deduplicate, validate signatures, and stream updates.
 * The shell owns relay discovery, routing, fallback, deduplication, signing, and
 * publish fanout.
 *
 * @example
 * ```ts
 * import { outbox } from '@napplet/sdk';
 *
 * const { events } = await outbox.query([{ authors: ['ab12...'], kinds: [1] }], {
 *   authors: ['ab12...'],
 * });
 * const sub = outbox.subscribe([{ kinds: [1] }], { timeoutMs: 3000 });
 * sub.on('event', (result) => render(result.event, result.sidecar?.relayHints));
 * ```
 */
export const outbox: SdkDomain<'outbox'> = {
  /**
   * Fetch one event by ID through shell-owned outbox routing.
   * @param eventId  Event id to fetch
   * @param options  Optional author/relay hints and timeout
   * @returns Promise resolving to the outbox event result
   */
  getEvent(
    eventId: string,
    options?: OutboxEventOptions,
  ): Promise<OutboxEventResult> {
    return requireDomain('outbox').getEvent(eventId, options);
  },

  /**
   * Perform a one-shot outbox-aware query.
   * @param filters  NIP-01 filter or filters
   * @param options  Optional query options
   * @returns Promise resolving to the outbox result
   */
  query(
    filters: NostrFilter | NostrFilter[],
    options?: OutboxQueryOptions,
  ): Promise<OutboxResult> {
    return requireDomain('outbox').query(filters, options);
  },

  /**
   * Open a live outbox-aware subscription.
   * @param filters  NIP-01 filter or filters
   * @param options  Optional subscribe options
   * @returns An OutboxSubscription handle with `on(...)` and `close()`
   */
  subscribe(
    filters: NostrFilter | NostrFilter[],
    options?: OutboxSubscribeOptions,
  ): OutboxSubscription {
    return requireDomain('outbox').subscribe(filters, options);
  },

  /**
   * Publish a shell-signed event using outbox-aware relay fanout.
   * @param template  Unsigned event template
   * @param options   Optional publish options
   * @returns Promise resolving to the outbox publish result
   */
  publish(
    template: EventTemplate,
    options?: OutboxPublishOptions,
  ): Promise<OutboxPublishResult> {
    return requireDomain('outbox').publish(template, options);
  },

  /**
   * Resolve the relay plan the shell would use for a read/write target.
   * @param target  The read/write target
   * @returns Promise resolving to the relay plan
   */
  resolveRelays(target: OutboxTarget): Promise<OutboxRelayPlan> {
    return requireDomain('outbox').resolveRelays(target);
  },
};
