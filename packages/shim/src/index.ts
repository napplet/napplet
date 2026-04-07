// @napplet/shim — Napplet window installer
// Side-effect-only module: importing this file installs window.napplet and window.nostr globals.
// No named exports. No allow-same-origin required.

import { installKeyboardShim } from './keyboard-shim.js';
import { installNostrDb } from './nipdb-shim.js';
import { installStateShim, _setInterPaneEventSender, _nappletStorage } from './state-shim.js';
import { subscribe, publish, query } from './relay-shim.js';
import { discoverServices } from './discovery-shim.js';
import { BusKind } from './types.js';
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
 * Creates an unsigned kind 29003 event template with the given topic as a 't' tag
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

// Pending signer requests: correlation id -> resolve/reject pair
const pendingRequests = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}>();

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
 * Build and post an unsigned NIP-01 event template to the parent shell.
 */
function sendEvent(kind: number, tags: string[][], content: string = ''): void {
  const event = {
    kind,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content,
  };
  window.parent.postMessage(['EVENT', event], '*');
}

/**
 * Send a signer request as an unsigned kind 29001 event template.
 */
async function sendSignerRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
  const id = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });

    const event = {
      kind: BusKind.SIGNER_REQUEST,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['method', method],
        ['id', id],
        ...(params ? Object.entries(params).map(([k, v]) => ['param', k, JSON.stringify(v)]) : []),
      ],
      content: '',
    };
    window.parent.postMessage(['EVENT', event], '*');

    setTimeout(() => {
      if (pendingRequests.delete(id)) {
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
    case 'OK': {
      const [, eventId, success, reason] = msg;
      if (success === false && typeof eventId === 'string') {
        const pending = pendingRequests.get(eventId);
        if (pending) {
          pendingRequests.delete(eventId);
          pending.reject(new Error(typeof reason === 'string' ? reason : 'Signer request denied'));
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
    case 'EOSE':
    case 'CLOSED':
    case 'NOTICE':
      break;
  }
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

// Subscribe to signer and NIPDB responses immediately
window.parent.postMessage(['REQ', SIGNER_SUB_ID, { kinds: [BusKind.SIGNER_RESPONSE] }], '*');
window.parent.postMessage(['REQ', NIPDB_SUB_ID, { kinds: [BusKind.NIPDB_RESPONSE] }], '*');

// Install window.nostrdb NIP-DB proxy
installNostrDb();

// Install keyboard forwarding (hotkeys work when iframe has focus)
installKeyboardShim();

// Install napplet-side storage proxy (wire sender to break circular dep)
_setInterPaneEventSender(emit);
installStateShim();
