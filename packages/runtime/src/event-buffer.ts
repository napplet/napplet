/**
 * event-buffer.ts — Ring buffer and subscription delivery engine.
 *
 * Buffers events in a fixed-size ring buffer and delivers matching
 * events to subscribed napplets via the abstract sendToNapplet transport.
 */

import type { NostrEvent, NostrFilter, Capability } from '@napplet/core';
import type { SendToNapplet } from './types.js';
import type { NappKeyRegistry } from './napp-key-registry.js';
import type { EnforceResult } from './enforce.js';

/** Default ring buffer size. */
export const RING_BUFFER_SIZE = 100;

/** Subscription entry — tracks a subscription for a specific napplet window. */
export interface SubscriptionEntry {
  windowId: string;
  filters: NostrFilter[];
}

/**
 * Check if an event matches a single NIP-01 filter.
 * Pure function — no side effects.
 *
 * @param event - The event to check
 * @param filter - The filter to match against
 * @returns True if the event matches the filter
 */
export function matchesFilter(event: NostrEvent, filter: NostrFilter): boolean {
  if (filter.ids !== undefined && !filter.ids.some((id) => event.id.startsWith(id))) return false;
  if (filter.authors !== undefined && !filter.authors.some((a) => event.pubkey.startsWith(a))) return false;
  if (filter.kinds !== undefined && !filter.kinds.includes(event.kind)) return false;
  if (filter.since !== undefined && event.created_at < filter.since) return false;
  if (filter.until !== undefined && event.created_at > filter.until) return false;
  for (const [key, values] of Object.entries(filter)) {
    if (!key.startsWith('#') || values === undefined) continue;
    const tagName = key.slice(1);
    const tagValues = values as string[];
    const eventTagValues = event.tags.filter((t) => t[0] === tagName).map((t) => t[1]);
    if (!tagValues.some((v) => eventTagValues.includes(v))) return false;
  }
  return true;
}

/**
 * Check if an event matches any filter in a list.
 * Returns true for empty filter lists.
 *
 * @param event - The event to check
 * @param filters - The filters to match against
 * @returns True if the event matches any filter (or if filters is empty)
 */
export function matchesAnyFilter(event: NostrEvent, filters: NostrFilter[]): boolean {
  if (filters.length === 0) return true;
  return filters.some((filter) => matchesFilter(event, filter));
}

/** Event buffer and subscription delivery engine. */
export interface EventBuffer {
  /** Add an event to the ring buffer and deliver to matching subscriptions. */
  bufferAndDeliver(event: NostrEvent, senderId: string | null): void;

  /** Deliver an event to matching subscriptions without buffering. */
  deliverToSubscriptions(event: NostrEvent, senderId: string | null): void;

  /** Get the current subscription map (for REQ handler to register subs). */
  getSubscriptions(): Map<string, SubscriptionEntry>;

  /** Get buffered events (for REQ replay). */
  getBufferedEvents(): readonly NostrEvent[];

  /** Clear the buffer. */
  clear(): void;
}

/**
 * Create an event buffer with subscription delivery.
 *
 * @param sendToNapplet - Transport function to send messages to napplets
 * @param nappKeyRegistry - Identity registry for looking up napp pubkeys
 * @param enforce - Enforcement function for checking relay:read on recipients
 * @param subscriptions - Shared subscription map (owned by the runtime)
 * @returns An EventBuffer instance
 */
export function createEventBuffer(
  sendToNapplet: SendToNapplet,
  nappKeyRegistry: NappKeyRegistry,
  enforce: (pubkey: string, capability: Capability) => EnforceResult,
  subscriptions: Map<string, SubscriptionEntry>,
): EventBuffer {
  const buffer: NostrEvent[] = [];

  function deliverToSubscriptions(event: NostrEvent, senderId: string | null): void {
    const pTag = event.tags?.find((t) => t[0] === 'p');
    const targetPubkey = pTag?.[1];

    for (const [subKey, sub] of subscriptions) {
      if (senderId !== null && sub.windowId === senderId) continue;

      // Check relay:read ACL on the recipient at delivery time
      const recipientPubkey = nappKeyRegistry.getPubkey(sub.windowId);
      if (recipientPubkey) {
        const recipientResult = enforce(recipientPubkey, 'relay:read');
        if (!recipientResult.allowed) continue;
      }

      if (targetPubkey) {
        const subPubkey = recipientPubkey;
        if (subPubkey !== targetPubkey) continue;
      }

      if (!matchesAnyFilter(event, sub.filters)) continue;

      const prefix = `${sub.windowId}:`;
      if (!subKey.startsWith(prefix)) continue;
      const subId = subKey.slice(prefix.length);

      sendToNapplet(sub.windowId, ['EVENT', subId, event]);
    }
  }

  return {
    bufferAndDeliver(event: NostrEvent, senderId: string | null): void {
      if (buffer.length >= RING_BUFFER_SIZE) buffer.shift();
      buffer.push(event);
      deliverToSubscriptions(event, senderId);
    },

    deliverToSubscriptions,

    getSubscriptions(): Map<string, SubscriptionEntry> { return subscriptions; },

    getBufferedEvents(): readonly NostrEvent[] { return buffer; },

    clear(): void {
      buffer.length = 0;
    },
  };
}
