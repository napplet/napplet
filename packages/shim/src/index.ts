// @napplet/shim — Napplet SDK
// NIP-01 relay client shim for napplet iframes.
// Communicates with the ShellBridge using NIP-01 wire format over postMessage.
// Completes NIP-42 AUTH handshake and proxies window.nostr NIP-07 calls as signed events.

import { finalizeEvent } from 'nostr-tools/pure';
import { loadOrCreateKeypair } from './napp-keypair.js';
import type { NappKeypair } from './napp-keypair.js';
import { setKeyboardShimKeypair, installKeyboardShim } from './keyboard-shim.js';
import { installNostrDb } from './nipdb-shim.js';
import { installStateShim, _setInterPaneEventSender } from './state-shim.js';
import { subscribe, publish } from './relay-shim.js';
import { BusKind, AUTH_KIND, SHELL_BRIDGE_URI, PROTOCOL_VERSION } from './types.js';
import type { NostrEvent } from './types.js';

// ─── Public API exports ─────────────────────────────────────────────────────

export { subscribe, publish, query } from './relay-shim.js';
export type { Subscription, EventTemplate } from './relay-shim.js';
export type { NostrEvent, NostrFilter } from './types.js';

// State shim (napp-side localStorage proxy)
export { nappState, nappStorage } from './state-shim.js';

/**
 * Broadcast an inter-pane event to other napps via the shell.
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
export function emit(
  topic: string,
  extraTags: string[][] = [],
  content: string = '',
): void {
  sendEvent(BusKind.INTER_PANE, [['t', topic], ...extraTags], content);
}

/**
 * Subscribe to inter-pane events on a specific topic.
 *
 * Thin wrapper around subscribe() that filters by inter-pane event kind
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
export function on(
  topic: string,
  callback: (payload: unknown, event: NostrEvent) => void,
): { close(): void } {
  return subscribe(
    { kinds: [BusKind.INTER_PANE], '#t': [topic] },
    (event: NostrEvent) => {
      let payload: unknown;
      try {
        payload = event.content ? JSON.parse(event.content) : {};
      } catch {
        payload = {};
      }
      callback(payload, event);
    },
    () => { /* EOSE — no action needed for inter-pane subscriptions */ },
  );
}

let keypair: NappKeypair | null = null;

// Pending signer requests: correlation id -> resolve/reject pair
const pendingRequests = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}>();

// Promise that resolves when the keypair is ready
let _resolveKeypairReady!: () => void;
const keypairReady = new Promise<void>((resolve) => { _resolveKeypairReady = resolve; });

// Signer response subscription ID
const SIGNER_SUB_ID = '__signer__';

// NIPDB response subscription ID
const NIPDB_SUB_ID = '__nipdb__';

// ─── Napp type resolution ──────────────────────────────────────────────────────

/**
 * Determine napp type from a meta tag in the document head.
 * Falls back to 'unknown' if the meta tag is absent.
 */
function getNappType(): string {
  const meta = document.querySelector('meta[name="napplet-napp-type"]');
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

    sendEvent(BusKind.SIGNER_REQUEST, [
      ['method', method],
      ['id', id],
      ...(params ? Object.entries(params).map(([k, v]) => ['param', k, JSON.stringify(v)]) : []),
    ]);

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
    case 'AUTH': {
      const challenge = msg[1] as string;
      handleAuthChallenge(challenge);
      break;
    }
    case 'OK': {
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
    const nappType = getNappType();
    keypair = loadOrCreateKeypair(nappType);
    setKeyboardShimKeypair(keypair);
    _resolveKeypairReady();
  }

  const authEvent = finalizeEvent({
    kind: AUTH_KIND,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['relay', SHELL_BRIDGE_URI],
      ['challenge', challenge],
      ['type', getNappType()],
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

// ─── Initialize ───────────────────────────────────────────────────────────────

// Install relay message listener
window.addEventListener('message', handleRelayMessage);

// Install window.nostrdb NIP-DB proxy
installNostrDb();

// Install keyboard forwarding (hotkeys work when iframe has focus)
installKeyboardShim();

// Install napp-side storage proxy (wire sender to break circular dep)
_setInterPaneEventSender(emit);
installStateShim();

// Initialize keypair eagerly so it is ready before AUTH challenge arrives
{
  const nappType = getNappType();
  keypair = loadOrCreateKeypair(nappType);
  setKeyboardShimKeypair(keypair);
  _resolveKeypairReady();
}
