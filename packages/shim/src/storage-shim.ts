/**
 * Storage shim — napp-side localStorage-like API over postMessage.
 *
 * Without allow-same-origin, iframes have opaque origins and cannot access
 * localStorage directly. This shim provides an async API that routes storage
 * requests through the shell's storage proxy.
 *
 * Usage:
 *   import { nappStorage } from '@napplet/shim';
 *   const value = await nappStorage.getItem('my-key');
 *   await nappStorage.setItem('my-key', 'my-value');
 *   await nappStorage.removeItem('my-key');
 *   const allKeys = await nappStorage.keys();
 *   await nappStorage.clear();
 */

// Avoid circular import with index.ts — use a late-bound reference
let _sendInterPaneEvent: ((topic: string, tags: string[][], content?: string) => void) | null = null;

/** Set the sendInterPaneEvent function. Called from index.ts after module init. */
export function _setInterPaneEventSender(fn: (topic: string, tags: string[][], content?: string) => void): void {
  _sendInterPaneEvent = fn;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

// ─── Internal state ─────────────────────────────────────────────────────────

const pendingResponses = new Map<string, PendingRequest>();

/** Timeout for storage requests (5 seconds). */
const REQUEST_TIMEOUT_MS = 5000;

// ─── Response listener ──────────────────────────────────────────────────────

function handleStorageResponse(event: MessageEvent): void {
  if (event.source !== window.parent) return;
  const msg = event.data;
  if (!Array.isArray(msg) || msg[0] !== 'EVENT') return;

  const nostrEvent = msg[2];
  if (!nostrEvent?.tags) return;

  const topicTag = nostrEvent.tags.find((t: string[]) => t[0] === 't');
  if (topicTag?.[1] !== 'napp:storage-response') return;

  const idTag = nostrEvent.tags.find((t: string[]) => t[0] === 'id');
  const correlationId = idTag?.[1];
  if (!correlationId) return;

  const pending = pendingResponses.get(correlationId);
  if (!pending) return;
  pendingResponses.delete(correlationId);

  // Check for error
  const errorTag = nostrEvent.tags.find((t: string[]) => t[0] === 'error');
  if (errorTag) {
    pending.reject(new Error(errorTag[1]));
    return;
  }

  // Return the full response (caller extracts what they need)
  pending.resolve(nostrEvent);
}

// ─── Request helpers ────────────────────────────────────────────────────────

function sendStorageRequest(
  topic: string,
  tags: string[][],
): Promise<unknown> {
  const correlationId = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    pendingResponses.set(correlationId, { resolve, reject });

    if (!_sendInterPaneEvent) {
      reject(new Error('Storage shim not initialized'));
      return;
    }
    _sendInterPaneEvent(topic, [['id', correlationId], ...tags]);

    // 5-second timeout
    setTimeout(() => {
      if (pendingResponses.delete(correlationId)) {
        reject(new Error('Storage request timed out'));
      }
    }, REQUEST_TIMEOUT_MS);
  });
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Async localStorage-like storage API for sandboxed napps.
 *
 * Routes all storage operations through the shell's storage proxy via postMessage.
 * Each napp's storage is namespaced by its identity — napps cannot read each other's data.
 * A per-napp 512 KB quota is enforced by the shell.
 */
export const nappStorage = {
  /**
   * Retrieve a stored value by key.
   * Returns null if the key does not exist (matching localStorage semantics).
   *
   * @param key  The storage key
   * @returns The stored value, or null if not found
   */
  async getItem(key: string): Promise<string | null> {
    const response = await sendStorageRequest('shell:storage-get', [['key', key]]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = response as any;
    const foundTag = event.tags?.find((t: string[]) => t[0] === 'found');
    if (foundTag?.[1] === 'false') return null;
    const valueTag = event.tags?.find((t: string[]) => t[0] === 'value');
    return valueTag?.[1] ?? null;
  },

  /**
   * Store a key-value pair.
   *
   * @param key    The storage key
   * @param value  The string value to store
   * @throws If the napp exceeds its 512 KB storage quota
   */
  async setItem(key: string, value: string): Promise<void> {
    await sendStorageRequest('shell:storage-set', [['key', key], ['value', value]]);
  },

  /**
   * Remove a stored key.
   *
   * @param key  The storage key to remove
   */
  async removeItem(key: string): Promise<void> {
    await sendStorageRequest('shell:storage-remove', [['key', key]]);
  },

  /**
   * Remove all stored data for this napp.
   * Does not affect other napps' storage.
   */
  async clear(): Promise<void> {
    await sendStorageRequest('shell:storage-clear', []);
  },

  /**
   * List all keys stored by this napp.
   *
   * @returns Array of storage key strings
   */
  async keys(): Promise<string[]> {
    const response = await sendStorageRequest('shell:storage-keys', []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = response as any;
    const keyTags = event.tags?.filter((t: string[]) => t[0] === 'key') ?? [];
    return keyTags.map((t: string[]) => t[1]);
  },
};

// ─── Install ────────────────────────────────────────────────────────────────

/**
 * Install the storage response listener.
 * Called from index.ts during shim initialization.
 */
export function installStorageShim(): void {
  window.addEventListener('message', handleStorageResponse);
}
