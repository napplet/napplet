// @napplet/shim — Napplet window installer
// Side-effect-only module: importing this file installs window.napplet and window.nostr globals.
// No named exports. No allow-same-origin required.

import { finalizeEvent } from 'nostr-tools/pure';
import { createEphemeralKeypair } from './napplet-keypair.js';
import type { NappletKeypair } from './napplet-keypair.js';
import { setKeyboardShimKeypair, installKeyboardShim } from './keyboard-shim.js';
import { installNostrDb } from './nipdb-shim.js';
import { installStateShim, _setInterPaneEventSender, _nappletStorage } from './state-shim.js';
import { subscribe, publish, query } from './relay-shim.js';
import { discoverServices } from './discovery-shim.js';
import { BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION, VERB_REGISTER, VERB_IDENTITY } from './types.js';
import { hexToBytes } from 'nostr-tools/utils';
import type { NostrEvent, NappletGlobal } from '@napplet/core';

// ─── Global type augmentation ────────────────────────────────────────────────
// Activates window.napplet TypeScript types on `import '@napplet/shim'`.

declare global {
  interface Window {
    napplet: NappletGlobal;
  }
}

/**
 * Broadcast an IPC-PEER event to other napplets via the shell.
 *
 * Creates a signed kind 29003 event with the given topic as a 't' tag
 * and posts it to the ShellBridge for delivery to matching subscribers.
 *
 * @param topic     The 't' tag value (e.g., 'profile:open', 'stream:channel-switch')
 * @param extraTags Additional NIP-01 tags beyond the 't' tag (default: [])
 * @param content   Event content (default: empty string)
 *
 * @example
 * ```ts
 * emit('profile:open', [], JSON.stringify({ pubkey: '...' }));
 * ```
 */
function emit(
  topic: string,
  extraTags: string[][] = [],
  content: string = '',
): void {
  sendEvent(BusKind.IPC_PEER, [['t', topic], ...extraTags], content);
}

/**
 * Subscribe to IPC-PEER events on a specific topic.
 *
 * Thin wrapper around subscribe() that filters by IPC-PEER event kind
 * and topic tag, then parses event content as JSON.
 *
 * @param topic    The 't' tag value to listen for
 * @param callback Called with `(payload, event)` for each matching event.
 *                 `payload` is the JSON-parsed content (or `{}` if parsing fails).
 * @returns Object with `close()` method to unsubscribe
 *
 * @example
 * ```ts
 * const sub = on('profile:open', (payload) => {
 *   console.log('Profile requested:', payload.pubkey);
 * });
 * // Later: sub.close();
 * ```
 */
function on(
  topic: string,
  callback: (payload: unknown, event: NostrEvent) => void,
): { close(): void } {
  return subscribe(
    { kinds: [BusKind.IPC_PEER], '#t': [topic] },
    (event: NostrEvent) => {
      let payload: unknown;
      try {
        payload = event.content ? JSON.parse(event.content) : {};
      } catch {
        payload = {};
      }
      callback(payload, event);
    },
    () => { /* EOSE — no action needed for IPC-PEER subscriptions */ },
  );
}

let keypair: NappletKeypair | null = null;

// Pending signer requests: correlation id -> resolve/reject pair
const pendingRequests = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}>();
const pendingSignerRequestEvents = new Map<string, string>();

// Promise that resolves when the keypair is ready
let _resolveKeypairReady!: () => void;
const keypairReady = new Promise<void>((resolve) => { _resolveKeypairReady = resolve; });

// Signer response subscription ID
const SIGNER_SUB_ID = '__signer__';

// NIPDB response subscription ID
const NIPDB_SUB_ID = '__nipdb__';

// ─── Napplet type resolution ──────────────────────────────────────────────────────

/**
 * Determine napplet type from a meta tag in the document head.
 * Falls back to 'unknown' if the meta tag is absent.
 */
function getNappletType(): string {
  // Try new canonical attribute first; fall back to old name for backward compat
  const meta = document.querySelector('meta[name="napplet-type"]')
    ?? document.querySelector('meta[name="napplet-napp-type"]');
  return meta?.getAttribute('content') ?? 'unknown';
}

// ─── Outbound helpers ─────────────────────────────────────────────────────────

/**
 * Finalize and post a signed NIP-01 event to the parent shell.
 */
function sendEvent(kind: number, tags: string[][], content: string = ''): NostrEvent | null {
  if (!keypair) return null;
  const event = finalizeEvent({
    kind,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content,
  }, keypair.privkey);
  window.parent.postMessage(['EVENT', event], '*');
  return event;
}

/**
 * Send a signer request as a signed kind 29001 event.
 */
async function sendSignerRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
  await keypairReady;

  const id = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });

    const requestEvent = sendEvent(BusKind.SIGNER_REQUEST, [
      ['method', method],
      ['id', id],
      ...(params ? Object.entries(params).map(([k, v]) => ['param', k, JSON.stringify(v)]) : []),
    ]);
    if (requestEvent) pendingSignerRequestEvents.set(requestEvent.id, id);

    setTimeout(() => {
      if (pendingRequests.delete(id)) {
        for (const [eventId, correlationId] of pendingSignerRequestEvents.entries()) {
          if (correlationId === id) pendingSignerRequestEvents.delete(eventId);
        }
        reject(new Error('Signer request timed out'));
      }
    }, 30_000);
  });
}

// ─── Inbound message handler ──────────────────────────────────────────────────

function handleRelayMessage(event: MessageEvent): void {
  if (event.source !== window.parent) return;
  const msg = event.data;
  if (!Array.isArray(msg) || msg.length < 2) return;

  const [verb] = msg;

  switch (verb) {
    case 'AUTH': {
      const challenge = msg[1] as string;
      handleAuthChallenge(challenge);
      break;
    }
    case 'OK': {
      const [, eventId, success, reason] = msg;
      if (success === false && typeof eventId === 'string') {
        const correlationId = pendingSignerRequestEvents.get(eventId);
        if (correlationId) {
          pendingSignerRequestEvents.delete(eventId);
          const pending = pendingRequests.get(correlationId);
          if (pending) {
            pendingRequests.delete(correlationId);
            pending.reject(new Error(typeof reason === 'string' ? reason : 'Signer request denied'));
          }
        }
      }
      break;
    }
    case 'EVENT': {
      const [, subId, nostrEvent] = msg;
      if (subId === SIGNER_SUB_ID) {
        handleSignerResponse(nostrEvent as NostrEvent);
      }
      break;
    }
    case VERB_IDENTITY: {
      const payload = msg[1] as { pubkey: string; privkey: string; dTag: string; aggregateHash: string } | undefined;
      if (!payload || typeof payload !== 'object' || !payload.privkey || !payload.pubkey) {
        break;
      }
      // Accept the shell-delegated keypair
      keypair = {
        privkey: hexToBytes(payload.privkey),
        pubkey: payload.pubkey,
      };
      setKeyboardShimKeypair(keypair);
      _resolveKeypairReady();
      break;
    }
    case 'EOSE':
    case 'CLOSED':
    case 'NOTICE':
      break;
  }
}

// ─── Aggregate hash resolution ────────────────────────────────────────────────

/**
 * Read the napp's NIP-5A aggregate hash from a meta tag in the document head.
 */
function getAggregateHash(): string {
  const meta = document.querySelector('meta[name="napplet-aggregate-hash"]');
  return meta?.getAttribute('content') ?? '';
}

// ─── NIP-42 AUTH handshake ────────────────────────────────────────────────────

function handleAuthChallenge(challenge: string): void {
  if (!keypair) {
    // Fallback: if IDENTITY was not received (legacy shell or dev mode),
    // create an ephemeral keypair as before
    keypair = createEphemeralKeypair();
    setKeyboardShimKeypair(keypair);
    _resolveKeypairReady();
  }

  const authEvent = finalizeEvent({
    kind: AUTH_KIND,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['relay', SHELL_BRIDGE_URI],
      ['challenge', challenge],
      ['type', getNappletType()],
      ['version', PROTOCOL_VERSION],
      ['aggregateHash', getAggregateHash()],
    ],
    content: '',
  }, keypair.privkey);

  window.parent.postMessage(['AUTH', authEvent], '*');

  window.parent.postMessage(['REQ', SIGNER_SUB_ID, { kinds: [BusKind.SIGNER_RESPONSE] }], '*');
  window.parent.postMessage(['REQ', NIPDB_SUB_ID, { kinds: [BusKind.NIPDB_RESPONSE] }], '*');
}

// ─── Signer response handler ──────────────────────────────────────────────────

function handleSignerResponse(event: NostrEvent): void {
  const idTag = event.tags.find(t => t[0] === 'id');
  if (!idTag) return;

  const correlationId = idTag[1];
  if (!correlationId) return;
  const pending = pendingRequests.get(correlationId);
  if (!pending) return;

  pendingRequests.delete(correlationId);
  for (const [eventId, id] of pendingSignerRequestEvents.entries()) {
    if (id === correlationId) pendingSignerRequestEvents.delete(eventId);
  }

  const errorTag = event.tags.find(t => t[0] === 'error');
  if (errorTag) {
    pending.reject(new Error(errorTag[1]));
    return;
  }

  const resultTag = event.tags.find(t => t[0] === 'result');
  try {
    const raw = resultTag?.[1] ?? event.content;
    const result = raw ? JSON.parse(raw) : undefined;
    pending.resolve(result);
  } catch {
    pending.resolve(undefined);
  }
}

// ─── window.nostr NIP-07 installation ────────────────────────────────────────

(window as unknown as { nostr: unknown }).nostr = {
  async getPublicKey(): Promise<string> {
    return sendSignerRequest('getPublicKey') as Promise<string>;
  },

  async signEvent(event: object): Promise<object> {
    return sendSignerRequest('signEvent', { event }) as Promise<object>;
  },

  async getRelays(): Promise<Record<string, object>> {
    return sendSignerRequest('getRelays') as Promise<Record<string, object>>;
  },

  nip04: {
    async encrypt(pubkey: string, plaintext: string): Promise<string> {
      return sendSignerRequest('nip04.encrypt', { pubkey, plaintext }) as Promise<string>;
    },
    async decrypt(pubkey: string, ciphertext: string): Promise<string> {
      return sendSignerRequest('nip04.decrypt', { pubkey, ciphertext }) as Promise<string>;
    },
  },

  nip44: {
    async encrypt(pubkey: string, plaintext: string): Promise<string> {
      return sendSignerRequest('nip44.encrypt', { pubkey, plaintext }) as Promise<string>;
    },
    async decrypt(pubkey: string, ciphertext: string): Promise<string> {
      return sendSignerRequest('nip44.decrypt', { pubkey, ciphertext }) as Promise<string>;
    },
  },
};

// ─── window.napplet global installation ──────────────────────────────────────

(window as unknown as { napplet: NappletGlobal }).napplet = {
  relay: {
    subscribe,
    publish,
    query,
  },
  ipc: {
    emit,
    on,
  },
  services: {
    list: discoverServices,
    has: async (name: string, version?: string): Promise<boolean> => {
      const services = await discoverServices();
      if (version !== undefined) {
        return services.some(s => s.name === name && s.version === version);
      }
      return services.some(s => s.name === name);
    },
  },
  storage: {
    getItem: _nappletStorage.getItem.bind(_nappletStorage),
    setItem: _nappletStorage.setItem.bind(_nappletStorage),
    removeItem: _nappletStorage.removeItem.bind(_nappletStorage),
    keys: _nappletStorage.keys.bind(_nappletStorage),
  },
};

// ─── Initialize ───────────────────────────────────────────────────────────────

// Install relay message listener
window.addEventListener('message', handleRelayMessage);

// Install window.nostrdb NIP-DB proxy
installNostrDb();

// Install keyboard forwarding (hotkeys work when iframe has focus)
installKeyboardShim();

// Install napplet-side storage proxy (wire sender to break circular dep)
_setInterPaneEventSender(emit);
installStateShim();

// Send REGISTER to shell — the shell will respond with IDENTITY (delegated keypair)
// then send AUTH challenge. Keypair is NOT created locally.
{
  const dTag = getNappletType();
  const claimedHash = getAggregateHash();
  window.parent.postMessage([VERB_REGISTER, { dTag, claimedHash }], '*');
}
