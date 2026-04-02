/**
 * SessionRegistry — windowId to verified napplet pubkey bidirectional mapping.
 *
 * After a successful AUTH handshake, the runtime registers the napplet's
 * verified pubkey here. Both mappings are kept in sync.
 *
 * Unlike the shell singleton version, this is a factory that accepts
 * an optional notifier callback instead of using window.dispatchEvent.
 */

import type { SessionEntry, PendingUpdate, PendingUpdateNotifier } from './types.js';

/**
 * Bidirectional registry mapping windowIds to verified napplet pubkeys.
 * Maintained by the runtime after successful AUTH handshakes.
 *
 * @example
 * ```ts
 * const registry = createSessionRegistry();
 * registry.register('win-1', entry);
 * const pubkey = registry.getPubkey('win-1');
 * ```
 */
export interface SessionRegistry {
  /** Register a napplet entry, mapping windowId to pubkey and vice versa. */
  register(windowId: string, entry: SessionEntry): void;
  /** Unregister a napplet by windowId, removing both mappings. */
  unregister(windowId: string): void;
  /** Get the pubkey associated with a windowId. */
  getPubkey(windowId: string): string | undefined;
  /** Get the full entry for a napplet pubkey. */
  getEntry(pubkey: string): SessionEntry | undefined;
  /** Get the windowId for a napplet pubkey. */
  getWindowId(pubkey: string): string | undefined;
  /** Check if a windowId has a registered napplet. */
  isRegistered(windowId: string): boolean;
  /** Get all registered napplet entries. */
  getAllEntries(): SessionEntry[];
  /** Get the instance GUID for a window. */
  getInstanceId(windowId: string): string | undefined;
  /** Set a pending update for a window (napplet reconnected with different hash). */
  setPendingUpdate(windowId: string, update: PendingUpdate): void;
  /** Get a pending update for a window. */
  getPendingUpdate(windowId: string): PendingUpdate | undefined;
  /** Clear a pending update for a window. */
  clearPendingUpdate(windowId: string): void;
  /** Clear all registrations and pending updates. */
  clear(): void;
}

/** @deprecated Use SessionRegistry. Will be removed in v0.9.0. */
export type NappKeyRegistry = SessionRegistry;

/**
 * Create a new SessionRegistry instance.
 *
 * @param notifier - Optional callback invoked when pending updates change
 * @returns A SessionRegistry instance
 *
 * @example
 * ```ts
 * const registry = createSessionRegistry((windowId) => {
 *   console.log('Pending update changed for', windowId);
 * });
 * ```
 */
export function createSessionRegistry(notifier?: PendingUpdateNotifier): SessionRegistry {
  const byWindowId = new Map<string, string>();
  const byPubkey = new Map<string, SessionEntry>();
  const pendingUpdates = new Map<string, PendingUpdate>();

  return {
    register(windowId: string, entry: SessionEntry): void {
      byWindowId.set(windowId, entry.pubkey);
      byPubkey.set(entry.pubkey, entry);
    },

    unregister(windowId: string): void {
      const pubkey = byWindowId.get(windowId);
      if (pubkey) {
        byPubkey.delete(pubkey);
        byWindowId.delete(windowId);
      }
      pendingUpdates.delete(windowId);
    },

    getPubkey(windowId: string): string | undefined {
      return byWindowId.get(windowId);
    },

    getEntry(pubkey: string): SessionEntry | undefined {
      return byPubkey.get(pubkey);
    },

    getWindowId(pubkey: string): string | undefined {
      return byPubkey.get(pubkey)?.windowId;
    },

    isRegistered(windowId: string): boolean {
      return byWindowId.has(windowId);
    },

    getAllEntries(): SessionEntry[] {
      return Array.from(byPubkey.values());
    },

    getInstanceId(windowId: string): string | undefined {
      const pubkey = byWindowId.get(windowId);
      if (!pubkey) return undefined;
      return byPubkey.get(pubkey)?.instanceId;
    },

    setPendingUpdate(windowId: string, update: PendingUpdate): void {
      pendingUpdates.set(windowId, update);
      notifier?.(windowId);
    },

    getPendingUpdate(windowId: string): PendingUpdate | undefined {
      return pendingUpdates.get(windowId);
    },

    clearPendingUpdate(windowId: string): void {
      pendingUpdates.delete(windowId);
      notifier?.(windowId);
    },

    clear(): void {
      byWindowId.clear();
      byPubkey.clear();
      pendingUpdates.clear();
    },
  };
}

/** @deprecated Use createSessionRegistry. Will be removed in v0.9.0. */
export const createNappKeyRegistry = createSessionRegistry;
