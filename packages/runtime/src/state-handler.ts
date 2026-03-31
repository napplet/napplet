/**
 * state-handler.ts — State request handler using persistence hooks.
 *
 * Handles napplet state operations (get, set, remove, clear, keys)
 * by delegating storage to RuntimeStatePersistence. No localStorage.
 */

import type { NostrEvent } from '@napplet/core';
import { BusKind } from '@napplet/core';
import type { SendToNapplet, RuntimeStatePersistence } from './types.js';
import type { NappKeyRegistry } from './napp-key-registry.js';
import type { AclStateContainer } from './acl-state.js';

function scopedKey(pubkey: string, dTag: string, aggregateHash: string, userKey: string): string {
  return `napp-state:${pubkey}:${dTag}:${aggregateHash}:${userKey}`;
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
    kind: BusKind.INTER_PANE,
    pubkey: '',
    created_at: Math.floor(Date.now() / 1000),
    tags: [['t', 'napp:state-response'], ['id', correlationId], ...tags],
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
 * @param windowId - The window identifier of the requesting napp
 * @param event - The NostrEvent containing the state request
 * @param sendToNapplet - Transport function to send responses
 * @param nappKeyRegistry - Identity registry for looking up napp identity
 * @param aclState - ACL state for quota checks
 * @param statePersistence - State storage backend
 */
export function handleStateRequest(
  windowId: string,
  event: NostrEvent,
  sendToNapplet: SendToNapplet,
  nappKeyRegistry: NappKeyRegistry,
  aclState: AclStateContainer,
  statePersistence: RuntimeStatePersistence,
): void {
  const topic = event.tags?.find((t) => t[0] === 't')?.[1];
  const key = event.tags?.find((t) => t[0] === 'key')?.[1];
  const correlationId = event.tags?.find((t) => t[0] === 'id')?.[1] ?? '';

  const pubkey = nappKeyRegistry.getPubkey(windowId);
  if (!pubkey) { sendError(sendToNapplet, windowId, correlationId, 'auth-required: not registered'); return; }
  const entry = nappKeyRegistry.getEntry(pubkey);
  if (!entry) { sendError(sendToNapplet, windowId, correlationId, 'auth-required: no entry'); return; }

  const { dTag, aggregateHash } = entry;
  const prefix = `napp-state:${pubkey}:${dTag}:${aggregateHash}:`;

  switch (topic) {
    case 'shell:state-get': {
      if (!key) { sendError(sendToNapplet, windowId, correlationId, 'missing key tag'); return; }
      const sk = scopedKey(pubkey, dTag, aggregateHash, key);
      const result = statePersistence.get(sk);
      sendResponse(sendToNapplet, windowId, correlationId, [
        ['value', result ?? ''], ['found', result !== null ? 'true' : 'false'],
      ]);
      break;
    }
    case 'shell:state-set': {
      if (!key) { sendError(sendToNapplet, windowId, correlationId, 'missing key tag'); return; }
      const value = event.tags?.find((t) => t[0] === 'value')?.[1] ?? '';
      const quota = aclState.getStateQuota(pubkey, dTag, aggregateHash);
      const sk = scopedKey(pubkey, dTag, aggregateHash, key);
      const newWriteBytes = byteLength(sk + value);
      const existingBytes = statePersistence.calculateBytes(prefix, key);
      if (existingBytes + newWriteBytes > quota) {
        sendError(sendToNapplet, windowId, correlationId, `quota exceeded: napp state limit is ${quota} bytes`);
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
      const sk = scopedKey(pubkey, dTag, aggregateHash, key);
      statePersistence.remove(sk);
      sendResponse(sendToNapplet, windowId, correlationId, [['ok', 'true']]);
      break;
    }
    case 'shell:state-clear': {
      statePersistence.clear(prefix);
      sendResponse(sendToNapplet, windowId, correlationId, [['ok', 'true']]);
      break;
    }
    case 'shell:state-keys': {
      const userKeys = statePersistence.keys(prefix);
      sendResponse(sendToNapplet, windowId, correlationId, userKeys.map(k => ['key', k]));
      break;
    }
    default:
      sendError(sendToNapplet, windowId, correlationId, `unknown state topic: ${topic}`);
      break;
  }
}

/**
 * Remove all state entries for a napp identity.
 * Used during napp cleanup when a window is closed.
 *
 * @param pubkey - The napp's pubkey
 * @param dTag - The napp's dTag
 * @param aggregateHash - The napp's build hash
 * @param statePersistence - State storage backend
 */
export function cleanupNappState(
  pubkey: string,
  dTag: string,
  aggregateHash: string,
  statePersistence: RuntimeStatePersistence,
): void {
  const prefix = `napp-state:${pubkey}:${dTag}:${aggregateHash}:`;
  statePersistence.clear(prefix);
}
