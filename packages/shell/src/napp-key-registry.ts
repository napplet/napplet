/**
 * NappKeyRegistry — windowId to verified napp pubkey bidirectional mapping.
 *
 * After a successful AUTH handshake, the pseudo-relay registers the napp's
 * verified pubkey here. Both mappings are kept in sync.
 */

import type { NappKeyEntry } from './types.js';

export interface PendingUpdate {
  windowId: string;
  pubkey: string;
  dTag: string;
  oldHash: string;
  newHash: string;
  resolve: (action: 'accept' | 'block') => void;
}

const byWindowId = new Map<string, string>();
const byPubkey = new Map<string, NappKeyEntry>();
const pendingUpdates = new Map<string, PendingUpdate>();

let _pendingVersion = 0;
export function getPendingUpdateVersion(): number { return _pendingVersion; }

export const nappKeyRegistry = {
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
    _pendingVersion++;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('napplet:pending-update', { detail: { windowId } }));
    }
  },

  getPendingUpdate(windowId: string): PendingUpdate | undefined {
    return pendingUpdates.get(windowId);
  },

  clearPendingUpdate(windowId: string): void {
    pendingUpdates.delete(windowId);
    _pendingVersion++;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('napplet:pending-update', { detail: { windowId } }));
    }
  },

  clear(): void {
    byWindowId.clear();
    byPubkey.clear();
    pendingUpdates.clear();
  },
};
