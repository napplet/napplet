// @napplet/shim -- Napplet window installer
// Side-effect-only module: importing this file installs window.napplet and window.nostr globals.
// No named exports. No allow-same-origin required.

import { installKeyboardShim } from './keyboard-shim.js';
import { installNostrDb } from './nipdb-shim.js';
import { installStateShim, _nappletStorage } from './state-shim.js';
import { subscribe, publish, query } from './relay-shim.js';
import { discoverServices } from './discovery-shim.js';
import type { NappletGlobal, NostrEvent } from '@napplet/core';
import type {
  SignerGetPublicKeyMessage,
  SignerSignEventMessage,
  SignerGetRelaysMessage,
  SignerNip04EncryptMessage,
  SignerNip04DecryptMessage,
  SignerNip44EncryptMessage,
  SignerNip44DecryptMessage,
} from '@napplet/nub-signer';
import type {
  IfcEmitMessage,
  IfcSubscribeMessage,
  IfcUnsubscribeMessage,
  IfcEventMessage,
} from '@napplet/nub-ifc';

// ─── Global type augmentation ────────────────────────────────────────────────
// Activates window.napplet TypeScript types on `import '@napplet/shim'`.

declare global {
  interface Window {
    napplet: NappletGlobal;
  }
}

// ─── IFC topic subscription registry ────────────────────────────────────────

/** Map of topic -> array of callbacks for IFC event dispatch. */
const ifcTopicHandlers = new Map<string, Array<(payload: unknown, sender: string) => void>>();

/**
 * Broadcast an IFC event to other napplets via the shell.
 *
 * Sends an `ifc.emit` envelope message to the shell for delivery
 * to matching topic subscribers.
 *
 * @param topic     The topic string (e.g., 'profile:open', 'stream:channel-switch')
 * @param extraTags Additional tags (legacy parameter -- ignored in envelope format)
 * @param content   Event content string (sent as payload)
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
  let payload: unknown;
  try {
    payload = content ? JSON.parse(content) : undefined;
  } catch {
    payload = content || undefined;
  }

  const msg: IfcEmitMessage = {
    type: 'ifc.emit',
    topic,
    ...(payload !== undefined ? { payload } : {}),
  };
  window.parent.postMessage(msg, '*');
}

/**
 * Subscribe to IFC events on a specific topic.
 *
 * Sends an `ifc.subscribe` envelope message to the shell and registers
 * a local handler for `ifc.event` messages on that topic.
 *
 * @param topic    The topic string to listen for
 * @param callback Called with `(payload, event)` for each matching event.
 *                 `payload` is the parsed content (or `{}` if unavailable).
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
  // Register local handler -- construct a synthetic NostrEvent-like wrapper
  // from IFC envelope for backward compatibility with the window.napplet type
  const handler = (payload: unknown, sender: string) => {
    const syntheticEvent: NostrEvent = {
      id: '',
      pubkey: sender,
      created_at: Math.floor(Date.now() / 1000),
      kind: 0,
      tags: [['t', topic]],
      content: typeof payload === 'string' ? payload : JSON.stringify(payload ?? {}),
      sig: '',
    };
    callback(payload, syntheticEvent);
  };
  if (!ifcTopicHandlers.has(topic)) {
    ifcTopicHandlers.set(topic, []);
  }
  ifcTopicHandlers.get(topic)!.push(handler);

  // Send subscription request to shell
  const subscribeMsg: IfcSubscribeMessage = {
    type: 'ifc.subscribe',
    id: crypto.randomUUID(),
    topic,
  };
  window.parent.postMessage(subscribeMsg, '*');

  return {
    close(): void {
      // Remove local handler
      const handlers = ifcTopicHandlers.get(topic);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
        if (handlers.length === 0) ifcTopicHandlers.delete(topic);
      }

      // Send unsubscribe to shell
      const unsubMsg: IfcUnsubscribeMessage = {
        type: 'ifc.unsubscribe',
        topic,
      };
      window.parent.postMessage(unsubMsg, '*');
    },
  };
}

// ─── Pending signer requests ────────────────────────────────────────────────

const pendingRequests = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}>();

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

// ─── Signer request helper ──────────────────────────────────────────────────

/**
 * Send a signer request as a typed signer.* envelope message.
 */
async function sendSignerRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
  const id = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });

    // Build typed signer message based on method
    let msg: SignerGetPublicKeyMessage | SignerSignEventMessage | SignerGetRelaysMessage |
      SignerNip04EncryptMessage | SignerNip04DecryptMessage |
      SignerNip44EncryptMessage | SignerNip44DecryptMessage;

    switch (method) {
      case 'getPublicKey':
        msg = { type: 'signer.getPublicKey', id };
        break;
      case 'signEvent':
        msg = { type: 'signer.signEvent', id, event: params!.event as import('@napplet/core').EventTemplate };
        break;
      case 'getRelays':
        msg = { type: 'signer.getRelays', id };
        break;
      case 'nip04.encrypt':
        msg = { type: 'signer.nip04.encrypt', id, pubkey: params!.pubkey as string, plaintext: params!.plaintext as string };
        break;
      case 'nip04.decrypt':
        msg = { type: 'signer.nip04.decrypt', id, pubkey: params!.pubkey as string, ciphertext: params!.ciphertext as string };
        break;
      case 'nip44.encrypt':
        msg = { type: 'signer.nip44.encrypt', id, pubkey: params!.pubkey as string, plaintext: params!.plaintext as string };
        break;
      case 'nip44.decrypt':
        msg = { type: 'signer.nip44.decrypt', id, pubkey: params!.pubkey as string, ciphertext: params!.ciphertext as string };
        break;
      default:
        reject(new Error(`Unknown signer method: ${method}`));
        return;
    }

    window.parent.postMessage(msg, '*');

    setTimeout(() => {
      if (pendingRequests.delete(id)) {
        reject(new Error('Signer request timed out'));
      }
    }, 30_000);
  });
}

// ─── Signer response handler ──────────────────────────────────────────────────

/**
 * Handle signer.*.result envelope messages.
 * Extracts the result field from the type-specific response.
 */
function handleSignerResponse(msg: { type: string; id: string; error?: string; [key: string]: unknown }): void {
  const pending = pendingRequests.get(msg.id);
  if (!pending) return;

  pendingRequests.delete(msg.id);

  if (msg.error) {
    pending.reject(new Error(msg.error));
    return;
  }

  // Extract the result value based on the message type
  const type = msg.type;
  if (type === 'signer.getPublicKey.result') {
    pending.resolve(msg.pubkey);
  } else if (type === 'signer.signEvent.result') {
    pending.resolve(msg.event);
  } else if (type === 'signer.getRelays.result') {
    pending.resolve(msg.relays);
  } else if (type === 'signer.nip04.encrypt.result' || type === 'signer.nip44.encrypt.result') {
    pending.resolve(msg.ciphertext);
  } else if (type === 'signer.nip04.decrypt.result' || type === 'signer.nip44.decrypt.result') {
    pending.resolve(msg.plaintext);
  } else {
    // Generic fallback: resolve with undefined
    pending.resolve(undefined);
  }
}

// ─── Central envelope message handler ───────────────────────────────────────

/**
 * Central message handler for JSON envelope messages from the shell.
 * Routes messages to appropriate handlers based on type prefix.
 */
function handleEnvelopeMessage(event: MessageEvent): void {
  if (event.source !== window.parent) return;
  const msg = event.data;
  if (typeof msg !== 'object' || msg === null || typeof msg.type !== 'string') return;

  const type = msg.type as string;

  // Route signer result messages
  if (type.startsWith('signer.') && type.endsWith('.result')) {
    handleSignerResponse(msg as { type: string; id: string; error?: string; [key: string]: unknown });
    return;
  }

  // Route IFC event messages to topic handlers
  if (type === 'ifc.event') {
    const ifcMsg = msg as IfcEventMessage;
    const handlers = ifcTopicHandlers.get(ifcMsg.topic);
    if (handlers) {
      const payload = ifcMsg.payload ?? {};
      const sender = ifcMsg.sender ?? '';
      for (const handler of handlers) {
        handler(payload, sender);
      }
    }
    return;
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
  shell: {
    supports(_capability: string): boolean {
      // TODO: Shell populates supported capabilities at iframe creation
      return false;
    },
  },
};

// ─── Initialize ───────────────────────────────────────────────────────────────

// Install central envelope message listener
window.addEventListener('message', handleEnvelopeMessage);

// Install window.nostrdb NIP-DB proxy
installNostrDb();

// Install keyboard forwarding (hotkeys work when iframe has focus)
installKeyboardShim();

// Install napplet-side storage proxy
installStateShim();
