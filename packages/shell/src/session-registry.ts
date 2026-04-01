/**
 * SessionRegistry — windowId to verified napplet pubkey bidirectional mapping.
 *
 * After a successful AUTH handshake, the ShellBridge registers the napplet's
 * verified pubkey here. Both mappings are kept in sync.
 */

import type { SessionEntry } from './types.js';

/**
 * A pending napplet update — raised when a napplet reconnects with a different aggregateHash.
 * @example
 * ```ts
 * const update: PendingUpdate = {
 *   windowId: 'win-1', pubkey: 'abc...', dTag: '3chat',
 *   oldHash: 'aaa', newHash: 'bbb',
 *   resolve: (action) => { if (action === 'accept') { // apply } },
 * };
 * ```
 */
export interface PendingUpdate {
  windowId: string;
  pubkey: string;
  dTag: string;
  oldHash: string;
  newHash: string;
  resolve: (action: 'accept' | 'block') => void;
}

const byWindowId = new Map<string, string>();
const byPubkey = new Map<string, SessionEntry>();
const pendingUpdates = new Map<string, PendingUpdate>();

let _pendingVersion = 0;
function getPendingUpdateVersion(): number { return _pendingVersion; }

/**
 * Bidirectional registry mapping windowIds to verified napplet pubkeys.
 * Maintained by ShellBridge after successful AUTH handshakes.
 *
 * @example
 * ```ts
 * import { sessionRegistry } from '@napplet/shell';
 *
 * const pubkey = sessionRegistry.getPubkey('win-1');
 * const entry = pubkey ? sessionRegistry.getEntry(pubkey) : undefined;
 * ```
 */
export const sessionRegistry = {
  /**
   * Register a napplet entry, mapping windowId to pubkey and vice versa.
   *
   * @param windowId - The window identifier
   * @param entry - The verified napplet session entry from AUTH handshake
   */
  register(windowId: string, entry: SessionEntry): void {
    byWindowId.set(windowId, entry.pubkey);
    byPubkey.set(entry.pubkey, entry);
  },

  /**
   * Unregister a napplet by windowId, removing both mappings.
   *
   * @param windowId - The window identifier to remove
   */
  unregister(windowId: string): void {
    const pubkey = byWindowId.get(windowId);
    if (pubkey) {
      byPubkey.delete(pubkey);
      byWindowId.delete(windowId);
    }
    pendingUpdates.delete(windowId);
  },

  /**
   * Get the pubkey associated with a windowId.
   *
   * @param windowId - The window identifier
   * @returns The napplet's pubkey, or undefined if not registered
   */
  getPubkey(windowId: string): string | undefined {
    return byWindowId.get(windowId);
  },

  /**
   * Get the full entry for a napplet pubkey.
   *
   * @param pubkey - The napplet's pubkey
   * @returns The full SessionEntry, or undefined if not found
   */
  getEntry(pubkey: string): SessionEntry | undefined {
    return byPubkey.get(pubkey);
  },

  /**
   * Get the windowId for a napplet pubkey.
   *
   * @param pubkey - The napplet's pubkey
   * @returns The windowId, or undefined if not found
   */
  getWindowId(pubkey: string): string | undefined {
    return byPubkey.get(pubkey)?.windowId;
  },

  /**
   * Check if a windowId has a registered napplet.
   *
   * @param windowId - The window identifier
   * @returns True if the windowId has a registered napplet
   */
  isRegistered(windowId: string): boolean {
    return byWindowId.has(windowId);
  },

  /**
   * Get all registered napplet entries.
   *
   * @returns Array of all SessionEntry objects
   */
  getAllEntries(): SessionEntry[] {
    return Array.from(byPubkey.values());
  },

  /**
   * Set a pending update for a window (napplet reconnected with different hash).
   *
   * @param windowId - The window identifier
   * @param update - The pending update details with resolve callback
   */
  setPendingUpdate(windowId: string, update: PendingUpdate): void {
    pendingUpdates.set(windowId, update);
    _pendingVersion++;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('napplet:pending-update', { detail: { windowId } }));
    }
  },

  /**
   * Get a pending update for a window.
   *
   * @param windowId - The window identifier
   * @returns The pending update, or undefined if none
   */
  getPendingUpdate(windowId: string): PendingUpdate | undefined {
    return pendingUpdates.get(windowId);
  },

  /**
   * Clear a pending update for a window.
   *
   * @param windowId - The window identifier
   */
  clearPendingUpdate(windowId: string): void {
    pendingUpdates.delete(windowId);
    _pendingVersion++;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('napplet:pending-update', { detail: { windowId } }));
    }
  },

  /** Clear all registrations and pending updates. */
  clear(): void {
    byWindowId.clear();
    byPubkey.clear();
    pendingUpdates.clear();
  },
};

/** @deprecated Use sessionRegistry. Will be removed in v0.9.0. */
export const nappKeyRegistry = sessionRegistry;
