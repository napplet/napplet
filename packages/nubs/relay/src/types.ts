/**
 * @napplet/nub-relay -- Relay proxy message types for the JSON envelope wire protocol.
 *
 * Defines the 9 message types exchanged between napplet and shell for relay operations:
 * - Napplet -> Shell: subscribe, close, publish, query
 * - Shell -> Napplet: event, eose, closed, publish.result, query.result
 *
 * All types form a discriminated union on the `type` field.
 */

import type { NappletMessage } from '@napplet/core';
import type { NostrEvent, NostrFilter } from '@napplet/core';

// ─── Domain Constants ──────────────────────────────────────────────────────

/** The NUB domain name for relay messages. */
export const DOMAIN = 'relay' as const;

// ─── Base Message Type ─────────────────────────────────────────────────────

/**
 * Base interface for all relay NUB messages.
 * Concrete message types narrow the `type` field to specific literals.
 */
export interface RelayMessage extends NappletMessage {
  /** Message type in "relay.<action>" format. */
  type: `relay.${string}`;
}

// ─── Napplet -> Shell Messages ─────────────────────────────────────────────

/**
 * Open a relay subscription with one or more NIP-01 filters.
 * Shell routes to its relay pool and streams matching events back.
 *
 * @example
 * ```ts
 * const msg: RelaySubscribeMessage = {
 *   type: 'relay.subscribe',
 *   id: crypto.randomUUID(),
 *   subId: 'my-sub-1',
 *   filters: [{ kinds: [1], limit: 10 }],
 * };
 * ```
 */
export interface RelaySubscribeMessage extends RelayMessage {
  type: 'relay.subscribe';
  /** Correlation ID for this request. */
  id: string;
  /** Subscription ID for the event stream lifecycle. */
  subId: string;
  /** One or more NIP-01 subscription filters. */
  filters: NostrFilter[];
  /** Optional: target a specific relay URL. */
  relay?: string;
}

/**
 * Close an active relay subscription.
 *
 * @example
 * ```ts
 * const msg: RelayCloseMessage = {
 *   type: 'relay.close',
 *   id: crypto.randomUUID(),
 *   subId: 'my-sub-1',
 * };
 * ```
 */
export interface RelayCloseMessage extends RelayMessage {
  type: 'relay.close';
  /** Correlation ID for this request. */
  id: string;
  /** Subscription ID to close. */
  subId: string;
}

/**
 * Publish a signed Nostr event through the shell's relay pool.
 *
 * @example
 * ```ts
 * const msg: RelayPublishMessage = {
 *   type: 'relay.publish',
 *   id: crypto.randomUUID(),
 *   event: signedEvent,
 * };
 * ```
 */
export interface RelayPublishMessage extends RelayMessage {
  type: 'relay.publish';
  /** Correlation ID for this request. */
  id: string;
  /** The signed Nostr event to publish. */
  event: NostrEvent;
}

/**
 * One-shot query: subscribe, collect events until EOSE, close, return results.
 *
 * @example
 * ```ts
 * const msg: RelayQueryMessage = {
 *   type: 'relay.query',
 *   id: crypto.randomUUID(),
 *   filters: [{ kinds: [0], authors: ['abc...'] }],
 * };
 * ```
 */
export interface RelayQueryMessage extends RelayMessage {
  type: 'relay.query';
  /** Correlation ID for this request. */
  id: string;
  /** NIP-01 subscription filters for the query. */
  filters: NostrFilter[];
}

// ─── Shell -> Napplet Messages ─────────────────────────────────────────────

/**
 * A matching event delivered to an active subscription.
 */
export interface RelayEventMessage extends RelayMessage {
  type: 'relay.event';
  /** Subscription ID this event belongs to. */
  subId: string;
  /** The matching Nostr event. */
  event: NostrEvent;
}

/**
 * End of stored events signal for a subscription.
 * After this, only new real-time events will arrive.
 */
export interface RelayEoseMessage extends RelayMessage {
  type: 'relay.eose';
  /** Subscription ID that reached end of stored events. */
  subId: string;
}

/**
 * Subscription was closed by the shell or upstream relay.
 */
export interface RelayClosedMessage extends RelayMessage {
  type: 'relay.closed';
  /** Subscription ID that was closed. */
  subId: string;
  /** Optional reason for closure. */
  reason?: string;
}

/**
 * Result of a relay.publish request.
 * The shell signs the event template and returns the full signed event.
 */
export interface RelayPublishResultMessage extends RelayMessage {
  type: 'relay.publish.result';
  /** Correlation ID matching the original publish request. */
  id: string;
  /** Whether the publish succeeded. */
  ok: boolean;
  /** The signed event returned by the shell. */
  event?: NostrEvent;
  /** The event ID if publish succeeded. */
  eventId?: string;
  /** Error message if publish failed. */
  error?: string;
}

/**
 * Result of a relay.query request (one-shot query).
 */
export interface RelayQueryResultMessage extends RelayMessage {
  type: 'relay.query.result';
  /** Correlation ID matching the original query request. */
  id: string;
  /** Array of matching events. */
  events: NostrEvent[];
  /** Error message if query failed. */
  error?: string;
}

// ─── Discriminated Union ───────────────────────────────────────────────────

/** Napplet -> Shell relay messages. */
export type RelayOutboundMessage =
  | RelaySubscribeMessage
  | RelayCloseMessage
  | RelayPublishMessage
  | RelayQueryMessage;

/** Shell -> Napplet relay messages. */
export type RelayInboundMessage =
  | RelayEventMessage
  | RelayEoseMessage
  | RelayClosedMessage
  | RelayPublishResultMessage
  | RelayQueryResultMessage;

/** All relay NUB message types (discriminated union on `type` field). */
export type RelayNubMessage = RelayOutboundMessage | RelayInboundMessage;
