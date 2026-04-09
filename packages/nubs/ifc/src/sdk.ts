/**
 * @napplet/nub-ifc -- SDK helpers wrapping window.napplet.ipc.
 *
 * These convenience functions delegate to `window.napplet.ipc.*` at call time.
 * The shim must be imported somewhere to install the global.
 */

import type { NappletGlobal, NostrEvent, Subscription } from '@napplet/core';

// ─── Runtime guard ──────────────────────────────────────────────────────────

function requireIpc(): NappletGlobal['ipc'] {
  const w = window as Window & { napplet?: NappletGlobal };
  if (!w.napplet?.ipc) {
    throw new Error('window.napplet.ipc not installed -- import @napplet/shim first');
  }
  return w.napplet.ipc;
}

// ─── SDK functions ──────────────────────────────────────────────────────────

/**
 * Broadcast an IPC-PEER event to other napplets via the shell.
 *
 * @param topic      The 't' tag value (e.g., 'profile:open')
 * @param extraTags  Additional NIP-01 tags beyond the 't' tag (default: [])
 * @param content    Event content (default: empty string)
 *
 * @example
 * ```ts
 * import { ifcEmit } from '@napplet/nub-ifc';
 *
 * ifcEmit('profile:open', [], JSON.stringify({ pubkey: '...' }));
 * ```
 */
export function ifcEmit(topic: string, extraTags?: string[][], content?: string): void {
  requireIpc().emit(topic, extraTags, content);
}

/**
 * Subscribe to IPC-PEER events on a specific topic.
 *
 * @param topic     The 't' tag value to listen for
 * @param callback  Called with `(payload, event)` for each matching event
 * @returns A Subscription handle with a `close()` method
 *
 * @example
 * ```ts
 * import { ifcOn } from '@napplet/nub-ifc';
 *
 * const sub = ifcOn('profile:open', (payload) => {
 *   console.log('Profile requested:', payload);
 * });
 * // Later: sub.close();
 * ```
 */
export function ifcOn(
  topic: string,
  callback: (payload: unknown, event: NostrEvent) => void,
): Subscription {
  return requireIpc().on(topic, callback);
}
