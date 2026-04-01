/**
 * State proxy — shell-side handler for napplet state requests.
 *
 * Napplets without allow-same-origin cannot access localStorage directly.
 * This proxy stores napplet state in the shell's localStorage, scoped by
 * napplet identity (pubkey:dTag:aggregateHash).
 */

import type { NostrEvent } from '@napplet/core';
import { BusKind, TOPICS } from '@napplet/core';
import { sessionRegistry } from './session-registry.js';
import { aclStore } from './acl-store.js';

function scopedKey(pubkey: string, dTag: string, aggregateHash: string, userKey: string): string {
  return `napplet-state:${pubkey}:${dTag}:${aggregateHash}:${userKey}`;
}

function calculateNappStateBytes(
  pubkey: string, dTag: string, aggregateHash: string, excludeUserKey?: string,
): number {
  const prefix = `napplet-state:${pubkey}:${dTag}:${aggregateHash}:`;
  const excludeScopedKey = excludeUserKey
    ? `napplet-state:${pubkey}:${dTag}:${aggregateHash}:${excludeUserKey}`
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
    kind: BusKind.IPC_PEER,
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
 * @param windowId - The window identifier of the requesting napplet
 * @param sourceWindow - The Window reference to send responses to
 * @param event - The NostrEvent containing the state request
 */
export function handleStateRequest(
  windowId: string, sourceWindow: Window, event: NostrEvent,
): void {
  const topic = event.tags?.find((t) => t[0] === 't')?.[1];
  const key = event.tags?.find((t) => t[0] === 'key')?.[1];
  const correlationId = event.tags?.find((t) => t[0] === 'id')?.[1] ?? '';

  const pubkey = sessionRegistry.getPubkey(windowId);
  if (!pubkey) { sendError(sourceWindow, correlationId, 'auth-required: not registered'); return; }
  const entry = sessionRegistry.getEntry(pubkey);
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
        sendError(sourceWindow, correlationId, `quota exceeded: napplet state limit is ${quota} bytes`);
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
      const prefix = `napplet-state:${pubkey}:${dTag}:${aggregateHash}:`;
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
 * Remove all state entries for a napplet identity from localStorage.
 * Used during napplet cleanup when a window is closed.
 *
 * @param pubkey - The napplet's pubkey
 * @param dTag - The napplet's dTag
 * @param aggregateHash - The napplet's build hash
 */
export function cleanupNappState(pubkey: string, dTag: string, aggregateHash: string): void {
  const prefix = `napplet-state:${pubkey}:${dTag}:${aggregateHash}:`;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) keysToRemove.push(key);
  }
  for (const key of keysToRemove) localStorage.removeItem(key);
}
