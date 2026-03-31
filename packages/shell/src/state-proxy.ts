/**
 * State proxy — shell-side handler for napp state requests.
 *
 * Napps without allow-same-origin cannot access localStorage directly.
 * This proxy stores napp state in the shell's localStorage, scoped by
 * napp identity (pubkey:dTag:aggregateHash).
 */

import type { NostrEvent } from '@napplet/core';
import { BusKind, TOPICS } from '@napplet/core';
import { nappKeyRegistry } from './napp-key-registry.js';
import { aclStore } from './acl-store.js';

function scopedKey(pubkey: string, dTag: string, aggregateHash: string, userKey: string): string {
  return `napp-state:${pubkey}:${dTag}:${aggregateHash}:${userKey}`;
}

function calculateNappStateBytes(
  pubkey: string, dTag: string, aggregateHash: string, excludeUserKey?: string,
): number {
  const prefix = `napp-state:${pubkey}:${dTag}:${aggregateHash}:`;
  const excludeScopedKey = excludeUserKey
    ? `napp-state:${pubkey}:${dTag}:${aggregateHash}:${excludeUserKey}`
    : null;
  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    if (excludeScopedKey && key === excludeScopedKey) continue;
    const value = localStorage.getItem(key) ?? '';
    totalBytes += new TextEncoder().encode(key + value).length;
  }
  return totalBytes;
}

function sendResponse(sourceWindow: Window, correlationId: string, tags: string[][]): void {
  const responseEvent: Partial<NostrEvent> = {
    kind: BusKind.INTER_PANE,
    pubkey: '',
    created_at: Math.floor(Date.now() / 1000),
    tags: [['t', TOPICS.STATE_RESPONSE], ['id', correlationId], ...tags],
    content: '',
    id: '',
    sig: '',
  };
  sourceWindow.postMessage(['EVENT', '__shell__', responseEvent], '*');
}

function sendError(sourceWindow: Window, correlationId: string, reason: string): void {
  sendResponse(sourceWindow, correlationId, [['error', reason]]);
}

/**
 * Handle a state request from a napplet iframe.
 * Routes to the appropriate operation (get, set, remove, clear, keys) based on topic.
 *
 * @param windowId - The window identifier of the requesting napp
 * @param sourceWindow - The Window reference to send responses to
 * @param event - The NostrEvent containing the state request
 */
export function handleStateRequest(
  windowId: string, sourceWindow: Window, event: NostrEvent,
): void {
  const topic = event.tags?.find((t) => t[0] === 't')?.[1];
  const key = event.tags?.find((t) => t[0] === 'key')?.[1];
  const correlationId = event.tags?.find((t) => t[0] === 'id')?.[1] ?? '';

  const pubkey = nappKeyRegistry.getPubkey(windowId);
  if (!pubkey) { sendError(sourceWindow, correlationId, 'auth-required: not registered'); return; }
  const entry = nappKeyRegistry.getEntry(pubkey);
  if (!entry) { sendError(sourceWindow, correlationId, 'auth-required: no entry'); return; }

  const { dTag, aggregateHash } = entry;

  switch (topic) {
    case TOPICS.STATE_GET: {
      if (!key) { sendError(sourceWindow, correlationId, 'missing key tag'); return; }
      const sk = scopedKey(pubkey, dTag, aggregateHash, key);
      const result = localStorage.getItem(sk);
      sendResponse(sourceWindow, correlationId, [
        ['value', result ?? ''], ['found', result !== null ? 'true' : 'false'],
      ]);
      break;
    }
    case TOPICS.STATE_SET: {
      if (!key) { sendError(sourceWindow, correlationId, 'missing key tag'); return; }
      const value = event.tags?.find((t) => t[0] === 'value')?.[1] ?? '';
      const quota = aclStore.getStateQuota(pubkey, dTag, aggregateHash);
      const newWriteBytes = new TextEncoder().encode(scopedKey(pubkey, dTag, aggregateHash, key) + value).length;
      const existingBytes = calculateNappStateBytes(pubkey, dTag, aggregateHash, key);
      if (existingBytes + newWriteBytes > quota) {
        sendError(sourceWindow, correlationId, `quota exceeded: napp state limit is ${quota} bytes`);
        return;
      }
      const sk = scopedKey(pubkey, dTag, aggregateHash, key);
      try {
        localStorage.setItem(sk, value);
        sendResponse(sourceWindow, correlationId, [['ok', 'true']]);
      } catch {
        /* localStorage write failed (quota exceeded or unavailable) */
        sendError(sourceWindow, correlationId, 'state write failed');
      }
      break;
    }
    case TOPICS.STATE_REMOVE: {
      if (!key) { sendError(sourceWindow, correlationId, 'missing key tag'); return; }
      const sk = scopedKey(pubkey, dTag, aggregateHash, key);
      localStorage.removeItem(sk);
      sendResponse(sourceWindow, correlationId, [['ok', 'true']]);
      break;
    }
    case TOPICS.STATE_CLEAR: {
      cleanupNappState(pubkey, dTag, aggregateHash);
      sendResponse(sourceWindow, correlationId, [['ok', 'true']]);
      break;
    }
    case TOPICS.STATE_KEYS: {
      const prefix = `napp-state:${pubkey}:${dTag}:${aggregateHash}:`;
      const userKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const lsKey = localStorage.key(i);
        if (lsKey?.startsWith(prefix)) userKeys.push(lsKey.slice(prefix.length));
      }
      sendResponse(sourceWindow, correlationId, userKeys.map(k => ['key', k]));
      break;
    }
    default:
      sendError(sourceWindow, correlationId, `unknown state topic: ${topic}`);
      break;
  }
}

/**
 * Remove all state entries for a napp identity from localStorage.
 * Used during napp cleanup when a window is closed.
 *
 * @param pubkey - The napp's pubkey
 * @param dTag - The napp's dTag
 * @param aggregateHash - The napp's build hash
 */
export function cleanupNappState(pubkey: string, dTag: string, aggregateHash: string): void {
  const prefix = `napp-state:${pubkey}:${dTag}:${aggregateHash}:`;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) keysToRemove.push(key);
  }
  for (const key of keysToRemove) localStorage.removeItem(key);
}
