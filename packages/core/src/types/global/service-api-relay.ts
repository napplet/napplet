import type { EventTemplate, NostrFilter } from '../nostr.js';
import type {
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
} from '../outbox.js';

/**
 * Outbox-aware relay routing (NAP-OUTBOX): the napplet supplies Nostr filters
 * and intent; the shell discovers the correct relays (NIP-65 write/read relays,
 * fallbacks, relay intelligence), queries them, deduplicates events by id,
 * validates signatures, and streams updates. The shell owns relay discovery,
 * routing, fallback, deduplication, signing, and publish fanout policy.
 *
 * Use this instead of NAP-RELAY when relay selection is part of result
 * correctness (reading an author's notes from their write relays, publishing to
 * the user's write relays, fanning a directed event to recipient inbox relays).
 *
 * @example
 * ```ts
 * if (window.napplet.outbox) {
 *   const { events } = await window.napplet.outbox.query(
 *     [{ authors: ['ab12...'], kinds: [1], limit: 20 }],
 *     { authors: ['ab12...'], timeoutMs: 3000 },
 *   );
 * }
 * ```
 */
export interface OutboxApi {
  /**
   * Fetch one event by ID through shell-owned outbox routing. The shell validates
   * that any returned event matches the requested id and has a valid signature.
   * @param eventId  Event id to fetch
   * @param options  Optional author/relay hints and timeout
   * @returns Promise resolving to the outbox event result
   */
  getEvent(eventId: string, options?: OutboxEventOptions): Promise<OutboxEventResult>;
  /**
   * Perform a one-shot outbox-aware query. The shell resolves relays, queries
   * them, deduplicates by event id, validates signatures, and returns
   * `RelayEventResult` records. Partial results carry `incomplete: true`; a
   * query-level failure arrives as inline `error`.
   * @param filters  NIP-01 filter or filters
   * @param options  Optional query options (authors, relays, limit, timeoutMs)
   * @returns Promise resolving to the outbox result
   */
  query(filters: NostrFilter | NostrFilter[], options?: OutboxQueryOptions): Promise<OutboxResult>;
  /**
   * Open a live outbox-aware subscription. The shell may add/remove relay
   * connections as NIP-65 relay lists change and streams until `close()` or
   * `outbox.closed`.
   * @param filters  NIP-01 filter or filters
   * @param options  Optional subscribe options
   * @returns An OutboxSubscription handle with `on(...)` and `close()`
   */
  subscribe(filters: NostrFilter | NostrFilter[], options?: OutboxSubscribeOptions): OutboxSubscription;
  /**
   * Publish a shell-signed event using outbox-aware relay fanout.
   * @param template  Unsigned event template; the shell signs before fanout
   * @param options   Optional publish fanout (`relays`, `toOutbox`, `toInboxes`);
   *                  `toOutbox` defaults to true when omitted
   * @returns Promise resolving to the outbox publish result
   */
  publish(template: EventTemplate, options?: OutboxPublishOptions): Promise<OutboxPublishResult>;
  /**
   * Resolve the relay plan the shell would use for a read/write target.
   * Useful for diagnostics/UI; prefer query/subscribe/publish for access.
   * @param target  The read/write target (authors/pubkey, direction)
   * @returns Promise resolving to the relay plan
   */
  resolveRelays(target: OutboxTarget): Promise<OutboxRelayPlan>;
}
