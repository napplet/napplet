/**
 * acl-history.ts — Per-napplet ACL event ring buffer.
 *
 * Captures every ACL enforcement check (allow + deny) with full event context.
 * Provides per-napplet and global query functions for the inspector panel.
 */

import type { AclCheckEvent } from '@napplet/shell';

// ─── Extended Event Type ────────────────────────────────────────────────────

export interface AclHistoryEntry extends AclCheckEvent {
  /** Monotonic index for ordering. */
  index: number;
  /** Timestamp when the event was captured. */
  timestamp: number;
  /** The windowId of the napplet (resolved from pubkey). */
  windowId: string;
  /** Human-readable napplet name (for display). */
  nappletName: string;
}

// ─── Ring Buffer Store ──────────────────────────────────────────────────────

/** Default ring buffer size per napplet. */
const DEFAULT_ACL_RING_SIZE = 50;

let aclRingSize = DEFAULT_ACL_RING_SIZE;

/** Set the ACL ring buffer size (called from demo-config integration). */
export function setAclRingSize(size: number): void {
  aclRingSize = Math.max(1, Math.floor(size));
}

/** Get current ring buffer size. */
export function getAclRingSize(): number {
  return aclRingSize;
}

let nextIndex = 0;

// Per-windowId ring buffers
const aclRings = new Map<string, AclHistoryEntry[]>();

// Global ring (all napplets combined, for ACL node view)
const globalAclRing: AclHistoryEntry[] = [];

// ─── Push Function ──────────────────────────────────────────────────────────

/**
 * Push an ACL check event into both per-napplet and global ring buffers.
 *
 * @param event - The ACL check event from the enforce gate
 * @param windowId - The napplet's window identifier
 * @param nappletName - Human-readable napplet name
 */
export function pushAclEvent(
  event: AclCheckEvent,
  windowId: string,
  nappletName: string,
): void {
  const entry: AclHistoryEntry = {
    ...event,
    index: nextIndex++,
    timestamp: Date.now(),
    windowId,
    nappletName,
  };

  // Per-napplet ring
  let ring = aclRings.get(windowId);
  if (!ring) {
    ring = [];
    aclRings.set(windowId, ring);
  }
  ring.push(entry);
  if (ring.length > aclRingSize) ring.shift();

  // Global ring
  globalAclRing.push(entry);
  if (globalAclRing.length > aclRingSize * 4) globalAclRing.shift();
}

// ─── Query Functions ────────────────────────────────────────────────────────

/** Get ACL history for a specific napplet. */
export function getAclHistory(windowId: string): AclHistoryEntry[] {
  return aclRings.get(windowId) ?? [];
}

/** Get denial-only history for a specific napplet. */
export function getAclDenials(windowId: string): AclHistoryEntry[] {
  return (aclRings.get(windowId) ?? []).filter(e => e.decision === 'deny');
}

/** Get global ACL history (all napplets). */
export function getGlobalAclHistory(): AclHistoryEntry[] {
  return globalAclRing;
}

/** Get global denial-only history. */
export function getGlobalAclDenials(): AclHistoryEntry[] {
  return globalAclRing.filter(e => e.decision === 'deny');
}

/** Clear all history (for testing/reset). */
export function clearAclHistory(): void {
  aclRings.clear();
  globalAclRing.length = 0;
  nextIndex = 0;
}
