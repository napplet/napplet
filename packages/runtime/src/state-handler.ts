/**
 * state-handler.ts — State request handler using persistence hooks.
 *
 * Handles napplet state operations (get, set, remove, clear, keys)
 * by delegating storage to StatePersistence. No localStorage.
 */

import type { NostrEvent } from '@napplet/core';
import { BusKind } from '@napplet/core';
import type { SendToNapplet, StatePersistence } from './types.js';
import type { SessionRegistry } from './session-registry.js';
import type { AclStateContainer } from './acl-state.js';

function scopedKey(dTag: string, aggregateHash: string, userKey: string): string {
  return `napplet-state:${dTag}:${aggregateHash}:${userKey}`;
}

/** Build a legacy scoped key that includes pubkey (for migration reads). */
function legacyScopedKey(pubkey: string, dTag: string, aggregateHash: string, userKey: string): string {
  return `napplet-state:${pubkey}:${dTag}:${aggregateHash}:${userKey}`;
}

/** Compute byte length of a UTF-8 string without TextEncoder (ES2022-safe). */
function byteLength(str: string): number {
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) bytes += 1;
    else if (c < 0x800) bytes += 2;
    else if (c < 0xd800 || c >= 0xe000) bytes += 3;
    else { i++; bytes += 4; } // surrogate pair
  }
  return bytes;
}

function sendResponse(
  sendToNapplet: SendToNapplet,
  windowId: string,
  correlationId: string,
  tags: string[][],
): void {
  const responseEvent: Partial<NostrEvent> = {
    kind: BusKind.IPC_PEER,
    pubkey: '',
    created_at: Math.floor(Date.now() / 1000),
    tags: [['t', 'napplet:state-response'], ['id', correlationId], ...tags],
    content: '',
    id: '',
    sig: '',
  };
  sendToNapplet(windowId, ['EVENT', '__shell__', responseEvent]);
}

function sendError(
  sendToNapplet: SendToNapplet,
  windowId: string,
  correlationId: string,
  reason: string,
): void {
  sendResponse(sendToNapplet, windowId, correlationId, [['error', reason]]);
}

/**
 * Handle a state request from a napplet.
 * Routes to the appropriate operation (get, set, remove, clear, keys) based on topic.
 *
 * @param windowId - The window identifier of the requesting napplet
 * @param event - The NostrEvent containing the state request
 * @param sendToNapplet - Transport function to send responses
 * @param sessionRegistry - Identity registry for looking up napplet session identity
 * @param aclState - ACL state for quota checks
 * @param statePersistence - State storage backend
 */
export function handleStateRequest(
  windowId: string,
  event: NostrEvent,
  sendToNapplet: SendToNapplet,
  sessionRegistry: SessionRegistry,
  aclState: AclStateContainer,
  statePersistence: StatePersistence,
): void {
  const topic = event.tags?.find((t) => t[0] === 't')?.[1];
  const key = event.tags?.find((t) => t[0] === 'key')?.[1];
  const correlationId = event.tags?.find((t) => t[0] === 'id')?.[1] ?? '';

  const pubkey = sessionRegistry.getPubkey(windowId);
  if (!pubkey) { sendError(sendToNapplet, windowId, correlationId, 'auth-required: not registered'); return; }
  const entry = sessionRegistry.getEntry(pubkey);
  if (!entry) { sendError(sendToNapplet, windowId, correlationId, 'auth-required: no entry'); return; }

  const { dTag, aggregateHash } = entry;
  const prefix = `napplet-state:${dTag}:${aggregateHash}:`;
  const legacyPrefix = `napplet-state:${pubkey}:${dTag}:${aggregateHash}:`;

  switch (topic) {
    case 'shell:state-get': {
      if (!key) { sendError(sendToNapplet, windowId, correlationId, 'missing key tag'); return; }
      const newKey = scopedKey(dTag, aggregateHash, key);
      const legacyKeyWithPubkey = legacyScopedKey(pubkey, dTag, aggregateHash, key);
      const oldPrefixKey = `napp-state:${pubkey}:${dTag}:${aggregateHash}:${key}`;
      // Triple-read: try new format first, then legacy with pubkey, then old prefix for migration
      const result = statePersistence.get(newKey) ?? statePersistence.get(legacyKeyWithPubkey) ?? statePersistence.get(oldPrefixKey) ?? null;
      sendResponse(sendToNapplet, windowId, correlationId, [
        ['value', result ?? ''], ['found', result !== null ? 'true' : 'false'],
      ]);
      break;
    }
    case 'shell:state-set': {
      if (!key) { sendError(sendToNapplet, windowId, correlationId, 'missing key tag'); return; }
      const value = event.tags?.find((t) => t[0] === 'value')?.[1] ?? '';
      const quota = aclState.getStateQuota(pubkey, dTag, aggregateHash);
      const sk = scopedKey(dTag, aggregateHash, key);
      const newWriteBytes = byteLength(sk + value);
      const existingBytes = statePersistence.calculateBytes(prefix, key);
      if (existingBytes + newWriteBytes > quota) {
        sendError(sendToNapplet, windowId, correlationId, `quota exceeded: napplet state limit is ${quota} bytes`);
        return;
      }
      const success = statePersistence.set(sk, value);
      if (success) {
        sendResponse(sendToNapplet, windowId, correlationId, [['ok', 'true']]);
      } else {
        sendError(sendToNapplet, windowId, correlationId, 'state write failed');
      }
      break;
    }
    case 'shell:state-remove': {
      if (!key) { sendError(sendToNapplet, windowId, correlationId, 'missing key tag'); return; }
      const sk = scopedKey(dTag, aggregateHash, key);
      statePersistence.remove(sk);
      sendResponse(sendToNapplet, windowId, correlationId, [['ok', 'true']]);
      break;
    }
    case 'shell:state-clear': {
      statePersistence.clear(prefix);
      statePersistence.clear(legacyPrefix);
      sendResponse(sendToNapplet, windowId, correlationId, [['ok', 'true']]);
      break;
    }
    case 'shell:state-keys': {
      const newKeys = statePersistence.keys(prefix);
      const legacyKeys = statePersistence.keys(legacyPrefix);
      // Merge: strip prefixes to get user-facing names, deduplicate
      const userKeySet = new Set<string>();
      for (const k of newKeys) userKeySet.add(k.startsWith(prefix) ? k.slice(prefix.length) : k);
      for (const k of legacyKeys) userKeySet.add(k.startsWith(legacyPrefix) ? k.slice(legacyPrefix.length) : k);
      const userKeys = Array.from(userKeySet);
      sendResponse(sendToNapplet, windowId, correlationId, userKeys.map(k => ['key', k]));
      break;
    }
    default:
      sendError(sendToNapplet, windowId, correlationId, `unknown state topic: ${topic}`);
      break;
  }
}

/**
 * Remove all state entries for a napplet identity.
 * Clears both new-format and legacy-format keys for completeness.
 * Used during napplet cleanup when a window is closed.
 *
 * @param pubkey - The napplet's pubkey (needed for legacy key cleanup)
 * @param dTag - The napplet's dTag
 * @param aggregateHash - The napplet's build hash
 * @param statePersistence - State storage backend
 */
export function cleanupNappState(
  pubkey: string,
  dTag: string,
  aggregateHash: string,
  statePersistence: StatePersistence,
): void {
  // Clear new format
  const prefix = `napplet-state:${dTag}:${aggregateHash}:`;
  statePersistence.clear(prefix);
  // Clear legacy format (includes pubkey)
  const legacyPrefix = `napplet-state:${pubkey}:${dTag}:${aggregateHash}:`;
  statePersistence.clear(legacyPrefix);
}
