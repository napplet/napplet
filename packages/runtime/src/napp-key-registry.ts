/**
 * NappKeyRegistry — windowId to verified napp pubkey bidirectional mapping.
 *
 * After a successful AUTH handshake, the runtime registers the napp's
 * verified pubkey here. Both mappings are kept in sync.
 *
 * Unlike the shell singleton version, this is a factory that accepts
 * an optional notifier callback instead of using window.dispatchEvent.
 */

import type { NappKeyEntry, PendingUpdate, PendingUpdateNotifier } from './types.js';

/**
 * Bidirectional registry mapping windowIds to verified napp pubkeys.
 * Maintained by the runtime after successful AUTH handshakes.
 *
 * @example
 * ```ts
 * const registry = createNappKeyRegistry();
 * registry.register('win-1', entry);
 * const pubkey = registry.getPubkey('win-1');
 * ```
 */
export interface NappKeyRegistry {
  /** Register a napp entry, mapping windowId to pubkey and vice versa. */
  register(windowId: string, entry: NappKeyEntry): void;
  /** Unregister a napp by windowId, removing both mappings. */
  unregister(windowId: string): void;
  /** Get the pubkey associated with a windowId. */
  getPubkey(windowId: string): string | undefined;
  /** Get the full entry for a napp pubkey. */
  getEntry(pubkey: string): NappKeyEntry | undefined;
  /** Get the windowId for a napp pubkey. */
  getWindowId(pubkey: string): string | undefined;
  /** Check if a windowId has a registered napp. */
  isRegistered(windowId: string): boolean;
  /** Get all registered napp entries. */
  getAllEntries(): NappKeyEntry[];
  /** Set a pending update for a window (napp reconnected with different hash). */
  setPendingUpdate(windowId: string, update: PendingUpdate): void;
  /** Get a pending update for a window. */
  getPendingUpdate(windowId: string): PendingUpdate | undefined;
  /** Clear a pending update for a window. */
  clearPendingUpdate(windowId: string): void;
  /** Clear all registrations and pending updates. */
  clear(): void;
}

/**
 * Create a new NappKeyRegistry instance.
 *
 * @param notifier - Optional callback invoked when pending updates change
 * @returns A NappKeyRegistry instance
 *
 * @example
 * ```ts
 * const registry = createNappKeyRegistry((windowId) => {
 *   console.log('Pending update changed for', windowId);
 * });
 * ```
 */
export function createNappKeyRegistry(notifier?: PendingUpdateNotifier): NappKeyRegistry {
  const byWindowId = new Map<string, string>();
  const byPubkey = new Map<string, NappKeyEntry>();
  const pendingUpdates = new Map<string, PendingUpdate>();

  return {
    register(windowId: string, entry: NappKeyEntry): void {
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

    getEntry(pubkey: string): NappKeyEntry | undefined {
      return byPubkey.get(pubkey);
    },

    getWindowId(pubkey: string): string | undefined {
      return byPubkey.get(pubkey)?.windowId;
    },

    isRegistered(windowId: string): boolean {
      return byWindowId.has(windowId);
    },

    getAllEntries(): NappKeyEntry[] {
      return Array.from(byPubkey.values());
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
