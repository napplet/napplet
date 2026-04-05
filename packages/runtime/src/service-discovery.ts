/**
 * service-discovery.ts — Kind 29010 discovery event synthesis.
 *
 * The runtime (not a service) handles discovery by enumerating its own
 * service registry and generating synthetic NIP-01 events. Follows
 * RUNTIME-SPEC.md Section 11.2 for event format and tag structure.
 */

import type { NostrEvent } from '@napplet/core';
import { BusKind } from '@napplet/core';
import type { ServiceHandler, ServiceRegistry } from './types.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Sentinel pubkey for runtime-generated synthetic events (64 zeros). */
const SENTINEL_PUBKEY = '0'.repeat(64);

/** Sentinel signature for runtime-generated synthetic events (128 zeros). */
const SENTINEL_SIG = '0'.repeat(128);

// ─── Discovery Subscription ───────────────────────────────────────────────────

/**
 * Tracks a live discovery subscription that should receive updates
 * when services are registered dynamically via registerService().
 */
export interface DiscoverySubscription {
  /** The napplet window that owns this subscription. */
  windowId: string;
  /** The NIP-01 subscription ID. */
  subId: string;
}

// ─── Synthetic Event Creation ─────────────────────────────────────────────────

/**
 * Create a synthetic kind 29010 discovery event for a single service.
 *
 * Uses sentinel values for pubkey and sig (consistent with injectEvent()
 * pattern). Tags follow RUNTIME-SPEC.md Section 11.2: s (name), v (version),
 * optional d (description).
 *
 * @param handler - The service handler containing the descriptor
 * @param randomId - A random hex string for the event id (64 chars)
 * @returns A synthetic NostrEvent describing the service
 *
 * @example
 * ```ts
 * const event = createServiceDiscoveryEvent(audioHandler, crypto.randomUUID());
 * // event.tags = [['s', 'audio'], ['v', '1.0.0'], ['d', 'Audio playback']]
 * ```
 */
export function createServiceDiscoveryEvent(
  handler: ServiceHandler,
  randomId: string,
): NostrEvent {
  const { name, version, description } = handler.descriptor;
  const tags: string[][] = [['s', name], ['v', version]];
  if (description) {
    tags.push(['d', description]);
  }
  return {
    id: randomId,
    pubkey: SENTINEL_PUBKEY,
    created_at: Math.floor(Date.now() / 1000),
    kind: BusKind.SERVICE_DISCOVERY,
    tags,
    content: '{}',
    sig: SENTINEL_SIG,
  };
}

// ─── Discovery REQ Handler ────────────────────────────────────────────────────

/**
 * Handle a kind 29010 discovery REQ. Enumerates all registered services,
 * sends one synthetic EVENT per service, then sends EOSE.
 *
 * If the registry is empty, sends EOSE immediately with zero EVENTs (DISC-04).
 *
 * Returns a DiscoverySubscription entry for tracking live subscriptions.
 * The caller should store this if the napplet keeps the subscription open
 * (subscribe() pattern) so that future registerService() calls can push
 * new descriptors to the napplet.
 *
 * @param windowId - The napplet window requesting discovery
 * @param subId - The NIP-01 subscription ID from the REQ
 * @param services - The current service registry
 * @param send - Callback to send NIP-01 messages to the napplet
 * @param generateId - Function to generate random hex IDs for synthetic events
 * @returns A DiscoverySubscription for live update tracking
 *
 * @example
 * ```ts
 * const sub = handleDiscoveryReq('win-1', 'svc-disc', registry, sendFn, uuidFn);
 * discoverySubscriptions.set('win-1:svc-disc', sub);
 * ```
 */
export function handleDiscoveryReq(
  windowId: string,
  subId: string,
  services: ServiceRegistry,
  send: (msg: unknown[]) => void,
  generateId: () => string,
): DiscoverySubscription {
  // Send one EVENT per registered service
  for (const handler of Object.values(services)) {
    const id = generateId();
    const event = createServiceDiscoveryEvent(handler, id);
    send(['EVENT', subId, event]);
  }

  // Send EOSE to signal end of stored events
  send(['EOSE', subId]);

  return { windowId, subId };
}

// ─── Discovery REQ Detection ──────────────────────────────────────────────────

/**
 * Check whether all filters in a REQ target kind 29010 exclusively.
 * Returns true if every filter has a kinds array containing 29010 (and only 29010).
 * Used to decide whether to intercept the REQ for discovery handling.
 *
 * @param filters - The NIP-01 filter objects from the REQ
 * @returns true if this is a pure discovery REQ
 *
 * @example
 * ```ts
 * if (isDiscoveryReq(filters)) {
 *   handleDiscoveryReq(windowId, subId, services, send, generateId);
 * }
 * ```
 */
export function isDiscoveryReq(filters: Array<{ kinds?: number[] }>): boolean {
  if (filters.length === 0) return false;
  return filters.every(
    (f) => f.kinds !== undefined && f.kinds.length > 0 && f.kinds.every((k) => k === BusKind.SERVICE_DISCOVERY),
  );
}
